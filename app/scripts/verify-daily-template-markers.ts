import { strict as assert } from 'node:assert';
import {
  TASK_START_MARKER,
  WORK_START_MARKER,
  INSPIRATION_START_MARKER,
  buildDailyNoteFromTemplate,
  replaceManagedBlock,
  WORK_END_MARKER,
} from '../shared/obsidianTemplates';
import { customBlockMarker } from '../shared/aiReview/markers';
import { createDefaultObsidianTemplateSettings } from '../shared/appSettings';

const templates = createDefaultObsidianTemplateSettings();
const workSectionTitle = templates.dailyTemplate.fixedBlocks.find((block) => block.id === 'work')?.displayName || '今日工作';

// 1) A custom template renders core tokens as titled marker blocks, with no duplicate heading.
const fromTemplate = buildDailyNoteFromTemplate({
  date: '2026-06-11',
  tasks: [],
  dailyWork: '写代码',
  dailyInspiration: '一个点子',
  templates: { ...templates, dailyMarkdownTemplate: '# 我的日报 {{date}}\n\n{{work}}\n\n{{inspiration}}\n\n{{tasks}}' },
});
assert.ok(fromTemplate.includes('# 我的日报 2026-06-11'));
assert.ok(fromTemplate.includes(WORK_START_MARKER));
assert.ok(fromTemplate.includes(INSPIRATION_START_MARKER));
assert.ok(fromTemplate.includes(TASK_START_MARKER));
assert.ok(fromTemplate.includes('写代码'));
// Work title appears exactly once (no double heading).
assert.equal(fromTemplate.split(`## ${workSectionTitle}`).length - 1, 1);

// 2) Markers survive an incremental upsert, so sync keeps working on template-built files.
const upserted = replaceManagedBlock(
  fromTemplate,
  WORK_START_MARKER,
  WORK_END_MARKER,
  `${WORK_START_MARKER}\n## ${workSectionTitle}\n更新后的工作\n${WORK_END_MARKER}`,
);
assert.ok(upserted.includes('更新后的工作'));
assert.ok(!upserted.includes('写代码'));

// 3) Missing core token still appends its marker block so sync can locate it.
const missingTasks = buildDailyNoteFromTemplate({
  date: '2026-06-11',
  tasks: [],
  dailyWork: 'w',
  dailyInspiration: 'i',
  templates: { ...templates, dailyMarkdownTemplate: '# only work\n{{work}}' },
});
assert.ok(missingTasks.includes(TASK_START_MARKER));
assert.ok(missingTasks.includes(INSPIRATION_START_MARKER));

// 4) Empty template falls back to the module-based builder.
const fallback = buildDailyNoteFromTemplate({
  date: '2026-06-11',
  tasks: [],
  dailyWork: '',
  dailyInspiration: '',
  templates: { ...templates, dailyMarkdownTemplate: '' },
});
assert.ok(fallback.includes(WORK_START_MARKER));
const reviewBlock = templates.dailyTemplate.customBlocks.find((block) => /复盘|review/i.test(block.name));
if (!reviewBlock) throw new Error('default template should include a review custom block');
assert.ok(fallback.includes(customBlockMarker(reviewBlock.id).start));

console.log('verify-daily-template-markers ok');
