import { modKeyLabel, SHORTCUT_DEFS } from "../constants";

interface ShortcutsGuideProps {
  open: boolean;
  onClose: () => void;
}

export function ShortcutsGuide({ open, onClose }: ShortcutsGuideProps) {
  if (!open) return null;

  const mod = modKeyLabel();

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guideTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <span className="modal-scrim" aria-hidden="true" />
      <article className="guide-card">
        <header className="guide-header">
          <div>
            <h2 id="guideTitle">课桌便利贴 · 使用说明</h2>
            <p className="guide-lead">
              墙上每一张都是完整的一片纸——没有按钮，全靠快捷键和拖动。
            </p>
          </div>
          <button type="button" className="guide-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </header>

        <section className="guide-section">
          <h3>先选中一张贴</h3>
          <p>
            点一下便利贴，或在上面写字（光标在内）即视为选中。
            只有选中的贴会响应下面的快捷键。
          </p>
        </section>

        <section className="guide-section">
          <h3>颜色（红 · 橙 · 绿）</h3>
          <ul className="guide-bullets">
            <li>
              <strong>红</strong>：最紧急，墙上同时最多 3 张；满了会提示你先降一张。
            </li>
            <li>
              <strong>橙</strong>：要做，但不赶。
            </li>
            <li>
              <strong>绿</strong>：长期、慢慢来。
            </li>
          </ul>
        </section>

        <section className="guide-section">
          <h3>快捷键</h3>
          <p className="guide-mod-hint">
            macOS 用 <kbd>⌘</kbd>，Windows / Linux 用 <kbd>Ctrl</kbd>。
            下列用 <kbd>{mod}</kbd> 表示。
          </p>
          <ul className="shortcut-table">
            {SHORTCUT_DEFS.map((row) => (
              <li key={row.id} className="shortcut-row">
                <div className="shortcut-keys">
                  {[mod, row.key].map((k) => (
                    <span key={`${row.id}-${k}`} className="kbd">
                      {k}
                    </span>
                  ))}
                </div>
                <div className="shortcut-copy">
                  <strong>{row.title}</strong>
                  <span>{row.detail}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="guide-section">
          <h3>翻面</h3>
          <p>
            悬停或选中时，点右上角 <strong>叠页 · 背/正</strong>：翻到背面或回到正面。
            点 <strong>垃圾桶</strong> 撕碎飞入废纸篓（等同 ⌘/Ctrl+O）。
          </p>
        </section>

        <section className="guide-section">
          <h3>鼠标与其他操作</h3>
          <ul className="guide-bullets">
            <li>
              左下角 <strong>便签本</strong>（叠放的一沓纸）：点一下撕一张贴上墙。
            </li>
            <li>
              <strong>拖动</strong>：在墙上挪动；拖到右侧 <strong>废纸篓</strong> 松开，等同销毁（Over）。
            </li>
            <li>
              废纸篓里的贴可 <strong>贴回墙上</strong>；数据只在浏览器本地，清缓存会丢。
            </li>
          </ul>
        </section>

        <footer className="guide-footer">
          <button type="button" className="pill-btn ink" onClick={onClose}>
            开始用
          </button>
        </footer>
      </article>
    </div>
  );
}