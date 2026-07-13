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
  menu.once('ready-to-show', () => menu.show());
  menu.on('blur', () => onBlur());
  menu.on('closed', () => onClosed());

  return menu;
}
