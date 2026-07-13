import type { ComponentProps } from 'react';
import { getShellText } from '../i18n';
import { AddTaskInput } from '../components/AddTaskInput';
import { AppMainContent } from '../components/AppMainContent';
import { AppTopContent } from '../components/AppTopContent';
import { DateNavigator } from '../components/DateNavigator';
import { Header } from '../components/Header';
import { ReviewView } from '../components/ReviewView';
import { TabBar } from '../components/TabBar';
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
  allDates: ComponentProps<typeof DateNavigator>['allDates'];
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
  selectedDateTasksForCommands: ComponentProps<typeof AppTopContent>['selectedDateTasksForCommands'];
  dailyWork: ComponentProps<typeof AppTopContent>['dailyWork'];
  dailyInspiration: ComponentProps<typeof AppTopContent>['dailyInspiration'];
  hasDailyWorkContent: ComponentProps<typeof AppTopContent>['hasDailyWorkContent'];
  hasDailyInspirationContent: ComponentProps<typeof AppTopContent>['hasDailyInspirationContent'];
  isDailyWorkOpen: ComponentProps<typeof AppTopContent>['isDailyWorkOpen'];
  isInspirationOpen: ComponentProps<typeof AppTopContent>['isInspirationOpen'];
  updateDailyWork: ComponentProps<typeof AppTopContent>['onChangeDailyWork'];
  updateDailyInspiration: ComponentProps<typeof AppTopContent>['onChangeDailyInspiration'];
  activeTab: ComponentProps<typeof TabBar>['activeTab'];
  setActiveTab: ComponentProps<typeof TabBar>['onTabChange'];
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
  allDates,
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
    allDates,
    tasks: calendarTasks,
    onDateChange: setSelectedDate,
  };
  const tabBarProps = { activeTab, onTabChange: setActiveTab };
  const topContentProps = {
    headerProps,
    dateNavigatorProps,
    tabBarProps,
    shellText: shellText.app,
    selectedDateTasksForCommands,
    language: appSettings.language,
    dailyWork,
    dailyInspiration,
    hasDailyWorkContent,
    hasDailyInspirationContent,
    isDailyWorkOpen,
    isInspirationOpen,
    onChangeDailyWork: updateDailyWork,
    onChangeDailyInspiration: updateDailyInspiration,
    onToggleDailyWorkPanel: appUiActions.toggleDailyWorkPanel,
    onToggleInspirationPanel: appUiActions.toggleInspirationPanel,
    onCloseDailyWorkPanel: appUiActions.closeDailyWorkPanel,
    onCloseInspirationPanel: appUiActions.closeInspirationPanel,
  };
  const reviewViewProps = {
    allTasks,
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
