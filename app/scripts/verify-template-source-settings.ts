import { strict as assert } from 'node:assert';
import { existsSync } from 'node:fs';
import { readFileSync } from 'node:fs';
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

const appSettingsSource = readFileSync(new URL('../shared/appSettings.ts', import.meta.url), 'utf8');
const obsidianTemplateSettingsUrl = new URL('../shared/obsidianTemplateSettings.ts', import.meta.url);
assert.equal(existsSync(obsidianTemplateSettingsUrl), true, 'Obsidian template settings module should exist.');
const obsidianTemplateSettingsSource = readFileSync(obsidianTemplateSettingsUrl, 'utf8');
const obsidianTemplateSettingsEqualityUrl = new URL('../shared/obsidianTemplateSettingsEquality.ts', import.meta.url);
assert.equal(existsSync(obsidianTemplateSettingsEqualityUrl), true, 'Obsidian template settings equality module should exist.');
const obsidianTemplateSettingsEqualitySource = readFileSync(obsidianTemplateSettingsEqualityUrl, 'utf8');
const obsidianTemplateSettingsDailyMigrationUrl = new URL('../shared/obsidianTemplateSettingsDailyMigration.ts', import.meta.url);
assert.equal(existsSync(obsidianTemplateSettingsDailyMigrationUrl), true, 'Obsidian daily template migration module should exist.');
const obsidianTemplateSettingsDailyMigrationSource = readFileSync(obsidianTemplateSettingsDailyMigrationUrl, 'utf8');
const obsidianTemplateSettingsPathMigrationUrl = new URL('../shared/obsidianTemplateSettingsPathMigration.ts', import.meta.url);
assert.equal(existsSync(obsidianTemplateSettingsPathMigrationUrl), true, 'Obsidian template path migration module should exist.');
const obsidianTemplateSettingsPathMigrationSource = readFileSync(obsidianTemplateSettingsPathMigrationUrl, 'utf8');
const unknownValueGuardsUrl = new URL('../shared/unknownValueGuards.ts', import.meta.url);
assert.equal(existsSync(unknownValueGuardsUrl), true, 'shared unknown-value guards module should exist.');
const unknownValueGuardsSource = readFileSync(unknownValueGuardsUrl, 'utf8');
const aiReviewSettingsSource = readFileSync(new URL('../shared/aiReview/aiReviewSettings.ts', import.meta.url), 'utf8');
const aiReviewProfilesSource = readFileSync(new URL('../shared/aiReview/aiReviewProfiles.ts', import.meta.url), 'utf8');
assert.match(
  appSettingsSource,
  /from '\.\/obsidianTemplateSettings'/,
  'appSettings should re-export Obsidian template settings from the dedicated module.',
);
assert.doesNotMatch(
  appSettingsSource,
  /function migrateDailyMarkdownTemplate/,
  'appSettings should not keep Obsidian template migration inline.',
);
assert.doesNotMatch(
  appSettingsSource,
  /function normalizeObsidianTemplateSettings/,
  'appSettings should not keep Obsidian template normalization inline.',
);
assert.match(
  obsidianTemplateSettingsSource,
  /export interface ObsidianTemplateSettings\b/,
  'Obsidian template settings module should own the template settings type.',
);
assert.match(
  obsidianTemplateSettingsSource,
  /export function createDefaultObsidianTemplateSettings\b/,
  'Obsidian template settings module should own defaults.',
);
assert.match(
  obsidianTemplateSettingsSource,
  /export function normalizeObsidianTemplateSettings\b/,
  'Obsidian template settings module should own normalization.',
);
assert.match(
  obsidianTemplateSettingsSource,
  /export function areObsidianTemplateSettingsEqual\b/,
  'Obsidian template settings module should own equality.',
);
assert.match(
  obsidianTemplateSettingsSource,
  /from '\.\/obsidianTemplateSettingsEquality'/,
  'Obsidian template settings should delegate recursive equality to the focused module.',
);
assert.match(
  obsidianTemplateSettingsEqualitySource,
  /export function areSettingValuesEqual\b/,
  'Obsidian template settings equality module should own recursive comparison.',
);
assert.doesNotMatch(
  obsidianTemplateSettingsSource,
  /function areSettingValuesEqual\(/,
  'Obsidian template settings should not keep recursive equality inline.',
);
assert.match(
  obsidianTemplateSettingsSource,
  /from '\.\/obsidianTemplateSettingsDailyMigration'/,
  'Obsidian template settings should delegate legacy daily-template migration.',
);
assert.match(
  obsidianTemplateSettingsDailyMigrationSource,
  /export function migrateLegacyDailyMarkdownTemplate\b/,
  'daily template migration module should own legacy Markdown migration.',
);
assert.doesNotMatch(
  obsidianTemplateSettingsSource,
  /function migrateDailyMarkdownTemplate\(/,
  'Obsidian template settings should not keep legacy daily Markdown migration inline.',
);
assert.match(
  obsidianTemplateSettingsSource,
  /from '\.\/obsidianTemplateSettingsPathMigration'/,
  'Obsidian template settings should delegate stored-path migration.',
);
assert.match(
  obsidianTemplateSettingsPathMigrationSource,
  /export function resolveStoredPath\b/,
  'path migration module should own current and legacy path resolution.',
);
assert.match(
  obsidianTemplateSettingsPathMigrationSource,
  /export function resolveStoredReportPath\b/,
  'path migration module should own legacy report-directory migration.',
);
assert.doesNotMatch(
  obsidianTemplateSettingsSource,
  /function readStringSetting\(/,
  'Obsidian template settings should not keep stored-string reading inline.',
);
assert.doesNotMatch(
  obsidianTemplateSettingsSource,
  /function migrateReportDir\(/,
  'Obsidian template settings should not keep legacy report-directory migration inline.',
);
assert.doesNotMatch(
  obsidianTemplateSettingsSource,
  /function resolveStoredPath\(/,
  'Obsidian template settings should not keep generic stored-path resolution inline.',
);
assert.doesNotMatch(
  obsidianTemplateSettingsSource,
  /function resolveStoredReportPath\(/,
  'Obsidian template settings should not keep report-path resolution inline.',
);
assert.match(
  obsidianTemplateSettingsDailyMigrationSource,
  /TEMPLATE_CUSTOM_TOKEN_SET\.has\(token\)/,
  'daily template migration should retain precomputed custom-token membership.',
);
assert.match(
  unknownValueGuardsSource,
  /export function isObjectRecord\b/,
  'shared unknown-value guards should expose an object-record predicate.',
);
assert.match(
  obsidianTemplateSettingsSource,
  /import \{ isObjectRecord \} from '\.\/unknownValueGuards';/,
  'Obsidian template settings should reuse the shared object-record predicate.',
);
assert.doesNotMatch(
  obsidianTemplateSettingsSource,
  /function isObject\(/,
  'Obsidian template settings should not keep a duplicate local object predicate.',
);
assert.doesNotMatch(
  obsidianTemplateSettingsSource,
  /TEMPLATE_CUSTOM_TOKENS\s+as\s+readonly\s+string\[\]/,
  'template custom-token guard should not cast the token tuple to readonly string[].',
);
assert.match(
  obsidianTemplateSettingsDailyMigrationSource,
  /TEMPLATE_CUSTOM_TOKEN_SET\.has\(token\)/,
  'template custom-token guard should use a precomputed membership set.',
);
assert.doesNotMatch(
  obsidianTemplateSettingsEqualitySource,
  /right as Record<string, unknown>/,
  'template settings equality should not narrow object values with a Record assertion.',
);
assert.match(
  obsidianTemplateSettingsEqualitySource,
  /Object\.getOwnPropertyDescriptor\(right, key\)\?\.value/,
  'template settings equality should read matching own-property values without an assertion.',
);
assert.doesNotMatch(
  aiReviewSettingsSource,
  /PROVIDERS\s+as\s+string\[\]/,
  'AI provider guard should not cast the provider list to string[].',
);
assert.match(
  aiReviewProfilesSource,
  /AI_PROVIDER_SET\.has\(v\)/,
  'AI provider guard module should use a precomputed membership set.',
);

console.log('verify-template-source-settings ok');
