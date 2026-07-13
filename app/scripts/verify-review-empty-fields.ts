import { strict as assert } from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTaskLines } from '../shared/obsidianTemplates';
import { createDefaultObsidianTemplateSettings } from '../shared/appSettings';
import { getCompletionReviews, isTaskCompletionReviewStatus } from '../shared/completionReviews';
import type { Task } from '../src/types/task';

const templates = createDefaultObsidianTemplateSettings();
const date = '2026-06-03';
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const taskReviewDialogSource = readFileSync(join(root, 'src/components/TaskReviewDialog.tsx'), 'utf8');

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
  assert.ok(text.includes('下一步: 明天先复盘'), '应写入下一步行');
  assert.ok(!text.includes('完成情况:'), '空的完成情况行应被跳过');
  assert.ok(!text.includes('卡点/未知:'), '空的卡点行应被跳过');
  assert.ok(text.includes('完成记录 1'), '首行恒保留');
}

// 三个明细字段全填：三行都在。
{
  const lines = buildTaskLines(
    [makeTask({ summary: '跑通了', unknowns: '打包', nextStep: '整理文档' })],
    date,
    templates,
  );
  const text = lines.join('\n');
  assert.ok(text.includes('完成情况: 跑通了'), '完成情况应写入');
  assert.ok(text.includes('卡点/未知: 打包'), '卡点应写入');
  assert.ok(text.includes('下一步: 整理文档'), '下一步应写入');
}

// 三个都不填：只剩首行。
{
  const lines = buildTaskLines([makeTask({})], date, templates);
  const text = lines.join('\n');
  assert.ok(text.includes('完成记录 1'), '首行保留');
  assert.ok(!text.includes('完成情况:'), '空字段行不写入');
  assert.ok(!text.includes('卡点/未知:'), '空字段行不写入');
  assert.ok(!text.includes('下一步:'), '空字段行不写入');
}

// 纯空白也视为空（trim 后为空）。
{
  const lines = buildTaskLines([makeTask({ summary: '   ', nextStep: '\n\t ' })], date, templates);
  const text = lines.join('\n');
  assert.ok(!text.includes('完成情况:'), '纯空白的完成情况行应跳过');
  assert.ok(!text.includes('下一步:'), '纯空白的下一步行应跳过');
}

// review 列表应按 reviewedAt 升序返回，避免阶段记录顺序受持久化数组顺序污染。
{
  const task: Task = {
    id: 'task-ordered',
    text: '顺序测试任务',
    completed: true,
    priority: 'medium',
    createdAt: `${date}T08:00:00.000Z`,
    taskDate: date,
    isToday: true,
    completionReviews: [
      {
        id: 'review-newest',
        status: 'done',
        percent: 100,
        summary: '第三次',
        unknowns: '',
        nextStep: '',
        reviewedAt: `${date}T11:00:00.000Z`,
      },
      {
        id: 'review-oldest',
        status: 'partial',
        percent: 20,
        summary: '第一次',
        unknowns: '',
        nextStep: '',
        reviewedAt: `${date}T09:00:00.000Z`,
      },
      {
        id: 'review-middle',
        status: 'partial',
        percent: 60,
        summary: '第二次',
        unknowns: '',
        nextStep: '',
        reviewedAt: `${date}T10:00:00.000Z`,
      },
    ],
  };

  assert.deepEqual(
    getCompletionReviews(task).map((review) => review.id),
    ['review-oldest', 'review-middle', 'review-newest'],
    'getCompletionReviews should return reviews in chronological order by reviewedAt',
  );

  const text = buildTaskLines([task], date, templates).join('\n');
  assert.ok(
    text.indexOf('完成情况: 第一次') < text.indexOf('完成情况: 第二次')
      && text.indexOf('完成情况: 第二次') < text.indexOf('完成情况: 第三次'),
    'buildTaskLines should render completion review blocks in chronological order',
  );
}

assert.ok(
  taskReviewDialogSource.includes("import { getCompletionReviews } from '../../shared/completionReviews';"),
  'TaskReviewDialog should reuse the shared completion review helper instead of inlining review array selection.',
);
assert.ok(
  taskReviewDialogSource.includes('const reviews = getCompletionReviews(task);'),
  'TaskReviewDialog should derive displayed reviews through the shared completion review helper.',
);


const completionReviewsSource = readFileSync(join(root, 'shared/completionReviews.ts'), 'utf8');
const taskCompletionDialogSource = readFileSync(join(root, 'src/components/TaskCompletionDialog.tsx'), 'utf8');
const reviewViewSource = readFileSync(join(root, 'src/components/ReviewView.tsx'), 'utf8');
const reviewGroupingPath = join(root, 'src/components/reviewView/reviewGrouping.ts');
const reviewRecordBlockPath = join(root, 'src/components/reviewView/ReviewRecordBlock.tsx');

assert.ok(existsSync(reviewGroupingPath), 'ReviewView should delegate date/task grouping to reviewView/reviewGrouping.ts.');
assert.ok(existsSync(reviewRecordBlockPath), 'ReviewView should delegate record editing and display to reviewView/ReviewRecordBlock.tsx.');

const reviewGroupingSource = readFileSync(reviewGroupingPath, 'utf8');
const reviewRecordBlockSource = readFileSync(reviewRecordBlockPath, 'utf8');

assert.ok(
  completionReviewsSource.includes('export function isTaskCompletionReviewStatus'),
  'shared completionReviews should export isTaskCompletionReviewStatus runtime guard.',
);

