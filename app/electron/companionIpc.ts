import { ipcMain } from 'electron';
import path from 'path';
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
    // Always plan against main-process companion settings so the renderer cannot
    // redirect writes to an alternate vaultPath or rule set.
    void settings;
    return buildSyncPlan(getCompanionSettings(), items === undefined ? [] : items);
  });
  ipcMain.handle('companion:writeSync', (_event, settings: unknown, items: unknown) => {
    void settings;
    const configured = getCompanionSettings();
    const plan = buildSyncPlan(configured, items === undefined ? [] : items);
    return writeSyncPlan(plan, configured.vaultPath);
  });
  ipcMain.handle('companion:importMobileInbox', (_event, inboxPath: unknown) => {
    const configuredPath = getCompanionSettings().mobileInboxPath.trim();
    if (!configuredPath) {
      return { ok: false, items: [], errors: ['Mobile inbox path is not configured.'] };
    }

    const resolvedConfiguredPath = path.resolve(configuredPath);
    if (typeof inboxPath === 'string' && inboxPath.trim()) {
      const resolvedRequestedPath = path.resolve(inboxPath);
      if (resolvedRequestedPath !== resolvedConfiguredPath) {
        return {
          ok: false,
          items: [],
          errors: ['Mobile inbox path must match the configured companion inbox path.'],
        };
      }
    } else if (inboxPath !== undefined && inboxPath !== null && inboxPath !== '') {
      return { ok: false, items: [], errors: ['Mobile inbox path must be a string.'] };
    }

    return importMobileInbox(resolvedConfiguredPath);
  });
}
