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
    aiReview: {
      getSettings: () => Promise<import('../shared/aiReview/aiReviewSettings').AiReviewSettings>;
      setSettings: (settings: import('../shared/aiReview/aiReviewSettings').AiReviewSettings) => Promise<import('../shared/aiReview/aiReviewSettings').AiReviewSettings>;
      getSections: () => Promise<import('../shared/aiReview/sectionConfig').SectionConfig[]>;
      setSections: (sections: import('../shared/aiReview/sectionConfig').SectionConfig[]) => Promise<import('../shared/aiReview/sectionConfig').SectionConfig[]>;
      runForDate: (date: string, tasks: import('./types/task').Task[]) => Promise<{ ok: boolean; error?: string; filledMarkers: string[]; skippedMarkers: string[] }>;
      backfill: (tasks: import('./types/task').Task[]) => Promise<{ processed: string[]; filled: string[]; errors: Array<{ date: string; error: string }> }>;
      generateWeekly: (date: string, tasks: import('./types/task').Task[]) => Promise<{ ok: boolean; filePath?: string; error?: string }>;
      generateMonthly: (date: string, tasks: import('./types/task').Task[]) => Promise<{ ok: boolean; filePath?: string; error?: string }>;
      generateExternal: (kind: 'weekly' | 'monthly', date: string) => Promise<{ ok: boolean; filePath?: string; error?: string }>;
      onTick: (callback: () => void) => () => void;
    };
  };
}
