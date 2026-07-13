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

export function normalizeRestoredWindowState(saved: unknown): WindowState | undefined {
  if (!saved || typeof saved !== 'object') return undefined;
  const candidate = saved as WindowState;
  const settingsLikeWidth = candidate.width && candidate.width >= SETTINGS_WINDOW_WIDTH - 8;
  if (!settingsLikeWidth) return candidate;
  return { ...candidate, width: DEFAULT_WINDOW_WIDTH, height: candidate.height || DEFAULT_WINDOW_HEIGHT };
}
