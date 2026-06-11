import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const cwd = process.cwd();
const root = existsSync(join(cwd, 'app')) ? join(cwd, 'app') : cwd;
const sectionConfig = readFileSync(join(root, 'shared/aiReview/sectionConfig.ts'), 'utf8');

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

// T1: CustomBlock data structures exist
assert(sectionConfig.includes("export type RenderType"), 'RenderType type not defined');
assert(/export type RenderType\s*=\s*['"]text['"]\s*\|\s*['"]list['"]\s*\|\s*['"]table['"]\s*\|\s*['"]callout['"]\s*\|\s*['"]dataview['"]/.test(sectionConfig), 'RenderType union incomplete');
assert(sectionConfig.includes('export interface CustomBlock'), 'CustomBlock interface not defined');
assert(/id:\s*string/.test(sectionConfig), 'CustomBlock.id missing');
assert(/name:\s*string/.test(sectionConfig), 'CustomBlock.name missing');
assert(/aiGenerate:\s*boolean/.test(sectionConfig), 'CustomBlock.aiGenerate missing');
assert(/renderType:\s*RenderType/.test(sectionConfig), 'CustomBlock.renderType missing');
assert(/prompt:\s*string/.test(sectionConfig), 'CustomBlock.prompt missing');
assert(sectionConfig.includes('export interface FixedBlock'), 'FixedBlock interface not defined');
assert(sectionConfig.includes("id: 'work' | 'inspire' | 'tasks'"), 'FixedBlock.id union incorrect');
assert(sectionConfig.includes('export interface DailyTemplate'), 'DailyTemplate interface not defined');
assert(sectionConfig.includes('export interface ReportTemplate'), 'ReportTemplate interface not defined');

console.log('T1: CustomBlock data structures ✓');

// T2: Path template variable expansion
const pathTemplate = readFileSync(join(root, 'shared/pathTemplate.ts'), 'utf8');
assert(pathTemplate.includes('export function expandPathTemplate'), 'expandPathTemplate function not exported');
assert(/expandPathTemplate\([^)]*Date[^)]*\)/.test(pathTemplate), 'expandPathTemplate signature incorrect');

// Dynamic test
const pt = await import(pathToFileURL(join(root, 'shared/pathTemplate.ts')).href);
const d = new Date(2026, 5, 15, 10, 0, 0); // June 15, 2026 local time
const out = pt.expandPathTemplate('logs/daily/{{date}}.md', d);
assert(out === 'logs/daily/2026-06-15.md', `date variable expansion wrong, got: ${out}`);
const out2 = pt.expandPathTemplate('logs/weekly/{{year}}-W{{week}}.md', d);
assert(/^logs\/weekly\/2026-W\d{2}\.md$/.test(out2), `year/week variable expansion wrong, got: ${out2}`);
const out3 = pt.expandPathTemplate('logs/monthly/{{year}}-{{month}}.md', d);
assert(out3 === 'logs/monthly/2026-06.md', `year/month variable expansion wrong, got: ${out3}`);
// Unknown variable left as-is
const out4 = pt.expandPathTemplate('logs/{{unknown}}/{{date}}.md', d);
assert(out4 === 'logs/{{unknown}}/2026-06-15.md', `unknown variable should be preserved, got: ${out4}`);

console.log('T2: Path template variable expansion ✓');

// T3: Light anonymization
const blockDefaults = readFileSync(join(root, 'shared/templateBlockDefaults.ts'), 'utf8');
assert(blockDefaults.includes('export function lightAnonymize'), 'lightAnonymize not exported');

