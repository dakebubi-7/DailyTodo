import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const rename = promisify(fs.rename);
const mkdir = promisify(fs.mkdir);
const rm = promisify(fs.rm);

export type TextFileStamp = { size: number; mtimeMs: number; contentHash: string };

export function readTextFileWithStamp(filePath: string): { content: string | null; stamp: TextFileStamp | null } {
  if (!fs.existsSync(filePath)) return { content: null, stamp: null };
  const stat = fs.statSync(filePath);
  if (!stat.isFile()) throw new Error(`Daily note target must be a file: ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf-8');
  return {
    content,
    stamp: {
      size: stat.size,
      mtimeMs: stat.mtimeMs,
      contentHash: createHash('sha256').update(content, 'utf-8').digest('hex'),
    },
  };
}

function createTempPath(filePath: string) {
  return path.join(
    path.dirname(filePath),
    `${path.basename(filePath)}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  );
}

/** Atomic text write for vault/note files: temp file in same directory + rename. */
export function writeTextFileAtomic(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmp = createTempPath(filePath);
  try {
    fs.writeFileSync(tmp, content, 'utf-8');
    fs.renameSync(tmp, filePath);
  } catch (error) {
    try {
      fs.rmSync(tmp, { force: true });
    } catch {
      // ignore cleanup failures
    }
    throw error;
  }
}

/** Replaces only the exact file snapshot that was preflighted. */
export function writeTextFileAtomicIfUnchanged(
  filePath: string,
  content: string,
  expected: TextFileStamp | null,
): { ok: true } | { ok: false; reason: string } {
  try {
    const current = readTextFileWithStamp(filePath);
    const unchanged = current.stamp === null
      ? expected === null
      : expected !== null &&
        current.stamp.size === expected.size &&
        current.stamp.mtimeMs === expected.mtimeMs &&
        current.stamp.contentHash === expected.contentHash;
    if (!unchanged) {
      return {
        ok: false,
        reason: expected === null
          ? `Daily note was created externally before sync: ${filePath}`
          : current.stamp === null
            ? `Daily note was deleted externally before sync: ${filePath}`
            : `Daily note changed externally before sync: ${filePath}`,
      };
    }
    writeTextFileAtomic(filePath, content);
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
}

export async function writeTextFileAtomicAsync(filePath: string, content: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const tmp = createTempPath(filePath);
  try {
    await writeFile(tmp, content, 'utf-8');
    await rename(tmp, filePath);
  } catch (error) {
    try {
      await rm(tmp, { force: true });
    } catch {
      // ignore cleanup failures
    }
    throw error;
  }
}
