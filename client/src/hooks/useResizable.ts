// Pointer-driven resize for a grid card's bottom-right handle. dnd-kit doesn't do resize
// (only drag), so this is hand-written — a small, bounded amount of code rather than a
// second library for one interaction.
import { useCallback, useRef, useState } from 'react';
import { CELL_STEP } from '@/components/grid/gridConstants';

export function useResizable(
  w: number,
  h: number,
  minW: number,
  minH: number,
  onResizeEnd: (w: number, h: number) => void,
) {
  const [live, setLive] = useState<{ w: number; h: number } | null>(null);
  const startRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation(); // don't also trigger the card's drag listener
      e.currentTarget.setPointerCapture(e.pointerId);
      startRef.current = { x: e.clientX, y: e.clientY, w, h };
    },
    [w, h],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const start = startRef.current;
      if (!start) return;
      const dCellsX = Math.round((e.clientX - start.x) / CELL_STEP);
      const dCellsY = Math.round((e.clientY - start.y) / CELL_STEP);
      setLive({
        w: Math.max(minW, start.w + dCellsX),
        h: Math.max(minH, start.h + dCellsY),
      });
    },
    [minW, minH],
  );

  const onPointerUp = useCallback(() => {
    if (live) onResizeEnd(live.w, live.h);
    startRef.current = null;
    setLive(null);
  }, [live, onResizeEnd]);

  return { liveSize: live, resizeHandlers: { onPointerDown, onPointerMove, onPointerUp } };
}
