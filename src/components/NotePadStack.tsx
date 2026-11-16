interface NotePadStackProps {
  onClick: () => void;
}

export function NotePadStack({ onClick }: NotePadStackProps) {
  return (
    <button
      type="button"
      className="note-pad-stack"
      aria-label="从便签本撕一张新便利贴"
      title="点一下，撕一张贴上墙"
      onClick={onClick}
    >
      <span className="pad-hint" aria-hidden="true">
        点我撕一张
      </span>
      <span className="pad-sheet pad-s4" aria-hidden="true" />
      <span className="pad-sheet pad-s3" aria-hidden="true" />
      <span className="pad-sheet pad-s2" aria-hidden="true" />
      <span className="pad-sheet pad-s1" aria-hidden="true">
        <span className="pad-plus" aria-hidden="true">
          +
        </span>
      </span>
    </button>
  );
}