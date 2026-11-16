import { useCallback, useEffect, useRef, useState } from "react";
import type { Note, NoteColor, PendingColor } from "../types";
import { MAX_RED } from "../constants";
import {
  findFreeSpot,
  loadNotesFromStorage,
  rand,
  redNotes,
  saveNotesToStorage,
  uid,
  unspreadNotes,
  wallBoundsFromEl,
} from "../lib/notes";

export function useStickyNotes(wallRef: React.RefObject<HTMLElement | null>) {
  const [{ notes, topZ }, setState] = useState(() => loadNotesFromStorage());
  const topZRef = useRef(topZ);
  topZRef.current = topZ;

  const [pendingColor, setPendingColor] = useState<PendingColor | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dropReady, setDropReady] = useState(false);
  const [demoteOpen, setDemoteOpen] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef(0);

  const getBounds = useCallback(
    () => wallBoundsFromEl(wallRef.current),
    [wallRef],
  );

  const withUnspread = useCallback(
    (next: Note[]) => unspreadNotes(next, getBounds()),
    [getBounds],
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2200);
  }, []);

  const bringToFront = useCallback((id: string) => {
    topZRef.current += 1;
    const z = topZRef.current;
    setState((s) => {
      const next = s.notes.map((n) => (n.id === id ? { ...n, z } : n));
      saveNotesToStorage(next);
      return { notes: next, topZ: z };
    });
    return z;
  }, []);

  const canPaintRed = useCallback(
    (note: Note) => {
      if (note.color === "red") return true;
      return redNotes(notes).length < MAX_RED;
    },
    [notes],
  );

  const stickBack = useCallback(
    (id: string) => {
      setState((s) => {
        const draft = s.notes.map((n) => ({ ...n }));
        const note = draft.find((n) => n.id === id);
        if (!note) return s;
        const spot = findFreeSpot(draft, getBounds());
        note.status = "wall";
        note.x = Number.isFinite(note.x) ? note.x : spot.x;
        note.y = Number.isFinite(note.y) ? note.y : spot.y;
        note.completedAt = null;
        note.updatedAt = Date.now();
        topZRef.current += 1;
        note.z = topZRef.current;
        const spread = withUnspread(draft);
        saveNotesToStorage(spread);
        return { notes: spread, topZ: topZRef.current };
      });
    },
    [getBounds, withUnspread],
  );

  const setColor = useCallback(
    (id: string, color: NoteColor, { skipDemote = false } = {}) => {
      setState((s) => {
        const draft = s.notes.map((n) => ({ ...n }));
        const note = draft.find((n) => n.id === id);
        if (!note || note.color === color) return s;
        if (color === "red" && !canPaintRed(note)) {
          if (!skipDemote) {
            setPendingColor({ id, color });
            setDemoteOpen(true);
          }
          return s;
        }
        note.color = color;
        note.updatedAt = Date.now();
        saveNotesToStorage(draft);
        return { ...s, notes: draft };
      });
    },
    [canPaintRed],
  );

  const finishDemote = useCallback(
    (redNoteId: string, nextColor: NoteColor) => {
      const pending = pendingColor;
      let shouldStickBack: string | null = null;

      setState((s) => {
        const draft = s.notes.map((n) => ({ ...n }));
        const redNote = draft.find((n) => n.id === redNoteId);
        if (redNote) {
          redNote.color = nextColor;
          redNote.updatedAt = Date.now();
        }
        if (pending) {
          const target = draft.find((n) => n.id === pending.id);
          if (target) {
            target.color = pending.color;
            target.updatedAt = Date.now();
            if (target.status === "drawer") shouldStickBack = target.id;
          }
        }
        saveNotesToStorage(draft);
        return { ...s, notes: draft };
      });

      setPendingColor(null);
      setDemoteOpen(false);

      if (shouldStickBack) {
        stickBack(shouldStickBack);
      }
    },
    [pendingColor, stickBack],
  );

  const peelOff = useCallback(
    (id: string) => {
      setState((s) => {
        const draft = s.notes.map((n) => ({ ...n }));
        const note = draft.find((n) => n.id === id);
        if (!note) return s;
        note.status = "drawer";
        note.completedAt = Date.now();
        note.updatedAt = Date.now();
        saveNotesToStorage(draft);
        return { ...s, notes: draft };
      });
    },
    [],
  );

  const addNote = useCallback(() => {
    const spot = findFreeSpot(notes, getBounds());
    const note: Note = {
      id: uid(),
      text: "",
      detail: "",
      color: "orange",
      x: spot.x,
      y: spot.y,
      rotation: rand(-6, 6),
      z: ++topZRef.current,
      status: "wall",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      completedAt: null,
    };
    setState((s) => {
      const spread = withUnspread([...s.notes, note]);
      saveNotesToStorage(spread);
      return { notes: spread, topZ: topZRef.current };
    });
    return note.id;
  }, [getBounds, notes, withUnspread]);

  const updateNoteText = useCallback((id: string, text: string) => {
    setState((s) => {
      const next = s.notes.map((n) =>
        n.id === id ? { ...n, text, updatedAt: Date.now() } : n,
      );
      saveNotesToStorage(next);
      return { ...s, notes: next };
    });
  }, []);

  const updateNoteDetail = useCallback((id: string, detail: string) => {
    setState((s) => {
      const next = s.notes.map((n) =>
        n.id === id ? { ...n, detail, updatedAt: Date.now() } : n,
      );
      saveNotesToStorage(next);
      return { ...s, notes: next };
    });
  }, []);

  const moveNoteLive = useCallback((id: string, x: number, y: number) => {
    setState((s) => ({
      ...s,
      notes: s.notes.map((n) => (n.id === id ? { ...n, x, y } : n)),
    }));
  }, []);

  const moveNoteDone = useCallback(
    (_id: string) => {
      setState((s) => {
        const spread = withUnspread(s.notes.map((n) => ({ ...n })));
        saveNotesToStorage(spread);
        return { ...s, notes: spread };
      });
    },
    [withUnspread],
  );

  const restoreFromDrawer = useCallback(
    (id: string) => {
      const note = notes.find((n) => n.id === id);
      if (!note) return;
      if (note.color === "red" && !canPaintRed(note)) {
        setPendingColor({ id, color: "red" });
        showToast("红贴已经有 3 张了，先把墙上的一张改成橙或绿，再贴回来。");
        setDemoteOpen(true);
        return;
      }
      stickBack(id);
    },
    [canPaintRed, notes, showToast, stickBack],
  );

  const closeDemoteModal = useCallback(() => {
    setDemoteOpen(false);
    setPendingColor(null);
  }, []);

  const isOverDrawer = useCallback(
    (clientX: number) =>
      clientX > window.innerWidth - (drawerOpen ? 340 : 72),
    [drawerOpen],
  );

  useEffect(() => {
    setState((s) => {
      const spread = withUnspread(s.notes.map((n) => ({ ...n })));
      saveNotesToStorage(spread);
      return { ...s, notes: spread };
    });
    // mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onResize = () => {
      setState((s) => {
        const spread = withUnspread(s.notes.map((n) => ({ ...n })));
        saveNotesToStorage(spread);
        return { ...s, notes: spread };
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [withUnspread]);

  useEffect(
    () => () => window.clearTimeout(toastTimer.current),
    [],
  );

  return {
    notes,
    drawerOpen,
    setDrawerOpen,
    dropReady,
    setDropReady,
    demoteOpen,
    toast,
    redWallNotes: redNotes(notes),
    addNote,
    setColor,
    peelOff,
    restoreFromDrawer,
    finishDemote,
    closeDemoteModal,
    updateNoteText,
    updateNoteDetail,
    moveNoteLive,
    moveNoteDone,
    bringToFront,
    isOverDrawer,
    showToast,
  };
}