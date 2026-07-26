import { formatLocalDateKey, isDateKey } from '../../shared/taskRollover';
import type { AppBehaviorSettings, TaskHistoryRange } from '../../shared/appSettings';

export function isTaskHistoryRange(value: unknown): value is TaskHistoryRange {
  return value === 'two-months'
    || value === 'three-months'
    || value === 'six-months'
    || value === 'all'
    || value === 'custom';
}

export function getHistoryRangeStart(
  range: TaskHistoryRange,
  currentDate: string,
  customStartDate?: string,
): string | undefined {
  if (range === 'all') return undefined;
  if (range === 'custom') return isDateKey(customStartDate) ? customStartDate : undefined;
  if (!isDateKey(currentDate)) return undefined;

  const monthsToInclude = range === 'two-months' ? 2 : range === 'six-months' ? 6 : 3;
  const [year, month] = currentDate.slice(0, 7).split('-').map(Number);
  return formatLocalDateKey(new Date(year, month - monthsToInclude, 1));
}

export function taskIsInHistoryRange(
  task: Pick<{ taskDate?: string }, 'taskDate'>,
  settings: Pick<AppBehaviorSettings, 'taskHistoryRange' | 'taskHistoryStartDate'>,
  currentDate: string,
): boolean {
  const startDate = getHistoryRangeStart(
    settings.taskHistoryRange,
    currentDate,
    settings.taskHistoryStartDate,
  );
  return !startDate || (isDateKey(task.taskDate) && task.taskDate >= startDate);
}

function getLocalTimestampDate(timestamp: string): string | undefined {
  const date = new Date(timestamp);
  if (!Number.isNaN(date.getTime())) return formatLocalDateKey(date);
  const dateKey = timestamp.slice(0, 10);
  return isDateKey(dateKey) ? dateKey : undefined;
}

export function reviewIsInHistoryRange(
  timestamp: string,
  settings: Pick<AppBehaviorSettings, 'taskHistoryRange' | 'taskHistoryStartDate'>,
  currentDate: string,
): boolean {
  const startDate = getHistoryRangeStart(
    settings.taskHistoryRange,
    currentDate,
    settings.taskHistoryStartDate,
  );
  if (!startDate) return true;
  const reviewDate = getLocalTimestampDate(timestamp);
  return Boolean(reviewDate && reviewDate >= startDate);
}
