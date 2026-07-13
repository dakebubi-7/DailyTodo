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
import { electronAPI } from './electronApi';

export { buildCaptureItems } from './companionCaptureItems';

export { electronAPI } from './electronApi';

const STORE_KEY = 'tasks';

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
