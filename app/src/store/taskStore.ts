import { Task } from '../types/task';
import {
  AppBehaviorSettings,
  ObsidianTemplateSettings,
} from '../../shared/appSettings';
import { SyncPreview } from '../../shared/obsidianTemplates';
import { CaptureItem, CompanionSettings } from '../../shared/obsidianCompanion';

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
  syncTasksToObsidian: (tasks: Task[], selectedDate?: string, dailyWork?: string, dailyInspiration?: string) => window.electronAPI?.syncTasksToObsidian(tasks, selectedDate, dailyWork, dailyInspiration),
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
  return (tasks as Task[]) || [];
};

export const getObsidianPath = async (): Promise<string> => {
  return (await electronAPI.getObsidianPath()) || '';
};

export const chooseObsidianPath = async (): Promise<string> => {
  return (await electronAPI.chooseObsidianPath()) || '';
};

export const syncTasksToObsidian = async (tasks: Task[], selectedDate?: string, dailyWork?: string, dailyInspiration?: string) => {
  return electronAPI.syncTasksToObsidian(tasks, selectedDate, dailyWork, dailyInspiration);
};

export const previewTasksToObsidian = async (
  tasks: Task[],
  selectedDate?: string,
  dailyWork?: string,
  dailyInspiration?: string,
  beforeTasks?: Task[],
): Promise<SyncPreview | undefined> => {
  return electronAPI.previewTasksToObsidian(tasks, selectedDate, dailyWork, dailyInspiration, beforeTasks);
};

export const getAppSettings = async (): Promise<AppBehaviorSettings | undefined> => {
  return electronAPI.getAppSettings();
};

export const setAppSettings = async (settings: AppBehaviorSettings) => {
  return electronAPI.setAppSettings(settings);
};

export const getObsidianTemplateSettings = async (): Promise<ObsidianTemplateSettings | undefined> => {
  return electronAPI.getObsidianTemplateSettings();
};

export const setObsidianTemplateSettings = async (settings: ObsidianTemplateSettings) => {
  return electronAPI.setObsidianTemplateSettings(settings);
};

export const resetObsidianTemplateSettings = async (): Promise<ObsidianTemplateSettings | undefined> => {
  return electronAPI.resetObsidianTemplateSettings();
};

export const openDailyNote = async (date?: string) => {
  return electronAPI.openDailyNote(date);
};

export const getCompanionSettings = async () => {
  return window.electronAPI.getCompanionSettings();
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

export function buildCaptureItems(
  tasks: Task[],
  selectedDate: string,
  dailyWork = '',
  dailyInspiration = ''
): CaptureItem[] {
  const taskItems = tasks
    .filter((task) => (task.taskDate || task.createdAt.slice(0, 10)) === selectedDate)
    .map<CaptureItem>((task) => ({
      id: `task-${task.id}`,
      type: 'task',
      content: task.text,
      tags: [],
      priority: task.priority,
      source: 'desktop',
      status: task.completed ? 'synced' : 'new',
      createdAt: task.createdAt,
      metadata: { taskId: task.id },
    }));

  const noteItems: CaptureItem[] = [];

  if (dailyWork.trim()) {
    noteItems.push({
      id: `work-${selectedDate}`,
      type: 'work',
      content: dailyWork.trim(),
      tags: [],
      source: 'desktop',
      status: 'new',
      createdAt: `${selectedDate}T00:00:00.000Z`,
    });
  }

  if (dailyInspiration.trim()) {
    noteItems.push({
      id: `inspiration-${selectedDate}`,
      type: 'inspiration',
      content: dailyInspiration.trim(),
      tags: [],
      source: 'desktop',
      status: 'new',
      createdAt: `${selectedDate}T00:00:00.000Z`,
    });
  }

  return [...taskItems, ...noteItems];
}
