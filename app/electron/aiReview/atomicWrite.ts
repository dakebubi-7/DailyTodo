import fs from 'node:fs';
import path from 'node:path';

export interface FileStamp {
  size: number;
  mtimeMs: number;
}

export interface ReadResult {
  content: string;
  stamp: FileStamp | null; // null = 文件不存在
}

export function readWithStamp(filePath: string): ReadResult {
  if (!fs.existsSync(filePath)) return { content: '', stamp: null };
  const stat = fs.statSync(filePath);
  if (!stat.isFile()) return { content: '', stamp: null };
  return { content: fs.readFileSync(filePath, 'utf-8'), stamp: { size: stat.size, mtimeMs: stat.mtimeMs } };
}

/** 仅当文件 size+mtime 与读取时一致才原子替换；否则报冲突、绝不覆盖。 */
export function atomicReplace(filePath: string, nextContent: string, expected: FileStamp | null): { ok: boolean; error?: string } {
  let tmp: string | null = null;
  try {
    if (fs.existsSync(filePath)) {
      const now = fs.statSync(filePath);
      if (!expected || now.size !== expected.size || now.mtimeMs !== expected.mtimeMs) {
        return { ok: false, error: '写入冲突：文件已被外部修改或重建（同步/Obsidian），放弃写入避免覆盖你的内容' };
      }
    } else if (expected) {
      return { ok: false, error: '文件已被外部删除，放弃写入' };
    }

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    tmp = path.join(path.dirname(filePath), `${path.basename(filePath)}.tmp-${process.pid}`);
    fs.writeFileSync(tmp, nextContent, 'utf-8');
    fs.renameSync(tmp, filePath); // 同目录 → 同分区 → 原子
    return { ok: true };
  } catch (error) {
    let cleanupErrorMessage: string | undefined;
    if (tmp) {
      try {
        fs.rmSync(tmp, { force: true });
      } catch (cleanupError) {
        cleanupErrorMessage = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
      }
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      error: cleanupErrorMessage ? `${errorMessage}; temporary cleanup failed: ${cleanupErrorMessage}` : errorMessage,
    };
  }
}
