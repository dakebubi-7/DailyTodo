/// <reference types="vite/client" />

type AiReviewDailyInspectionResult = {
  exists: boolean;
  hasAiContent: boolean;
  filePath: string;
  error?: string;
};

interface Window {
  electronAPI: {
    minimize: () => Promise<void>;
    close: () => Promise<void>;
    getAlwaysOnTop: () => Promise<unknown>;
    toggleAlwaysOnTop: () => Promise<unknown>;
    getWindowMode: () => Promise<unknown>;
    setWindowMode: (mode: unknown) => Promise<unknown>;
    onWindowModeChanged: (callback: (mode: unknown) => void) => () => void;
    resetPosition: () => Promise<void>;
    setSettingsMode: (open: unknown) => Promise<unknown>;
    getLockWindowPosition: () => Promise<unknown>;
    setLockWindowPosition: (locked: unknown) => Promise<unknown>;
    getStore: (key: unknown) => Promise<unknown>;
    setStore: (key: unknown, value: unknown) => Promise<void>;
    getStoreMany: (keys: unknown) => Promise<unknown>;
    setStoreMany: (entries: unknown) => Promise<void>;
    onTasksChanged: (callback: (tasks: unknown) => void) => () => void;
    getAppSettings: () => Promise<unknown>;
    setAppSettings: (settings: unknown) => Promise<unknown>;
    getObsidianTemplateSettings: () => Promise<unknown>;
    setObsidianTemplateSettings: (settings: unknown) => Promise<unknown>;
    resetObsidianTemplateSettings: () => Promise<unknown>;
    getObsidianPath: () => Promise<unknown>;
    chooseObsidianPath: () => Promise<unknown>;
    syncTasksToObsidian: (
      tasks: unknown,
      selectedDate?: unknown,
      dailyWork?: unknown,
      dailyInspiration?: unknown,
      beforeTasks?: unknown
    ) => Promise<unknown>;
    previewTasksToObsidian: (
      tasks: unknown,
      selectedDate?: unknown,
      dailyWork?: unknown,
      dailyInspiration?: unknown,
      beforeTasks?: unknown
    ) => Promise<unknown>;
    openDailyNote: (date?: unknown) => Promise<unknown>;
    getCompanionSettings: () => Promise<unknown>;
    setCompanionSettings: (settings: unknown) => Promise<unknown>;
    previewCompanionSync: (
      settings: unknown,
      items: unknown
    ) => Promise<unknown>;
    writeCompanionSync: (
      settings: unknown,
      items: unknown
    ) => Promise<unknown>;
    importMobileInbox: (inboxPath: unknown) => Promise<unknown>;
    openTaskContextMenu: (payload: unknown) => Promise<void>;
    closeTaskContextMenu: () => Promise<void>;
    resizeTaskContextMenu: (height: unknown) => Promise<void>;
    dispatchTaskMenuAction: (payload: unknown) => Promise<void>;
    onTaskMenuAction: (callback: (payload: unknown) => void) => () => void;
    setWindowCompactMode: (compactMode: unknown) => Promise<void>;
    getWindowCompactMode: () => Promise<unknown>;
    getAutoStart: () => Promise<unknown>;
    setAutoStart: (enabled: unknown) => Promise<unknown>;
    obsidianTemplate: {
      recognize: (rawTemplate: unknown) => Promise<unknown>;
      pickTemplateFile: () => Promise<unknown>;
    };
    aiReview: {
      getSettings: () => Promise<unknown>;
      setSettings: (settings: unknown) => Promise<unknown>;
      getSections: () => Promise<unknown>;
      setSections: (sections: unknown) => Promise<unknown>;
      runForDate: (date: unknown, tasks: unknown, force?: unknown) => Promise<unknown>;
      inspectDaily: (date: unknown) => Promise<AiReviewDailyInspectionResult>;
      backfill: (tasks: unknown) => Promise<unknown>;
      generateWeekly: (date: unknown, tasks: unknown) => Promise<unknown>;
      generateMonthly: (date: unknown, tasks: unknown) => Promise<unknown>;
      generateExternal: (kind: unknown, date: unknown) => Promise<unknown>;
      recognizeTemplate: (rawTemplate: unknown) => Promise<unknown>;
      recognizeReportTemplate: (
        target: unknown,
        rawTemplate: unknown
      ) => Promise<unknown>;
      testSourceMaterials: (
        kind: unknown,
        date: unknown
      ) => Promise<unknown>;
      pickTemplateFile: () => Promise<unknown>;
      listModels: (cfg: unknown) => Promise<unknown>;
      onProgress: (callback: (payload: unknown) => void) => () => void;
      onTick: (callback: () => void) => () => void;
      onWeeklyTick: (callback: () => void) => () => void;
      onMonthlyTick: (callback: () => void) => () => void;
    };
  };
}
