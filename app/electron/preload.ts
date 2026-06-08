import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  close: () => ipcRenderer.invoke('window:close'),
  getAlwaysOnTop: () => ipcRenderer.invoke('window:getAlwaysOnTop'),
  toggleAlwaysOnTop: () => ipcRenderer.invoke('window:toggleAlwaysOnTop'),
  getWindowMode: () => ipcRenderer.invoke('window:getWindowMode'),
  setWindowMode: (mode: string) => ipcRenderer.invoke('window:setWindowMode', mode),
  onWindowModeChanged: (callback: (mode: string) => void) => {
    const listener = (_event: unknown, mode: string) => callback(mode);
    ipcRenderer.on('window:modeChanged', listener);
    return () => ipcRenderer.removeListener('window:modeChanged', listener);
  },
  resetPosition: () => ipcRenderer.invoke('window:resetPosition'),
  getLockWindowPosition: () => ipcRenderer.invoke('window:getLockWindowPosition'),
  setLockWindowPosition: (locked: boolean) => ipcRenderer.invoke('window:setLockWindowPosition', locked),
  getStore: (key: string) => ipcRenderer.invoke('store:get', key),
  setStore: (key: string, value: unknown) => ipcRenderer.invoke('store:set', key, value),
  onTasksChanged: (callback: (tasks: unknown) => void) => {
    const listener = (_event: unknown, tasks: unknown) => callback(tasks);
    ipcRenderer.on('tasks:changed', listener);
    return () => ipcRenderer.removeListener('tasks:changed', listener);
  },
  getAppSettings: () => ipcRenderer.invoke('settings:getApp'),
  setAppSettings: (settings: unknown) => ipcRenderer.invoke('settings:setApp', settings),
  getObsidianTemplateSettings: () => ipcRenderer.invoke('settings:getObsidianTemplates'),
  setObsidianTemplateSettings: (settings: unknown) => ipcRenderer.invoke('settings:setObsidianTemplates', settings),
  resetObsidianTemplateSettings: () => ipcRenderer.invoke('settings:resetObsidianTemplates'),
  getObsidianPath: () => ipcRenderer.invoke('obsidian:getPath'),
  chooseObsidianPath: () => ipcRenderer.invoke('obsidian:choosePath'),
  syncTasksToObsidian: (tasks: unknown[], selectedDate?: string, dailyWork?: string, dailyInspiration?: string) => ipcRenderer.invoke('obsidian:syncTasks', tasks, selectedDate, dailyWork, dailyInspiration),
  previewTasksToObsidian: (tasks: unknown[], selectedDate?: string, dailyWork?: string, dailyInspiration?: string, beforeTasks?: unknown[]) => ipcRenderer.invoke('obsidian:previewTasks', tasks, selectedDate, dailyWork, dailyInspiration, beforeTasks),
  openDailyNote: (date?: string) => ipcRenderer.invoke('obsidian:openDailyNote', date),
  getCompanionSettings: () => ipcRenderer.invoke('companion:getSettings'),
  setCompanionSettings: (settings: unknown) => ipcRenderer.invoke('companion:setSettings', settings),
  previewCompanionSync: (settings: unknown, items: unknown[]) => ipcRenderer.invoke('companion:previewSync', settings, items),
  writeCompanionSync: (settings: unknown, items: unknown[]) => ipcRenderer.invoke('companion:writeSync', settings, items),
  importMobileInbox: (inboxPath: string) => ipcRenderer.invoke('companion:importMobileInbox', inboxPath),
  setWindowCompactMode: (compactMode: boolean) => ipcRenderer.invoke('window:setCompactMode', compactMode),
  getWindowCompactMode: () => ipcRenderer.invoke('window:getCompactMode'),
  getAutoStart: () => ipcRenderer.invoke('window:getAutoStart'),
  setAutoStart: (enabled: boolean) => ipcRenderer.invoke('window:setAutoStart', enabled),
  aiReview: {
    getSettings: () => ipcRenderer.invoke('aiReview:getSettings'),
    setSettings: (v: unknown) => ipcRenderer.invoke('aiReview:setSettings', v),
    getSections: () => ipcRenderer.invoke('aiReview:getSections'),
    setSections: (v: unknown) => ipcRenderer.invoke('aiReview:setSections', v),
    runForDate: (date: string, tasks: unknown) => ipcRenderer.invoke('aiReview:runForDate', date, tasks),
    backfill: (tasks: unknown) => ipcRenderer.invoke('aiReview:backfill', tasks),
    generateWeekly: (date: string, tasks: unknown) => ipcRenderer.invoke('aiReview:generateWeekly', date, tasks),
    generateMonthly: (date: string, tasks: unknown) => ipcRenderer.invoke('aiReview:generateMonthly', date, tasks),
    generateExternal: (kind: 'weekly' | 'monthly', date: string) => ipcRenderer.invoke('aiReview:generateExternal', kind, date),
    recognizeTemplate: (rawTemplate: string) => ipcRenderer.invoke('aiReview:recognizeTemplate', rawTemplate),
    recognizeReportTemplate: (kind: 'weekly' | 'monthly', rawTemplate: string) => ipcRenderer.invoke('aiReview:recognizeReportTemplate', kind, rawTemplate),
    pickTemplateFile: () => ipcRenderer.invoke('aiReview:pickTemplateFile'),
    listModels: (cfg: { baseUrl?: string; apiKey?: string; provider?: string }) => ipcRenderer.invoke('aiReview:listModels', cfg),
    onTick: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on('aiReview:tick', listener);
      return () => ipcRenderer.removeListener('aiReview:tick', listener);
    },
    onWeeklyTick: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on('aiReview:weeklyTick', listener);
      return () => ipcRenderer.removeListener('aiReview:weeklyTick', listener);
    },
    onMonthlyTick: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on('aiReview:monthlyTick', listener);
      return () => ipcRenderer.removeListener('aiReview:monthlyTick', listener);
    },
  },
});
