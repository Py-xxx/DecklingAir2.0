// Primitive. Hand-written, plain <input> — no library needed for this one. Numeric
// callers opt into tabular-nums themselves; the component can't know what it holds.
import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-md border border-line bg-bg-elevated px-3 font-sans text-sm text-ink',
        'placeholder:text-ink-faint',
        'transition-[border-color] duration-150 ease-out',
        'focus-visible:outline-none focus-visible:border-accent-blue',
        'disabled:pointer-events-none disabled:opacity-40',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
