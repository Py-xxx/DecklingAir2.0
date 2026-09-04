// Primitive. A styled native <select>, not a popup-list component — this app only ever
// picks between short lists of plain words (which strip, which action), and the native
// control brings keyboard behaviour and type-ahead for free, with the OS drawing the
// list. `appearance-none` hides the OS arrow so our own chevron is the only one.
import { forwardRef, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'h-10 w-full appearance-none rounded-md border border-line bg-bg-elevated pl-3 pr-9 font-sans text-sm text-ink',
          'transition-[border-color] duration-150 ease-out',
          'focus-visible:outline-none focus-visible:border-accent-blue',
          'disabled:pointer-events-none disabled:opacity-40',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-dim" />
    </div>
  ),
);
Select.displayName = 'Select';
