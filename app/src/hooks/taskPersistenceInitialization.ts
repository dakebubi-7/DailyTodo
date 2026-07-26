import { createDefaultAppSettings, type AppBehaviorSettings } from '../../shared/appSettings';
import type { ArchivedObsidianTask } from '../../shared/obsidianTaskArchive';
import type { RetainedObsidianReview } from '../../shared/obsidianReviewRetention';
import { getBusinessDateKey } from '../../shared/taskRollover';
import { isObjectRecord } from '../../shared/unknownValueGuards';
import { getAppSettings, getObsidianPath, loadTasks } from '../store/taskStore';
import type { TabType, Task } from '../types/task';
import {
  TASK_LIST_ORDER_KEY,
  parseTaskListOrderByDate,
  type TaskListOrderByDate,
} from '../utils/taskOrdering';
import { TaskCarryoverLedger, applyBusinessDateCarryover } from './taskCarryover';
import { areTaskListsEqual } from './taskHookState';
import { isTaskCompletionReview, isTaskLike } from './taskTransforms';
import {
  ACTIVE_TAB_KEY,
  DAILY_INSPIRATION_KEY,
  DAILY_WORK_KEY,
  LAST_ACTIVE_DAY_KEY,
  SELECTED_DATE_KEY,
} from './taskUiStatePersistence';

export const TASK_CARRYOVER_LEDGER_KEY = 'taskCarryoverLedger';
export const ARCHIVED_OBSIDIAN_TASKS_KEY = 'archivedObsidianTasks';
export const RETAINED_OBSIDIAN_REVIEWS_KEY = 'retainedObsidianReviews';

export interface InitialTaskState {
  settings: AppBehaviorSettings;
  today: string;
  tasks: Task[];
  dailyWorkNotes: Record<string, string>;
  dailyInspirationNotes: Record<string, string>;
  archivedObsidianTasks: ArchivedObsidianTask[];
  retainedObsidianReviews: RetainedObsidianReview[];
  taskListOrderByDate: TaskListOrderByDate;
  selectedDate: string;
  activeTab?: TabType;
  obsidianPath: string;
  carryoverLedger: TaskCarryoverLedger;
  shouldPersistTasks: boolean;
  shouldPersistCarryoverLedger: boolean;
}

function isRetainedObsidianReview(value: unknown): value is RetainedObsidianReview {
  if (!isObjectRecord(value)) return false;
  return (
    isTaskLike(value.task)
    && isTaskCompletionReview(value.review)
    && typeof value.deletedAt === 'string'
  );
}

function isArchivedObsidianTask(value: unknown): value is ArchivedObsidianTask {
  if (!isObjectRecord(value)) return false;
  return isTaskLike(value.task) && typeof value.deletedAt === 'string';
}

export function parseStoredDateKey(value: unknown): string | undefined {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

export function parseStoredActiveTab(value: unknown): TabType | undefined {
  return value === 'today' || value === 'all' || value === 'completed' ? value : undefined;
}

export function parseStoredStringRecord(value: unknown): Record<string, string> {
  if (!isObjectRecord(value)) return {};
  const next: Record<string, string> = {};
  Object.entries(value).forEach(([key, entry]) => {
    if (typeof entry === 'string') next[key] = entry;
  });
  return next;
}

export function updateStringRecordValue(
  record: Record<string, string>,
  key: string,
  value: string,
): Record<string, string> {
  if (record[key] === value && Object.prototype.hasOwnProperty.call(record, key)) {
    return record;
  }
  return { ...record, [key]: value };
}

export function parseStoredCarryoverLedger(value: unknown): TaskCarryoverLedger {
  if (!isObjectRecord(value)) return {};
  const next: TaskCarryoverLedger = {};
  Object.entries(value).forEach(([date, ids]) => {
    if (!Array.isArray(ids)) return;
    const parsedIds = ids.filter((id): id is string => typeof id === 'string');
    if (parsedIds.length) next[date] = parsedIds;
  });
  return next;
}

export function areTaskCarryoverLedgersEqual(
  left: TaskCarryoverLedger,
  right: TaskCarryoverLedger,
): boolean {
  const leftEntries = Object.entries(left);
  const rightEntries = Object.entries(right);
  return leftEntries.length === rightEntries.length
    && leftEntries.every(([date, leftIds]) => {
      const rightIds = right[date];
      return Boolean(rightIds)
        && leftIds.length === rightIds.length
        && leftIds.every((id, index) => id === rightIds[index]);
    });
}

export function parseStoredTaskListOrder(value: unknown): TaskListOrderByDate {
  return parseTaskListOrderByDate(value);
}

export function parseStoredRetainedObsidianReviews(value: unknown): RetainedObsidianReview[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRetainedObsidianReview);
}

