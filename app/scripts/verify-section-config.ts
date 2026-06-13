import { strict as assert } from 'node:assert';
import { createDefaultDailyTemplate, createDefaultSections, normalizeSections, SectionType } from '../shared/aiReview/sectionConfig';
import { buildCustomBlockReviewMessages, buildReviewMessages } from '../shared/aiReview/promptBuilder';

const sections = createDefaultSections();
const review = sections.find((s) => s.markerKey === 'REVIEW')!;
assert.equal(review.type, SectionType.Ai);
assert.ok(review.prompt.length > 0);

const tomorrow = sections.find((s) => s.markerKey === 'TOMORROW')!;
assert.equal(tomorrow.type, SectionType.Deterministic, '明日待办先确定性结转');

const messages = buildReviewMessages({
  date: '2026-06-07',
  dailyContent: '## 今日工作\n写了复盘引擎\n## 每日任务\n- [x] Task1',
  section: review,
  stats: { date: '2026-06-07', total: 1, completed: 1, completionRate: 100 },
});
assert.equal(messages[0].role, 'system');
assert.equal(messages[1].role, 'user');
assert.ok(messages[1].content.includes('2026-06-07'));
assert.ok(messages[1].content.includes('写了复盘引擎'), 'daily content included');
assert.ok(messages[1].content.includes('100'), 'deterministic stats injected, not invented');
assert.ok(messages[0].content.includes('不要编造数字') || messages[0].content.includes('do not invent'));

const customTemplate = createDefaultDailyTemplate();
const [reviewBlock, tomorrowBlock, knowledgeBlock] = customTemplate.customBlocks;

const customReviewMessages = buildCustomBlockReviewMessages({
  date: '2026-06-07',
  dailyContent: '## 今日工作\n写了复盘引擎',
  block: reviewBlock,
  stats: { date: '2026-06-07', total: 1, completed: 1, completionRate: 100 },
});
assert.equal(customReviewMessages[0].role, 'system');
assert.equal(customReviewMessages[1].role, 'user');
assert.ok(customReviewMessages[1].content.includes('任务：『复盘』'));
assert.ok(customReviewMessages[1].content.includes('输出格式：使用普通 Markdown 段落'));
assert.ok(customReviewMessages[1].content.includes('请根据今天的记录生成“复盘”这个区块的内容。'));

const listMessages = buildCustomBlockReviewMessages({
  date: '2026-06-07',
  dailyContent: '## 每日任务\n- [x] Task1',
  block: tomorrowBlock,
  stats: { date: '2026-06-07', total: 1, completed: 1, completionRate: 100 },
});
assert.ok(listMessages[1].content.includes('输出格式：使用 Markdown 无序列表'));
assert.ok(listMessages[1].content.includes('请根据今天的记录生成“明日待办”这个区块的内容。'));
assert.ok(listMessages[1].content.includes('完成率：100%'));

const dataviewBlock = { ...knowledgeBlock, renderType: 'dataview' as const, prompt: '' };
const dataviewMessages = buildCustomBlockReviewMessages({
  date: '2026-06-07',
  dailyContent: '',
  block: dataviewBlock,
  stats: { date: '2026-06-07', total: 0, completed: 0, completionRate: 0 },
});
assert.ok(dataviewMessages[1].content.includes('输出格式：优先使用 Obsidian dataview 代码块'));
assert.ok(dataviewMessages[1].content.includes('可复用知识'));

const tableBlock = { ...tomorrowBlock, renderType: 'table' as const, prompt: '只输出表格' };
const tableMessages = buildCustomBlockReviewMessages({
  date: '2026-06-07',
  dailyContent: '',
  block: tableBlock,
  stats: { date: '2026-06-07', total: 0, completed: 0, completionRate: 0 },
});
assert.ok(tableMessages[1].content.includes('只输出表格'));
assert.ok(tableMessages[1].content.includes('输出格式：使用 Markdown 表格'));


// KNOWLEDGE 默认段
const knowledge = sections.find((s) => s.markerKey === 'KNOWLEDGE')!;
assert.equal(knowledge.type, SectionType.Ai);
assert.ok(knowledge.prompt.length > 0);

// normalizeSections: 非数组 → 默认 3 段，默认顺序
const fromInvalid = normalizeSections('not-an-array');
assert.equal(fromInvalid.length, 3);
assert.deepEqual(fromInvalid.map((s) => s.markerKey), ['REVIEW', 'TOMORROW', 'KNOWLEDGE']);

// normalizeSections: 用户覆盖 title/prompt，未知 key 忽略，非对象项跳过
const merged = normalizeSections([
  { markerKey: 'REVIEW', title: '我的复盘', prompt: '自定义要求' },
  { markerKey: 'UNKNOWN', title: 'x' },
  'garbage',
]);
assert.equal(merged.length, 3, '始终返回 3 段');
const mReview = merged.find((s) => s.markerKey === 'REVIEW')!;
assert.equal(mReview.title, '我的复盘', 'user title applied');
assert.equal(mReview.prompt, '自定义要求', 'user prompt applied');
assert.equal(mReview.type, SectionType.Ai, '未提供 type → 回落默认');

// normalizeSections: 空白字段回落默认
const blank = normalizeSections([{ markerKey: 'REVIEW', title: '   ', prompt: '' }]);
const bReview = blank.find((s) => s.markerKey === 'REVIEW')!;
assert.equal(bReview.title, '复盘', 'whitespace title → default');
assert.ok(bReview.prompt.length > 0, 'empty prompt → default');

console.log('Section config verification passed');
