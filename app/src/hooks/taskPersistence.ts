import { createDefaultAppSettings, AppBehaviorSettings } from '../../shared/appSettings';
import { RetainedObsidianReview } from '../../shared/obsidianReviewRetention';
import { getBusinessDateKey } from '../../shared/taskRollover';
import { getAppSettings, getObsidianPath, loadTasks } from '../store/taskStore';
import { TabType, Task } from '../types/task';
import { TASK_LIST_ORDER_KEY, TaskListOrderByDate } from '../utils/taskOrdering';
import { TaskCarryoverLedger, applyBusinessDateCarryover } from './taskCarryover';

export { TASK_LIST_ORDER_KEY };

export const DAILY_WORK_KEY = 'dailyWorkNotes';
export const DAILY_INSPIRATION_KEY = 'dailyInspirationNotes';
export const SELECTED_DATE_KEY = 'selectedDate';
export const ACTIVE_TAB_KEY = 'activeTab';
export const LAST_ACTIVE_DAY_KEY = 'lastActiveDay';
export const TASK_CARRYOVER_LEDGER_KEY = 'taskCarryoverLedger';
export const RETAINED_OBSIDIAN_REVIEWS_KEY = 'retainedObsidianReviews';

export interface InitialTaskState {
  settings: AppBehaviorSettings;
  today: string;
  tasks: Task[];
  dailyWorkNotes: Record<string, string>;
  dailyInspirationNotes: Record<string, string>;
  retainedObsidianReviews: RetainedObsidianReview[];
  taskListOrderByDate: TaskListOrderByDate;
  selectedDate: string;
  activeTab?: TabType;
  obsidianPath: string;
  carryoverLedger: TaskCarryoverLedger;
}

export interface PersistTaskUiStateInput {
  dailyWorkNotes: Record<string, string>;
  dailyInspirationNotes: Record<string, string>;
  selectedDate: string;
  currentDate: string;
  activeTab: TabType;
  taskListOrderByDate: TaskListOrderByDate;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function readRecord(value: unknown): Record<string, string> {
  return isRecord(value) ? value as Record<string, string> : {};
}

function readTaskListOrder(value: unknown): TaskListOrderByDate {
  return isRecord(value) ? value as TaskListOrderByDate : {};
}

export async function loadInitialTaskState(): Promise<InitialTaskState> {
  const settings = (await getAppSettings()) || createDefaultAppSettings();
  const today = getBusinessDateKey(new Date(), settings.rolloverTime);
  const savedTasks = await loadTasks();
  const savedWorkNotes = await window.electronAPI?.getStore(DAILY_WORK_KEY);
  const savedInspirationNotes = await window.electronAPI?.getStore(DAILY_INSPIRATION_KEY);
  const savedSelectedDate = await window.electronAPI?.getStore(SELECTED_DATE_KEY) as string | undefined;
  const savedLastActiveDay = await window.electronAPI?.getStore(LAST_ACTIVE_DAY_KEY) as string | undefined;
  const savedActiveTab = await window.electronAPI?.getStore(ACTIVE_TAB_KEY) as TabType | undefined;
  const savedCarryoverLedger = await window.electronAPI?.getStore(TASK_CARRYOVER_LEDGER_KEY) as TaskCarryoverLedger | undefined;
  const savedRetainedReviews = await window.electronAPI?.getStore(RETAINED_OBSIDIAN_REVIEWS_KEY) as RetainedObsidianReview[] | undefined;
  const savedTaskListOrder = await window.electronAPI?.getStore(TASK_LIST_ORDER_KEY);
  const obsidianPath = await getObsidianPath();
  const shouldStartToday = !savedSelectedDate || savedLastActiveDay !== today;
  const carryoverResult = applyBusinessDateCarryover({
    tasks: savedTasks,
    targetDate: today,
    ledger: savedCarryoverLedger || {},
    settings,
  });

  return {
    settings,
    today,
    tasks: carryoverResult.tasks,
    dailyWorkNotes: readRecord(savedWorkNotes),
    dailyInspirationNotes: readRecord(savedInspirationNotes),
    retainedObsidianReviews: Array.isArray(savedRetainedReviews) ? savedRetainedReviews : [],
    taskListOrderByDate: readTaskListOrder(savedTaskListOrder),
    selectedDate: shouldStartToday ? today : savedSelectedDate || today,
    activeTab: savedActiveTab,
    obsidianPath,
    carryoverLedger: carryoverResult.ledger,
  };
}

export function persistTaskUiState({
  dailyWorkNotes,
  dailyInspirationNotes,
  selectedDate,
  currentDate,
  activeTab,
  taskListOrderByDate,
}: PersistTaskUiStateInput) {
  window.electronAPI?.setStore(DAILY_WORK_KEY, dailyWorkNotes);
  window.electronAPI?.setStore(DAILY_INSPIRATION_KEY, dailyInspirationNotes);
  window.electronAPI?.setStore(SELECTED_DATE_KEY, selectedDate);
  window.electronAPI?.setStore(LAST_ACTIVE_DAY_KEY, currentDate);
  window.electronAPI?.setStore(ACTIVE_TAB_KEY, activeTab);
  window.electronAPI?.setStore(TASK_LIST_ORDER_KEY, taskListOrderByDate);
}