const bd = await import(pathToFileURL(join(root, 'shared/templateBlockDefaults.ts')).href);
const sample = '联系张三 13800138000,邮箱 zhang@example.com,项目代号 Apollo-X';
const redacted = bd.lightAnonymize(sample);
assert(redacted.includes('[人员]'), 'name not anonymized');
assert(redacted.includes('[联系方式]'), 'phone/email not anonymized');
assert(redacted.includes('[项目A]') || redacted.includes('[项目B]'), 'project code not anonymized');
assert(!redacted.includes('张三'), 'name still present');
assert(!redacted.includes('13800138000'), 'phone still present');
assert(!redacted.includes('zhang@example.com'), 'email still present');
// Non-sensitive content preserved
const noop = bd.lightAnonymize('这是普通文字,没有什么敏感信息。');
assert(noop === '这是普通文字,没有什么敏感信息。', 'normal text should pass through unchanged');

console.log('T3: Light anonymization ✓');

// T3b: Idempotency — running lightAnonymize twice should not change text
const bd2 = await import(pathToFileURL(join(root, 'shared/templateBlockDefaults.ts')).href);
const sensitive = '张三 13800138000 zhang@example.com 项目1';
const once = bd2.lightAnonymize(sensitive);
const twice = bd2.lightAnonymize(once);
assert(once === twice, `idempotency broken: first=${once} second=${twice}`);
// Already-anonymized text should pass through unchanged
const alreadyAnonymized = '[人员] [联系方式] [项目A]';
const passthrough = bd2.lightAnonymize(alreadyAnonymized);
assert(passthrough === alreadyAnonymized, `already-anonymized should be unchanged: got=${passthrough}`);

console.log('T3b: Light anonymization idempotency ✓');

// T4: Double-generation bug fix
const templateRenderer = readFileSync(join(root, 'shared/templateRenderer.ts'), 'utf8');
assert(templateRenderer.includes('export function renderDailyTemplate'), 'renderDailyTemplate not exported');
assert(templateRenderer.includes('export function renderReportTemplate'), 'renderReportTemplate not exported');

// Static check: old buildDailyNoteFromTemplate no longer writes AI content
const obsTpl = readFileSync(join(root, 'shared/obsidianTemplates.ts'), 'utf8');
const fnMatch = obsTpl.match(/export function buildDailyNoteFromTemplate[\s\S]*?\n\}/);
assert(fnMatch, 'buildDailyNoteFromTemplate function not found');
assert(!/AI 草稿/.test(fnMatch[0]), 'buildDailyNoteFromTemplate still contains "AI 草稿" text');
assert(!/🤖/.test(fnMatch[0]), 'buildDailyNoteFromTemplate still contains 🤖 emoji');

// Dynamic check: renderDailyTemplate writes empty marker, NO AI content
const tr = await import(pathToFileURL(join(root, 'shared/templateRenderer.ts')).href);
const dailyTpl = {
  fixedBlocks: [
    { id: 'work', displayName: '今日工作' },
    { id: 'inspire', displayName: '灵感随笔' },
    { id: 'tasks', displayName: '每日任务' },
  ],
  customBlocks: [
    { id: 'b1', name: '复盘', aiGenerate: true, renderType: 'text', prompt: '' },
  ],
};
const rendered = tr.renderDailyTemplate({
  template: dailyTpl,
  work: '今天写了点东西',
  inspiration: '想到一个 idea',
  tasks: '- [x] 任务A',
  date: '2026-06-11',
});
assert(rendered.includes('<!-- DAILYTODO:REVIEW:START -->'), 'review marker START missing');
assert(rendered.includes('<!-- DAILYTODO:REVIEW:END -->'), 'review marker END missing');
const markerBody = rendered.match(/<!-- DAILYTODO:REVIEW:START -->([\s\S]*?)<!-- DAILYTODO:REVIEW:END -->/);
assert(markerBody, 'marker pair incomplete');
assert(!markerBody![1].includes('🤖'), `marker body has AI draft, bug not fixed. Body: "${markerBody![1]}"`);
assert(!markerBody![1].match(/\S/), `marker body should be empty/whitespace, got: "${markerBody![1]}"`);

console.log('T4: Double-generation bug fix ✓');
