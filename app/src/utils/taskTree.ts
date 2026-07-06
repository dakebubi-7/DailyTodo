import type { Task } from '../types/task';

export function findTaskInTree(tasks: Task[], taskId: string): Task | null {
  for (const task of tasks) {
    if (task.id === taskId) return task;
    if (task.subtasks?.length) {
      const found = findTaskInTree(task.subtasks, taskId);
      if (found) return found;
    }
  }
  return null;
}

export function isSubtask(task: Task) {
  return Boolean(task.parentTaskId);
}
