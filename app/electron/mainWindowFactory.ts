import { BrowserWindow, type NativeImage } from 'electron';
import path from 'path';

type WindowBounds = {
  width: number;
  height: number;
  x: number;
  y: number;
};

export type CreateMainBrowserWindowOptions = {
  bounds: WindowBounds;
  minWindowWidth: number;
  initialAlwaysOnTop: boolean;
  icon: NativeImage;
  applyNativeBackgroundMaterial(win: BrowserWindow): void;
  applyToolWindowStyle(win: BrowserWindow): void;
};

export type SetupMainBrowserWindowOptions = {
  scheduleAiTimers(): void;
  createTray(): void;
  loadMainRenderer(): void;
  registerMainWindowEvents(): void;
  registerWindowIpc(): void;
  registerSettingsIpc(): void;
  registerTaskContextMenuIpc(): void;
  registerCompanionIpc(): void;
  registerAiReviewIpc(): void;
  registerObsidianIpc(): void;
};

export function createMainBrowserWindow({
  bounds,
  minWindowWidth,
  initialAlwaysOnTop,
  icon,
  applyNativeBackgroundMaterial,
  applyToolWindowStyle,
}: CreateMainBrowserWindowOptions): BrowserWindow {
  const win = new BrowserWindow({
    ...bounds,
    minWidth: minWindowWidth,
    minHeight: 480,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: true,
    skipTaskbar: true,
    resizable: true,
    show: false,
    alwaysOnTop: initialAlwaysOnTop,
    icon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
    },
  });

  applyNativeBackgroundMaterial(win);
  applyToolWindowStyle(win);
  return win;
}

export function setupMainBrowserWindow(
  win: BrowserWindow,
  {
    scheduleAiTimers,
    createTray,
    loadMainRenderer,
    registerMainWindowEvents,
    registerWindowIpc,
    registerSettingsIpc,
    registerTaskContextMenuIpc,
    registerCompanionIpc,
    registerAiReviewIpc,
    registerObsidianIpc,
  }: SetupMainBrowserWindowOptions,
): void {
  if (win.isDestroyed()) return;

  scheduleAiTimers();
  createTray();
  loadMainRenderer();
  registerMainWindowEvents();
  registerWindowIpc();
  registerSettingsIpc();
  registerTaskContextMenuIpc();
  registerCompanionIpc();
  registerAiReviewIpc();
  registerObsidianIpc();
}
