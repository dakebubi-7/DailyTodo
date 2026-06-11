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
assert.equal(obsidianDefaults.dailyNotePath, 'logs/daily/DailyTodo/{{date}}.md');
assert.ok(obsidianDefaults.dailyMarkdownTemplate.includes('{{work}}'));
assert.ok(obsidianDefaults.dailyMarkdownTemplate.includes('{{inspiration}}'));
assert.ok(obsidianDefaults.dailyMarkdownTemplate.includes('{{tasks}}'));
assert.deepEqual(obsidianDefaults.dailySourceRules, [
  { id: 'daily-note-path', label: '每日记录文件位置', path: 'logs/daily/DailyTodo/{{date}}.md', enabled: true },
]);

const normalizedObsidian = normalizeObsidianTemplateSettings({ dailyNotePath: 'journal/{{date}}.md' });
assert.equal(normalizedObsidian.dailyNotePath, 'journal/{{date}}.md');
assert.equal(normalizedObsidian.dailySourceRules[0].path, 'journal/{{date}}.md');
assert.ok(normalizedObsidian.dailyMarkdownTemplate.includes('{{tasks}}'));

// Explicit dailySourceRules survive normalization.
const withRules = normalizeObsidianTemplateSettings({
  dailyNotePath: 'journal/{{date}}.md',
  dailySourceRules: [{ id: 'r1', label: '历史日记', path: 'archive/{{date}}.md', enabled: false }],
});
assert.equal(withRules.dailySourceRules.length, 1);
assert.equal(withRules.dailySourceRules[0].path, 'archive/{{date}}.md');
assert.equal(withRules.dailySourceRules[0].enabled, false);

const aiDefaults = createDefaultAiReviewSettings();
assert.equal(aiDefaults.weeklySourceMode, 'daily-notes');
assert.equal(aiDefaults.monthlySourceMode, 'weekly-then-daily');
assert.equal(aiDefaults.externalWeeklySourceMode, 'daily-notes');
assert.equal(aiDefaults.externalMonthlySourceMode, 'weekly-then-daily');

const normalizedAi = normalizeAiReviewSettings({ weeklySourceMode: 'bad', monthlySourceMode: 'daily-notes' });
assert.equal(normalizedAi.weeklySourceMode, 'daily-notes');
assert.equal(normalizedAi.monthlySourceMode, 'daily-notes');

console.log('verify-template-source-settings ok');
