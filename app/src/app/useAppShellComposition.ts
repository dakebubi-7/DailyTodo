import { useMemo, type RefObject } from 'react';
import type { useTasks } from '../hooks/useTasks';
import {
  importMobileInbox,
  previewCompanionSync,
  previewTasksToObsidian,
  resetObsidianTemplateSettings,
  setCompanionSettings,
  setObsidianTemplateSettings,
  writeCompanionSync,
} from '../store/taskStore';
import type { AppThemeState } from './appThemeState';
import { createAppCompanionActions, createCompanionSettingsUpdater } from './appCompanionActions';
import { createAppCompanionCaptureGetter } from './appCompanionCapture';
import { createAppCompletionActions } from './appCompletionActions';
import { hasDailyPanelContent } from './appDailyPanelPresentation';
import { createAppModalActions } from './appModalActions';
import { createAppObsidianTemplateActions } from './appObsidianTemplateActions';
import { createAppPersonalizationActions } from './appPersonalization';
import { createAppReviewDialogState } from './appReviewDialogState';
import { createAppShellComposition, type AppShellComposition } from './appShellComposition';
import { createAppShellCompositionInputs } from './appShellCompositionInputs';
import { createAppTaskView } from './appTaskView';
import { createAppUiActions } from './appUiActions';
import type { AppLocalState } from './useAppLocalState';

type AppTaskState = ReturnType<typeof useTasks>;

export interface UseAppShellCompositionOptions {
  appState: AppLocalState;
  taskState: AppTaskState;
  themeState: AppThemeState;
  mainScrollRef: RefObject<HTMLDivElement>;
}

