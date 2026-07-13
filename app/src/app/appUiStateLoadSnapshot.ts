import {
  DEFAULT_PERSONALIZATION,
  type PersonalizationSettings,
  type ThemeOpacityOverride,
} from '../types/personalization';
import { isObjectRecord } from '../../shared/unknownValueGuards';
import { isPriorityFilter, type PriorityFilter } from './appTaskView';
import {
  mergeLoadedThemeOverrides,
  normalizeLoadedPersonalization,
} from './appPersonalization';

export interface AppUiStateLoadSnapshot {
  isDailyWorkOpen: boolean;
  isInspirationOpen: boolean;
  searchQuery: string;
  searchOpen: boolean;
  showOpenOnly: boolean;
  priorityFilter: PriorityFilter;
  loadedPersonalization: PersonalizationSettings | null;
  personalization: PersonalizationSettings;
  storedThemeOverrides: unknown;
  themeOverrides: Record<string, ThemeOpacityOverride>;
  isDark: boolean;
}

export function createAppUiStateLoadSnapshot(value: unknown): AppUiStateLoadSnapshot {
  const storedState = isObjectRecord(value) ? value : {};
  const loadedPersonalization = normalizeLoadedPersonalization(storedState.personalizationSettings);
  return {
    isDailyWorkOpen: storedState.dailyWorkOpen === true,
    isInspirationOpen: storedState.dailyInspirationOpen === true,
    searchQuery: typeof storedState.taskSearchQuery === 'string' ? storedState.taskSearchQuery : '',
    searchOpen: storedState.taskSearchOpen === true,
    showOpenOnly: storedState.taskOpenOnly === true,
    priorityFilter: isPriorityFilter(storedState.taskPriorityFilter) ? storedState.taskPriorityFilter : 'all',
    loadedPersonalization,
    personalization: loadedPersonalization || DEFAULT_PERSONALIZATION,
    storedThemeOverrides: storedState.themeOpacityOverrides,
    themeOverrides: mergeLoadedThemeOverrides({}, loadedPersonalization, storedState.themeOpacityOverrides),
    isDark: storedState.isDark === true,
  };
}

export function mergeAppUiStateLoadThemeOverrides(
  previous: Record<string, ThemeOpacityOverride>,
  snapshot: AppUiStateLoadSnapshot,
): Record<string, ThemeOpacityOverride> {
  return mergeLoadedThemeOverrides(previous, snapshot.loadedPersonalization, snapshot.storedThemeOverrides);
}
