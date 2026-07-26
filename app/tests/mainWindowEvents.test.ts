import { describe, expect, it, vi } from 'vitest';

const { screen } = vi.hoisted(() => ({
  screen: {
    getDisplayMatching: vi.fn(() => ({ workArea: { x: 0, y: 0, width: 1200, height: 800 } })),
  },
}));

vi.mock('electron', () => ({ screen }));

import { registerMainWindowEventHandlers } from '../electron/mainWindowEvents';

function createRegistrationHarness(closeToExit: boolean) {
  const listeners = new Map<string, (...args: unknown[]) => void>();
  const webContentsListeners = new Map<string, (...args: unknown[]) => void>();
  const hideMainWindow = vi.fn();
  const markQuitting = vi.fn();
  const win = {
    once: vi.fn((event: string, listener: (...args: unknown[]) => void) => listeners.set(event, listener)),
    on: vi.fn((event: string, listener: (...args: unknown[]) => void) => listeners.set(event, listener)),
    isDestroyed: () => false,
    isVisible: () => true,
    isMinimized: () => true,
    getBounds: () => ({ x: 40, y: 40, width: 800, height: 600 }),
    setBounds: vi.fn(),
    show: vi.fn(),
    webContents: {
      on: vi.fn((event: string, listener: (...args: unknown[]) => void) => webContentsListeners.set(event, listener)),
      setWindowOpenHandler: vi.fn(),
    },
  };

  registerMainWindowEventHandlers({
    win: win as never,
    diag: vi.fn(),
    stopDesktopGuard: vi.fn(),
    ensureDesktopHosted: vi.fn(),
    userHidden: { isHidden: () => false },
    getWindowMode: () => 'normal',
    isQuitting: () => false,
    hideMainWindow,
    getAppSettings: () => ({ closeToExit }),
    markQuitting,
    persistWindowState: vi.fn(),
    settingsMode: { isOpen: () => false },
    performanceFrost: { beginMove: vi.fn(), noteMove: vi.fn(), dispose: vi.fn() },
    edgeAutoHide: {
      noteMoveStarted: vi.fn(),
      noteMoveSettled: vi.fn(),
      noteResizeOrReset: vi.fn(),
      noteForcedExpandAndClear: vi.fn(),
      dispose: vi.fn(),
    },
  });

  return { listeners, hideMainWindow, markQuitting };
}

describe('main window tray policy', () => {
  it('hides a native minimize to the tray and never marks the app for quitting', () => {
    const { listeners, hideMainWindow, markQuitting } = createRegistrationHarness(false);
    const minimize = listeners.get('minimize');

    minimize?.({});

    expect(hideMainWindow).toHaveBeenCalledOnce();
    expect(markQuitting).not.toHaveBeenCalled();
  });

  it('hides a close request by default instead of exiting', () => {
    const { listeners, hideMainWindow, markQuitting } = createRegistrationHarness(false);
    const preventDefault = vi.fn();
    const close = listeners.get('close');

    close?.({ preventDefault });

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(hideMainWindow).toHaveBeenCalledOnce();
    expect(markQuitting).not.toHaveBeenCalled();
  });

  it('allows the advanced close-to-exit option to mark the app for quitting', () => {
    const { listeners, hideMainWindow, markQuitting } = createRegistrationHarness(true);
    const preventDefault = vi.fn();
    const close = listeners.get('close');

    close?.({ preventDefault });

    expect(preventDefault).not.toHaveBeenCalled();
    expect(hideMainWindow).not.toHaveBeenCalled();
    expect(markQuitting).toHaveBeenCalledOnce();
  });
});
