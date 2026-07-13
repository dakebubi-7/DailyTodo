import type { BrowserWindow, Tray } from 'electron';

export type MainRuntimeState = {
  getMainWindow: () => BrowserWindow | null;
  setMainWindow: (win: BrowserWindow | null) => void;
  clearMainWindow: () => void;
  getTray: () => Tray | null;
  setTray: (tray: Tray | null) => void;
  getTaskMenuWindow: () => BrowserWindow | null;
  setTaskMenuWindow: (win: BrowserWindow | null) => void;
};

export function createMainRuntimeState(): MainRuntimeState {
  let mainWindow: BrowserWindow | null = null;
  let tray: Tray | null = null;
  let taskMenuWindow: BrowserWindow | null = null;

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
  };
}
