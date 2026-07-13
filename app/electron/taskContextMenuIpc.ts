import { BrowserWindow, ipcMain, screen } from 'electron';
import { isObjectRecord } from './unknownValueGuards';

export type TaskMenuPayload = {
  task: unknown;
  allTags: string[];
  isDark?: boolean;
  theme?: {
    themeId?: string;
    accent?: string;
    secondary?: string;
    menuOpacity?: number;
    blurStrength?: number;
    cardRadius?: number;
  };
  screenX: number;
  screenY: number;
};

export type TaskMenuActionPayload = {
  taskId: string;
  updates: Record<string, unknown>;
};

type RegisterTaskContextMenuIpcHandlersOptions = {
  defaultTaskMenuHeight: number;
  openTaskMenuWindow(payload: TaskMenuPayload): void;
  closeTaskMenuWindow(): void;
  getTaskMenuWindow(): BrowserWindow | null;
  getMainWindow(): BrowserWindow | null;
};

function isTaskMenuPayload(value: unknown): value is TaskMenuPayload {
  if (!isObjectRecord(value)) return false;
  const record = value;
  return (
    'task' in record &&
    Array.isArray(record.allTags) &&
    record.allTags.every((tag) => typeof tag === 'string') &&
    typeof record.screenX === 'number' &&
    Number.isFinite(record.screenX) &&
    typeof record.screenY === 'number' &&
    Number.isFinite(record.screenY)
  );
}

function isTaskMenuActionPayload(value: unknown): value is TaskMenuActionPayload {
  if (!isObjectRecord(value)) return false;
  const record = value;
  const updates = record.updates;
  return Boolean(
    typeof record.taskId === 'string' && record.taskId.trim() &&
    isObjectRecord(updates)
  );
}

export function registerTaskContextMenuIpcHandlers({
  defaultTaskMenuHeight,
  openTaskMenuWindow,
  closeTaskMenuWindow,
  getTaskMenuWindow,
  getMainWindow,
}: RegisterTaskContextMenuIpcHandlersOptions): void {
  ipcMain.handle('taskContextMenu:open', (_event, payload: unknown) => {
    if (!isTaskMenuPayload(payload)) return;
    openTaskMenuWindow(payload);
  });

  ipcMain.handle('taskContextMenu:close', () => {
    closeTaskMenuWindow();
  });

  ipcMain.handle('taskContextMenu:resize', (_event, height: unknown) => {
    const taskMenuWindow = getTaskMenuWindow();
    if (!taskMenuWindow || taskMenuWindow.isDestroyed()) return;

    const rawHeight = typeof height === 'number' && Number.isFinite(height) ? height : defaultTaskMenuHeight;
    const h = Math.round(Math.max(80, Math.min(600, rawHeight)));
    const currentBounds = taskMenuWindow.getBounds();
    if (currentBounds.height === h) return;
    const { workArea } = screen.getPrimaryDisplay();
    const bounds = currentBounds;
    const margin = 8;
    const y = Math.max(workArea.y + margin, Math.min(bounds.y, workArea.y + workArea.height - h - margin));
    taskMenuWindow.setBounds({ x: bounds.x, y, width: bounds.width, height: h });
  });

  ipcMain.handle('taskContextMenu:action', (_event, payload: unknown) => {
    if (!isTaskMenuActionPayload(payload)) {
      closeTaskMenuWindow();
      return;
    }

    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('taskContextMenu:action', payload);
    }
    closeTaskMenuWindow();
  });
}
