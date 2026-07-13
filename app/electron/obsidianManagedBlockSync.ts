export function preserveTaskSyncTimestamp(existing: string, next: string): string {
  const timestampPattern = /^同步时间：[^\r\n]*$/m;
  const existingWithoutTimestamp = existing.replace(timestampPattern, '');
  const nextWithoutTimestamp = next.replace(timestampPattern, '');
  const existingTimestamp = existing.match(timestampPattern)?.[0];

  return existingTimestamp && existingWithoutTimestamp === nextWithoutTimestamp
    ? next.replace(timestampPattern, existingTimestamp)
    : next;
}

export function upsertManagedBlockIfChanged(
  existing: string,
  startMarker: string,
  endMarker: string,
  nextBlock: string,
  upsertMarkedBlock: (existing: string, startMarker: string, endMarker: string, block: string) => string,
): string {
  const blockStart = existing.indexOf(startMarker);
  const blockEnd = existing.indexOf(endMarker);
  const currentBlock = blockStart !== -1 && blockEnd > blockStart
    ? existing.slice(blockStart, blockEnd + endMarker.length)
    : '';

  return currentBlock === nextBlock
    ? existing
    : upsertMarkedBlock(existing, startMarker, endMarker, nextBlock);
}
