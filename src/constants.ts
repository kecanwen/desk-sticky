import type { NoteColor } from "./types";

export const STORAGE_KEY = "desk-sticky-notes-v1";
export const NOTE_WIDTH = 232;
export const NOTE_HEIGHT = 232;
export const MAX_RED = 3;
export const MAX_OVERLAP = 0.45;
export const COLORS: NoteColor[] = ["red", "orange", "green"];
export const COLOR_LABEL: Record<NoteColor, string> = {
  red: "红",
  orange: "橙",
  green: "绿",
};
export const COLOR_HINT: Record<NoteColor, string> = {
  red: "最紧急（墙上最多 3 张）",
  orange: "要做，但不赶",
  green: "长期、慢慢来",
};

export function modKeyLabel(): string {
  if (typeof navigator === "undefined") return "⌘";
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform) ? "⌘" : "Ctrl";
}

export interface ShortcutDef {
  id: string;
  key: string;
  title: string;
  detail: string;
}

export const SHORTCUT_DEFS: ShortcutDef[] = [
  { id: "red", key: "1", title: "红色", detail: COLOR_HINT.red },
  { id: "orange", key: "2", title: "橙色", detail: COLOR_HINT.orange },
  { id: "green", key: "3", title: "绿色", detail: COLOR_HINT.green },
  {
    id: "over",
    key: "O",
    title: "揭下（Over）",
    detail: "撕碎销毁：飞进右侧废纸篓，之后还可贴回墙上。",
  },
];