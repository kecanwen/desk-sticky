export type NoteColor = "red" | "orange" | "green";
export type NoteStatus = "wall" | "drawer";

export interface Note {
  id: string;
  text: string;
  detail: string;
  color: NoteColor;
  x: number;
  y: number;
  rotation: number;
  z: number;
  status: NoteStatus;
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
}

export interface PendingColor {
  id: string;
  color: NoteColor;
}

export interface WallBounds {
  width: number;
  height: number;
}