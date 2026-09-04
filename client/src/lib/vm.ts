// VoiceMeeter parameter constants and helpers, matching server/voicemeeter.js exactly
// (Strip[n].Param / Bus[n].Param naming, param lists, counts). Keep these two files in
// sync — this is the client's only source of truth for what a "strip" or "bus" is.
import type { VmParamValue } from './socket';

export const STRIP_COUNT = 8;
export const BUS_COUNT = 8;

// Potato: 5 hardware inputs + 3 virtual inputs
export const STRIP_LABELS = ['Hardware In 1', 'Hardware In 2', 'Hardware In 3', 'Hardware In 4', 'Hardware In 5', 'Virtual In 1', 'Virtual In 2', 'Virtual In 3'];
// Potato: 5 hardware outputs (A1-A5) + 3 virtual outputs (B1-B3)
export const BUS_LABELS = ['A1', 'A2', 'A3', 'A4', 'A5', 'B1', 'B2', 'B3'];

export const GAIN_MIN = -60;
export const GAIN_MAX = 12;

// Boolean param names per target — matches STRIP_BOOL_PARAMS/BUS_BOOL_PARAMS in
// server/voicemeeter.js. Used to populate the Toggle card's config form.
export const STRIP_BOOL_PARAMS = ['Mute', 'Solo', 'MC', 'A1', 'A2', 'A3', 'A4', 'A5', 'B1', 'B2', 'B3'];
export const BUS_BOOL_PARAMS = ['Mute', 'EQ.on'];

export function boolParamsFor(target: 'strip' | 'bus'): string[] {
  return target === 'strip' ? STRIP_BOOL_PARAMS : BUS_BOOL_PARAMS;
}

export function stripParam(index: number, param: string): string {
  return `Strip[${index}].${param}`;
}

export function busParam(index: number, param: string): string {
  return `Bus[${index}].${param}`;
}

export function targetParam(target: 'strip' | 'bus', index: number, param: string): string {
  return target === 'strip' ? stripParam(index, param) : busParam(index, param);
}

export function readFloat(state: Record<string, VmParamValue>, param: string, fallback = 0): number {
  const v = state[param];
  return typeof v === 'number' ? v : fallback;
}

export function readBool(state: Record<string, VmParamValue>, param: string): boolean {
  return readFloat(state, param, 0) >= 0.5;
}

export function formatDb(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}`;
}

// getAllLevels() layout, from server/voicemeeter.js:
//   [0..15]  strip levels — 8 strips x 2ch (L/R), linear amplitude 0.0-1.0+
//   [16..79] bus levels   — 8 buses x 8ch surround, linear amplitude 0.0-1.0+
const STRIP_LEVELS_BASE = 0;
const BUS_LEVELS_BASE = 16;
const BUS_CHANNELS = 8;

export function stripLevelStereo(levels: number[], index: number): [number, number] {
  const l = levels[STRIP_LEVELS_BASE + index * 2] ?? 0;
  const r = levels[STRIP_LEVELS_BASE + index * 2 + 1] ?? l;
  return [l, r];
}

export function busLevelStereo(levels: number[], index: number): [number, number] {
  const base = BUS_LEVELS_BASE + index * BUS_CHANNELS;
  const l = levels[base] ?? 0;
  const r = levels[base + 1] ?? l;
  return [l, r];
}

export function stripLevel(levels: number[], index: number): number {
  return Math.max(...stripLevelStereo(levels, index));
}

export function busLevel(levels: number[], index: number): number {
  return Math.max(...busLevelStereo(levels, index));
}

// Linear amplitude -> 0..1 UI fill, roughly matching a -60..0dB meter scale (VoiceMeeter's
// own meters read the same way). 1.0 linear ~= 0dB; anything above is clipping territory.
export function levelToFill(linear: number): number {
  if (linear <= 0) return 0;
  const db = 20 * Math.log10(linear);
  return Math.min(1, Math.max(0, (db + 60) / 60));
}

export function isClipping(linear: number): boolean {
  return linear >= 1.0;
}

export function linearToDb(linear: number): number {
  return linear > 0 ? 20 * Math.log10(linear) : -Infinity;
}

export function formatDbOrNegInf(db: number): string {
  if (!Number.isFinite(db) || db <= -60) return '-∞';
  return formatDb(db);
}

// Discrete LED-style segment count, matching the reference app's meter exactly: a wider
// -60..+6dB range (66, not 60) than the fader's own -60..12 scale, so the meter has a
// little headroom above 0dB before every segment is lit.
export const VU_SEGMENT_COUNT = 24;
export const VU_SEGMENT_YELLOW = 18;
export const VU_SEGMENT_RED = 22;

export function litSegments(linear: number, segments = VU_SEGMENT_COUNT): number {
  const db = linearToDb(linear);
  const norm = Math.min(1, Math.max(0, (db + 60) / 66));
  return Math.round(norm * segments);
}
