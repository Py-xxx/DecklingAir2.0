// The drag-to-set-gain track + thumb, with no Panel wrapper of its own — shared by the
// standalone Fader card and by StripPanel/BusPanel, which embed it directly rather than
// nesting a second Panel inside their own (see deckling-interface-polish/surfaces.md on
// concentric radius / not nesting panels three deep).
//
// `useFaderDrag` is the single source of truth for a fader's live value — call it once
// per fader instance at the card level, and pass its result down to both the dB readout
// and <FaderTrack>, so the two never fall out of sync during a drag.
import { useCallback, useEffect, useRef, useState, type PointerEvent, type KeyboardEvent } from 'react';
import { vmSet } from '@/lib/socket';
import { GAIN_MAX, GAIN_MIN } from '@/lib/vm';
import { cn } from '@/lib/utils';

function ratioToDb(ratio: number): number {
  return Math.round((GAIN_MIN + ratio * (GAIN_MAX - GAIN_MIN)) * 10) / 10;
}

function dbToRatio(db: number): number {
  return Math.min(1, Math.max(0, (db - GAIN_MIN) / (GAIN_MAX - GAIN_MIN)));
}

export interface FaderDragHandlers {
  ref: React.RefObject<HTMLDivElement>;
  onPointerDown: (e: PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
}

export function useFaderDrag(param: string, serverDb: number, connected: boolean) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragDb, setDragDb] = useState<number | null>(null);
  const pendingRef = useRef<number | null>(null);
  const rafRef = useRef<number>();

  const db = dragDb ?? serverDb;

  const flush = useCallback(() => {
    rafRef.current = undefined;
    if (pendingRef.current === null) return;
    vmSet(param, pendingRef.current);
    pendingRef.current = null;
  }, [param]);

  const applyFromClientY = useCallback(
    (clientY: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const r = 1 - Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
      const nextDb = ratioToDb(r);
      setDragDb(nextDb);
      pendingRef.current = nextDb;
      if (rafRef.current === undefined) rafRef.current = requestAnimationFrame(flush);
    },
    [flush],
  );

  useEffect(() => () => rafRef.current && cancelAnimationFrame(rafRef.current), []);

  const handlers: FaderDragHandlers = {
    ref: trackRef,
    onPointerDown: (e) => {
      if (!connected) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      applyFromClientY(e.clientY);
    },
    onPointerMove: (e) => {
      if (!connected || e.buttons !== 1) return;
      applyFromClientY(e.clientY);
    },
    onPointerUp: () => setDragDb(null),
    onKeyDown: (e) => {
      if (!connected) return;
      if (e.key === 'ArrowUp') vmSet(param, Math.min(GAIN_MAX, db + 1));
      if (e.key === 'ArrowDown') vmSet(param, Math.max(GAIN_MIN, db - 1));
    },
  };

  return { db, ratio: dbToRatio(db), handlers };
}

export function FaderTrack({
  db,
  ratio,
  handlers,
  connected,
  label,
}: {
  db: number;
  ratio: number;
  handlers: FaderDragHandlers;
  connected: boolean;
  label: string;
}) {
  return (
    <div
      {...handlers}
      role="slider"
      aria-label={`${label} gain`}
      aria-valuemin={GAIN_MIN}
      aria-valuemax={GAIN_MAX}
      aria-valuenow={db}
      aria-disabled={!connected}
      tabIndex={connected ? 0 : -1}
      className={cn('relative h-full w-full touch-none rounded-md', !connected && 'pointer-events-none opacity-40')}
    >
      <div className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 rounded-full bg-line" />
      <div
        className="absolute left-1/2 h-6 w-10 -translate-x-1/2 translate-y-1/2 rounded-md bg-accent-blue shadow-(--shadow-border)"
        style={{ bottom: `${ratio * 100}%` }}
      />
    </div>
  );
}
