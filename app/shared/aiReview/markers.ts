export interface BlockMarker {
  start: string;
  end: string;
}

export const REVIEW_MARKERS = {
  REVIEW: { start: '<!-- DAILYTODO:REVIEW:START -->', end: '<!-- DAILYTODO:REVIEW:END -->' },
  TOMORROW: { start: '<!-- DAILYTODO:TOMORROW:START -->', end: '<!-- DAILYTODO:TOMORROW:END -->' },
  KNOWLEDGE: { start: '<!-- DAILYTODO:KNOWLEDGE:START -->', end: '<!-- DAILYTODO:KNOWLEDGE:END -->' },
} as const;

export type ReviewMarkerKey = keyof typeof REVIEW_MARKERS;

export function readBlockBody(existing: string, marker: BlockMarker): string {
  const start = existing.indexOf(marker.start);
  const end = existing.indexOf(marker.end);
  if (start === -1 || end === -1 || end <= start) return '';
  return existing.slice(start + marker.start.length, end).trim();
}

export function hasBlock(existing: string, marker: BlockMarker): boolean {
  const start = existing.indexOf(marker.start);
  const end = existing.indexOf(marker.end);
  return start !== -1 && end !== -1 && end > start;
}

/** 只替换 start/end 之间内容；无块则在文末追加。结果幂等。 */
export function upsertBlock(existing: string, marker: BlockMarker, body: string): string {
  const block = `${marker.start}\n${body.trim()}\n${marker.end}`;
  const start = existing.indexOf(marker.start);
  const end = existing.indexOf(marker.end);
  if (start !== -1 && end !== -1 && end > start) {
    const before = existing.slice(0, start).trimEnd();
    const after = existing.slice(end + marker.end.length).trimStart();
    return [before, block, after].filter(Boolean).join('\n\n').trimEnd() + '\n';
  }
  return `${existing.trimEnd()}\n\n${block}\n`;
}
