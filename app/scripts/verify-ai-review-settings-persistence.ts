import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createDeferredPersistence } from '../src/components/settings/aiReviewSettingsPersistence';

const persistenceSource = readFileSync(
  new URL('../src/components/settings/aiReviewSettingsPersistence.ts', import.meta.url),
  'utf8',
);
assert.doesNotMatch(
  persistenceSource,
  /right as Record<string, unknown>/,
  'deferred persistence equality should not narrow object values with a Record assertion.',
);
assert.match(
  persistenceSource,
  /Object\.getOwnPropertyDescriptor\(right, key\)\?\.value/,
  'deferred persistence equality should read matching own-property values without an assertion.',
);

type ScheduledTimer = { callback: () => void; active: boolean };

const timers: ScheduledTimer[] = [];
const writes: string[] = [];
const persistence = createDeferredPersistence<string>({
  delay: 300,
  persist: (value) => writes.push(value),
  scheduleTimer: (callback) => {
    const timer = { callback, active: true };
    timers.push(timer);
    return timer;
  },
  cancelTimer: (timer) => {
    timer.active = false;
  },
});

persistence.schedule('first');
persistence.schedule('final');
for (const timer of timers) {
  if (timer.active) timer.callback();
}
assert.deepEqual(writes, ['final'], 'Consecutive updates should persist only the final value.');

persistence.schedule('flush-now');
persistence.flush();
assert.deepEqual(writes, ['final', 'flush-now'], 'Flush should persist the pending value immediately.');

persistence.flush();
assert.deepEqual(writes, ['final', 'flush-now'], 'Flush without pending work should not persist again.');

const restoredTimers: ScheduledTimer[] = [];
const restoredWrites: string[] = [];
const restoredPersistence = createDeferredPersistence<string>({
  delay: 300,
  initialValue: 'original',
  areEqual: (left, right) => left === right,
  persist: (value) => restoredWrites.push(value),
  scheduleTimer: (callback) => {
    const timer = { callback, active: true };
    restoredTimers.push(timer);
    return timer;
  },
  cancelTimer: (timer) => {
    timer.active = false;
  },
});

restoredPersistence.schedule('changed');
restoredPersistence.schedule('original');
for (const timer of restoredTimers) {
  if (timer.active) timer.callback();
}
assert.deepEqual(restoredWrites, [], 'Restoring the persisted value should cancel the pending write.');

console.log('AI review settings persistence verification passed');
