import { getTaskDate, shiftDateKey } from '../taskRollover';

export interface StatTask {
  id?: string;
  completed: boolean;
  cleared?: boolean;
  taskDate?: string;
  createdAt?: string;
  text?: string;
  carriedFromDate?: string;
  carriedFromTaskId?: string;
  nextStep?: string;
  carryoverContext?: { nextStep?: string };
}

export interface DailyStats {
  date: string;
  total: number;
  completed: number;
  completionRate: number; // 0-100 整数
}

export interface RangeStats {
  start: string;
  end: string;
  activeDays: number;
  totalCompleted: number;
  totalTasks: number;
  streak: number;
}

function dateOf(task: StatTask): string {
  return getTaskDate(task, '');
}

export function computeDailyStats(tasks: StatTask[], date: string): DailyStats {
  let completed = 0;
  let total = 0;

  for (const task of tasks) {
    if (dateOf(task) !== date) continue;
    total += 1;
    if (task.completed) completed += 1;
  }

  return {
    date,
    total,
    completed,
    completionRate: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

export function computeRangeStats(tasks: StatTask[], start: string, end: string): RangeStats {
  const activeDates = new Set<string>();
  let totalCompleted = 0;
  let totalTasks = 0;

  for (const task of tasks) {
    const taskDate = dateOf(task);
    if (taskDate < start || taskDate > end) continue;
    totalTasks += 1;
    if (taskDate) activeDates.add(taskDate);
    if (task.completed) totalCompleted += 1;
  }

  let streak = 0;
  let cursor = end;
  while (activeDates.has(cursor) && cursor >= start) {
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }

  return {
    start,
    end,
    activeDays: activeDates.size,
    totalCompleted,
    totalTasks,
    streak,
  };
}
