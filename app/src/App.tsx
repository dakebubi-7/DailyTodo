import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTasks } from './hooks/useTasks';
import { useFloatingScrollbar } from './hooks/useFloatingScrollbar';
import './styles/context-menu.css';
import { TitleBar } from './components/TitleBar';
import { Header } from './components/Header';
import { DateNavigator } from './components/DateNavigator';
import { TabBar } from './components/TabBar';
import { TaskList } from './components/TaskList';
import { DailyWorkPanel } from './components/DailyWorkPanel';
import { ReviewView } from './components/ReviewView';
import { AddTaskInput } from './components/AddTaskInput';
import { SettingsPanel } from './components/SettingsPanel';
import { AiOnboarding } from './components/AiOnboarding';
import { TaskCompletionDialog } from './components/TaskCompletionDialog';
import { TaskReviewDialog } from './components/TaskReviewDialog';
import { ObsidianCompanionPanel } from './components/ObsidianCompanionPanel';
import {
  DEFAULT_PERSONALIZATION,
  PersonalizationSettings,
  ThemeOpacityOverride,
  extractOpacityOverride,
} from './types/personalization';
import { THEME_PRESETS, ThemePreset, matchThemePreset } from './types/themePresets';
import { Task, TaskCompletionReview } from './types/task';
import { CaptureItem, CompanionSettings, SyncPlan } from '../shared/obsidianCompanion';
import {
  ObsidianTemplateSettings,
  createDefaultObsidianTemplateSettings,
} from '../shared/appSettings';
import { SyncPreview } from '../shared/obsidianTemplates';
import { createDefaultCompanionSettings } from '../shared/obsidianCompanionDefaults';
import {
  buildCaptureItems,
  getCompanionSettings,
  getObsidianTemplateSettings,
  importMobileInbox,
  previewTasksToObsidian,
  previewCompanionSync,
  resetObsidianTemplateSettings,
  setCompanionSettings,
  setObsidianTemplateSettings,
  writeCompanionSync,
} from './store/taskStore';
import { getShellText } from './i18n';
import {
  AiReviewSettings,
} from '../shared/aiReview/aiReviewSettings';
import { shouldShowOnboarding } from '../shared/aiReview/onboarding';

type PriorityFilter = 'all' | 'high' | 'medium' | 'low';
const PERSONALIZATION_KEY = 'personalizationSettings';
const THEME_OVERRIDES_KEY = 'themeOpacityOverrides';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function shiftDate(date: string, days: number) {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + days);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
}

function findTaskInTree(tasks: Task[], taskId: string): Task | null {
  for (const task of tasks) {
    if (task.id === taskId) return task;
    if (task.subtasks?.length) {
      const found = findTaskInTree(task.subtasks, taskId);
      if (found) return found;
    }
  }
  return null;
}

function isSubtask(task: Task) {
  return Boolean(task.parentTaskId);
}

