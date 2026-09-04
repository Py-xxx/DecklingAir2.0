// Desktop-action constants for the Shortcut card's config form — matches the `action`
// values server/desktopActions.js actually handles. Keep these two files in sync.
export interface DesktopActionOption {
  value: string;
  label: string;
  needsTarget?: 'path' | 'url' | 'combo';
  needsArgs?: boolean;
}

export const DESKTOP_ACTIONS: DesktopActionOption[] = [
  { value: 'launch', label: 'Launch app / open file', needsTarget: 'path', needsArgs: true },
  { value: 'open_url', label: 'Open URL', needsTarget: 'url' },
  { value: 'screenshot', label: 'Screenshot' },
  { value: 'media_play_pause', label: 'Play / pause' },
  { value: 'media_next', label: 'Next track' },
  { value: 'media_previous', label: 'Previous track' },
  { value: 'volume_up', label: 'Volume up' },
  { value: 'volume_down', label: 'Volume down' },
  { value: 'volume_mute', label: 'Volume mute' },
  { value: 'lock', label: 'Lock' },
  { value: 'sleep', label: 'Sleep' },
  { value: 'key_combo', label: 'Custom key combo', needsTarget: 'combo' },
];

export function desktopActionOption(value: string): DesktopActionOption | undefined {
  return DESKTOP_ACTIONS.find((a) => a.value === value);
}
