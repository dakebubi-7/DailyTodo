import { describe, expect, it, vi } from 'vitest';

const { app, BrowserWindow } = vi.hoisted(() => {
  const listeners = new Map<string, (...args: unknown[]) => void>();
  return {
    app: {
      whenReady: vi.fn(() => Promise.resolve()),
      on: vi.fn((event: string, listener: (...args: unknown[]) => void) => listeners.set(event, listener)),
    },
    BrowserWindow: { getAllWindows: vi.fn(() => []) },
  };
});

vi.mock('electron', () => ({ app, BrowserWindow }));

import { registerAppLifecycleHandlers } from '../electron/appLifecycle';

describe('app lifecycle recovery', () => {
  it('creates the daily local recovery point before opening the first window', async () => {
    const createRecoveryPoint = vi.fn();
    const createWindow = vi.fn();
    registerAppLifecycleHandlers({
      diag: vi.fn(),
      createRecoveryPoint,
      createWindow,
      markQuitting: vi.fn(),
      isQuitting: () => false,
      getMainWindow: () => null,
      clearMainWindow: vi.fn(),
      getWindowMode: () => 'normal',
      clearDesktopOwner: vi.fn(),
    });

    await Promise.resolve();
    await Promise.resolve();

    expect(createRecoveryPoint).toHaveBeenCalledBefore(createWindow);
  });
});
