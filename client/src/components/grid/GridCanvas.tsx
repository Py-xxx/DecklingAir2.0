// The editable page grid — a fresh implementation of the reference app's drag/resize
// card grid (which used hand-rolled pixel/snap gesture code). Dragging is dnd-kit,
// snapped to the cell grid via a modifier; resizing is GridCard's own pointer handling.
import { useState } from 'react';
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { createSnapModifier, restrictToParentElement } from '@dnd-kit/modifiers';
import { GridCard } from '@/components/grid/GridCard';
import { CardConfigDialog, type ConfigTarget } from '@/components/grid/CardConfigDialog';
import { CELL_STEP, cellsToPx } from '@/components/grid/gridConstants';
import { useLayoutStore } from '@/stores/useLayoutStore';
import type { GridControl, Page } from '@/lib/layout';

const snapToGrid = createSnapModifier(CELL_STEP);

export function GridCanvas({ page, editMode }: { page: Page; editMode: boolean }) {
  const updateControl = useLayoutStore((s) => s.updateControl);
  const updateControlConfig = useLayoutStore((s) => s.updateControlConfig);
  const removeControl = useLayoutStore((s) => s.removeControl);

  const [editing, setEditing] = useState<{ id: string; target: ConfigTarget } | null>(null);

  const maxRow = page.controls.reduce((max, c) => Math.max(max, c.y + c.h), 8);
  const maxCol = page.controls.reduce((max, c) => Math.max(max, c.x + c.w), 6);

  function handleDragEnd(event: DragEndEvent) {
    const { active, delta } = event;
    const control = page.controls.find((c) => c.id === active.id);
    if (!control) return;

    const dCellsX = Math.round(delta.x / CELL_STEP);
    const dCellsY = Math.round(delta.y / CELL_STEP);
    if (!dCellsX && !dCellsY) return;

    updateControl(control.id, {
      x: Math.max(0, control.x + dCellsX),
      y: Math.max(0, control.y + dCellsY),
    });
  }

  function handleConfigure(control: GridControl) {
    setEditing({ id: control.id, target: { type: control.type, initialConfig: control.config } });
  }

  return (
    <DndContext modifiers={[snapToGrid, restrictToParentElement]} onDragEnd={handleDragEnd}>
      <div
        className="relative"
        style={{ minHeight: cellsToPx(maxRow) + 96, minWidth: cellsToPx(maxCol) }}
      >
        {page.controls.length === 0 ? (
          <EmptyPage editMode={editMode} />
        ) : (
          page.controls.map((control) => (
            <GridCard key={control.id} control={control} editMode={editMode} onConfigure={handleConfigure} />
          ))
        )}
      </div>

      <CardConfigDialog
        target={editing?.target ?? null}
        onClose={() => setEditing(null)}
        onSave={(config) => {
          if (editing) updateControlConfig(editing.id, config);
          setEditing(null);
        }}
        onDelete={
          editing
            ? () => {
                removeControl(editing.id);
                setEditing(null);
              }
            : undefined
        }
      />
    </DndContext>
  );
}

function EmptyPage({ editMode }: { editMode: boolean }) {
  return (
    <div className="flex h-40 items-center justify-center font-sans text-sm text-ink-dim">
      {editMode ? 'No cards yet — add one from the panel above' : 'No cards on this page'}
    </div>
  );
}
