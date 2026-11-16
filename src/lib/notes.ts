import {
  COLORS,
  MAX_OVERLAP,
  NOTE_HEIGHT,
  NOTE_WIDTH,
  STORAGE_KEY,
} from "../constants";
import type { Note, WallBounds } from "../types";

const NOTE_AREA = NOTE_WIDTH * NOTE_HEIGHT;

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function normalizeNotes(raw: unknown[]): Note[] {
  return raw.map((item) => {
    const n = item as Note;
    if (!COLORS.includes(n.color)) n.color = "orange";
    if (n.status !== "drawer") n.status = "wall";
    n.z = Number(n.z) || 10;
    n.rotation = Number.isFinite(n.rotation) ? n.rotation : rand(-4, 4);
    return n;
  });
}

export function loadNotesFromStorage(): { notes: Note[]; topZ: number } {
  let notes: Note[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : { notes: [] };
    notes = Array.isArray(data.notes) ? normalizeNotes(data.notes) : [];
  } catch {
    notes = [];
  }
  const topZ = notes.reduce((max, n) => Math.max(max, n.z || 0), 10);
  return { notes, topZ };
}

export function saveNotesToStorage(notes: Note[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ notes }));
}

export function clampNote(n: Note, bounds: WallBounds): void {
  const maxX = Math.max(0, bounds.width - NOTE_WIDTH);
  const maxY = Math.max(0, bounds.height - NOTE_HEIGHT);
  n.x = Math.min(maxX, Math.max(0, n.x));
  n.y = Math.min(maxY, Math.max(0, n.y));
}

export function overlapRatio(
  a: Pick<Note, "x" | "y">,
  b: Pick<Note, "x" | "y">,
): number {
  const w = Math.max(
    0,
    Math.min(a.x + NOTE_WIDTH, b.x + NOTE_WIDTH) - Math.max(a.x, b.x),
  );
  const h = Math.max(
    0,
    Math.min(a.y + NOTE_HEIGHT, b.y + NOTE_HEIGHT) - Math.max(a.y, b.y),
  );
  return (w * h) / NOTE_AREA;
}

export function unspreadNotes(notes: Note[], bounds: WallBounds): Note[] {
  const next = notes.map((n) => ({ ...n }));
  const wallNotes = next.filter((n) => n.status === "wall");
  wallNotes.forEach((n) => clampNote(n, bounds));

  for (let iter = 0; iter < 50; iter += 1) {
    let moved = false;
    for (let i = 0; i < wallNotes.length; i += 1) {
      for (let j = i + 1; j < wallNotes.length; j += 1) {
        const a = wallNotes[i];
        const b = wallNotes[j];
        if (overlapRatio(a, b) <= MAX_OVERLAP) continue;
        const dx = b.x + NOTE_WIDTH / 2 - (a.x + NOTE_WIDTH / 2) || 12;
        const dy = b.y + NOTE_HEIGHT / 2 - (a.y + NOTE_HEIGHT / 2) || 8;
        const len = Math.hypot(dx, dy) || 1;
        b.x += (dx / len) * 20;
        b.y += (dy / len) * 20;
        clampNote(b, bounds);
        moved = true;
      }
    }
    if (!moved) break;
  }
  return next;
}

export function findFreeSpot(
  notes: Note[],
  bounds: WallBounds,
): { x: number; y: number } {
  const wallNotes = notes.filter((n) => n.status === "wall");
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const x = rand(12, Math.max(12, bounds.width - NOTE_WIDTH - 12));
    const y = rand(12, Math.max(12, bounds.height - NOTE_HEIGHT - 12));
    const probe = { x, y };
    if (wallNotes.every((n) => overlapRatio(n, probe) <= 0.2)) return { x, y };
  }
  return {
    x: rand(20, Math.max(20, bounds.width - NOTE_WIDTH - 20)),
    y: rand(20, Math.max(20, bounds.height - NOTE_HEIGHT - 20)),
  };
}

export function redNotes(notes: Note[]): Note[] {
  return notes.filter((n) => n.status === "wall" && n.color === "red");
}

export function wallBoundsFromEl(el: HTMLElement | null): WallBounds {
  if (!el) return { width: NOTE_WIDTH, height: NOTE_HEIGHT };
  const r = el.getBoundingClientRect();
  return {
    width: Math.max(NOTE_WIDTH, r.width),
    height: Math.max(NOTE_HEIGHT, r.height),
  };
}