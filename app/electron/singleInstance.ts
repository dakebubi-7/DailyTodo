import type { App, BrowserWindow } from 'electron';

type RegisterSingleInstancePolicyOptions = {
  app: Pick<App, 'requestSingleInstanceLock' | 'quit' | 'on'>;
  diag(message: string): void;
  getMainWindow(): BrowserWindow | null;
};

export function registerSingleInstancePolicy({
  app,
  diag,
  getMainWindow,
}: RegisterSingleInstancePolicyOptions): boolean {
  const gotLock = app.requestSingleInstanceLock();
  diag(`singleInstanceLock gotLock=${gotLock}`);
  if (!gotLock) {
    diag('duplicate instance → quit');
    app.quit();
    return gotLock;
  }

  app.on('second-instance', () => {
    const mainWindow = getMainWindow();
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });

  return gotLock;
}
