// Primitive. The card surface every grid card sits in. Border for separation (not a
// shadow — see deckling-interface-polish/surfaces.md), single ring recipe from
// .claude/design/ELEMENTS.md §5.
import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Panel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col rounded-lg bg-bg-panel shadow-(--shadow-border)',
        'transition-[box-shadow] duration-150 ease-out',
        className,
      )}
      {...props}
    />
  ),
);
Panel.displayName = 'Panel';

export const PanelHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center justify-between gap-2 px-3 pt-2.5 pb-1.5', className)}
      {...props}
    />
  ),
);
PanelHeader.displayName = 'PanelHeader';

export const PanelTitle = forwardRef<
  HTMLSpanElement,
  HTMLAttributes<HTMLSpanElement> & { variant?: 'label' | 'heading' }
>(({ className, variant = 'label', ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      variant === 'heading'
        ? 'font-sans text-sm font-semibold text-ink'
        : 'font-mono text-[11px] uppercase tracking-wider text-ink-dim',
      'truncate',
      className,
    )}
    {...props}
  />
));
PanelTitle.displayName = 'PanelTitle';

export const PanelBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-1 flex-col px-3 pb-3', className)} {...props} />
  ),
);
PanelBody.displayName = 'PanelBody';
