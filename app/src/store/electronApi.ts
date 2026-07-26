import type {
  AppBehaviorSettings,
  ObsidianTemplateSettings,
} from '../../shared/appSettings';
import type { CaptureItem, CompanionSettings } from '../../shared/obsidianCompanion';
import type { Task } from '../types/task';

/** Typed convenience wrappers around window.electronAPI for the main renderer. */
export const electronAPI = {
  minimize: () => window.electronAPI?.minimize(),
  close: () => window.electronAPI?.close(),
  getAlwaysOnTop: () => window.electronAPI?.getAlwaysOnTop(),
  toggleAlwaysOnTop: () => window.electronAPI?.toggleAlwaysOnTop(),
  resetPosition: () => window.electronAPI?.resetPosition(),
  getLockWindowPosition: () => window.electronAPI?.getLockWindowPosition(),
  setLockWindowPosition: (locked: boolean) => window.electronAPI?.setLockWindowPosition(locked),
  chooseRestoreBackup: () => window.electronAPI?.chooseRestoreBackup(),
  restoreBackup: (request: { token: string; confirmed: true }) => window.electronAPI?.restoreBackup(request),
  exportBackup: () => window.electronAPI?.exportBackup(),
  openBackupFolder: () => window.electronAPI?.openBackupFolder(),
  openDiagnosticsFolder: () => window.electronAPI?.openDiagnosticsFolder(),
  exportSupportBundle: () => window.electronAPI?.exportSupportBundle(),
  getStore: (key: string) => window.electronAPI?.getStore(key),
  setStore: (key: string, value: unknown) => window.electronAPI?.setStore(key, value),
  getAppSettings: () => window.electronAPI?.getAppSettings(),
  setAppSettings: (settings: AppBehaviorSettings) => window.electronAPI?.setAppSettings(settings),
  getObsidianTemplateSettings: () => window.electronAPI?.getObsidianTemplateSettings(),
  setObsidianTemplateSettings: (settings: ObsidianTemplateSettings) => window.electronAPI?.setObsidianTemplateSettings(settings),
  resetObsidianTemplateSettings: () => window.electronAPI?.resetObsidianTemplateSettings(),
  getObsidianPath: () => window.electronAPI?.getObsidianPath(),
  chooseObsidianPath: () => window.electronAPI?.chooseObsidianPath(),
  syncTasksToObsidian: (tasks: Task[], selectedDate?: string, dailyWork?: string, dailyInspiration?: string, beforeTasks?: Task[]) =>
    window.electronAPI?.syncTasksToObsidian(tasks, selectedDate, dailyWork, dailyInspiration, beforeTasks),
  previewTasksToObsidian: (tasks: Task[], selectedDate?: string, dailyWork?: string, dailyInspiration?: string, beforeTasks?: Task[]) =>
    window.electronAPI?.previewTasksToObsidian(tasks, selectedDate, dailyWork, dailyInspiration, beforeTasks),
  openDailyNote: (date?: string) => window.electronAPI?.openDailyNote(date),
  openTodayNote: () => window.electronAPI?.openDailyNote(),
  getCompanionSettings: () => window.electronAPI?.getCompanionSettings(),
  setCompanionSettings: (settings: CompanionSettings) => window.electronAPI?.setCompanionSettings(settings),
  previewCompanionSync: (settings: CompanionSettings, items: CaptureItem[]) => window.electronAPI?.previewCompanionSync(settings, items),
  writeCompanionSync: (settings: CompanionSettings, items: CaptureItem[]) => window.electronAPI?.writeCompanionSync(settings, items),
  importMobileInbox: (inboxPath: string) => window.electronAPI?.importMobileInbox(inboxPath),
};
