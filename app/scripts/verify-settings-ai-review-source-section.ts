import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const parentSectionPath = join(root, 'src/components/settings/AiReviewSettingsSection.tsx');
const sectionPath = join(root, 'src/components/settings/AiReviewSourceSettingsSection.tsx');

const parentSection = readFileSync(parentSectionPath, 'utf8');

assert.ok(existsSync(sectionPath), 'AiReviewSourceSettingsSection module should exist.');
const section = readFileSync(sectionPath, 'utf8');

assert.match(section, /export function AiReviewSourceSettingsSection\b/, 'Source settings section should export AiReviewSourceSettingsSection.');
assert.match(section, /Report source detail/, 'Source settings section should preserve source detail heading.');
assert.match(section, /weeklySourceOptions\.find/, 'Source settings section should preserve weekly source hint lookup.');
assert.match(section, /monthlySourceOptions\.find/, 'Source settings section should preserve monthly source hint lookup.');
assert.match(section, /weeklySourceMode/, 'Source settings section should own personal weekly source setting.');
assert.match(section, /monthlySourceMode/, 'Source settings section should own personal monthly source setting.');
assert.match(section, /externalWeeklySourceMode/, 'Source settings section should own external weekly source setting.');
assert.match(section, /externalMonthlySourceMode/, 'Source settings section should own external monthly source setting.');
assert.match(section, /normalizeWeeklySourceMode\(event\.target\.value\)/, 'Source settings section should normalize weekly source select values.');
assert.match(section, /normalizeMonthlySourceMode\(event\.target\.value\)/, 'Source settings section should normalize monthly source select values.');
assert.doesNotMatch(section, /event\.target\.value as WeeklySourceMode/, 'Source settings section should not cast weekly source select values.');
assert.doesNotMatch(section, /event\.target\.value as MonthlySourceMode/, 'Source settings section should not cast monthly source select values.');
assert.match(section, /timeoutSeconds[\s\S]+?Number\(value\) \|\| 90/, 'Source settings section should preserve timeout fallback.');
assert.match(section, /backfillDays[\s\S]+?Number\(value\) \|\| 7/, 'Source settings section should preserve backfill fallback.');
assert.match(section, /updateAiReviewInput/, 'Source settings section should accept deferred text-input persistence.');
assert.match(section, /updateAiReviewInput\('timeoutSeconds', Number\(value\) \|\| 90\)/, 'Request timeout text edits should use deferred persistence.');
assert.match(section, /updateAiReviewInput\('timerTime', value\)/, 'Daily timer text edits should use deferred persistence.');
assert.match(section, /updateAiReviewInput\('backfillDays', Number\(value\) \|\| 7\)/, 'Backfill day text edits should use deferred persistence.');
assert.match(section, /startupBackfillEnabled/, 'Source settings section should preserve startup backfill toggle.');
assert.match(section, /timerEnabled/, 'Source settings section should preserve daily timer toggle.');

assert.match(parentSection, /from '\.\/AiReviewSourceSettingsSection'/, 'AiReviewSettingsSection should import AiReviewSourceSettingsSection.');
assert.match(parentSection, /<AiReviewSourceSettingsSection\b/, 'AiReviewSettingsSection should render AiReviewSourceSettingsSection.');
assert.doesNotMatch(parentSection, /Report source detail/, 'AiReviewSettingsSection should not keep source detail heading inline.');
assert.doesNotMatch(parentSection, /weeklySourceOptions\.find/, 'AiReviewSettingsSection should not keep source option fields inline.');
assert.doesNotMatch(parentSection, /requestTimeout/, 'AiReviewSettingsSection should not keep source/base fields inline.');

console.log('AI review source settings section verification passed');
