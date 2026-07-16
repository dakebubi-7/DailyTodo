import type { BrowserWindow } from 'electron';

export type DesktopWindowHostWin32Like = {
  attachToDesktop(handle: Buffer): boolean;
  detachFromDesktop(handle: Buffer): void;
  isAttachedToDesktop(handle: Buffer): boolean;
};

type CreateDesktopWindowHostOptions = {
  diag(message: string): void;
  getWin32(): DesktopWindowHostWin32Like | null;
};

export function createDesktopWindowHost({ diag, getWin32 }: CreateDesktopWindowHostOptions) {
  let attached = false;

  function attach(win: Pick<BrowserWindow, 'isDestroyed' | 'getNativeWindowHandle'>): boolean {
    if (win.isDestroyed()) return false;
    const win32 = getWin32();
    if (!win32) return false;
    const handle = win.getNativeWindowHandle();
    if (attached && win32.isAttachedToDesktop(handle)) return true;

    const applied = win32.attachToDesktop(handle);
    attached = applied;
    diag(`desktop host: ${applied ? 'attached to Explorer' : 'Explorer host unavailable'}`);
    return applied;
  }

  function ensureAttached(win: Pick<BrowserWindow, 'isDestroyed' | 'getNativeWindowHandle'>): boolean {
    if (win.isDestroyed()) return false;
    const win32 = getWin32();
    if (!win32) return false;
    const handle = win.getNativeWindowHandle();
    if (attached && win32.isAttachedToDesktop(handle)) return true;
    return attach(win);
  }

  function detach(win: Pick<BrowserWindow, 'isDestroyed' | 'getNativeWindowHandle'>): void {
    if (!attached || win.isDestroyed()) return;
    getWin32()?.detachFromDesktop(win.getNativeWindowHandle());
    attached = false;
    diag('desktop host: detached from Explorer');
  }

  return { attach, ensureAttached, detach };
}
