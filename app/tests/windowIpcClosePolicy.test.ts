import { describe, expect, it, vi } from 'vitest';

const { handlers, handle, on, app, screen } = vi.hoisted(() => {
  const handlers = new Map<string, (...args: unknown[]) => unknown>();
  const handle = vi.fn((channel: string, listener: (...args: unknown[]) => unknown) => handlers.set(channel, listener));
  return {
    handlers,
    handle,
    on: vi.fn(),
    app: { getPath: vi.fn(() => 'C:/DailyTodo/DailyTodo.exe'), setLoginItemSettings: vi.fn() },
    screen: {
      getPrimaryDisplay: vi.fn(() => ({ workArea: { x: 0, y: 0, width: 1600, height: 900 } })),
      getDisplayMatching: vi.fn(() => ({ workArea: { x: 0, y: 0, width: 1600, height: 900 } })),
    },
  };
});

vi.mock('electron', () => ({ app, ipcMain: { handle, on }, screen }));

import { registerWindowIpcHandlers } from '../electron/windowIpc';

describe('window IPC close policy', () => {
  it('routes custom title-bar close through BrowserWindow.close while minimize hides to the tray', async () => {
    const hideMainWindow = vi.fn();
    const close = vi.fn();
    const win = {
      on: vi.fn(),
      isDestroyed: () => false,
      getBounds: () => ({ x: 0, y: 0, width: 800, height: 600 }),
      setShape: vi.fn(),
      close,
    };

    registerWindowIpcHandlers({
      win: win as never,
      store: { get: vi.fn(), set: vi.fn() },
      compactModeKey: 'compact',
      autoStartKey: 'autostart',
      settingsMode: {
        isOpen: () => false,
        setOpen: vi.fn(),
        setRestoreWidth: vi.fn(),
        getRestoreWidth: () => 800,
      },
      hideMainWindow,
      getWindowMode: () => 'normal',
      setWindowMode: vi.fn(),
      persistWindowState: vi.fn(),
      getAppSettings: () => ({ lockWindowPosition: false }),
      setAppSettings: vi.fn(),
      getMainWindow: () => null,
      reapplyWindowZOrder: vi.fn(),
      setInvisibleGlassBackgroundMaterial: vi.fn(),
      setNativeWindowDragRegion: vi.fn(),
      performanceFrost: { setConfiguredGlass: vi.fn(() => false) },
      edgeAutoHide: { noteResizeOrReset: vi.fn(), noteSettingsMode: vi.fn(), noteWindowModeChanged: vi.fn() },
      diag: vi.fn(),
    });

    const minimize = handlers.get('window:minimize');
    const requestClose = handlers.get('window:close');
    await minimize?.({});

    expect(hideMainWindow).toHaveBeenCalledOnce();

    await requestClose?.({});

    expect(hideMainWindow).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
  });
});
