/** Store keys the renderer is allowed to read/write through generic store IPC. */
export const RENDERER_STORE_KEYS = [
  'tasks',
  'taskCarryoverLedger',
  'retainedObsidianReviews',
  'dailyWorkNotes',
  'dailyInspirationNotes',
  'selectedDate',
  'activeTab',
  'lastActiveDay',
  'taskListOrderByDate',
  'dailyWorkOpen',
  'dailyInspirationOpen',
  'taskSearchQuery',
  'taskSearchOpen',
  'taskOpenOnly',
  'taskPriorityFilter',
  'personalizationSettings',
  'themeOpacityOverrides',
  'isDark',
] as const;

export type RendererStoreKey = (typeof RENDERER_STORE_KEYS)[number];

const RENDERER_STORE_KEY_SET = new Set<string>(RENDERER_STORE_KEYS);

export function isRendererStoreKey(value: unknown): value is RendererStoreKey {
  return typeof value === 'string' && RENDERER_STORE_KEY_SET.has(value);
}

export function filterRendererStoreKeys(keys: unknown): RendererStoreKey[] {
  if (!Array.isArray(keys)) return [];
  const allowed: RendererStoreKey[] = [];
  for (const key of keys) {
    if (isRendererStoreKey(key)) allowed.push(key);
  }
  return allowed;
}

export function pickRendererStoreEntries(entries: unknown): Record<string, unknown> {
  if (!entries || typeof entries !== 'object' || Array.isArray(entries)) return {};
  const allowed: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(entries as Record<string, unknown>)) {
    if (isRendererStoreKey(key)) allowed[key] = value;
  }
  return allowed;
}
