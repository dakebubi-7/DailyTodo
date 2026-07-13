import type { CaptureItem } from '../../shared/obsidianCompanion';
import { getTaskDate } from '../../shared/taskRollover';
import type { Task } from '../types/task';

export function buildCaptureItems(
  tasks: Task[],
  selectedDate: string,
  dailyWork = '',
  dailyInspiration = ''
): CaptureItem[] {
  const taskItems: CaptureItem[] = [];
  for (const task of tasks) {
    if (getTaskDate(task, '') !== selectedDate) continue;
    taskItems.push({
      id: `task-${task.id}`,
      type: 'task',
      content: task.text,
      tags: [],
      priority: task.priority,
      source: 'desktop',
      status: task.completed ? 'synced' : 'new',
      createdAt: task.createdAt,
      metadata: { taskId: task.id },
    });
  }

  const noteItems: CaptureItem[] = [];
  if (dailyWork.trim()) {
    noteItems.push({
      id: `work-${selectedDate}`,
      type: 'work',
      content: dailyWork.trim(),
      tags: [],
      source: 'desktop',
      status: 'new',
      createdAt: `${selectedDate}T00:00:00.000Z`,
    });
  }

  if (dailyInspiration.trim()) {
    noteItems.push({
      id: `inspiration-${selectedDate}`,
      type: 'inspiration',
      content: dailyInspiration.trim(),
      tags: [],
      source: 'desktop',
      status: 'new',
      createdAt: `${selectedDate}T00:00:00.000Z`,
    });
  }

  return [...taskItems, ...noteItems];
}
