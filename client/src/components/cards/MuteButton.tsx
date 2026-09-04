// A full-width MUTE/MUTED button, shared by StripPanel and BusPanel — ported from the
// reference app's prominent text-button mute control rather than a small switch, since
// mute is the single most-reached-for action on a channel strip and deserves the bigger,
// more confident target.
import { vmSet } from '@/lib/socket';
import { cn } from '@/lib/utils';

export function MuteButton({ param, muted, connected }: { param: string; muted: boolean; connected: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={muted}
      disabled={!connected}
      onClick={() => vmSet(param, muted ? 0 : 1)}
      className={cn(
        'h-10 w-full rounded-md font-mono text-xs font-semibold tracking-wider transition-colors duration-150 ease-out',
        'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40',
        muted
          ? 'bg-accent-red/18 text-accent-red shadow-[0_0_16px_-4px_var(--color-accent-red)] outline outline-1 outline-accent-red/40'
          : 'bg-bg-elevated text-ink-dim',
      )}
    >
      {muted ? 'MUTED' : 'MUTE'}
    </button>
  );
}
