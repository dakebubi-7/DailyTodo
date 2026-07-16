import { BrowserWindow, Tray, screen } from 'electron';
import type { RendererRoute } from '../shared/rendererRoute';
import type { WindowMode } from '../shared/windowMode';
import type { UserHiddenState } from './userHiddenState';
import type { TaskMenuPayload } from './taskContextMenuIpc';
import { createTaskMenuWindow } from './taskMenuWindow';
import { createMainTray, refreshMainTrayMenu } from './trayMenu';
import { ensureWindowBoundsVisible } from './windowState';

export type CreateMainShellControllerOptions = {
  getMainWindow(): BrowserWindow | null;
  getTray(): Tray | null;
  setTray(nextTray: Tray | null): void;
  getTaskMenuWindow(): BrowserWindow | null;
  setTaskMenuWindow(nextWindow: BrowserWindow | null): void;
  getTaskMenuPayload(): TaskMenuPayload | null;
  setTaskMenuPayload(payload: TaskMenuPayload | null): void;
  userHidden: Pick<UserHiddenState, 'setHidden'>;
  getWindowMode(): WindowMode;
  markDesktopInteractive(): void;
  setWindowMode(win: BrowserWindow, mode: WindowMode): void;
  getTrayIcon(): ConstructorParameters<typeof Tray>[0];
  loadRenderer(win: BrowserWindow, route: RendererRoute): void;
  quitApp(): void;
  zh(text: string): string;
  edgeAutoHide?: Pick<import('./edgeAutoHideController').EdgeAutoHideController, 'noteForcedExpandAndClear'>;
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
  getTaskMenuPayload,
  setTaskMenuPayload,
  userHidden,
  getWindowMode,
  markDesktopInteractive,
  setWindowMode,
  getTrayIcon,
  loadRenderer,
  quitApp,
  zh,
  edgeAutoHide,
}: CreateMainShellControllerOptions): MainShellController {
  function showMainWindow() {
    const mainWindow = getMainWindow();
    if (!mainWindow || mainWindow.isDestroyed()) return;
    userHidden.setHidden(false);
    edgeAutoHide?.noteForcedExpandAndClear();
    if (mainWindow.isMinimized()) mainWindow.restore();
    const bounds = mainWindow.getBounds();
    const workArea = screen.getDisplayMatching(bounds).workArea;
    const visible = ensureWindowBoundsVisible(bounds, workArea);
    if (visible.x !== bounds.x || visible.y !== bounds.y || visible.width !== bounds.width || visible.height !== bounds.height) {
      mainWindow.setBounds(visible);
    }
    if (getWindowMode() === 'desktop') {
      markDesktopInteractive();
    }
    mainWindow.show();
    mainWindow.focus();
  }

  function hideMainWindow() {
    const mainWindow = getMainWindow();
    if (!mainWindow || mainWindow.isDestroyed()) return;
    edgeAutoHide?.noteForcedExpandAndClear();
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

  function closeTaskMenuWindow(options: { clearPayload?: boolean } = {}) {
    const clearPayload = options.clearPayload !== false;
    const taskMenuWindow = getTaskMenuWindow();
    if (taskMenuWindow && !taskMenuWindow.isDestroyed()) {
      taskMenuWindow.close();
    }
    setTaskMenuWindow(null);
    if (clearPayload) {
      setTaskMenuPayload(null);
    }
  }

  function openTaskMenuWindow(payload: TaskMenuPayload) {
    // Closing a previous popup must not wipe the payload for the menu we are
    // about to open; the popup renderer reads it asynchronously via IPC.
    closeTaskMenuWindow({ clearPayload: false });
    setTaskMenuPayload(payload);
    const mainWindow = getMainWindow();
    const menu = createTaskMenuWindow(payload, {
      loadRenderer,
      parent: mainWindow && !mainWindow.isDestroyed() ? mainWindow : null,
      onBlur: () => closeTaskMenuWindow(),
      onClosed: () => {
        if (getTaskMenuWindow() === menu) {
          setTaskMenuWindow(null);
          // Only clear payload if this closed window is still the active menu owner.
          // A newer open may have already replaced the payload.
          if (getTaskMenuPayload() === payload) {
            setTaskMenuPayload(null);
          }
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
