// One positioned, optionally draggable/resizable card on the grid. Dragging is dnd-kit
// (see GridCanvas for the DndContext + snap modifier); resizing is the hand-written
// useResizable hook, since dnd-kit doesn't do resize. Edit-mode chrome only renders in
// edit mode — a read-only grid stays visually clean.
//
// The chrome is a full-width drag strip along the top edge, not a discrete top-left
// button — a 1-cell-wide card (64px, e.g. a standalone VU Meter) can't fit two 40px
// touch-floor buttons side by side, so a drag handle and a delete button competing for
// the same corner was a real bug in the first pass of this component. One 40px action
// button floats top-right instead: a gear for anything with a config dialog (opens it,
// which is also where Delete now lives), or a plain X for Strip/Bus Panel, which have
// nothing to configure.
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripHorizontal, Settings, X } from 'lucide-react';
import { renderCard, hasConfigDialog } from '@/components/grid/cardRegistry';
import { cellsToPx } from '@/components/grid/gridConstants';
import { useResizable } from '@/hooks/useResizable';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { CARD_MIN_SIZE, type GridControl } from '@/lib/layout';
import { cn } from '@/lib/utils';

export function GridCard({
  control,
  editMode,
  onConfigure,
}: {
  control: GridControl;
  editMode: boolean;
  onConfigure: (control: GridControl) => void;
}) {
  const updateControl = useLayoutStore((s) => s.updateControl);
  const removeControl = useLayoutStore((s) => s.removeControl);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: control.id,
    disabled: !editMode,
  });

  const min = CARD_MIN_SIZE[control.type];
  const { liveSize, resizeHandlers } = useResizable(control.w, control.h, min.w, min.h, (w, h) =>
    updateControl(control.id, { w, h }),
  );

  const w = liveSize?.w ?? control.w;
  const h = liveSize?.h ?? control.h;
  const configurable = hasConfigDialog(control.type);

  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'absolute',
        left: cellsToPx(control.x),
        top: cellsToPx(control.y),
        width: cellsToPx(w),
        height: cellsToPx(h),
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        zIndex: isDragging ? 'var(--z-raised)' : undefined,
      }}
      className={cn('group', isDragging && 'opacity-90')}
    >
      <div className={cn('h-full w-full', editMode && 'pointer-events-none')}>{renderCard(control)}</div>

      {editMode && (
        <>
          {/* Drag strip — full width, so it never has to share a corner with another
              button. Sits behind the action button (z-0 vs z-10) so both stay tappable. */}
          <div
            {...attributes}
            {...listeners}
            aria-label="Move card"
            className="absolute inset-x-0 top-0 z-0 h-10 touch-none rounded-t-lg bg-bg-overlay/70 shadow-(--shadow-border)"
          >
            <GripHorizontal className="mx-auto mt-2.5 size-4 text-ink-dim" />
          </div>

          <button
            aria-label={configurable ? 'Configure card' : 'Remove card'}
            onClick={() => (configurable ? onConfigure(control) : removeControl(control.id))}
            className="absolute right-1 top-1 z-10 flex size-10 items-center justify-center rounded-md bg-bg-overlay/90 text-ink-dim shadow-(--shadow-border) hover:text-ink"
          >
            {configurable ? <Settings className="size-4" /> : <X className="size-4" />}
          </button>

          <div
            {...resizeHandlers}
            aria-label="Resize card"
            className="absolute bottom-0 right-0 z-10 flex size-10 touch-none cursor-nwse-resize items-end justify-end p-2"
          >
            <div className="size-3 rounded-sm border-b-2 border-r-2 border-ink-dim" />
          </div>

          <div className="pointer-events-none absolute inset-0 rounded-lg outline outline-1 -outline-offset-1 outline-accent-blue/40" />
        </>
      )}
    </div>
  );
}
