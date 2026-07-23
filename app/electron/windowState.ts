import { isObjectRecord } from './unknownValueGuards';

export type WindowState = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

export const MIN_WINDOW_WIDTH = 280;
export const DEFAULT_WINDOW_WIDTH = 280;
export const DEFAULT_WINDOW_HEIGHT = 480;
export const RESET_WINDOW_WIDTH = 280;
export const RESET_WINDOW_HEIGHT = 480;

const SETTINGS_WINDOW_WIDTH = 800;

export function getSettingsWindowWidth(workAreaWidth: number) {
  return Math.min(SETTINGS_WINDOW_WIDTH, Math.max(MIN_WINDOW_WIDTH, workAreaWidth - 40));
}

function readFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function normalizeRestoredWindowState(saved: unknown): WindowState | undefined {
  if (!isObjectRecord(saved)) return undefined;

  const record = saved;
  const x = readFiniteNumber(record.x);
  const y = readFiniteNumber(record.y);
  const width = readFiniteNumber(record.width);
  const height = readFiniteNumber(record.height);

  if (x === undefined && y === undefined && width === undefined && height === undefined) {
    return undefined;
  }

  const candidate: WindowState = {};
  if (x !== undefined) candidate.x = x;
  if (y !== undefined) candidate.y = y;
  if (width !== undefined) candidate.width = width;
  if (height !== undefined) candidate.height = height;

  const settingsLikeWidth = candidate.width !== undefined && candidate.width >= SETTINGS_WINDOW_WIDTH - 8;
  if (!settingsLikeWidth) return candidate;
  return {
    ...candidate,
    width: DEFAULT_WINDOW_WIDTH,
    height: candidate.height ?? DEFAULT_WINDOW_HEIGHT,
  };
}

export type WorkAreaLike = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function ensureWindowBoundsVisible(
  bounds: { x?: number; y?: number; width?: number; height?: number },
  workArea: WorkAreaLike,
): { x: number; y: number; width: number; height: number } {
  const width = Math.max(
    MIN_WINDOW_WIDTH,
    Math.min(typeof bounds.width === 'number' && Number.isFinite(bounds.width) ? bounds.width : DEFAULT_WINDOW_WIDTH, workArea.width),
  );
  const height = Math.max(
    200,
    Math.min(typeof bounds.height === 'number' && Number.isFinite(bounds.height) ? bounds.height : DEFAULT_WINDOW_HEIGHT, workArea.height),
  );
  const rawX = typeof bounds.x === 'number' && Number.isFinite(bounds.x) ? bounds.x : workArea.x + 40;
  const rawY = typeof bounds.y === 'number' && Number.isFinite(bounds.y) ? bounds.y : workArea.y + 40;
  const fullyOffscreen =
    rawX + width < workArea.x + 8
    || rawX > workArea.x + workArea.width - 8
    || rawY + height < workArea.y + 8
    || rawY > workArea.y + workArea.height - 8
    || Math.abs(rawX) > 10000
    || Math.abs(rawY) > 10000;

  if (fullyOffscreen) {
    return {
      x: Math.round(workArea.x + (workArea.width - width) / 2),
      y: Math.round(workArea.y + (workArea.height - height) / 2),
      width,
      height,
    };
  }

  return {
    x: Math.min(Math.max(rawX, workArea.x), workArea.x + workArea.width - width),
    y: Math.min(Math.max(rawY, workArea.y), workArea.y + workArea.height - height),
    width,
    height,
  };
}
