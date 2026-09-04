// An on/off button bound to any boolean VoiceMeeter parameter (mute, solo, routing).
import { Panel, PanelBody } from '@/components/ui/panel';
import { Switch } from '@/components/ui/switch';
import { useVoiceMeeterStore } from '@/stores/useVoiceMeeterStore';
import { vmSet } from '@/lib/socket';
import { readBool, targetParam } from '@/lib/vm';
import type { ToggleConfig } from '@/lib/layout';

// The switch always shows the parameter's raw on/off state — no inversion. Mute reads
// red-when-on (muted = the bad state to notice); every other boolean (solo, routing)
// reads green-when-on. Semantics from .claude/design/ELEMENTS.md §5.
export function Toggle({ config }: { config: ToggleConfig }) {
  const param = targetParam(config.target, config.index, config.param);
  const on = useVoiceMeeterStore((s) => readBool(s.state, param));
  const connected = useVoiceMeeterStore((s) => s.status.connected);
  const tone = config.param === 'Mute' ? 'danger' : 'positive';

  return (
    <Panel className="h-full">
      <PanelBody className="flex-row items-center justify-between pt-3">
        <span className="truncate font-sans text-sm text-ink">{config.label}</span>
        <Switch checked={on} onCheckedChange={(next) => vmSet(param, next ? 1 : 0)} tone={tone} disabled={!connected} />
      </PanelBody>
    </Panel>
  );
}
