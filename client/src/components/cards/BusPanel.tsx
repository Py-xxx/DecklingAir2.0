// An output bus with fader and mute. No integrated VU column — the reference app's bus
// panel doesn't show one either (`showVu: false` on its fader widget); a bus's level is
// already visible via a standalone VU Meter card if the user wants one.
import { Panel, PanelBody, PanelHeader, PanelTitle } from '@/components/ui/panel';
import { MuteButton } from '@/components/cards/MuteButton';
import { FaderTrack, useFaderDrag } from '@/components/cards/FaderTrack';
import { useVoiceMeeterStore } from '@/stores/useVoiceMeeterStore';
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
        <FaderTrack db={db} ratio={ratio} handlers={handlers} connected={connected} label={title} />
        <MuteButton param={muteParam} muted={muted} connected={connected} />
      </PanelBody>
    </Panel>
  );
}
