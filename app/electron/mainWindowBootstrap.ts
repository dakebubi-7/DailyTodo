import {
  createMainWindowIpcRegistrations,
} from './mainWindowIpcRegistration';
import { type SetupMainBrowserWindowOptions } from './mainWindowFactory';
import { registerMainWindowEventHandlers } from './mainWindowEvents';
import { createPerformanceFrostController } from './performanceFrostController';
import { screen } from 'electron';
import { createEdgeAutoHideController } from './edgeAutoHideController';
import { createEdgeAutoHideActivationStrip } from './edgeAutoHideActivationStrip';
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

  const performanceFrost = createPerformanceFrostController({
    applyGlass: (settings) => {
      options.setInvisibleGlassBackgroundMaterial(win, settings);
    },
    notifyRenderer: (active) => {
      if (!win.isDestroyed()) win.webContents.send('window:performanceFrostChanged', active);
    },
  });
  let edgeAutoHide: ReturnType<typeof createEdgeAutoHideController>;
  const activationStrip = createEdgeAutoHideActivationStrip({
    activate: () => edgeAutoHide?.noteActivationStripActivated(),
    diag,
  });
  edgeAutoHide = createEdgeAutoHideController({
    win,
    getWorkAreaForBounds: (bounds) => screen.getDisplayMatching(bounds).workArea,
    getCursorPosition: () => {
      // Electron window bounds are DIP; Win32 GetCursorPos is physical pixels.
      // Using mismatched units makes the 8px side strip unhittable on high-DPI displays.
      try {
        return screen.getCursorScreenPoint();
      } catch {
        return options.getCursorPosition();
      }
    },
    isEnabled: () => options.getAppSettings().edgeAutoHide,
    diag,
    activationStrip,
  });

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
      performanceFrost,
      edgeAutoHide,
    }),
    ...createMainWindowIpcRegistrations({ ...options, performanceFrost, edgeAutoHide }),
  };
}

