// Primitive. Base UI's Dialog — portalled, real focus trap, Escape/outside-press
// dismissal, all for free. The reason `dialog.tsx` is what finally brings Base UI into
// the project: hand-rolling this (a card config editor, and later Settings) is exactly
// the "never hand-position an overlay" trap in deckling-interface-polish/layering.md.
//
// Animation: Base UI ships unstyled with no transition by default — the data-open /
// data-starting-style / data-ending-style attributes below are what drive it, targeted
// with Tailwind's presence-only data-* variant (`data-starting-style:`, no brackets — a
// bracketed `data-[starting-style]` would build a *value* match, which this attribute
// doesn't have). Durations from motion.md: ~180ms open, ~120ms close, both named
// properties only (never a bare `transition`), per performance.md.
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const Dialog = BaseDialog.Root;
export const DialogTrigger = BaseDialog.Trigger;
export const DialogClose = BaseDialog.Close;

export function DialogContent({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop
        className={cn(
          'fixed inset-0 z-(--z-overlay) bg-black/60',
          'transition-opacity duration-150 ease-out',
          'data-starting-style:opacity-0 data-ending-style:opacity-0',
        )}
      />
      <BaseDialog.Popup
        className={cn(
          'fixed left-1/2 top-1/2 z-(--z-modal) w-[calc(100vw-32px)] max-w-md -translate-x-1/2 -translate-y-1/2',
          'rounded-xl bg-bg-overlay p-4 shadow-(--shadow-float)',
          'transition-[opacity,transform] duration-200 ease-out',
          'data-starting-style:scale-95 data-starting-style:opacity-0',
          'data-ending-style:scale-95 data-ending-style:opacity-0',
          className,
        )}
      >
        {children}
        <BaseDialog.Close
          aria-label="Close"
          className="absolute right-2 top-2 flex size-10 items-center justify-center rounded-md text-ink-dim transition-colors duration-150 ease-out hover:bg-bg-elevated hover:text-ink"
        >
          <X className="size-4" />
        </BaseDialog.Close>
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}

export const DialogTitle = BaseDialog.Title;
export const DialogDescription = BaseDialog.Description;
