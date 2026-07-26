import { useCallback } from 'react';
import type { getShellText } from '../../i18n';
import type { Task } from '../../types/task';

interface TodayFocusPanelProps {
  candidates: Task[];
  selectedTaskIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onConfirm: () => void;
  onCancel: () => void;
  text: ReturnType<typeof getShellText>['app'];
}

export function TodayFocusPanel({
  candidates,
  selectedTaskIds,
  onSelectionChange,
  onConfirm,
  onCancel,
  text,
}: TodayFocusPanelProps) {
  const toggleSelection = useCallback((taskId: string) => {
    if (selectedTaskIds.includes(taskId)) {
      onSelectionChange(selectedTaskIds.filter((id) => id !== taskId));
      return;
    }
    if (selectedTaskIds.length >= 3) return;
    onSelectionChange([...selectedTaskIds, taskId]);
  }, [onSelectionChange, selectedTaskIds]);

  return (
    <fieldset
      className="today-focus-panel"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onCancel();
      }}
    >
      <legend>{text.todayFocus}</legend>
      <p className="today-focus-limit">{text.todayFocusLimit}</p>
      <div className="today-focus-options">
        {candidates.map((task) => {
          const isSelected = selectedTaskIds.includes(task.id);
          const isLimitReached = !isSelected && selectedTaskIds.length >= 3;
          return (
            <label className="today-focus-option" key={task.id}>
              <input
                type="checkbox"
                checked={isSelected}
                disabled={isLimitReached}
                onChange={() => toggleSelection(task.id)}
              />
              <span>{task.text}</span>
            </label>
          );
        })}
      </div>
      <div className="today-focus-actions">
        <button type="button" className="today-focus-save" onClick={() => onConfirm()}>
          {text.saveTodayFocus}
        </button>
        <button type="button" className="today-focus-clear" onClick={() => onSelectionChange([])} disabled={!selectedTaskIds.length}>
          {text.clearTodayFocus}
        </button>
        <button type="button" className="today-focus-cancel" onClick={() => onCancel()}>
          {text.cancelTodayFocus}
        </button>
      </div>
    </fieldset>
  );
}
