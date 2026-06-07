import { FormEvent, useState } from 'react';
import { useTasks } from './hooks/useTasks';
import {
  buildWidgetSummary,
  getTodayDateKey,
  normalizeQuickAddText,
  shiftWidgetDate,
} from './widgetModel';

export function WidgetApp() {
  const {
    allTasks,
    addTask,
    toggleTask,
    isLoaded,
  } = useTasks();
  const [selectedDate, setSelectedDate] = useState(getTodayDateKey());
  const [draft, setDraft] = useState('');
  const summary = buildWidgetSummary(allTasks, selectedDate);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const text = normalizeQuickAddText(draft);
    if (!text) return;
    addTask(text, 'medium', selectedDate);
    setDraft('');
  };

  return (
    <div className="widget-viewport">
      <section className="widget-card">
        <header className="widget-header titlebar-drag">
          <div>
            <p className="widget-kicker">DailyTodo</p>
            <h1>桌面组件</h1>
          </div>
          <div className="widget-progress" aria-label={`完成 ${summary.completedCount}/${summary.totalCount}`}>
            <strong>{summary.completedCount}/{summary.totalCount}</strong>
            <span>{summary.percent}%</span>
          </div>
        </header>

        <div className="widget-date-row titlebar-no-drag">
          <button type="button" onClick={() => setSelectedDate((date) => shiftWidgetDate(date, -1))} aria-label="前一天">‹</button>
          <span>{selectedDate === getTodayDateKey() ? '今天' : selectedDate}</span>
          <button type="button" onClick={() => setSelectedDate((date) => shiftWidgetDate(date, 1))} aria-label="后一天">›</button>
        </div>

        <div className="widget-progress-bar" aria-hidden="true">
          <span style={{ width: `${summary.percent}%` }} />
        </div>

        <main className="widget-task-list titlebar-no-drag">
          {!isLoaded ? (
            <p className="widget-empty">正在加载任务...</p>
          ) : summary.visibleTasks.length ? (
            <>
              {summary.visibleTasks.map((task) => (
                <button key={task.id} type="button" className="widget-task" onClick={() => toggleTask(task.id)}>
                  <span className="widget-task-circle" />
                  <span>{task.text}</span>
                </button>
              ))}
              {summary.remainingUnfinishedCount > 0 && (
                <p className="widget-more">+ 还有 {summary.remainingUnfinishedCount} 项未完成</p>
              )}
            </>
          ) : (
            <p className="widget-empty">
              {selectedDate === getTodayDateKey() ? '今天清空了，继续保持。' : `${selectedDate} 没有任务。`}
            </p>
          )}
        </main>

        <form className="widget-add titlebar-no-drag" onSubmit={handleSubmit}>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="+ 添加一个任务..."
            aria-label="添加任务"
          />
          <button type="submit">↵</button>
        </form>
      </section>
    </div>
  );
}
