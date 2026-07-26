import { isDateKey } from './taskRollover';
import { getTodayFocusTasks, type TodayFocusAdoption, type TodayFocusState, type TodayFocusTask } from './todayFocus';

export type DailyReviewAdoptionTask = TodayFocusTask & {
  completedAt?: string;
  text?: string;
  priority?: unknown;
  subtasks?: DailyReviewAdoptionTask[];
};

export type ConfirmedDailyReviewAdoptionInput<T extends DailyReviewAdoptionTask> = {
  tasks: T[];
  taskId?: string;
  focusDate: string;
  sourceDate: string;
  sourceReviewId: string;
  sourceReviewRevision: string;
  suggestedAction: string;
  action: string;
  adoptedAt: string;
};

export type DailyReviewAdoptionFailureReason =
  | 'invalid-date'
  | 'empty-action'
  | 'task-unavailable'
  | 'focus-limit';

export type DailyReviewAdoptionResult<T extends DailyReviewAdoptionTask> =
  | { ok: true; tasks: T[] }
  | { ok: false; reason: DailyReviewAdoptionFailureReason; tasks: T[] };

function getTaskMatches<T extends DailyReviewAdoptionTask>(tasks: T[], taskId?: string): T[] {
  const matches: T[] = [];
  const visit = (entries: T[]) => {
    for (const task of entries) {
      if (taskId ? task.id === taskId : true) matches.push(task);
      if (task.subtasks?.length) visit(task.subtasks as T[]);
    }
  };
  visit(tasks);
  return matches;
}

function isFocusState(value: unknown): value is TodayFocusState {
  return value === 'not-started'
    || value === 'in-progress'
    || value === 'blocked'
    || value === 'completed';
}

function applyAdoptionToTask<T extends DailyReviewAdoptionTask>(
  task: T,
  taskId: string,
  focusDate: string,
  focusOrder: number,
  focusAction: string,
  focusAdoption: TodayFocusAdoption,
): T {
  const subtasks = task.subtasks?.map((subtask) => applyAdoptionToTask(
    subtask as T,
    taskId,
    focusDate,
    focusOrder,
    focusAction,
    focusAdoption,
  ));
  const hasChangedSubtasks = subtasks?.some((subtask, index) => subtask !== task.subtasks?.[index]) ?? false;
  if (task.id !== taskId) return hasChangedSubtasks ? { ...task, subtasks } as T : task;

  const focusState = isFocusState(task.focusState) ? task.focusState : 'not-started';
  const { completedAt: _completedAt, cleared: _cleared, ...taskWithoutCompletedStage } = task;
  return {
    ...taskWithoutCompletedStage,
    subtasks,
    completed: false,
    focusDate,
    focusOrder,
    focusState,
    focusAction,
    focusAdoption,
  } as T;
}

export function applyConfirmedDailyReviewAdoption<T extends DailyReviewAdoptionTask>(
  input: ConfirmedDailyReviewAdoptionInput<T>,
): DailyReviewAdoptionResult<T> {
  if (!isDateKey(input.focusDate)) {
    return { ok: false, reason: 'invalid-date', tasks: input.tasks };
  }

  const finalAction = input.action.trim();
  if (!finalAction) return { ok: false, reason: 'empty-action', tasks: input.tasks };

  const matches = getTaskMatches(input.tasks, input.taskId);
  if (matches.length !== 1) return { ok: false, reason: 'task-unavailable', tasks: input.tasks };

  const task = matches[0];
  if (task.cleared && !task.completed) {
    return { ok: false, reason: 'task-unavailable', tasks: input.tasks };
  }

  const focusTasks = getTodayFocusTasks(input.tasks, input.focusDate);
  const existingFocus = focusTasks.find((focusTask) => focusTask.id === task.id);
  if (!existingFocus && focusTasks.length >= 3) {
    return { ok: false, reason: 'focus-limit', tasks: input.tasks };
  }

  const focusAdoption: TodayFocusAdoption = {
    sourceDate: input.sourceDate,
    sourceReviewId: input.sourceReviewId,
    sourceReviewRevision: input.sourceReviewRevision,
    suggestedAction: input.suggestedAction,
    finalAction,
    adoptedAt: input.adoptedAt,
    mode: finalAction === input.suggestedAction.trim() ? 'unchanged' : 'edited',
  };
  const focusOrder = existingFocus?.focusOrder ?? focusTasks.length;
  const tasks = input.tasks.map((task) => applyAdoptionToTask(
    task,
    matches[0].id,
    input.focusDate,
    focusOrder,
    finalAction,
    focusAdoption,
  ));
  return { ok: true, tasks };
}