export function parseStoredArchivedObsidianTasks(value: unknown): ArchivedObsidianTask[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isArchivedObsidianTask);
}

export async function loadInitialTaskState(): Promise<InitialTaskState> {
  const [storedSettings, savedTasks, savedState, obsidianPath] = await Promise.all([
    getAppSettings(),
    loadTasks(),
    window.electronAPI?.getStoreMany([
      DAILY_WORK_KEY,
      DAILY_INSPIRATION_KEY,
      SELECTED_DATE_KEY,
      LAST_ACTIVE_DAY_KEY,
      ACTIVE_TAB_KEY,
      TASK_CARRYOVER_LEDGER_KEY,
      ARCHIVED_OBSIDIAN_TASKS_KEY,
      RETAINED_OBSIDIAN_REVIEWS_KEY,
      TASK_LIST_ORDER_KEY,
    ]),
    getObsidianPath(),
  ]);
  const settings = storedSettings || createDefaultAppSettings();
  const today = getBusinessDateKey(new Date(), settings.rolloverTime);
  const storedState = isObjectRecord(savedState) ? savedState : {};
  const savedWorkNotes = storedState[DAILY_WORK_KEY];
  const savedInspirationNotes = storedState[DAILY_INSPIRATION_KEY];
  const savedSelectedDate = parseStoredDateKey(storedState[SELECTED_DATE_KEY]);
  const savedLastActiveDay = parseStoredDateKey(storedState[LAST_ACTIVE_DAY_KEY]);
  const savedActiveTab = parseStoredActiveTab(storedState[ACTIVE_TAB_KEY]);
  const savedCarryoverLedger = parseStoredCarryoverLedger(storedState[TASK_CARRYOVER_LEDGER_KEY]);
  const savedArchivedTasks = parseStoredArchivedObsidianTasks(storedState[ARCHIVED_OBSIDIAN_TASKS_KEY]);
  const savedRetainedReviews = parseStoredRetainedObsidianReviews(storedState[RETAINED_OBSIDIAN_REVIEWS_KEY]);
  const savedTaskListOrder = storedState[TASK_LIST_ORDER_KEY];
  const shouldStartToday = !savedSelectedDate || savedLastActiveDay !== today;
  const carryoverResult = applyBusinessDateCarryover({
    tasks: savedTasks,
    targetDate: today,
    ledger: savedCarryoverLedger,
    settings,
  });

  return {
    settings,
    today,
    tasks: carryoverResult.tasks,
    dailyWorkNotes: parseStoredStringRecord(savedWorkNotes),
    dailyInspirationNotes: parseStoredStringRecord(savedInspirationNotes),
    archivedObsidianTasks: savedArchivedTasks,
    retainedObsidianReviews: savedRetainedReviews,
    taskListOrderByDate: parseStoredTaskListOrder(savedTaskListOrder),
    selectedDate: shouldStartToday ? today : savedSelectedDate || today,
    activeTab: savedActiveTab,
    obsidianPath,
    carryoverLedger: carryoverResult.ledger,
    shouldPersistTasks: !areTaskListsEqual(savedTasks, carryoverResult.tasks),
    shouldPersistCarryoverLedger: !areTaskCarryoverLedgersEqual(savedCarryoverLedger, carryoverResult.ledger),
  };
}
