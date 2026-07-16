import { createMainShellController } from './mainShellController';
import { createMainWindowBootstrap } from './mainWindowBootstrap';
import { createMainWindowModeController } from './mainWindowModeController';
import { createMainWindowPersistence } from './mainWindowPersistence';
import { createMainWindowStarter } from './mainWindowStartup';
import type { CreateMainWindowCompositionOptions } from './mainWindowCompositionTypes';

export type { CreateMainWindowCompositionOptions } from './mainWindowCompositionTypes';

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
  setInvisibleGlassBackgroundMaterial,
  setNativeWindowDragRegion,
  getCursorPosition,
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
    getTaskMenuPayload: runtimeState.getTaskMenuPayload,
    setTaskMenuPayload: runtimeState.setTaskMenuPayload,
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
      getTaskMenuPayload: runtimeState.getTaskMenuPayload,
      setTaskMenuPayload: runtimeState.setTaskMenuPayload,
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
      setInvisibleGlassBackgroundMaterial,
      setNativeWindowDragRegion,
      getCursorPosition,
      obsidianPathKey,
      ...bootstrapDependencies,
    }),
  });

  return { createWindow };
}
