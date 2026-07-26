import type { getShellText } from '../../i18n';

interface HistoryCleanupToolbarProps {
  isActive: boolean;
  visibleItemCount: number;
  selectedItemCount: number;
  isEveryVisibleItemSelected: boolean;
  text: ReturnType<typeof getShellText>['app'];
  onStart: () => void;
  onCancel: () => void;
  onToggleVisibleItems: () => void;
  onDeleteSelected: () => void;
}

export function HistoryCleanupToolbar({
  isActive,
  visibleItemCount,
  selectedItemCount,
  isEveryVisibleItemSelected,
  text,
  onStart,
  onCancel,
  onToggleVisibleItems,
  onDeleteSelected,
}: HistoryCleanupToolbarProps) {
  if (!isActive) {
    return (
      <button
        type="button"
        className="task-tool-icon history-cleanup-mode-toggle"
        onClick={onStart}
        title={text.startHistoryCleanup}
        aria-label={text.startHistoryCleanup}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M4 7h16" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
          <path d="M6 7l1 13h10l1-13" />
          <path d="M9 7V4h6v3" />
        </svg>
      </button>
    );
  }

  return (
    <div className="history-cleanup-toolbar" role="group" aria-label={text.historyCleanupMode}>
      <label className="history-cleanup-select-visible">
        <input
          type="checkbox"
          checked={isEveryVisibleItemSelected}
          disabled={visibleItemCount === 0}
          onChange={onToggleVisibleItems}
        />
        <span>{text.selectVisibleHistoryItems}</span>
      </label>
      <span className="history-cleanup-selected-count" aria-live="polite">
        {text.historyCleanupSelectedCount.replace('{count}', String(selectedItemCount))}
      </span>
      <button type="button" className="history-cleanup-cancel" onClick={onCancel}>
        {text.cancelHistoryCleanup}
      </button>
      <button
        type="button"
        className="history-cleanup-delete"
        disabled={selectedItemCount === 0}
        onClick={onDeleteSelected}
      >
        {text.deleteSelectedHistoryItems}
      </button>
    </div>
  );
}
