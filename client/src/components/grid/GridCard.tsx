// One positioned, optionally draggable/resizable card on the grid. Dragging is dnd-kit
// (see GridCanvas for the DndContext + snap modifier); resizing is the hand-written
// useResizable hook, since dnd-kit doesn't do resize. Edit-mode chrome only renders in
// edit mode — a read-only grid stays visually clean.
//
// The Configure/Delete controls are a tap-to-reveal overlay centered over the whole
// card, not corner buttons — ported from the reference app's `.edit-overlay` pattern
// (there, hover-revealed; here, tap-revealed, since this app is touch-first and hover
// doesn't reliably exist). That's what a first pass of this component got wrong: a
// discrete drag-handle button top-left *and* a delete button top-right don't both fit at
// the 40px touch floor on a 1-cell-wide card (a standalone VU Meter, 64px) — two 40px
// buttons alone need 80px. Centering them in an overlay instead of a corner sidesteps
// the problem at any card width, the same way the reference app's version did.
import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripHorizontal, Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const [overlayOpen, setOverlayOpen] = useState(false);

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
        zIndex: isDragging || overlayOpen ? 'var(--z-raised)' : undefined,
      }}
      className={cn('group', isDragging && 'opacity-90')}
    >
      <div className={cn('h-full w-full', editMode && 'pointer-events-none')}>{renderCard(control)}</div>

      {editMode && (
        <>
          {/* Tap-catcher — fills the card behind the drag strip/resize corner, opens the
              overlay. Lower z than either, so both stay directly tappable. */}
          <button
            aria-label="Card options"
            onClick={() => setOverlayOpen(true)}
            className="absolute inset-0 z-0 rounded-lg"
          />

          {/* Drag strip — full width, so it never has to share a corner with another
              control. */}
          <div
            {...attributes}
            {...listeners}
            aria-label="Move card"
            className="absolute inset-x-0 top-0 z-10 h-10 touch-none rounded-t-lg bg-bg-overlay/70 shadow-(--shadow-border)"
          >
            <GripHorizontal className="mx-auto mt-2.5 size-4 text-ink-dim" />
          </div>

          <div
            {...resizeHandlers}
            aria-label="Resize card"
            className="absolute bottom-0 right-0 z-10 flex size-10 touch-none cursor-nwse-resize items-end justify-end p-2"
          >
            <div className="size-3 rounded-sm border-b-2 border-r-2 border-ink-dim" />
          </div>

          <div className="pointer-events-none absolute inset-0 rounded-lg outline outline-1 -outline-offset-1 outline-accent-blue/40" />

          {overlayOpen && (
            <div
              role="presentation"
              onClick={() => setOverlayOpen(false)}
              className="absolute inset-0 z-20 flex items-center justify-center gap-2 rounded-lg bg-black/70 backdrop-blur-[2px]"
            >
              {configurable && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOverlayOpen(false);
                    onConfigure(control);
                  }}
                >
                  <Settings className="size-4" />
                  Configure
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  removeControl(control.id);
                }}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
