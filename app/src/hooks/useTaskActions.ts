import { useCallback, useMemo, type Dispatch, type SetStateAction } from 'react';
import type { AppBehaviorSettings } from '../../shared/appSettings';
import type { ArchivedObsidianTask } from '../../shared/obsidianTaskArchive';
import type { RetainedObsidianReview } from '../../shared/obsidianReviewRetention';
import { setAppSettings as persistAppSettings } from '../store/taskStore';
import type { Task, TaskCompletionReview, TaskSource } from '../types/task';
import type { TodayFocusState } from '../../shared/todayFocus';
import type { TaskListOrderByDate } from '../utils/taskOrdering';
import {
  getDeleteTaskReviewConfirmationMessage,
} from './taskMutations';
import { ARCHIVED_OBSIDIAN_TASKS_KEY, RETAINED_OBSIDIAN_REVIEWS_KEY } from './taskPersistence';
import { areAppBehaviorSettingsEqual } from './taskHookState';
import { createTaskAppStateActionHandlers } from './taskAppStateActions';
import { createTaskCompletionActionHandlers } from './taskCompletionActions';
import { createTaskTreeActionHandlers } from './taskTreeActions';
import type { DailyReviewSuggestionAdoption } from './taskTreeActions';
import { createTaskOrderingActionHandlers } from './taskOrderingActions';

export interface UseTaskActionsInput {
  allTasks: Task[];
  appSettings: AppBehaviorSettings;
  currentDate: string;
  selectedDate: string;
  setAllTasks: Dispatch<SetStateAction<Task[]>>;
  setArchivedObsidianTasks: Dispatch<SetStateAction<ArchivedObsidianTask[]>>;
  setAppSettings: Dispatch<SetStateAction<AppBehaviorSettings>>;
  setDailyInspirationNotes: Dispatch<SetStateAction<Record<string, string>>>;
  setDailyWorkNotes: Dispatch<SetStateAction<Record<string, string>>>;
  setRetainedObsidianReviews: Dispatch<SetStateAction<RetainedObsidianReview[]>>;
  setTaskListOrderByDate: Dispatch<SetStateAction<TaskListOrderByDate>>;
}

