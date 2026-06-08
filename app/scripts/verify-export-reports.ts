import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  generatePersonalWeekly,
  generatePersonalMonthly,
  generateExternalReport,
  composeReportContent,
} from '../electron/aiReview/exportReports';
import { buildMonthlyMessages } from '../shared/aiReview/monthly';

// === composeReportContent：模型自带 frontmatter 时不叠加 app frontmatter ===
const withFm = composeReportContent(
  '---\ntitle: "app"\n---',
  '---\n类型: 周报\n周期: 2026-W23\n---\n\n# 正文\n内容',
);
assert.ok(withFm.includes('类型: 周报'), '保留模型 frontmatter');
assert.ok(!withFm.includes('title: "app"'), '不叠加 app frontmatter');
assert.equal(withFm.indexOf('---'), 0, '文件以模型 frontmatter 开头');
assert.ok(withFm.includes('AI 草稿'), '草稿提示注入');
assert.ok(withFm.indexOf('AI 草稿') > withFm.indexOf('类型: 周报'), '草稿提示在 frontmatter 之后');
assert.ok(withFm.indexOf('# 正文') > withFm.indexOf('AI 草稿'), '正文在草稿提示之后');

// 不带 frontmatter → 用 app frontmatter
const noFm = composeReportContent('---\ntitle: "app"\n---', '# 正文\n内容');
assert.ok(noFm.startsWith('---\ntitle: "app"\n---'), '无 frontmatter 时用 app 的');
assert.ok(noFm.includes('AI 草稿') && noFm.includes('# 正文'));

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

// 个人月报 → logs/monthly-review/
const monthly = await generatePersonalMonthly({
  vaultPath: vault,
  month: '2026-06',
  sources: [{ label: '2026-W23 周报', content: '第一周 X' }],
  stats: { start: '2026-06-01', end: '2026-06-30', activeDays: 5, totalCompleted: 3, totalTasks: 4, streak: 2 },
  callLlm: async () => ({ ok: true, content: '# 月报\n月度概览' }),
});
assert.equal(monthly.ok, true);
assert.ok(monthly.filePath!.includes(path.join('logs', 'monthly-review')), '月报落 logs/monthly-review');
assert.ok(fs.readFileSync(monthly.filePath!, 'utf-8').includes('月度概览'));

// 自定义目录：relativeDir 覆盖默认
const customWeekly = await generatePersonalWeekly({
  vaultPath: vault, weekKey: '2026-W25', dailyContents: [{ date: '2026-06-15', content: 'Y' }],
  stats: { start: '2026-06-15', end: '2026-06-21', activeDays: 1, totalCompleted: 1, totalTasks: 1, streak: 1 },
  relativeDir: 'custom/wk',
  callLlm: async () => ({ ok: true, content: '自定义目录周报' }),
});
assert.equal(customWeekly.ok, true);
assert.ok(customWeekly.filePath!.includes(path.join('custom', 'wk')), 'relativeDir 覆盖输出目录');
assert.ok(!customWeekly.filePath!.includes(path.join('logs', 'weekly-review')), '不再落默认目录');

// 对外周报 → exports/weekly-reports/，脱敏在调 LLM 前完成
let sawInPrompt = '';
const external = await generateExternalReport({
  vaultPath: vault,
  kind: 'weekly',
  periodKey: '2026-W23',
  rawDailyContents: [
    '## 今日工作\n<!-- tag: work -->\n对外项目进展',
    '## 灵感\n<!-- tag: private -->\n私人秘密',
  ],
  buildMessages: (redacted) => {
    sawInPrompt = redacted;
    return buildMonthlyMessages({ month: 'x', sources: [{ label: 'x', content: redacted }], stats: { start: '', end: '', activeDays: 0, totalCompleted: 0, totalTasks: 0, streak: 0 } });
  },
  callLlm: async () => ({ ok: true, content: '对外周报正文' }),
});
assert.equal(external.ok, true);
assert.ok(external.filePath!.includes(path.join('exports', 'weekly-reports')), '对外稿落 exports/，物理隔离');

// 对外报自定义目录
const extCustom = await generateExternalReport({
  vaultPath: vault, kind: 'weekly', periodKey: '2026-W26',
  rawDailyContents: ['## 工作\n<!-- tag: work -->\nZ'],
  relativeDir: 'out/ext',
  buildMessages: (r) => [{ role: 'user', content: r }],
  callLlm: async () => ({ ok: true, content: '自定义对外周报' }),
});
assert.equal(extCustom.ok, true);
assert.ok(extCustom.filePath!.includes(path.join('out', 'ext')), '对外报 relativeDir 覆盖');
assert.ok(sawInPrompt.includes('对外项目进展'), 'work 内容进入 prompt');
assert.ok(!sawInPrompt.includes('私人秘密'), '脱敏在调 LLM 前完成：private 不进 prompt');
assert.ok(fs.readFileSync(external.filePath!, 'utf-8').includes('needs-review'), '对外稿标注需复核');

// 对外报 LLM 失败 → 不写
const extFail = await generateExternalReport({
  vaultPath: vault, kind: 'monthly', periodKey: '2026-06',
  rawDailyContents: ['## 工作\n#work\nX'],
  buildMessages: (r) => [{ role: 'user', content: r }],
  callLlm: async () => ({ ok: false, error: 'x' }),
});
assert.equal(extFail.ok, false);
assert.equal(fs.existsSync(path.join(vault, 'exports', 'monthly-reports', '2026-06.md')), false);

fs.rmSync(vault, { recursive: true, force: true });
console.log('Export reports verification passed');
