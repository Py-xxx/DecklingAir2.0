// An output bus with fader and mute.
import { Panel, PanelBody, PanelHeader, PanelTitle } from '@/components/ui/panel';
import { Switch } from '@/components/ui/switch';
import { FaderTrack, useFaderDrag } from '@/components/cards/FaderTrack';
import { useVoiceMeeterStore } from '@/stores/useVoiceMeeterStore';
import { vmSet } from '@/lib/socket';
import { busParam, formatDb, readBool, readFloat } from '@/lib/vm';
import type { BusPanelConfig } from '@/lib/layout';

export function BusPanel({ config, title }: { config: BusPanelConfig; title: string }) {
  const gainParam = busParam(config.index, 'Gain');
  const muteParam = busParam(config.index, 'Mute');
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
      </PanelBody>
    </Panel>
  );
}
