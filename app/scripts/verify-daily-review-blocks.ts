import { strict as assert } from 'node:assert';
import { buildDailyNoteContent } from '../shared/obsidianTemplates';
import { createDefaultObsidianTemplateSettings } from '../shared/appSettings';
import { REVIEW_MARKERS, hasBlock, readBlockBody } from '../shared/aiReview/markers';

const templates = createDefaultObsidianTemplateSettings();
const content = buildDailyNoteContent({
  date: '2026-06-07',
  tasks: [],
  dailyWork: '',
  dailyInspiration: '',
  templates,
});

assert.ok(hasBlock(content, REVIEW_MARKERS.REVIEW), 'REVIEW block present');
assert.ok(hasBlock(content, REVIEW_MARKERS.TOMORROW), 'TOMORROW block present');
assert.ok(hasBlock(content, REVIEW_MARKERS.KNOWLEDGE), 'KNOWLEDGE block present');
// 既有任务/工作标记仍在
assert.ok(content.includes('<!-- DAILYTODO:TASKS:START -->'));
assert.ok(content.includes('<!-- DAILYTODO:WORK:START -->'));

// 契约：标题在 marker 块外（在 START 之前），块内默认为空，
// 这样补偿扫描判为 Unprocessed 才会填充。
assert.ok(
  content.indexOf(`## ${templates.reviewSectionTitle}`) < content.indexOf(REVIEW_MARKERS.REVIEW.start),
  'review heading must precede the START marker (heading outside block)',
);
assert.equal(readBlockBody(content, REVIEW_MARKERS.REVIEW), '', 'REVIEW block starts empty');
assert.equal(readBlockBody(content, REVIEW_MARKERS.TOMORROW), '', 'TOMORROW block starts empty');
assert.equal(readBlockBody(content, REVIEW_MARKERS.KNOWLEDGE), '', 'KNOWLEDGE block starts empty');

console.log('Daily review blocks verification passed');

