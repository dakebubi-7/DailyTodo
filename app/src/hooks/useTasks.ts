import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Task, TabType, TaskCompletionReview, TaskSource } from '../types/task';
import {
  TASK_LIST_ORDER_KEY,
  TaskListOrderByDate,
  buildTaskOrderAfterMove,
  getSourceOrderForDate,
  getTaskSource,
  moveSourceInOrder,
  removeTaskIdFromOrder,
  sortTasksForDisplay,
} from '../utils/taskOrdering';
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

function taskMatchesDate(task: Task, date: string, fallbackDate = getBusinessDateKey()) {
  const taskDate = getTaskDate(task, fallbackDate);
  return taskDate === date || Boolean(task.scheduledDates?.includes(date));
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
    source: task.source,
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

function mapTaskTree(tasks: Task[], targetId: string, updater: (task: Task) => Task): Task[] {
  return tasks.map((task) => {
    if (task.id === targetId) return updater(task);
    if (!task.subtasks?.length) return task;
    return {
      ...task,
      subtasks: mapTaskTree(task.subtasks, targetId, updater),
    };
  });
}

function removeTaskFromTree(tasks: Task[], targetId: string): Task[] {
  return tasks
    .filter((task) => task.id !== targetId)
    .map((task) => (
      task.subtasks?.length
        ? { ...task, subtasks: removeTaskFromTree(task.subtasks, targetId) }
        : task
    ));
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
  const [taskListOrderByDate, setTaskListOrderByDate] = useState<TaskListOrderByDate>({});
  // 收到其它窗口广播的任务变更后，跳过下一次保存副作用，避免主窗口 ↔ 桌面组件来回写形成回声循环。
  const skipNextTaskPersistRef = useRef(false);

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
      const savedTaskListOrder = (await window.electronAPI?.getStore(TASK_LIST_ORDER_KEY)) as TaskListOrderByDate | undefined;
      const savedObsidianPath = await getObsidianPath();
      const shouldStartToday = !savedSelectedDate || savedLastActiveDay !== today;
      const carryoverResult = carryForwardTasks(savedTasks, today, savedCarryoverLedger || {}, savedSettings);

      setAppSettingsState(savedSettings);
      setAllTasks(carryoverResult.tasks.map((task) => normalizeTask(task, today)));
      setDailyWorkNotes(savedWorkNotes || {});
      setDailyInspirationNotes(savedInspirationNotes || {});
      setRetainedObsidianReviews(Array.isArray(savedRetainedReviews) ? savedRetainedReviews : []);
      setTaskListOrderByDate(savedTaskListOrder && typeof savedTaskListOrder === 'object' ? savedTaskListOrder : {});
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

    // 这次 allTasks 变化来自其它窗口的广播：内存已对齐，跳过写回 tasks（否则与发送方来回写）。
    // 注意只跳过 tasks 这一项——其它字段（每日工作/灵感/选中日期等）可能在同一批次里独立变化，必须照常保存。
    const skipTasksWrite = skipNextTaskPersistRef.current;
    if (skipTasksWrite) skipNextTaskPersistRef.current = false;

    if (!skipTasksWrite) saveTasks(allTasks);
    window.electronAPI?.setStore(DAILY_WORK_KEY, dailyWorkNotes);
    window.electronAPI?.setStore(DAILY_INSPIRATION_KEY, dailyInspirationNotes);
    window.electronAPI?.setStore(SELECTED_DATE_KEY, selectedDate);
    window.electronAPI?.setStore(LAST_ACTIVE_DAY_KEY, currentDate);
    window.electronAPI?.setStore(ACTIVE_TAB_KEY, activeTab);
    window.electronAPI?.setStore(TASK_LIST_ORDER_KEY, taskListOrderByDate);

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
  }, [activeTab, allTasks, appSettings.syncDeletedReviewsToObsidian, currentDate, dailyInspirationNotes, dailyWorkNotes, isLoaded, obsidianPath, retainedObsidianReviews, selectedDate, taskListOrderByDate]);

  // 订阅其它窗口的任务变更广播，实现主窗口 ↔ 桌面组件双向实时同步。
  useEffect(() => {
    if (!isLoaded) return;
    const unsubscribe = window.electronAPI?.onTasksChanged((incoming) => {
      const nextTasks = Array.isArray(incoming) ? incoming : [];
      setAllTasks((prev) => {
        // 内容相同则忽略，避免无谓重渲染并切断回声循环。
        if (JSON.stringify(prev) === JSON.stringify(nextTasks)) return prev;
        // 这次更新来自广播：标记跳过下一次保存，防止把同样内容又写回 store。
        skipNextTaskPersistRef.current = true;
        const today = getBusinessDateKey(new Date(), appSettings.rolloverTime);
        return nextTasks.map((task) => normalizeTask(task, today));
      });
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [appSettings.rolloverTime, isLoaded]);

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

  const addTask = useCallback((text: string, priority: Task['priority'] = 'medium', source: TaskSource = 'personal', taskDate = selectedDate) => {
    const newTask: Task = {
      id: uuidv4(),
      text,
      completed: false,
      priority,
      source,
      createdAt: new Date().toISOString(),
      taskDate,
      isToday: taskDate === currentDate,
    };
    setAllTasks((prev) => [newTask, ...prev]);
  }, [currentDate, selectedDate]);

  const toggleTask = useCallback((id: string) => {
    setAllTasks((prev) => mapTaskTree(prev, id, (task) => ({
      ...task,
      completed: !task.completed,
      completedAt: !task.completed ? new Date().toISOString() : undefined,
    })));
  }, []);

  const completeTaskWithReview = useCallback((id: string, review: Omit<TaskCompletionReview, 'reviewedAt'>) => {
    const reviewedAt = new Date().toISOString();
    setAllTasks((prev) => mapTaskTree(prev, id, (task) => {
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
    }));
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

    setAllTasks((prev) => mapTaskTree(prev, taskId, (task) => {
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
    }));
  }, [appSettings.confirmBeforeDeletingReview, appSettings.syncDeletedReviewsToObsidian]);

  const deleteTask = useCallback((id: string) => {
    setAllTasks((prev) => removeTaskFromTree(prev, id));
    setTaskListOrderByDate((prev) => removeTaskIdFromOrder(prev, id));
  }, []);

  const editTask = useCallback((id: string, text: string) => {
    setAllTasks((prev) => mapTaskTree(prev, id, (task) => ({ ...task, text })));
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setAllTasks((prev) => mapTaskTree(prev, id, (task) => ({ ...task, ...updates })));
  }, []);

  const addSubtask = useCallback((parentId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setAllTasks((prev) => mapTaskTree(prev, parentId, (task) => {
      const subtask: Task = {
        id: uuidv4(),
        text: trimmed,
        completed: false,
        priority: task.priority,
        source: task.source,
        createdAt: new Date().toISOString(),
        taskDate: task.taskDate,
        isToday: task.isToday,
        parentTaskId: task.id,
      };
      return {
        ...task,
        collapsed: false,
        subtasks: [...(task.subtasks || []), subtask],
      };
    }));
  }, []);

  const toggleSubtask = useCallback((subtaskId: string) => {
    setAllTasks((prev) => mapTaskTree(prev, subtaskId, (task) => ({
      ...task,
      completed: !task.completed,
      completedAt: !task.completed ? new Date().toISOString() : undefined,
    })));
  }, []);

  const deleteSubtask = useCallback((subtaskId: string) => {
    setAllTasks((prev) => removeTaskFromTree(prev, subtaskId));
  }, []);

  const toggleTaskCollapse = useCallback((taskId: string) => {
    setAllTasks((prev) => mapTaskTree(prev, taskId, (task) => ({ ...task, collapsed: !task.collapsed })));
  }, []);

  const updateSubtaskReview = useCallback((subtaskId: string, review: Omit<TaskCompletionReview, 'reviewedAt' | 'id'>) => {
    const reviewedAt = new Date().toISOString();
    setAllTasks((prev) => mapTaskTree(prev, subtaskId, (task) => {
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
    }));
  }, []);

  const markSubtaskDoneWithoutReview = useCallback((subtaskId: string) => {
    setAllTasks((prev) => mapTaskTree(prev, subtaskId, (task) => ({
      ...task,
      completed: true,
      completedAt: task.completedAt || new Date().toISOString(),
    })));
  }, []);

  const editTaskReview = useCallback((taskId: string, reviewId: string, updates: Partial<Pick<TaskCompletionReview, 'status' | 'percent' | 'summary' | 'unknowns' | 'nextStep'>>) => {
    setAllTasks((prev) => mapTaskTree(prev, taskId, (task) => {
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
    }));
  }, []);

  const changePriority = useCallback((id: string, priority: Task['priority']) => {
    setAllTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, priority } : task))
    );
  }, []);

  const reorderSourceGroups = useCallback((date: string, activeSource: TaskSource, overSource: TaskSource) => {
    setTaskListOrderByDate((prev) => {
      const currentOrder = getSourceOrderForDate(prev, date);
      const nextSourceOrder = moveSourceInOrder(currentOrder, activeSource, overSource);
      return {
        ...prev,
        [date]: {
          ...(prev[date] || {}),
          sourceOrder: nextSourceOrder,
        },
      };
    });
  }, []);

  const reorderTasksWithinSource = useCallback((date: string, source: TaskSource, completed: boolean, activeId: string, overId: string) => {
    setTaskListOrderByDate((prev) => {
      const dateOrder = prev[date] || {};
      const sourceTasks = allTasks.filter((task) => (
        !task.cleared &&
        taskMatchesDate(task, date, currentDate) &&
        getTaskSource(task) === source
      ));
      const bucketTasks = sourceTasks.filter((task) => task.completed === completed);
      const bucketIds = new Set(bucketTasks.map((task) => task.id));
      const sourceTaskIds = new Set(sourceTasks.map((task) => task.id));
      const previousOrder = dateOrder.taskOrderBySource?.[source] || [];
      const nextBucketOrder = buildTaskOrderAfterMove(bucketTasks, previousOrder, activeId, overId);
      const preservedOtherBucketOrder = previousOrder.filter((id) => sourceTaskIds.has(id) && !bucketIds.has(id));
      return {
        ...prev,
        [date]: {
          ...dateOrder,
          taskOrderBySource: {
            ...(dateOrder.taskOrderBySource || {}),
            [source]: [...nextBucketOrder, ...preservedOtherBucketOrder],
          },
        },
      };
    });
  }, [allTasks, currentDate]);

  const clearCompleted = useCallback(() => {
    // 只标记为 cleared(隐藏),不从数据中删除:Obsidian 同步用的是包含全部任务的 allTasks,
    // 所以已完成记录仍会保留在 Obsidian。
    setAllTasks((prev) =>
      prev.map((task) =>
        taskMatchesDate(task, selectedDate, currentDate) && task.completed && !task.cleared
          ? { ...task, cleared: true }
          : task
      )
    );
  }, [currentDate, selectedDate]);

  const filteredTasks = useMemo(() => {
    return allTasks.filter((task) => {
      if (task.cleared) return false; // 已清理的任务不在应用内显示
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;

      const matchesDate = (date: string) => taskMatchesDate(task, date, currentDate);
      switch (activeTab) {
        case 'today':
          return matchesDate(selectedDate);
        case 'completed':
          return matchesDate(selectedDate) && task.completed;
        case 'all':
        default:
          return true;
      }
    });
  }, [activeTab, allTasks, currentDate, priorityFilter, selectedDate]);

  const sortedTasks = sortTasksForDisplay(filteredTasks, selectedDate, taskListOrderByDate);

  const selectedDateTasks = allTasks.filter((task) => taskMatchesDate(task, selectedDate, currentDate) && !task.cleared);
  const selectedDateTaskCommands = [...selectedDateTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
  const completedCount = selectedDateTasks.filter((task) => task.completed).length;
  const totalCount = selectedDateTasks.length;
  const todayCount = allTasks.filter((task) => taskMatchesDate(task, currentDate, currentDate) && !task.cleared).length;
  const allDates = Array.from(
    new Set([...allTasks.map((task) => getTaskDate(task, currentDate)), currentDate])
  ).sort((a, b) => b.localeCompare(a));
  const obsidianSyncTasks = appSettings.syncDeletedReviewsToObsidian
    ? allTasks
    : mergeRetainedReviewsForObsidian(allTasks, retainedObsidianReviews);
  const sourceOrderForSelectedDate = getSourceOrderForDate(taskListOrderByDate, selectedDate);

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
