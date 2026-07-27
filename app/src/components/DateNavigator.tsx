import { lazy, memo, Suspense } from 'react';
import type { AppLanguage } from '../../shared/appSettings';
import { formatLocalDateKey } from '../../shared/taskRollover';
import type { Task } from '../types/task';
import { CompactDayStrip } from './CompactDayStrip';
import {
  formatCompactProgressLabel,
  formatCompactSummaryCount,
  summarizeCompactDay,
  type CompactDayStripText,
} from './compactDayStrip/compactDayStripUtils';
import type { DateNavigatorCalendarController } from './dateNavigator/useDateNavigatorCalendar';

interface DateNavigatorProps {
  selectedDate: string;
  tasks: Task[];
  language: AppLanguage;
  text: CompactDayStripText;
  calendar: DateNavigatorCalendarController;
  onDateChange: (date: string) => void;
}

const MonthCalendar = lazy(() => import('./dateNavigator/MonthCalendar').then((module) => ({
  default: module.MonthCalendar,
})));

export const DateNavigator = memo(function DateNavigator({
  selectedDate,
  tasks,
  language,
  text,
  calendar,
  onDateChange,
}: DateNavigatorProps) {
  const today = formatLocalDateKey();
  const summary = summarizeCompactDay(tasks, selectedDate, today);
  const fillWidth = Math.min(100, Math.max(summary.progress.percentage, 0));

  return (
    <section className="date-navigator">
      <div className="date-card">
        <CompactDayStrip
          selectedDate={selectedDate}
          today={today}
          tasks={tasks}
          language={language}
          text={text}
          onDateChange={onDateChange}
        />

        <div className="compact-day-summary">
          <p className="compact-day-summary-counts">
            <span>{formatCompactSummaryCount(summary.open, 'open', text)}</span>
            <span className="compact-day-summary-overdue">
              {formatCompactSummaryCount(summary.overdue, 'overdue', text)}
            </span>
          </p>
          <div className="compact-day-progress-track" aria-label={formatCompactProgressLabel(summary, text)}>
            {summary.completed > 0 && (
              <div
                className="compact-day-progress-fill"
                style={{ width: `min(100%, max(${fillWidth}%, 2.65rem))` }}
              >
                <span>{`${summary.progress.percentage}%`}</span>
              </div>
            )}
            <span className="compact-day-progress-ratio">{summary.progress.ratioLabel}</span>
          </div>
        </div>

        {calendar.isCalendarOpen && (
          <Suspense fallback={null}>
            <MonthCalendar
              tasks={tasks}
              selectedDate={selectedDate}
              today={today}
              visibleMonth={calendar.visibleMonth}
              language={language}
              text={text}
              onDateChange={onDateChange}
              onVisibleMonthChange={calendar.setVisibleMonth}
              onClose={calendar.closeCalendar}
            />
          </Suspense>
        )}
      </div>
    </section>
  );
});
