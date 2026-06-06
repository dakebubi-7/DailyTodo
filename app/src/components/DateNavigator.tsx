import { useEffect, useMemo, useRef, useState } from 'react';
import { Task } from '../types/task';

interface DateNavigatorProps {
  selectedDate: string;
  allDates: string[];
  tasks: Task[];
  onDateChange: (date: string) => void;
}

const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateKey(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseDateKey(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return { year, monthIndex: month - 1, day };
}

function shiftDate(date: string, days: number) {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + days);
  return getLocalDateKey(next);
}

function shiftMonth(date: string, months: number) {
  const { year, monthIndex } = parseDateKey(date);
  const next = new Date(year, monthIndex + months, 1);
  return dateKey(next.getFullYear(), next.getMonth(), 1);
}

function formatDisplayDate(date: string) {
  return date.replaceAll('-', '/');
}

function getTaskDate(task: Task) {
  return task.taskDate || task.createdAt?.slice(0, 10) || getLocalDateKey();
}

type DaySummary = { total: number; done: number; urgent: boolean };

/** 一天的完成情况汇总：总数 / 已完成数 / 是否有高优先级未完成（紧急）。 */
function getDaySummary(dayTasks: Task[]): DaySummary {
  let done = 0;
  let urgent = false;
  dayTasks.forEach((task) => {
    if (task.completed) done += 1;
    else if (task.priority === 'high') urgent = true;
  });
  return { total: dayTasks.length, done, urgent };
}

/** 整格热力底色：无任务不着色；有任务未做=极浅灰；按完成比例加深柔和绿。 */
function heatBackground(summary: DaySummary): string | undefined {
  if (summary.total === 0) return undefined;
  if (summary.done === 0) return 'rgba(161, 161, 170, 0.14)';
  const ratio = summary.done / summary.total;
  const pct = Math.round(16 + 30 * ratio); // 16%（刚开始做）→ 46%（全做完）
  return `color-mix(in srgb, var(--color-priority-low) ${pct}%, transparent)`;
}

export function DateNavigator({ selectedDate, allDates, tasks, onDateChange }: DateNavigatorProps) {
  const today = getLocalDateKey();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(selectedDate.slice(0, 7) + '-01');
  const calendarRef = useRef<HTMLDivElement>(null);

  const returnToToday = () => {
    onDateChange(today);
    setVisibleMonth(today.slice(0, 7) + '-01');
  };

  useEffect(() => {
    setVisibleMonth(selectedDate.slice(0, 7) + '-01');
  }, [selectedDate]);

  useEffect(() => {
    if (!isCalendarOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (calendarRef.current?.contains(event.target as Node)) return;
      setIsCalendarOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isCalendarOpen]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((task) => {
      const key = getTaskDate(task);
      map.set(key, [...(map.get(key) || []), task]);
    });
    return map;
  }, [tasks]);

  const monthCells = useMemo(() => {
    const { year, monthIndex } = parseDateKey(visibleMonth);
    const firstDay = new Date(year, monthIndex, 1);
    const firstWeekday = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const cells: Array<{ key: string; day?: number; inMonth: boolean; summary: DaySummary }> = [];
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
  }, [tasksByDate, visibleMonth]);

  const monthLabel = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
  }).format(new Date(`${visibleMonth}T00:00:00`));

  return (
    <section className="date-navigator">
      <div className="date-card" ref={calendarRef}>
        <div className="date-stepper" aria-label="日期切换">
          <button
            type="button"
            onClick={() => onDateChange(shiftDate(selectedDate, -1))}
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
            onClick={() => onDateChange(shiftDate(selectedDate, 1))}
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
          onClick={() => setIsCalendarOpen((prev) => !prev)}
          aria-label="打开月历"
          title="打开月历"
          aria-expanded={isCalendarOpen}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
            <path d="M7 2v4M17 2v4M4 9h16M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
          </svg>
        </button>

        {isCalendarOpen && (
          <div className="month-calendar" role="dialog" aria-label="选择日期">
            <div className="month-calendar-header">
              <button
                type="button"
                onClick={() => setVisibleMonth((prev) => shiftMonth(prev, -1))}
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
                onClick={() => setVisibleMonth((prev) => shiftMonth(prev, 1))}
                aria-label="下个月"
                title="下个月"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>

            <div className="month-calendar-history">
              <button type="button" onClick={returnToToday}>
                今天
              </button>
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
                // 选中日用强调底色，热力底色让位避免打架。
                const heat = !isSelected ? heatBackground(cell.summary) : undefined;
                const title = cell.inMonth
                  ? total > 0
                    ? `${cell.key}　已完成 ${done} / 共 ${total}${urgent ? '（有高优先级未完成）' : ''}`
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
                      setIsCalendarOpen(false);
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
        )}
      </div>
    </section>
  );
}
