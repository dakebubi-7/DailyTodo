import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createDefaultDailyTemplate,
  createDefaultReportTemplate,
} from '../shared/aiReview/sectionConfigDefaultTemplates';

const daily = createDefaultDailyTemplate();
assert.deepEqual(daily.fixedBlocks.map((block) => block.id), ['work', 'inspire', 'tasks']);
assert.deepEqual(daily.customBlocks.map((block) => [block.name, block.renderType]), [
  ['复盘', 'text'],
  ['明日待办', 'list'],
  ['可复用知识', 'text'],
]);
assert.deepEqual(daily.blockOrder.map((item) => item.type), ['fixed', 'fixed', 'fixed', 'custom', 'custom', 'custom']);

const dailyAgain = createDefaultDailyTemplate();
assert.notEqual(daily.customBlocks[0]?.id, dailyAgain.customBlocks[0]?.id, 'daily defaults should allocate fresh block IDs for every call.');

const expectedReportBlocks = {
  personalWeekly: ['本周工作总结', '本周完成任务', '本周灵感汇总', '下周计划'],
  personalMonthly: ['本月工作总结', '本月完成任务', '本月灵感汇总', '本月复盘', '下月计划'],
  externalWeekly: ['本周工作概览', '关键交付', '下周计划'],
  externalMonthly: ['本月工作概览', '关键交付', '下月计划'],
} as const;

for (const [kind, names] of Object.entries(expectedReportBlocks) as Array<[keyof typeof expectedReportBlocks, readonly string[]]>) {
  const report = createDefaultReportTemplate(kind);
  assert.deepEqual(report.customBlocks.map((block) => block.name), names, `${kind} should preserve its default block catalog.`);
  assert.notEqual(
    report.customBlocks[0]?.id,
    createDefaultReportTemplate(kind).customBlocks[0]?.id,
    `${kind} defaults should allocate fresh block IDs for every call.`,
  );
}

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const defaultsSource = readFileSync(join(root, 'shared/aiReview/sectionConfigDefaultTemplates.ts'), 'utf8');
const sectionConfigSource = readFileSync(join(root, 'shared/aiReview/sectionConfig.ts'), 'utf8');

assert.match(defaultsSource, /export function createDefaultDailyTemplate\b/, 'default template module should own daily-template construction.');
assert.match(defaultsSource, /export function createDefaultReportTemplate\b/, 'default template module should own report-template construction.');
assert.match(sectionConfigSource, /from '\.\/sectionConfigDefaultTemplates'/, 'section config should compose the default-template module.');
assert.doesNotMatch(sectionConfigSource, /export function createDefaultDailyTemplate\b/, 'section config should delegate daily-template construction.');
assert.doesNotMatch(sectionConfigSource, /export function createDefaultReportTemplate\b/, 'section config should delegate report-template construction.');

console.log('Section config default-template verification passed');
