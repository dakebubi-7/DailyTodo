import type { PersonalizationSettings, ThemeOpacityOverride } from '../types/personalization';
import type { PriorityFilter } from './appTaskView';
import { PERSONALIZATION_KEY, THEME_OVERRIDES_KEY } from './appPersonalization';
import { createAppUiStateLoadSnapshot, mergeAppUiStateLoadThemeOverrides } from './appUiStateLoadSnapshot';
import { areAppUiStateStoreEntriesEqual, createAppUiStateStoreEntries } from './appUiStatePersistenceSnapshot';

const UI_STATE_PERSIST_DELAY_MS = 150;
let uiStatePersistTimer: number | undefined;
let lastPersistedCompactMode: boolean | undefined;
let lastPersistedStoreEntries: Record<string, unknown> | undefined;
let pendingStoreEntries: Record<string, unknown> | undefined;
let isAppUiStateHydrated = false;
let pendingLoadedAppUiState: AppUiStatePersistOptions | undefined;

export interface AppUiStateLoadHandlers {
  setCompactMode: (value: boolean) => void;
  setIsDailyWorkOpen: (value: boolean) => void;
  setIsInspirationOpen: (value: boolean) => void;
  setSearchQuery: (value: string) => void;
  setSearchOpen: (value: boolean) => void;
  setShowOpenOnly: (value: boolean) => void;
  setPriorityFilter: (value: PriorityFilter) => void;
  setPersonalization: (value: PersonalizationSettings) => void;
  setThemeOverrides: (updater: (prev: Record<string, ThemeOpacityOverride>) => Record<string, ThemeOpacityOverride>) => void;
  setPersonalizationReady: (value: boolean) => void;
  setDarkMode: (value: boolean) => void;
}

export interface AppUiStatePersistOptions {
  compactMode: boolean;
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

export function primeAppUiStatePersistence(input: AppUiStatePersistOptions): void {
  if (uiStatePersistTimer !== undefined) {
    window.clearTimeout(uiStatePersistTimer);
    uiStatePersistTimer = undefined;
  }
  pendingStoreEntries = undefined;
  lastPersistedStoreEntries = createAppUiStateStoreEntries(input);
  isAppUiStateHydrated = true;
}

function completeAppUiStateHydration(): void {
  if (!pendingLoadedAppUiState || lastPersistedCompactMode === undefined) return;
  primeAppUiStatePersistence({
    ...pendingLoadedAppUiState,
    compactMode: lastPersistedCompactMode,
  });
  pendingLoadedAppUiState = undefined;
}

export function loadAppUiState(handlers: AppUiStateLoadHandlers): void {
  isAppUiStateHydrated = false;
  pendingLoadedAppUiState = undefined;
  window.electronAPI?.getWindowCompactMode().then((value) => {
    lastPersistedCompactMode = value === true;
    handlers.setCompactMode(lastPersistedCompactMode);
    completeAppUiStateHydration();
  });
  window.electronAPI?.getStoreMany([
    'dailyWorkOpen',
    'dailyInspirationOpen',
    'taskSearchQuery',
    'taskSearchOpen',
    'taskOpenOnly',
    'taskPriorityFilter',
    PERSONALIZATION_KEY,
    THEME_OVERRIDES_KEY,
    'isDark',
  ]).then((value) => {
    const snapshot = createAppUiStateLoadSnapshot(value);
    handlers.setIsDailyWorkOpen(snapshot.isDailyWorkOpen);
    handlers.setIsInspirationOpen(snapshot.isInspirationOpen);
    handlers.setSearchQuery(snapshot.searchQuery);
    handlers.setSearchOpen(snapshot.searchOpen);
    handlers.setShowOpenOnly(snapshot.showOpenOnly);
    handlers.setPriorityFilter(snapshot.priorityFilter);
    if (snapshot.loadedPersonalization) {
      handlers.setPersonalization(snapshot.loadedPersonalization);
    }
    handlers.setPersonalizationReady(true);
    handlers.setThemeOverrides((prev) => mergeAppUiStateLoadThemeOverrides(prev, snapshot));
    handlers.setDarkMode(snapshot.isDark);
    pendingLoadedAppUiState = {
      compactMode: false,
      isDailyWorkOpen: snapshot.isDailyWorkOpen,
      isInspirationOpen: snapshot.isInspirationOpen,
      searchQuery: snapshot.searchQuery,
      searchOpen: snapshot.searchOpen,
      showOpenOnly: snapshot.showOpenOnly,
      priorityFilter: snapshot.priorityFilter,
      personalizationReady: true,
      personalization: snapshot.personalization,
      themeOverrides: snapshot.themeOverrides,
      isDark: snapshot.isDark,
    };
    completeAppUiStateHydration();
  });
}

export function persistAppUiState({
  compactMode,
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
}: AppUiStatePersistOptions): void {
  if (!isAppUiStateHydrated) return;
  if (lastPersistedCompactMode !== compactMode) {
    lastPersistedCompactMode = compactMode;
    window.electronAPI?.setWindowCompactMode(compactMode);
  }
  const storeEntries = createAppUiStateStoreEntries({
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
  });
  if (lastPersistedStoreEntries && areAppUiStateStoreEntriesEqual(lastPersistedStoreEntries, storeEntries)) {
    if (uiStatePersistTimer !== undefined) {
      window.clearTimeout(uiStatePersistTimer);
      uiStatePersistTimer = undefined;
    }
    pendingStoreEntries = undefined;
    return;
  }
  if (pendingStoreEntries && areAppUiStateStoreEntriesEqual(pendingStoreEntries, storeEntries)) return;
  if (uiStatePersistTimer !== undefined) {
    window.clearTimeout(uiStatePersistTimer);
  }
  pendingStoreEntries = storeEntries;
  uiStatePersistTimer = window.setTimeout(() => {
    uiStatePersistTimer = undefined;
    pendingStoreEntries = undefined;
    lastPersistedStoreEntries = storeEntries;
    window.electronAPI?.setStoreMany(storeEntries);
  }, UI_STATE_PERSIST_DELAY_MS);
}
