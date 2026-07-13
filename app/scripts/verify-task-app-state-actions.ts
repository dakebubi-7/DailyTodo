import assert from 'node:assert/strict';
import { createDefaultAppSettings, type AppBehaviorSettings } from '../shared/appSettings';
import { createTaskAppStateActionHandlers } from '../src/hooks/taskAppStateActions';

const settings: AppBehaviorSettings = {
  ...createDefaultAppSettings(),
  syncDeletedReviewsToObsidian: false,
};
let appliedSettings: AppBehaviorSettings | undefined;
let persistedSettings: AppBehaviorSettings | undefined;
let persistedRetainedReviews: unknown;
let retainedReviews = ['retained-review'];
let dailyWork: Record<string, string> = {};
let dailyInspiration: Record<string, string> = {};

const actions = createTaskAppStateActionHandlers({
  appSettings: settings,
  selectedDate: '2026-07-13',
  areSettingsEqual: (left, right) => left.rolloverTime === right.rolloverTime && left.syncDeletedReviewsToObsidian === right.syncDeletedReviewsToObsidian,
  shouldClearRetainedReviews: (next) => next.syncDeletedReviewsToObsidian,
  setAppSettings(value) {
    appliedSettings = value;
  },
  persistAppSettings(value) {
    persistedSettings = value;
  },
  setRetainedReviews(updater) {
    retainedReviews = updater(retainedReviews);
  },
  persistRetainedReviews(value) {
    persistedRetainedReviews = value;
  },
  setDailyWork(updater) {
    dailyWork = updater(dailyWork);
  },
  setDailyInspiration(updater) {
    dailyInspiration = updater(dailyInspiration);
  },
});

const nextSettings = {
  ...settings,
  syncDeletedReviewsToObsidian: true,
  rolloverTime: '06:00',
};
actions.updateAppSettings(nextSettings);
assert.deepEqual(retainedReviews, [], 'enabling retained-review sync should clear retained reviews.');
assert.deepEqual(persistedRetainedReviews, [], 'cleared retained reviews should be persisted.');
assert.deepEqual(appliedSettings, nextSettings);
assert.deepEqual(persistedSettings, nextSettings);

appliedSettings = undefined;
persistedSettings = undefined;
actions.updateAppSettings(settings);
assert.equal(appliedSettings, undefined, 'equivalent settings should not replace state.');
assert.equal(persistedSettings, undefined, 'equivalent settings should not write to persistence.');

actions.updateDailyWork('work note');
actions.updateDailyInspiration('idea note');
assert.deepEqual(dailyWork, { '2026-07-13': 'work note' });
assert.deepEqual(dailyInspiration, { '2026-07-13': 'idea note' });

console.log('Task app-state actions verification passed');
