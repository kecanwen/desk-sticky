import { useEffect } from "react";
import type { NoteColor } from "../types";

function isMod(e: KeyboardEvent): boolean {
  return e.metaKey || e.ctrlKey;
}

interface UseNoteShortcutsOptions {
  activeNoteId: string | null;
  demoteOpen: boolean;
  guideOpen: boolean;
  onColor: (id: string, color: NoteColor) => void;
  onPeel: (id: string) => void;
  onNeedSelection: () => void;
}

export function useNoteShortcuts({
  activeNoteId,
  demoteOpen,
  guideOpen,
  onColor,
  onPeel,
  onNeedSelection,
}: UseNoteShortcutsOptions): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (demoteOpen || guideOpen) return;
      if (!isMod(e)) return;

      if (!activeNoteId) {
        if (["1", "2", "3", "o"].includes(e.key.toLowerCase())) {
          e.preventDefault();
          onNeedSelection();
        }
        return;
      }

      const key = e.key.toLowerCase();
      if (key === "1") {
        e.preventDefault();
        onColor(activeNoteId, "red");
        return;
      }
      if (key === "2") {
        e.preventDefault();
        onColor(activeNoteId, "orange");
        return;
      }
      if (key === "3") {
        e.preventDefault();
        onColor(activeNoteId, "green");
        return;
      }
      if (key === "o") {
        e.preventDefault();
        onPeel(activeNoteId);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeNoteId, demoteOpen, guideOpen, onColor, onNeedSelection, onPeel]);
}