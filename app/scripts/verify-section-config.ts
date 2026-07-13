import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createDefaultDailyTemplate,
  createDefaultReportTemplate,
  createDefaultSections,
  normalizeDailyTemplate,
  normalizeReportTemplate,
  normalizeSections,
  isReviewMarkerKey,
  RENDER_TYPES,
  SectionType,
  isRenderType,
} from '../shared/aiReview/sectionConfig';
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

const dailyDefaults = createDefaultDailyTemplate();
const normalizedDaily = normalizeDailyTemplate({
  customBlocks: [
    { id: 'daily-1', name: 'Custom first', aiGenerate: false, renderType: 'table', prompt: 'keep first' },
    { id: '   ' },
  ],
});
assert.equal(
  normalizedDaily.customBlocks[1]?.name,
  dailyDefaults.customBlocks[1]?.name,
  'daily template custom-block fallback should use the same-position default block instead of always reusing the first default block.',
);
assert.notEqual(
  normalizedDaily.customBlocks[1]?.id,
  '   ',
  'daily template custom-block fallback should replace blank ids instead of preserving whitespace-only ids.',
);

const monthlyDefaults = createDefaultReportTemplate('personalMonthly');
const normalizedMonthly = normalizeReportTemplate(
  {
    customBlocks: [
      { id: 'monthly-1', name: 'Override first', aiGenerate: false, renderType: 'table', prompt: 'keep first' },
      { id: 'monthly-2', name: '   ' },
    ],
  },
  'personalMonthly',
);
assert.equal(
  normalizedMonthly.customBlocks[1]?.name,
  monthlyDefaults.customBlocks[1]?.name,
  'report template custom-block fallback should use the same-position default block, including when the stored name is blank.',
);
const normalizedWeeklyReport = normalizeReportTemplate(
  {
    customBlocks: [
      { id: '' },
    ],
  },
  'personalWeekly',
);
assert.notEqual(
  normalizedWeeklyReport.customBlocks[0]?.id,
  '',
  'report template custom-block fallback should replace empty ids instead of preserving them.',
);



const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const sectionConfigSource = readFileSync(join(root, 'shared/aiReview/sectionConfig.ts'), 'utf8');
const sectionNormalizationSource = readFileSync(join(root, 'shared/aiReview/sectionConfigNormalization.ts'), 'utf8');
const unknownValueGuardsSource = readFileSync(join(root, 'shared/unknownValueGuards.ts'), 'utf8');
const templateEditorSource = readFileSync(join(root, 'src/components/TemplateEditorModal.tsx'), 'utf8');
const templateEditorBlockListSource = readFileSync(join(root, 'src/components/templateEditor/TemplateEditorBlockList.tsx'), 'utf8');
const templateBlockControlsSource = readFileSync(join(root, 'src/components/templateEditor/TemplateBlockControls.tsx'), 'utf8');
const templateRecognitionSource = readFileSync(join(root, 'src/components/TemplateRecognitionModal.tsx'), 'utf8');

