import { strict as assert } from 'node:assert';
import { buildDailyNoteContent } from '../shared/obsidianTemplates';
import { createDefaultObsidianTemplateSettings } from '../shared/appSettings';
import { REVIEW_MARKERS, customBlockMarker, hasBlock, readBlockBody } from '../shared/aiReview/markers';

const templates = createDefaultObsidianTemplateSettings();
const content = buildDailyNoteContent({
  date: '2026-06-07',
  tasks: [],
  dailyWork: '',
  dailyInspiration: '',
  templates,
});

const aiBlocks = templates.dailyTemplate.customBlocks.filter((block) => block.aiGenerate);
assert.ok(aiBlocks.length > 0, 'default daily template should include AI custom blocks');

for (const block of aiBlocks) {
  const marker = customBlockMarker(block.id);
  assert.ok(hasBlock(content, marker), `custom block marker present for ${block.name}`);
  assert.ok(content.includes(`## ${block.name}`), `custom block heading present for ${block.name}`);
  assert.ok(
    content.indexOf(`## ${block.name}`) < content.indexOf(marker.start),
    `custom block heading must precede the START marker for ${block.name}`,
  );
  assert.equal(readBlockBody(content, marker), '', `custom block body starts empty for ${block.name}`);
}

assert.ok(content.includes('<!-- DAILYTODO:TASKS:START -->'), 'task block marker present');
assert.ok(content.includes('<!-- DAILYTODO:WORK:START -->'), 'work block marker present');
assert.ok(!hasBlock(content, REVIEW_MARKERS.REVIEW), 'fixed REVIEW block is no longer emitted in daily template');

// 启用全部 review 系模块后，TOMORROW / KNOWLEDGE 块也应正确产出。
const allOn = {
  ...templates,
  modules: {
    ...((templates as any).modules ?? {}),
    tomorrow: { ...((templates as any).modules?.tomorrow ?? {}), enabled: true },
    knowledge: { ...((templates as any).modules?.knowledge ?? {}), enabled: true },
  },
};
const contentAllOn = buildDailyNoteContent({
  date: '2026-06-07',
  tasks: [],
  dailyWork: '',
  dailyInspiration: '',
  templates: allOn,
});
const tomorrowBlock = customBlockMarker(templates.dailyTemplate.customBlocks[1]!.id);
const knowledgeBlock = customBlockMarker(templates.dailyTemplate.customBlocks[2]!.id);
assert.ok(hasBlock(contentAllOn, tomorrowBlock), 'TOMORROW custom block present when enabled');
assert.ok(hasBlock(contentAllOn, knowledgeBlock), 'KNOWLEDGE custom block present when enabled');
assert.equal(readBlockBody(contentAllOn, tomorrowBlock), '', 'TOMORROW block starts empty');
assert.equal(readBlockBody(contentAllOn, knowledgeBlock), '', 'KNOWLEDGE block starts empty');

console.log('Daily review blocks verification passed');

