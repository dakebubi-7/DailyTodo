import { lazy, memo, Suspense } from 'react';
import type { Task } from '../types/task';
import { formatLocalDateKey, shiftDateKey } from '../../shared/taskRollover';
import {
  formatDisplayDate,
} from './dateNavigator/dateNavigatorUtils';
import { useDateNavigatorCalendar } from './dateNavigator/useDateNavigatorCalendar';

interface DateNavigatorProps {
  selectedDate: string;
  allDates: string[];
  tasks: Task[];
  onDateChange: (date: string) => void;
}

const MonthCalendar = lazy(() => import('./dateNavigator/MonthCalendar').then((module) => ({
  default: module.MonthCalendar,
})));

export const DateNavigator = memo(function DateNavigator({ selectedDate, allDates, tasks, onDateChange }: DateNavigatorProps) {
  const today = formatLocalDateKey();
  const { calendarRef, closeCalendar, isCalendarOpen, toggleCalendar, visibleMonth, setVisibleMonth } = useDateNavigatorCalendar(selectedDate);

  const returnToToday = () => {
    onDateChange(today);
    setVisibleMonth(today.slice(0, 7) + '-01');
  };

  return (
    <section className="date-navigator">
      <div className="date-card" ref={calendarRef}>
        <div className="date-stepper" aria-label="日期切换">
          <button
            type="button"
            onClick={() => onDateChange(shiftDateKey(selectedDate, -1))}
            aria-label="查看前一天"
            title="查看前一天"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <button
            type="button"
            onClick={returnToToday}
            title="回到今天"
            className="date-today-button"
          >
            今天
          </button>

          <button
            type="button"
            onClick={() => onDateChange(shiftDateKey(selectedDate, 1))}
            aria-label="查看后一天"
            title="查看后一天"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        <div className="date-current" title="当前日期">
          {formatDisplayDate(selectedDate)}
        </div>

        <button
          type="button"
          className="date-calendar-button"
          onClick={toggleCalendar}
          aria-label="打开月历"
          title="打开月历"
          aria-expanded={isCalendarOpen}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
            <path d="M7 2v4M17 2v4M4 9h16M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
          </svg>
        </button>

        {isCalendarOpen && (
          <Suspense fallback={null}>
            <MonthCalendar
              allDates={allDates}
              tasks={tasks}
              selectedDate={selectedDate}
              today={today}
              visibleMonth={visibleMonth}
              onDateChange={onDateChange}
              onVisibleMonthChange={setVisibleMonth}
              onClose={closeCalendar}
            />
          </Suspense>
        )}
      </div>
    </section>
  );
});
