import type { Task } from '../types/task';
import {
  getBusinessDateKey,
  getTaskDate as getSharedTaskDate,
  isDateKey,
} from '../../shared/taskRollover';
import { normalizeScheduledDates } from './taskPersistenceTransforms';

export {
  isTaskCompletionReview,
  isTaskLike,
  normalizeScheduledDates,
  normalizeTask,
  parseStoredTasks,
} from './taskPersistenceTransforms';

export function getTaskDate(task: Task, fallbackDate = getBusinessDateKey()) {
  return getSharedTaskDate(task, fallbackDate);
}

export function getTaskVisibleDates(task: Task, fallbackDate = getBusinessDateKey()) {
  const primaryDate = getTaskDate(task, fallbackDate);
  return [primaryDate, ...(normalizeScheduledDates(task.scheduledDates, primaryDate) || [])];
}

export function taskAppliesToDate(task: Task, date: string, fallbackDate = getBusinessDateKey()) {
  if (getTaskDate(task, fallbackDate) === date) return true;
  return task.scheduledDates?.some(
    (scheduledDate) => isDateKey(scheduledDate) && scheduledDate === date,
  ) || false;
}

export function taskMatchesDate(task: Task, date: string, fallbackDate = getBusinessDateKey()) {
  return taskAppliesToDate(task, date, fallbackDate);
}
