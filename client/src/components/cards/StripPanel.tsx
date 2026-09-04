// A full input channel strip — fader, mute, and bus routing toggles (A1-A5/B1-B3). The
// routing chips are a 4-column grid rather than one row of 8, specifically so each chip
// still clears the 40px touch floor at the card's default width — see
// deckling-interface-polish/surfaces.md, which allows no density exception for a control
// the user directly touches.
import { Panel, PanelBody, PanelHeader, PanelTitle } from '@/components/ui/panel';
import { Switch } from '@/components/ui/switch';
import { FaderTrack, useFaderDrag } from '@/components/cards/FaderTrack';
import { useVoiceMeeterStore } from '@/stores/useVoiceMeeterStore';
import { vmSet } from '@/lib/socket';
import { BUS_LABELS, formatDb, readBool, readFloat, stripParam } from '@/lib/vm';
import type { StripPanelConfig } from '@/lib/layout';
import { cn } from '@/lib/utils';

const ROUTE_PARAMS = ['A1', 'A2', 'A3', 'A4', 'A5', 'B1', 'B2', 'B3'];

function RouteChip({ param, label, connected }: { param: string; label: string; connected: boolean }) {
  const on = useVoiceMeeterStore((s) => readBool(s.state, param));
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={!connected}
      onClick={() => vmSet(param, on ? 0 : 1)}
      className={cn(
        'h-10 rounded-md font-mono text-[11px] font-medium tabular-nums transition-colors duration-150 ease-out',
        'active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40',
        on ? 'bg-accent-blue text-ink' : 'bg-bg-elevated text-ink-dim',
      )}
    >
      {label}
    </button>
  );
}

export function StripPanel({ config, title }: { config: StripPanelConfig; title: string }) {
  const gainParam = stripParam(config.index, 'Gain');
  const muteParam = stripParam(config.index, 'Mute');
  const serverDb = useVoiceMeeterStore((s) => readFloat(s.state, gainParam, 0));
  const muted = useVoiceMeeterStore((s) => readBool(s.state, muteParam));
  const connected = useVoiceMeeterStore((s) => s.status.connected);
  const { db, ratio, handlers } = useFaderDrag(gainParam, serverDb, connected);

  return (
    <Panel className="h-full">
      <PanelHeader>
        <PanelTitle variant="heading">{title}</PanelTitle>
        <span className="font-mono text-xs tabular-nums text-ink-soft">{formatDb(db)}</span>
      </PanelHeader>
      <PanelBody className="gap-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink-dim">Mute</span>
          <Switch checked={muted} onCheckedChange={(v) => vmSet(muteParam, v ? 1 : 0)} tone="danger" disabled={!connected} />
        </div>
        <FaderTrack db={db} ratio={ratio} handlers={handlers} connected={connected} label={title} />
        <div className="grid grid-cols-4 gap-1.5">
          {ROUTE_PARAMS.map((p, i) => (
            <RouteChip key={p} param={stripParam(config.index, p)} label={BUS_LABELS[i] ?? p} connected={connected} />
          ))}
        </div>
      </PanelBody>
    </Panel>
  );
}
