// The drag-to-set-gain track + thumb, with no Panel wrapper of its own — shared by the
// standalone Fader card and by StripPanel/BusPanel, which embed it directly rather than
// nesting a second Panel inside their own (see deckling-interface-polish/surfaces.md on
// concentric radius / not nesting panels three deep).
//
// Ported from the reference app's fader widget, which "worked really well": a unity
// (0dB) mark on the track, dB scale tick labels beside it, double-tap/click to reset to
// 0dB, and — when `levels` is supplied — a thin segmented VU column built into the same
// control, the way a real strip's fader and meter sit together. A bare track+thumb with
// none of that was a real regression from the reference, not a simplification worth
// keeping.
//
// `useFaderDrag` is the single source of truth for a fader's live value — call it once
// per fader instance at the card level, and pass its result down to both the dB readout
// and <FaderTrack>, so the two never fall out of sync during a drag.
import { useCallback, useEffect, useRef, useState, type PointerEvent, type KeyboardEvent } from 'react';
import { vmSet } from '@/lib/socket';
import { GAIN_MAX, GAIN_MIN, VU_SEGMENT_COUNT, VU_SEGMENT_RED, VU_SEGMENT_YELLOW, litSegments } from '@/lib/vm';
import { cn } from '@/lib/utils';

const DOUBLE_TAP_MS = 300;
const MARKS = [12, 0, -12, -24, -48, -60];

function ratioToDb(ratio: number): number {
  return Math.round((GAIN_MIN + ratio * (GAIN_MAX - GAIN_MIN)) * 10) / 10;
}

function dbToRatio(db: number): number {
  return Math.min(1, Math.max(0, (db - GAIN_MIN) / (GAIN_MAX - GAIN_MIN)));
}

const UNITY_RATIO = dbToRatio(0);

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
  const lastTapRef = useRef(0);

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

  const reset = useCallback(() => {
    setDragDb(0);
    pendingRef.current = 0;
    if (rafRef.current === undefined) rafRef.current = requestAnimationFrame(flush);
  }, [flush]);

  useEffect(() => () => rafRef.current && cancelAnimationFrame(rafRef.current), []);

  const handlers: FaderDragHandlers = {
    ref: trackRef,
    onPointerDown: (e) => {
      if (!connected) return;
      const now = Date.now();
      if (now - lastTapRef.current < DOUBLE_TAP_MS) {
        lastTapRef.current = 0;
        reset();
        return;
      }
      lastTapRef.current = now;
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

function VuColumn({ linear }: { linear: number }) {
  const lit = litSegments(linear);
  return (
    <div className="flex w-2.5 flex-col-reverse gap-px">
      {Array.from({ length: VU_SEGMENT_COUNT }, (_, i) => (
        <div
          key={i}
          className={cn(
            'flex-1 rounded-[1px]',
            i < lit
              ? i >= VU_SEGMENT_RED
                ? 'bg-accent-red'
                : i >= VU_SEGMENT_YELLOW
                  ? 'bg-accent-amber'
                  : 'bg-accent-green'
              : 'bg-bg-elevated',
          )}
        />
      ))}
    </div>
  );
}

export function FaderTrack({
  db,
  ratio,
  handlers,
  connected,
  label,
  levels,
  showMarks = true,
}: {
  db: number;
  ratio: number;
  handlers: FaderDragHandlers;
  connected: boolean;
  label: string;
  levels?: [number, number];
  showMarks?: boolean;
}) {
  return (
    <div className="flex h-full w-full items-stretch gap-1.5">
      {levels && <VuColumn linear={Math.max(...levels)} />}

      <div
        {...handlers}
        role="slider"
        aria-label={`${label} gain`}
        aria-valuemin={GAIN_MIN}
        aria-valuemax={GAIN_MAX}
        aria-valuenow={db}
        aria-disabled={!connected}
        tabIndex={connected ? 0 : -1}
        className={cn('relative h-full flex-1 touch-none rounded-md', !connected && 'pointer-events-none opacity-40')}
      >
        <div className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 rounded-full bg-line" />
        {/* Unity (0dB) mark — a fixed reference line, distinct from the live thumb. */}
        <div
          className="absolute left-1/2 h-px w-4 -translate-x-1/2 bg-ink-faint"
          style={{ bottom: `${UNITY_RATIO * 100}%` }}
        />
        <div
          className="absolute left-1/2 h-6 w-10 -translate-x-1/2 translate-y-1/2 rounded-md bg-accent-blue shadow-(--shadow-border)"
          style={{ bottom: `${ratio * 100}%` }}
        />
      </div>

      {showMarks && (
        <div className="relative w-6 shrink-0">
          {MARKS.map((m) => (
            <span
              key={m}
              className="absolute -translate-y-1/2 font-mono text-[9px] text-ink-faint"
              style={{ bottom: `${dbToRatio(m) * 100}%` }}
            >
              {m === GAIN_MIN ? '-∞' : m}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
