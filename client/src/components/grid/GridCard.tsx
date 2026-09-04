// One positioned, optionally draggable/resizable card on the grid. Dragging is dnd-kit
// (see GridCanvas for the DndContext + snap modifier); resizing is the hand-written
// useResizable hook, since dnd-kit doesn't do resize. Edit-mode chrome (drag handle,
// delete, resize grip) only renders in edit mode — a read-only grid stays visually clean.
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { renderCard } from '@/components/grid/cardRegistry';
import { cellsToPx } from '@/components/grid/gridConstants';
import { useResizable } from '@/hooks/useResizable';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { CARD_MIN_SIZE, type GridControl } from '@/lib/layout';
import { cn } from '@/lib/utils';

export function GridCard({ control, editMode }: { control: GridControl; editMode: boolean }) {
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
          {/* Drag handle — the only draggable region, so a card's own controls (a fader,
              a switch) stay untouched while editing. */}
          <button
            {...attributes}
            {...listeners}
            aria-label="Move card"
            className="absolute left-1 top-1 flex size-10 touch-none items-center justify-center rounded-md bg-bg-overlay/90 text-ink-dim shadow-(--shadow-border)"
          >
            <GripVertical className="size-4" />
          </button>

          <button
            aria-label="Remove card"
            onClick={() => removeControl(control.id)}
            className="absolute right-1 top-1 flex size-10 items-center justify-center rounded-md bg-bg-overlay/90 text-ink-dim shadow-(--shadow-border) hover:text-accent-red"
          >
            <X className="size-4" />
          </button>

          <div
            {...resizeHandlers}
            aria-label="Resize card"
            className="absolute bottom-0 right-0 flex size-10 touch-none cursor-nwse-resize items-end justify-end p-2"
          >
            <div className="size-3 rounded-sm border-b-2 border-r-2 border-ink-dim" />
          </div>

          <div className="pointer-events-none absolute inset-0 rounded-lg outline outline-1 -outline-offset-1 outline-accent-blue/40" />
        </>
      )}
    </div>
  );
}
