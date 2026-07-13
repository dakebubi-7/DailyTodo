function BackArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export function TaskMenuPopupPaneHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="tm-header tm-header-nav">
      <button type="button" className="tm-back" onClick={onBack} aria-label="返回"><BackArrow /></button>
      <span className="tm-header-text">{title}</span>
    </div>
  );
}
