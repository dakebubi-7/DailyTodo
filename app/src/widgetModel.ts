import { Task } from './types/task';

export const WIDGET_VISIBLE_TASK_LIMIT = 3;

function getTaskDate(task: Task) {
  return task.taskDate || task.createdAt?.slice(0, 10) || getTodayDateKey();
}

export function getTodayDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function shiftWidgetDate(date: string, days: number) {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + days);
  return getTodayDateKey(next);
}

export function normalizeQuickAddText(value: string) {
  return value.trim();
}

export function buildWidgetSummary(tasks: Task[], selectedDate: string) {
  const dateTasks = tasks.filter((task) => getTaskDate(task) === selectedDate && !task.cleared);
  const unfinishedTasks = dateTasks.filter((task) => !task.completed);
  const visibleTasks = unfinishedTasks.slice(0, WIDGET_VISIBLE_TASK_LIMIT);
  const completedCount = dateTasks.filter((task) => task.completed).length;
  const totalCount = dateTasks.length;
  const percent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    selectedDate,
    totalCount,
    completedCount,
    percent,
    visibleTasks,
    remainingUnfinishedCount: Math.max(0, unfinishedTasks.length - visibleTasks.length),
  };
}