export default function App() {
  const {
    tasks,
    allTasks,
    selectedDateTaskCommands,
    obsidianSyncTasks,
    activeTab,
    setActiveTab,
    selectedDate,
    setSelectedDate,
    allDates,
    dailyWork,
    dailyInspiration,
    updateDailyWork,
    updateDailyInspiration,
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
    completedCount,
    totalCount,
    appSettings,
    updateAppSettings,
    isDark,
    toggleDarkMode,
    setDarkMode,
    obsidianPath,
    syncStatus,
    chooseObsidianFolder,
    openSelectedDailyNote,
    clearCompleted,
    isLoaded,
  } = useTasks();

  const [isDailyWorkOpen, setIsDailyWorkOpen] = useState(false);
  const [isInspirationOpen, setIsInspirationOpen] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aiOnboarding, setAiOnboarding] = useState<AiReviewSettings | null>(null);
  const [completionTask, setCompletionTask] = useState<Task | null>(null);
  const [reviewTask, setReviewTask] = useState<Task | null>(null);
  const [completionTarget, setCompletionTarget] = useState<{ mode: 'task' | 'subtask'; id: string } | null>(null);
  const [personalization, setPersonalization] = useState<PersonalizationSettings>(DEFAULT_PERSONALIZATION);
  // 右键菜单 popup 触发的「编辑」请求：{任务 id, 递增 nonce}。
  const [editRequest, setEditRequest] = useState<{ id: string; nonce: number } | null>(null);
  // 每个主题单独记忆的透明度，避免切回主题时被预设默认值覆盖。
  const [themeOverrides, setThemeOverrides] = useState<Record<string, ThemeOpacityOverride>>({});
  const [personalizationReady, setPersonalizationReady] = useState(false);
  const [companionOpen, setCompanionOpen] = useState(false);
  const [companionSettings, setCompanionSettingsState] = useState(createDefaultCompanionSettings());
  const [companionPlan, setCompanionPlan] = useState<SyncPlan | null>(null);
  const [companionStatus, setCompanionStatus] = useState('');
  const [mobileCaptureItems, setMobileCaptureItems] = useState<CaptureItem[]>([]);
  const [obsidianTemplates, setObsidianTemplatesState] = useState<ObsidianTemplateSettings>(createDefaultObsidianTemplateSettings());
  const [settingsSyncPreview, setSettingsSyncPreview] = useState<SyncPreview | null>(null);
  const mainScrollRef = useRef<HTMLDivElement>(null);
  useFloatingScrollbar(mainScrollRef, { headerSelector: '.app-top' });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('texture-disabled', !personalization.texture);
  }, [isDark, personalization.texture]);

  // 全局字体缩放：rem 基准随之改变，文字与间距等比放大/缩小
  useEffect(() => {
    const scale = clamp(personalization.fontScale ?? 100, 80, 130);
    document.documentElement.style.fontSize = `${(14 * scale) / 100}px`;
  }, [personalization.fontScale]);

  // Apply always-on-top when personalization loads
  useEffect(() => {
    if (personalization.alwaysOnTop) {
      window.electronAPI?.toggleAlwaysOnTop();
    }
  }, [personalizationReady]);

  useEffect(() => {
    window.electronAPI?.getWindowCompactMode().then((value) => setCompactMode(Boolean(value)));
    window.electronAPI?.getStore('dailyWorkOpen').then((value) => setIsDailyWorkOpen(Boolean(value)));
    window.electronAPI?.getStore('dailyInspirationOpen').then((value) => setIsInspirationOpen(Boolean(value)));
    window.electronAPI?.getStore('taskSearchQuery').then((value) => setSearchQuery((value as string) || ''));
    window.electronAPI?.getStore('taskSearchOpen').then((value) => setSearchOpen(Boolean(value)));
    window.electronAPI?.getStore('taskOpenOnly').then((value) => setShowOpenOnly(Boolean(value)));
    window.electronAPI?.getStore('taskPriorityFilter').then((value) => {
      if (value === 'all' || value === 'high' || value === 'medium' || value === 'low') {
        setPriorityFilter(value);
      }
    });
    window.electronAPI?.getStore(PERSONALIZATION_KEY).then((value) => {
      if (value && typeof value === 'object') {
        const loaded = { ...DEFAULT_PERSONALIZATION, ...(value as Partial<PersonalizationSettings>) };
        // 如果加载的数据没有 themeId，尝试根据参数匹配主题
        if (!loaded.themeId) {
          loaded.themeId = matchThemePreset(loaded, isDark) || undefined;
        }
        // 旧存档可能存有已移除的独立深色主题（dark-mode/night）——回退为浅色模板，
        // 深色现在由 isDark 单独控制，模板保持不变。
        if (loaded.themeId && !THEME_PRESETS.some((p) => p.id === loaded.themeId)) {
          loaded.themeId = undefined;
        }
        setPersonalization(loaded);
        // 种入当前主题已有的透明度，作为该主题的初始记忆。
        if (loaded.themeId) {
          setThemeOverrides((prev) => ({
            [loaded.themeId as string]: extractOpacityOverride(loaded),
            ...prev,
          }));
        }
      }
      setPersonalizationReady(true);
    });
    window.electronAPI?.getStore(THEME_OVERRIDES_KEY).then((value) => {
      if (value && typeof value === 'object') {
        // 已保存的记忆优先于上面种入的初始值。
        setThemeOverrides((prev) => ({ ...prev, ...(value as Record<string, ThemeOpacityOverride>) }));
      }
    });
    // 加载上次的明暗状态
    window.electronAPI?.getStore('isDark').then((value) => {
      if (typeof value === 'boolean') {
        setDarkMode(value);
      }
    });
    getCompanionSettings()
      .then((settings) => setCompanionSettingsState(settings))
      .catch(() => setCompanionSettingsState(createDefaultCompanionSettings()));
    getObsidianTemplateSettings()
      .then((settings) => {
        if (settings) setObsidianTemplatesState(settings);
      })
      .catch(() => setObsidianTemplatesState(createDefaultObsidianTemplateSettings()));
  }, []);

  // AI 复盘补偿：启动加载完成后补近 N 天；定时器到点（aiReview:tick）再补一次。
  // 用 ref 持有最新 allTasks 供 tick 监听器读取；主进程在 AI 未启用/无 key 时会静默跳过。
  const allTasksRef = useRef(allTasks);
  allTasksRef.current = allTasks;
  useEffect(() => {
    if (!isLoaded) return;
    void window.electronAPI?.aiReview?.backfill(allTasksRef.current);
    const offDaily = window.electronAPI?.aiReview?.onTick(() => {
      void window.electronAPI?.aiReview?.backfill(allTasksRef.current);
    });
    // 周报定时：到点生成「上一周」（今天往前 7 天落在上一个完整周）。
    const pad2 = (n: number) => String(n).padStart(2, '0');
    const ymd = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    // 定时报告找不到素材时不再静默吞掉错误：记录到 console 并保存到 window 上供后续读取，
    // 这样设置页/最近生成状态可以显示具体原因（如 NO_SOURCE_MATERIALS_ERROR）。
    const handleScheduledReportResult = (result?: { ok: boolean; error?: string }) => {
      if (!result || result.ok) return;
      const message = result.error || '没有找到本周期原始记录，请检查素材来源或手动选择素材文件。';
      console.warn('[scheduled report]', message);
      try {
        (window as unknown as { __dailytodoLastScheduledError?: string }).__dailytodoLastScheduledError = message;
      } catch {
        /* noop */
      }
    };
    const offWeekly = window.electronAPI?.aiReview?.onWeeklyTick(() => {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      void window.electronAPI?.aiReview?.generateWeekly(ymd(lastWeek), allTasksRef.current).then(handleScheduledReportResult);
    });
    // 月报定时：到点生成「上一个月」（用上月最后一天，落在该月内）。
    const offMonthly = window.electronAPI?.aiReview?.onMonthlyTick(() => {
      const now = new Date();
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      void window.electronAPI?.aiReview?.generateMonthly(ymd(prevMonthEnd), allTasksRef.current).then(handleScheduledReportResult);
    });
    return () => {
      offDaily?.();
      offWeekly?.();
      offMonthly?.();
    };
  }, [isLoaded]);

  // AI 复盘首次向导：首启且未启用、从未关闭过 → 弹出。
  useEffect(() => {
    let active = true;
    void window.electronAPI?.aiReview?.getSettings().then((settings) => {
      if (active && settings && shouldShowOnboarding(settings)) setAiOnboarding(settings);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    window.electronAPI?.setWindowCompactMode(compactMode);
    window.electronAPI?.setStore('dailyWorkOpen', isDailyWorkOpen);
    window.electronAPI?.setStore('dailyInspirationOpen', isInspirationOpen);
    window.electronAPI?.setStore('taskSearchQuery', searchQuery);
    window.electronAPI?.setStore('taskSearchOpen', searchOpen);
    window.electronAPI?.setStore('taskOpenOnly', showOpenOnly);
    window.electronAPI?.setStore('taskPriorityFilter', priorityFilter);
    if (personalizationReady) {
      window.electronAPI?.setStore(PERSONALIZATION_KEY, personalization);
      window.electronAPI?.setStore(THEME_OVERRIDES_KEY, themeOverrides);
      window.electronAPI?.setStore('isDark', isDark);
    }
  }, [compactMode, isDailyWorkOpen, isInspirationOpen, personalization, themeOverrides, personalizationReady, priorityFilter, searchOpen, searchQuery, showOpenOnly, isDark]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';

      if (event.ctrlKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCompactMode((prev) => !prev);
        return;
      }

      if (event.ctrlKey && event.key.toLowerCase() === 'o') {
        event.preventDefault();
        openSelectedDailyNote();
        return;
      }

      if (!isTyping && event.key === '[') {
        setSelectedDate((prev) => shiftDate(prev, -1));
      }

      if (!isTyping && event.key === ']') {
        setSelectedDate((prev) => shiftDate(prev, 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openSelectedDailyNote, setSelectedDate]);

  // 右键菜单 popup 把用户操作通过主进程转发回来：在这里落到实际的任务更新。
  useEffect(() => {
    const off = window.electronAPI?.onTaskMenuAction((payload) => {
      const { taskId, updates } = payload;
      const action = (updates as { __action?: 'edit' | 'delete' | 'addSubtask'; text?: string }).__action;
      if (action === 'addSubtask') {
        addSubtask(taskId, String((updates as { text?: string }).text || ''));
        return;
      }
      if (action === 'delete') {
        deleteTask(taskId);
        return;
      }
      if (action === 'edit') {
        setEditRequest((prev) => ({ id: taskId, nonce: (prev?.nonce || 0) + 1 }));
        return;
      }
      updateTask(taskId, updates);
    });
    return () => off?.();
  }, [addSubtask, deleteTask, updateTask]);

  const visibleTasks = tasks.filter((task) => {
    if (showOpenOnly && task.completed) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    if (searchQuery.trim() && !task.text.toLowerCase().includes(searchQuery.trim().toLowerCase())) return false;
    return true;
  });
  const selectedDateTasksForCommands = selectedDateTaskCommands;
  const currentReviewTask = reviewTask ? findTaskInTree(allTasks, reviewTask.id) : null;
  const shellText = getShellText(appSettings.language).app;
  const activeThemeId = personalization.themeId || matchThemePreset(personalization, isDark);
  const activeThemeClass = activeThemeId ? `theme-${activeThemeId}` : '';

  const handleToggleTask = (id: string) => {
    const task = tasks.find((item) => item.id === id);
    if (!task || task.completed) {
      toggleTask(id);
      return;
    }

    setCompletionTarget({ mode: 'task', id: task.id });
    setCompletionTask(task);
  };

  const handleToggleSubtask = (id: string) => {
    const subtask = findTaskInTree(allTasks, id);
    if (!subtask || subtask.completed) {
      toggleSubtask(id);
      return;
    }

    setCompletionTarget({ mode: 'subtask', id: subtask.id });
    setCompletionTask(subtask);
  };

  const handleCompleteWithReview = (taskId: string, review: Omit<TaskCompletionReview, 'reviewedAt' | 'id'>) => {
    const target = completionTarget?.id === taskId ? completionTarget : { mode: 'task' as const, id: taskId };
    if (target.mode === 'subtask') {
      updateSubtaskReview(taskId, review);
    } else {
      completeTaskWithReview(taskId, review);
    }
    setCompletionTask(null);
    setReviewTask(null);
    setCompletionTarget(null);
  };

  const handleCompleteWithoutReview = (taskId: string) => {
    const target = completionTarget?.id === taskId ? completionTarget : { mode: 'task' as const, id: taskId };
    if (target.mode === 'subtask') {
      markSubtaskDoneWithoutReview(taskId);
    } else {
      toggleTask(taskId);
    }
    setCompletionTask(null);
    setCompletionTarget(null);
  };

  const handleViewCompletion = (task: Task) => {
    const hasReview = Boolean(task.completionReviews?.length || task.completionReview);
    setCompletionTarget({ mode: isSubtask(task) ? 'subtask' : 'task', id: task.id });
    if (!hasReview && task.completed) {
      setCompletionTask(task);
      return;
    }
    setReviewTask(task);
  };

  const getCurrentCaptureItems = () => [
    ...buildCaptureItems(allTasks, selectedDate, dailyWork, dailyInspiration),
    ...mobileCaptureItems,
  ];

  const updateCompanionSettings = async (next: CompanionSettings) => {
    setCompanionSettingsState(next);
    await setCompanionSettings(next);
  };

  const updateObsidianTemplates = async (next: ObsidianTemplateSettings) => {
    setObsidianTemplatesState(next);
    setSettingsSyncPreview(null);
    await setObsidianTemplateSettings(next);
  };

  const resetObsidianTemplates = async () => {
    const next = await resetObsidianTemplateSettings();
    if (next) {
      setObsidianTemplatesState(next);
      setSettingsSyncPreview(null);
    }
  };

  const applyThemePreset = (preset: ThemePreset) => {
    // 只切换模板（布局/颜色参数），明暗由 isDark 单独控制，保持不变。
    // 透明度优先用该主题上次记忆的值，没有则用预设默认值。
    const remembered = themeOverrides[preset.id];
    setPersonalization(remembered ? { ...preset.settings, ...remembered } : preset.settings);
  };

  // 包装 setPersonalization：当用户调整透明度时，按当前主题记忆下来。
  const handlePersonalizationChange = (next: PersonalizationSettings) => {
    setPersonalization(next);
    if (next.themeId) {
      setThemeOverrides((prev) => ({ ...prev, [next.themeId as string]: extractOpacityOverride(next) }));
    }
  };

  const handleToggleDarkMode = () => {
    // 仅翻转明暗，当前主题模板保持不变；每个模板有自己的深色调色板（见 CSS）。
    toggleDarkMode();
  };

  const chooseCompanionVault = async () => {
    const vaultPath = await chooseObsidianFolder();
    if (!vaultPath) return;
    await updateCompanionSettings({ ...companionSettings, vaultPath });
  };

  const previewCompanion = async () => {
    const plan = await previewCompanionSync(companionSettings, getCurrentCaptureItems());
    setCompanionPlan(plan);
    setCompanionStatus(plan.ok ? `Preview ready: ${plan.changes.length} change(s).` : plan.errors.join(' '));
  };

  const previewSettingsSync = async () => {
    const preview = await previewTasksToObsidian(obsidianSyncTasks, selectedDate, dailyWork, dailyInspiration, allTasks);
    setSettingsSyncPreview(preview || null);
  };

  const syncCompanion = async () => {
    const result = await writeCompanionSync(companionSettings, getCurrentCaptureItems());
    setCompanionStatus(result.ok ? 'Synced to Obsidian.' : result.errors.join(' '));
  };

  const importCompanionMobileInbox = async () => {
    const result = await importMobileInbox(companionSettings.mobileInboxPath);
    if (result.items.length) {
      setMobileCaptureItems((existing) => [...existing, ...result.items]);
    }
    setCompanionStatus(
      result.ok
        ? `Imported ${result.items.length} mobile item(s).`
        : result.errors.join(' ')
    );
  };

  const windowOpacity = clamp(personalization.windowOpacity / 100, 0, 1);
  const panelOpacity = clamp(personalization.panelOpacity / 100, 0, 1);
  const topOpacity = clamp((personalization.topOpacity ?? 90) / 100, 0, 1);
  const cardOpacity = clamp((personalization.cardOpacity ?? 86) / 100, 0, 1);
  const controlOpacity = clamp((personalization.controlOpacity ?? 90) / 100, 0, 1);
  const menuOpacity = clamp((personalization.menuOpacity ?? 96) / 100, 0, 1);
  const inputOpacity = clamp((personalization.inputOpacity ?? personalization.controlOpacity ?? personalization.panelOpacity) / 100, 0, 1);
  const dialogOpacity = clamp((personalization.dialogOpacity ?? personalization.menuOpacity ?? 94) / 100, 0, 1);
  const settingsPanelOpacity = clamp((personalization.settingsPanelOpacity ?? personalization.menuOpacity ?? 92) / 100, 0, 1);
  const blurStrength = clamp(personalization.blurStrength, 0, 48);
  const shellRadius = clamp(personalization.radius, 4, 36);
  const cardRadius = clamp(personalization.radius - 4, 4, 28);
  const controlRadius = clamp(personalization.radius - 8, 4, 24);
  const glassSaturation = clamp(1.08 + (1 - Math.min(windowOpacity, panelOpacity)) * 0.32, 1.08, 1.4);

  return (
    <div
      className={`app-viewport transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      style={{
        '--personal-accent': personalization.accentColor,
        '--personal-secondary': personalization.secondaryColor,
        '--window-opacity': windowOpacity,
        '--panel-opacity': panelOpacity,
        '--top-opacity': topOpacity,
        '--card-opacity': cardOpacity,
        '--control-opacity': controlOpacity,
        '--menu-opacity': menuOpacity,
        '--input-opacity': inputOpacity,
        '--dialog-opacity': dialogOpacity,
        '--settings-panel-opacity': settingsPanelOpacity,
        '--readable-surface-opacity': clamp(panelOpacity + 0.16, 0.62, 0.98),
        '--glass-saturation': glassSaturation,
        '--blur-strength': `${blurStrength}px`,
        '--shell-radius': `${shellRadius}px`,
        '--card-radius': `${cardRadius}px`,
        '--control-radius': `${controlRadius}px`,
      } as CSSProperties}
    >
      <div className={`app-shell ${activeThemeClass} density-${personalization.layoutDensity} ${personalization.texture ? 'texture-on' : 'texture-off'} ${personalization.animations ? 'motion-on' : 'motion-off'} ${compactMode ? 'task-priority-mode' : ''} relative flex h-full flex-col overflow-hidden border border-white/45 text-zinc-900 backdrop-blur-2xl dark:border-white/10 dark:text-zinc-100`}>
        <TitleBar
          compactMode={compactMode}
          settingsOpen={settingsOpen}
          lockWindowPosition={appSettings.lockWindowPosition}
          language={appSettings.language}
          onToggleCompactMode={() => setCompactMode((prev) => !prev)}
          onToggleSettings={() => setSettingsOpen((prev) => !prev)}
          onToggleLockWindowPosition={() => updateAppSettings({ ...appSettings, lockWindowPosition: !appSettings.lockWindowPosition })}
        />
        <SettingsPanel
          isOpen={settingsOpen}
          settings={personalization}
          appSettings={appSettings}
          obsidianTemplates={obsidianTemplates}
          obsidianPath={obsidianPath}
          syncPreview={settingsSyncPreview}
          isDark={isDark}
          selectedDate={selectedDate}
          completedCount={completedCount}
          tasks={allTasks}
          onClearCompleted={clearCompleted}
          onApplyTheme={applyThemePreset}
          onChange={handlePersonalizationChange}
          onAppSettingsChange={updateAppSettings}
          onObsidianTemplatesChange={updateObsidianTemplates}
          onChooseObsidian={chooseObsidianFolder}
          onPreviewSync={previewSettingsSync}
          onResetTemplates={resetObsidianTemplates}
          onClose={() => setSettingsOpen(false)}
          onOpenCompanionSettings={() => {
            setCompanionOpen(true);
            setSettingsOpen(false);
          }}
        />
        {aiOnboarding && (
          <AiOnboarding
            isOpen
            text={getShellText(appSettings.language).settings.aiReview.onboarding}
            initialSettings={aiOnboarding}
            onComplete={(next) => {
              void window.electronAPI?.aiReview?.setSettings(next);
              setAiOnboarding(null);
            }}
          />
        )}
        <ObsidianCompanionPanel
          isOpen={companionOpen}
          settings={companionSettings}
          syncPlan={companionPlan}
          status={companionStatus}
          onChange={updateCompanionSettings}
          onClose={() => setCompanionOpen(false)}
          onChooseVault={chooseCompanionVault}
          onPreview={previewCompanion}
          onSync={syncCompanion}
          onImportMobileInbox={importCompanionMobileInbox}
        />
        <TaskCompletionDialog
          task={completionTask}
          onCancel={() => setCompletionTask(null)}
          onSave={handleCompleteWithReview}
          onCompleteWithoutReview={handleCompleteWithoutReview}
        />
        <TaskReviewDialog
          task={currentReviewTask}
          onClose={() => setReviewTask(null)}
          onAddRecord={(task) => setCompletionTask(task)}
          onDeleteRecord={deleteTaskReview}
        />

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.12 }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div ref={mainScrollRef} className="app-main-scroll min-h-0 flex flex-1 flex-col overflow-hidden">
            <div className="app-top border-b border-white/45 bg-white/38 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/35">
              <Header
                selectedDate={selectedDate}
                completedCount={completedCount}
                totalCount={totalCount}
                isDark={isDark}
                onToggleDark={handleToggleDarkMode}
                obsidianPath={obsidianPath}
                syncStatus={syncStatus}
                onChooseObsidian={chooseObsidianFolder}
                onOpenTodayNote={openSelectedDailyNote}
              />
              <DateNavigator
                selectedDate={selectedDate}
                allDates={allDates}
                tasks={allTasks.filter((task) => !task.cleared)}
                onDateChange={setSelectedDate}
              />
              <div className="daily-panels px-3 pt-1.5">
                <div className="daily-panel-switch grid grid-cols-2 gap-2">
                  <button
                    className={`daily-panel-tab ${dailyWork.trim() ? 'daily-panel-has-content' : ''} ${isDailyWorkOpen ? 'daily-panel-tab-active' : ''}`}
                    onClick={() => {
                      setIsDailyWorkOpen((prev) => !prev);
                      setIsInspirationOpen(false);
                    }}
                    aria-label={shellText.editDailyWork}
                    aria-pressed={isDailyWorkOpen}
                    title={dailyWork.trim() ? `${shellText.editDailyWork}: has content` : shellText.editDailyWork}
                  >
                    {shellText.dailyWork}
                    {dailyWork.trim() && <span className="daily-panel-dot" aria-hidden="true" />}
                  </button>
                  <button
                    className={`daily-panel-tab ${dailyInspiration.trim() ? 'daily-panel-has-content' : ''} ${isInspirationOpen ? 'daily-panel-tab-active' : ''}`}
                    onClick={() => {
                      setIsInspirationOpen((prev) => !prev);
                      setIsDailyWorkOpen(false);
                    }}
                    aria-label={shellText.editInspiration}
                    aria-pressed={isInspirationOpen}
                    title={dailyInspiration.trim() ? `${shellText.editInspiration}: has content` : shellText.editInspiration}
                  >
                    {shellText.inspiration}
                    {dailyInspiration.trim() && <span className="daily-panel-dot" aria-hidden="true" />}
                  </button>
                </div>
                <DailyWorkPanel
                  title={shellText.dailyWork}
                  description={shellText.dailyWorkDescription}
                  placeholder={shellText.dailyWorkPlaceholder}
                  value={dailyWork}
                  tasks={selectedDateTasksForCommands}
                  language={appSettings.language}
                  onChange={updateDailyWork}
                  isOpen={isDailyWorkOpen}
                  onClose={() => setIsDailyWorkOpen(false)}
                />
                <DailyWorkPanel
                  title={shellText.inspiration}
                  description={shellText.inspirationDescription}
                  placeholder={shellText.inspirationPlaceholder}
                  value={dailyInspiration}
                  tasks={selectedDateTasksForCommands}
                  language={appSettings.language}
                  onChange={updateDailyInspiration}
                  isOpen={isInspirationOpen}
                  onClose={() => setIsInspirationOpen(false)}
                />
              </div>
              <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
            </div>

            {activeTab === 'completed' ? (
              <ReviewView allTasks={allTasks} onEditReview={editTaskReview} />
            ) : (
              <TaskList
                tasks={visibleTasks}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchOpen={searchOpen}
                onToggleSearch={() => setSearchOpen((prev) => !prev)}
                showOpenOnly={showOpenOnly}
                onToggleOpenOnly={() => setShowOpenOnly((prev) => !prev)}
                priorityFilter={priorityFilter}
                onPriorityFilterChange={setPriorityFilter}
                onToggle={handleToggleTask}
                onDelete={deleteTask}
                onEdit={editTask}
                onPriorityChange={changePriority}
                onViewReview={handleViewCompletion}
                onToggleSubtask={handleToggleSubtask}
                onDeleteSubtask={deleteSubtask}
                onToggleCollapse={toggleTaskCollapse}
                onViewSubtaskReview={handleViewCompletion}
                editRequest={editRequest}
              />
            )}
          </div>

          <AddTaskInput onAdd={addTask} />
        </motion.div>
      </div>
    </div>
  );
}
