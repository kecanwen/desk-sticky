import { useCallback, useEffect, useRef, useState } from "react";
import { DemoteModal } from "./components/DemoteModal";
import { Drawer } from "./components/Drawer";
import { type ShredPayload, ShredToBin } from "./components/ShredToBin";
import { ShortcutsGuide } from "./components/ShortcutsGuide";
import { NotePadStack } from "./components/NotePadStack";
import { StickyNote } from "./components/StickyNote";
import { modKeyLabel } from "./constants";
import { useNoteShortcuts } from "./hooks/useNoteShortcuts";
import { useStickyNotes } from "./hooks/useStickyNotes";

export default function App() {
  const wallRef = useRef<HTMLDivElement>(null);
  const binRef = useRef<HTMLButtonElement>(null);
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [focusFrontId, setFocusFrontId] = useState<string | null>(null);
  const [focusBackId, setFocusBackId] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(true);
  const [shred, setShred] = useState<ShredPayload | null>(null);
  const [binCatch, setBinCatch] = useState(false);

  const desk = useStickyNotes(wallRef);
  const wallNotes = desk.notes.filter(
    (n) => n.status === "wall" && n.id !== shred?.id,
  );
  const mod = modKeyLabel();

  const handleFlip = useCallback((id: string, on: boolean) => {
    setFlipped((prev) => ({ ...prev, [id]: on }));
  }, []);

  const handleNewNote = useCallback(() => {
    const id = desk.addNote();
    setActiveNoteId(id);
    setFocusFrontId(id);
  }, [desk]);

  const clearFocusFlags = useCallback(() => {
    setFocusFrontId(null);
    setFocusBackId(null);
  }, []);

  const completeShred = useCallback(
    (id: string) => {
      desk.peelOff(id);
      setShred(null);
      setBinCatch(true);
      window.setTimeout(() => setBinCatch(false), 550);
    },
    [desk],
  );

  const requestDestroy = useCallback(
    (id: string) => {
      if (shred) return;
      const note = desk.notes.find((n) => n.id === id && n.status === "wall");
      if (!note) return;

      const el = document.querySelector(
        `[data-id="${CSS.escape(id)}"]`,
      ) as HTMLElement | null;
      const bin = binRef.current;

      if (!el || !bin) {
        desk.peelOff(id);
        return;
      }

      if (activeNoteId === id) setActiveNoteId(null);

      setShred({
        id,
        color: note.color,
        from: el.getBoundingClientRect(),
        to: bin.getBoundingClientRect(),
      });
    },
    [activeNoteId, desk, shred],
  );

  useEffect(() => {
    if (activeNoteId && !wallNotes.some((n) => n.id === activeNoteId)) {
      if (!shred || activeNoteId !== shred.id) setActiveNoteId(null);
    }
  }, [activeNoteId, shred, wallNotes]);

  useNoteShortcuts({
    activeNoteId,
    demoteOpen: desk.demoteOpen,
    guideOpen,
    onColor: desk.setColor,
    onPeel: requestDestroy,
    onNeedSelection: () => {
      desk.showToast("请先点选墙上的一张便利贴");
    },
  });

  return (
    <div className="app-shell">
      <main className="desk">
        <header className="desk-header">
          <div className="desk-header-main">
            <h1 className="desk-title">课桌便利贴</h1>
            <p className="desk-subtitle">
              纯色便签 — 右上角翻面 / 销毁，飞入右侧废纸篓
            </p>
          </div>
          <button
            type="button"
            className="guide-open-btn"
            onClick={() => setGuideOpen(true)}
          >
            说明书
          </button>
          <p className="desk-hint" aria-live="polite">
            悬停右上角操作 · <kbd>{mod}</kbd>+<kbd>1</kbd>/<kbd>2</kbd>/<kbd>3</kbd>{" "}
            颜色 · <kbd>{mod}</kbd>+<kbd>O</kbd> 销毁
          </p>
        </header>

        <div ref={wallRef} className="wall" aria-label="便利贴墙">
          {wallNotes.map((note) => (
            <StickyNote
              key={note.id}
              note={note}
              flipped={!!flipped[note.id]}
              selected={activeNoteId === note.id}
              onSelect={setActiveNoteId}
              onFlip={handleFlip}
              onFlipToBack={setFocusBackId}
              onPeel={requestDestroy}
              wallRef={wallRef}
              onText={desk.updateNoteText}
              onDetail={desk.updateNoteDetail}
              onBringFront={desk.bringToFront}
              onMoveLive={desk.moveNoteLive}
              onMoveDone={desk.moveNoteDone}
              onDropToDrawer={requestDestroy}
              isOverDrawer={desk.isOverDrawer}
              onDrawerHighlight={desk.setDropReady}
              focusFront={focusFrontId === note.id}
              focusBack={focusBackId === note.id}
              onFocused={clearFocusFlags}
            />
          ))}
        </div>

        <NotePadStack onClick={handleNewNote} />

        <Drawer
          ref={binRef}
          open={desk.drawerOpen}
          dropReady={desk.dropReady}
          catching={binCatch}
          notes={desk.notes}
          onToggle={() => desk.setDrawerOpen((v) => !v)}
          onRestore={desk.restoreFromDrawer}
        />
      </main>

      {shred ? (
        <ShredToBin payload={shred} onComplete={completeShred} />
      ) : null}

      <ShortcutsGuide open={guideOpen} onClose={() => setGuideOpen(false)} />

      <DemoteModal
        open={desk.demoteOpen}
        redNotes={desk.redWallNotes}
        onDemote={desk.finishDemote}
        onCancel={desk.closeDemoteModal}
      />

      {desk.toast ? (
        <div className="toast" role="status">
          {desk.toast}
        </div>
      ) : null}
    </div>
  );
}