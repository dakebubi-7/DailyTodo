import { isObjectRecord } from './unknownValueGuards';

export const TASK_MENU_ACTION_UPDATE_KEYS = [
  '__action',
  'text',
  'priority',
  'tags',
  'scheduledDates',
  'taskDate',
  'source',
] as const;

export type TaskMenuActionUpdateKey = (typeof TASK_MENU_ACTION_UPDATE_KEYS)[number];

const ALLOWED = new Set<string>(TASK_MENU_ACTION_UPDATE_KEYS);

export function pickTaskMenuActionUpdates(value: unknown): Record<string, unknown> | null {
  if (!isObjectRecord(value)) return null;
  const updates: Record<string, unknown> = {};
  for (const key of Object.keys(value)) {
    if (!ALLOWED.has(key)) continue;
    updates[key] = value[key];
  }
  return updates;
}

export function isTaskMenuActionPayload(value: unknown): value is { taskId: string; updates: Record<string, unknown> } {
  if (!isObjectRecord(value)) return false;
  if (typeof value.taskId !== 'string' || !value.taskId.trim()) return false;
  return pickTaskMenuActionUpdates(value.updates) !== null;
}

export function normalizeTaskMenuActionPayload(value: unknown): { taskId: string; updates: Record<string, unknown> } | null {
  if (!isObjectRecord(value)) return null;
  if (typeof value.taskId !== 'string' || !value.taskId.trim()) return null;
  const updates = pickTaskMenuActionUpdates(value.updates);
  if (!updates) return null;
  return { taskId: value.taskId, updates };
}
