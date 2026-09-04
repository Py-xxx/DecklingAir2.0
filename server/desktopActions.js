// Node port of bridge/bridge.py's OS-level actions (everything that isn't VoiceMeeter
// itself): media keys, key combos, lock/sleep, launching apps/URLs, screenshots, and
// desktop-icon resolution for the shortcut cards.
//
// UNVERIFIED ON REAL HARDWARE — same caveat as voicemeeter.js. The `keybd_event`/
// `LockWorkStation` koffi bindings are the one part of this file that's DLL-signature-
// sensitive; everything else (child_process, fs) is plain Node and should just work.
//
// NOT PORTED YET: the soundboard (bridge.py's `sounddevice` + `miniaudio`-based audio
// playback). Python had off-the-shelf bindings for both device enumeration and decode;
// Node's equivalents are rougher (native modules or an ffmpeg dependency) and this
// needs its own decision — see the project plan. `getOutputDevices()` below returns an
// empty list in the meantime so the Soundboard card degrades to "no devices" instead of
// crashing, and `playSound`/`stopAllSounds` throw a clear "not implemented" error.
const koffi = require('koffi');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, execFile } = require('child_process');

// Loaded lazily, once, only on Windows — `require('./desktopActions')` must stay safe
// on macOS/Linux (dev machine, or a non-Windows hub in the older multi-device setup)
// rather than crashing the whole server the moment this module is imported.
let _win32 = null;
function win32() {
  if (process.platform !== 'win32') {
    throw new Error('This action is only available when the server runs on Windows');
  }
  if (_win32) return _win32;

  const user32 = koffi.load('user32.dll');
  const kernel32 = koffi.load('kernel32.dll');
  _win32 = {
    keybd_event: user32.func('void __stdcall keybd_event(uint8 bVk, uint8 bScan, uint32 dwFlags, void *dwExtraInfo)'),
    LockWorkStation: user32.func('bool __stdcall LockWorkStation()'),
    GetLogicalDrives: kernel32.func('uint32 __stdcall GetLogicalDrives()'),
  };
  return _win32;
}

const KEYEVENTF_KEYUP = 0x0002;

const SCREENSHOT_DIR = path.join(os.homedir(), 'Pictures', 'VM Control Screenshots');

const VK_CODES = {
  ctrl: 0x11, control: 0x11, shift: 0x10, alt: 0x12,
  win: 0x5b, windows: 0x5b, cmd: 0x5b, meta: 0x5b,
  enter: 0x0d, return: 0x0d, space: 0x20, tab: 0x09,
  esc: 0x1b, escape: 0x1b,
  up: 0x26, down: 0x28, left: 0x25, right: 0x27,
  delete: 0x2e, del: 0x2e, backspace: 0x08,
  home: 0x24, end: 0x23, pageup: 0x21, pagedown: 0x22, insert: 0x2d,
};

