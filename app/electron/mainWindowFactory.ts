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

type MainWindowVisualOptions = {
  transparent: boolean;
  backgroundColor: string;
  hasShadow?: boolean;
};

export function getMainWindowVisualOptions(
  platform = process.platform,
  _operatingSystemRelease?: string,
): MainWindowVisualOptions {
  void _operatingSystemRelease;
  if (platform === 'win32') {
    // Invisible glass always uses the Win32 acrylic path, which needs a transparent host
    // so intermediate blur/tint values remain visible on Windows 10 and Windows 11.
    return {
      transparent: true,
      backgroundColor: '#00000000',
      hasShadow: false,
    };
  }

  return {
    transparent: true,
    backgroundColor: '#00000000',
  };
}

export function createMainBrowserWindow({
  bounds,
  minWindowWidth,
  initialAlwaysOnTop,
  icon,
  applyNativeBackgroundMaterial,
  applyToolWindowStyle,
}: CreateMainBrowserWindowOptions): BrowserWindow {
  const visualOptions = getMainWindowVisualOptions();
  const win = new BrowserWindow({
    ...bounds,
    minWidth: minWindowWidth,
    minHeight: 480,
    frame: false,
    ...visualOptions,
    hasShadow: visualOptions.hasShadow ?? true,
    skipTaskbar: true,
    resizable: true,
    show: false,
    alwaysOnTop: initialAlwaysOnTop,
    icon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
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
