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

const exportReportsSource = fs.readFileSync(
  new URL('../electron/aiReview/exportReports.ts', import.meta.url),
  'utf8',
);
const templateGenerationUrl = new URL('../electron/aiReview/templateReportGeneration.ts', import.meta.url);
const reportOutputUrl = new URL('../electron/aiReview/reportOutput.ts', import.meta.url);
assert.equal(
  fs.existsSync(reportOutputUrl),
  true,
  'report output mechanics should live in a dedicated module.',
);
const reportOutputSource = fs.readFileSync(reportOutputUrl, 'utf8');
assert.equal(
  fs.existsSync(templateGenerationUrl),
  true,
  'template-aware report generation should live in a dedicated module.',
);
const templateGenerationSource = fs.readFileSync(templateGenerationUrl, 'utf8');
assert.match(
  reportOutputSource,
  /export async function writeReport\b/,
  'the output module should own atomic report writes.',
);
assert.match(
  reportOutputSource,
  /export function resolveReportFilePath\b/,
  'the output module should own vault-contained report path resolution.',
);
assert.match(
  reportOutputSource,
  /export function buildPersonalReportFrontmatter\b/,
  'the output module should own report frontmatter formatting.',
);
assert.match(
  exportReportsSource,
  /export \{[^}]*composeReportContent[^}]*\} from '\.\/reportOutput';/,
  'the generation facade should preserve composeReportContent through the output module.',
);
assert.match(
  exportReportsSource,
  /export type \{[^}]*ReportResult[^}]*\} from '\.\/reportOutput';/,
  'the generation facade should preserve ReportResult through the output module.',
);
assert.match(
  templateGenerationSource,
  /export async function generateTemplateBackedReport\b/,
  'template generation module should define the shared template-aware report helper.',
);
assert.equal(
  (exportReportsSource.match(/return generateTemplateBackedReport\(\{/g) ?? []).length,
  3,
  'weekly, monthly, and external report generation should all delegate through the shared template-aware report helper.',
);
assert.match(
  templateGenerationSource,
  /const sourceParts: string\[\] = \[\];\s*\n\s*let systemPrompt = '';\s*\n\s*for \(const message of messages\)/,
  'template-backed reports should collect the system prompt and user source content in one message traversal.',
);
assert.match(
  templateGenerationSource,
  /let truncated = false;\s*\n\s*for \(const \{ llm \} of blockResults\)/,
  'template-backed reports should detect failures and truncation in one result traversal before rendering.',
);
assert.doesNotMatch(
  templateGenerationSource,
  /const failed = blockResults\.find\(\(\{ llm \}\) => !llm\.ok\);[\s\S]*?const truncated = blockResults\.some\(/,
  'template-backed reports should not separately scan the completed block results for failure and truncation.',
);
assert.match(
  exportReportsSource,
  /const redactedParts: string\[\] = \[\];[\s\S]*?for \(const content of params\.rawDailyContents\) \{[\s\S]*?const redactedPart = redactForExport\(content\);[\s\S]*?if \(redactedPart\) redactedParts\.push\(redactedPart\);[\s\S]*?const redacted = redactedParts\.join\('\\n\\n'\);/,
  'external reports should redact and collect non-empty daily content in one traversal.',
);
assert.doesNotMatch(
  exportReportsSource,
  /params\.rawDailyContents\.map\(\(c\) => redactForExport\(c\)\)\.filter\(Boolean\)\.join\('\n\n'\)/,
  'external reports should not allocate map and filter arrays while assembling redacted content.',
);
assert.match(
  exportReportsSource,
  /reportTemplate:\s*params\.reportTemplate,\s*\n\s*buildMessages:\s*\(\)\s*=> buildWeeklyMessages\(params\)/s,
  'personal weekly report generation should build weekly messages through the shared helper callback.',
);
assert.match(
  exportReportsSource,
  /reportTemplate:\s*params\.reportTemplate,\s*\n\s*buildMessages:\s*\(\)\s*=> buildMonthlyMessages\(params\)/s,
  'personal monthly report generation should build monthly messages through the shared helper callback.',
);
assert.match(
  exportReportsSource,
  /reportTemplate:\s*params\.reportTemplate,\s*\n\s*buildMessages:\s*\(\)\s*=> params\.buildMessages\(redacted\)/s,
  'external report generation should build redacted export messages through the shared helper callback.',
);

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

const fileBackedWeeklyDirVault = fs.mkdtempSync(path.join(os.tmpdir(), 'dt-weekly-file-dir-'));
fs.mkdirSync(path.join(fileBackedWeeklyDirVault, 'logs'), { recursive: true });
const occupiedWeeklyDirPath = path.join(fileBackedWeeklyDirVault, 'logs', 'weekly-review');
fs.writeFileSync(occupiedWeeklyDirPath, 'occupied by file', 'utf-8');
let fileBackedWeeklyDirThrew = false;
let fileBackedWeeklyDirResult: Awaited<ReturnType<typeof generatePersonalWeekly>> | undefined;
try {
  fileBackedWeeklyDirResult = await generatePersonalWeekly({
    vaultPath: fileBackedWeeklyDirVault,
    weekKey: '2026-W23',
    dailyContents: [{ date: '2026-06-07', content: '?? X' }],
    stats: { start: '2026-06-01', end: '2026-06-07', activeDays: 1, totalCompleted: 1, totalTasks: 1, streak: 1 },
    callLlm: async () => ({ ok: true, content: '# weekly\\nsummary' }),
  });
} catch {
  fileBackedWeeklyDirThrew = true;
}
assert.equal(
  fileBackedWeeklyDirThrew,
  false,
  'weekly report generation should return a structured failure instead of throwing when the output directory path is occupied by a file',
);
assert.equal(
  fileBackedWeeklyDirResult?.ok,
  false,
  'weekly report generation should fail explicitly when the output directory path is occupied by a file',
);
assert.match(
  fileBackedWeeklyDirResult?.error ?? '',
  /weekly-review|EEXIST|mkdir/i,
  'weekly report generation should surface the blocked output directory path in the error',
);
assert.equal(
  fs.readFileSync(occupiedWeeklyDirPath, 'utf-8'),
  'occupied by file',
  'weekly report generation should not overwrite a file occupying the output directory path',
);
assert.equal(
  fs.existsSync(path.join(fileBackedWeeklyDirVault, 'logs', 'weekly-review', '2026-W23.md')),
  false,
  'weekly report generation should not create a report file beneath a file-backed output directory path',
);


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

// Template-center paths represent the complete report filename, not a directory.
const templatePathWeekly = await generatePersonalWeekly({
  vaultPath: vault, weekKey: '2026-W26', dailyContents: [{ date: '2026-06-22', content: 'Z' }],
  stats: { start: '2026-06-22', end: '2026-06-28', activeDays: 1, totalCompleted: 1, totalTasks: 1, streak: 1 },
  relativeFilePath: 'reports/personal/2026-W26.md',
  callLlm: async () => ({ ok: true, content: 'template path weekly' }),
});
assert.equal(templatePathWeekly.ok, true);
assert.equal(
  templatePathWeekly.filePath,
  path.join(vault, 'reports', 'personal', '2026-W26.md'),
  'a complete template-derived report path should not append the period key a second time',
);

let templateBlockCalls = 0;
const templateBackedWeekly = await generatePersonalWeekly({
  vaultPath: vault,
  weekKey: '2026-W28',
  dailyContents: [{ date: '2026-07-06', content: 'template-backed source' }],
  stats: { start: '2026-07-06', end: '2026-07-12', activeDays: 1, totalCompleted: 1, totalTasks: 1, streak: 1 },
  reportTemplate: {
    customBlocks: [
      { id: 'summary', name: 'Summary', aiGenerate: true, renderType: 'text', prompt: 'Summarize the week.' },
      { id: 'plan', name: 'Plan', aiGenerate: true, renderType: 'list', prompt: 'List next steps.' },
      { id: 'disabled', name: 'Disabled', aiGenerate: false, renderType: 'text', prompt: '' },
    ],
  },
  callLlm: async () => {
    templateBlockCalls += 1;
    return { ok: true, content: templateBlockCalls === 1 ? 'weekly summary' : '- next step' };
  },
});
assert.equal(templateBackedWeekly.ok, true, 'template-backed weekly report should be generated.');
assert.equal(templateBlockCalls, 2, 'template-backed weekly report should call the LLM once for each enabled block.');
const templateBackedContent = fs.readFileSync(templateBackedWeekly.filePath!, 'utf-8');
assert.match(templateBackedContent, /## Summary\s+weekly summary/, 'template-backed weekly report should render the first block heading and content.');
assert.match(templateBackedContent, /## Plan\s+- next step/, 'template-backed weekly report should render list blocks.');
assert.doesNotMatch(templateBackedContent, /Disabled/, 'template-backed weekly report should omit disabled blocks.');

const parallelTemplateVault = fs.mkdtempSync(path.join(os.tmpdir(), 'dt-parallel-template-'));
const pendingTemplateBlocks: Array<() => void> = [];
let startedTemplateBlocks = 0;
const parallelTemplateGeneration = generatePersonalWeekly({
  vaultPath: parallelTemplateVault,
  weekKey: '2026-W29',
  dailyContents: [{ date: '2026-07-13', content: 'parallel template source' }],
  stats: { start: '2026-07-13', end: '2026-07-19', activeDays: 1, totalCompleted: 1, totalTasks: 1, streak: 1 },
  reportTemplate: {
    customBlocks: [
      { id: 'first', name: 'First', aiGenerate: true, renderType: 'text', prompt: 'First block.' },
      { id: 'second', name: 'Second', aiGenerate: true, renderType: 'text', prompt: 'Second block.' },
    ],
  },
  callLlm: async () => new Promise((resolve) => {
    startedTemplateBlocks += 1;
    const blockIndex = startedTemplateBlocks;
    pendingTemplateBlocks.push(() => resolve({ ok: true, content: `block ${blockIndex}` }));
  }),
});
await Promise.resolve();
assert.equal(startedTemplateBlocks, 2, 'template-backed report generation should start all enabled block requests in parallel.');
pendingTemplateBlocks.forEach((resolve) => resolve());
const parallelTemplateResult = await parallelTemplateGeneration;
assert.equal(parallelTemplateResult.ok, true, 'parallel template-backed report generation should complete successfully.');
const parallelTemplateContent = fs.readFileSync(parallelTemplateResult.filePath!, 'utf-8');
assert.match(parallelTemplateContent, /## First\s+block 1/, 'parallel block output should retain the template order.');
assert.match(parallelTemplateContent, /## Second\s+block 2/, 'parallel block output should retain the template order.');

// 对外周报 → exports/weekly-reports/，脱敏在调 LLM 前完成

await assert.rejects(
  () => generatePersonalWeekly({
    vaultPath: vault,
    weekKey: '2026-W27',
    dailyContents: [{ date: '2026-06-22', content: 'outside' }],
    stats: { start: '2026-06-22', end: '2026-06-28', activeDays: 1, totalCompleted: 1, totalTasks: 1, streak: 1 },
    relativeDir: '../outside-export',
    callLlm: async () => ({ ok: true, content: 'should not write outside vault' }),
  }),
  /escapes|relative to the vault/i,
  'report output relativeDir must not escape the selected vault.',
);

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
