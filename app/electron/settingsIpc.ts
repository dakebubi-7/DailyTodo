import { BrowserWindow, ipcMain } from 'electron';
import {
  OBSIDIAN_TEMPLATE_SETTINGS_KEY,
  createDefaultObsidianTemplateSettings,
  type AppBehaviorSettings,
  type ObsidianTemplateSettings,
} from '../shared/appSettings';
import {
  filterRendererStoreKeys,
  isRendererStoreKey,
  pickRendererStoreEntries,
} from '../shared/rendererStoreKeys';
import type { ElectronStoreLike } from './sharedTypes';
import { areStoreValuesEqual } from './storeValueEquality';
import { filterValidTasks } from '../shared/taskValidation';
import { isObjectRecord } from './unknownValueGuards';
import type { EdgeAutoHideController } from './edgeAutoHideController';

type RegisterSettingsIpcHandlersOptions = {
  store: ElectronStoreLike;
  getAppSettings(): AppBehaviorSettings;
  setAppSettings(value: unknown): AppBehaviorSettings;
  getObsidianTemplateSettings(): ObsidianTemplateSettings;
  setObsidianTemplateSettings(value: unknown): ObsidianTemplateSettings;
  edgeAutoHide?: Pick<EdgeAutoHideController, 'reconcileSettings'>;
};

export function registerSettingsIpcHandlers({
  store,
  getAppSettings,
  setAppSettings,
  getObsidianTemplateSettings,
  setObsidianTemplateSettings,
  edgeAutoHide,
}: RegisterSettingsIpcHandlersOptions): void {
  const normalizeStoreValue = (key: string, value: unknown) => {
    if (key === 'tasks') return filterValidTasks(value);
    return value;
  };

  const setStoreValueIfChanged = (key: string, value: unknown) => {
    const normalized = normalizeStoreValue(key, value);
    if (areStoreValuesEqual(store.get(key), normalized)) return false;
    store.set(key, normalized);
    return true;
  };

  const broadcastTaskChanges = (event: Electron.IpcMainInvokeEvent, tasks: unknown) => {
    const senderId = event.sender.id;
    BrowserWindow.getAllWindows().forEach((win) => {
      if (win.isDestroyed() || win.webContents.id === senderId) return;
      win.webContents.send('tasks:changed', tasks);
    });
  };

  ipcMain.handle('store:get', (_, key: unknown) => {
    if (!isRendererStoreKey(key)) return undefined;
    return store.get(key);
  });
  ipcMain.handle('store:getMany', (_, keys: unknown) => {
    return Object.fromEntries(
      filterRendererStoreKeys(keys).map((key) => [key, store.get(key)]),
    );
  });
  ipcMain.handle('store:set', (event, key: unknown, value: unknown) => {
    if (!isRendererStoreKey(key)) return;
    const didChange = setStoreValueIfChanged(key, value);
    // Broadcast task changes to other windows while excluding the sender to avoid echo loops.
    if (didChange && key === 'tasks') {
      broadcastTaskChanges(event, store.get(key));
    }
  });
  ipcMain.handle('store:setMany', (event, entries: unknown) => {
    if (!isObjectRecord(entries)) return;
    const allowedEntries = pickRendererStoreEntries(entries);
    let tasksChanged = false;
    for (const [key, value] of Object.entries(allowedEntries)) {
      if (setStoreValueIfChanged(key, value) && key === 'tasks') {
        tasksChanged = true;
      }
    }
    if (tasksChanged) {
      broadcastTaskChanges(event, store.get('tasks'));
    }
  });

  ipcMain.handle('settings:getApp', () => getAppSettings());
  ipcMain.handle('settings:setApp', (_event, settings: unknown) => {
    const next = setAppSettings(settings);
    edgeAutoHide?.reconcileSettings(next.edgeAutoHide);
    return { ok: true };
  });

  ipcMain.handle('settings:getObsidianTemplates', () => getObsidianTemplateSettings());
  ipcMain.handle('settings:setObsidianTemplates', (_event, settings: unknown) => {
    setObsidianTemplateSettings(settings);
    return { ok: true };
  });
  ipcMain.handle('settings:resetObsidianTemplates', () => {
    const settings = createDefaultObsidianTemplateSettings();
    store.set(OBSIDIAN_TEMPLATE_SETTINGS_KEY, settings);
    return settings;
  });
}
