import type { BrowserWindow, Tray } from 'electron';
import type { TaskMenuPayload } from './taskContextMenuIpc';

export type MainRuntimeState = {
  getMainWindow: () => BrowserWindow | null;
  setMainWindow: (win: BrowserWindow | null) => void;
  clearMainWindow: () => void;
  getTray: () => Tray | null;
  setTray: (tray: Tray | null) => void;
  getTaskMenuWindow: () => BrowserWindow | null;
  setTaskMenuWindow: (win: BrowserWindow | null) => void;
  getTaskMenuPayload: () => TaskMenuPayload | null;
  setTaskMenuPayload: (payload: TaskMenuPayload | null) => void;
};

export function createMainRuntimeState(): MainRuntimeState {
  let mainWindow: BrowserWindow | null = null;
  let tray: Tray | null = null;
  let taskMenuWindow: BrowserWindow | null = null;
  let taskMenuPayload: TaskMenuPayload | null = null;

  return {
    getMainWindow: () => mainWindow,
    setMainWindow: (win) => {
      mainWindow = win;
    },
    clearMainWindow: () => {
      mainWindow = null;
    },
    getTray: () => tray,
    setTray: (nextTray) => {
      tray = nextTray;
    },
    getTaskMenuWindow: () => taskMenuWindow,
    setTaskMenuWindow: (nextWindow) => {
      taskMenuWindow = nextWindow;
    },
    getTaskMenuPayload: () => taskMenuPayload,
    setTaskMenuPayload: (payload) => {
      taskMenuPayload = payload;
    },
  };
}
