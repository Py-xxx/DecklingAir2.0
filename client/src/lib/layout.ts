// The grid layout's data model — one page is a named tab of cards; one card is a typed,
// positioned control with type-specific config. Positions/sizes are in grid cells, not
// pixels (see components/grid/GridCanvas.tsx for the cell-to-pixel math), so the layout
// stays meaningful across window sizes.
export type CardType =
  | 'fader'
  | 'vu_meter'
  | 'toggle'
  | 'strip_panel'
  | 'bus_panel'
  | 'macro'
  | 'label'
  | 'shortcut';

export interface FaderConfig {
  target: 'strip' | 'bus';
  index: number;
}

export interface VuMeterConfig {
  target: 'strip' | 'bus';
  index: number;
}

export interface ToggleConfig {
  target: 'strip' | 'bus';
  index: number;
  param: string; // e.g. "Mute", "A1", "EQ.on"
  label: string;
}

export interface StripPanelConfig {
  index: number;
}

export interface BusPanelConfig {
  index: number;
}

export interface MacroConfig {
  label: string;
  params: { param: string; value: number }[];
  momentary: boolean; // release re-applies the pre-press values
}

export interface LabelConfig {
  text: string;
}

export interface ShortcutConfig {
  label: string;
  action: string; // 'launch' | 'open_url' | 'media_play_pause' | ... — see server/desktopActions.js
  target?: string;
  args?: string;
}

export type CardConfig =
  | FaderConfig
  | VuMeterConfig
  | ToggleConfig
  | StripPanelConfig
  | BusPanelConfig
  | MacroConfig
  | LabelConfig
  | ShortcutConfig;

export interface GridControl {
  id: string;
  type: CardType;
  x: number;
  y: number;
  w: number;
  h: number;
  config: CardConfig;
}

export interface Page {
  id: string;
  name: string;
  controls: GridControl[];
}

export interface Layout {
  pages: Page[];
}

export const DEFAULT_LAYOUT: Layout = {
  pages: [{ id: 'main', name: 'Main', controls: [] }],
};

// Default footprint per card type, in grid cells. Faders are tall (a gain slider needs
// travel to be usable); meters are narrow; panels are the biggest since they compose
// several controls. See .claude/skills/deckling-interface-polish/surfaces.md — density
// here comes from card sizing, never from shrinking a control below its touch floor.
export const CARD_DEFAULT_SIZE: Record<CardType, { w: number; h: number }> = {
  fader: { w: 2, h: 4 },
  vu_meter: { w: 1, h: 4 },
  toggle: { w: 2, h: 2 },
  strip_panel: { w: 3, h: 5 },
  bus_panel: { w: 3, h: 4 },
  macro: { w: 2, h: 2 },
  label: { w: 2, h: 1 },
  shortcut: { w: 2, h: 2 },
};

export const CARD_MIN_SIZE: Record<CardType, { w: number; h: number }> = {
  fader: { w: 2, h: 3 },
  vu_meter: { w: 1, h: 3 },
  toggle: { w: 2, h: 2 },
  strip_panel: { w: 3, h: 4 },
  bus_panel: { w: 3, h: 3 },
  macro: { w: 2, h: 2 },
  label: { w: 1, h: 1 },
  shortcut: { w: 2, h: 2 },
};

export function createControl(type: CardType, config: CardConfig, x = 0, y = 0): GridControl {
  const size = CARD_DEFAULT_SIZE[type];
  return {
    id: `${type}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    x,
    y,
    w: size.w,
    h: size.h,
    config,
  };
}

// First free row in a page's leftmost column, for placing a newly-added card without
// overlapping existing ones. A simple bottom-of-stack placement, not a bin-packer — good
// enough until the grid actually needs one.
export function nextFreeRow(controls: GridControl[]): number {
  return controls.reduce((max, c) => Math.max(max, c.y + c.h), 0);
}
