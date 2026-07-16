import { BrowserWindow, screen } from 'electron';
import { hardenRendererNavigation } from './windowNavigationSecurity';
import { needsDesktopGuard, type WindowMode } from '../shared/windowMode';
import type { SettingsModeState } from './settingsModeState';
import type { UserHiddenState } from './userHiddenState';
import type { EdgeAutoHideController } from './edgeAutoHideController';
import { ensureWindowBoundsVisible } from './windowState';

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
  performanceFrost: Pick<import('./performanceFrostController').PerformanceFrostController, 'beginMove' | 'noteMove' | 'dispose'>;
  edgeAutoHide: Pick<EdgeAutoHideController, 'noteMoveStarted' | 'noteMoveSettled' | 'noteResizeOrReset' | 'noteForcedExpandAndClear' | 'dispose'>;
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
  performanceFrost,
  edgeAutoHide,
}: RegisterMainWindowEventHandlersOptions): void {
  hardenRendererNavigation(win);

  function rescueIfOffscreen(source: string): void {
    if (win.isDestroyed()) return;
    edgeAutoHide.noteForcedExpandAndClear();
    const bounds = win.getBounds();
    const workArea = screen.getDisplayMatching(bounds).workArea;
    const visible = ensureWindowBoundsVisible(bounds, workArea);
    if (
      visible.x !== bounds.x
      || visible.y !== bounds.y
      || visible.width !== bounds.width
      || visible.height !== bounds.height
    ) {
      win.setBounds(visible);
      diag(`edge auto-hide: rescued offscreen window on ${source}`);
    }
  }

  win.once('ready-to-show', () => {
    diag('ready-to-show -> show()');
    win.show();
  });

  win.webContents.on('did-finish-load', () => diag('did-finish-load'));
  win.webContents.on('did-fail-load', (_event, code, desc) => diag(`did-fail-load ${code} ${desc}`));
  win.webContents.on('preload-error', (_event, preloadPath, error) => diag(`preload-error ${preloadPath}: ${String(error)}`));

  win.on('show', () => {
    rescueIfOffscreen('show');
    diag('evt: show');
  });
  win.on('closed', () => {
    diag('evt: closed');
    performanceFrost.dispose();
    edgeAutoHide.dispose();
    stopDesktopGuard();
  });
  win.on('hide', () => {
    edgeAutoHide.noteForcedExpandAndClear();
    diag('evt: hide');
    diag(`  userHidden=${userHidden.isHidden()} windowMode=${getWindowMode()} isVisible=${win.isVisible()}`);
  });
  win.on('minimize', () => {
    edgeAutoHide.noteForcedExpandAndClear();
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
  win.on('restore', () => {
    rescueIfOffscreen('restore');
    diag('evt: restore');
  });
  win.on('blur', () => diag('evt: blur'));
  win.on('focus', () => diag('evt: focus'));

  win.webContents.on('render-process-gone', (_event, details) => {
    diag(`render-process-gone reason=${details.reason} exitCode=${details.exitCode}`);
  });
  win.on('unresponsive', () => diag('window unresponsive'));

  win.on('will-move', () => {
    performanceFrost.beginMove();
    edgeAutoHide.noteMoveStarted();
  });
  win.on('move', () => {
    performanceFrost.noteMove();
    edgeAutoHide.noteMoveSettled();
    persistWindowState(win, { persistSize: !settingsMode.isOpen() });
  });
  win.on('resize', () => {
    edgeAutoHide.noteResizeOrReset();
    persistWindowState(win, { persistSize: !settingsMode.isOpen() });
  });
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
