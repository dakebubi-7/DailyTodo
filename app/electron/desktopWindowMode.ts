import { BrowserWindow } from 'electron';
import { isAlwaysOnTop, type WindowMode } from '../shared/windowMode';
import { createDesktopWindowHost, type DesktopWindowHostWin32Like } from './desktopWindowHost';

export type DesktopWindowModeWin32Like = DesktopWindowHostWin32Like;

export type CreateDesktopWindowModeControllerOptions = {
  diag(message: string): void;
  getWindowMode(): WindowMode;
  setWindowModeState(mode: WindowMode): void;
  getWin32(): DesktopWindowModeWin32Like | null;
  setNativeWindowMinimizeProtection(win: BrowserWindow, enabled: boolean): boolean;
};

export type DesktopWindowModeController = {
  stopDesktopGuard(): void;
  clearDesktopOwner(win: BrowserWindow): void;
  applyWindowMode(win: BrowserWindow, mode: WindowMode): void;
  reapplyWindowZOrder(win: BrowserWindow): void;
  ensureDesktopHosted(win: BrowserWindow): void;
  markDesktopInteractive(): void;
};

const DESKTOP_HOST_RECOVERY_INTERVAL_MS = 2_000;

export function createDesktopWindowModeController({
  diag,
  getWindowMode,
  setWindowModeState,
  getWin32,
  setNativeWindowMinimizeProtection,
}: CreateDesktopWindowModeControllerOptions): DesktopWindowModeController {
  let desktopGuardTimer: ReturnType<typeof setInterval> | null = null;
  const desktopHost = createDesktopWindowHost({ diag, getWin32 });

  function startDesktopGuard(win: BrowserWindow) {
    stopDesktopGuard();
    desktopHost.attach(win);
    desktopGuardTimer = setInterval(() => {
      if (getWindowMode() === 'desktop') desktopHost.ensureAttached(win);
    }, DESKTOP_HOST_RECOVERY_INTERVAL_MS);
  }

  function stopDesktopGuard() {
    if (desktopGuardTimer) {
      clearInterval(desktopGuardTimer);
      desktopGuardTimer = null;
    }
  }

  function applyWindowMode(win: BrowserWindow, mode: WindowMode) {
    setWindowModeState(mode);
    try {
      setNativeWindowMinimizeProtection(win, mode === 'onTop');
      win.setSkipTaskbar(mode !== 'normal');
      if (mode === 'desktop') {
        win.setAlwaysOnTop(false, 'normal');
        startDesktopGuard(win);
      } else {
        stopDesktopGuard();
        desktopHost.detach(win);
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
        desktopHost.ensureAttached(win);
        return;
      }
      win.setAlwaysOnTop(isAlwaysOnTop(getWindowMode()), 'normal');
    } catch (error) {
      diag(`reapplyWindowZOrder failed: ${String(error)}`);
    }
  }

  function ensureDesktopHosted(win: BrowserWindow) {
    if (win.isDestroyed() || getWindowMode() !== 'desktop') return;
    try {
      win.setAlwaysOnTop(false, 'normal');
      desktopHost.ensureAttached(win);
    } catch (error) {
      diag(`ensureDesktopHosted failed: ${String(error)}`);
    }
  }

  function markDesktopInteractive() {
    // A window hosted by Explorer remains interactive without changing z-order.
  }

  return {
    stopDesktopGuard,
    clearDesktopOwner: desktopHost.detach,
    applyWindowMode,
    reapplyWindowZOrder,
    ensureDesktopHosted,
    markDesktopInteractive,
  };
}
