import { TASK_LIST_ORDER_KEY, type TaskListOrderByDate } from '../utils/taskOrdering';
import type { TabType } from '../types/task';
import { isObjectRecord } from '../../shared/unknownValueGuards';

export const DAILY_WORK_KEY = 'dailyWorkNotes';
export const DAILY_INSPIRATION_KEY = 'dailyInspirationNotes';
export const SELECTED_DATE_KEY = 'selectedDate';
export const ACTIVE_TAB_KEY = 'activeTab';
export const LAST_ACTIVE_DAY_KEY = 'lastActiveDay';

const TASK_UI_STATE_PERSIST_DELAY_MS = 150;
let taskUiStatePersistTimer: number | undefined;
let lastPersistedTaskUiState: Record<string, unknown> | undefined;
let pendingTaskUiState: Record<string, unknown> | undefined;

export interface PersistTaskUiStateInput {
  dailyWorkNotes: Record<string, string>;
  dailyInspirationNotes: Record<string, string>;
  selectedDate: string;
  currentDate: string;
  activeTab: TabType;
  taskListOrderByDate: TaskListOrderByDate;
}

function createTaskUiStateEntries({
  dailyWorkNotes,
  dailyInspirationNotes,
  selectedDate,
  currentDate,
  activeTab,
  taskListOrderByDate,
}: PersistTaskUiStateInput): Record<string, unknown> {
  return {
    [DAILY_WORK_KEY]: dailyWorkNotes,
    [DAILY_INSPIRATION_KEY]: dailyInspirationNotes,
    [SELECTED_DATE_KEY]: selectedDate,
    [LAST_ACTIVE_DAY_KEY]: currentDate,
    [ACTIVE_TAB_KEY]: activeTab,
    [TASK_LIST_ORDER_KEY]: taskListOrderByDate,
  };
}

function areTaskUiStateValuesEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (!isObjectRecord(left) || !isObjectRecord(right)) return false;

  let leftKeyCount = 0;
  for (const key in left) {
    if (!Object.prototype.hasOwnProperty.call(left, key)) continue;
    leftKeyCount += 1;
    if (!Object.prototype.hasOwnProperty.call(right, key)) return false;
    if (!areTaskUiStateValuesEqual(left[key], Object.getOwnPropertyDescriptor(right, key)?.value)) return false;
  }

  let rightKeyCount = 0;
  for (const key in right) {
    if (Object.prototype.hasOwnProperty.call(right, key)) rightKeyCount += 1;
  }
  return leftKeyCount === rightKeyCount;
}

export function persistTaskUiState({
  dailyWorkNotes,
  dailyInspirationNotes,
  selectedDate,
  currentDate,
  activeTab,
  taskListOrderByDate,
}: PersistTaskUiStateInput) {
  const storeEntries = createTaskUiStateEntries({
    dailyWorkNotes,
    dailyInspirationNotes,
    selectedDate,
    currentDate,
    activeTab,
    taskListOrderByDate,
  });
  if (lastPersistedTaskUiState && areTaskUiStateValuesEqual(lastPersistedTaskUiState, storeEntries)) {
    if (taskUiStatePersistTimer !== undefined) {
      window.clearTimeout(taskUiStatePersistTimer);
      taskUiStatePersistTimer = undefined;
    }
    pendingTaskUiState = undefined;
    return;
  }
  if (pendingTaskUiState && areTaskUiStateValuesEqual(pendingTaskUiState, storeEntries)) return;
  if (taskUiStatePersistTimer !== undefined) {
    window.clearTimeout(taskUiStatePersistTimer);
  }
  pendingTaskUiState = storeEntries;
  taskUiStatePersistTimer = window.setTimeout(() => {
    taskUiStatePersistTimer = undefined;
    pendingTaskUiState = undefined;
    lastPersistedTaskUiState = storeEntries;
    window.electronAPI?.setStoreMany(storeEntries);
  }, TASK_UI_STATE_PERSIST_DELAY_MS);
}

export function primeTaskUiStatePersistence(input: PersistTaskUiStateInput) {
  lastPersistedTaskUiState = createTaskUiStateEntries(input);
}
