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
      data-compact={count === 3 ? 'true' : undefined}
    >
      {selectedDate !== today && (
        <button
          type="button"
          className="compact-day-strip-today"
          onClick={() => onDateChange(today)}
          title={text.backToToday}
          aria-label={text.backToToday}
        >
          <svg className="compact-day-strip-today-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
            <rect x="4.5" y="5.5" width="15" height="14" rx="2" />
            <path d="M8 3.5v4M16 3.5v4M4.5 10h15" />
            <circle cx="12" cy="14.5" r="2.1" />
            <path d="m12 17.8 1.35-1.45" />
          </svg>
          <span className="compact-day-strip-today-label">{text.backToToday}</span>
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
