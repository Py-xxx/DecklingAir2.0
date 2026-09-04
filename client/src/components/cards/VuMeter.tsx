// Live level display — a segmented, dual-channel (L/R) meter, ported from the reference
// app's design (24 discrete LED-style segments per channel, green/amber/red bands) rather
// than a single continuous fill bar. Segment lit-state is a direct, un-eased mapping from
// the bridge's level value — no CSS transition — per
// deckling-interface-polish/motion.md's meter exception; that's the one thing here that's
// *supposed* to animate continuously.
import { Panel, PanelBody, PanelHeader, PanelTitle } from '@/components/ui/panel';
import { useVoiceMeeterStore } from '@/stores/useVoiceMeeterStore';
import {
  busLevelStereo,
  formatDbOrNegInf,
  linearToDb,
  litSegments,
  stripLevelStereo,
  VU_SEGMENT_COUNT,
  VU_SEGMENT_RED,
  VU_SEGMENT_YELLOW,
} from '@/lib/vm';
import type { VuMeterConfig } from '@/lib/layout';
import { cn } from '@/lib/utils';

function segmentTone(index: number): string {
  if (index >= VU_SEGMENT_RED) return 'bg-accent-red';
  if (index >= VU_SEGMENT_YELLOW) return 'bg-accent-amber';
  return 'bg-accent-green';
}

function MeterColumn({ linear }: { linear: number }) {
  const lit = litSegments(linear);
  return (
    <div className="flex flex-1 flex-col-reverse gap-[2px]">
      {Array.from({ length: VU_SEGMENT_COUNT }, (_, i) => (
        <div key={i} className={cn('flex-1 rounded-[1px]', i < lit ? segmentTone(i) : 'bg-bg-elevated')} />
      ))}
    </div>
  );
}

export function VuMeter({ config, title }: { config: VuMeterConfig; title: string }) {
  const [l, r] = useVoiceMeeterStore((s) =>
    config.target === 'strip' ? stripLevelStereo(s.levels, config.index) : busLevelStereo(s.levels, config.index),
  );

  return (
    <Panel className="h-full">
      <PanelHeader>
        <PanelTitle>{title}</PanelTitle>
        <span className="font-mono text-xs tabular-nums text-ink-soft">{formatDbOrNegInf(linearToDb(Math.max(l, r)))}</span>
      </PanelHeader>
      <PanelBody>
        <div className="flex flex-1 gap-1">
          <MeterColumn linear={l} />
          <MeterColumn linear={r} />
        </div>
      </PanelBody>
    </Panel>
  );
}