// Runtime guard behavior
assert.equal(isTaskCompletionReviewStatus('done'), true);
assert.equal(isTaskCompletionReviewStatus('partial'), true);
assert.equal(isTaskCompletionReviewStatus('blocked'), true);
assert.equal(isTaskCompletionReviewStatus('complete'), false);
assert.equal(isTaskCompletionReviewStatus(null), false);
assert.equal(isTaskCompletionReviewStatus(1), false);

assert.ok(
  taskCompletionDialogSource.includes("from '../../shared/completionReviews'") ||
    taskCompletionDialogSource.includes('isTaskCompletionReviewStatus'),
  'TaskCompletionDialog should use the shared completion-review status guard.',
);
assert.ok(
  taskCompletionDialogSource.includes('isTaskCompletionReviewStatus(event.target.value)'),
  'TaskCompletionDialog should narrow status select values with isTaskCompletionReviewStatus.',
);
assert.ok(
  !taskCompletionDialogSource.includes("event.target.value as TaskCompletionReview['status']"),
  'TaskCompletionDialog should not cast status select values.',
);

assert.ok(
  reviewRecordBlockSource.includes('isTaskCompletionReviewStatus'),
  'Review record editing should use the shared completion-review status guard.',
);
assert.ok(
  reviewRecordBlockSource.includes('isTaskCompletionReviewStatus(e.target.value)') ||
    reviewRecordBlockSource.includes('isTaskCompletionReviewStatus(event.target.value)'),
  'Review record editing should narrow status select values with isTaskCompletionReviewStatus.',
);
assert.ok(
  !reviewRecordBlockSource.includes("e.target.value as TaskCompletionReview['status']") &&
    !reviewRecordBlockSource.includes("event.target.value as TaskCompletionReview['status']"),
  'Review record editing should not cast status select values.',
);

assert.match(
  reviewGroupingSource,
  /const taskRecords = taskGroups\.get\(record\.task\.id\);\s*if \(taskRecords\) taskRecords\.push\(record\);\s*else taskGroups\.set\(record\.task\.id, \[record\]\);/,
  'Review grouping helper should append records directly to each date/task bucket without copying the existing bucket.',
);
assert.doesNotMatch(
  reviewGroupingSource,
  /const dayRecords = byDate\.get\(date\)!\.sort/,
  'Review grouping helper should not sort a full date record list before grouping by task.',
);
assert.doesNotMatch(
  reviewGroupingSource,
  /taskGroups\.set\(record\.task\.id, \[\.\.\.\(taskGroups\.get\(record\.task\.id\) \|\| \[\]\), record\]\)/,
  'Review grouping helper should not allocate a replacement task array per record.',
);
assert.match(
  reviewGroupingSource,
  /const dateTaskGroups = new Map<string, Map<string, ReviewRecord\[\]>>\(\);/,
  'Review grouping helper should use nested date/task buckets while it discovers records.',
);
assert.doesNotMatch(
  reviewGroupingSource,
  /const records: ReviewRecord\[\] = \[\];[\s\S]*?records\.forEach\(\(record\) => \{/,
  'Review grouping helper should not retain a full intermediate review-record array before date grouping.',
);
assert.doesNotMatch(
  reviewGroupingSource,
  /\.slice\(\)\.sort\(/,
  'Review grouping helper should not copy record buckets solely to sort their local records.',
);
assert.ok(
  reviewViewSource.includes("from './reviewView/reviewGrouping'"),
  'ReviewView should import review date grouping helpers from the extracted module.',
);
assert.ok(
  reviewViewSource.includes("from './reviewView/ReviewRecordBlock'"),
  'ReviewView should render records through the extracted ReviewRecordBlock component.',
);
assert.doesNotMatch(
  reviewViewSource,
  /const appendRecordToDate = \(record: ReviewRecord\) => \{/,
  'ReviewView should not inline review date-bucket grouping after extraction.',
);
assert.doesNotMatch(
  reviewViewSource,
  /function ReviewRecordBlock\(/,
  'ReviewView should not inline review record editing and display after extraction.',
);
assert.ok(
  reviewViewSource.split(/\r?\n/).length < 300,
  'ReviewView.tsx should stay below 300 lines after extracting grouping helpers.',
);
assert.ok(
  reviewGroupingSource.includes('export function buildReviewDateGroups'),
  'Review grouping helper should export buildReviewDateGroups for the ReviewView shell.',
);
assert.ok(
  reviewGroupingSource.includes('export function localDateKey'),
  'Review grouping helper should export localDateKey for ReviewView date labels.',
);
assert.ok(
  reviewGroupingSource.includes('export function groupLabel'),
  'Review grouping helper should export groupLabel for ReviewView date labels.',
);
assert.ok(
  reviewGroupingSource.includes('export function formatTime'),
  'Review grouping helper should export formatTime for record timestamps.',
);
assert.match(
  reviewRecordBlockSource,
  /export function ReviewRecordBlock\b/,
  'Review record block module should export the record editor/display component.',
);
assert.match(
  reviewRecordBlockSource,
  /isTaskCompletionReviewStatus\((?:e|event)\.target\.value\)/,
  'Review record block should preserve runtime status narrowing for its edit control.',
);
assert.match(
  reviewRecordBlockSource,
  /getReviewIdentity\(review\)/,
  'Review record block should preserve stable review identity for edits and deletes.',
);

console.log('review empty-field filtering verified');
