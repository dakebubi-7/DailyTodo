import { Task } from '../types/task';
import {
  AppBehaviorSettings,
  ObsidianTemplateSettings,
  normalizeAppSettings,
  normalizeObsidianTemplateSettings,
} from '../../shared/appSettings';
import type { SyncPreview } from '../../shared/obsidianTemplates';
import { readObsidianActionResult, readObsidianPath, readSyncPreview } from '../../shared/obsidianIpcResults';
import { CaptureItem, CompanionSettings } from '../../shared/obsidianCompanion';
import { normalizeCompanionSettings } from '../../shared/obsidianCompanionDefaults';
import { parseStoredTasks } from '../hooks/taskTransforms';

export { buildCaptureItems } from './companionCaptureItems';

const STORE_KEY = 'tasks';

export const electronAPI = {
  minimize: () => window.electronAPI?.minimize(),
  close: () => window.electronAPI?.close(),
  getAlwaysOnTop: () => window.electronAPI?.getAlwaysOnTop(),
  toggleAlwaysOnTop: () => window.electronAPI?.toggleAlwaysOnTop(),
  resetPosition: () => window.electronAPI?.resetPosition(),
  getLockWindowPosition: () => window.electronAPI?.getLockWindowPosition(),
  setLockWindowPosition: (locked: boolean) => window.electronAPI?.setLockWindowPosition(locked),
  getStore: (key: string) => window.electronAPI?.getStore(key),
  setStore: (key: string, value: unknown) => window.electronAPI?.setStore(key, value),
  getAppSettings: () => window.electronAPI?.getAppSettings(),
  setAppSettings: (settings: AppBehaviorSettings) => window.electronAPI?.setAppSettings(settings),
  getObsidianTemplateSettings: () => window.electronAPI?.getObsidianTemplateSettings(),
  setObsidianTemplateSettings: (settings: ObsidianTemplateSettings) => window.electronAPI?.setObsidianTemplateSettings(settings),
  resetObsidianTemplateSettings: () => window.electronAPI?.resetObsidianTemplateSettings(),
  getObsidianPath: () => window.electronAPI?.getObsidianPath(),
  chooseObsidianPath: () => window.electronAPI?.chooseObsidianPath(),
  syncTasksToObsidian: (tasks: Task[], selectedDate?: string, dailyWork?: string, dailyInspiration?: string, beforeTasks?: Task[]) => window.electronAPI?.syncTasksToObsidian(tasks, selectedDate, dailyWork, dailyInspiration, beforeTasks),
  previewTasksToObsidian: (tasks: Task[], selectedDate?: string, dailyWork?: string, dailyInspiration?: string, beforeTasks?: Task[]) => window.electronAPI?.previewTasksToObsidian(tasks, selectedDate, dailyWork, dailyInspiration, beforeTasks),
  openDailyNote: (date?: string) => window.electronAPI?.openDailyNote(date),
  openTodayNote: () => window.electronAPI?.openDailyNote(),
  getCompanionSettings: () => window.electronAPI?.getCompanionSettings(),
  setCompanionSettings: (settings: CompanionSettings) => window.electronAPI?.setCompanionSettings(settings),
  previewCompanionSync: (settings: CompanionSettings, items: CaptureItem[]) => window.electronAPI?.previewCompanionSync(settings, items),
  writeCompanionSync: (settings: CompanionSettings, items: CaptureItem[]) => window.electronAPI?.writeCompanionSync(settings, items),
  importMobileInbox: (inboxPath: string) => window.electronAPI?.importMobileInbox(inboxPath),
};

export const saveTasks = async (tasks: Task[]): Promise<void> => {
  await electronAPI.setStore(STORE_KEY, tasks);
};

export const loadTasks = async (): Promise<Task[]> => {
  const tasks = await electronAPI.getStore(STORE_KEY);
  return parseStoredTasks(tasks);
};

export const getObsidianPath = async (): Promise<string> => {
  return readObsidianPath(await electronAPI.getObsidianPath());
};

export const chooseObsidianPath = async (): Promise<string> => {
  return readObsidianPath(await electronAPI.chooseObsidianPath());
};

export const syncTasksToObsidian = async (
  tasks: Task[],
  selectedDate?: string,
  dailyWork?: string,
  dailyInspiration?: string,
  beforeTasks?: Task[],
) => {
  return readObsidianActionResult(
    await electronAPI.syncTasksToObsidian(tasks, selectedDate, dailyWork, dailyInspiration, beforeTasks),
  );
};

export const previewTasksToObsidian = async (
  tasks: Task[],
  selectedDate?: string,
  dailyWork?: string,
  dailyInspiration?: string,
  beforeTasks?: Task[],
): Promise<SyncPreview | undefined> => {
  return readSyncPreview(
    await electronAPI.previewTasksToObsidian(tasks, selectedDate, dailyWork, dailyInspiration, beforeTasks),
  );
};

export const getAppSettings = async (): Promise<AppBehaviorSettings> => {
  return normalizeAppSettings(await electronAPI.getAppSettings());
};

export const setAppSettings = async (settings: AppBehaviorSettings) => {
  return electronAPI.setAppSettings(settings);
};

export const getObsidianTemplateSettings = async (): Promise<ObsidianTemplateSettings> => {
  return normalizeObsidianTemplateSettings(await electronAPI.getObsidianTemplateSettings());
};

export const setObsidianTemplateSettings = async (settings: ObsidianTemplateSettings) => {
  return electronAPI.setObsidianTemplateSettings(settings);
};

export const resetObsidianTemplateSettings = async (): Promise<ObsidianTemplateSettings> => {
  return normalizeObsidianTemplateSettings(await electronAPI.resetObsidianTemplateSettings());
};

export const openDailyNote = async (date?: string) => {
  return readObsidianActionResult(await electronAPI.openDailyNote(date));
};

export const getCompanionSettings = async (): Promise<CompanionSettings> => {
  return normalizeCompanionSettings(await window.electronAPI.getCompanionSettings());
};

export const setCompanionSettings = async (settings: CompanionSettings) => {
  return window.electronAPI.setCompanionSettings(settings);
};

export const previewCompanionSync = async (settings: CompanionSettings, items: CaptureItem[]) => {
  return window.electronAPI.previewCompanionSync(settings, items);
};

export const writeCompanionSync = async (settings: CompanionSettings, items: CaptureItem[]) => {
  return window.electronAPI.writeCompanionSync(settings, items);
};

export const importMobileInbox = async (inboxPath: string) => {
  return window.electronAPI.importMobileInbox(inboxPath);
};
