import { isDateKey } from './taskRollover';

export type TodayFocusState = 'not-started' | 'in-progress' | 'blocked' | 'completed';

export type TodayFocusAdoption = {
  sourceDate: string;
  sourceReviewId: string;
  sourceReviewRevision: string;
  suggestedAction: string;
  finalAction: string;
  adoptedAt: string;
  mode: 'unchanged' | 'edited';
};

export type TodayFocusTask = {
  id: string;
  completed: boolean;
  taskDate?: string;
  scheduledDates?: string[];
  cleared?: boolean;
  focusDate?: string;
  focusOrder?: number;
  focusState?: TodayFocusState;
  focusReason?: string;
  focusAction?: string;
  focusAdoption?: TodayFocusAdoption;
  subtasks?: TodayFocusTask[];
};

export type TodayFocusSelectionFailureReason =
  | 'invalid-date'
  | 'selection-limit'
  | 'duplicate-selection'
  | 'task-unavailable';

export type TodayFocusSelectionResult<T extends TodayFocusTask> =
  | { ok: true; tasks: T[] }
  | { ok: false; reason: TodayFocusSelectionFailureReason; tasks: T[] };

export type TodayFocusStateFailureReason = 'invalid-date' | 'task-unavailable';

export type TodayFocusStateResult<T extends TodayFocusTask> =
  | { ok: true; tasks: T[] }
  | { ok: false; reason: TodayFocusStateFailureReason; tasks: T[] };

function taskAppliesToDate(task: TodayFocusTask, date: string) {
  return task.taskDate === date || task.scheduledDates?.includes(date) === true;
}

export function isTodayFocusCandidate(task: TodayFocusTask, date: string): boolean {
  return !task.completed && !task.cleared && taskAppliesToDate(task, date);
}

export function getTodayFocusCandidates<T extends TodayFocusTask>(tasks: T[], date: string): T[] {
  const candidates: T[] = [];
  const visit = (entries: T[]) => {
    for (const task of entries) {
      if (isTodayFocusCandidate(task, date)) candidates.push(task);
      if (task.subtasks?.length) visit(task.subtasks as T[]);
    }
  };
  visit(tasks);
  return candidates;
}

function findTaskById<T extends TodayFocusTask>(tasks: T[], id: string): T | undefined {
  for (const task of tasks) {
    if (task.id === id) return task;
    const nested = task.subtasks && findTaskById(task.subtasks as T[], id);
    if (nested) return nested;
  }
  return undefined;
}

function isFocusState(value: unknown): value is TodayFocusState {
  return value === 'not-started'
    || value === 'in-progress'
    || value === 'blocked'
    || value === 'completed';
}

function clearFocusForDate<T extends TodayFocusTask>(task: T, date: string): T {
  const subtasks = task.subtasks?.map((subtask) => clearFocusForDate(subtask, date));
  const hasChangedSubtasks = subtasks?.some((subtask, index) => subtask !== task.subtasks?.[index]) ?? false;
  if (task.focusDate !== date && !hasChangedSubtasks) return task;

  if (task.focusDate !== date) return { ...task, subtasks };

  const {
    focusDate: _focusDate,
    focusOrder: _focusOrder,
    focusState: _focusState,
    focusReason: _focusReason,
    focusAction: _focusAction,
    focusAdoption: _focusAdoption,
    ...taskWithoutFocus
  } = task;
  return subtasks ? { ...taskWithoutFocus, subtasks } as T : taskWithoutFocus as T;
}

function applyFocusSelection<T extends TodayFocusTask>(task: T, date: string, orderById: Map<string, number>): T {
  const subtasks = task.subtasks?.map((subtask) => applyFocusSelection(subtask, date, orderById));
  const hasChangedSubtasks = subtasks?.some((subtask, index) => subtask !== task.subtasks?.[index]) ?? false;
  const order = orderById.get(task.id);

  if (order === undefined) {
    if (task.focusDate !== date && !hasChangedSubtasks) return task;
    return clearFocusForDate({ ...task, subtasks } as T, date);
  }

  const isExistingFocus = task.focusDate === date;
  const focusState = isExistingFocus && isFocusState(task.focusState)
    ? task.focusState
    : 'not-started';
  const focusReason = isExistingFocus && typeof task.focusReason === 'string'
    ? task.focusReason
    : undefined;
  const unchanged = task.focusDate === date
    && task.focusOrder === order
    && task.focusState === focusState
    && task.focusReason === focusReason
    && !hasChangedSubtasks;
  if (unchanged) return task;

  const {
    focusDate: _focusDate,
    focusOrder: _focusOrder,
    focusState: _focusState,
    focusReason: _focusReason,
    ...taskWithoutFocus
  } = task;
  return {
    ...taskWithoutFocus,
    subtasks,
    focusDate: date,
    focusOrder: order,
    focusState,
    ...(focusReason !== undefined ? { focusReason } : {}),
  } as T;
}

export function getTodayFocusTasks<T extends TodayFocusTask>(tasks: T[], date: string): T[] {
  const focusTasks: T[] = [];
  const visit = (entries: T[]) => {
    for (const task of entries) {
      if (task.focusDate === date) focusTasks.push(task);
      if (task.subtasks?.length) visit(task.subtasks as T[]);
    }
  };
  visit(tasks);

  return focusTasks.sort((left, right) => (
    (left.focusOrder ?? Number.MAX_SAFE_INTEGER) - (right.focusOrder ?? Number.MAX_SAFE_INTEGER)
  ));
}

