import assert from 'node:assert/strict';
import { areAppUiStateStoreEntriesEqual, createAppUiStateStoreEntries } from '../src/app/appUiStatePersistenceSnapshot';

const base = {
  isDailyWorkOpen: true,
  isInspirationOpen: false,
  searchQuery: 'review',
  searchOpen: true,
  showOpenOnly: false,
  priorityFilter: 'high' as const,
  personalizationReady: false,
  personalization: { fontScale: 1 },
  themeOverrides: {},
  isDark: true,
};

const withoutPersonalization = createAppUiStateStoreEntries(base);
assert.deepEqual(
  withoutPersonalization,
  {
    dailyWorkOpen: true,
    dailyInspirationOpen: false,
    taskSearchQuery: 'review',
    taskSearchOpen: true,
    taskOpenOnly: false,
    taskPriorityFilter: 'high',
  },
  'non-personalized UI snapshots should retain the existing core store keys only',
);

const personalized = createAppUiStateStoreEntries({
  ...base,
  personalizationReady: true,
  personalization: { fontScale: 1.2 },
  themeOverrides: { light: { taskOpacity: 0.8 } },
});
assert.equal(personalized.isDark, true, 'personalized snapshots should include the theme mode');
assert.equal(areAppUiStateStoreEntriesEqual(personalized, { ...personalized }), true, 'equivalent snapshots should compare equal');
assert.equal(
  areAppUiStateStoreEntriesEqual(personalized, { ...personalized, taskSearchOpen: false }),
  false,
  'changed nested or scalar store values should schedule a new persistence write',
);

console.log('app UI state persistence snapshot verification passed');
