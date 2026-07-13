import { BrowserWindow, screen } from 'electron';
import { resolveWindowMode, type WindowMode } from '../shared/windowMode';
import {
  DEFAULT_WINDOW_HEIGHT,
  DEFAULT_WINDOW_WIDTH,
  MIN_WINDOW_WIDTH,
  normalizeRestoredWindowState,
  type WindowState,
} from './windowState';
import type { ElectronStoreLike } from './sharedTypes';

type CreateMainWindowPersistenceOptions = {
  store: ElectronStoreLike;
  windowStateKey: string;
  windowModeKey: string;
  legacyAlwaysOnTopKey: string;
};

export type PersistWindowStateOptions = {
  persistSize?: boolean;
  overrideBounds?: WindowState;
};

function areWindowStatesEqual(left: WindowState, right: WindowState): boolean {
  return left.x === right.x && left.y === right.y && left.width === right.width && left.height === right.height;
}

export function createMainWindowPersistence({
  store,
  windowStateKey,
  windowModeKey,
  legacyAlwaysOnTopKey,
}: CreateMainWindowPersistenceOptions) {
  let persistTimer: NodeJS.Timeout | null = null;

  function getInitialBounds() {
    const stored = store.get(windowStateKey);
    const saved = normalizeRestoredWindowState(stored);
    const { workArea } = screen.getPrimaryDisplay();
    const width = Math.max(MIN_WINDOW_WIDTH, saved?.width || DEFAULT_WINDOW_WIDTH);
    const height = saved?.height || DEFAULT_WINDOW_HEIGHT;
    const x = saved?.x ?? workArea.x + workArea.width - width - 30;
    const y = saved?.y ?? workArea.y + 48;
    return { width, height, x, y };
  }

  function persistWindowState(win: BrowserWindow, options: PersistWindowStateOptions = {}) {
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      if (win.isDestroyed() || win.isMinimized()) return;
      const bounds = options.overrideBounds ?? win.getBounds();
      const previous = normalizeRestoredWindowState(store.get(windowStateKey)) ?? {};
      const nextState = options.persistSize === false ? { ...bounds, width: previous.width, height: previous.height } : bounds;
      if (areWindowStatesEqual(previous, nextState)) return;
      store.set(windowStateKey, nextState);
    }, 250);
  }

  function getStoredWindowMode(): WindowMode {
    return resolveWindowMode(store.get(windowModeKey), store.get(legacyAlwaysOnTopKey));
  }

  return {
    getInitialBounds,
    persistWindowState,
    getStoredWindowMode,
  };
}
