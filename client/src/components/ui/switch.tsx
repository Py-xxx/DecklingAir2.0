// Primitive. Hand-rolled (no Base UI yet) — a real `<button role="switch">`, not a
// styled checkbox, so it carries proper semantics without a library. The visible track
// is small; the hit area is extended to the 40px floor with a pseudo-element, same
// pattern as an icon button — see deckling-interface-polish/surfaces.md.
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type SwitchTone = 'default' | 'positive' | 'accent' | 'danger';

const TONE_ON_CLASS: Record<SwitchTone, string> = {
  default: 'bg-accent-blue',
  positive: 'bg-accent-green',
  accent: 'bg-accent-purple',
  danger: 'bg-accent-red',
};

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  tone?: SwitchTone;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked, onCheckedChange, tone = 'default', disabled, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-[15px] w-[26px] shrink-0 items-center rounded-full',
        'transition-colors duration-150 ease-out',
        'after:absolute after:left-1/2 after:top-1/2 after:size-10 after:-translate-x-1/2 after:-translate-y-1/2', // 40px hit area
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-40',
        checked ? TONE_ON_CLASS[tone] : 'bg-line-strong',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'pointer-events-none block size-[11px] rounded-full bg-ink shadow-(--shadow-float)',
          'transition-transform duration-150 ease-out',
          checked ? 'translate-x-[13px]' : 'translate-x-[2px]',
        )}
      />
    </button>
  ),
);
Switch.displayName = 'Switch';
