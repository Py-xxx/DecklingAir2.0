// System tray icon — no Electron. The app's own UI is a web page meant to be viewed from
// other devices; the PC itself only needs a tray icon with a few actions, same as the
// reference app's pystray-based tray. `systray2` gives that without pulling in a whole
// Chromium/Electron runtime for it.
//
// UNVERIFIED ON REAL HARDWARE, same as voicemeeter.js/desktopActions.js/trayIcon.js. If
// systray2's precompiled binary doesn't run under a packaged (pkg) exe, this degrades to
// "no tray icon" rather than crashing the server — see the try/catch below.
const fs = require('fs');
const { spawn } = require('child_process');
const { ensureTrayIcon } = require('./trayIcon');
const { isStartupEnabled, setStartupEnabled } = require('./startup');

const MENU_OPEN = 0;
const MENU_STARTUP = 1;
const MENU_QUIT = 2;

async function startTray({ port }) {
  if (process.platform !== 'win32') {
    console.log('[tray] skipped — only wired up for Windows right now');
    return null;
  }

  let SysTray;
  try {
    // eslint-disable-next-line global-require
    const mod = require('systray2');
    SysTray = mod.default || mod;
  } catch (err) {
    console.warn('[tray] systray2 unavailable, running without a tray icon:', err.message);
    return null;
  }

  let icoPath;
  try {
    icoPath = await ensureTrayIcon();
  } catch (err) {
    console.warn('[tray] failed to generate tray icon, running without one:', err.message);
    return null;
  }

  const iconBase64 = fs.readFileSync(icoPath).toString('base64');

  const systray = new SysTray({
    menu: {
      icon: iconBase64,
      title: 'DecklingAir',
      tooltip: `DecklingAir — http://localhost:${port}`,
      items: [
        { title: 'Open DecklingAir', tooltip: `http://localhost:${port}`, checked: false, enabled: true },
        { title: 'Start with Windows', tooltip: '', checked: isStartupEnabled(), enabled: true },
        { title: 'Quit', tooltip: '', checked: false, enabled: true },
      ],
    },
    debug: false,
    copyDir: true,
  });

  systray.onClick((action) => {
    if (action.seq_id === MENU_OPEN) {
      spawn(`start "" "http://localhost:${port}"`, { shell: true, detached: true, stdio: 'ignore' }).unref();
      return;
    }

    if (action.seq_id === MENU_STARTUP) {
      const next = !action.item.checked;
      setStartupEnabled(next);
      systray.sendAction({ type: 'update-item', item: { ...action.item, checked: next }, seq_id: action.seq_id });
      return;
    }

    if (action.seq_id === MENU_QUIT) {
      systray.kill();
      process.exit(0);
    }
  });

  return systray;
}

module.exports = { startTray };
