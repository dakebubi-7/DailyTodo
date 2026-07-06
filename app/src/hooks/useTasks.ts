import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Task, TabType, TaskCompletionReview, TaskSource } from '../types/task';
import { TaskListOrderByDate } from '../utils/taskOrdering';
import {
  chooseObsidianPath,
  openDailyNote,
  saveTasks,
  setAppSettings as persistAppSettings,
} from '../store/taskStore';
import {
  AppBehaviorSettings,
  createDefaultAppSettings,
} from '../../shared/appSettings';
import {
  getBusinessDateKey,
  getNextRolloverDelay,
} from '../../shared/taskRollover';
import {
  RetainedObsidianReview,
} from '../../shared/obsidianReviewRetention';
import {
  mapTaskTree,
  removeTaskFromTree,
} from './taskTransforms';
import {
  addSubtaskToTask,
  appendCompletionReviewToTask,
  changeTaskPriority,
  clearCompletedTasks,
  createTask,
  deleteReviewFromTask,
  editTaskText,
  getDeleteTaskReviewConfirmationMessage,
  markTaskDoneWithoutReview,
  retainDeletedTaskReviewForObsidian,
  toggleTaskCompletion,
  toggleTaskCollapseState,
  updateTaskFields,
  updateTaskReview,
} from './taskMutations';
import { PriorityFilter, selectTaskViewState } from './taskSelectors';
import { TaskCarryoverLedger, applyBusinessDateCarryover } from './taskCarryover';
import {
  RETAINED_OBSIDIAN_REVIEWS_KEY,
  TASK_CARRYOVER_LEDGER_KEY,
  loadInitialTaskState,
  persistTaskUiState,
} from './taskPersistence';
import {
  ObsidianSyncStatus,
  buildObsidianSyncTasks,
  buildSelectedDailyNoteSyncInput,
  syncSelectedDailyNote,
} from './taskObsidianSync';
import {
  getInitialObsidianSyncStatus,
  getSelectedDateAfterBusinessDateChange,
  normalizeIncomingTasks,
  shouldClearRetainedReviewsOnSettingsUpdate,
} from './taskHookState';
import {
  removeTaskFromTaskOrderState,
  reorderSourceGroupsForDate,
  reorderTasksWithinSourceForDate,
} from './taskOrderingState';

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
  // 收到其它窗口广播的任务变更后，跳过下一次保存副作用，避免主窗口 ↔ 桌面组件来回写形成回声循环。
  const skipNextTaskPersistRef = useRef(false);

  useEffect(() => {
    const init = async () => {
      const initialState = await loadInitialTaskState();

      setAppSettingsState(initialState.settings);
      setAllTasks(initialState.tasks);
      setDailyWorkNotes(initialState.dailyWorkNotes);
      setDailyInspirationNotes(initialState.dailyInspirationNotes);
      setRetainedObsidianReviews(initialState.retainedObsidianReviews);
      setTaskListOrderByDate(initialState.taskListOrderByDate);
      setCurrentDate(initialState.today);
      setSelectedDate(initialState.selectedDate);
      if (initialState.activeTab) setActiveTab(initialState.activeTab);
      setObsidianPath(initialState.obsidianPath);
      setSyncStatus(getInitialObsidianSyncStatus(initialState.obsidianPath));
      window.electronAPI?.setStore(TASK_CARRYOVER_LEDGER_KEY, initialState.carryoverLedger);
      setIsLoaded(true);
    };

    init();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    const updateBusinessDate = async () => {
      const today = getBusinessDateKey(new Date(), appSettings.rolloverTime);
      setCurrentDate((previousToday) => {
        if (previousToday === today) return previousToday;

        setSelectedDate((previousSelectedDate) => getSelectedDateAfterBusinessDateChange(
          previousSelectedDate,
          previousToday,
          today,
        ));

        window.electronAPI?.getStore(TASK_CARRYOVER_LEDGER_KEY).then((value) => {
          setAllTasks((previousTasks) => {
            const carryoverResult = applyBusinessDateCarryover({
              tasks: previousTasks,
              targetDate: today,
              ledger: (value as TaskCarryoverLedger | undefined) || {},
              settings: appSettings,
            });
            window.electronAPI?.setStore(TASK_CARRYOVER_LEDGER_KEY, carryoverResult.ledger);
            return carryoverResult.tasks;
          });
        });

        return today;
      });
    };

    const interval = window.setInterval(updateBusinessDate, 60 * 1000);
    const rolloverTimer = window.setTimeout(updateBusinessDate, getNextRolloverDelay(new Date(), appSettings.rolloverTime));

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(rolloverTimer);
    };
  }, [appSettings, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;

    // 这次 allTasks 变化来自其它窗口的广播：内存已对齐，跳过写回 tasks（否则与发送方来回写）。
    // 注意只跳过 tasks 这一项——其它字段（每日工作/灵感/选中日期等）可能在同一批次里独立变化，必须照常保存。
    const skipTasksWrite = skipNextTaskPersistRef.current;
    if (skipTasksWrite) skipNextTaskPersistRef.current = false;

    if (!skipTasksWrite) saveTasks(allTasks);
    persistTaskUiState({
      dailyWorkNotes,
      dailyInspirationNotes,
      selectedDate,
      currentDate,
      activeTab,
      taskListOrderByDate,
    });

    if (!obsidianPath) {
      setSyncStatus('needs-path');
      return;
    }

    const tasksForSync = buildObsidianSyncTasks({
      allTasks,
      retainedObsidianReviews,
      syncDeletedReviewsToObsidian: appSettings.syncDeletedReviewsToObsidian,
    });

    const timer = window.setTimeout(() => {
      syncSelectedDailyNote(buildSelectedDailyNoteSyncInput({
        tasks: tasksForSync,
        selectedDate,
        dailyWorkNotes,
        dailyInspirationNotes,
      })).then(setSyncStatus);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [activeTab, allTasks, appSettings.syncDeletedReviewsToObsidian, currentDate, dailyInspirationNotes, dailyWorkNotes, isLoaded, obsidianPath, retainedObsidianReviews, selectedDate, taskListOrderByDate]);

  // 订阅其它窗口的任务变更广播，实现主窗口 ↔ 桌面组件双向实时同步。
  useEffect(() => {
    if (!isLoaded) return;
    const unsubscribe = window.electronAPI?.onTasksChanged((incoming) => {
      const today = getBusinessDateKey(new Date(), appSettings.rolloverTime);
      const nextTasks = normalizeIncomingTasks(incoming, today);
      setAllTasks((prev) => {
        // 内容相同则忽略，避免无谓重渲染并切断回声循环。
        if (JSON.stringify(prev) === JSON.stringify(nextTasks)) return prev;
        // 这次更新来自广播：标记跳过下一次保存，防止把同样内容又写回 store。
        skipNextTaskPersistRef.current = true;
        return nextTasks;
      });
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [appSettings.rolloverTime, isLoaded]);

  const updateAppSettings = useCallback((next: AppBehaviorSettings) => {
    if (shouldClearRetainedReviewsOnSettingsUpdate(next)) {
      setRetainedObsidianReviews([]);
      window.electronAPI?.setStore(RETAINED_OBSIDIAN_REVIEWS_KEY, []);
    }
    setAppSettingsState(next);
    persistAppSettings(next);
  }, []);

  const updateDailyWork = useCallback((value: string) => {
    setDailyWorkNotes((prev) => ({
      ...prev,
      [selectedDate]: value,
    }));
  }, [selectedDate]);

  const updateDailyInspiration = useCallback((value: string) => {
    setDailyInspirationNotes((prev) => ({
      ...prev,
      [selectedDate]: value,
    }));
  }, [selectedDate]);

  const addTask = useCallback((text: string, priority: Task['priority'] = 'medium', source: TaskSource = 'personal', taskDate = selectedDate) => {
    const newTask = createTask({
      id: uuidv4(),
      text,
      priority,
      source,
      createdAt: new Date().toISOString(),
      taskDate,
      currentDate,
    });
    setAllTasks((prev) => [newTask, ...prev]);
  }, [currentDate, selectedDate]);

  const toggleTask = useCallback((id: string) => {
    setAllTasks((prev) => mapTaskTree(prev, id, (task) => toggleTaskCompletion(task, new Date().toISOString())));
  }, []);

  const completeTaskWithReview = useCallback((id: string, review: Omit<TaskCompletionReview, 'reviewedAt'>) => {
    const reviewedAt = new Date().toISOString();
    setAllTasks((prev) => mapTaskTree(prev, id, (task) => appendCompletionReviewToTask(task, {
      review,
      id: uuidv4(),
      reviewedAt,
    })));
  }, []);

  const deleteTaskReview = useCallback((taskId: string, reviewId: string) => {
    if (
      appSettings.confirmBeforeDeletingReview &&
      !window.confirm(getDeleteTaskReviewConfirmationMessage(appSettings.syncDeletedReviewsToObsidian))
    ) {
      return;
    }

    setAllTasks((prev) => mapTaskTree(prev, taskId, (task) => {
      if (!appSettings.syncDeletedReviewsToObsidian) {
        setRetainedObsidianReviews((previous) => {
          const next = retainDeletedTaskReviewForObsidian(previous, task, reviewId, appSettings.syncDeletedReviewsToObsidian);
          if (next === previous) return previous;
          window.electronAPI?.setStore(RETAINED_OBSIDIAN_REVIEWS_KEY, next);
          return next;
        });
      }

      return deleteReviewFromTask(task, reviewId);
    }));
  }, [appSettings.confirmBeforeDeletingReview, appSettings.syncDeletedReviewsToObsidian]);

  const deleteTask = useCallback((id: string) => {
    setAllTasks((prev) => removeTaskFromTree(prev, id));
    setTaskListOrderByDate((prev) => removeTaskFromTaskOrderState(prev, id));
  }, []);

  const editTask = useCallback((id: string, text: string) => {
    setAllTasks((prev) => mapTaskTree(prev, id, (task) => editTaskText(task, text)));
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setAllTasks((prev) => mapTaskTree(prev, id, (task) => updateTaskFields(task, updates)));
  }, []);

  const addSubtask = useCallback((parentId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setAllTasks((prev) => mapTaskTree(prev, parentId, (task) => addSubtaskToTask(task, {
      id: uuidv4(),
      text: trimmed,
      createdAt: new Date().toISOString(),
    })));
  }, []);

  const toggleSubtask = useCallback((subtaskId: string) => {
    setAllTasks((prev) => mapTaskTree(prev, subtaskId, (task) => toggleTaskCompletion(task, new Date().toISOString())));
  }, []);

  const deleteSubtask = useCallback((subtaskId: string) => {
    setAllTasks((prev) => removeTaskFromTree(prev, subtaskId));
  }, []);

  const toggleTaskCollapse = useCallback((taskId: string) => {
    setAllTasks((prev) => mapTaskTree(prev, taskId, toggleTaskCollapseState));
  }, []);

  const updateSubtaskReview = useCallback((subtaskId: string, review: Omit<TaskCompletionReview, 'reviewedAt' | 'id'>) => {
    const reviewedAt = new Date().toISOString();
    setAllTasks((prev) => mapTaskTree(prev, subtaskId, (task) => appendCompletionReviewToTask(task, {
      review,
      id: uuidv4(),
      reviewedAt,
    })));
  }, []);

  const markSubtaskDoneWithoutReview = useCallback((subtaskId: string) => {
    setAllTasks((prev) => mapTaskTree(prev, subtaskId, (task) => markTaskDoneWithoutReview(task, new Date().toISOString())));
  }, []);

  const editTaskReview = useCallback((taskId: string, reviewId: string, updates: Partial<Pick<TaskCompletionReview, 'status' | 'percent' | 'summary' | 'unknowns' | 'nextStep'>>) => {
    setAllTasks((prev) => mapTaskTree(prev, taskId, (task) => updateTaskReview(task, reviewId, updates)));
  }, []);

  const changePriority = useCallback((id: string, priority: Task['priority']) => {
    setAllTasks((prev) => changeTaskPriority(prev, id, priority));
  }, []);

  const reorderSourceGroups = useCallback((date: string, activeSource: TaskSource, overSource: TaskSource) => {
    setTaskListOrderByDate((prev) => reorderSourceGroupsForDate(prev, date, activeSource, overSource));
  }, []);

  const reorderTasksWithinSource = useCallback((date: string, source: TaskSource, completed: boolean, activeId: string, overId: string) => {
    setTaskListOrderByDate((prev) => reorderTasksWithinSourceForDate(prev, allTasks, {
      date,
      currentDate,
      source,
      completed,
      activeId,
      overId,
    }));
  }, [allTasks, currentDate]);

  const clearCompleted = useCallback(() => {
    // 只标记为 cleared(隐藏),不从数据中删除:Obsidian 同步用的是包含全部任务的 allTasks,
    // 所以已完成记录仍会保留在 Obsidian。
    setAllTasks((prev) => clearCompletedTasks(prev, selectedDate, currentDate));
  }, [currentDate, selectedDate]);

  const {
    sortedTasks,
    selectedDateTaskCommands,
    completedCount,
    totalCount,
    todayCount,
    allDates,
    sourceOrderForSelectedDate,
  } = useMemo(() => selectTaskViewState({
    allTasks,
    activeTab,
    priorityFilter,
    currentDate,
    selectedDate,
    taskListOrderByDate,
  }), [activeTab, allTasks, currentDate, priorityFilter, selectedDate, taskListOrderByDate]);
  const obsidianSyncTasks = buildObsidianSyncTasks({
    allTasks,
    retainedObsidianReviews,
    syncDeletedReviewsToObsidian: appSettings.syncDeletedReviewsToObsidian,
  });

  const toggleDarkMode = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  const setDarkMode = useCallback((value: boolean) => {
    setIsDark(value);
  }, []);

  const chooseObsidianFolder = useCallback(async () => {
    const selectedPath = await chooseObsidianPath();
    setObsidianPath(selectedPath);

    if (!selectedPath) {
      setSyncStatus('needs-path');
      return selectedPath;
    }

    try {
      setSyncStatus(await syncSelectedDailyNote(buildSelectedDailyNoteSyncInput({
        tasks: obsidianSyncTasks,
        selectedDate,
        dailyWorkNotes,
        dailyInspirationNotes,
      })));
    } catch {
      setSyncStatus('error');
    }

    return selectedPath;
  }, [dailyInspirationNotes, dailyWorkNotes, obsidianSyncTasks, selectedDate]);

  const openSelectedDailyNote = useCallback(async () => {
    if (!obsidianPath) {
      await chooseObsidianFolder();
      return;
    }

    try {
      await openDailyNote(selectedDate);
    } catch {
      setSyncStatus('error');
    }
  }, [chooseObsidianFolder, obsidianPath, selectedDate]);

  return {
    tasks: sortedTasks,
    allTasks,
    taskListOrderByDate,
    sourceOrderForSelectedDate,
    reorderSourceGroups,
    reorderTasksWithinSource,
    selectedDateTaskCommands,
    obsidianSyncTasks,
    activeTab,
    setActiveTab,
    priorityFilter,
    setPriorityFilter,
    selectedDate,
    setSelectedDate,
    allDates,
    dailyWork: dailyWorkNotes[selectedDate] || '',
    dailyInspiration: dailyInspirationNotes[selectedDate] || '',
    updateDailyWork,
    updateDailyInspiration,
    isDark,
    toggleDarkMode,
    setDarkMode,
    obsidianPath,
    syncStatus,
    chooseObsidianFolder,
    openSelectedDailyNote,
    addTask,
    toggleTask,
    completeTaskWithReview,
    deleteTaskReview,
    editTaskReview,
    deleteTask,
    editTask,
    updateTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    toggleTaskCollapse,
    updateSubtaskReview,
    markSubtaskDoneWithoutReview,
    changePriority,
    clearCompleted,
    completedCount,
    totalCount,
    todayCount,
    isLoaded,
    appSettings,
    updateAppSettings,
  };
}
