// One place for the grid's cell math — GridCard and GridCanvas must agree on this or
// dragging/resizing will visibly disagree with where a card actually lands.
export const CELL_SIZE = 64;
export const CELL_GAP = 12;
export const CELL_STEP = CELL_SIZE + CELL_GAP;

export function cellsToPx(cells: number): number {
  return cells * CELL_SIZE + Math.max(0, cells - 1) * CELL_GAP;
}
