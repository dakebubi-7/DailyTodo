import { strict as assert } from 'node:assert';
import {
  createDefaultObsidianTemplateSettings,
  normalizeObsidianTemplateSettings,
} from '../shared/appSettings';
import {
  createDefaultAiReviewSettings,
  normalizeAiReviewSettings,
} from '../shared/aiReview/aiReviewSettings';

const obsidianDefaults = createDefaultObsidianTemplateSettings();
assert.equal(obsidianDefaults.dailyPath, 'logs/daily/DailyTodo/{{date}}.md');
assert.deepEqual(
  obsidianDefaults.dailyTemplate.fixedBlocks.map((block) => block.id),
  ['work', 'inspire', 'tasks'],
);
assert.equal(obsidianDefaults.dailyTemplate.blockOrder.some((item) => item.type === 'fixed' && item.id === 'tasks'), true);

const normalizedObsidian = normalizeObsidianTemplateSettings({ dailyNotePath: 'journal/{{date}}.md' });
assert.equal(normalizedObsidian.dailyPath, 'journal/{{date}}.md');
assert.equal(normalizedObsidian.dailyTemplate.blockOrder.some((item) => item.type === 'fixed' && item.id === 'tasks'), true);

const legacyMarkdown = normalizeObsidianTemplateSettings({
  dailyMarkdownTemplate: '{{work}}\n{{inspiration}}\n{{tasks}}',
});
assert.equal(legacyMarkdown.dailyTemplate.blockOrder.some((item) => item.type === 'fixed' && item.id === 'work'), true);
assert.equal(legacyMarkdown.dailyTemplate.blockOrder.some((item) => item.type === 'fixed' && item.id === 'inspire'), true);
assert.equal(legacyMarkdown.dailyTemplate.blockOrder.some((item) => item.type === 'fixed' && item.id === 'tasks'), true);

const aiDefaults = createDefaultAiReviewSettings();
assert.equal(aiDefaults.weeklySourceMode, 'daily-notes');
assert.equal(aiDefaults.monthlySourceMode, 'weekly-then-daily');
assert.equal(aiDefaults.externalWeeklySourceMode, 'daily-notes');
assert.equal(aiDefaults.externalMonthlySourceMode, 'weekly-then-daily');

const normalizedAi = normalizeAiReviewSettings({ weeklySourceMode: 'bad', monthlySourceMode: 'daily-notes' });
assert.equal(normalizedAi.weeklySourceMode, 'daily-notes');
assert.equal(normalizedAi.monthlySourceMode, 'daily-notes');

console.log('verify-template-source-settings ok');
