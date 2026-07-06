import { formatLocalDateKey } from '../../../shared/taskRollover';
import { Task } from '../../types/task';

export const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

export type DaySummary = { total: number; done: number; urgent: boolean };

export type MonthCell = { key: string; day?: number; inMonth: boolean; summary: DaySummary };

export function dateKey(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function parseDateKey(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return { year, monthIndex: month - 1, day };
}

export function shiftMonth(date: string, months: number) {
  const { year, monthIndex } = parseDateKey(date);
  const next = new Date(year, monthIndex + months, 1);
  return dateKey(next.getFullYear(), next.getMonth(), 1);
}

export function formatDisplayDate(date: string) {
  return date.replaceAll('-', '/');
}

export function getTaskDate(task: Task) {
  return task.taskDate || task.createdAt?.slice(0, 10) || formatLocalDateKey();
}

export function getDaySummary(dayTasks: Task[]): DaySummary {
  let done = 0;
  let urgent = false;
  dayTasks.forEach((task) => {
    if (task.completed) done += 1;
    else if (task.priority === 'high') urgent = true;
  });
  return { total: dayTasks.length, done, urgent };
}

export function heatBackground(summary: DaySummary): string | undefined {
  if (summary.total === 0) return undefined;
  if (summary.done === 0) return 'rgba(161, 161, 170, 0.14)';
  const ratio = summary.done / summary.total;
  const pct = Math.round(16 + 30 * ratio);
  return `color-mix(in srgb, var(--color-priority-low) ${pct}%, transparent)`;
}

export function buildMonthCells(visibleMonth: string, tasksByDate: Map<string, Task[]>): MonthCell[] {
  const { year, monthIndex } = parseDateKey(visibleMonth);
  const firstDay = new Date(year, monthIndex, 1);
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: MonthCell[] = [];
  const emptySummary: DaySummary = { total: 0, done: 0, urgent: false };

  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push({ key: `blank-${i}`, inMonth: false, summary: emptySummary });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = dateKey(year, monthIndex, day);
    cells.push({
      key,
      day,
      inMonth: true,
      summary: getDaySummary(tasksByDate.get(key) || []),
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ key: `tail-${cells.length}`, inMonth: false, summary: emptySummary });
  }

  return cells;
}