const MEDIA_KEYS = {
  media_play_pause: 0xb3,
  media_next: 0xb0,
  media_previous: 0xb1,
  volume_up: 0xaf,
  volume_down: 0xae,
  volume_mute: 0xad,
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendVirtualKey(vkCode) {
  const { keybd_event } = win32();
  keybd_event(vkCode, 0, 0, null);
  await sleep(30);
  keybd_event(vkCode, 0, KEYEVENTF_KEYUP, null);
}

function parseKeyToken(token) {
  token = token.trim().toLowerCase();
  if (!token) return null;
  if (token in VK_CODES) return VK_CODES[token];
  if (token.length === 1 && token >= 'a' && token <= 'z') return token.toUpperCase().charCodeAt(0);
  if (token.length === 1 && token >= '0' && token <= '9') return token.charCodeAt(0);
  const fMatch = /^f(\d+)$/.exec(token);
  if (fMatch) {
    const idx = parseInt(fMatch[1], 10);
    if (idx >= 1 && idx <= 24) return 0x70 + idx - 1;
  }
  return null;
}

async function sendKeyCombo(combo) {
  const { keybd_event } = win32();
  const tokens = combo.replace(/\s+/g, '').split('+').map((t) => t.trim()).filter(Boolean);
  const codes = tokens.map(parseKeyToken);
  if (!codes.length || codes.some((c) => c === null)) {
    throw new Error(`Unsupported key combo: ${combo}`);
  }

  for (const code of codes.slice(0, -1)) {
    keybd_event(code, 0, 0, null);
    await sleep(20);
  }

  const last = codes[codes.length - 1];
  keybd_event(last, 0, 0, null);
  await sleep(30);
  keybd_event(last, 0, KEYEVENTF_KEYUP, null);

  for (const code of codes.slice(0, -1).reverse()) {
    await sleep(20);
    keybd_event(code, 0, KEYEVENTF_KEYUP, null);
  }
}

async function captureScreenshot() {
  // screenshot-desktop shells out to a small bundled per-OS tool — no native compile,
  // and it captures all displays on Windows the same way ImageGrab(all_screens=True) did.
  const screenshot = require('screenshot-desktop');
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
  const outPath = path.join(SCREENSHOT_DIR, `vm-control-${stamp}.png`);
  await screenshot({ filename: outPath });
  return outPath;
}

function launchTarget(target, args = '') {
  target = (target || '').trim();
  if (!target) throw new Error('No launch target provided');

  if (/^https?:\/\//i.test(target)) {
    return openUrl(target);
  }

  // `shell: true` lets Windows' own quoting/PATH/file-association rules apply, the same
  // way os.startfile() deferred to ShellExecute — including opening a target by its
  // associated app when it isn't an .exe.
  const command = args ? `${target} ${args}` : target;
  const child = spawn(command, { shell: true, detached: true, stdio: 'ignore' });
  child.unref();
}

function openUrl(url) {
  const child = spawn(`start "" "${url}"`, { shell: true, detached: true, stdio: 'ignore' });
  child.unref();
}

async function runDesktopAction(actionData) {
  const { action = '', target = '', args = '' } = actionData || {};

  if (action === 'launch') return launchTarget(target, args);
  if (action === 'open_url') return openUrl(target);
  if (action === 'screenshot') {
    const savedPath = await captureScreenshot();
    console.log(`[desktop] screenshot saved to ${savedPath}`);
    return;
  }
  if (action in MEDIA_KEYS) return sendVirtualKey(MEDIA_KEYS[action]);
  if (action === 'lock') return void win32().LockWorkStation();
  if (action === 'sleep') {
    spawn('rundll32.exe', ['powrprof.dll,SetSuspendState', '0,1,0'], { detached: true, stdio: 'ignore' }).unref();
    return;
  }
  if (action === 'key_combo') return sendKeyCombo(target);

  throw new Error(`Unsupported desktop action: ${action}`);
}

// ── Desktop icon resolution — same PowerShell/.NET trick as bridge.py, ported as-is
// since it was already shelling out regardless of host language. ──
function resolveDesktopIcon(target) {
  target = (target || '').trim();
  if (!target) return Promise.resolve(null);

  const psScript = `
Add-Type -AssemblyName System.Drawing
$target = $args[0]
if (-not (Test-Path -LiteralPath $target)) { exit 0 }
$icon = [System.Drawing.Icon]::ExtractAssociatedIcon((Resolve-Path -LiteralPath $target))
if ($null -eq $icon) { exit 0 }
$bitmap = $icon.ToBitmap()
$stream = New-Object System.IO.MemoryStream
$bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
[Convert]::ToBase64String($stream.ToArray())
`.trim();

  return new Promise((resolve) => {
    execFile(
      'powershell',
      ['-NoProfile', '-Command', psScript, target],
      { timeout: 12000, windowsHide: true },
      (err, stdout) => {
        if (err) {
          console.warn(`[desktop] icon resolve failed for ${target}:`, err.message);
          resolve(null);
          return;
        }
        const base64 = (stdout || '').trim();
        resolve(base64 ? `data:image/png;base64,${base64}` : null);
      },
    );
  });
}

// ── Filesystem browsing for the soundboard file picker — plain Node fs, no ctypes
// needed (the Python version used a raw kernel32 call only to enumerate drive letters). ──
const AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.flac', '.ogg', '.aac', '.m4a', '.opus', '.wma']);

function getDriveRoots() {
  try {
    const bitmask = win32().GetLogicalDrives();
    const roots = [];
    for (let i = 0; i < 26; i++) {
      if (bitmask & (1 << i)) roots.push(`${String.fromCharCode(65 + i)}:\\`);
    }
    return roots.length ? roots : ['C:\\'];
  } catch {
    return ['C:\\'];
  }
}

function browseDirectory(dirPath) {
  dirPath = (dirPath || '').trim();
  if (!dirPath || !fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    return { path: dirPath, parent: null, entries: [], error: 'Directory not found' };
  }

  let raw;
  try {
    raw = fs.readdirSync(dirPath);
  } catch (err) {
    return { path: dirPath, parent: path.dirname(dirPath), entries: [], error: err.message };
  }

  const dirs = [];
  const files = [];
  for (const name of raw) {
    const full = path.join(dirPath, name);
    try {
      if (fs.statSync(full).isDirectory()) {
        dirs.push({ name, isDir: true, ext: '' });
      } else {
        const ext = path.extname(name).toLowerCase();
        if (AUDIO_EXTENSIONS.has(ext)) files.push({ name, isDir: false, ext });
      }
    } catch { /* unreadable entry (permissions, broken link) — skip it */ }
  }

  dirs.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
  files.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

  const parentPath = path.dirname(dirPath);
  const parent = parentPath === dirPath ? null : parentPath; // drive root has itself as its own parent

  return { path: dirPath, parent, entries: [...dirs, ...files] };
}

// ── Soundboard — NOT PORTED. See file header. ──
function getOutputDevices() {
  return [];
}

function playSound() {
  throw new Error('Soundboard playback is not yet implemented for the merged local device');
}

function stopAllSounds() {
  /* no-op until soundboard playback is ported */
}

module.exports = {
  runDesktopAction,
  resolveDesktopIcon,
  getDriveRoots,
  browseDirectory,
  getOutputDevices,
  playSound,
  stopAllSounds,
};
