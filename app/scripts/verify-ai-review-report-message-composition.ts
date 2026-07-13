import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = join(import.meta.dirname, '..');
const compositionPath = join(root, 'shared', 'aiReview', 'reportMessageComposition.ts');
const weeklyPath = join(root, 'shared', 'aiReview', 'weekly.ts');
const monthlyPath = join(root, 'shared', 'aiReview', 'monthly.ts');

assert(existsSync(compositionPath), 'AI review report message composition module should exist');

const composition = await import(pathToFileURL(compositionPath).href);
const messages = composition.buildReportMessages({
  system: 'system prompt',
  periodLabel: '周',
  period: '2026-W30',
  streakLabel: '连续天数',
  sourceLabel: '本周日记',
  sources: [{ label: '2026-07-21', content: '  completed work  ' }],
  stats: { activeDays: 4, totalCompleted: 6, totalTasks: 8, streak: 3 },
});

assert.deepEqual(messages, [
  { role: 'system', content: 'system prompt' },
  {
    role: 'user',
    content: '周：2026-W30\n确定性统计（以此为准）：\n- 活跃天数：4\n- 完成任务：6/8\n- 连续天数：3\n\n本周日记：\n### 2026-07-21\ncompleted work',
  },
], 'shared composition should preserve statistics, headings, source labels, and trimmed content');

const weekly = readFileSync(weeklyPath, 'utf8');
const monthly = readFileSync(monthlyPath, 'utf8');
assert.match(weekly, /buildReportMessages\(/, 'weekly report builder should delegate shared message composition');
assert.match(monthly, /buildReportMessages\(/, 'monthly report builder should delegate shared message composition');
assert.match(weekly, /streakLabel: '连续天数'/, 'weekly builder should retain its streak label');
assert.match(monthly, /streakLabel: '连续天数（截至月末）'/, 'monthly builder should retain its month-end streak label');
assert.match(weekly, /sourceLabel: '本周日记'/, 'weekly builder should retain its source heading');
assert.match(monthly, /sourceLabel: '本月输入'/, 'monthly builder should retain its source heading');

console.log('AI review report message composition verification passed.');
