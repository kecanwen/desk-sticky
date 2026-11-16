import { forwardRef } from "react";
import type { Note } from "../types";
import { COLOR_LABEL } from "../constants";

interface DrawerProps {
  open: boolean;
  dropReady: boolean;
  catching: boolean;
  notes: Note[];
  onToggle: () => void;
  onRestore: (id: string) => void;
}

export const Drawer = forwardRef<HTMLButtonElement, DrawerProps>(
  function Drawer(
    { open, dropReady, catching, notes, onToggle, onRestore },
    binRef,
  ) {
    const done = notes
      .filter((n) => n.status === "drawer")
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

    return (
      <aside
        className={`drawer${open ? " is-open" : ""}${dropReady ? " is-drop-ready" : ""}${catching ? " is-catching" : ""}`}
      >
        <button
          ref={binRef}
          type="button"
          className="drawer-tab bin-tab"
          aria-expanded={open}
          aria-controls="drawerPanel"
          onClick={onToggle}
        >
          <span className="bin-tab-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 8h12l-1.2 10.5a1.5 1.5 0 0 1-1.49 1.3H8.7a1.5 1.5 0 0 1-1.49-1.3L6 8z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M9.5 8V6.2A1.8 1.8 0 0 1 11.3 4.5h1.4a1.8 1.8 0 0 1 1.8 1.7V8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M4.5 8h15"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="drawer-tab-text">{open ? "收起" : "废纸篓"}</span>
          {done.length > 0 ? (
            <span className="drawer-badge" aria-label={`${done.length} 张已销毁`}>
              {done.length}
            </span>
          ) : null}
        </button>

        <div className="drawer-sheet" id="drawerPanel">
          <header className="drawer-header">
            <h2>废纸篓</h2>
            <p>销毁的便利贴会在这里存档，还能贴回墙上。</p>
          </header>
          <div className="drawer-body">
            {!done.length ? (
              <p className="drawer-empty">废纸篓是空的。</p>
            ) : (
              <ul className="drawer-items">
                {done.map((note) => (
                  <li key={note.id} className="drawer-item">
                    <span className={`drawer-item-chip ${note.color}`}>
                      {COLOR_LABEL[note.color]}
                    </span>
                    <p
                      className={`drawer-item-text${note.text?.trim() ? "" : " is-muted"}`}
                    >
                      {note.text?.trim() || "空白便利贴"}
                    </p>
                    <button
                      type="button"
                      className="drawer-item-restore"
                      onClick={() => onRestore(note.id)}
                    >
                      贴回墙上
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </aside>
    );
  },
);