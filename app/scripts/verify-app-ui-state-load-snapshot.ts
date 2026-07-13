import assert from 'node:assert/strict';
import { createAppUiStateLoadSnapshot } from '../src/app/appUiStateLoadSnapshot';
import { DEFAULT_PERSONALIZATION } from '../src/types/personalization';

const malformed = createAppUiStateLoadSnapshot({
  dailyWorkOpen: 'yes',
  dailyInspirationOpen: true,
  taskSearchQuery: 42,
  taskSearchOpen: 1,
  taskOpenOnly: false,
  taskPriorityFilter: 'urgent',
  isDark: 'dark',
  personalizationSettings: null,
  themeOpacityOverrides: null,
});

assert.deepEqual(
  malformed,
  {
    isDailyWorkOpen: false,
    isInspirationOpen: true,
    searchQuery: '',
    searchOpen: false,
    showOpenOnly: false,
    priorityFilter: 'all',
    loadedPersonalization: null,
    personalization: DEFAULT_PERSONALIZATION,
    storedThemeOverrides: null,
    themeOverrides: {},
    isDark: false,
  },
  'invalid Store values should resolve to the existing UI-state defaults',
);

const loaded = createAppUiStateLoadSnapshot({
  dailyWorkOpen: true,
  dailyInspirationOpen: false,
  taskSearchQuery: 'review',
  taskSearchOpen: true,
  taskOpenOnly: true,
  taskPriorityFilter: 'high',
  isDark: true,
  personalizationSettings: { themeId: 'minimal', windowOpacity: 61 },
  themeOpacityOverrides: { minimal: { windowOpacity: 55 } },
});

assert.equal(loaded.searchQuery, 'review');
assert.equal(loaded.priorityFilter, 'high');
assert.equal(loaded.loadedPersonalization?.windowOpacity, 61);
assert.equal(loaded.personalization.themeId, 'minimal');
assert.deepEqual(loaded.themeOverrides, { minimal: { windowOpacity: 55 } });
assert.equal(loaded.isDark, true);

console.log('App UI-state load snapshot verification passed');
