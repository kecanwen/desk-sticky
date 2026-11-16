/** 叠页 + 侧边翻页弧线，避免与「放大」类图标混淆 */
export function FlipIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="4"
        y="9"
        width="11"
        height="12"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.6"
        opacity="0.35"
      />
      <rect
        x="7"
        y="5"
        width="11"
        height="12"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M19 8.5c0 4-2.5 7-6 7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M17 6.5 19 8.5l-2 1.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6 7l1 12a1 1 0 0 0 1 .9h8a1 1 0 0 0 1-.9L18 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}