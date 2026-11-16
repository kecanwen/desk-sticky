import { useCallback, useRef, useState } from "react";
import { NOTE_HEIGHT, NOTE_WIDTH } from "../constants";
import type { Note } from "../types";
import { clampNote, wallBoundsFromEl } from "../lib/notes";
import { FlipIcon, TrashIcon } from "./NoteIcons";

interface StickyNoteProps {
  note: Note;
  flipped: boolean;
  selected: boolean;
  onSelect: (id: string) => void;
  onFlip: (id: string, flipped: boolean) => void;
  onFlipToBack: (id: string) => void;
  onPeel: (id: string) => void;
  wallRef: React.RefObject<HTMLElement | null>;
  onText: (id: string, text: string) => void;
  onDetail: (id: string, detail: string) => void;
  onBringFront: (id: string) => number;
  onMoveLive: (id: string, x: number, y: number) => void;
  onMoveDone: (id: string) => void;
  onDropToDrawer: (id: string) => void;
  isOverDrawer: (clientX: number) => boolean;
  onDrawerHighlight: (ready: boolean) => void;
  focusFront?: boolean;
  focusBack?: boolean;
  onFocused?: () => void;
}

export function StickyNote({
  note,
  flipped,
  selected,
  onSelect,
  onFlip,
  onFlipToBack,
  onPeel,
  wallRef,
  onText,
  onDetail,
  onBringFront,
  onMoveLive,
  onMoveDone,
  onDropToDrawer,
  isOverDrawer,
  onDrawerHighlight,
  focusFront,
  focusBack,
  onFocused,
}: StickyNoteProps) {
  const elRef = useRef<HTMLElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFlipClick = useCallback(() => {
    onSelect(note.id);
    const next = !flipped;
    onFlip(note.id, next);
    if (next) onFlipToBack(note.id);
  }, [flipped, note.id, onFlip, onFlipToBack, onSelect]);

  const handlePeelClick = useCallback(() => {
    onSelect(note.id);
    onPeel(note.id);
  }, [note.id, onPeel, onSelect]);

  const onDragSurfacePointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (event.button !== 0) return;
      if ((event.target as HTMLElement).closest("textarea, button")) return;

      onSelect(note.id);
      const el = elRef.current;
      if (!el) return;

      let moved = false;
      const pointerId = event.pointerId;
      const startX = event.clientX;
      const startY = event.clientY;
      const origX = note.x;
      const origY = note.y;

      const z = onBringFront(note.id);
      setDragging(true);
      el.style.zIndex = String(z);
      el.setPointerCapture(pointerId);

      const onMove = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return;
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        if (Math.hypot(dx, dy) > 3) moved = true;
        const bounds = wallBoundsFromEl(wallRef.current);
        const draft = { ...note, x: origX + dx, y: origY + dy };
        clampNote(draft, bounds);
        el.style.left = `${draft.x}px`;
        el.style.top = `${draft.y}px`;
        onMoveLive(note.id, draft.x, draft.y);
        onDrawerHighlight(isOverDrawer(ev.clientX));
      };

      const onUp = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return;
        setDragging(false);
        try {
          el.releasePointerCapture(pointerId);
        } catch {
          /* noop */
        }
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        onDrawerHighlight(false);

        if (moved && isOverDrawer(ev.clientX)) {
          onDropToDrawer(note.id);
          return;
        }
        if (moved) onMoveDone(note.id);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [
      isOverDrawer,
      note,
      onBringFront,
      onDrawerHighlight,
      onDropToDrawer,
      onMoveDone,
      onMoveLive,
      onSelect,
      wallRef,
    ],
  );

  return (
    <article
      ref={elRef}
      className={`note ${note.color}${selected ? " is-selected" : ""}${dragging ? " is-dragging" : ""}`}
      data-id={note.id}
      style={{
        width: NOTE_WIDTH,
        height: NOTE_HEIGHT,
        left: note.x,
        top: note.y,
        zIndex: note.z || 10,
        transform: `rotate(${note.rotation || 0}deg)`,
      }}
      onPointerDown={() => onSelect(note.id)}
    >
      <div className="note-paper" onPointerDown={onDragSurfacePointerDown}>
        <div
          className="note-actions"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="note-icon-btn note-icon-btn-flip"
            aria-label={flipped ? "回到正面" : "翻到背面写细节"}
            title={flipped ? "回到正面" : "翻到背面"}
            onClick={(e) => {
              e.stopPropagation();
              handleFlipClick();
            }}
          >
            <FlipIcon />
            <span className="note-flip-label" aria-hidden="true">
              {flipped ? "正" : "背"}
            </span>
          </button>
          <button
            type="button"
            className="note-icon-btn note-icon-btn-trash"
            aria-label="撕碎销毁"
            title="销毁"
            onClick={(e) => {
              e.stopPropagation();
              handlePeelClick();
            }}
          >
            <TrashIcon />
          </button>
        </div>

        <div className={`note-flip${flipped ? " is-flipped" : ""}`}>
          <div className="note-flip-inner">
            <div className="face face-front">
              <textarea
                ref={(node) => {
                  if (focusFront && node) {
                    node.focus();
                    onFocused?.();
                  }
                }}
                className="note-text"
                maxLength={80}
                placeholder="写一句"
                value={note.text}
                aria-label="便利贴正面"
                onFocus={() => onSelect(note.id)}
                onPointerDown={(e) => e.stopPropagation()}
                onChange={(e) => onText(note.id, e.target.value)}
              />
            </div>
            <div className="face face-back">
              <textarea
                ref={(node) => {
                  if (focusBack && node) {
                    node.focus();
                    onFocused?.();
                  }
                }}
                className="note-detail"
                placeholder="写细节"
                value={note.detail}
                aria-label="便利贴背面"
                onFocus={() => onSelect(note.id)}
                onPointerDown={(e) => e.stopPropagation()}
                onChange={(e) => onDetail(note.id, e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}