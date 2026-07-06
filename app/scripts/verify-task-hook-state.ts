import assert from 'node:assert/strict';
import { createDefaultAppSettings } from '../shared/appSettings';
import {
  getInitialObsidianSyncStatus,
  getSelectedDateAfterBusinessDateChange,
  normalizeIncomingTasks,
  shouldClearRetainedReviewsOnSettingsUpdate,
} from '../src/hooks/taskHookState';

assert.equal(getInitialObsidianSyncStatus('C:/Vault'), 'idle');
assert.equal(getInitialObsidianSyncStatus(''), 'needs-path');

assert.equal(
  getSelectedDateAfterBusinessDateChange('2026-07-05', '2026-07-05', '2026-07-06'),
  '2026-07-06',
);
assert.equal(
  getSelectedDateAfterBusinessDateChange('2026-07-04', '2026-07-05', '2026-07-06'),
  '2026-07-04',
);

const normalizedTasks = normalizeIncomingTasks([
  {
    id: 'legacy-task',
    text: 'Legacy task',
    completed: false,
    priority: 'medium',
    source: 'personal',
    createdAt: '2026-07-06T01:00:00.000Z',
  },
], '2026-07-06');

assert.equal(normalizedTasks.length, 1);
assert.equal(normalizedTasks[0].taskDate, '2026-07-06');
assert.equal(normalizedTasks[0].isToday, true);
assert.deepEqual(normalizeIncomingTasks('not tasks', '2026-07-06'), []);

const defaultSettings = createDefaultAppSettings();
assert.equal(
  shouldClearRetainedReviewsOnSettingsUpdate({
    ...defaultSettings,
    syncDeletedReviewsToObsidian: false,
  }),
  false,
);
assert.equal(
  shouldClearRetainedReviewsOnSettingsUpdate({
    ...defaultSettings,
    syncDeletedReviewsToObsidian: true,
  }),
  true,
);

console.log('task hook state verification passed');
