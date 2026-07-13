import { contextBridge, ipcRenderer } from 'electron';

/** Minimal preload surface for the task-menu popup window. */
contextBridge.exposeInMainWorld('electronAPI', {
  getTaskContextMenuPayload: () => ipcRenderer.invoke('taskContextMenu:getPayload'),
  closeTaskContextMenu: () => ipcRenderer.invoke('taskContextMenu:close'),
  resizeTaskContextMenu: (height: unknown) => ipcRenderer.invoke('taskContextMenu:resize', height),
  dispatchTaskMenuAction: (payload: unknown) => ipcRenderer.invoke('taskContextMenu:action', payload),
});
