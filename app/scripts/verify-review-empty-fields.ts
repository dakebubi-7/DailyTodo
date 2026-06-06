import { strict as assert } from 'node:assert';
import { buildTaskLines } from '../shared/obsidianTemplates';
import { createDefaultObsidianTemplateSettings } from '../shared/appSettings';
import type { Task } from '../src/types/task';

const templates = createDefaultObsidianTemplateSettings();
const date = '2026-06-03';

function makeTask(review: Partial<Task['completionReviews'] extends (infer R)[] | undefined ? R : never>): Task {
  return {
    id: 'task-1',
    text: '示例任务',
    completed: true,
    priority: 'medium',
    createdAt: `${date}T08:00:00.000Z`,
    taskDate: date,
    isToday: true,
    completionReviews: [
      {
        id: 'r1',
        status: 'partial',
        percent: 80,
        summary: '',
        unknowns: '',
        nextStep: '',
        reviewedAt: `${date}T09:00:00.000Z`,
        ...review,
      },
    ],
  };
}

// 只填「下一步」：Obsidian 只写首行 + 下一步行，summary/unknowns 行被跳过。
{
  const lines = buildTaskLines([makeTask({ nextStep: '明天先复盘' })], date, templates);
  const text = lines.join('\n');
  assert.ok(text.includes('下一步：明天先复盘'), '应写入下一步行');
  assert.ok(!text.includes('今天情况：'), '空的今天情况行应被跳过');
  assert.ok(!text.includes('还没懂/卡点：'), '空的卡点行应被跳过');
  assert.ok(text.includes('阶段记录 1'), '首行恒保留');
}

// 三个明细字段全填：三行都在。
{
  const lines = buildTaskLines(
    [makeTask({ summary: '跑通了', unknowns: '打包', nextStep: '整理文档' })],
    date,
    templates,
  );
  const text = lines.join('\n');
  assert.ok(text.includes('今天情况：跑通了'), '今天情况应写入');
  assert.ok(text.includes('还没懂/卡点：打包'), '卡点应写入');
  assert.ok(text.includes('下一步：整理文档'), '下一步应写入');
}

// 三个都不填：只剩首行。
{
  const lines = buildTaskLines([makeTask({})], date, templates);
  const text = lines.join('\n');
  assert.ok(text.includes('阶段记录 1'), '首行保留');
  assert.ok(!text.includes('今天情况：'), '空字段行不写入');
  assert.ok(!text.includes('还没懂/卡点：'), '空字段行不写入');
  assert.ok(!text.includes('下一步：'), '空字段行不写入');
}

// 纯空白也视为空（trim 后为空）。
{
  const lines = buildTaskLines([makeTask({ summary: '   ', nextStep: '\n\t ' })], date, templates);
  const text = lines.join('\n');
  assert.ok(!text.includes('今天情况：'), '纯空白的今天情况行应跳过');
  assert.ok(!text.includes('下一步：'), '纯空白的下一步行应跳过');
}

console.log('review empty-field filtering verified');
