import { formatLocalDateKey, shiftDateKey } from '../../../shared/taskRollover';
import type { AppLanguage } from '../../../shared/appSettings';
import { getTaskDate, taskAppliesToDate } from '../../hooks/taskTransforms';
import type { getShellText } from '../../i18n';
import type { Task } from '../../types/task';

export type CompactDayStripCount = 3 | 5 | 7;

export type CompactDayStatus =
  | 'future-empty'
  | 'incomplete-past'
  | 'done'
  | 'active-open'
  | 'overdue';

export interface CompactDaySummary {
  total: number;
  completed: number;
  open: number;
  overdue: number;
  status: CompactDayStatus;
  progress: {
    percentage: number;
    ratioLabel: string;
  };
}

export type CompactDayStripText = ReturnType<typeof getShellText>['app'];

export function getCompactDayStripCount(containerWidth: number): CompactDayStripCount {
  if (containerWidth < 320) return 3;
  return containerWidth >= 440 ? 7 : 5;
}

export function buildCenteredDayWindow(selectedDate: string, count: CompactDayStripCount): string[] {
  const startOffset = -Math.floor(count / 2);
  return Array.from({ length: count }, (_, index) => shiftDateKey(selectedDate, startOffset + index));
}

export function summarizeCompactDay(
  tasks: Task[],
  date: string,
  today = formatLocalDateKey(),
): CompactDaySummary {
  const visibleTasks = tasks.filter(
    (task) => !task.cleared && taskAppliesToDate(task, date, today),
  );
  const completed = visibleTasks.filter((task) => task.completed).length;
  const overdue = visibleTasks.filter(
    (task) => !task.completed && (
      (task.carriedFromDate !== undefined && task.carriedFromDate < date)
      || getTaskDate(task, today) < date
    ),
  ).length;
  const total = visibleTasks.length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  const status: CompactDayStatus = total === 0
    ? 'future-empty'
    : overdue > 0
      ? 'overdue'
      : completed === total
        ? 'done'
        : date < today
          ? 'incomplete-past'
          : 'active-open';

  return {
    total,
    completed,
    open: total - completed,
    overdue,
    status,
    progress: {
      percentage,
      ratioLabel: `${completed}/${total}`,
    },
  };
}

export function formatCompactWeekday(date: string, language: AppLanguage) {
  return new Intl.DateTimeFormat(language, { weekday: 'short' })
    .format(new Date(`${date}T00:00:00`));
}

export function formatCompactFullDate(date: string, language: AppLanguage) {
  return new Intl.DateTimeFormat(language, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date(`${date}T00:00:00`));
}

export function formatCompactDayAriaLabel(
  date: string,
  status: CompactDayStatus,
  language: AppLanguage,
  text: CompactDayStripText,
) {
  const statusText: Record<CompactDayStatus, string> = {
    'future-empty': text.futureEmpty,
    'incomplete-past': text.incompletePast,
    done: text.done,
    'active-open': text.activeOpen,
    overdue: text.overdue,
  };

  return `${text.selectDate}: ${formatCompactFullDate(date, language)}. ${statusText[status]}.`;
}

function replaceTemplate(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}

export function formatCompactSummaryCount(
  count: number,
  kind: 'open' | 'overdue',
  text: CompactDayStripText,
) {
  return replaceTemplate(kind === 'open' ? text.openCount : text.overdueCount, { count });
}

export function formatCompactProgressLabel(
  summary: CompactDaySummary,
  text: CompactDayStripText,
) {
  const percentage = replaceTemplate(text.completionPercent, {
    percentage: summary.progress.percentage,
  });
  const ratio = replaceTemplate(text.completionRatio, {
    completed: summary.completed,
    total: summary.total,
  });

  return `${percentage} ${ratio}`;
}
