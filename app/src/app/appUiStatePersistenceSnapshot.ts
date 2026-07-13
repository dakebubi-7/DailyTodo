import type { PersonalizationSettings, ThemeOpacityOverride } from '../types/personalization';
import type { PriorityFilter } from './appTaskView';
import { PERSONALIZATION_KEY, THEME_OVERRIDES_KEY } from './appPersonalization';

export interface AppUiStateSnapshotInput {
  isDailyWorkOpen: boolean;
  isInspirationOpen: boolean;
  searchQuery: string;
  searchOpen: boolean;
  showOpenOnly: boolean;
  priorityFilter: PriorityFilter;
  personalizationReady: boolean;
  personalization: PersonalizationSettings;
  themeOverrides: Record<string, ThemeOpacityOverride>;
  isDark: boolean;
}

function areStoreValuesEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return false;

  let leftKeyCount = 0;
  let rightKeyCount = 0;
  for (const key in left) {
    if (Object.prototype.hasOwnProperty.call(left, key)) leftKeyCount += 1;
  }
  for (const key in right) {
    if (Object.prototype.hasOwnProperty.call(right, key)) rightKeyCount += 1;
  }
  if (leftKeyCount !== rightKeyCount) return false;

  for (const key in left) {
    if (!Object.prototype.hasOwnProperty.call(left, key)) continue;
    if (!Object.prototype.hasOwnProperty.call(right, key)) return false;
    if (!areStoreValuesEqual(left[key as keyof typeof left], Object.getOwnPropertyDescriptor(right, key)?.value)) return false;
  }
  return true;
}

export function areAppUiStateStoreEntriesEqual(left: Record<string, unknown>, right: Record<string, unknown>): boolean {
  return areStoreValuesEqual(left, right);
}

export function createAppUiStateStoreEntries({
  isDailyWorkOpen,
  isInspirationOpen,
  searchQuery,
  searchOpen,
  showOpenOnly,
  priorityFilter,
  personalizationReady,
  personalization,
  themeOverrides,
  isDark,
}: AppUiStateSnapshotInput): Record<string, unknown> {
  const storeEntries: Record<string, unknown> = {
    dailyWorkOpen: isDailyWorkOpen,
    dailyInspirationOpen: isInspirationOpen,
    taskSearchQuery: searchQuery,
    taskSearchOpen: searchOpen,
    taskOpenOnly: showOpenOnly,
    taskPriorityFilter: priorityFilter,
  };
  if (personalizationReady) {
    storeEntries[PERSONALIZATION_KEY] = personalization;
    storeEntries[THEME_OVERRIDES_KEY] = themeOverrides;
    storeEntries.isDark = isDark;
  }
  return storeEntries;
}
