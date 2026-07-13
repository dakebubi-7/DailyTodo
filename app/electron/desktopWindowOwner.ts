import { BrowserWindow } from 'electron';

type DesktopWindowOwnerWin32Like = {
  setDesktopOwner(handle: Buffer): boolean;
  clearDesktopOwner(handle: Buffer): void;
};

type CreateDesktopWindowOwnerOptions = {
  diag(message: string): void;
  getWin32(): DesktopWindowOwnerWin32Like | null;
};

export function createDesktopWindowOwner({ diag, getWin32 }: CreateDesktopWindowOwnerOptions) {
  let applied = false;

  function applyDesktopOwner(win: BrowserWindow) {
    if (win.isDestroyed()) return;
    const handle = win.getNativeWindowHandle();
    const win32 = getWin32();
    if (!win32 || !handle) {
      diag('owner: no win32 / no handle -> skip (polling still active)');
      return;
    }
    try {
      const ok = win32.setDesktopOwner(handle);
      applied = ok;
      diag(`owner: setDesktopOwner ${ok ? 'ok' : 'progman-not-found'}`);
    } catch (error) {
      applied = false;
      diag(`owner: set threw -> skip: ${String(error)}`);
    }
  }

  function clearDesktopOwner(win: BrowserWindow) {
    if (!applied || win.isDestroyed()) return;
    const handle = win.getNativeWindowHandle();
    const win32 = getWin32();
    if (!win32 || !handle) return;
    try {
      win32.clearDesktopOwner(handle);
      diag('owner: cleared');
    } catch (error) {
      diag(`owner: clear threw: ${String(error)}`);
    } finally {
      applied = false;
    }
  }

  return {
    applyDesktopOwner,
    clearDesktopOwner,
    isApplied: () => applied,
  };
}
