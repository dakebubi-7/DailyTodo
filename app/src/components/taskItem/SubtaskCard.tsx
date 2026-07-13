import { useEffect, useState, type KeyboardEvent } from 'react';
import type { Task } from '../../types/task';
import {
  SubtaskActionLayer,
  SubtaskCompleteButton,
  SubtaskEditInput,
  SubtaskPriorityPicker,
  SubtaskText,
} from './subtaskCardControls';
import { getSubmittedTaskText, getTaskEditKeyAction } from './taskItemEditing';
import {
  getSubtaskRowClassName,
  getSubtaskReviewActionLabel,
} from './subtaskCardPresentation';
import { hasTaskReview } from './taskItemPresentation';

export interface SubtaskCardProps {
  subtask: Task;
  onToggleSubtask: (id: string) => void;
  onDeleteSubtask: (id: string) => void;
  onViewSubtaskReview: (task: Task) => void;
  onEditSubtask: (id: string, text: string) => void;
  onChangeSubtaskPriority: (id: string, priority: Task['priority']) => void;
}

export function SubtaskCard({
  subtask,
  onToggleSubtask,
  onDeleteSubtask,
  onViewSubtaskReview,
  onEditSubtask,
  onChangeSubtaskPriority,
}: SubtaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(subtask.text);
  const hasReview = hasTaskReview(subtask);
  const canOpenReviewAction = subtask.completed || hasReview;
  const reviewActionLabel = getSubtaskReviewActionLabel(hasReview);

  useEffect(() => {
    setEditText(subtask.text);
  }, [subtask.text]);

  const submitEdit = () => {
    const submittedText = getSubmittedTaskText(editText);
    if (submittedText) onEditSubtask(subtask.id, submittedText);
    setIsEditing(false);
  };

  const handleEditKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const action = getTaskEditKeyAction(event.key);
    if (action === 'submit') submitEdit();
    if (action === 'cancel') {
      setEditText(subtask.text);
      setIsEditing(false);
    }
  };

  return (
    <span className={getSubtaskRowClassName(subtask.completed)} data-priority={subtask.priority}>
      <SubtaskCompleteButton
        completed={subtask.completed}
        onClick={() => onToggleSubtask(subtask.id)}
      />

      <SubtaskPriorityPicker
        value={subtask.priority}
        onChange={(priority) => onChangeSubtaskPriority(subtask.id, priority)}
      />

      {isEditing ? (
        <SubtaskEditInput
          value={editText}
          onChange={setEditText}
          onBlur={submitEdit}
          onKeyDown={handleEditKeyDown}
        />
      ) : (
        <SubtaskText
          subtask={subtask}
          onStartEdit={() => !subtask.completed && setIsEditing(true)}
        />
      )}

      <SubtaskActionLayer
        canOpenReviewAction={canOpenReviewAction}
        hasReview={hasReview}
        reviewActionLabel={reviewActionLabel}
        onViewReview={() => onViewSubtaskReview(subtask)}
        onDelete={() => onDeleteSubtask(subtask.id)}
      />
    </span>
  );
}


