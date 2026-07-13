import { BrowserWindow } from 'electron';
import { hardenRendererNavigation } from './windowNavigationSecurity';
import { needsDesktopGuard, type WindowMode } from '../shared/windowMode';
import type { SettingsModeState } from './settingsModeState';
import type { UserHiddenState } from './userHiddenState';

type AppSettingsLike = {
  minimizeToTrayOnClose?: boolean;
};

type RegisterMainWindowEventHandlersOptions = {
  win: BrowserWindow;
  diag(message: string): void;
  stopDesktopGuard(): void;
  userHidden: Pick<UserHiddenState, 'isHidden'>;
  getWindowMode(): WindowMode;
  isQuitting(): boolean;
  hideMainWindow(): void;
  getAppSettings(): AppSettingsLike;
  markQuitting(): void;
  persistWindowState(win: BrowserWindow, options?: { persistSize?: boolean }): void;
  settingsMode: Pick<SettingsModeState, 'isOpen'>;
};

export function registerMainWindowEventHandlers({
  win,
  diag,
  stopDesktopGuard,
  userHidden,
  getWindowMode,
  isQuitting,
  hideMainWindow,
  getAppSettings,
  markQuitting,
  persistWindowState,
  settingsMode,
}: RegisterMainWindowEventHandlersOptions): void {
  hardenRendererNavigation(win);

  win.once('ready-to-show', () => {
    diag('ready-to-show -> show()');
    win.show();
  });

  win.webContents.on('did-finish-load', () => diag('did-finish-load'));
  win.webContents.on('did-fail-load', (_event, code, desc) => diag(`did-fail-load ${code} ${desc}`));
  win.webContents.on('preload-error', (_event, preloadPath, error) => diag(`preload-error ${preloadPath}: ${String(error)}`));

  win.on('show', () => diag('evt: show'));
  win.on('closed', () => {
    diag('evt: closed');
    stopDesktopGuard();
  });
  win.on('hide', () => {
    diag('evt: hide');
    diag(`  userHidden=${userHidden.isHidden()} windowMode=${getWindowMode()} isVisible=${win.isVisible()}`);
  });
  win.on('minimize', () => {
    diag('evt: minimize');
    diag(`  userHidden=${userHidden.isHidden()} windowMode=${getWindowMode()} isVisible=${win.isVisible()}`);
    if (!needsDesktopGuard(getWindowMode()) || isQuitting() || win.isDestroyed() || userHidden.isHidden()) return;
    try {
      win.showInactive();
      diag('desktop guard: showInactive after minimize');
    } catch (error) {
      diag(`desktop guard failed: ${String(error)}`);
    }
  });
  win.on('restore', () => diag('evt: restore'));
  win.on('blur', () => diag('evt: blur'));
  win.on('focus', () => diag('evt: focus'));

  win.webContents.on('render-process-gone', (_event, details) => {
    diag(`render-process-gone reason=${details.reason} exitCode=${details.exitCode}`);
  });
  win.on('unresponsive', () => diag('window unresponsive'));

  win.on('move', () => persistWindowState(win, { persistSize: !settingsMode.isOpen() }));
  win.on('resize', () => persistWindowState(win, { persistSize: !settingsMode.isOpen() }));
  win.on('close', (event) => {
    if (isQuitting()) return;
    if (getAppSettings().minimizeToTrayOnClose) {
      event.preventDefault();
      hideMainWindow();
      return;
    }
    markQuitting();
  });
}
