import { createMainShellController } from './mainShellController';
import { createMainWindowBootstrap } from './mainWindowBootstrap';
import { createMainWindowModeController } from './mainWindowModeController';
import { createMainWindowStarter } from './mainWindowStartup';
import type { TrayRefreshBridge } from './trayRefreshBridge';

type MainWindowBootstrapOptions = Parameters<typeof createMainWindowBootstrap>[0];

export type CreateMainWindowCompositionOptions = Omit<
  MainWindowBootstrapOptions,
  | 'win'
  | 'store'
  | 'diag'
  | 'scheduleAiTimers'
  | 'createTray'
  | 'getTaskMenuWindow'
  | 'openTaskMenuWindow'
  | 'closeTaskMenuWindow'
  | 'getTaskMenuPayload'
  | 'setTaskMenuPayload'
  | 'getMainWindow'
  | 'stopDesktopGuard'
  | 'userHidden'
  | 'getWindowMode'
  | 'isQuitting'
  | 'hideMainWindow'
  | 'markQuitting'
  | 'persistWindowState'
  | 'compactModeKey'
  | 'autoStartKey'
  | 'settingsMode'
  | 'setWindowMode'
  | 'reapplyWindowZOrder'
  | 'getCursorPosition'
> & {
  store: MainWindowBootstrapOptions['store'];
  diag: MainWindowBootstrapOptions['diag'];
  scheduleAiTimers: MainWindowBootstrapOptions['scheduleAiTimers'];
  compactModeKey: string;
  autoStartKey: string;
  obsidianPathKey: string;
  windowStateKey: string;
  windowModeKey: string;
  legacyAlwaysOnTopKey: string;
  minWindowWidth: number;
  isAlwaysOnTop(mode: Parameters<typeof createMainWindowStarter>[0]['getStoredWindowMode'] extends () => infer Mode ? Mode : never): boolean;
  createAppIcon(): ReturnType<Parameters<typeof createMainWindowStarter>[0]['createIcon']>;
  createTrayIcon(): ReturnType<Parameters<typeof createMainShellController>[0]['getTrayIcon']>;
  quitApp(): void;
  applyNativeBackgroundMaterial: Parameters<typeof createMainWindowStarter>[0]['applyNativeBackgroundMaterial'];
  setInvisibleGlassBackgroundMaterial: MainWindowBootstrapOptions['setInvisibleGlassBackgroundMaterial'];
  setNativeWindowDragRegion: MainWindowBootstrapOptions['setNativeWindowDragRegion'];
  getCursorPosition: MainWindowBootstrapOptions['getCursorPosition'];
  applyToolWindowStyle: Parameters<typeof createMainWindowStarter>[0]['applyToolWindowStyle'];
  runtimeState: {
    getMainWindow: MainWindowBootstrapOptions['getMainWindow'];
    setMainWindow: Parameters<typeof createMainWindowStarter>[0]['setMainWindow'];
    getTray: Parameters<typeof createMainWindowModeController>[0]['getTray'];
    setTray: Parameters<typeof createMainShellController>[0]['setTray'];
    getTaskMenuWindow: MainWindowBootstrapOptions['getTaskMenuWindow'];
    setTaskMenuWindow: Parameters<typeof createMainShellController>[0]['setTaskMenuWindow'];
    getTaskMenuPayload: () => import('./taskContextMenuIpc').TaskMenuPayload | null;
    setTaskMenuPayload: (payload: import('./taskContextMenuIpc').TaskMenuPayload | null) => void;
  };
  appQuitState: {
    isQuitting: MainWindowBootstrapOptions['isQuitting'];
    markQuitting: MainWindowBootstrapOptions['markQuitting'];
  };
  settingsMode: MainWindowBootstrapOptions['settingsMode'];
  windowModeState: {
    getMode: MainWindowBootstrapOptions['getWindowMode'];
  };
  userHidden: MainWindowBootstrapOptions['userHidden'] & {
    setHidden(hidden: boolean): void;
  };
  desktopWindowMode: {
    applyWindowMode: Parameters<typeof createMainWindowModeController>[0]['applyWindowMode'];
    reapplyWindowZOrder: MainWindowBootstrapOptions['reapplyWindowZOrder'];
    markDesktopInteractive: Parameters<typeof createMainShellController>[0]['markDesktopInteractive'];
    stopDesktopGuard: MainWindowBootstrapOptions['stopDesktopGuard'];
  };
  trayRefreshBridge: TrayRefreshBridge;
};
