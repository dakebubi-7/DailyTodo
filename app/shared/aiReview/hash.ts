import { createHash } from 'node:crypto';

const HASH_LINE = /^\s*<!--\s*DAILYTODO:AI_HASH:sha256:[0-9a-f]+\s*-->\s*$/im;

/** 去掉 hash 行后逐行 trimEnd、统一换行、去首尾空行。 */
export function normalizeBody(body: string): string {
  return body
    .replace(HASH_LINE, '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+$/, ''))
    .join('\n')
    .replace(/^\n+/, '')
    .replace(/\n+$/, '');
}

export function computeBodyHash(body: string): string {
  return createHash('sha256').update(normalizeBody(body), 'utf-8').digest('hex');
}

export function embedHash(body: string): string {
  const hash = computeBodyHash(body);
  return `<!-- DAILYTODO:AI_HASH:sha256:${hash} -->\n${body.trim()}`;
}

export function extractHash(stamped: string): string | null {
  const match = stamped.match(/<!--\s*DAILYTODO:AI_HASH:sha256:([0-9a-f]+)\s*-->/i);
  return match ? match[1] : null;
}

/** true = 文本仍是未被用户改动的 AI 草稿。 */
export function hashMatches(stamped: string): boolean {
  const embedded = extractHash(stamped);
  if (!embedded) return false;
  return embedded === computeBodyHash(stamped);
}
