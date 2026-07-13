import { BrowserWindow, Tray } from 'electron';
import type { RendererRoute } from '../shared/rendererRoute';
import type { WindowMode } from '../shared/windowMode';
import type { UserHiddenState } from './userHiddenState';
import type { TaskMenuPayload } from './taskContextMenuIpc';
import { createTaskMenuWindow } from './taskMenuWindow';
import { createMainTray, refreshMainTrayMenu } from './trayMenu';

export type CreateMainShellControllerOptions = {
  getMainWindow(): BrowserWindow | null;
  getTray(): Tray | null;
  setTray(nextTray: Tray | null): void;
  getTaskMenuWindow(): BrowserWindow | null;
  setTaskMenuWindow(nextWindow: BrowserWindow | null): void;
  setTaskMenuPayload(payload: TaskMenuPayload | null): void;
  userHidden: Pick<UserHiddenState, 'setHidden'>;
  getWindowMode(): WindowMode;
  markDesktopInteractive(): void;
  setWindowMode(win: BrowserWindow, mode: WindowMode): void;
  getTrayIcon(): ConstructorParameters<typeof Tray>[0];
  loadRenderer(win: BrowserWindow, route: RendererRoute): void;
  quitApp(): void;
  zh(text: string): string;
};

export type MainShellController = {
  showMainWindow(): void;
  hideMainWindow(): void;
  refreshTrayMenu(): void;
  createTray(): void;
  closeTaskMenuWindow(): void;
  openTaskMenuWindow(payload: TaskMenuPayload): void;
};

export function createMainShellController({
  getMainWindow,
  getTray,
  setTray,
  getTaskMenuWindow,
  setTaskMenuWindow,
  setTaskMenuPayload,
  userHidden,
  getWindowMode,
  markDesktopInteractive,
  setWindowMode,
  getTrayIcon,
  loadRenderer,
  quitApp,
  zh,
}: CreateMainShellControllerOptions): MainShellController {
  function showMainWindow() {
    const mainWindow = getMainWindow();
    if (!mainWindow || mainWindow.isDestroyed()) return;
    userHidden.setHidden(false);
    if (mainWindow.isMinimized()) mainWindow.restore();
    if (getWindowMode() === 'desktop') {
      markDesktopInteractive();
    }
    mainWindow.show();
    mainWindow.focus();
  }

  function hideMainWindow() {
    const mainWindow = getMainWindow();
    if (!mainWindow || mainWindow.isDestroyed()) return;
    userHidden.setHidden(true);
    mainWindow.hide();
  }

  function refreshTrayMenu() {
    const tray = getTray();
    if (!tray) return;
    refreshMainTrayMenu({
      tray,
      showMainWindow,
      hideMainWindow,
      getMainWindow,
      getWindowMode,
      setWindowMode,
      quitApp,
      zh,
    });
  }

  function createTray() {
    if (getTray()) return;
    const nextTray = createMainTray({
      icon: getTrayIcon(),
      onClick: showMainWindow,
    });
    setTray(nextTray);
    refreshTrayMenu();
  }

  function closeTaskMenuWindow() {
    const taskMenuWindow = getTaskMenuWindow();
    if (taskMenuWindow && !taskMenuWindow.isDestroyed()) {
      taskMenuWindow.close();
    }
    setTaskMenuWindow(null);
    setTaskMenuPayload(null);
  }

  function openTaskMenuWindow(payload: TaskMenuPayload) {
    closeTaskMenuWindow();
    const menu = createTaskMenuWindow(payload, {
      loadRenderer,
      onBlur: closeTaskMenuWindow,
      onClosed: () => {
        if (getTaskMenuWindow() === menu) {
          setTaskMenuWindow(null);
          setTaskMenuPayload(null);
        }
      },
    });
    setTaskMenuWindow(menu);
  }

  return {
    showMainWindow,
    hideMainWindow,
    refreshTrayMenu,
    createTray,
    closeTaskMenuWindow,
    openTaskMenuWindow,
  };
}
