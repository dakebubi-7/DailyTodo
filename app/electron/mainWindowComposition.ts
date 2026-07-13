import { createMainShellController } from './mainShellController';
import { createMainWindowBootstrap } from './mainWindowBootstrap';
import { createMainWindowModeController } from './mainWindowModeController';
import { createMainWindowPersistence } from './mainWindowPersistence';
import { createMainWindowStarter } from './mainWindowStartup';

type MainWindowBootstrapOptions = Parameters<typeof createMainWindowBootstrap>[0];

type CreateMainWindowCompositionOptions = Omit<
  MainWindowBootstrapOptions,
  | 'win'
  | 'store'
  | 'diag'
  | 'scheduleAiTimers'
  | 'createTray'
  | 'loadRenderer'
  | 'getTaskMenuWindow'
  | 'openTaskMenuWindow'
  | 'closeTaskMenuWindow'
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
  createTrayIcon(): ConstructorParameters<Parameters<typeof createMainShellController>[0]['getTrayIcon']>[0];
  quitApp(): void;
  applyNativeBackgroundMaterial: Parameters<typeof createMainWindowStarter>[0]['applyNativeBackgroundMaterial'];
  applyToolWindowStyle: Parameters<typeof createMainWindowStarter>[0]['applyToolWindowStyle'];
  runtimeState: {
    getMainWindow: MainWindowBootstrapOptions['getMainWindow'];
    setMainWindow: Parameters<typeof createMainWindowStarter>[0]['setMainWindow'];
    getTray: Parameters<typeof createMainWindowModeController>[0]['getTray'];
    setTray: Parameters<typeof createMainShellController>[0]['setTray'];
    getTaskMenuWindow: MainWindowBootstrapOptions['getTaskMenuWindow'];
    setTaskMenuWindow: Parameters<typeof createMainShellController>[0]['setTaskMenuWindow'];
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
  trayRefreshBridge: {
    setRefreshTrayMenu(refreshTrayMenu: () => void): void;
  };
};

export function createMainWindowComposition({
  store,
  diag,
  scheduleAiTimers,
  compactModeKey,
  autoStartKey,
  obsidianPathKey,
  windowStateKey,
  windowModeKey,
  legacyAlwaysOnTopKey,
  minWindowWidth,
  isAlwaysOnTop,
  createAppIcon,
  createTrayIcon,
  quitApp,
  applyNativeBackgroundMaterial,
  applyToolWindowStyle,
  runtimeState,
  appQuitState,
  settingsMode,
  windowModeState,
  userHidden,
  desktopWindowMode,
  trayRefreshBridge,
  ...bootstrapDependencies
}: CreateMainWindowCompositionOptions) {
  const {
    getInitialBounds,
    persistWindowState,
    getStoredWindowMode,
  } = createMainWindowPersistence({
    store,
    windowStateKey,
    windowModeKey,
    legacyAlwaysOnTopKey,
  });

  const { setWindowMode } = createMainWindowModeController({
    store,
    windowModeKey,
    getWindowMode: windowModeState.getMode,
    applyWindowMode: desktopWindowMode.applyWindowMode,
    reapplyWindowZOrder: desktopWindowMode.reapplyWindowZOrder,
    getTray: runtimeState.getTray,
    refreshTrayMenu: trayRefreshBridge.refreshTrayMenu,
  });

  const {
    hideMainWindow,
    createTray,
    closeTaskMenuWindow,
    openTaskMenuWindow,
    refreshTrayMenu,
  } = createMainShellController({
    getMainWindow: runtimeState.getMainWindow,
    getTray: runtimeState.getTray,
    setTray: runtimeState.setTray,
    getTaskMenuWindow: runtimeState.getTaskMenuWindow,
    setTaskMenuWindow: runtimeState.setTaskMenuWindow,
    userHidden,
    getWindowMode: windowModeState.getMode,
    markDesktopInteractive: desktopWindowMode.markDesktopInteractive,
    setWindowMode,
    getTrayIcon: createTrayIcon,
    loadRenderer: bootstrapDependencies.loadRenderer,
    quitApp,
    zh: bootstrapDependencies.zh,
  });

  trayRefreshBridge.setRefreshTrayMenu(refreshTrayMenu);

  const createWindow = createMainWindowStarter({
    store,
    obsidianPathKey,
    getDefaultVaultPath: bootstrapDependencies.getDefaultVaultPath,
    getInitialBounds,
    getStoredWindowMode,
    isAlwaysOnTop,
    minWindowWidth,
    createIcon: createAppIcon,
    applyNativeBackgroundMaterial,
    applyToolWindowStyle,
    setMainWindow: runtimeState.setMainWindow,
    applyWindowMode: desktopWindowMode.applyWindowMode,
    diag,
    createBootstrap: (win) => createMainWindowBootstrap({
      win,
      store,
      diag,
      scheduleAiTimers,
      createTray,
      getTaskMenuWindow: runtimeState.getTaskMenuWindow,
      openTaskMenuWindow,
      closeTaskMenuWindow,
      getMainWindow: runtimeState.getMainWindow,
      stopDesktopGuard: desktopWindowMode.stopDesktopGuard,
      userHidden,
      getWindowMode: windowModeState.getMode,
      isQuitting: appQuitState.isQuitting,
      hideMainWindow,
      markQuitting: appQuitState.markQuitting,
      persistWindowState,
      compactModeKey,
      autoStartKey,
      settingsMode,
      setWindowMode,
      reapplyWindowZOrder: desktopWindowMode.reapplyWindowZOrder,
      ...bootstrapDependencies,
    }),
  });

  return { createWindow };
}
