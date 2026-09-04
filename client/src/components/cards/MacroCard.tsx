// One button that sets several VoiceMeeter parameters at once. Momentary mode captures
// each param's value right before the press and re-applies it on release — push-to-talk
// style — rather than assuming what "off" looks like.
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useVoiceMeeterStore } from '@/stores/useVoiceMeeterStore';
import { vmMacro } from '@/lib/socket';
import { readFloat } from '@/lib/vm';
import type { MacroConfig } from '@/lib/layout';

export function MacroCard({ config }: { config: MacroConfig }) {
  const connected = useVoiceMeeterStore((s) => s.status.connected);
  const revertRef = useRef<{ param: string; value: number }[] | null>(null);

  function press() {
    if (config.momentary) {
      const state = useVoiceMeeterStore.getState().state;
      revertRef.current = config.params.map(({ param }) => ({ param, value: readFloat(state, param) }));
    }
    vmMacro(config.params);
  }

  function release() {
    if (!config.momentary || !revertRef.current) return;
    vmMacro(revertRef.current);
    revertRef.current = null;
  }

  return (
    <Button
      variant="secondary"
      disabled={!connected}
      className="h-full w-full flex-col gap-1 whitespace-normal text-center"
      onPointerDown={press}
      onPointerUp={release}
      onPointerLeave={() => config.momentary && release()}
    >
      {config.label}
    </Button>
  );
}
