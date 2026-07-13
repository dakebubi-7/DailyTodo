import type { KeyboardEvent } from 'react';
import type { Task } from '../../types/task';
import { PriorityPicker } from '../PriorityPicker';
import { ReviewIcon, TrashIcon } from './taskItemIcons';
import {
  SUBTASK_DELETE_ACTION_LABEL,
  SUBTASK_EDIT_INPUT_LABEL,
  SUBTASK_PRIORITY_PICKER_TITLE,
  getSubtaskCompleteActionLabel,
  getSubtaskTextTitle,
} from './subtaskCardPresentation';

export interface SubtaskEditInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}

export function SubtaskCompleteButton({
  completed,
  onClick,
}: {
  completed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`task-complete-action task-subtask-complete ${completed ? 'task-complete-action-complete' : ''}`}
      onClick={onClick}
      aria-label={getSubtaskCompleteActionLabel(completed)}
    >
      {completed && (
        <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
          <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

export function SubtaskPriorityPicker({
  value,
  onChange,
}: {
  value: Task['priority'];
  onChange: (priority: Task['priority']) => void;
}) {
  return <PriorityPicker value={value} onChange={onChange} title={SUBTASK_PRIORITY_PICKER_TITLE} />;
}

export function SubtaskEditInput({
  value,
  onChange,
  onBlur,
  onKeyDown,
}: SubtaskEditInputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      autoFocus
      className="task-edit-input task-subtask-edit-input"
      aria-label={SUBTASK_EDIT_INPUT_LABEL}
    />
  );
}

export function SubtaskText({
  subtask,
  onStartEdit,
}: {
  subtask: Pick<Task, 'text' | 'priority'>;
  onStartEdit: () => void;
}) {
  return (
    <span
      className="task-subtask-text"
      title={getSubtaskTextTitle(subtask)}
      onDoubleClick={onStartEdit}
    >
      {subtask.text}
    </span>
  );
}

export function SubtaskReviewButton({
  hasReview,
  label,
  onClick,
}: {
  hasReview: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="task-subtask-review task-icon-action task-review-action task-review-action-visible"
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <ReviewIcon hasReview={hasReview} />
    </button>
  );
}

export function SubtaskDeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="task-subtask-delete task-icon-action task-delete-action"
      onClick={onClick}
      aria-label={SUBTASK_DELETE_ACTION_LABEL}
      title={SUBTASK_DELETE_ACTION_LABEL}
    >
      <TrashIcon />
    </button>
  );
}

export function SubtaskActionLayer({
  canOpenReviewAction,
  hasReview,
  reviewActionLabel,
  onViewReview,
  onDelete,
}: {
  canOpenReviewAction: boolean;
  hasReview: boolean;
  reviewActionLabel: string;
  onViewReview: () => void;
  onDelete: () => void;
}) {
  return (
    <span className="task-subtask-action-layer task-action-layer">
      <span className="task-action-slot task-action-slot-review task-subtask-review-zone">
        {canOpenReviewAction && (
          <SubtaskReviewButton
            hasReview={hasReview}
            label={reviewActionLabel}
            onClick={onViewReview}
          />
        )}
      </span>
      <span className="task-action-slot task-action-slot-delete task-subtask-delete-zone">
        <SubtaskDeleteButton onClick={onDelete} />
      </span>
    </span>
  );
}
