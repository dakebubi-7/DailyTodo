import type { ComponentProps } from 'react';
import { getShellText } from '../i18n';
import { AddTaskInput } from '../components/AddTaskInput';
import { AppMainContent } from '../components/AppMainContent';
import { AppTopContent } from '../components/AppTopContent';
import { DateNavigator } from '../components/DateNavigator';
import { Header } from '../components/Header';
import { ReviewView } from '../components/ReviewView';
import { TaskList } from '../components/TaskList';
import type { AppBehaviorSettings } from '../../shared/appSettings';
import type { createAppCompletionActions } from './appCompletionActions';
import type { createAppUiActions } from './appUiActions';

export interface AppShellMainContentCompositionOptions {
  appSettings: Pick<AppBehaviorSettings, 'language'>;
  appUiActions: ReturnType<typeof createAppUiActions>;
  completionActions: ReturnType<typeof createAppCompletionActions>;
  mainScrollRef: ComponentProps<typeof AppMainContent>['mainScrollRef'];
  isDark: ComponentProps<typeof Header>['isDark'];
  selectedDate: ComponentProps<typeof Header>['selectedDate'];
  setSelectedDate: ComponentProps<typeof DateNavigator>['onDateChange'];
  calendarTasks: ComponentProps<typeof DateNavigator>['tasks'];
  allTasks: ComponentProps<typeof ReviewView>['allTasks'];
  editTaskReview: ComponentProps<typeof ReviewView>['onEditReview'];
  deleteTaskReview: ComponentProps<typeof ReviewView>['onDeleteReview'];
  totalCount: ComponentProps<typeof Header>['totalCount'];
  completedCount: ComponentProps<typeof Header>['completedCount'];
  obsidianPath: ComponentProps<typeof Header>['obsidianPath'];
  syncStatus: ComponentProps<typeof Header>['syncStatus'];
  chooseObsidianFolder: ComponentProps<typeof Header>['onChooseObsidian'];
  openSelectedDailyNote: ComponentProps<typeof Header>['onOpenTodayNote'];
  selectedDateTasksForCommands: ComponentProps<typeof TaskList>['selectedDateTasksForCommands'];
  dailyWork: ComponentProps<typeof TaskList>['dailyWork'];
  dailyInspiration: ComponentProps<typeof TaskList>['dailyInspiration'];
  hasDailyWorkContent: ComponentProps<typeof TaskList>['hasDailyWorkContent'];
  hasDailyInspirationContent: ComponentProps<typeof TaskList>['hasDailyInspirationContent'];
  isDailyWorkOpen: ComponentProps<typeof TaskList>['isDailyWorkOpen'];
  isInspirationOpen: ComponentProps<typeof TaskList>['isInspirationOpen'];
  updateDailyWork: ComponentProps<typeof TaskList>['onChangeDailyWork'];
  updateDailyInspiration: ComponentProps<typeof TaskList>['onChangeDailyInspiration'];
  activeTab: ComponentProps<typeof TaskList>['activeTab'];
  setActiveTab: ComponentProps<typeof TaskList>['onTabChange'];
  visibleTasks: ComponentProps<typeof TaskList>['tasks'];
  sourceOrderForSelectedDate: ComponentProps<typeof TaskList>['sourceOrder'];
  dragDisabled: ComponentProps<typeof TaskList>['dragDisabled'];
  reorderSourceGroups: ComponentProps<typeof TaskList>['onReorderSources'];
  reorderTasksWithinSource: ComponentProps<typeof TaskList>['onReorderTasks'];
  searchQuery: ComponentProps<typeof TaskList>['searchQuery'];
  setSearchQuery: ComponentProps<typeof TaskList>['onSearchChange'];
  searchOpen: ComponentProps<typeof TaskList>['searchOpen'];
  showOpenOnly: ComponentProps<typeof TaskList>['showOpenOnly'];
  priorityFilter: ComponentProps<typeof TaskList>['priorityFilter'];
  setPriorityFilter: ComponentProps<typeof TaskList>['onPriorityFilterChange'];
  deleteTask: ComponentProps<typeof TaskList>['onDelete'];
  editTask: ComponentProps<typeof TaskList>['onEdit'];
  deleteSubtask: ComponentProps<typeof TaskList>['onDeleteSubtask'];
  toggleTaskCollapse: ComponentProps<typeof TaskList>['onToggleCollapse'];
  changePriority: ComponentProps<typeof TaskList>['onPriorityChange'];
  editRequest: ComponentProps<typeof TaskList>['editRequest'];
  addTask: ComponentProps<typeof AddTaskInput>['onAdd'];
  toggleDarkModeAction: ComponentProps<typeof Header>['onToggleDark'];
}

