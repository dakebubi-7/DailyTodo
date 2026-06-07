import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { generatePersonalWeekly } from '../electron/aiReview/exportReports';

const vault = fs.mkdtempSync(path.join(os.tmpdir(), 'dt-weekly-'));
const out = await generatePersonalWeekly({
  vaultPath: vault,
  weekKey: '2026-W23',
  dailyContents: [{ date: '2026-06-07', content: '做了 X' }],
  stats: { start: '2026-06-01', end: '2026-06-07', activeDays: 1, totalCompleted: 1, totalTasks: 1, streak: 1 },
  callLlm: async () => ({ ok: true, content: '# 周报\n本周概览' }),
});
assert.equal(out.ok, true);
assert.ok(out.filePath!.includes(path.join('logs', 'weekly-review')), '写入 logs/weekly-review 隔离目录');
const written = fs.readFileSync(out.filePath!, 'utf-8');
assert.ok(written.includes('本周概览'), 'LLM 内容写入');
assert.ok(written.includes('AI 草稿'), '标注 AI 草稿');
assert.ok(written.includes('2026-W23'), '周键写入 frontmatter');

// LLM 失败 → ok:false，不写文件
const failed = await generatePersonalWeekly({
  vaultPath: vault,
  weekKey: '2026-W24',
  dailyContents: [],
  stats: { start: '2026-06-08', end: '2026-06-14', activeDays: 0, totalCompleted: 0, totalTasks: 0, streak: 0 },
  callLlm: async () => ({ ok: false, error: '无 key' }),
});
assert.equal(failed.ok, false);
assert.equal(fs.existsSync(path.join(vault, 'logs', 'weekly-review', '2026-W24.md')), false, 'LLM 失败不写文件');

fs.rmSync(vault, { recursive: true, force: true });
console.log('Export reports verification passed');
