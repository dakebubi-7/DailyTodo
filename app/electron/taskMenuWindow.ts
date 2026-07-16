import { BrowserWindow, screen } from 'electron';
import path from 'path';
import type { RendererRoute } from '../shared/rendererRoute';
import type { TaskMenuPayload } from './taskContextMenuIpc';
import { hardenRendererNavigation } from './windowNavigationSecurity';

export const TASK_MENU_WIDTH = 320;
export const TASK_MENU_HEIGHT = 360;

type CreateTaskMenuWindowOptions = {
  loadRenderer(win: BrowserWindow, route: RendererRoute): void;
  onBlur(): void;
  onClosed(): void;
  parent?: BrowserWindow | null;
};

export function createTaskMenuWindow(
  payload: TaskMenuPayload,
  { loadRenderer, onBlur, onClosed }: CreateTaskMenuWindowOptions,
): BrowserWindow {
  const margin = 8;
  const primaryWorkArea = screen.getPrimaryDisplay().workArea;
  const screenX = typeof payload.screenX === 'number' && Number.isFinite(payload.screenX)
    ? payload.screenX
    : primaryWorkArea.x + primaryWorkArea.width / 2;
  const screenY = typeof payload.screenY === 'number' && Number.isFinite(payload.screenY)
    ? payload.screenY
    : primaryWorkArea.y + primaryWorkArea.height / 2;
  const { workArea } = screen.getDisplayNearestPoint({ x: screenX, y: screenY });
  const x = Math.round(
    Math.max(workArea.x + margin, Math.min(screenX, workArea.x + workArea.width - TASK_MENU_WIDTH - margin)),
  );
  const y = Math.round(
    Math.max(workArea.y + margin, Math.min(screenY, workArea.y + workArea.height - TASK_MENU_HEIGHT - margin)),
  );

  const menu = new BrowserWindow({
    width: TASK_MENU_WIDTH,
    height: TASK_MENU_HEIGHT,
    x,
    y,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: true,
    show: false,
    roundedCorners: true,
    webPreferences: {
      preload: path.join(__dirname, 'preloadTaskMenu.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      backgroundThrottling: false,
    },
  });

  hardenRendererNavigation(menu);
  menu.setAlwaysOnTop(true, 'screen-saver');
  loadRenderer(menu, {
    view: 'task-menu',
  });

  // Transparent frameless popups on Windows often blur/refocus during the first
  // show handoff. Delay and debounce blur-to-close so the menu can paint first.
  let blurCloseArmed = false;
  let shown = false;
  let armTimer: ReturnType<typeof setTimeout> | null = null;
  let blurTimer: ReturnType<typeof setTimeout> | null = null;

  const clearTimers = () => {
    if (armTimer) {
      clearTimeout(armTimer);
      armTimer = null;
    }
    if (blurTimer) {
      clearTimeout(blurTimer);
      blurTimer = null;
    }
  };

  const dismiss = () => {
    if (menu.isDestroyed()) return;
    onBlur();
  };

  const showMenu = () => {
    if (shown || menu.isDestroyed()) return;
    shown = true;
    menu.show();
    menu.focus();
    armTimer = setTimeout(() => {
      armTimer = null;
      if (!menu.isDestroyed()) blurCloseArmed = true;
    }, 320);
  };

  menu.once('ready-to-show', showMenu);
  menu.webContents.once('did-finish-load', showMenu);
  menu.on('focus', () => {
    if (blurTimer) {
      clearTimeout(blurTimer);
      blurTimer = null;
    }
  });
  menu.on('blur', () => {
    if (!blurCloseArmed || menu.isDestroyed()) return;
    if (blurTimer) clearTimeout(blurTimer);
    blurTimer = setTimeout(() => {
      blurTimer = null;
      if (menu.isDestroyed() || menu.isFocused()) return;
      dismiss();
    }, 160);
  });
  menu.on('closed', () => {
    clearTimers();
    onClosed();
  });

  return menu;
}