assert.match(sectionConfigSource, /export function isRenderType\b/, 'sectionConfig should export isRenderType');
assert.match(sectionConfigSource, /export const RENDER_TYPES\b/, 'sectionConfig should export canonical render-type keys');
assert.match(sectionConfigSource, /export function isReviewMarkerKey\b/, 'sectionConfig should export a runtime ReviewMarkerKey guard');
assert.match(sectionConfigSource, /sectionConfigNormalization/, 'sectionConfig should delegate template normalization to its dedicated module');
assert.match(unknownValueGuardsSource, /export function isObjectRecord\b/, 'shared guards should expose an object-record predicate');
assert.match(sectionConfigSource, /import \{ isObjectRecord \} from '\.\.\/unknownValueGuards';/, 'sectionConfig should reuse the shared object-record predicate');
assert.doesNotMatch(sectionConfigSource, /function isObject\(v: unknown\)/, 'sectionConfig should not keep a duplicate local object predicate');
assert.match(sectionNormalizationSource, /export function normalizeDailyTemplateValue\b/, 'normalization module should own daily-template normalization');
assert.match(sectionNormalizationSource, /export function normalizeReportTemplateValue\b/, 'normalization module should own report-template normalization');
assert.match(sectionNormalizationSource, /import \{ isObjectRecord \} from '\.\.\/unknownValueGuards';/, 'template normalization should reuse the shared object-record guard');
assert.doesNotMatch(sectionNormalizationSource, /function isObject\(value: unknown\)/, 'template normalization should not redeclare the shared object-record guard');
assert.doesNotMatch(sectionConfigSource, /as ReviewMarkerKey/, 'sectionConfig should narrow marker keys with a guard, not a cast');
assert.doesNotMatch(sectionConfigSource, /as Partial<DailyTemplate>/, 'normalizeDailyTemplate should read from a record guard, not Partial casts');
assert.doesNotMatch(sectionConfigSource, /as Partial<ReportTemplate>/, 'normalizeReportTemplate should read from a record guard, not Partial casts');
assert.doesNotMatch(sectionConfigSource, /as any/, 'sectionConfig should not use any casts for template normalization');
assert.match(templateEditorBlockListSource, /TemplateBlockControls\b/, 'TemplateEditor block list should delegate render-type controls.');
assert.match(templateBlockControlsSource, /isRenderType\b/, 'TemplateBlockControls should use isRenderType');
assert.doesNotMatch(templateEditorSource, /e\.target\.value as RenderType/, 'TemplateEditorModal should not cast render-type select values');
assert.doesNotMatch(templateBlockControlsSource, /e\.target\.value as RenderType/, 'TemplateBlockControls should not cast render-type select values');
assert.doesNotMatch(templateBlockControlsSource, /Object\.entries\(RENDER_TYPE_LABELS\) as \[RenderType, string\]\[\]/, 'TemplateBlockControls should render label options from canonical render-type keys, not cast Object.entries');
assert.match(templateBlockControlsSource, /RENDER_TYPES\.map/, 'TemplateBlockControls should map render labels from canonical render-type keys');
assert.match(templateRecognitionSource, /isRenderType\b/, 'TemplateRecognitionModal should use isRenderType');
assert.doesNotMatch(templateRecognitionSource, /e\.target\.value as RenderType/, 'TemplateRecognitionModal should not cast render-type select values');
assert.doesNotMatch(templateRecognitionSource, /Object\.entries\(RENDER_TYPE_LABELS\) as \[RenderType, string\]\[\]/, 'TemplateRecognitionModal should render label options from canonical render-type keys, not cast Object.entries');
assert.match(templateRecognitionSource, /RENDER_TYPES\.map/, 'TemplateRecognitionModal should map render labels from canonical render-type keys');
assert.doesNotMatch(templateRecognitionSource, /result as string/, 'TemplateRecognitionModal should not cast FileReader results to string');
assert.match(
  templateRecognitionSource,
  /const fileText = ev\.target\?\.result;[\s\S]*setText\(typeof fileText === 'string' \? fileText : ''\)/,
  'TemplateRecognitionModal should narrow FileReader results before writing text state',
);

// RenderType runtime narrowing
assert.equal(isRenderType('text'), true);
assert.equal(isRenderType('list'), true);
assert.equal(isRenderType('table'), true);
assert.equal(isRenderType('callout'), true);
assert.equal(isRenderType('dataview'), true);
assert.equal(isRenderType('markdown'), false);
assert.equal(isRenderType(null), false);
assert.deepEqual([...RENDER_TYPES], ['text', 'list', 'table', 'callout', 'dataview']);
assert.equal(isReviewMarkerKey('REVIEW'), true);
assert.equal(isReviewMarkerKey('UNKNOWN'), false);
console.log('Section config verification passed');
