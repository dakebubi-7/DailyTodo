import { registerAiReviewIpcHandlers } from './aiReviewIpc';
import { registerCompanionIpcHandlers } from './companionIpc';
import type { CreateMainWindowBootstrapOptions } from './mainWindowBootstrap';
import type { SetupMainBrowserWindowOptions } from './mainWindowFactory';
import { registerObsidianIpcHandlers } from './obsidianIpc';
import { registerSettingsIpcHandlers } from './settingsIpc';
import { registerTaskContextMenuIpcHandlers, type TaskMenuPayload } from './taskContextMenuIpc';
import { TASK_MENU_HEIGHT } from './taskMenuWindow';
import { registerWindowIpcHandlers } from './windowIpc';

export type { TaskMenuPayload } from './taskContextMenuIpc';

type MainWindowIpcRegistrationOptions = Pick<
  CreateMainWindowBootstrapOptions,
  | 'win'
  | 'store'
  | 'scheduleAiTimers'
  | 'getTaskMenuWindow'
  | 'openTaskMenuWindow'
  | 'closeTaskMenuWindow'
  | 'getTaskMenuPayload'
  | 'setTaskMenuPayload'
  | 'getMainWindow'
  | 'getWindowMode'
  | 'hideMainWindow'
  | 'getAppSettings'
  | 'persistWindowState'
  | 'compactModeKey'
  | 'autoStartKey'
  | 'settingsMode'
  | 'setWindowMode'
  | 'setAppSettings'
  | 'reapplyWindowZOrder'
  | 'getCompanionSettings'
  | 'setCompanionSettings'
  | 'getAiReviewSettings'
  | 'setAiReviewSettings'
  | 'getObsidianTemplateSettings'
  | 'setObsidianTemplateSettings'
  | 'getReviewSections'
  | 'setReviewSections'
  | 'runReviewForDate'
  | 'inspectDailyAiContent'
  | 'getDateKey'
  | 'getVaultPath'
  | 'getVaultStatus'
  | 'getDailyFilePath'
  | 'buildDailySourceRules'
  | 'getDailySourceRules'
  | 'getLlmCaller'
  | 'ensureReportLlmAvailable'
  | 'emitAiReviewProgress'
  | 'stage'
  | 'createDiagnostic'
  | 'extractDocxText'
  | 'zh'
  | 'obsidianPathKey'
  | 'getDefaultVaultPath'
  | 'syncTasksToObsidian'
  | 'previewTasksToObsidian'
  | 'buildDailyTemplate'
  | 'triggerOverviewUpdate'
>;

type MainWindowIpcRegistrations = Pick<
  SetupMainBrowserWindowOptions,
  | 'registerWindowIpc'
  | 'registerSettingsIpc'
  | 'registerTaskContextMenuIpc'
  | 'registerCompanionIpc'
  | 'registerAiReviewIpc'
  | 'registerObsidianIpc'
>;

export function createMainWindowIpcRegistrations({
  win,
  store,
  scheduleAiTimers,
  getTaskMenuWindow,
  openTaskMenuWindow,
  closeTaskMenuWindow,
  getTaskMenuPayload,
  setTaskMenuPayload,
  getMainWindow,
  getWindowMode,
  hideMainWindow,
  getAppSettings,
  persistWindowState,
  compactModeKey,
  autoStartKey,
  settingsMode,
  setWindowMode,
  setAppSettings,
  reapplyWindowZOrder,
  getCompanionSettings,
  setCompanionSettings,
  getAiReviewSettings,
  setAiReviewSettings,
  getObsidianTemplateSettings,
  setObsidianTemplateSettings,
  getReviewSections,
  setReviewSections,
  runReviewForDate,
  inspectDailyAiContent,
  getDateKey,
  getVaultPath,
  getVaultStatus,
  getDailyFilePath,
  buildDailySourceRules,
  getDailySourceRules,
  getLlmCaller,
  ensureReportLlmAvailable,
  emitAiReviewProgress,
  stage,
  createDiagnostic,
  extractDocxText,
  zh,
  obsidianPathKey,
  getDefaultVaultPath,
  syncTasksToObsidian,
  previewTasksToObsidian,
  buildDailyTemplate,
  triggerOverviewUpdate,
}: MainWindowIpcRegistrationOptions): MainWindowIpcRegistrations {
  return {
    registerWindowIpc: () => registerWindowIpcHandlers({
      win,
      store,
      compactModeKey,
      autoStartKey,
      settingsMode,
      hideMainWindow,
      getWindowMode,
      setWindowMode,
      persistWindowState,
      getAppSettings,
      setAppSettings,
      getMainWindow,
      reapplyWindowZOrder,
    }),
    registerSettingsIpc: () => registerSettingsIpcHandlers({
      store,
      getAppSettings,
      setAppSettings,
      getObsidianTemplateSettings,
      setObsidianTemplateSettings,
    }),
    registerTaskContextMenuIpc: () => registerTaskContextMenuIpcHandlers({
      defaultTaskMenuHeight: TASK_MENU_HEIGHT,
      openTaskMenuWindow,
      closeTaskMenuWindow,
      getTaskMenuWindow,
      getMainWindow,
      getTaskMenuPayload,
      setTaskMenuPayload,
    }),
    registerCompanionIpc: () => registerCompanionIpcHandlers({
      getCompanionSettings,
      setCompanionSettings,
    }),
    registerAiReviewIpc: () => registerAiReviewIpcHandlers({
      win,
      getAppSettings,
      getAiReviewSettings,
      setAiReviewSettings,
      getObsidianTemplateSettings,
      getReviewSections,
      setReviewSections,
      scheduleAiTimers,
      runReviewForDate,
      inspectDailyAiContent,
      getDateKey,
      getVaultPath,
      getVaultStatus,
      getDailyFilePath,
      buildDailySourceRules,
      getDailySourceRules,
      getLlmCaller,
      ensureReportLlmAvailable,
      emitAiReviewProgress,
      stage,
      createDiagnostic,
      extractDocxText,
      zh,
    }),
    registerObsidianIpc: () => registerObsidianIpcHandlers({
      win,
      store,
      obsidianPathKey,
      getDefaultVaultPath,
      getVaultPath,
      getVaultStatus,
      getAiReviewSettings,
      getLlmCaller,
      syncTasksToObsidian,
      previewTasksToObsidian,
      getDateKey,
      getDailyFilePath,
      buildDailyTemplate,
      triggerOverviewUpdate,
      zh,
    }),
  };
}
