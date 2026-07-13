export type TaskEditKeyAction = 'submit' | 'cancel' | null;

export function getSubmittedTaskText(editText: string) {
  const trimmed = editText.trim();
  return trimmed || null;
}

export function getTaskEditKeyAction(key: string): TaskEditKeyAction {
  if (key === 'Enter') return 'submit';
  if (key === 'Escape') return 'cancel';
  return null;
}
