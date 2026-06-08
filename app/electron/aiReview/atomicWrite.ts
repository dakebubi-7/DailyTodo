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
  return { content: fs.readFileSync(filePath, 'utf-8'), stamp: { size: stat.size, mtimeMs: stat.mtimeMs } };
}

/** 仅当文件 size+mtime 与读取时一致才原子替换；否则报冲突、绝不覆盖。 */
export function atomicReplace(filePath: string, nextContent: string, expected: FileStamp | null): { ok: boolean; error?: string } {
  try {
    if (fs.existsSync(filePath)) {
      const now = fs.statSync(filePath);
      if (!expected || now.size !== expected.size || now.mtimeMs !== expected.mtimeMs) {
        return { ok: false, error: '文件已被外部修改（同步/Obsidian），放弃写入避免冲突' };
      }
    } else if (expected) {
      return { ok: false, error: '文件已被外部删除，放弃写入' };
    }

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const tmp = path.join(path.dirname(filePath), `${path.basename(filePath)}.tmp-${process.pid}`);
    fs.writeFileSync(tmp, nextContent, 'utf-8');
    fs.renameSync(tmp, filePath); // 同目录 → 同分区 → 原子
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
