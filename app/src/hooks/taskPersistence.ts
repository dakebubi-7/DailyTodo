export {
  areTaskCarryoverLedgersEqual,
  loadInitialTaskState,
  parseStoredActiveTab,
  parseStoredCarryoverLedger,
  parseStoredDateKey,
  parseStoredRetainedObsidianReviews,
  parseStoredStringRecord,
  parseStoredTaskListOrder,
  RETAINED_OBSIDIAN_REVIEWS_KEY,
  TASK_CARRYOVER_LEDGER_KEY,
  updateStringRecordValue,
  type InitialTaskState,
} from './taskPersistenceInitialization';
export { TASK_LIST_ORDER_KEY } from '../utils/taskOrdering';

export {
  ACTIVE_TAB_KEY,
  DAILY_INSPIRATION_KEY,
  DAILY_WORK_KEY,
  LAST_ACTIVE_DAY_KEY,
  SELECTED_DATE_KEY,
  persistTaskUiState,
  primeTaskUiStatePersistence,
  type PersistTaskUiStateInput,
} from './taskUiStatePersistence';

type TaskTreePersistenceOptions<T> = {
  delay: number;
  persist: (value: T) => void;
  areEqual?: (left: T, right: T) => boolean;
  scheduleTimer?: (callback: () => void, delay: number) => unknown;
  cancelTimer?: (timer: unknown) => void;
};

export function createTaskTreePersistence<T>({
  delay,
  persist,
  areEqual,
  scheduleTimer = (callback, timeout) => window.setTimeout(callback, timeout),
  cancelTimer = (timer) => window.clearTimeout(timer as number),
}: TaskTreePersistenceOptions<T>) {
  let timer: unknown;
  let hasPendingValue = false;
  let pendingValue: T;
  let persistedValue: T;
  let hasPersistedValue = false;

  const discard = () => {
    if (timer !== undefined) cancelTimer(timer);
    timer = undefined;
    hasPendingValue = false;
  };

  const flush = () => {
    if (!hasPendingValue) return;
    const value = pendingValue;
    discard();
    persist(value);
    persistedValue = value;
    hasPersistedValue = true;
  };

  return {
    schedule(value: T) {
      if (hasPendingValue && areEqual?.(pendingValue, value)) return;
      if (hasPersistedValue && areEqual?.(persistedValue, value)) {
        discard();
        return;
      }
      discard();
      pendingValue = value;
      hasPendingValue = true;
      timer = scheduleTimer(() => {
        timer = undefined;
        flush();
      }, delay);
    },
    discard,
    reset() {
      discard();
      hasPersistedValue = false;
    },
    prime(value: T) {
      discard();
      persistedValue = value;
      hasPersistedValue = true;
    },
    flush,
  };
}
