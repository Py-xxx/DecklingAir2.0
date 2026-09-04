// Vertical gain control for one strip or bus, as its own card. See FaderTrack.tsx for
// the drag mechanics (shared with StripPanel/BusPanel) and
// deckling-interface-polish/motion.md for why the thumb has no CSS transition.
import { Panel, PanelBody, PanelHeader, PanelTitle } from '@/components/ui/panel';
import { FaderTrack, useFaderDrag } from '@/components/cards/FaderTrack';
import { useVoiceMeeterStore } from '@/stores/useVoiceMeeterStore';
import { formatDb, readFloat, targetParam } from '@/lib/vm';
import type { FaderConfig } from '@/lib/layout';

export function Fader({ config, title }: { config: FaderConfig; title: string }) {
  const param = targetParam(config.target, config.index, 'Gain');
  const serverDb = useVoiceMeeterStore((s) => readFloat(s.state, param, 0));
  const connected = useVoiceMeeterStore((s) => s.status.connected);
  const { db, ratio, handlers } = useFaderDrag(param, serverDb, connected);

  return (
    <Panel className="h-full">
      <PanelHeader>
        <PanelTitle>{title}</PanelTitle>
        <span className="font-mono text-xs tabular-nums text-ink-soft">{formatDb(db)}</span>
      </PanelHeader>
      <PanelBody className="items-center">
        <FaderTrack db={db} ratio={ratio} handlers={handlers} connected={connected} label={title} />
      </PanelBody>
    </Panel>
  );
}
