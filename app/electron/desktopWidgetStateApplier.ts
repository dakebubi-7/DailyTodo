import type { BrowserWindow } from 'electron';
import type { WindowMode } from '../shared/windowMode';
import type { DesktopWidgetState } from './desktopWidgetState';
import { createDesktopWindowOwner } from './desktopWindowOwner';
import type { UserHiddenState } from './userHiddenState';

export type DesktopWindowModeWin32Like = {
  getForegroundClass(): string;
  isForegroundWindow(handle: Buffer): boolean;
  setTopmost(handle: Buffer): void;
  clearTopmost(handle: Buffer): void;
  sendToBottom(handle: Buffer): void;
  setDesktopOwner(handle: Buffer): boolean;
  clearDesktopOwner(handle: Buffer): void;
};

type CreateDesktopWidgetStateApplierOptions = {
  diag(message: string): void;
  getWindowMode(): WindowMode;
  userHidden: Pick<UserHiddenState, 'isHidden'>;
  getWin32(): DesktopWindowModeWin32Like | null;
};

export function createDesktopWidgetStateApplier({
  diag,
  getWindowMode,
  userHidden,
  getWin32,
}: CreateDesktopWidgetStateApplierOptions) {
  let desktopWidgetState: DesktopWidgetState = 'app-background';
  let lastAppBackgroundSinkAt = 0;
  const desktopOwner = createDesktopWindowOwner({ diag, getWin32 });

  function apply(win: BrowserWindow, nextState: DesktopWidgetState, force = false) {
    if (win.isDestroyed() || getWindowMode() !== 'desktop') return;
    const win32 = getWin32();
    if (!win32) return;
    if (!force && desktopWidgetState === nextState && nextState !== 'app-background') return;
    if (!force && desktopWidgetState === nextState && nextState === 'app-background') {
      const now = Date.now();
      if (now - lastAppBackgroundSinkAt < 250) return;
      lastAppBackgroundSinkAt = now;
    }

    const handle = win.getNativeWindowHandle();
    if (!handle) return;

    desktopWidgetState = nextState;

    if (nextState === 'desktop-visible') {
      lastAppBackgroundSinkAt = 0;
      desktopOwner.applyDesktopOwner(win);
      try {
        if (!userHidden.isHidden() && !win.isVisible()) win.showInactive();
        win.setAlwaysOnTop(true, 'normal');
        win32.setTopmost(handle);
      } catch (error) {
        diag(`desktop state desktop-visible failed: ${String(error)}`);
      }
      return;
    }

    if (nextState === 'dt-active') {
      lastAppBackgroundSinkAt = 0;
      desktopOwner.clearDesktopOwner(win);
      try {
        win.setAlwaysOnTop(false, 'normal');
        win32.clearTopmost(handle);
        if (!win.isVisible()) win.show();
      } catch (error) {
        diag(`desktop state dt-active failed: ${String(error)}`);
      }
      return;
    }

    desktopOwner.clearDesktopOwner(win);
    try {
      win.setAlwaysOnTop(false, 'normal');
      win32.clearTopmost(handle);
      win32.sendToBottom(handle);
    } catch (error) {
      diag(`desktop state app-background failed: ${String(error)}`);
    }
  }

  function reset() {
    desktopWidgetState = 'app-background';
  }

  function markInteractive() {
    desktopWidgetState = 'dt-active';
  }

  return {
    apply,
    clearDesktopOwner: desktopOwner.clearDesktopOwner,
    getState: () => desktopWidgetState,
    markInteractive,
    reset,
    isDesktopOwnerApplied: desktopOwner.isApplied,
  };
}
