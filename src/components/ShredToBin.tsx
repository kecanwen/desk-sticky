import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import type { NoteColor } from "../types";

const STRIP_COUNT = 8;
const DURATION_MS = 920;

export interface ShredPayload {
  id: string;
  color: NoteColor;
  from: DOMRect;
  to: DOMRect;
}

interface ShredToBinProps {
  payload: ShredPayload;
  onComplete: (id: string) => void;
}

export function ShredToBin({ payload, onComplete }: ShredToBinProps) {
  const { id, color, from, to } = payload;

  const strips = useMemo(() => {
    const stripW = from.width / STRIP_COUNT;
    const targetX = to.left + to.width / 2;
    const targetY = to.top + to.height / 2;
    return Array.from({ length: STRIP_COUNT }, (_, i) => {
      const x = from.left + stripW * i;
      const cx = x + stripW / 2;
      const cy = from.top + from.height / 2;
      return {
        i,
        left: x,
        top: from.top,
        width: stripW,
        height: from.height,
        dx: targetX - cx,
        dy: targetY - cy,
        delay: i * 35,
        spin: (i % 2 === 0 ? 1 : -1) * (180 + i * 24),
      };
    });
  }, [from, to]);

  useEffect(() => {
    const timer = window.setTimeout(() => onComplete(id), DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [id, onComplete]);

  return createPortal(
    <div className="shred-overlay" aria-hidden="true">
      {strips.map((s) => (
        <div
          key={s.i}
          className={`shred-strip ${color}`}
          style={
            {
              left: s.left,
              top: s.top,
              width: s.width,
              height: s.height,
              "--dx": `${s.dx}px`,
              "--dy": `${s.dy}px`,
              "--spin": `${s.spin}deg`,
              "--delay": `${s.delay}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>,
    document.body,
  );
}