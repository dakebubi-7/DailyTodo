import type { Task, TaskSource } from '../../types/task';

export function getTaskSource(task: Task): TaskSource {
  return task.source || 'personal';
}

export function getSourceSortableId(source: TaskSource) {
  return `source:${source}`;
}

export function getTaskSortableId(task: Task) {
  return `task:${getTaskSource(task)}:${task.completed ? 'done' : 'open'}:${task.id}`;
}
