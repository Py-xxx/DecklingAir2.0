// Generates the tray icon once and caches it, so the repo doesn't need a binary .ico
// asset checked in (this tool can't author binary files) and packaging doesn't need an
// image pipeline. Pure JS: pngjs draws a tiny bitmap, png-to-ico wraps it as a real
// .ico — Windows tray icons must be .ico, not .png.
//
// UNVERIFIED ON REAL HARDWARE, same as voicemeeter.js/desktopActions.js.
const fs = require('fs');
const path = require('path');
const os = require('os');
const { PNG } = require('pngjs');
// png-to-ico ships as an ESM-only package ("type": "module") — the rest of this server
// is CommonJS, so it can't be `require()`'d directly. A dynamic import() from CJS works
// fine for consuming an ESM dependency; it just has to be awaited inside an async
// function rather than required at the top of the file.
async function loadPngToIco() {
  const mod = await import('png-to-ico');
  return mod.default;
}

// Written to the OS temp dir, not next to this file — when packaged with pkg, this
// module's own directory lives inside a read-only virtual filesystem, so anything we
// generate at runtime has to go somewhere real and writable.
const CACHE_DIR = path.join(os.tmpdir(), 'decklingair-tray');
const PNG_PATH = path.join(CACHE_DIR, 'icon.png');
const ICO_PATH = path.join(CACHE_DIR, 'icon.ico');

const SIZE = 32;
// --color-accent-blue from .claude/design/ELEMENTS.md — "routing / informational", the
// closest existing meaning to a plain app icon.
const ACCENT = { r: 0x4a, g: 0x9e, b: 0xff };

function drawIconPng() {
  const png = new PNG({ width: SIZE, height: SIZE });
  // Three vertical bars, same shape as the reference app's tray icon (three mixer-style
  // bars), redrawn here from scratch rather than copied as an asset.
  const bars = [
    { x0: 4, x1: 10, y0: 16, y1: 30 },
    { x0: 12, x1: 18, y0: 8, y1: 30 },
    { x0: 20, x1: 26, y0: 4, y1: 30 },
  ];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const idx = (SIZE * y + x) << 2;
      const inBar = bars.some((b) => x >= b.x0 && x < b.x1 && y >= b.y0 && y < b.y1);
      png.data[idx] = ACCENT.r;
      png.data[idx + 1] = ACCENT.g;
      png.data[idx + 2] = ACCENT.b;
      png.data[idx + 3] = inBar ? 255 : 0;
    }
  }
  return PNG.sync.write(png);
}

async function ensureTrayIcon() {
  if (fs.existsSync(ICO_PATH)) return ICO_PATH;
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(PNG_PATH, drawIconPng());
  const pngToIco = await loadPngToIco();
  const icoBuffer = await pngToIco(PNG_PATH); // takes a file path, not a Buffer
  fs.writeFileSync(ICO_PATH, icoBuffer);
  return ICO_PATH;
}

module.exports = { ensureTrayIcon };
