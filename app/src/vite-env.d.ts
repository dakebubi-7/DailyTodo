/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    minimize: () => Promise<void>;
    close: () => Promise<void>;
    getAlwaysOnTop: () => Promise<boolean>;
    toggleAlwaysOnTop: () => Promise<boolean>;
    getWindowMode: () => Promise<import('../shared/windowMode').WindowMode>;
    setWindowMode: (mode: import('../shared/windowMode').WindowMode) => Promise<import('../shared/windowMode').WindowMode>;
    onWindowModeChanged: (callback: (mode: import('../shared/windowMode').WindowMode) => void) => () => void;
    resetPosition: () => Promise<void>;
    getLockWindowPosition: () => Promise<boolean>;
    setLockWindowPosition: (locked: boolean) => Promise<boolean>;
    getStore: (key: string) => Promise<unknown>;
    setStore: (key: string, value: unknown) => Promise<void>;
    getAppSettings: () => Promise<import('../shared/appSettings').AppBehaviorSettings>;
    setAppSettings: (settings: import('../shared/appSettings').AppBehaviorSettings) => Promise<{ ok: boolean }>;
    getObsidianTemplateSettings: () => Promise<import('../shared/appSettings').ObsidianTemplateSettings>;
    setObsidianTemplateSettings: (settings: import('../shared/appSettings').ObsidianTemplateSettings) => Promise<{ ok: boolean }>;
    resetObsidianTemplateSettings: () => Promise<import('../shared/appSettings').ObsidianTemplateSettings>;
    getObsidianPath: () => Promise<string>;
    chooseObsidianPath: () => Promise<string>;
    syncTasksToObsidian: (tasks: import('./types/task').Task[], selectedDate?: string, dailyWork?: string, dailyInspiration?: string) => Promise<{ ok: boolean; filePath?: string; reason?: string }>;
    previewTasksToObsidian: (
      tasks: import('./types/task').Task[],
      selectedDate?: string,
      dailyWork?: string,
      dailyInspiration?: string,
      beforeTasks?: import('./types/task').Task[]
    ) => Promise<import('../shared/obsidianTemplates').SyncPreview>;
    openDailyNote: (date?: string) => Promise<{ ok: boolean; filePath?: string; reason?: string }>;
    getCompanionSettings: () => Promise<import('../shared/obsidianCompanion').CompanionSettings>;
    setCompanionSettings: (settings: import('../shared/obsidianCompanion').CompanionSettings) => Promise<{ ok: boolean }>;
    previewCompanionSync: (
      settings: import('../shared/obsidianCompanion').CompanionSettings,
      items: import('../shared/obsidianCompanion').CaptureItem[]
    ) => Promise<import('../shared/obsidianCompanion').SyncPlan>;
    writeCompanionSync: (
      settings: import('../shared/obsidianCompanion').CompanionSettings,
      items: import('../shared/obsidianCompanion').CaptureItem[]
    ) => Promise<{ ok: boolean; errors: string[] }>;
    importMobileInbox: (inboxPath: string) => Promise<{ ok: boolean; items: import('../shared/obsidianCompanion').CaptureItem[]; errors: string[] }>;
    setWindowCompactMode: (compactMode: boolean) => Promise<void>;
    getWindowCompactMode: () => Promise<boolean>;
    getAutoStart: () => Promise<boolean>;
    setAutoStart: (enabled: boolean) => Promise<boolean>;
  };
}