export interface TaskActions {
  updateAppSettings: (next: AppBehaviorSettings) => void;
  updateDailyWork: (value: string) => void;
  updateDailyInspiration: (value: string) => void;
  addTask: (text: string, priority?: Task['priority'], source?: TaskSource, taskDate?: string) => void;
  toggleTask: (id: string) => void;
  completeTaskWithReview: (id: string, review: Omit<TaskCompletionReview, 'reviewedAt'>) => void;
  deleteTaskReview: (taskId: string, reviewId: string) => void;
  deleteTaskReviews: (records: Array<{ taskId: string; reviewId: string }>) => void;
  deleteTask: (id: string) => void;
  editTask: (id: string, text: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  addSubtask: (parentId: string, text: string) => void;
  toggleSubtask: (subtaskId: string) => void;
  deleteSubtask: (subtaskId: string) => void;
  toggleTaskCollapse: (taskId: string) => void;
  updateSubtaskReview: (subtaskId: string, review: Omit<TaskCompletionReview, 'reviewedAt' | 'id'>) => void;
  markSubtaskDoneWithoutReview: (subtaskId: string) => void;
  editTaskReview: (taskId: string, reviewId: string, updates: Partial<Pick<TaskCompletionReview, 'status' | 'percent' | 'summary' | 'unknowns' | 'nextStep'>>) => void;
  changePriority: (id: string, priority: Task['priority']) => void;
  setTodayFocus: (selectedTaskIds: string[]) => void;
  setTodayFocusState: (taskId: string, state: TodayFocusState, reason?: string) => void;
  adoptDailyReviewSuggestion: (adoption: DailyReviewSuggestionAdoption) => void;
  reorderSourceGroups: (date: string, activeSource: TaskSource, overSource: TaskSource) => void;
  reorderTasksWithinSource: (date: string, source: TaskSource, completed: boolean, activeId: string, overId: string) => void;
  clearCompleted: () => void;
}

export function useTaskActions({
  allTasks,
  appSettings,
  currentDate,
  selectedDate,
  setAllTasks,
  setArchivedObsidianTasks,
  setAppSettings,
  setDailyInspirationNotes,
  setDailyWorkNotes,
  setRetainedObsidianReviews,
  setTaskListOrderByDate,
}: UseTaskActionsInput): TaskActions {
  const persistRetainedReviews = useCallback(
    (value: RetainedObsidianReview[]) => window.electronAPI?.setStore(RETAINED_OBSIDIAN_REVIEWS_KEY, value),
    [],
  );
  const persistArchivedObsidianTasks = useCallback(
    (value: ArchivedObsidianTask[]) => window.electronAPI?.setStore(ARCHIVED_OBSIDIAN_TASKS_KEY, value),
    [],
  );
  const { updateAppSettings, updateDailyWork, updateDailyInspiration } = useMemo(
    () => createTaskAppStateActionHandlers({
      appSettings,
      selectedDate,
      areSettingsEqual: areAppBehaviorSettingsEqual,
      setAppSettings,
      persistAppSettings,
      setDailyWork: setDailyWorkNotes,
      setDailyInspiration: setDailyInspirationNotes,
    }),
    [appSettings, selectedDate, setAppSettings, setDailyInspirationNotes, setDailyWorkNotes],
  );
  const confirmDeleteReview = useCallback(
    () => window.confirm(getDeleteTaskReviewConfirmationMessage()),
    [],
  );
  const {
    completeTaskWithReview,
    deleteTaskReview,
    deleteTaskReviews,
    updateSubtaskReview,
    markSubtaskDoneWithoutReview,
    editTaskReview,
  } = useMemo(
    () => createTaskCompletionActionHandlers({
      appSettings,
      currentDate,
      setAllTasks,
      setRetainedReviews: setRetainedObsidianReviews,
      persistRetainedReviews,
      confirmDeleteReview,
      createId: () => crypto.randomUUID(),
      getTimestamp: () => new Date().toISOString(),
    }),
    [appSettings, confirmDeleteReview, currentDate, persistRetainedReviews, setAllTasks, setRetainedObsidianReviews],
  );
  const {
    addTask,
    toggleTask,
    deleteTask: deleteTaskFromTree,
    editTask,
    updateTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    toggleTaskCollapse,
    changePriority,
    setTodayFocus,
    setTodayFocusState,
    adoptDailyReviewSuggestion,
    clearCompleted,
  } = useMemo(
    () => createTaskTreeActionHandlers({
      currentDate,
      selectedDate,
      setAllTasks,
      setArchivedObsidianTasks,
      persistArchivedObsidianTasks,
      createId: () => crypto.randomUUID(),
      getTimestamp: () => new Date().toISOString(),
    }),
    [currentDate, persistArchivedObsidianTasks, selectedDate, setAllTasks, setArchivedObsidianTasks],
  );
  const { deleteTask, reorderSourceGroups, reorderTasksWithinSource } = useMemo(
    () => createTaskOrderingActionHandlers({
      allTasks,
      currentDate,
      deleteTaskFromTree,
      setTaskListOrderByDate,
    }),
    [allTasks, currentDate, deleteTaskFromTree, setTaskListOrderByDate],
  );

  return {
    updateAppSettings, updateDailyWork, updateDailyInspiration, addTask, toggleTask, completeTaskWithReview,
    deleteTaskReview, deleteTaskReviews, deleteTask, editTask, updateTask, addSubtask, toggleSubtask, deleteSubtask, toggleTaskCollapse,
    updateSubtaskReview, markSubtaskDoneWithoutReview, editTaskReview, changePriority, reorderSourceGroups,
    setTodayFocus, setTodayFocusState, adoptDailyReviewSuggestion, reorderTasksWithinSource, clearCompleted,
  };
}
