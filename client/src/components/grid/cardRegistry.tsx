// Maps a GridControl's `type` to the component that renders it. The only place that
// needs to know about every card type — GridCanvas itself stays card-agnostic.
import { Fader } from '@/components/cards/Fader';
import { VuMeter } from '@/components/cards/VuMeter';
import { Toggle } from '@/components/cards/Toggle';
import { StripPanel } from '@/components/cards/StripPanel';
import { BusPanel } from '@/components/cards/BusPanel';
import { MacroCard } from '@/components/cards/MacroCard';
import { Label } from '@/components/cards/Label';
import { ShortcutCard } from '@/components/cards/ShortcutCard';
import { STRIP_LABELS, BUS_LABELS } from '@/lib/vm';
import type {
  BusPanelConfig,
  FaderConfig,
  GridControl,
  MacroConfig,
  LabelConfig,
  ShortcutConfig,
  StripPanelConfig,
  ToggleConfig,
  VuMeterConfig,
} from '@/lib/layout';

function targetTitle(target: 'strip' | 'bus', index: number): string {
  return (target === 'strip' ? STRIP_LABELS : BUS_LABELS)[index] ?? `${target} ${index + 1}`;
}

export function renderCard(control: GridControl) {
  switch (control.type) {
    case 'fader': {
      const c = control.config as FaderConfig;
      return <Fader config={c} title={targetTitle(c.target, c.index)} />;
    }
    case 'vu_meter': {
      const c = control.config as VuMeterConfig;
      return <VuMeter config={c} title={targetTitle(c.target, c.index)} />;
    }
    case 'toggle':
      return <Toggle config={control.config as ToggleConfig} />;
    case 'strip_panel': {
      const c = control.config as StripPanelConfig;
      return <StripPanel config={c} title={STRIP_LABELS[c.index] ?? `Strip ${c.index + 1}`} />;
    }
    case 'bus_panel': {
      const c = control.config as BusPanelConfig;
      return <BusPanel config={c} title={BUS_LABELS[c.index] ?? `Bus ${c.index + 1}`} />;
    }
    case 'macro':
      return <MacroCard config={control.config as MacroConfig} />;
    case 'label':
      return <Label config={control.config as LabelConfig} />;
    case 'shortcut':
      return <ShortcutCard config={control.config as ShortcutConfig} />;
    default:
      return null;
  }
}

export const CARD_TYPE_LABEL: Record<GridControl['type'], string> = {
  fader: 'Fader',
  vu_meter: 'VU meter',
  toggle: 'Toggle',
  strip_panel: 'Strip panel',
  bus_panel: 'Bus panel',
  macro: 'Macro',
  label: 'Label',
  shortcut: 'Shortcut',
};
