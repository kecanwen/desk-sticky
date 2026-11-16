import type { Note } from "../types";
import { COLOR_LABEL } from "../constants";

interface DemoteModalProps {
  open: boolean;
  redNotes: Note[];
  onDemote: (id: string, color: "orange" | "green") => void;
  onCancel: () => void;
}

export function DemoteModal({
  open,
  redNotes,
  onDemote,
  onCancel,
}: DemoteModalProps) {
  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="demoteTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <span className="modal-scrim" aria-hidden="true" />
      <div className="modal-card">
        <h2 id="demoteTitle">红色已满（最多 3 张）</h2>
        <p className="modal-desc">
          选一张墙上的红贴降为橙或绿，再给新的事项标红。
        </p>
        <ul className="demote-list">
          {redNotes.map((n) => (
            <li key={n.id} className="demote-row">
              <p className="demote-text">
                {n.text?.trim() || "（还没写字的红贴）"}
              </p>
              <div className="demote-actions">
                <button
                  type="button"
                  className="pill-btn orange"
                  onClick={() => onDemote(n.id, "orange")}
                >
                  改为{COLOR_LABEL.orange}
                </button>
                <button
                  type="button"
                  className="pill-btn green"
                  onClick={() => onDemote(n.id, "green")}
                >
                  改为{COLOR_LABEL.green}
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="modal-footer">
          <button type="button" className="text-btn" onClick={onCancel}>
            取消
          </button>
        </div>
      </div>
    </div>
  );
}