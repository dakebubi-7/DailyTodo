import type { RefObject } from 'react';
import type { useTasks } from '../hooks/useTasks';
import type { AppLocalState } from './useAppLocalState';
import type { AppShellCompositionOptions } from './appShellComposition';
import { createAppCompanionActions, createCompanionSettingsUpdater } from './appCompanionActions';
import { createAppCompletionActions } from './appCompletionActions';
import { createAppModalActions } from './appModalActions';
import { createAppObsidianTemplateActions } from './appObsidianTemplateActions';
import { createAppPersonalizationActions } from './appPersonalization';
import { createAppReviewDialogState } from './appReviewDialogState';
import { createAppUiActions } from './appUiActions';

type AppTaskState = ReturnType<typeof useTasks>;

export interface AppShellCompositionInputs {
  appState: AppLocalState;
  taskState: AppTaskState;
  mainScrollRef: RefObject<HTMLDivElement>;
  reviewDialogState: ReturnType<typeof createAppReviewDialogState>;
  appUiActions: ReturnType<typeof createAppUiActions>;
  appModalActions: ReturnType<typeof createAppModalActions>;
  appPersonalizationActions: ReturnType<typeof createAppPersonalizationActions>;
  completionActions: ReturnType<typeof createAppCompletionActions>;
  companionActions: ReturnType<typeof createAppCompanionActions>;
  updateCompanionSettings: ReturnType<typeof createCompanionSettingsUpdater>;
  templateActions: ReturnType<typeof createAppObsidianTemplateActions>;
  hasDailyWorkContent: boolean;
  hasDailyInspirationContent: boolean;
  visibleTasks: AppShellCompositionOptions['mainContent']['visibleTasks'];
  dragDisabled: boolean;
  selectedDateTasksForCommands: AppShellCompositionOptions['mainContent']['selectedDateTasksForCommands'];
}

export function createAppShellCompositionInputs({
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
}: AppShellCompositionInputs): AppShellCompositionOptions {
  return {
    titleBar: {
      compactMode: appState.compactMode,
      settingsOpen: appState.settingsOpen,
      lockWindowPosition: taskState.appSettings.lockWindowPosition,
      language: taskState.appSettings.language,
      appModalActions,
    },
    mainContent: {
      appSettings: taskState.appSettings,
      appUiActions,
      completionActions,
      mainScrollRef,
      isDark: taskState.isDark,
      selectedDate: taskState.selectedDate,
      allDates: taskState.allDates,
      setSelectedDate: taskState.setSelectedDate,
      calendarTasks: taskState.allTasks,
      allTasks: taskState.allTasks,
      editTaskReview: taskState.editTaskReview,
      deleteTaskReview: taskState.deleteTaskReview,
      totalCount: taskState.totalCount,
      completedCount: taskState.completedCount,
      obsidianPath: taskState.obsidianPath,
      syncStatus: taskState.syncStatus,
      chooseObsidianFolder: taskState.chooseObsidianFolder,
      openSelectedDailyNote: taskState.openSelectedDailyNote,
      selectedDateTasksForCommands,
      dailyWork: taskState.dailyWork,
      dailyInspiration: taskState.dailyInspiration,
      hasDailyWorkContent,
      hasDailyInspirationContent,
      isDailyWorkOpen: appState.isDailyWorkOpen,
      isInspirationOpen: appState.isInspirationOpen,
      updateDailyWork: taskState.updateDailyWork,
      updateDailyInspiration: taskState.updateDailyInspiration,
      activeTab: taskState.activeTab,
      setActiveTab: taskState.setActiveTab,
      visibleTasks,
      sourceOrderForSelectedDate: taskState.sourceOrderForSelectedDate,
      dragDisabled,
      reorderSourceGroups: taskState.reorderSourceGroups,
      reorderTasksWithinSource: taskState.reorderTasksWithinSource,
      searchQuery: appState.searchQuery,
      setSearchQuery: appState.setSearchQuery,
      searchOpen: appState.searchOpen,
      showOpenOnly: appState.showOpenOnly,
      priorityFilter: appState.priorityFilter,
      setPriorityFilter: appState.setPriorityFilter,
      deleteTask: taskState.deleteTask,
      editTask: taskState.editTask,
      deleteSubtask: taskState.deleteSubtask,
      toggleTaskCollapse: taskState.toggleTaskCollapse,
      changePriority: taskState.changePriority,
      editRequest: appState.editRequest,
      addTask: taskState.addTask,
      toggleDarkModeAction: appPersonalizationActions.toggleDarkModeAction,
    },
    overlay: {
      settingsOpen: appState.settingsOpen,
      personalization: appState.personalization,
      appSettings: taskState.appSettings,
      obsidianTemplates: appState.obsidianTemplates,
      obsidianPath: taskState.obsidianPath,
      settingsSyncPreview: appState.settingsSyncPreview,
      isDark: taskState.isDark,
      selectedDate: taskState.selectedDate,
      completedCount: taskState.completedCount,
      allTasks: taskState.allTasks,
      clearCompleted: taskState.clearCompleted,
      appPersonalizationActions,
      updateAppSettings: taskState.updateAppSettings,
      updateObsidianTemplates: templateActions.updateObsidianTemplates,
      chooseObsidianFolder: taskState.chooseObsidianFolder,
      previewSettingsSync: templateActions.previewSettingsSync,
      resetObsidianTemplates: templateActions.resetObsidianTemplates,
      appModalActions,
      companionOpen: appState.companionOpen,
      companionSettings: appState.companionSettings,
      companionPlan: appState.companionPlan,
      companionStatus: appState.companionStatus,
      updateCompanionSettings,
      chooseCompanionVault: companionActions.chooseCompanionVault,
      previewCompanion: companionActions.previewCompanion,
      syncCompanion: companionActions.syncCompanion,
      importCompanionMobileInbox: companionActions.importCompanionMobileInbox,
      reviewDialogState,
      completionActions,
      deleteTaskReview: taskState.deleteTaskReview,
      aiOnboarding: appState.aiOnboarding,
      editingTemplateKind: appState.editingTemplateKind,
    },
  };
}
