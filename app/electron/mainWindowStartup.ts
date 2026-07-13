import type { BrowserWindow, NativeImage } from 'electron';
import type { WindowMode } from '../shared/windowMode';
import { createMainBrowserWindow, setupMainBrowserWindow, type SetupMainBrowserWindowOptions } from './mainWindowFactory';
import type { ElectronStoreLike } from './sharedTypes';

type WindowBounds = {
  width: number;
  height: number;
  x: number;
  y: number;
};

type CreateMainWindowStarterOptions = {
  store: ElectronStoreLike;
  obsidianPathKey: string;
  getDefaultVaultPath(): string | undefined;
  getInitialBounds(): WindowBounds;
  getStoredWindowMode(): WindowMode;
  isAlwaysOnTop(mode: WindowMode): boolean;
  minWindowWidth: number;
  createIcon(): NativeImage;
  applyNativeBackgroundMaterial(win: BrowserWindow): void;
  applyToolWindowStyle(win: BrowserWindow): void;
  setMainWindow(win: BrowserWindow): void;
  applyWindowMode(win: BrowserWindow, mode: WindowMode): void;
  diag(message: string): void;
  createBootstrap(win: BrowserWindow): SetupMainBrowserWindowOptions;
};

export function createMainWindowStarter({
  store,
  obsidianPathKey,
  getDefaultVaultPath,
  getInitialBounds,
  getStoredWindowMode,
  isAlwaysOnTop,
  minWindowWidth,
  createIcon,
  applyNativeBackgroundMaterial,
  applyToolWindowStyle,
  setMainWindow,
  applyWindowMode,
  diag,
  createBootstrap,
}: CreateMainWindowStarterOptions) {
  return function createWindow() {
    const storedVaultPath = store.get(obsidianPathKey);
    const defaultVaultPath = getDefaultVaultPath();
    if ((typeof storedVaultPath !== 'string' || !storedVaultPath.trim()) && defaultVaultPath) {
      store.set(obsidianPathKey, defaultVaultPath);
    }

    const bounds = getInitialBounds();
    const initialMode = getStoredWindowMode();
    const win = createMainBrowserWindow({
      bounds,
      minWindowWidth,
      initialAlwaysOnTop: isAlwaysOnTop(initialMode),
      icon: createIcon(),
      applyNativeBackgroundMaterial,
      applyToolWindowStyle,
    });

    setMainWindow(win);
    diag('BrowserWindow created');
    applyWindowMode(win, initialMode);
    setupMainBrowserWindow(win, createBootstrap(win));
  };
}
