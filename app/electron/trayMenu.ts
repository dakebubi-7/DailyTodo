import { BrowserWindow, Menu, Tray } from 'electron';
import { setDesktopMode, type WindowMode } from '../shared/windowMode';

type RefreshMainTrayMenuOptions = {
  tray: Tray;
  showMainWindow(): void;
  hideMainWindow(): void;
  getMainWindow(): BrowserWindow | null;
  getWindowMode(): WindowMode;
  setWindowMode(win: BrowserWindow, mode: WindowMode): void;
  quitApp(): void;
  zh(text: string): string;
};

type CreateMainTrayOptions = {
  icon: ConstructorParameters<typeof Tray>[0];
  onClick(): void;
};

export function refreshMainTrayMenu({
  tray,
  showMainWindow,
  hideMainWindow,
  getMainWindow,
  getWindowMode,
  setWindowMode,
  quitApp,
  zh,
}: RefreshMainTrayMenuOptions): void {
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: zh('\u6253\u5f00 DailyTodo'), click: showMainWindow },
      {
        label: zh('\u9489\u5728\u684c\u9762\uff08\u7ec4\u4ef6\u6a21\u5f0f\uff09'),
        type: 'checkbox',
        checked: getWindowMode() === 'desktop',
        click: (menuItem) => {
          const mainWindow = getMainWindow();
          if (!mainWindow || mainWindow.isDestroyed()) return;
          setWindowMode(mainWindow, setDesktopMode(getWindowMode(), menuItem.checked));
        },
      },
      { label: zh('\u9690\u85cf\u7a97\u53e3'), click: hideMainWindow },
      { type: 'separator' },
      { label: zh('\u9000\u51fa'), click: quitApp },
    ]),
  );
}

export function createMainTray({ icon, onClick }: CreateMainTrayOptions): Tray {
  const tray = new Tray(icon);
  tray.setToolTip('DailyTodo');
  tray.on('click', onClick);
  return tray;
}
