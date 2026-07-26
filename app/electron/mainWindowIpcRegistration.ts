import { registerAiReviewIpcHandlers } from './aiReviewIpc';
import { registerCompanionIpcHandlers } from './companionIpc';
import { registerObsidianIpcHandlers } from './obsidianIpc';
import { registerSettingsIpcHandlers } from './settingsIpc';
import { registerBackupIpcHandlers } from './backupIpc';
import { registerProductPathsIpcHandlers } from './productPathsIpc';
import { getDiagnosticLogPath } from './diagnostics';
import { app, dialog, shell } from 'electron';
import path from 'node:path';
import { registerTaskContextMenuIpcHandlers, type TaskMenuPayload } from './taskContextMenuIpc';
import { TASK_MENU_HEIGHT } from './taskMenuWindow';
import type {
  MainWindowIpcRegistrationOptions,
  MainWindowIpcRegistrations,
} from './mainWindowIpcRegistrationTypes';
import { registerWindowIpcHandlers } from './windowIpc';

export type { TaskMenuPayload } from './taskContextMenuIpc';
export type {
  MainWindowIpcRegistrationOptions,
  MainWindowIpcRegistrations,
} from './mainWindowIpcRegistrationTypes';

export function createMainWindowIpcRegistrations({
  win,
  store,
  diag,
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
  setInvisibleGlassBackgroundMaterial,
  setNativeWindowDragRegion,
  performanceFrost,
  edgeAutoHide,
  getCompanionSettings,
  setCompanionSettings,
  getAiReviewSettings,
  setAiReviewSettings,
  getObsidianTemplateSettings,
  setObsidianTemplateSettings,
  getReviewSections,
  setReviewSections,
  runReviewForDate,
  getDailyReviewBatch,
  runDailyReviewBatch,
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
  backup,
  productPaths,
}: MainWindowIpcRegistrationOptions): MainWindowIpcRegistrations {
  return {
    registerWindowIpc: () => registerWindowIpcHandlers({
      win,
      store,
      diag,
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
      setInvisibleGlassBackgroundMaterial,
      setNativeWindowDragRegion,
      performanceFrost,
      edgeAutoHide,
    }),
    registerSettingsIpc: () => registerSettingsIpcHandlers({
      store,
      getAppSettings,
      setAppSettings,
      edgeAutoHide,
      getObsidianTemplateSettings,
      setObsidianTemplateSettings,
    }),
    registerBackupIpc: () => registerBackupIpcHandlers({
      backup,
      chooseRestoreFile: async () => {
        const result = await dialog.showOpenDialog(win, {
          title: 'Restore DailyTodo backup',
          properties: ['openFile'],
          filters: [{ name: 'DailyTodo backups', extensions: ['json'] }],
        });
        return result.canceled ? undefined : result.filePaths[0];
      },
      chooseExportFile: async () => {
        const result = await dialog.showSaveDialog(win, {
          title: 'Export DailyTodo backup',
          defaultPath: 'dailytodo-backup.dailytodo-backup.json',
          filters: [{ name: 'DailyTodo backups', extensions: ['json'] }],
        });
        return result.canceled ? undefined : result.filePath;
      },
      openBackupDirectory: () => shell.openPath(backup.backupDirectory),
      relaunch: () => app.relaunch(),
      quit: () => app.quit(),
      createToken: () => `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    }),
    registerProductPathsIpc: () => registerProductPathsIpcHandlers({
      productPaths,
      chooseSupportBundleFile: async () => {
        const result = await dialog.showSaveDialog(win, {
          title: 'Export DailyTodo support bundle',
          defaultPath: 'dailytodo-support-bundle.json',
          filters: [{ name: 'JSON files', extensions: ['json'] }],
        });
        return result.canceled ? undefined : result.filePath;
      },
      openDiagnosticsDirectory: () => shell.openPath(path.dirname(getDiagnosticLogPath())),
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
      getDailyReviewBatch,
      runDailyReviewBatch,
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
