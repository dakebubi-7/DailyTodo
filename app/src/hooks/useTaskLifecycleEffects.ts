import { Dispatch, SetStateAction, useEffect } from 'react';
import { AppBehaviorSettings } from '../../shared/appSettings';
import { ArchivedObsidianTask } from '../../shared/obsidianTaskArchive';
import { RetainedObsidianReview } from '../../shared/obsidianReviewRetention';
import { TabType, Task } from '../types/task';
import { TaskListOrderByDate } from '../utils/taskOrdering';
import {
  persistTaskUiState,
} from './taskPersistence';
import {
  ObsidianSyncStatus,
} from './taskObsidianSync';
import { useTaskBusinessDateEffects } from './useTaskBusinessDateEffects';
import { useTaskInitializationEffects } from './useTaskInitializationEffects';
import { useTaskObsidianSyncEffects } from './useTaskObsidianSyncEffects';
import { useTaskTreePersistenceEffects } from './useTaskTreePersistenceEffects';

type TaskStateSetter<T> = Dispatch<SetStateAction<T>>;

interface UseTaskLifecycleEffectsParams {
  activeTab: TabType;
  allTasks: Task[];
  archivedObsidianTasks: ArchivedObsidianTask[];
  appSettings: AppBehaviorSettings;
  currentDate: string;
  dailyInspirationNotes: Record<string, string>;
  dailyWorkNotes: Record<string, string>;
  isLoaded: boolean;
  obsidianPath: string;
  retainedObsidianReviews: RetainedObsidianReview[];
  selectedDate: string;
  taskListOrderByDate: TaskListOrderByDate;
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

export function useTaskLifecycleEffects({
  activeTab,
  allTasks,
  archivedObsidianTasks,
  appSettings,
  currentDate,
  dailyInspirationNotes,
  dailyWorkNotes,
  isLoaded,
  obsidianPath,
  retainedObsidianReviews,
  selectedDate,
  taskListOrderByDate,
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
}: UseTaskLifecycleEffectsParams) {
  const { primeTaskTreePersistence } = useTaskTreePersistenceEffects({
    allTasks,
    appSettings,
    isLoaded,
    setAllTasks,
  });
  const { obsidianSyncTasks, syncCurrentDailyNote } = useTaskObsidianSyncEffects({
    allTasks,
    archivedObsidianTasks,
    dailyInspirationNotes,
    dailyWorkNotes,
    isLoaded,
    obsidianPath,
    retainedObsidianReviews,
    selectedDate,
    setSyncStatus,
  });

  useTaskInitializationEffects({
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
  });

  useTaskBusinessDateEffects({
    appSettings,
    isLoaded,
    setAllTasks,
    setCurrentDate,
    setSelectedDate,
  });

  useEffect(() => {
    if (!isLoaded) return;

    persistTaskUiState({
      dailyWorkNotes,
      dailyInspirationNotes,
      selectedDate,
      currentDate,
      activeTab,
      taskListOrderByDate,
    });
  }, [activeTab, currentDate, dailyInspirationNotes, dailyWorkNotes, isLoaded, selectedDate, taskListOrderByDate]);

  return { obsidianSyncTasks, syncCurrentDailyNote };
}
