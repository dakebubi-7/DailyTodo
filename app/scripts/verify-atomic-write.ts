import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readWithStamp, atomicReplace } from '../electron/aiReview/atomicWrite';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dt-atomic-'));
const file = path.join(dir, 'note.md');
fs.writeFileSync(file, '原始内容', 'utf-8');

// 正常读 → 写
const snap = readWithStamp(file);
assert.equal(snap.content, '原始内容');
const directoryBackedPath = path.join(dir, 'directory-backed.md');
fs.mkdirSync(directoryBackedPath, { recursive: true });
let directoryBackedSnap: ReturnType<typeof readWithStamp> | undefined;
assert.doesNotThrow(() => {
  directoryBackedSnap = readWithStamp(directoryBackedPath);
}, 'readWithStamp should not throw when the target path is a directory');
assert.equal(directoryBackedSnap?.stamp, null, 'directory-backed paths should not produce file stamps');
assert.equal(directoryBackedSnap?.content, '', 'directory-backed paths should not produce file content');

const ok = atomicReplace(file, '新内容', snap.stamp);
assert.equal(ok.ok, true);
assert.equal(fs.readFileSync(file, 'utf-8'), '新内容');

// 冲突：拿旧 stamp，但文件被外部改动 → 拒绝写
const snap2 = readWithStamp(file);
fs.writeFileSync(file, '外部进程改的', 'utf-8'); // 模拟 Obsidian/同步盘
const conflict = atomicReplace(file, '我要覆盖', snap2.stamp);
assert.equal(conflict.ok, false);
assert.ok(conflict.error!.includes('冲突') || conflict.error!.includes('changed'));
assert.equal(fs.readFileSync(file, 'utf-8'), '外部进程改的', '冲突时绝不覆盖');


// 新建文件路径：文件不存在 + expected 为 null → 成功创建
const newFile = path.join(dir, 'sub', 'fresh.md');
const created = atomicReplace(newFile, '全新内容', null);
assert.equal(created.ok, true, 'null stamp + missing file → create');
assert.equal(fs.readFileSync(newFile, 'utf-8'), '全新内容');

const atomicWriteSource = fs.readFileSync(new URL('../electron/aiReview/atomicWrite.ts', import.meta.url), 'utf-8');
assert.ok(
  /fs\.renameSync\(tmp, filePath\)[\s\S]*catch \(error\)[\s\S]*fs\.rmSync\(tmp, \{ force: true \}\)/.test(atomicWriteSource),
  'atomicReplace should clean up the temporary file when rename/write replacement fails',
);
assert.ok(
  /temporary cleanup failed/.test(atomicWriteSource),
  'atomicReplace should preserve the original replacement error when temporary-file cleanup also fails',
);

// 文件被删除冲突：expected 有 stamp 但文件已不存在 → 拒绝，不创建
const toDelete = path.join(dir, 'gone.md');
fs.writeFileSync(toDelete, '即将删除', 'utf-8');
const goneStamp = readWithStamp(toDelete).stamp;
fs.rmSync(toDelete);
const deleted = atomicReplace(toDelete, '复活', goneStamp);
assert.equal(deleted.ok, false, 'stamp present + file deleted → refuse');
assert.equal(fs.existsSync(toDelete), false, '拒绝时不应创建文件');

fs.rmSync(dir, { recursive: true, force: true });
console.log('Atomic write verification passed');
