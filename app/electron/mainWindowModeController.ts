import { BrowserWindow, Tray } from 'electron';
import type { WindowMode } from '../shared/windowMode';
import type { ElectronStoreLike } from './sharedTypes';

export type CreateMainWindowModeControllerOptions = {
  store: ElectronStoreLike;
  windowModeKey: string;
  getWindowMode(): WindowMode;
  applyWindowMode(win: BrowserWindow, mode: WindowMode): void;
  reapplyWindowZOrder(win: BrowserWindow): void;
  reapplyGlass(): void;
  getTray(): Tray | null;
  refreshTrayMenu(): void;
};

export function createMainWindowModeController({
  store,
  windowModeKey,
  getWindowMode,
  applyWindowMode,
  reapplyWindowZOrder,
  reapplyGlass,
  getTray,
  refreshTrayMenu,
}: CreateMainWindowModeControllerOptions) {
  function setWindowMode(win: BrowserWindow, mode: WindowMode) {
    if (mode === getWindowMode()) return;
    store.set(windowModeKey, mode);
    applyWindowMode(win, mode);
    setTimeout(() => {
      reapplyWindowZOrder(win);
      reapplyGlass();
    }, 80);
    if (!win.isDestroyed()) {
      win.webContents.send('window:modeChanged', mode);
    }
    if (getTray()) refreshTrayMenu();
  }

  return {
    setWindowMode,
  };
}
