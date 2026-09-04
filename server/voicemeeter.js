// Node/koffi port of bridge/voicemeeter.py's VoiceMeeterRemote class.
//
// UNVERIFIED ON REAL HARDWARE: written without a Windows machine, Node runtime, or an
// installed VoiceMeeter Remote API available in this environment. The DLL's calling
// convention (__stdcall) and the general shape of koffi's out-parameter handling were
// confirmed against koffi's own docs (koffi.dev/output, koffi.dev/functions) at write
// time, but the exact byte-for-byte behaviour needs a real run on the target PC. If a
// call throws or returns garbage, the fix almost certainly lives in one of the seven
// `dll.func(...)` declarations at the top — nothing else here is DLL-signature-sensitive.
//
// Supports VoiceMeeter, Banana, and Potato, same as the Python original.
const koffi = require('koffi');

const DLL_PATHS = [
  'C:\\Program Files (x86)\\VB\\Voicemeeter\\VoicemeeterRemote64.dll',
  'C:\\Program Files\\VB\\Voicemeeter\\VoicemeeterRemote64.dll',
  'C:\\Program Files (x86)\\VB\\Voicemeeter\\VoicemeeterRemote.dll',
];

const VM_TYPE_NAMES = { 1: 'VoiceMeeter', 2: 'VoiceMeeter Banana', 3: 'VoiceMeeter Potato' };

// Potato has 8 strips (5 HW + 3 virt) and 8 buses (5 HW A1-A5 + 3 virt B1-B3)
const STRIP_COUNT = 8;
const BUS_COUNT = 8;

const STRIP_FLOAT_PARAMS = ['Gain', 'Pan_x', 'Pan_y', 'EqGain1', 'EqGain2', 'EqGain3', 'Comp', 'Gate', 'Karaoke'];
const STRIP_BOOL_PARAMS = ['Mute', 'Solo', 'MC', 'A1', 'A2', 'A3', 'A4', 'A5', 'B1', 'B2', 'B3'];
const BUS_FLOAT_PARAMS = ['Gain'];
const BUS_BOOL_PARAMS = ['Mute', 'EQ.on'];

// Official VB-Audio Remote API "Voicemeeter Potato Input Channel Organization" lists the
// input level indices as In1=0, In2=2, In3=4, In4=6, In5=8, V1=10, V2=18, V3=26 — hardware
// strips use 2 channels, virtual inputs use 8. We expose a simplified 8-strip stereo view
// by taking L/R from each strip's documented starting index. Ported verbatim from voicemeeter.py.
const STRIP_LEVEL_INPUT_INDICES = [0, 2, 4, 6, 8, 10, 18, 26];

class VoiceMeeterRemote {
  constructor() {
    this._dll = null;
    this._fn = null;
  }

  /** Load the DLL. Returns true on success. */
  initialize() {
    const fs = require('fs');
    for (const dllPath of DLL_PATHS) {
      if (!fs.existsSync(dllPath)) continue;
      try {
        this._dll = koffi.load(dllPath);
        this._bindFunctions();
        console.log(`[voicemeeter] loaded DLL: ${dllPath}`);
        return true;
      } catch (err) {
        console.warn(`[voicemeeter] failed to load ${dllPath}:`, err.message);
      }
    }
    console.error('[voicemeeter] DLL not found — is VoiceMeeter installed?');
    return false;
  }

  _bindFunctions() {
    const dll = this._dll;
    this._fn = {
      login: dll.func('int32 __stdcall VBVMR_Login()'),
      logout: dll.func('int32 __stdcall VBVMR_Logout()'),
      getType: dll.func('int32 __stdcall VBVMR_GetVoicemeeterType(_Out_ int32 *type)'),
      getVersion: dll.func('int32 __stdcall VBVMR_GetVoicemeeterVersion(_Out_ int32 *version)'),
      isDirty: dll.func('int32 __stdcall VBVMR_IsParametersDirty()'),
      getParamFloat: dll.func('int32 __stdcall VBVMR_GetParameterFloat(_In_ str param, _Out_ float *value)'),
      setParamFloat: dll.func('int32 __stdcall VBVMR_SetParameterFloat(_In_ str param, _In_ float value)'),
      getParamString: dll.func('int32 __stdcall VBVMR_GetParameterStringA(_In_ str param, _Out_ char *value)'),
      setParamString: dll.func('int32 __stdcall VBVMR_SetParameterStringA(_In_ str param, _In_ str value)'),
      getLevel: dll.func('int32 __stdcall VBVMR_GetLevel(_In_ int32 type, _In_ int32 channel, _Out_ float *value)'),
    };
  }

