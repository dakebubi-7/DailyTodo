import { memo, useEffect, useMemo, useRef, useState } from 'react';
import type { AppLanguage } from '../../shared/appSettings';
import type { Task } from '../types/task';
import {
  buildCenteredDayWindow,
  formatCompactDayAriaLabel,
  formatCompactWeekday,
  getCompactDayStripCount,
  summarizeCompactDay,
  type CompactDayStripCount,
  type CompactDayStripText,
} from './compactDayStrip/compactDayStripUtils';

interface CompactDayStripProps {
  selectedDate: string;
  today: string;
  tasks: Task[];
  language: AppLanguage;
  text: CompactDayStripText;
  onDateChange: (date: string) => void;
}

export const CompactDayStrip = memo(function CompactDayStrip({
  selectedDate,
  today,
  tasks,
  language,
  text,
  onDateChange,
}: CompactDayStripProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState<CompactDayStripCount>(5);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const observer = new ResizeObserver(([entry]) => {
      setCount(getCompactDayStripCount(entry.contentRect.width));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const dates = useMemo(
    () => buildCenteredDayWindow(selectedDate, count),
    [count, selectedDate],
  );

  return (
    <div
      ref={containerRef}
      className={`compact-day-strip${selectedDate !== today ? ' compact-day-strip-has-today-action' : ''}`}
      data-day-count={count}
    >
      {selectedDate !== today && (
        <button
          type="button"
          className="compact-day-strip-today"
          onClick={() => onDateChange(today)}
          title={text.backToToday}
          aria-label={text.backToToday}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M12 8v4l2.5 1.5" />
            <path d="M4.9 5.1A9 9 0 1 0 6 18.6" />
            <path d="M4 5v5h5" />
          </svg>
          <span>{text.backToToday}</span>
        </button>
      )}
      <div className="compact-day-strip-days">
        {dates.map((date) => {
          const summary = summarizeCompactDay(tasks, date, today);
          const selected = date === selectedDate;

          return (
            <button
              key={date}
              type="button"
              className="compact-day-strip-day"
              data-status={summary.status}
              aria-current={selected ? 'date' : undefined}
              aria-label={formatCompactDayAriaLabel(date, summary.status, language, text)}
              onClick={() => onDateChange(date)}
            >
              <span className="compact-day-strip-weekday">{formatCompactWeekday(date, language)}</span>
              <span className="compact-day-strip-number">{date.slice(-2)}</span>
              <span className="compact-day-strip-dot" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </div>
  );
});
