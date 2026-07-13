import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  close: () => ipcRenderer.invoke('window:close'),
  getAlwaysOnTop: () => ipcRenderer.invoke('window:getAlwaysOnTop'),
  toggleAlwaysOnTop: () => ipcRenderer.invoke('window:toggleAlwaysOnTop'),
  getWindowMode: () => ipcRenderer.invoke('window:getWindowMode'),
  setWindowMode: (mode: unknown) => ipcRenderer.invoke('window:setWindowMode', mode),
  onWindowModeChanged: (callback: (mode: unknown) => void) => {
    const listener = (_event: unknown, mode: unknown) => callback(mode);
    ipcRenderer.on('window:modeChanged', listener);
    return () => ipcRenderer.removeListener('window:modeChanged', listener);
  },
  resetPosition: () => ipcRenderer.invoke('window:resetPosition'),
  setSettingsMode: (open: unknown) => ipcRenderer.invoke('window:setSettingsMode', open),
  getLockWindowPosition: () => ipcRenderer.invoke('window:getLockWindowPosition'),
  setLockWindowPosition: (locked: unknown) => ipcRenderer.invoke('window:setLockWindowPosition', locked),
  getStore: (key: unknown) => ipcRenderer.invoke('store:get', key),
  setStore: (key: unknown, value: unknown) => ipcRenderer.invoke('store:set', key, value),
  getStoreMany: (keys: unknown) => ipcRenderer.invoke('store:getMany', keys),
  setStoreMany: (entries: unknown) => ipcRenderer.invoke('store:setMany', entries),
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
  syncTasksToObsidian: (tasks: unknown, selectedDate?: unknown, dailyWork?: unknown, dailyInspiration?: unknown, beforeTasks?: unknown) => ipcRenderer.invoke('obsidian:syncTasks', tasks, selectedDate, dailyWork, dailyInspiration, beforeTasks),
  previewTasksToObsidian: (tasks: unknown, selectedDate?: unknown, dailyWork?: unknown, dailyInspiration?: unknown, beforeTasks?: unknown) => ipcRenderer.invoke('obsidian:previewTasks', tasks, selectedDate, dailyWork, dailyInspiration, beforeTasks),
  openDailyNote: (date?: unknown) => ipcRenderer.invoke('obsidian:openDailyNote', date),
  getCompanionSettings: () => ipcRenderer.invoke('companion:getSettings'),
  setCompanionSettings: (settings: unknown) => ipcRenderer.invoke('companion:setSettings', settings),
  previewCompanionSync: (settings: unknown, items: unknown) => ipcRenderer.invoke('companion:previewSync', settings, items),
  writeCompanionSync: (settings: unknown, items: unknown) => ipcRenderer.invoke('companion:writeSync', settings, items),
  importMobileInbox: (inboxPath: unknown) => ipcRenderer.invoke('companion:importMobileInbox', inboxPath),
  openTaskContextMenu: (payload: unknown) => ipcRenderer.invoke('taskContextMenu:open', payload),
  getTaskContextMenuPayload: () => ipcRenderer.invoke('taskContextMenu:getPayload'),
  closeTaskContextMenu: () => ipcRenderer.invoke('taskContextMenu:close'),
  resizeTaskContextMenu: (height: unknown) => ipcRenderer.invoke('taskContextMenu:resize', height),
  dispatchTaskMenuAction: (payload: unknown) => ipcRenderer.invoke('taskContextMenu:action', payload),
  onTaskMenuAction: (callback: (payload: unknown) => void) => {
    const listener = (_event: unknown, payload: unknown) => callback(payload);
    ipcRenderer.on('taskContextMenu:action', listener);
    return () => ipcRenderer.removeListener('taskContextMenu:action', listener);
  },
  setWindowCompactMode: (compactMode: unknown) => ipcRenderer.invoke('window:setCompactMode', compactMode),
  getWindowCompactMode: () => ipcRenderer.invoke('window:getCompactMode'),
  getAutoStart: () => ipcRenderer.invoke('window:getAutoStart'),
  setAutoStart: (enabled: unknown) => ipcRenderer.invoke('window:setAutoStart', enabled),
  obsidianTemplate: {
    recognize: (rawTemplate: unknown) => ipcRenderer.invoke('obsidianTemplate:recognize', rawTemplate),
    pickTemplateFile: () => ipcRenderer.invoke('obsidianTemplate:pickTemplateFile'),
  },
  aiReview: {
    getSettings: () => ipcRenderer.invoke('aiReview:getSettings'),
    setSettings: (v: unknown) => ipcRenderer.invoke('aiReview:setSettings', v),
    getSections: () => ipcRenderer.invoke('aiReview:getSections'),
    setSections: (v: unknown) => ipcRenderer.invoke('aiReview:setSections', v),
    runForDate: (date: unknown, tasks: unknown, force?: unknown) => ipcRenderer.invoke('aiReview:runForDate', date, tasks, force),
    inspectDaily: (date: unknown) => ipcRenderer.invoke('aiReview:inspectDaily', date),
    backfill: (tasks: unknown) => ipcRenderer.invoke('aiReview:backfill', tasks),
    generateWeekly: (date: unknown, tasks: unknown) => ipcRenderer.invoke('aiReview:generateWeekly', date, tasks),
    generateMonthly: (date: unknown, tasks: unknown) => ipcRenderer.invoke('aiReview:generateMonthly', date, tasks),
    generateExternal: (kind: unknown, date: unknown) => ipcRenderer.invoke('aiReview:generateExternal', kind, date),
    recognizeTemplate: (rawTemplate: unknown) => ipcRenderer.invoke('aiReview:recognizeTemplate', rawTemplate),
    recognizeReportTemplate: (target: unknown, rawTemplate: unknown) => ipcRenderer.invoke('aiReview:recognizeReportTemplate', target, rawTemplate),
    testSourceMaterials: (kind: unknown, date: unknown) => ipcRenderer.invoke('aiReview:testSourceMaterials', kind, date),
    pickTemplateFile: () => ipcRenderer.invoke('aiReview:pickTemplateFile'),
    listModels: (cfg: unknown) => ipcRenderer.invoke('aiReview:listModels', cfg),
    onProgress: (callback: (payload: unknown) => void) => {
      const listener = (_event: unknown, payload: unknown) => callback(payload);
      ipcRenderer.on('aiReview:progress', listener);
      return () => ipcRenderer.removeListener('aiReview:progress', listener);
    },
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
    onExternalWeeklyTick: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on('aiReview:externalWeeklyTick', listener);
      return () => ipcRenderer.removeListener('aiReview:externalWeeklyTick', listener);
    },
    onExternalMonthlyTick: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on('aiReview:externalMonthlyTick', listener);
      return () => ipcRenderer.removeListener('aiReview:externalMonthlyTick', listener);
    },
  },
});
