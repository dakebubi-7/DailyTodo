import { useEffect, useRef, type Dispatch, type RefObject, type SetStateAction } from 'react';
import { getCompanionSettings, getObsidianTemplateSettings } from '../store/taskStore';
import { useFloatingScrollbar } from '../hooks/useFloatingScrollbar';
import type { Task } from '../types/task';
import { registerAiReviewLifecycle, requestAiReviewOnboarding } from './appAiReviewLifecycle';
import { registerAppKeyboardShortcutListener } from './appKeyboardShortcuts';
import {
  buildInvisibleGlassSettings,
  shouldSyncInvisibleGlassSettings,
  syncAlwaysOnTopPreference,
  syncDocumentFontScale,
  syncDocumentThemeClasses,
  syncInvisibleGlassTheme,
  syncNativeWindowRadius,
  syncSettingsMode,
} from './appShellEffects';
import { loadAppStartupState } from './appStartupSettings';
import { persistAppUiState } from './appUiStatePersistence';
import { registerTaskMenuActionListener } from './taskMenuActions';
import type { AppLocalState } from './useAppLocalState';
import type { InvisibleGlassSettings } from '../../shared/invisibleGlass';

export interface AppRuntimeTaskEffects {
  allTasks: Task[];
  isLoaded: boolean;
  isDark: boolean;
  setDarkMode: (value: boolean) => void;
  openSelectedDailyNote: () => void;
  setSelectedDate: Dispatch<SetStateAction<string>>;
  addSubtask: (taskId: string, text: string) => void;
  deleteTask: (taskId: string) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
}

export interface AppRuntimeEffectsOptions {
  appState: AppLocalState;
  taskEffects: AppRuntimeTaskEffects;
  mainScrollRef: RefObject<HTMLDivElement>;
  activeThemeId: string | null;
  setNativeGlassApplied: (value: boolean) => void;
}

export function useAppRuntimeEffects({
  appState,
  taskEffects,
  mainScrollRef,
  activeThemeId,
  setNativeGlassApplied,
}: AppRuntimeEffectsOptions): void {
  useFloatingScrollbar(mainScrollRef, { headerSelector: '.app-top' });

  useEffect(() => {
    syncSettingsMode(appState.settingsOpen);
  }, [appState.settingsOpen]);

  useEffect(() => {
    syncDocumentThemeClasses(taskEffects.isDark, appState.personalization.texture);
  }, [taskEffects.isDark, appState.personalization.texture]);

  useEffect(() => {
    syncDocumentFontScale(appState.personalization.fontScale);
  }, [appState.personalization.fontScale]);

  useEffect(() => {
    syncAlwaysOnTopPreference(appState.personalization.alwaysOnTop);
  }, [appState.personalization.alwaysOnTop]);

  useEffect(() => {
    syncNativeWindowRadius(appState.personalization.radius);
  }, [appState.personalization.radius]);

  const previousInvisibleGlassRef = useRef<InvisibleGlassSettings | null>(null);

  useEffect(() => {
    const nextInvisibleGlass = buildInvisibleGlassSettings(
      activeThemeId === 'invisible',
      appState.personalization.windowOpacity,
      appState.personalization.blurStrength,
    );
    if (!shouldSyncInvisibleGlassSettings(previousInvisibleGlassRef.current, nextInvisibleGlass)) {
      return;
    }
    previousInvisibleGlassRef.current = nextInvisibleGlass;
    let current = true;
    void syncInvisibleGlassTheme(
      activeThemeId === 'invisible',
      appState.personalization.windowOpacity,
      appState.personalization.blurStrength,
    ).then((nativeGlassApplied) => {
      if (current) setNativeGlassApplied(nativeGlassApplied);
    });
    return () => {
      current = false;
    };
  }, [
    activeThemeId,
    appState.personalization.blurStrength,
    appState.personalization.windowOpacity,
    setNativeGlassApplied,
  ]);

  useEffect(() => {
    loadAppStartupState({
      uiState: {
        setCompactMode: appState.setCompactMode,
        setIsDailyWorkOpen: appState.setIsDailyWorkOpen,
        setIsInspirationOpen: appState.setIsInspirationOpen,
        setSearchQuery: appState.setSearchQuery,
        setSearchOpen: appState.setSearchOpen,
        setShowOpenOnly: appState.setShowOpenOnly,
        setPriorityFilter: appState.setPriorityFilter,
        setPersonalization: appState.setPersonalization,
        setThemeOverrides: appState.setThemeOverrides,
        setPersonalizationReady: appState.setPersonalizationReady,
        setDarkMode: taskEffects.setDarkMode,
      },
      startupSettings: {
        getCompanionSettings,
        getObsidianTemplateSettings,
        setCompanionSettingsState: appState.setCompanionSettingsState,
        setObsidianTemplatesState: appState.setObsidianTemplatesState,
      },
    });
  }, []);

  const allTasksRef = useRef(taskEffects.allTasks);
  allTasksRef.current = taskEffects.allTasks;

  useEffect(() => {
    if (!taskEffects.isLoaded) return;
    return registerAiReviewLifecycle({
      aiReview: window.electronAPI?.aiReview,
      getCurrentTasks: () => allTasksRef.current,
    });
  }, [taskEffects.isLoaded]);

  useEffect(() => requestAiReviewOnboarding({
    aiReview: window.electronAPI?.aiReview,
    setAiOnboarding: appState.setAiOnboarding,
  }), []);

  useEffect(() => {
    persistAppUiState({
      compactMode: appState.compactMode,
      isDailyWorkOpen: appState.isDailyWorkOpen,
      isInspirationOpen: appState.isInspirationOpen,
      searchQuery: appState.searchQuery,
      searchOpen: appState.searchOpen,
      showOpenOnly: appState.showOpenOnly,
      priorityFilter: appState.priorityFilter,
      personalizationReady: appState.personalizationReady,
      personalization: appState.personalization,
      themeOverrides: appState.themeOverrides,
      isDark: taskEffects.isDark,
    });
  }, [
    appState.compactMode,
    appState.isDailyWorkOpen,
    appState.isInspirationOpen,
    appState.personalization,
    appState.themeOverrides,
    appState.personalizationReady,
    appState.priorityFilter,
    appState.searchOpen,
    appState.searchQuery,
    appState.showOpenOnly,
    taskEffects.isDark,
  ]);

  useEffect(() => registerAppKeyboardShortcutListener(window, {
    setCompactMode: appState.setCompactMode,
    openSelectedDailyNote: taskEffects.openSelectedDailyNote,
    setSelectedDate: taskEffects.setSelectedDate,
  }), [taskEffects.openSelectedDailyNote, taskEffects.setSelectedDate]);

  useEffect(() => {
    const off = registerTaskMenuActionListener(window.electronAPI, {
      addSubtask: taskEffects.addSubtask,
      deleteTask: taskEffects.deleteTask,
      requestTodayFocus: (id) => appState.setTodayFocusRequest((previous) => ({
        id,
        nonce: (previous?.nonce || 0) + 1,
      })),
      setEditRequest: appState.setEditRequest,
      updateTask: taskEffects.updateTask,
    });
    return () => off?.();
  }, [taskEffects.addSubtask, taskEffects.deleteTask, taskEffects.updateTask]);

  useEffect(() => {
    if (activeThemeId !== 'watercolor') return;
    void import('../styles/watercolor-theme.css');
  }, [activeThemeId]);
}
