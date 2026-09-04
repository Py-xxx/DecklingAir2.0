// An on/off control bound to any boolean VoiceMeeter parameter (mute, solo, routing).
// Ported from the reference app's toggle-card design: the *whole card* is the touch
// target and washes with colour + a soft glow when active, rather than a small switch
// tucked in a corner — a much bigger, more confident target, and state is unmissable at
// a glance across a page of cards. tone/label semantics stay ours (§5 accent table):
// Mute reads red-when-on, everything else reads green-when-on.
import { useVoiceMeeterStore } from '@/stores/useVoiceMeeterStore';
import { vmSet } from '@/lib/socket';
import { readBool, targetParam } from '@/lib/vm';
import type { ToggleConfig } from '@/lib/layout';
import { cn } from '@/lib/utils';

const TONE_ACTIVE_CLASS = {
  danger: 'bg-accent-red/18 shadow-[0_0_20px_-4px_var(--color-accent-red)] outline outline-1 outline-accent-red/40',
  positive: 'bg-accent-green/18 shadow-[0_0_20px_-4px_var(--color-accent-green)] outline outline-1 outline-accent-green/40',
};

export function Toggle({ config }: { config: ToggleConfig }) {
  const param = targetParam(config.target, config.index, config.param);
  const on = useVoiceMeeterStore((s) => readBool(s.state, param));
  const connected = useVoiceMeeterStore((s) => s.status.connected);
  const tone: 'danger' | 'positive' = config.param === 'Mute' ? 'danger' : 'positive';

  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={!connected}
      onClick={() => vmSet(param, on ? 0 : 1)}
      className={cn(
        'flex h-full w-full flex-col items-center justify-center gap-1 rounded-lg bg-bg-panel shadow-(--shadow-border)',
        'transition-[background-color,box-shadow] duration-150 ease-out active:scale-[0.98]',
        'disabled:pointer-events-none disabled:opacity-40',
        on && TONE_ACTIVE_CLASS[tone],
      )}
    >
      <span className="truncate px-2 font-sans text-sm text-ink">{config.label}</span>
      <span
        className={cn(
          'font-mono text-[11px] font-semibold tracking-wider',
          on ? (tone === 'danger' ? 'text-accent-red' : 'text-accent-green') : 'text-ink-dim',
        )}
      >
        {on ? 'ON' : 'OFF'}
      </span>
    </button>
  );
}
