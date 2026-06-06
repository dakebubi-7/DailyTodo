import { useCallback, useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Task, TabType, TaskCompletionReview } from '../types/task';
import {
  chooseObsidianPath,
  getAppSettings,
  getObsidianPath,
  loadTasks,
  openDailyNote,
  saveTasks,
  setAppSettings as persistAppSettings,
  syncTasksToObsidian,
} from '../store/taskStore';
import {
  AppBehaviorSettings,
  createDefaultAppSettings,
} from '../../shared/appSettings';
import {
  getBusinessDateKey,
  getNextRolloverDelay,
  shiftDateKey,
  shouldCarryTaskForward,
} from '../../shared/taskRollover';
import {
  RetainedObsidianReview,
  getReviewIdentity,
  mergeRetainedReviewsForObsidian,
  retainDeletedReview,
} from '../../shared/obsidianReviewRetention';

const DAILY_WORK_KEY = 'dailyWorkNotes';
const DAILY_INSPIRATION_KEY = 'dailyInspirationNotes';
const SELECTED_DATE_KEY = 'selectedDate';
const ACTIVE_TAB_KEY = 'activeTab';
const LAST_ACTIVE_DAY_KEY = 'lastActiveDay';
const TASK_CARRYOVER_LEDGER_KEY = 'taskCarryoverLedger';
const RETAINED_OBSIDIAN_REVIEWS_KEY = 'retainedObsidianReviews';
const DEFAULT_APP_SETTINGS = createDefaultAppSettings();

function getTaskDate(task: Task, fallbackDate = getBusinessDateKey()) {
  return task.taskDate || task.createdAt?.slice(0, 10) || fallbackDate;
}

function buildCarryoverTask(task: Task, targetDate: string): Task {
  const sourceDate = getTaskDate(task);
  const suffix = `（继承自 ${sourceDate}）`;
  const baseText = task.text.includes(suffix) ? task.text : `${task.text}${suffix}`;

  return {
    id: uuidv4(),
    text: baseText,
    completed: false,
    priority: task.priority,
    createdAt: new Date().toISOString(),
    taskDate: targetDate,
    isToday: true,
    carriedFromDate: sourceDate,
    carriedFromTaskId: task.id,
  };
}

function carryForwardTasks(
  tasks: Task[],
  targetDate: string,
  ledger: Record<string, string[]>,
  settings: AppBehaviorSettings,
) {
  if (!settings.autoCarryForward) return { tasks, ledger };

  const sourceDate = shiftDateKey(targetDate, -1);
  const carriedIds = new Set(ledger[targetDate] || []);
  const inheritedTasks = tasks.filter((task) => (
    getTaskDate(task) === sourceDate &&
    shouldCarryTaskForward(task) &&
    !carriedIds.has(task.id) &&
    !tasks.some((candidate) => candidate.taskDate === targetDate && candidate.carriedFromTaskId === task.id)
  ));

  if (!inheritedTasks.length) {
    return { tasks, ledger };
  }

  return {
    tasks: [...inheritedTasks.map((task) => buildCarryoverTask(task, targetDate)), ...tasks],
    ledger: {
      ...ledger,
      [targetDate]: [...carriedIds, ...inheritedTasks.map((task) => task.id)],
    },
  };
}

function normalizeTask(task: Task, currentBusinessDate: string): Task {
  const completionReviews = task.completionReviews?.length
    ? task.completionReviews
    : task.completionReview
      ? [task.completionReview]
      : undefined;

  const taskDate = getTaskDate(task, currentBusinessDate);

  return {
    ...task,
    taskDate,
    isToday: taskDate === currentBusinessDate,
    completionReviews,
    completionReview: completionReviews?.[completionReviews.length - 1] || task.completionReview,
  };
}

