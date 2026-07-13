type DeferredPersistenceOptions<T> = {
  delay: number;
  persist: (value: T) => void;
  initialValue?: T;
  areEqual?: (left: T, right: T) => boolean;
  scheduleTimer?: (callback: () => void, delay: number) => unknown;
  cancelTimer?: (timer: unknown) => void;
};

export function areDeferredPersistenceValuesEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (
    left === null ||
    right === null ||
    typeof left !== 'object' ||
    typeof right !== 'object'
  ) {
    return false;
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left)
      && Array.isArray(right)
      && left.length === right.length
      && left.every((value, index) => areDeferredPersistenceValuesEqual(value, right[index]));
  }

  const leftEntries = Object.entries(left);
  const rightEntries = Object.entries(right);
  return leftEntries.length === rightEntries.length
    && leftEntries.every(([key, value]) =>
      Object.prototype.hasOwnProperty.call(right, key)
      && areDeferredPersistenceValuesEqual(value, Object.getOwnPropertyDescriptor(right, key)?.value),
    );
}

export function createDeferredPersistence<T>({
  delay,
  persist,
  initialValue,
  areEqual = Object.is,
  scheduleTimer = (callback, timeout) => window.setTimeout(callback, timeout),
  cancelTimer = (timer) => window.clearTimeout(timer as number),
}: DeferredPersistenceOptions<T>) {
  let pendingValue: T | undefined;
  let hasPendingValue = false;
  let timer: unknown;
  let persistedValue = initialValue;
  let hasPersistedValue = initialValue !== undefined;

  const flush = () => {
    if (timer !== undefined) {
      cancelTimer(timer);
      timer = undefined;
    }
    if (!hasPendingValue) return;
    hasPendingValue = false;
    const value = pendingValue as T;
    persist(value);
    persistedValue = value;
    hasPersistedValue = true;
  };

  return {
    schedule(value: T) {
      if (hasPendingValue && areEqual(pendingValue as T, value)) return;
      if (hasPersistedValue && areEqual(persistedValue as T, value)) {
        if (timer !== undefined) {
          cancelTimer(timer);
          timer = undefined;
        }
        hasPendingValue = false;
        return;
      }
      pendingValue = value;
      hasPendingValue = true;
      if (timer !== undefined) {
        cancelTimer(timer);
      }
      timer = scheduleTimer(() => {
        timer = undefined;
        flush();
      }, delay);
    },
    flush,
  };
}