export function useAppShellComposition({
  appState,
  taskState,
  themeState,
  mainScrollRef,
}: UseAppShellCompositionOptions): AppShellComposition {
  const hasDailyWorkContent = hasDailyPanelContent(taskState.dailyWork);
  const hasDailyInspirationContent = hasDailyPanelContent(taskState.dailyInspiration);
  const appUiActions = useMemo(() => createAppUiActions({
    setIsDailyWorkOpen: appState.setIsDailyWorkOpen,
    setIsInspirationOpen: appState.setIsInspirationOpen,
    setSearchOpen: appState.setSearchOpen,
    setShowOpenOnly: appState.setShowOpenOnly,
  }), []);

  const {
    visibleTasks,
    dragDisabled,
    selectedDateTasksForCommands,
  } = useMemo(
    () => createAppTaskView({
      tasks: taskState.tasks,
      selectedDateTaskCommands: taskState.selectedDateTaskCommands,
      activeTab: taskState.activeTab,
      searchQuery: appState.searchQuery,
      showOpenOnly: appState.showOpenOnly,
      priorityFilter: appState.priorityFilter,
    }),
    [taskState.tasks, taskState.selectedDateTaskCommands, taskState.activeTab, appState.searchQuery, appState.showOpenOnly, appState.priorityFilter],
  );

  const reviewDialogState = createAppReviewDialogState({
    allTasks: taskState.allTasks,
    completionTask: appState.completionTask,
    reviewTask: appState.reviewTask,
  });

  const completionActions = useMemo(() => createAppCompletionActions({
    tasks: taskState.tasks,
    allTasks: taskState.allTasks,
    completionTarget: appState.completionTarget,
    mainTaskCompletionReviewEnabled: taskState.appSettings.mainTaskCompletionReviewEnabled,
    subtaskCompletionReviewEnabled: taskState.appSettings.subtaskCompletionReviewEnabled,
    toggleTask: taskState.toggleTask,
    toggleSubtask: taskState.toggleSubtask,
    markSubtaskDoneWithoutReview: taskState.markSubtaskDoneWithoutReview,
    completeTaskWithReview: taskState.completeTaskWithReview,
    updateSubtaskReview: taskState.updateSubtaskReview,
    updateTask: taskState.updateTask,
    setCompletionTarget: appState.setCompletionTarget,
    setCompletionTask: appState.setCompletionTask,
    setReviewTask: appState.setReviewTask,
  }), [
    taskState.allTasks,
    taskState.appSettings.mainTaskCompletionReviewEnabled,
    taskState.appSettings.subtaskCompletionReviewEnabled,
    taskState.completeTaskWithReview,
    appState.completionTarget,
    taskState.markSubtaskDoneWithoutReview,
    taskState.tasks,
    taskState.toggleSubtask,
    taskState.toggleTask,
    taskState.updateSubtaskReview,
    taskState.updateTask,
  ]);

  const getCurrentCaptureItems = useMemo(() => createAppCompanionCaptureGetter({
    allTasks: taskState.allTasks,
    selectedDate: taskState.selectedDate,
    dailyWork: taskState.dailyWork,
    dailyInspiration: taskState.dailyInspiration,
    mobileCaptureItems: appState.mobileCaptureItems,
  }), [taskState.allTasks, taskState.selectedDate, taskState.dailyWork, taskState.dailyInspiration, appState.mobileCaptureItems]);

  const updateCompanionSettings = useMemo(() => createCompanionSettingsUpdater({
    getCompanionSettings: () => appState.companionSettings,
    setCompanionSettingsState: appState.setCompanionSettingsState,
    setCompanionSettings,
  }), [appState.companionSettings]);

  const appPersonalizationActions = useMemo(() => createAppPersonalizationActions({
    personalization: appState.personalization,
    activeThemeId: themeState.activeThemeId,
    themeOverrides: appState.themeOverrides,
    setPersonalization: appState.setPersonalization,
    setThemeOverrides: appState.setThemeOverrides,
    toggleDarkMode: taskState.toggleDarkMode,
  }), [appState.personalization, themeState.activeThemeId, appState.themeOverrides, taskState.toggleDarkMode]);

  const companionActions = useMemo(() => createAppCompanionActions({
    companionSettings: appState.companionSettings,
    chooseObsidianFolder: taskState.chooseObsidianFolder,
    updateCompanionSettings,
    previewCompanionSync,
    writeCompanionSync,
    importMobileInbox,
    getCurrentCaptureItems,
    setCompanionPlan: appState.setCompanionPlan,
    setCompanionStatus: appState.setCompanionStatus,
    setMobileCaptureItems: appState.setMobileCaptureItems,
  }), [appState.companionSettings, taskState.chooseObsidianFolder, updateCompanionSettings, getCurrentCaptureItems]);

  const templateActions = useMemo(() => createAppObsidianTemplateActions({
    obsidianSyncTasks: taskState.obsidianSyncTasks,
    selectedDate: taskState.selectedDate,
    dailyWork: taskState.dailyWork,
    dailyInspiration: taskState.dailyInspiration,
    allTasks: taskState.allTasks,
    setObsidianTemplatesState: appState.setObsidianTemplatesState,
    setSettingsSyncPreview: appState.setSettingsSyncPreview,
    setObsidianTemplateSettings,
    resetObsidianTemplateSettings,
    previewTasksToObsidian,
  }), [taskState.obsidianSyncTasks, taskState.selectedDate, taskState.dailyWork, taskState.dailyInspiration, taskState.allTasks]);

  const appModalActions = useMemo(() => createAppModalActions({
    appSettings: taskState.appSettings,
    obsidianTemplates: appState.obsidianTemplates,
    editingTemplateKind: appState.editingTemplateKind,
    aiReview: window.electronAPI?.aiReview,
    updateAppSettings: taskState.updateAppSettings,
    updateObsidianTemplates: templateActions.updateObsidianTemplates,
    setCompactMode: appState.setCompactMode,
    setSettingsOpen: appState.setSettingsOpen,
    setCompanionOpen: appState.setCompanionOpen,
    setAiOnboarding: appState.setAiOnboarding,
    setCompletionTask: appState.setCompletionTask,
    setReviewTask: appState.setReviewTask,
    setEditingTemplateKind: appState.setEditingTemplateKind,
  }), [taskState.appSettings, appState.obsidianTemplates, appState.editingTemplateKind, taskState.updateAppSettings, templateActions.updateObsidianTemplates]);

  return createAppShellComposition(createAppShellCompositionInputs({
    appState,
    taskState,
    mainScrollRef,
    reviewDialogState,
    appUiActions,
    appModalActions,
    appPersonalizationActions,
    completionActions,
    companionActions,
    updateCompanionSettings,
    templateActions,
    hasDailyWorkContent,
    hasDailyInspirationContent,
    visibleTasks,
    dragDisabled,
    selectedDateTasksForCommands,
  }));
}
