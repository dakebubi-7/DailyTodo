import { Task } from '../types/task';
import { getBusinessDateKey } from '../../shared/taskRollover';

export function getTaskDate(task: Task, fallbackDate = getBusinessDateKey()) {
  return task.taskDate || task.createdAt?.slice(0, 10) || fallbackDate;
}

export function taskMatchesDate(task: Task, date: string, fallbackDate = getBusinessDateKey()) {
  const taskDate = getTaskDate(task, fallbackDate);
  return taskDate === date || Boolean(task.scheduledDates?.includes(date));
}

export function normalizeTask(task: Task, currentBusinessDate: string): Task {
  const completionReviews = task.completionReviews?.length
    ? task.completionReviews
    : task.completionReview
      ? [task.completionReview]
      : undefined;

  const taskDate = getTaskDate(task, currentBusinessDate);

  return {
    ...task,
    taskDate,
    isToday: taskDate === currentBusinessDate,
    completionReviews,
    completionReview: completionReviews?.[completionReviews.length - 1] || task.completionReview,
  };
}

export function mapTaskTree(tasks: Task[], targetId: string, updater: (task: Task) => Task): Task[] {
  return tasks.map((task) => {
    if (task.id === targetId) return updater(task);
    if (!task.subtasks?.length) return task;
    return {
      ...task,
      subtasks: mapTaskTree(task.subtasks, targetId, updater),
    };
  });
}

export function removeTaskFromTree(tasks: Task[], targetId: string): Task[] {
  return tasks
    .filter((task) => task.id !== targetId)
    .map((task) => (
      task.subtasks?.length
        ? { ...task, subtasks: removeTaskFromTree(task.subtasks, targetId) }
        : task
    ));
}
