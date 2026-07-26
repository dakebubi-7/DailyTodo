import { app, BrowserWindow, ipcMain, screen } from 'electron';
import type { AppBehaviorSettings } from '../shared/appSettings';
import { isWindowMode, togglePinnedMode, type WindowMode } from '../shared/windowMode';
import {
  MIN_WINDOW_WIDTH,
  RESET_WINDOW_HEIGHT,
  RESET_WINDOW_WIDTH,
  getSettingsWindowWidth,
  type WindowState,
} from './windowState';
import type { SettingsModeState } from './settingsModeState';
import type { ElectronStoreLike } from './sharedTypes';
import type { NativeWindowDragRegion } from './win32Native';
import type { PerformanceFrostController } from './performanceFrostController';
import { normalizeInvisibleGlassPayload } from '../shared/invisibleGlass';
import { createRoundedWindowShape } from './nativeWindowShape';
import type { EdgeAutoHideController } from './edgeAutoHideController';

type RegisterWindowIpcHandlersOptions = {
  win: BrowserWindow;
  store: ElectronStoreLike;
  compactModeKey: string;
  autoStartKey: string;
  settingsMode: SettingsModeState;
  hideMainWindow(): void;
  getWindowMode(): WindowMode;
  setWindowMode(win: BrowserWindow, mode: WindowMode): void;
  persistWindowState(win: BrowserWindow, options?: { persistSize?: boolean; overrideBounds?: WindowState }): void;
  getAppSettings(): AppBehaviorSettings;
  setAppSettings(value: unknown): AppBehaviorSettings;
  getMainWindow(): BrowserWindow | null;
  reapplyWindowZOrder(win: BrowserWindow): void;
  setInvisibleGlassBackgroundMaterial(win: BrowserWindow, payload: unknown): boolean;
  setNativeWindowDragRegion(win: BrowserWindow, region: NativeWindowDragRegion): boolean;
  performanceFrost: Pick<PerformanceFrostController, 'setConfiguredGlass'>;
  edgeAutoHide: Pick<EdgeAutoHideController, 'noteResizeOrReset' | 'noteSettingsMode' | 'noteWindowModeChanged'>;
  diag(message: string): void;
};

export function applyConfiguredGlassAndRoundedShape(
  setConfiguredGlass: Pick<PerformanceFrostController, 'setConfiguredGlass'>['setConfiguredGlass'],
  payload: unknown,
  applyNativeWindowShape: () => void,
): { nativeGlassApplied: boolean } {
  const nativeGlassApplied = setConfiguredGlass(normalizeInvisibleGlassPayload(payload)) === true;
  // Win32 composition updates can restore a rectangular visual region. Reapply the
  // native shape after every material change so all themes keep the same corners.
  applyNativeWindowShape();
  return { nativeGlassApplied };
}

