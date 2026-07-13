import { ipcMain } from 'electron';
import { buildSyncPlan, importMobileInbox, writeSyncPlan } from './obsidianCompanion';
import type { CompanionSettings } from '../shared/obsidianCompanion';

type RegisterCompanionIpcHandlersOptions = {
  getCompanionSettings(): CompanionSettings;
  setCompanionSettings(settings: unknown): void;
};

export function registerCompanionIpcHandlers({
  getCompanionSettings,
  setCompanionSettings,
}: RegisterCompanionIpcHandlersOptions): void {
  ipcMain.handle('companion:getSettings', () => getCompanionSettings());
  ipcMain.handle('companion:setSettings', (_event, settings: unknown) => {
    setCompanionSettings(settings);
    return { ok: true };
  });
  ipcMain.handle('companion:previewSync', (_event, settings: unknown, items: unknown) => {
    return buildSyncPlan(settings, items === undefined ? [] : items);
  });
  ipcMain.handle('companion:writeSync', (_event, settings: unknown, items: unknown) => {
    const plan = buildSyncPlan(settings, items === undefined ? [] : items);
    return writeSyncPlan(plan);
  });
  ipcMain.handle('companion:importMobileInbox', (_event, inboxPath: unknown) => {
    return importMobileInbox(inboxPath);
  });
}
