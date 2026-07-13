import { useMemo, useState } from 'react';
import { Task } from '../../types/task';
import { getBusinessDateKey, shiftDateKey } from '../../../shared/taskRollover';
import type { CloseTaskMenu, DispatchTaskMenuUpdate } from './TaskMenuPopupPanes';
import { TaskMenuPopupPaneHeader } from './TaskMenuPopupPaneHeader';

function fmtDate(date: string) {
  const d = new Date(`${date}T00:00:00`);
  const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()} ${week}`;
}

export function DatePane({ task, onBack, onDispatch, onClose }: { task: Task; onBack: () => void; onDispatch: DispatchTaskMenuUpdate; onClose: CloseTaskMenu }) {
  const [selectedDate, setSelectedDate] = useState('');
  const today = getBusinessDateKey();
  const tomorrow = shiftDateKey(today, 1);
  const nextWeek = shiftDateKey(today, 7);
  const { activeDates, active } = useMemo(() => {
    const activeDates = [...(task.scheduledDates || [])].sort();
    const active = new Set(activeDates);
    return { activeDates, active };
  }, [task.scheduledDates]);
  const setDates = (dates: string[]) => onDispatch(task.id, { scheduledDates: dates.length ? Array.from(new Set(dates)).sort() : undefined });
  const toggleDate = (date: string) => {
    const next = active.has(date) ? activeDates.filter((item) => item !== date) : [...activeDates, date];
    setDates(next);
    onClose();
  };
  const removeDate = (date: string) => setDates(activeDates.filter((item) => item !== date));
  const quick = [
    { label: '今天', date: today },
    { label: '明天', date: tomorrow },
    { label: '下周', date: nextWeek },
  ];

  return (
    <>
      <TaskMenuPopupPaneHeader title="日期" onBack={onBack} />
      <div className="tm-date-body">
        <div className="tm-quick-grid">
          {quick.map((quickDate) => (
            <button key={quickDate.label} type="button" className={`tm-quick-date ${active.has(quickDate.date) ? 'tm-quick-date-active' : ''}`} onClick={() => toggleDate(quickDate.date)}>
              <strong>{quickDate.label}</strong>
              <span>{fmtDate(quickDate.date)}</span>
            </button>
          ))}
        </div>
        {activeDates.length > 0 && (
          <div className="tm-date-section">
            <span className="tm-section-label">移除已选日期</span>
            <div className="tm-date-chips">
              {activeDates.map((date) => (
                <span key={date} className="tm-date-chip">
                  {fmtDate(date)}
                  <button type="button" className="tm-date-chip-remove" aria-label={`移除 ${fmtDate(date)}`} onClick={() => removeDate(date)}>×</button>
                </span>
              ))}
            </div>
          </div>
        )}
        <label className="tm-field tm-date-picker-row">
          <span className="tm-section-label">选择具体日期</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => {
              const value = event.target.value;
              setSelectedDate(value);
              if (value) toggleDate(value);
            }}
            className="tm-input"
            aria-label="选择日期"
          />
        </label>
        <button type="button" className="tm-item tm-item-danger tm-clear-date" onClick={() => { setDates([]); onClose(); }}>
          <span className="tm-item-label">清除日期</span>
        </button>
      </div>
    </>
  );
}