  /**
   * Returns:
   *   0  = OK, already running
   *   1  = OK, VoiceMeeter launched
   *  -1  = cannot get client (unexpected error)
   *  -2  = VoiceMeeter not installed
   */
  login() {
    return this._fn.login();
  }

  logout() {
    return this._fn.logout();
  }

  /** Returns VM type: 1=VM, 2=Banana, 3=Potato */
  getType() {
    const out = [0];
    this._fn.getType(out);
    return out[0];
  }

  getVersion() {
    const out = [0];
    this._fn.getVersion(out);
    const raw = out[0];
    const v1 = (raw >> 24) & 0xff;
    const v2 = (raw >> 16) & 0xff;
    const v3 = (raw >> 8) & 0xff;
    const v4 = raw & 0xff;
    return `${v1}.${v2}.${v3}.${v4}`;
  }

  /** True if parameters changed since last call. */
  isDirty() {
    return this._fn.isDirty() === 1;
  }

  getFloat(param) {
    const out = [0];
    const r = this._fn.getParamFloat(param, out);
    if (r !== 0) throw new Error(`GetParameterFloat(${param}) returned ${r}`);
    return Math.round(out[0] * 10000) / 10000;
  }

  setFloat(param, value) {
    const r = this._fn.setParamFloat(param, value);
    if (r !== 0) throw new Error(`SetParameterFloat(${param}, ${value}) returned ${r}`);
  }

  getString(param) {
    const buf = Buffer.alloc(512);
    const r = this._fn.getParamString(param, buf);
    if (r !== 0) return '';
    const nul = buf.indexOf(0);
    return buf.toString('utf8', 0, nul === -1 ? buf.length : nul);
  }

  setString(param, value) {
    this._fn.setParamString(param, value);
  }

  /**
   * level_type: 0=pre-fader, 1=post-fader, 2=post-mute, 3=output
   * Returns linear amplitude (0.0-1.0+)
   */
  getLevel(levelType, channel) {
    const out = [0];
    const r = this._fn.getLevel(levelType, channel, out);
    if (r !== 0) return 0.0;
    return out[0];
  }

  /**
   * Flat list of linear level values:
   *   [0..15]  = strip channels (8 strips x 2ch L+R), using VB-Audio's documented Potato
   *              input indices with getLevel(0, idx)
   *   [16..79] = bus channels (8 buses x 8ch surround), type=3
   */
  getAllLevels() {
    const levels = [];
    for (const startIdx of STRIP_LEVEL_INPUT_INDICES) {
      levels.push(this.getLevel(0, startIdx));
      levels.push(this.getLevel(0, startIdx + 1));
    }
    for (let ch = 0; ch < 64; ch++) {
      levels.push(this.getLevel(3, ch));
    }
    return levels;
  }

  /** Read all relevant strip and bus parameters into a flat object. */
  getAllParams() {
    const state = {};

    for (let i = 0; i < STRIP_COUNT; i++) {
      for (const p of STRIP_FLOAT_PARAMS) {
        const key = `Strip[${i}].${p}`;
        try { state[key] = this.getFloat(key); } catch { /* param unavailable on this VM type */ }
      }
      for (const p of STRIP_BOOL_PARAMS) {
        const key = `Strip[${i}].${p}`;
        try { state[key] = this.getFloat(key); } catch { /* param unavailable on this VM type */ }
      }
      try { state[`Strip[${i}].Label`] = this.getString(`Strip[${i}].Label`); } catch { /* ignore */ }
    }

    for (let i = 0; i < BUS_COUNT; i++) {
      for (const p of BUS_FLOAT_PARAMS) {
        const key = `Bus[${i}].${p}`;
        try { state[key] = this.getFloat(key); } catch { /* param unavailable on this VM type */ }
      }
      for (const p of BUS_BOOL_PARAMS) {
        const key = `Bus[${i}].${p}`;
        try { state[key] = this.getFloat(key); } catch { /* param unavailable on this VM type */ }
      }
      try { state[`Bus[${i}].Label`] = this.getString(`Bus[${i}].Label`); } catch { /* ignore */ }
    }

    return state;
  }
}

module.exports = { VoiceMeeterRemote, VM_TYPE_NAMES, STRIP_COUNT, BUS_COUNT };
