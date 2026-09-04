// Primitive. A short tinted label — connection status, clipping warning, an active
// session. tabular-nums is unconditional per deckling-interface-polish/typography.md:
// a badge routinely holds a figure, and it costs nothing on the ones that don't.
import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type BadgeTone = 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'neutral';

// Semantics from .claude/design/ELEMENTS.md §5: green=live/unmuted/connected,
// red=muted/clipping/offline, amber=active session, blue=routing/info, purple=reserved.
const TONE_CLASS: Record<BadgeTone, string> = {
  green: 'bg-accent-green/15 text-accent-green',
  amber: 'bg-accent-amber/15 text-accent-amber',
  red: 'bg-accent-red/15 text-accent-red',
  blue: 'bg-accent-blue/15 text-accent-blue',
  purple: 'bg-accent-purple/15 text-accent-purple',
  neutral: 'bg-bg-elevated text-ink-dim',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: 'default' | 'sm';
  uppercase?: boolean;
}

export function Badge({ className, tone = 'neutral', size = 'default', uppercase, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-mono tabular-nums',
        size === 'sm' ? 'h-4 px-1.5 text-[9px]' : 'h-5 px-2 text-[10px]',
        uppercase && 'uppercase tracking-wide',
        TONE_CLASS[tone],
        className,
      )}
      {...props}
    />
  );
}
