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

fs.rmSync(dir, { recursive: true, force: true });
console.log('Atomic write verification passed');
