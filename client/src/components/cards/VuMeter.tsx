// Live level display. The fill height is a direct, un-eased mapping from the bridge's
// level value — the one thing in this app that's *supposed* to animate continuously.
// No CSS transition on the fill, per deckling-interface-polish/motion.md.
import { Panel, PanelBody, PanelHeader, PanelTitle } from '@/components/ui/panel';
import { useVoiceMeeterStore } from '@/stores/useVoiceMeeterStore';
import { busLevel, isClipping, levelToFill, stripLevel } from '@/lib/vm';
import type { VuMeterConfig } from '@/lib/layout';
import { cn } from '@/lib/utils';

export function VuMeter({ config, title }: { config: VuMeterConfig; title: string }) {
  const linear = useVoiceMeeterStore((s) =>
    config.target === 'strip' ? stripLevel(s.levels, config.index) : busLevel(s.levels, config.index),
  );
  const fill = levelToFill(linear);
  const clipping = isClipping(linear);

  return (
    <Panel className="h-full">
      <PanelHeader>
        <PanelTitle>{title}</PanelTitle>
      </PanelHeader>
      <PanelBody className="items-center">
        <div className="relative w-full flex-1 overflow-hidden rounded-md bg-bg-elevated">
          <div
            className={cn('absolute inset-x-0 bottom-0', clipping ? 'bg-accent-red' : 'bg-accent-green')}
            style={{ height: `${fill * 100}%` }}
          />
        </div>
      </PanelBody>
    </Panel>
  );
}
