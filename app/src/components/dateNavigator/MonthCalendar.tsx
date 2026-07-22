import { useMemo, type Dispatch, type SetStateAction } from 'react';
import type { AppLanguage } from '../../../shared/appSettings';
import type { Task } from '../../types/task';
import type { CompactDayStripText } from '../compactDayStrip/compactDayStripUtils';
import {
  buildMonthCells,
  buildTasksByDate,
  heatBackground,
  shiftMonth,
} from './dateNavigatorUtils';

interface MonthCalendarProps {
  tasks: Task[];
  selectedDate: string;
  today: string;
  visibleMonth: string;
  language: AppLanguage;
  text: CompactDayStripText;
  onDateChange: (date: string) => void;
  onVisibleMonthChange: Dispatch<SetStateAction<string>>;
  onClose: () => void;
}

export function MonthCalendar({
  tasks,
  selectedDate,
  today,
  visibleMonth,
  language,
  text,
  onDateChange,
  onVisibleMonthChange,
  onClose,
}: MonthCalendarProps) {
  const tasksByDate = useMemo(() => buildTasksByDate(tasks), [tasks]);
  const monthCells = useMemo(() => buildMonthCells(visibleMonth, tasksByDate), [tasksByDate, visibleMonth]);
  const monthLabel = useMemo(() => new Intl.DateTimeFormat(language, {
    year: 'numeric',
    month: 'long',
  }).format(new Date(`${visibleMonth}T00:00:00`)), [language, visibleMonth]);
  const weekDays = useMemo(
    () => Array.from(
      { length: 7 },
      (_, index) => new Intl.DateTimeFormat(language, { weekday: 'short' }).format(new Date(2026, 6, 13 + index)),
    ),
    [language],
  );

  return (
    <div className="month-calendar" role="dialog" aria-label={text.selectDate}>
      <div className="month-calendar-header">
        <button
          type="button"
          onClick={() => onVisibleMonthChange((previous) => shiftMonth(previous, -1))}
          aria-label={text.previousMonth}
          title={text.previousMonth}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <strong>{monthLabel}</strong>
        <button
          type="button"
          onClick={() => onVisibleMonthChange((previous) => shiftMonth(previous, 1))}
          aria-label={text.nextMonth}
          title={text.nextMonth}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className="month-calendar-weekdays">
        {weekDays.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
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
              ? `${cell.key}: ${done}/${total}${urgent ? '!' : ''}`
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
              aria-label={cell.inMonth ? `${text.selectDate}: ${cell.key}${total > 0 ? ` (${done}/${total})` : ''}` : undefined}
              title={title}
              style={heat ? { background: heat } : undefined}
            >
              <span className="day-number">{cell.day}</span>
              {isAllDone && <span className="day-done-check" aria-hidden="true">OK</span>}
              {urgent && <span className="day-urgent-corner" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