export function registerWindowIpcHandlers({
  win,
  store,
  compactModeKey,
  autoStartKey,
  settingsMode,
  hideMainWindow,
  getWindowMode,
  setWindowMode,
  persistWindowState,
  getAppSettings,
  setAppSettings,
  getMainWindow,
  reapplyWindowZOrder,
  setInvisibleGlassBackgroundMaterial,
  setNativeWindowDragRegion,
  performanceFrost,
  edgeAutoHide,
  diag,
}: RegisterWindowIpcHandlersOptions): void {
  let nativeWindowRadius = 18;
  const applyNativeWindowShape = (source: 'startup' | 'resize' | 'glass' | 'radius-ipc') => {
    if (process.platform !== 'win32' || win.isDestroyed()) return;
    const bounds = win.getBounds();
    const shape = createRoundedWindowShape(bounds, nativeWindowRadius);
    win.setShape(shape);
    diag(`native shape source=${source} radius=${nativeWindowRadius} bounds=${bounds.width}x${bounds.height} rects=${shape.length}`);
  };

  applyNativeWindowShape('startup');
  win.on('resize', () => applyNativeWindowShape('resize'));

  ipcMain.handle('window:minimize', hideMainWindow);
  ipcMain.handle('window:close', () => win.close());

  ipcMain.handle('window:getWindowMode', () => getWindowMode());
  ipcMain.handle('window:setWindowMode', (_event, mode: unknown) => {
    if (!isWindowMode(mode)) {
      return getWindowMode();
    }
    setWindowMode(win, mode);
    edgeAutoHide.noteWindowModeChanged();
    return getWindowMode();
  });

  ipcMain.handle('window:getAlwaysOnTop', () => getWindowMode() === 'onTop');
  ipcMain.handle('window:toggleAlwaysOnTop', () => {
    setWindowMode(win, togglePinnedMode(getWindowMode()));
    edgeAutoHide.noteWindowModeChanged();
    return getWindowMode() === 'onTop';
  });

  ipcMain.handle('window:setInvisibleGlass', (_event, payload: unknown) => {
    return applyConfiguredGlassAndRoundedShape(
      performanceFrost.setConfiguredGlass.bind(performanceFrost),
      payload,
      () => applyNativeWindowShape('glass'),
    );
  });

  ipcMain.handle('window:setNativeWindowRadius', (_event, radius: unknown) => {
    if (typeof radius !== 'number' || !Number.isFinite(radius)) return nativeWindowRadius;
    nativeWindowRadius = Math.max(0, Math.min(36, Math.round(radius)));
    applyNativeWindowShape('radius-ipc');
    return nativeWindowRadius;
  });

  ipcMain.on('window:setNativeDragRegion', (_event, region: NativeWindowDragRegion) => {
    if (!region || typeof region !== 'object') return;
    setNativeWindowDragRegion(win, region);
  });


  ipcMain.handle('window:resetPosition', () => {
    edgeAutoHide.noteResizeOrReset();
    const { workArea } = screen.getPrimaryDisplay();
    const bounds = {
      width: RESET_WINDOW_WIDTH,
      height: RESET_WINDOW_HEIGHT,
      x: workArea.x + workArea.width - RESET_WINDOW_WIDTH - 30,
      y: workArea.y + 48,
    };
    win.setMinimumSize(MIN_WINDOW_WIDTH, RESET_WINDOW_HEIGHT);
    win.setBounds(bounds);
    settingsMode.setOpen(false);
    settingsMode.setRestoreWidth(RESET_WINDOW_WIDTH);
    persistWindowState(win);
    return bounds;
  });

  ipcMain.handle('window:setSettingsMode', (_event, open: unknown) => {
    const bounds = win.getBounds();
    const { workArea } = screen.getDisplayMatching(bounds);
    const shouldOpenSettings = open === true;
    edgeAutoHide.noteSettingsMode(shouldOpenSettings);

    if (shouldOpenSettings) {
      if (!settingsMode.isOpen()) {
        settingsMode.setRestoreWidth(Math.max(MIN_WINDOW_WIDTH, bounds.width || RESET_WINDOW_WIDTH));
      }
      settingsMode.setOpen(true);
      const width = getSettingsWindowWidth(workArea.width);
      const x = Math.min(Math.max(bounds.x, workArea.x), workArea.x + workArea.width - width);
      win.setMinimumSize(width, RESET_WINDOW_HEIGHT);
      win.setBounds({ ...bounds, x, width });
      persistWindowState(win, { persistSize: false });
      return { ok: true, width };
    }

    if (!settingsMode.isOpen()) {
      return { ok: true, width: bounds.width };
    }

    settingsMode.setOpen(false);
    win.setMinimumSize(MIN_WINDOW_WIDTH, RESET_WINDOW_HEIGHT);
    const width = Math.min(settingsMode.getRestoreWidth(), Math.max(MIN_WINDOW_WIDTH, workArea.width - 40));
    const x = Math.min(Math.max(bounds.x, workArea.x), workArea.x + workArea.width - width);
    const restoredBounds = { ...bounds, x, width };
    win.setBounds(restoredBounds);
    persistWindowState(win, { overrideBounds: restoredBounds });
    return { ok: true, width };
  });

  ipcMain.handle('window:getLockWindowPosition', () => getAppSettings().lockWindowPosition);

  ipcMain.handle('window:setLockWindowPosition', (_event, locked: unknown) => {
    const nextLockWindowPosition = locked === true;
    const currentSettings = getAppSettings();
    if (currentSettings.lockWindowPosition === nextLockWindowPosition) return nextLockWindowPosition;
    const next = setAppSettings({ ...currentSettings, lockWindowPosition: nextLockWindowPosition });
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      reapplyWindowZOrder(mainWindow);
    }
    return next.lockWindowPosition;
  });

  ipcMain.handle('window:setCompactMode', (_, compactMode: unknown) => {
    const nextCompactMode = compactMode === true;
    if (store.get(compactModeKey) === nextCompactMode) return;
    store.set(compactModeKey, nextCompactMode);
  });

  ipcMain.handle('window:getCompactMode', () => {
    return store.get(compactModeKey, false) === true;
  });

  ipcMain.handle('window:getAutoStart', () => {
    return store.get(autoStartKey, false) === true;
  });

  ipcMain.handle('window:setAutoStart', (_, enabled: unknown) => {
    const nextAutoStart = enabled === true;
    if (store.get(autoStartKey) === nextAutoStart) return nextAutoStart;
    store.set(autoStartKey, nextAutoStart);
    app.setLoginItemSettings({
      openAtLogin: nextAutoStart,
      path: app.getPath('exe'),
    });
    return nextAutoStart;
  });
}
