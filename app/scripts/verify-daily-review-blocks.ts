import { strict as assert } from 'node:assert';
import { buildDailyNoteContent } from '../shared/obsidianTemplates';
import { createDefaultObsidianTemplateSettings } from '../shared/appSettings';
import { REVIEW_MARKERS, hasBlock } from '../shared/aiReview/markers';

const content = buildDailyNoteContent({
  date: '2026-06-07',
  tasks: [],
  dailyWork: '',
  dailyInspiration: '',
  templates: createDefaultObsidianTemplateSettings(),
});

assert.ok(hasBlock(content, REVIEW_MARKERS.REVIEW), 'REVIEW block present');
assert.ok(hasBlock(content, REVIEW_MARKERS.TOMORROW), 'TOMORROW block present');
assert.ok(hasBlock(content, REVIEW_MARKERS.KNOWLEDGE), 'KNOWLEDGE block present');
// 既有任务/工作标记仍在
assert.ok(content.includes('<!-- DAILYTODO:TASKS:START -->'));
assert.ok(content.includes('<!-- DAILYTODO:WORK:START -->'));

console.log('Daily review blocks verification passed');
