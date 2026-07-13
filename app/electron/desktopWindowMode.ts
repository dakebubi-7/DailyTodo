import { BrowserWindow } from 'electron';
import { isAlwaysOnTop, type WindowMode } from '../shared/windowMode';
import {
  resolveDesktopWidgetState,
} from './desktopWidgetState';
import {
  createDesktopWidgetStateApplier,
  type DesktopWindowModeWin32Like,
} from './desktopWidgetStateApplier';
import type { UserHiddenState } from './userHiddenState';

export type { DesktopWindowModeWin32Like } from './desktopWidgetStateApplier';

export type CreateDesktopWindowModeControllerOptions = {
  diag(message: string): void;
  getWindowMode(): WindowMode;
  setWindowModeState(mode: WindowMode): void;
  userHidden: Pick<UserHiddenState, 'isHidden'>;
  getWin32(): DesktopWindowModeWin32Like | null;
};

export type DesktopWindowModeController = {
  stopDesktopGuard(): void;
  clearDesktopOwner(win: BrowserWindow): void;
  applyWindowMode(win: BrowserWindow, mode: WindowMode): void;
  reapplyWindowZOrder(win: BrowserWindow): void;
  markDesktopInteractive(): void;
};

const DESKTOP_FG_CLASSES = new Set([
  'WorkerW',
  'Progman',
  'SHELLDLL_DefView',
  'SysListView32',
]);

const DESKTOP_GUARD_INTERVAL_MS = 64;

export function createDesktopWindowModeController({
  diag,
  getWindowMode,
  setWindowModeState,
  userHidden,
  getWin32,
}: CreateDesktopWindowModeControllerOptions): DesktopWindowModeController {
  let desktopGuardTimer: ReturnType<typeof setInterval> | null = null;
  let desktopShellSeenAt = 0;
  let lastDesktopGuardSnapshot = '';
  let lastAppForegroundClass = '';
  const desktopWidgetStateApplier = createDesktopWidgetStateApplier({ diag, getWindowMode, userHidden, getWin32 });

  function applyDesktopTopmost(win: BrowserWindow) {
    if (win.isDestroyed() || getWindowMode() !== 'desktop') return;
    const win32 = getWin32();
    if (!win32) return;

    const handle = win.getNativeWindowHandle();
    if (!handle) return;

    const fgClass = win32.getForegroundClass();
    const ownForeground = win32.isForegroundWindow(handle);
    const now = Date.now();
    const state = resolveDesktopWidgetState({
      foregroundClass: fgClass,
      ownForeground,
      currentState: desktopWidgetStateApplier.getState(),
      desktopShellSeenAt,
      now,
      desktopForegroundClasses: DESKTOP_FG_CLASSES,
    });
    desktopShellSeenAt = state.desktopShellSeenAt;
    const {
      nextState,
      shellForeground,
      withinDesktopGrace,
      shouldForceAppBackground,
    } = state;

    if (nextState === 'app-background' && fgClass && !ownForeground && fgClass !== lastAppForegroundClass) {
      lastAppForegroundClass = fgClass;
    }
    if (nextState !== 'app-background') {
      lastAppForegroundClass = '';
    }

    const snapshot = `fg=${fgClass || '(none)'} own=${ownForeground} shell=${shellForeground} grace=${withinDesktopGrace} state=${desktopWidgetStateApplier.getState()}->${nextState} force=${shouldForceAppBackground} owner=${desktopWidgetStateApplier.isDesktopOwnerApplied()}`;
    if (snapshot !== lastDesktopGuardSnapshot) {
      lastDesktopGuardSnapshot = snapshot;
      diag(`desktop guard snapshot: ${snapshot}`);
    }

    desktopWidgetStateApplier.apply(win, nextState, shouldForceAppBackground);
  }

  function startDesktopGuard(win: BrowserWindow) {
    stopDesktopGuard();
    desktopWidgetStateApplier.reset();
    applyDesktopTopmost(win);
    desktopGuardTimer = setInterval(() => applyDesktopTopmost(win), DESKTOP_GUARD_INTERVAL_MS);
  }

  function stopDesktopGuard() {
    if (desktopGuardTimer) {
      clearInterval(desktopGuardTimer);
      desktopGuardTimer = null;
    }
    desktopWidgetStateApplier.reset();
  }

  function applyWindowMode(win: BrowserWindow, mode: WindowMode) {
    setWindowModeState(mode);
    try {
      win.setSkipTaskbar(mode !== 'normal');
      if (mode === 'desktop') {
        win.setAlwaysOnTop(false, 'normal');
        startDesktopGuard(win);
      } else {
        stopDesktopGuard();
        desktopWidgetStateApplier.clearDesktopOwner(win);
        win.setAlwaysOnTop(isAlwaysOnTop(mode));
      }
      diag(`applyWindowMode mode=${mode} alwaysOnTop=${isAlwaysOnTop(mode)} skipTaskbar=${mode !== 'normal'}`);
    } catch (error) {
      diag(`applyWindowMode failed: ${String(error)}`);
    }
  }

  function reapplyWindowZOrder(win: BrowserWindow) {
    if (win.isDestroyed()) return;
    try {
      if (getWindowMode() === 'desktop') {
        win.setAlwaysOnTop(false, 'normal');
        applyDesktopTopmost(win);
        return;
      }
      win.setAlwaysOnTop(isAlwaysOnTop(getWindowMode()), 'normal');
    } catch (error) {
      diag(`reapplyWindowZOrder failed: ${String(error)}`);
    }
  }

  function markDesktopInteractive() {
    desktopWidgetStateApplier.markInteractive();
  }

  return {
    stopDesktopGuard,
    clearDesktopOwner: desktopWidgetStateApplier.clearDesktopOwner,
    applyWindowMode,
    reapplyWindowZOrder,
    markDesktopInteractive,
  };
}
