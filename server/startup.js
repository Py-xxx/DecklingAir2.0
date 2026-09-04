// Windows "start on login" toggle — the registry Run-key approach, same mechanism the
// reference app's bridge.py used via winreg, ported to plain child_process + reg.exe so
// no native registry-access dependency is needed.
const { execFileSync } = require('child_process');

const REG_KEY = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
const REG_VALUE = 'DecklingAir';

function isStartupEnabled() {
  if (process.platform !== 'win32') return false;
  try {
    execFileSync('reg', ['query', REG_KEY, '/v', REG_VALUE], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function setStartupEnabled(enabled) {
  if (process.platform !== 'win32') return;

  if (!enabled) {
    try {
      execFileSync('reg', ['delete', REG_KEY, '/v', REG_VALUE, '/f'], { stdio: 'ignore' });
    } catch {
      /* wasn't set — fine */
    }
    return;
  }

  // Packaged (pkg) builds are self-contained — process.execPath IS the app. A plain
  // `node index.js` run needs both the node binary and this script's path in the command.
  const command = process.pkg
    ? `"${process.execPath}"`
    : `"${process.execPath}" "${require.main.filename}"`;

  execFileSync('reg', ['add', REG_KEY, '/v', REG_VALUE, '/t', 'REG_SZ', '/d', command, '/f']);
}

module.exports = { isStartupEnabled, setStartupEnabled };