function updateTodayFocusTask<T extends TodayFocusTask>(
  tasks: T[],
  date: string,
  updater: (task: T) => T,
): T[] {
  let nextTasks = tasks;

  for (let index = 0; index < tasks.length; index += 1) {
    const task = tasks[index];
    const subtasks = task.subtasks?.length
      ? updateTodayFocusTask(task.subtasks as T[], date, updater)
      : task.subtasks;
    const hasChangedSubtasks = subtasks !== task.subtasks;
    const nextTask = task.focusDate === date
      ? updater(hasChangedSubtasks ? { ...task, subtasks } as T : task)
      : hasChangedSubtasks ? { ...task, subtasks } as T : task;

    if (nextTask === task) continue;
    if (nextTasks === tasks) nextTasks = tasks.slice();
    nextTasks[index] = nextTask;
  }

  return nextTasks;
}

function withFocusState<T extends TodayFocusTask>(task: T, state: TodayFocusState, reason?: string): T {
  const trimmedReason = reason?.trim();
  const existingReason = task.focusReason?.trim();
  const nextReason = state === 'blocked'
    ? trimmedReason === undefined ? existingReason : trimmedReason || undefined
    : undefined;
  const unchanged = task.focusState === state
    && task.focusReason === nextReason;
  if (unchanged) return task;

  const { focusReason: _focusReason, ...taskWithoutFocusReason } = task;
  return {
    ...taskWithoutFocusReason,
    focusState: state,
    ...(nextReason ? { focusReason: nextReason } : {}),
  } as T;
}

export function applyTodayFocusState<T extends TodayFocusTask>(
  tasks: T[],
  date: string,
  taskId: string,
  state: TodayFocusState,
  reason?: string,
): TodayFocusStateResult<T> {
  if (!isDateKey(date)) return { ok: false, reason: 'invalid-date', tasks };

  const focusTask = findTaskById(tasks, taskId);
  if (!focusTask || focusTask.focusDate !== date) {
    return { ok: false, reason: 'task-unavailable', tasks };
  }

  if (focusTask.completed && state !== 'completed') {
    return { ok: true, tasks };
  }

  const nextTasks = updateTodayFocusTask(tasks, date, (task) => {
    if (state === 'in-progress' && task.id !== taskId && task.focusState === 'in-progress') {
      return withFocusState(task, 'not-started');
    }
    if (task.id !== taskId) return task;
    return withFocusState(task, state, reason);
  });

  return { ok: true, tasks: nextTasks };
}

export function reconcileTodayFocusCompletion<T extends TodayFocusTask>(
  tasks: T[],
  date: string,
  taskId: string,
  completed: boolean,
): T[] {
  return updateTodayFocusTask(tasks, date, (task) => (
    task.id === taskId
      ? withFocusState(task, completed ? 'completed' : 'not-started')
      : task
  ));
}

export function getTodayFocusExecution<T extends TodayFocusTask>(tasks: T[], date: string): {
  tasks: T[];
  completedCount: number;
  activeTaskId?: string;
  nextTaskId?: string;
} {
  const focusTasks = getTodayFocusTasks(tasks, date);
  const completedCount = focusTasks.filter((task) => task.completed || task.focusState === 'completed').length;
  const activeTask = focusTasks.find((task) => !task.completed && task.focusState === 'in-progress');
  const nextTask = activeTask
    ? undefined
    : focusTasks.find((task) => !task.completed && task.focusState !== 'completed');

  return {
    tasks: focusTasks,
    completedCount,
    ...(activeTask ? { activeTaskId: activeTask.id } : {}),
    ...(nextTask ? { nextTaskId: nextTask.id } : {}),
  };
}

export function getTodayFocusRequestDraft<T extends TodayFocusTask>(
  tasks: T[],
  date: string,
  requestedTaskId: string,
): string[] {
  const selectedIds = getTodayFocusTasks(tasks, date).map((task) => task.id);
  if (selectedIds.length >= 3 || selectedIds.includes(requestedTaskId)) return selectedIds;

  const requestedTask = findTaskById(tasks, requestedTaskId);
  return requestedTask && isTodayFocusCandidate(requestedTask, date)
    ? [...selectedIds, requestedTaskId]
    : selectedIds;
}

export function applyTodayFocusSelection<T extends TodayFocusTask>(
  tasks: T[],
  date: string,
  selectedIds: string[],
): TodayFocusSelectionResult<T> {
  if (!isDateKey(date)) return { ok: false, reason: 'invalid-date', tasks };
  if (selectedIds.length > 3) return { ok: false, reason: 'selection-limit', tasks };

  const selectedIdSet = new Set(selectedIds);
  if (selectedIdSet.size !== selectedIds.length) {
    return { ok: false, reason: 'duplicate-selection', tasks };
  }

  for (const id of selectedIds) {
    const task = findTaskById(tasks, id);
    if (!task || !isTodayFocusCandidate(task, date)) {
      return { ok: false, reason: 'task-unavailable', tasks };
    }
  }

  const orderById = new Map(selectedIds.map((id, index) => [id, index]));
  let nextTasks = tasks;
  for (let index = 0; index < tasks.length; index += 1) {
    const task = tasks[index];
    const nextTask = applyFocusSelection(task, date, orderById);
    if (nextTask === task) continue;
    if (nextTasks === tasks) nextTasks = tasks.slice();
    nextTasks[index] = nextTask;
  }

  return { ok: true, tasks: nextTasks };
}
