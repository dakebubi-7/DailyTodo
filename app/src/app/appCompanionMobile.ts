import type { CaptureItem } from '../../shared/obsidianCompanion';

export function mergeImportedMobileCaptureItems(
  existing: CaptureItem[],
  items: CaptureItem[]
): CaptureItem[] {
  if (!items.length) return existing;
  return [...existing, ...items];
}