export function createAppShellMainContentComposition({
  appSettings,
  appUiActions,
  completionActions,
  mainScrollRef,
  isDark,
  selectedDate,
  setSelectedDate,
  calendarTasks,
  allTasks,
  editTaskReview,
  deleteTaskReview,
  totalCount,
  completedCount,
  obsidianPath,
  syncStatus,
  chooseObsidianFolder,
  openSelectedDailyNote,
  selectedDateTasksForCommands,
  dailyWork,
  dailyInspiration,
  hasDailyWorkContent,
  hasDailyInspirationContent,
  isDailyWorkOpen,
  isInspirationOpen,
  updateDailyWork,
  updateDailyInspiration,
  activeTab,
  setActiveTab,
  visibleTasks,
  sourceOrderForSelectedDate,
  dragDisabled,
  reorderSourceGroups,
  reorderTasksWithinSource,
  searchQuery,
  setSearchQuery,
  searchOpen,
  showOpenOnly,
  priorityFilter,
  setPriorityFilter,
  deleteTask,
  editTask,
  deleteSubtask,
  toggleTaskCollapse,
  changePriority,
  editRequest,
  addTask,
  toggleDarkModeAction,
}: AppShellMainContentCompositionOptions): ComponentProps<typeof AppMainContent> {
  const shellText = getShellText(appSettings.language);
  const headerProps = {
    selectedDate,
    completedCount,
    totalCount,
    isDark,
    onToggleDark: toggleDarkModeAction,
    obsidianPath,
    syncStatus,
    onChooseObsidian: chooseObsidianFolder,
    onOpenTodayNote: openSelectedDailyNote,
  };
  const dateNavigatorProps = {
    selectedDate,
    tasks: calendarTasks,
    language: appSettings.language,
    text: shellText.app,
    onDateChange: setSelectedDate,
  };
  const topContentProps = {
    headerProps,
    dateNavigatorProps,
    shellText: shellText.app,
  };
  const reviewViewProps = {
    allTasks,
    text: shellText.app,
    activeTab,
    onTabChange: setActiveTab,
    onEditReview: editTaskReview,
    onDeleteReview: deleteTaskReview,
  };
  const taskListProps = {
    tasks: visibleTasks,
    selectedDate,
    sourceOrder: sourceOrderForSelectedDate,
    dragDisabled,
    onReorderSources: reorderSourceGroups,
    onReorderTasks: reorderTasksWithinSource,
    searchQuery,
    onSearchChange: setSearchQuery,
    searchOpen,
    onToggleSearch: appUiActions.toggleSearchOpen,
    showOpenOnly,
    onToggleOpenOnly: appUiActions.toggleShowOpenOnly,
    priorityFilter,
    onPriorityFilterChange: setPriorityFilter,
    text: shellText.app,
    activeTab,
    onTabChange: setActiveTab,
    hasDailyWorkContent,
    hasDailyInspirationContent,
    isDailyWorkOpen,
    isInspirationOpen,
    onToggleDailyWorkPanel: appUiActions.toggleDailyWorkPanel,
    onToggleInspirationPanel: appUiActions.toggleInspirationPanel,
    selectedDateTasksForCommands,
    language: appSettings.language,
    dailyWork,
    dailyInspiration,
    onChangeDailyWork: updateDailyWork,
    onChangeDailyInspiration: updateDailyInspiration,
    onCloseDailyWorkPanel: appUiActions.closeDailyWorkPanel,
    onCloseInspirationPanel: appUiActions.closeInspirationPanel,
    onToggle: completionActions.toggleTask,
    onDelete: deleteTask,
    onEdit: editTask,
    onPriorityChange: changePriority,
    onViewReview: completionActions.viewCompletion,
    onToggleSubtask: completionActions.toggleSubtask,
    onDeleteSubtask: deleteSubtask,
    onToggleCollapse: toggleTaskCollapse,
    onViewSubtaskReview: completionActions.viewCompletion,
    onEditSubtask: editTask,
    onChangeSubtaskPriority: completionActions.changeSubtaskPriority,
    editRequest,
  };
  const addTaskInputProps = {
    onAdd: addTask,
  };

  return {
    mainScrollRef,
    topContent: <AppTopContent {...topContentProps} />,
    isReviewTab: activeTab === 'completed',
    reviewViewProps,
    taskListProps,
    addTaskInputProps,
  };
}
