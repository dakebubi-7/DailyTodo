import { app, BrowserWindow } from 'electron';
import type { WindowMode } from '../shared/windowMode';

export type RegisterAppLifecycleHandlersOptions = {
  diag(message: string): void;
  createWindow(): void;
  markQuitting(): void;
  isQuitting(): boolean;
  getMainWindow(): BrowserWindow | null;
  clearMainWindow(): void;
  getWindowMode(): WindowMode;
  clearDesktopOwner(win: BrowserWindow): void;
};

export function registerAppLifecycleHandlers({
  diag,
  createWindow,
  markQuitting,
  isQuitting,
  getMainWindow,
  clearMainWindow,
  getWindowMode,
  clearDesktopOwner,
}: RegisterAppLifecycleHandlersOptions): void {
  app.whenReady().then(() => {
    diag('whenReady -> createWindow');
    createWindow();
    diag('createWindow returned');
  }).catch((error) => diag(`whenReady error: ${String(error)}`));

  app.on('child-process-gone', (_event, details) => {
    diag(`child-process-gone type=${details.type} reason=${details.reason} exitCode=${details.exitCode}`);
    if (details.type === 'GPU') {
      // Chromium will recover the GPU child process on its own; keep logging-only behavior.
    }
  });

  app.on('before-quit', () => {
    diag('before-quit');
    markQuitting();
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed() && getWindowMode() === 'desktop') {
      clearDesktopOwner(mainWindow);
    }
  });
  app.on('will-quit', () => diag('will-quit'));
  app.on('quit', (_event, code) => diag(`quit code=${code}`));

  app.on('window-all-closed', () => {
    diag('window-all-closed');
    clearMainWindow();
    if (isQuitting() && process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}
