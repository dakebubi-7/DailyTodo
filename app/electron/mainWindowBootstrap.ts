import {
  createMainWindowIpcRegistrations,
} from './mainWindowIpcRegistration';
import { type SetupMainBrowserWindowOptions } from './mainWindowFactory';
import { registerMainWindowEventHandlers } from './mainWindowEvents';
import type { CreateMainWindowBootstrapOptions } from './mainWindowBootstrapTypes';

export type {
  CreateMainWindowBootstrapOptions,
  EnsureReportLlmAvailableResult,
} from './mainWindowBootstrapTypes';

export function createMainWindowBootstrap(options: CreateMainWindowBootstrapOptions): SetupMainBrowserWindowOptions {
  const {
  win,
  diag,
  scheduleAiTimers,
  createTray,
  loadRenderer,
  stopDesktopGuard,
  userHidden,
  getWindowMode,
  isQuitting,
  hideMainWindow,
  getAppSettings,
  markQuitting,
  persistWindowState,
  settingsMode,
  } = options;

  return {
    scheduleAiTimers,
    createTray: () => {
      createTray();
      diag('tray created');
    },
    loadMainRenderer: () => loadRenderer(win, { view: 'main' }),
    registerMainWindowEvents: () => registerMainWindowEventHandlers({
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
    }),
    ...createMainWindowIpcRegistrations(options),
  };
}
