// DecklingAir server — runs locally on the PC it controls. Serves the web UI, controls
// VoiceMeeter in-process (voicemeeter.js), runs desktop shortcuts in-process
// (desktopActions.js), and persists the grid layout. Other devices on the LAN connect
// to this PC's IP on PORT; there is no separate bridge process or hub machine.
//
// UNVERIFIED ON REAL HARDWARE — see voicemeeter.js and desktopActions.js for why.
const express = require('express');
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { Server: SocketIOServer } = require('socket.io');
const { VoiceMeeterRemote } = require('./voicemeeter');
const desktopActions = require('./desktopActions');
const { startTray } = require('./tray');

const PORT = process.env.PORT || 3002;
const POLL_MS = Number(process.env.VM_POLL_MS) || 50;
const DATA_DIR = path.join(__dirname, 'data');
const LAYOUT_FILE = path.join(DATA_DIR, 'layout.json');

const DEFAULT_LAYOUT = {
  pages: [{ id: 'main', name: 'Main', controls: [] }],
};

fs.mkdirSync(DATA_DIR, { recursive: true });
let layout = loadLayout();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, 'public')));

// ── VoiceMeeter — in-process, this machine only ─────────────────────────────────────
const vm = new VoiceMeeterRemote();
let vmConnected = false;
let vmRetryTicks = 0;
let vmState = {};
let vmLevels = [];

function vmStatus() {
  return {
    connected: vmConnected,
    type: vmConnected ? vm.getType() : null,
    version: vmConnected ? vm.getVersion() : null,
  };
}

function attemptVmLogin() {
  const result = vm.login();
  if (result >= 0) {
    vmConnected = true;
    console.log(`[voicemeeter] connected (login code ${result})`);
    try {
      vmState = vm.getAllParams();
      io.emit('vm:state', vmState);
    } catch (err) {
      console.error('[voicemeeter] initial getAllParams failed:', err.message);
    }
    io.emit('vm:status', vmStatus());
  } else {
    vmRetryTicks = Math.round(5000 / POLL_MS);
  }
}

function startVoiceMeeter() {
  if (process.platform !== 'win32') {
    console.warn(`[voicemeeter] Windows-only (this is ${process.platform}) — VoiceMeeter control disabled, desktop shortcuts still work`);
    return;
  }

  if (!vm.initialize()) {
    console.warn('[voicemeeter] DLL not found — is VoiceMeeter installed? Restart the server once it is.');
    return;
  }

  attemptVmLogin();

  setInterval(() => {
    if (!vmConnected) {
      if (vmRetryTicks <= 0) attemptVmLogin();
      else vmRetryTicks -= 1;
      return;
    }

    try {
      if (vm.isDirty()) {
        vmState = vm.getAllParams();
        io.emit('vm:state', vmState);
      }
      vmLevels = vm.getAllLevels();
      io.emit('vm:levels', vmLevels);
    } catch (err) {
      console.error('[voicemeeter] poll error:', err.message);
      vmConnected = false;
      vmRetryTicks = Math.round(5000 / POLL_MS);
      io.emit('vm:status', vmStatus());
      io.emit('error', { message: 'VoiceMeeter connection lost, retrying…' });
    }
  }, POLL_MS);
}

// ── Socket.IO — see client/src/lib/socket.ts for the typed client side of this ──────
io.on('connection', (socket) => {
  socket.emit('layout:data', layout);
  socket.emit('vm:status', vmStatus());
  if (Object.keys(vmState).length) socket.emit('vm:state', vmState);
  if (vmLevels.length) socket.emit('vm:levels', vmLevels);

  socket.on('vm:set', ({ param, value } = {}) => {
    if (!vmConnected || typeof param !== 'string') return;
    try {
      vm.setFloat(param, value);
      vmState[param] = value;
      io.emit('vm:update', { param, value });
    } catch (err) {
      console.error('[voicemeeter] setFloat failed:', err.message);
    }
  });

  socket.on('vm:macro', ({ params } = {}) => {
    if (!vmConnected || !Array.isArray(params)) return;
    const applied = [];
    for (const { param, value } of params) {
      if (typeof param !== 'string') continue;
      try {
        vm.setFloat(param, value);
        vmState[param] = value;
        applied.push({ param, value });
      } catch (err) {
        console.error('[voicemeeter] macro setFloat failed:', err.message);
      }
    }
    if (applied.length) io.emit('vm:state_patch', applied);
  });

  socket.on('desktop:action', (action) => {
    desktopActions.runDesktopAction(action).catch((err) => {
      socket.emit('error', { message: `Desktop action failed: ${err.message}` });
    });
  });

  socket.on('desktop:icon_request', ({ target } = {}) => {
    const resolvedTarget = typeof target === 'string' ? target.trim() : '';
    if (!resolvedTarget) return;
    desktopActions.resolveDesktopIcon(resolvedTarget).then((icon) => {
      if (icon) io.emit('desktop:icon', { target: resolvedTarget, icon });
    });
  });

  socket.on('layout:save', (nextLayout) => {
    if (nextLayout && typeof nextLayout === 'object') {
      layout = nextLayout;
      saveLayout();
      io.emit('layout:data', layout);
    }
  });

  socket.on('layout:get', () => socket.emit('layout:data', layout));
});

startVoiceMeeter();

server.listen(PORT, '0.0.0.0', () => {
  const lanAddresses = Object.values(os.networkInterfaces())
    .flat()
    .filter((n) => n && n.family === 'IPv4' && !n.internal)
    .map((n) => n.address);

  console.log('\nDecklingAir server');
  console.log(`  http://localhost:${PORT}  (this PC)`);
  lanAddresses.forEach((addr) => console.log(`  http://${addr}:${PORT}  (from other devices on this network)`));
  console.log('');

  startTray({ port: PORT }).catch((err) => {
    console.warn('[tray] failed to start, continuing without one:', err.message);
  });
});

function loadLayout() {
  try {
    if (fs.existsSync(LAYOUT_FILE)) return JSON.parse(fs.readFileSync(LAYOUT_FILE, 'utf8'));
  } catch (err) {
    console.error('[layout] failed to load, starting fresh:', err.message);
  }
  return structuredClone(DEFAULT_LAYOUT);
}

function saveLayout() {
  try {
    fs.writeFileSync(LAYOUT_FILE, JSON.stringify(layout, null, 2));
  } catch (err) {
    console.error('[layout] failed to save:', err.message);
  }
}
