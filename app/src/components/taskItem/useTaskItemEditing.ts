import { useEffect, useState, type KeyboardEvent } from 'react';
import type { Task } from '../../types/task';
import { getSubmittedTaskText, getTaskEditKeyAction } from './taskItemEditing';

interface UseTaskItemEditingInput {
  task: Task;
  editTrigger?: number;
  onEdit: (text: string) => void;
}

export function useTaskItemEditing({
  task,
  editTrigger,
  onEdit,
}: UseTaskItemEditingInput) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);

  useEffect(() => {
    if (editTrigger && !task.completed) {
      setEditText(task.text);
      setIsEditing(true);
    }
  }, [editTrigger, task.completed, task.text]);

  const submitEdit = () => {
    const submittedText = getSubmittedTaskText(editText);
    if (submittedText) onEdit(submittedText);
    setIsEditing(false);
  };

  const handleEditKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const action = getTaskEditKeyAction(event.key);
    if (action === 'submit') submitEdit();
    if (action === 'cancel') {
      setEditText(task.text);
      setIsEditing(false);
    }
  };

  const startEditing = () => {
    if (!task.completed) setIsEditing(true);
  };

  return {
    editText,
    handleEditKeyDown,
    isEditing,
    setEditText,
    startEditing,
    submitEdit,
  };
}
