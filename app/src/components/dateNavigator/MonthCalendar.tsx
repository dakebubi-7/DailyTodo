import { useMemo, type Dispatch, type SetStateAction } from 'react';
import type { Task } from '../../types/task';
import {
  buildMonthCells,
  buildTasksByDate,
  heatBackground,
  shiftMonth,
  weekDays,
} from './dateNavigatorUtils';

interface MonthCalendarProps {
  allDates: string[];
  tasks: Task[];
  selectedDate: string;
  today: string;
  visibleMonth: string;
  onDateChange: (date: string) => void;
  onVisibleMonthChange: Dispatch<SetStateAction<string>>;
  onClose: () => void;
}

export function MonthCalendar({
  allDates,
  tasks,
  selectedDate,
  today,
  visibleMonth,
  onDateChange,
  onVisibleMonthChange,
  onClose,
}: MonthCalendarProps) {
  const tasksByDate = useMemo(() => buildTasksByDate(tasks), [tasks]);
  const monthCells = useMemo(() => buildMonthCells(visibleMonth, tasksByDate), [tasksByDate, visibleMonth]);
  const monthLabel = useMemo(() => new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
  }).format(new Date(`${visibleMonth}T00:00:00`)), [visibleMonth]);

  return (
    <div className="month-calendar" role="dialog" aria-label="选择日期">
      <div className="month-calendar-header">
        <button
          type="button"
          onClick={() => onVisibleMonthChange((previous) => shiftMonth(previous, -1))}
          aria-label="上个月"
          title="上个月"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <strong>{monthLabel}</strong>
        <button
          type="button"
          onClick={() => onVisibleMonthChange((previous) => shiftMonth(previous, 1))}
          aria-label="下个月"
          title="下个月"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className="month-calendar-history">
        <button type="button" onClick={() => onDateChange(today)}>今天</button>
        {allDates.slice(0, 5).map((date) => (
          <button key={date} type="button" onClick={() => onDateChange(date)}>
            {date.slice(5).replace('-', '/')}
          </button>
        ))}
      </div>

      <div className="month-calendar-weekdays">
        {weekDays.map((day) => <span key={day}>{day}</span>)}
      </div>

      <div className="month-calendar-grid">
        {monthCells.map((cell) => {
          const isSelected = cell.key === selectedDate;
          const isToday = cell.key === today;
          const { total, done, urgent } = cell.summary;
          const isAllDone = total > 0 && done === total;
          const heat = !isSelected ? heatBackground(cell.summary) : undefined;
          const title = cell.inMonth
            ? total > 0
              ? `${cell.key}: 已完成 ${done} / 共 ${total}${urgent ? '（有高优先级未完成）' : ''}`
              : cell.key
            : undefined;
          return (
            <button
              key={cell.key}
              type="button"
              disabled={!cell.inMonth}
              onClick={() => {
                if (!cell.inMonth) return;
                onDateChange(cell.key);
                onClose();
              }}
              className={`${isSelected ? 'is-selected' : ''} ${isToday ? 'is-today' : ''} ${isAllDone ? 'is-all-done' : ''}`}
              aria-label={cell.inMonth ? `选择 ${cell.key}${total > 0 ? `，已完成 ${done} / 共 ${total}` : ''}` : undefined}
              title={title}
              style={heat ? { background: heat } : undefined}
            >
              <span className="day-number">{cell.day}</span>
              {isAllDone && <span className="day-done-check" aria-hidden="true">✓</span>}
              {urgent && <span className="day-urgent-corner" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
