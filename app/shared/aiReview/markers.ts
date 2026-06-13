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

const SAFE_CUSTOM_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const BASE64URL_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function utf8Bytes(input: string): number[] {
  const bytes: number[] = [];

  for (const char of input) {
    const codePoint = char.codePointAt(0) ?? 0;

    if (codePoint <= 0x7f) {
      bytes.push(codePoint);
    } else if (codePoint <= 0x7ff) {
      bytes.push(0xc0 | (codePoint >> 6));
      bytes.push(0x80 | (codePoint & 0x3f));
    } else if (codePoint <= 0xffff) {
      bytes.push(0xe0 | (codePoint >> 12));
      bytes.push(0x80 | ((codePoint >> 6) & 0x3f));
      bytes.push(0x80 | (codePoint & 0x3f));
    } else {
      bytes.push(0xf0 | (codePoint >> 18));
      bytes.push(0x80 | ((codePoint >> 12) & 0x3f));
      bytes.push(0x80 | ((codePoint >> 6) & 0x3f));
      bytes.push(0x80 | (codePoint & 0x3f));
    }
  }

  return bytes;
}

function toBase64Url(input: string): string {
  const bytes = utf8Bytes(input);
  let output = '';

  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index] ?? 0;
    const second = bytes[index + 1];
    const third = bytes[index + 2];

    output += BASE64URL_CHARS[first >> 2];
    output += BASE64URL_CHARS[((first & 0x03) << 4) | ((second ?? 0) >> 4)];

    if (second !== undefined) {
      output += BASE64URL_CHARS[((second & 0x0f) << 2) | ((third ?? 0) >> 6)];
    }

    if (third !== undefined) {
      output += BASE64URL_CHARS[third & 0x3f];
    }
  }

  return output;
}

export function safeCustomBlockId(id: string): string {
  const raw = String(id ?? '');
  if (SAFE_CUSTOM_ID_PATTERN.test(raw)) return raw;
  return `~${toBase64Url(raw)}`;
}

export function customBlockMarker(id: string): BlockMarker {
  const safeId = safeCustomBlockId(id);
  return {
    start: `<!-- DAILYTODO:CUSTOM:${safeId}:START -->`,
    end: `<!-- DAILYTODO:CUSTOM:${safeId}:END -->`,
  };
}

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
