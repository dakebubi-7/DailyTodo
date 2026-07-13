import { useCallback, useMemo, useState } from 'react';
import { AppBehaviorSettings, createDefaultAppSettings } from '../../shared/appSettings';
import { RetainedObsidianReview } from '../../shared/obsidianReviewRetention';
import { getBusinessDateKey } from '../../shared/taskRollover';
import { chooseObsidianPath, openDailyNote } from '../store/taskStore';
import { TabType, type Task } from '../types/task';
import { TaskListOrderByDate } from '../utils/taskOrdering';
import { PriorityFilter, selectTaskViewState } from './taskSelectors';
import { ObsidianSyncStatus } from './taskObsidianSync';
import { useTaskActions } from './useTaskActions';
import { useTaskLifecycleEffects } from './useTaskLifecycleEffects';

const DEFAULT_APP_SETTINGS = createDefaultAppSettings();

export function useTasks() {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [dailyWorkNotes, setDailyWorkNotes] = useState<Record<string, string>>({});
  const [dailyInspirationNotes, setDailyInspirationNotes] = useState<Record<string, string>>({});
  const [retainedObsidianReviews, setRetainedObsidianReviews] = useState<RetainedObsidianReview[]>([]);
  const [appSettings, setAppSettingsState] = useState<AppBehaviorSettings>(DEFAULT_APP_SETTINGS);
  const [currentDate, setCurrentDate] = useState(getBusinessDateKey(new Date(), DEFAULT_APP_SETTINGS.rolloverTime));
  const [selectedDate, setSelectedDate] = useState(getBusinessDateKey(new Date(), DEFAULT_APP_SETTINGS.rolloverTime));
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [isDark, setIsDark] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [obsidianPath, setObsidianPath] = useState('');
  const [syncStatus, setSyncStatus] = useState<ObsidianSyncStatus>('idle');
  const [taskListOrderByDate, setTaskListOrderByDate] = useState<TaskListOrderByDate>({});
  const { obsidianSyncTasks, syncCurrentDailyNote } = useTaskLifecycleEffects({
    activeTab,
    allTasks,
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
    setAppSettings: setAppSettingsState,
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

  const taskActions = useTaskActions({
    allTasks,
    appSettings,
    currentDate,
    selectedDate,
    setAllTasks,
    setAppSettings: setAppSettingsState,
    setDailyInspirationNotes,
    setDailyWorkNotes,
    setRetainedObsidianReviews,
    setTaskListOrderByDate,
  });

  const { sortedTasks, selectedDateTaskCommands, completedCount, totalCount, todayCount, allDates, sourceOrderForSelectedDate } = useMemo(() => selectTaskViewState({
    allTasks, activeTab, priorityFilter, currentDate, selectedDate, taskListOrderByDate,
  }), [activeTab, allTasks, currentDate, priorityFilter, selectedDate, taskListOrderByDate]);
  const toggleDarkMode = useCallback(() => setIsDark((previous) => !previous), []);
  const setDarkMode = useCallback((value: boolean) => setIsDark(value), []);
  const chooseObsidianFolder = useCallback(async () => {
    const selectedPath = await chooseObsidianPath();
    setObsidianPath(selectedPath);
    if (!selectedPath) {
      setSyncStatus('needs-path');
      return selectedPath;
    }
    try { await syncCurrentDailyNote(); } catch { setSyncStatus('error'); }
    return selectedPath;
  }, [syncCurrentDailyNote]);
  const openSelectedDailyNote = useCallback(async () => {
    if (!obsidianPath) {
      await chooseObsidianFolder();
      return;
    }
    try { await openDailyNote(selectedDate); } catch { setSyncStatus('error'); }
  }, [chooseObsidianFolder, obsidianPath, selectedDate]);

  return {
    tasks: sortedTasks, allTasks, taskListOrderByDate, sourceOrderForSelectedDate, ...taskActions,
    selectedDateTaskCommands, obsidianSyncTasks, activeTab, setActiveTab, priorityFilter, setPriorityFilter, selectedDate,
    setSelectedDate, allDates, dailyWork: dailyWorkNotes[selectedDate] || '', dailyInspiration: dailyInspirationNotes[selectedDate] || '',
    isDark, toggleDarkMode, setDarkMode, obsidianPath, syncStatus, chooseObsidianFolder,
    openSelectedDailyNote, completedCount, totalCount, todayCount, isLoaded, appSettings,
  };
}
