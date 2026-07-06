export type WindowState = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

export const MIN_WINDOW_WIDTH = 240;
export const DEFAULT_WINDOW_WIDTH = 240;
export const DEFAULT_WINDOW_HEIGHT = 480;
export const RESET_WINDOW_WIDTH = 240;
export const RESET_WINDOW_HEIGHT = 480;

const SETTINGS_WINDOW_WIDTH = 720;

export function getSettingsWindowWidth(workAreaWidth: number) {
  return Math.min(SETTINGS_WINDOW_WIDTH, Math.max(MIN_WINDOW_WIDTH, workAreaWidth - 40));
}

export function normalizeRestoredWindowState(saved: WindowState | undefined): WindowState | undefined {
  if (!saved) return undefined;
  const settingsLikeWidth = saved.width && saved.width >= SETTINGS_WINDOW_WIDTH - 8;
  if (!settingsLikeWidth) return saved;
  return { ...saved, width: DEFAULT_WINDOW_WIDTH, height: saved.height || DEFAULT_WINDOW_HEIGHT };
}
