import { useEffect, useState } from 'react';
import type { getShellText } from '../../i18n';
import type { FocusState, Task } from '../../types/task';

interface TodayFocusExecutionZoneProps {
  focusTasks: Task[];
  activeTaskId?: string;
  nextTaskId?: string;
  completedCount: number;
  text: ReturnType<typeof getShellText>['app'];
  onAdjust: () => void;
  onStateChange: (taskId: string, state: FocusState, reason?: string) => void;
}

const focusStates: FocusState[] = ['not-started', 'in-progress', 'blocked', 'completed'];

function getFocusState(task: Task): FocusState {
  if (task.completed) return 'completed';
  return task.focusState ?? 'not-started';
}

export function TodayFocusExecutionZone({
  focusTasks,
  activeTaskId,
  nextTaskId,
  completedCount,
  text,
  onAdjust,
  onStateChange,
}: TodayFocusExecutionZoneProps) {
  const [states, setStates] = useState<Record<string, FocusState>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});

  useEffect(() => {
    setStates(Object.fromEntries(focusTasks.map((task) => [task.id, getFocusState(task)])));
    setReasons(Object.fromEntries(focusTasks.map((task) => [task.id, task.focusReason ?? ''])));
  }, [focusTasks]);

  return (
    <section className="today-focus-execution-zone" aria-labelledby="today-focus-execution-heading">
      <div className="today-focus-execution-header">
        <div className="today-focus-execution-heading-wrap">
          <h2 id="today-focus-execution-heading">{text.todayFocus}</h2>
          {focusTasks.length > 0 && (
            <span className="today-focus-execution-progress" aria-label={text.todayFocusProgress
              .replace('{completed}', String(completedCount))
              .replace('{total}', String(focusTasks.length))}
            >
              {completedCount} / {focusTasks.length}
            </span>
          )}
        </div>
        <button type="button" className="today-focus-adjust" onClick={onAdjust}>
          {text.adjustTodayFocus}
        </button>
      </div>

      {focusTasks.length === 0 ? (
        <p className="today-focus-execution-empty">{text.noTodayFocusTasks}</p>
      ) : (
        <ol className="today-focus-execution-list">
          {focusTasks.map((task, index) => {
            const state = states[task.id] ?? getFocusState(task);
            const reason = reasons[task.id] ?? task.focusReason ?? '';
            const statusLabel = activeTaskId === task.id
              ? text.todayFocusActive
              : nextTaskId === task.id
                ? text.todayFocusNext
                : undefined;

            return (
              <li className="today-focus-execution-item" key={task.id} data-state={state}>
                <span className="today-focus-execution-order" aria-hidden="true">{index + 1}</span>
                <div className="today-focus-execution-main">
                  <div className="today-focus-execution-title-row">
                    <span className="today-focus-execution-title">{task.text}</span>
                    {statusLabel && <span className="today-focus-execution-status">{statusLabel}</span>}
                  </div>
                  {state === 'blocked' && (
                    <input
                      type="text"
                      className="today-focus-blocker-input"
                      value={reason}
                      placeholder={text.todayFocusBlockerPlaceholder}
                      aria-label={text.todayFocusBlockerReasonFor.replace('{task}', task.text)}
                      onChange={(event) => setReasons((previous) => ({ ...previous, [task.id]: event.target.value }))}
                      onBlur={() => onStateChange(task.id, 'blocked', reason)}
                      onKeyDown={(event) => {
                        if (event.key !== 'Enter') return;
                        event.preventDefault();
                        event.currentTarget.blur();
                      }}
                    />
                  )}
                </div>
                <select
                  className="today-focus-state-select"
                  value={state}
                  aria-label={text.todayFocusStateFor.replace('{task}', task.text)}
                  onChange={(event) => {
                    const nextState = event.target.value as FocusState;
                    setStates((previous) => ({ ...previous, [task.id]: nextState }));
                    onStateChange(task.id, nextState, undefined);
                  }}
                >
                  {focusStates.map((option) => (
                    <option key={option} value={option}>{text.todayFocusStates[option]}</option>
                  ))}
                </select>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
