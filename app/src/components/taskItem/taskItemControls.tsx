import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import type { KeyboardEvent, MouseEvent } from 'react';
import type { Task } from '../../types/task';
import { DragDotsIcon } from './taskItemIcons';
import {
  TASK_DRAG_HANDLE_LABEL,
  TASK_EDIT_INPUT_LABEL,
  getTaskTextTitle,
} from './taskItemPresentation';

export interface TaskEditInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}

export interface TaskMainContentProps {
  task: Pick<Task, 'text' | 'priority'>;
  isEditing: boolean;
  editText: string;
  visibleTags: string[];
  remainingTagCount: number;
  visibleScheduledDates: string[];
  remainingScheduledDateCount: number;
  onEditTextChange: (value: string) => void;
  onSubmitEdit: () => void;
  onEditKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onStartEdit?: (event: MouseEvent<HTMLSpanElement>) => void;
}

export interface TaskDragHandleProps {
  attributes: DraggableAttributes;
  listeners?: DraggableSyntheticListeners;
  setActivatorNodeRef: (element: HTMLButtonElement | null) => void;
  disabled: boolean;
}

export function TaskEditInput({
  value,
  onChange,
  onBlur,
  onKeyDown,
}: TaskEditInputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      autoFocus
      className="task-edit-input"
      aria-label={TASK_EDIT_INPUT_LABEL}
    />
  );
}

export function TaskMainContent({
  task,
  isEditing,
  editText,
  visibleTags,
  remainingTagCount,
  visibleScheduledDates,
  remainingScheduledDateCount,
  onEditTextChange,
  onSubmitEdit,
  onEditKeyDown,
  onStartEdit,
}: TaskMainContentProps) {
  if (isEditing) {
    return (
      <TaskEditInput
        value={editText}
        onChange={onEditTextChange}
        onBlur={onSubmitEdit}
        onKeyDown={onEditKeyDown}
      />
    );
  }

  return (
    <span className="task-text-wrap">
      <span className="task-text-row">
        <span
          onDoubleClick={onStartEdit}
          className="task-text"
          title={getTaskTextTitle(task)}
        >
          {task.text}
        </span>
      </span>

      {visibleTags.length > 0 && (
        <span className="task-tags task-inline-tags">
          {visibleTags.map((tag) => (
            <span key={tag} className="tag-pill-small">{tag}</span>
          ))}
          {remainingTagCount > 0 && <span className="tag-more">+{remainingTagCount}</span>}
        </span>
      )}
      {visibleScheduledDates.length > 0 && (
        <span className="scheduled-dates">
          {visibleScheduledDates.join(' / ')}
          {remainingScheduledDateCount > 0 && ` +${remainingScheduledDateCount}`}
        </span>
      )}
    </span>
  );
}

export function DragHandleButton({
  dragHandleProps,
}: {
  dragHandleProps?: TaskDragHandleProps;
}) {
  return (
    <button
      type="button"
      ref={dragHandleProps?.setActivatorNodeRef}
      className="task-drag-handle"
      disabled={dragHandleProps?.disabled ?? true}
      aria-label={TASK_DRAG_HANDLE_LABEL}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      {...(dragHandleProps?.attributes || {})}
      {...(dragHandleProps?.listeners || {})}
      aria-disabled={dragHandleProps?.disabled ?? true}
    >
      <DragDotsIcon />
    </button>
  );
}
