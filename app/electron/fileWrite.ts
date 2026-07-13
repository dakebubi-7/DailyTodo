import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const rename = promisify(fs.rename);
const mkdir = promisify(fs.mkdir);
const rm = promisify(fs.rm);

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