export function deleteReviewFromTask(task: Task, reviewId: string): Task {
  const existingReviews = task.completionReviews || (task.completionReview ? [task.completionReview] : []);
  const reviews = existingReviews.filter((review) => getReviewIdentity(review) !== reviewId);
  const latestReview = reviews[reviews.length - 1];

  if (!latestReview) {
    return {
      ...task,
      completed: false,
      completedAt: undefined,
      completionReviews: undefined,
      completionReview: undefined,
    };
  }

  return {
    ...task,
    completionReviews: reviews,
    completionReview: latestReview,
  };
}

export function useTasks() {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [dailyWorkNotes, setDailyWorkNotes] = useState<Record<string, string>>({});
  const [dailyInspirationNotes, setDailyInspirationNotes] = useState<Record<string, string>>({});
  const [retainedObsidianReviews, setRetainedObsidianReviews] = useState<RetainedObsidianReview[]>([]);
  const [appSettings, setAppSettingsState] = useState<AppBehaviorSettings>(DEFAULT_APP_SETTINGS);
  const [currentDate, setCurrentDate] = useState(getBusinessDateKey(new Date(), DEFAULT_APP_SETTINGS.rolloverTime));
  const [selectedDate, setSelectedDate] = useState(getBusinessDateKey(new Date(), DEFAULT_APP_SETTINGS.rolloverTime));
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [isDark, setIsDark] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [obsidianPath, setObsidianPath] = useState('');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'synced' | 'needs-path' | 'error'>('idle');

  useEffect(() => {
    const init = async () => {
      const savedSettings = (await getAppSettings()) || createDefaultAppSettings();
      const today = getBusinessDateKey(new Date(), savedSettings.rolloverTime);
      const savedTasks = (await loadTasks()).map((task) => normalizeTask(task, today));
      const savedWorkNotes = (await window.electronAPI?.getStore(DAILY_WORK_KEY)) as Record<string, string> | undefined;
      const savedInspirationNotes = (await window.electronAPI?.getStore(DAILY_INSPIRATION_KEY)) as Record<string, string> | undefined;
      const savedSelectedDate = (await window.electronAPI?.getStore(SELECTED_DATE_KEY)) as string | undefined;
      const savedLastActiveDay = (await window.electronAPI?.getStore(LAST_ACTIVE_DAY_KEY)) as string | undefined;
      const savedActiveTab = (await window.electronAPI?.getStore(ACTIVE_TAB_KEY)) as TabType | undefined;
      const savedCarryoverLedger = (await window.electronAPI?.getStore(TASK_CARRYOVER_LEDGER_KEY)) as Record<string, string[]> | undefined;
      const savedRetainedReviews = (await window.electronAPI?.getStore(RETAINED_OBSIDIAN_REVIEWS_KEY)) as RetainedObsidianReview[] | undefined;
      const savedObsidianPath = await getObsidianPath();
      const shouldStartToday = !savedSelectedDate || savedLastActiveDay !== today;
      const carryoverResult = carryForwardTasks(savedTasks, today, savedCarryoverLedger || {}, savedSettings);

      setAppSettingsState(savedSettings);
      setAllTasks(carryoverResult.tasks.map((task) => normalizeTask(task, today)));
      setDailyWorkNotes(savedWorkNotes || {});
      setDailyInspirationNotes(savedInspirationNotes || {});
      setRetainedObsidianReviews(Array.isArray(savedRetainedReviews) ? savedRetainedReviews : []);
      setCurrentDate(today);
      setSelectedDate(shouldStartToday ? today : savedSelectedDate || today);
      if (savedActiveTab) setActiveTab(savedActiveTab);
      setObsidianPath(savedObsidianPath);
      setSyncStatus(savedObsidianPath ? 'idle' : 'needs-path');
      window.electronAPI?.setStore(TASK_CARRYOVER_LEDGER_KEY, carryoverResult.ledger);
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

        setSelectedDate((previousSelectedDate) => (
          previousSelectedDate === previousToday ? today : previousSelectedDate
        ));

        window.electronAPI?.getStore(TASK_CARRYOVER_LEDGER_KEY).then((value) => {
          setAllTasks((previousTasks) => {
            const carryoverResult = carryForwardTasks(
              previousTasks.map((task) => normalizeTask(task, today)),
              today,
              (value as Record<string, string[]> | undefined) || {},
              appSettings,
            );
            window.electronAPI?.setStore(TASK_CARRYOVER_LEDGER_KEY, carryoverResult.ledger);
            return carryoverResult.tasks.map((task) => normalizeTask(task, today));
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

    saveTasks(allTasks);
    window.electronAPI?.setStore(DAILY_WORK_KEY, dailyWorkNotes);
    window.electronAPI?.setStore(DAILY_INSPIRATION_KEY, dailyInspirationNotes);
    window.electronAPI?.setStore(SELECTED_DATE_KEY, selectedDate);
    window.electronAPI?.setStore(LAST_ACTIVE_DAY_KEY, currentDate);
    window.electronAPI?.setStore(ACTIVE_TAB_KEY, activeTab);

    if (!obsidianPath) {
      setSyncStatus('needs-path');
      return;
    }

    const tasksForSync = appSettings.syncDeletedReviewsToObsidian
      ? allTasks
      : mergeRetainedReviewsForObsidian(allTasks, retainedObsidianReviews);

    const timer = window.setTimeout(() => {
      syncTasksToObsidian(tasksForSync, selectedDate, dailyWorkNotes[selectedDate] || '', dailyInspirationNotes[selectedDate] || '')
        ?.then((result) => setSyncStatus(result?.ok ? 'synced' : 'error'))
        .catch(() => setSyncStatus('error'));
    }, 250);

    return () => window.clearTimeout(timer);
  }, [activeTab, allTasks, appSettings.syncDeletedReviewsToObsidian, currentDate, dailyInspirationNotes, dailyWorkNotes, isLoaded, obsidianPath, retainedObsidianReviews, selectedDate]);

  const updateAppSettings = useCallback((next: AppBehaviorSettings) => {
    if (next.syncDeletedReviewsToObsidian) {
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

  const addTask = useCallback((text: string, priority: Task['priority'] = 'medium') => {
    const newTask: Task = {
      id: uuidv4(),
      text,
      completed: false,
      priority,
      createdAt: new Date().toISOString(),
      taskDate: selectedDate,
      isToday: selectedDate === currentDate,
    };
    setAllTasks((prev) => [newTask, ...prev]);
  }, [currentDate, selectedDate]);

  const toggleTask = useCallback((id: string) => {
    setAllTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              completed: !task.completed,
              completedAt: !task.completed ? new Date().toISOString() : undefined,
            }
          : task
      )
    );
  }, []);

  const completeTaskWithReview = useCallback((id: string, review: Omit<TaskCompletionReview, 'reviewedAt'>) => {
    const reviewedAt = new Date().toISOString();
    setAllTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? (() => {
              const nextReview: TaskCompletionReview = {
                ...review,
                id: uuidv4(),
                reviewedAt,
              };
              const completionReviews = [...(task.completionReviews || (task.completionReview ? [task.completionReview] : [])), nextReview];

              return {
                ...task,
                completed: true,
                completedAt: task.completedAt || reviewedAt,
                completionReview: nextReview,
                completionReviews,
              };
            })()
          : task
      )
    );
  }, []);

  const deleteTaskReview = useCallback((taskId: string, reviewId: string) => {
    if (
      appSettings.confirmBeforeDeletingReview &&
      !window.confirm(
        appSettings.syncDeletedReviewsToObsidian
          ? '将删除本地完成记录。因为已开启删除同步，下一次 Obsidian 同步会从 DailyTodo 管理区块中移除这条记录。继续吗？'
          : '将删除本地完成记录。继续吗？',
      )
    ) {
      return;
    }

    setAllTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;

        const existingReviews = task.completionReviews || (task.completionReview ? [task.completionReview] : []);
        const deletedReview = existingReviews.find((review) => getReviewIdentity(review) === reviewId);
        if (deletedReview && !appSettings.syncDeletedReviewsToObsidian) {
          setRetainedObsidianReviews((previous) => {
            const next = retainDeletedReview(previous, task, deletedReview);
            if (next === previous) return previous;
            window.electronAPI?.setStore(RETAINED_OBSIDIAN_REVIEWS_KEY, next);
            return next;
          });
        }

        return deleteReviewFromTask(task, reviewId);
      })
    );
  }, [appSettings.confirmBeforeDeletingReview, appSettings.syncDeletedReviewsToObsidian]);

  const deleteTask = useCallback((id: string) => {
    setAllTasks((prev) => prev.filter((task) => task.id !== id));
  }, []);

  const editTask = useCallback((id: string, text: string) => {
    setAllTasks((prev) => prev.map((task) => (task.id === id ? { ...task, text } : task)));
  }, []);

  const editTaskReview = useCallback((taskId: string, reviewId: string, updates: Partial<Pick<TaskCompletionReview, 'status' | 'percent' | 'summary' | 'unknowns' | 'nextStep'>>) => {
    setAllTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        const reviews = [...(task.completionReviews?.length
          ? task.completionReviews
          : task.completionReview ? [task.completionReview] : [])];
        const idx = reviews.findIndex((r) => getReviewIdentity(r) === reviewId);
        if (idx === -1) return task;
        reviews[idx] = { ...reviews[idx], ...updates };
        return {
          ...task,
          completionReviews: reviews,
          completionReview: reviews[reviews.length - 1],
        };
      }),
    );
  }, []);

  const changePriority = useCallback((id: string, priority: Task['priority']) => {
    setAllTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, priority } : task))
    );
  }, []);

  const clearCompleted = useCallback(() => {
    // 只标记为 cleared(隐藏),不从数据中删除:Obsidian 同步用的是包含全部任务的 allTasks,
    // 所以已完成记录仍会保留在 Obsidian。
    setAllTasks((prev) =>
      prev.map((task) =>
        getTaskDate(task, currentDate) === selectedDate && task.completed && !task.cleared
          ? { ...task, cleared: true }
          : task
      )
    );
  }, [currentDate, selectedDate]);

  const filteredTasks = useMemo(() => {
    return allTasks.filter((task) => {
      if (task.cleared) return false; // 已清理的任务不在应用内显示
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;

      const taskDate = getTaskDate(task, currentDate);
      switch (activeTab) {
        case 'today':
          return taskDate === selectedDate;
        case 'completed':
          return taskDate === selectedDate && task.completed;
        case 'all':
        default:
          return true;
      }
    });
  }, [activeTab, allTasks, currentDate, priorityFilter, selectedDate]);

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const selectedDateTasks = allTasks.filter((task) => getTaskDate(task, currentDate) === selectedDate && !task.cleared);
  const selectedDateTaskCommands = [...selectedDateTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
  const completedCount = selectedDateTasks.filter((task) => task.completed).length;
  const totalCount = selectedDateTasks.length;
  const todayCount = allTasks.filter((task) => getTaskDate(task, currentDate) === currentDate && !task.cleared).length;
  const allDates = Array.from(
    new Set([...allTasks.map((task) => getTaskDate(task, currentDate)), currentDate])
  ).sort((a, b) => b.localeCompare(a));
  const obsidianSyncTasks = appSettings.syncDeletedReviewsToObsidian
    ? allTasks
    : mergeRetainedReviewsForObsidian(allTasks, retainedObsidianReviews);

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
      const result = await syncTasksToObsidian(obsidianSyncTasks, selectedDate, dailyWorkNotes[selectedDate] || '', dailyInspirationNotes[selectedDate] || '');
      setSyncStatus(result?.ok ? 'synced' : 'error');
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
