export function toggleHistorySelection(selectedIds: string[], id: string): string[] {
  return selectedIds.includes(id)
    ? selectedIds.filter((selectedId) => selectedId !== id)
    : [...selectedIds, id];
}

export function selectVisibleHistoryItems(visibleIds: string[]): string[] {
  return Array.from(new Set(visibleIds));
}

export function keepVisibleSelection(selectedIds: string[], visibleIds: string[]): string[] {
  const visibleIdSet = new Set(visibleIds);
  return selectedIds.filter((selectedId) => visibleIdSet.has(selectedId));
}

export function isEveryVisibleHistoryItemSelected(selectedIds: string[], visibleIds: string[]): boolean {
  if (!visibleIds.length) return false;
  const selectedIdSet = new Set(selectedIds);
  return visibleIds.every((visibleId) => selectedIdSet.has(visibleId));
}
