import { Dispatch, SetStateAction, useEffect } from 'react';
import { AppBehaviorSettings } from '../../shared/appSettings';
import { ArchivedObsidianTask } from '../../shared/obsidianTaskArchive';
import { RetainedObsidianReview } from '../../shared/obsidianReviewRetention';
import { TabType, Task } from '../types/task';
import { TaskListOrderByDate } from '../utils/taskOrdering';
import {
  TASK_CARRYOVER_LEDGER_KEY,
  loadInitialTaskState,
  primeTaskUiStatePersistence,
} from './taskPersistence';
import { ObsidianSyncStatus } from './taskObsidianSync';
import { getInitialObsidianSyncStatus } from './taskHookState';

type TaskStateSetter<T> = Dispatch<SetStateAction<T>>;

interface UseTaskInitializationEffectsParams {
  primeTaskTreePersistence: (tasks: Task[]) => void;
  setActiveTab: TaskStateSetter<TabType>;
  setAllTasks: TaskStateSetter<Task[]>;
  setArchivedObsidianTasks: TaskStateSetter<ArchivedObsidianTask[]>;
  setAppSettings: TaskStateSetter<AppBehaviorSettings>;
  setCurrentDate: TaskStateSetter<string>;
  setDailyInspirationNotes: TaskStateSetter<Record<string, string>>;
  setDailyWorkNotes: TaskStateSetter<Record<string, string>>;
  setIsLoaded: TaskStateSetter<boolean>;
  setObsidianPath: TaskStateSetter<string>;
  setRetainedObsidianReviews: TaskStateSetter<RetainedObsidianReview[]>;
  setSelectedDate: TaskStateSetter<string>;
  setSyncStatus: TaskStateSetter<ObsidianSyncStatus>;
  setTaskListOrderByDate: TaskStateSetter<TaskListOrderByDate>;
}

export function useTaskInitializationEffects({
  primeTaskTreePersistence,
  setActiveTab,
  setAllTasks,
  setArchivedObsidianTasks,
  setAppSettings,
  setCurrentDate,
  setDailyInspirationNotes,
  setDailyWorkNotes,
  setIsLoaded,
  setObsidianPath,
  setRetainedObsidianReviews,
  setSelectedDate,
  setSyncStatus,
  setTaskListOrderByDate,
}: UseTaskInitializationEffectsParams) {
  useEffect(() => {
    const init = async () => {
      const initialState = await loadInitialTaskState();

      setAppSettings(initialState.settings);
      setAllTasks(initialState.tasks);
      setArchivedObsidianTasks(initialState.archivedObsidianTasks);
      setDailyWorkNotes(initialState.dailyWorkNotes);
      setDailyInspirationNotes(initialState.dailyInspirationNotes);
      setRetainedObsidianReviews(initialState.retainedObsidianReviews);
      setTaskListOrderByDate(initialState.taskListOrderByDate);
      setCurrentDate(initialState.today);
      setSelectedDate(initialState.selectedDate);
      if (initialState.activeTab) setActiveTab(initialState.activeTab);
      setObsidianPath(initialState.obsidianPath);
      setSyncStatus(getInitialObsidianSyncStatus(initialState.obsidianPath));
      if (initialState.shouldPersistCarryoverLedger) {
        window.electronAPI?.setStore(TASK_CARRYOVER_LEDGER_KEY, initialState.carryoverLedger);
      }
      if (!initialState.shouldPersistTasks) {
        primeTaskTreePersistence(initialState.tasks);
      }
      primeTaskUiStatePersistence({
        dailyWorkNotes: initialState.dailyWorkNotes,
        dailyInspirationNotes: initialState.dailyInspirationNotes,
        selectedDate: initialState.selectedDate,
        currentDate: initialState.today,
        activeTab: initialState.activeTab || 'today',
        taskListOrderByDate: initialState.taskListOrderByDate,
      });
      setIsLoaded(true);
    };

    void init();
  }, []);
}
