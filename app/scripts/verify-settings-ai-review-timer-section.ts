import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const parentSectionPath = join(root, 'src/components/settings/AiReviewSettingsSection.tsx');
const timerSectionPath = join(root, 'src/components/settings/AiReviewTimerSettingsSection.tsx');

const parentSection = readFileSync(parentSectionPath, 'utf8');

assert.ok(existsSync(timerSectionPath), 'AiReviewTimerSettingsSection module should exist.');
const timerSection = readFileSync(timerSectionPath, 'utf8');

assert.match(timerSection, /export function AiReviewTimerSettingsSection\b/, 'Timer section should export AiReviewTimerSettingsSection.');
assert.match(timerSection, /weeklyTimerEnabled/, 'Timer section should own personal weekly timer toggle.');
assert.match(timerSection, /monthlyTimerEnabled/, 'Timer section should own personal monthly timer toggle.');
assert.match(timerSection, /externalWeeklyTimerEnabled/, 'Timer section should own external weekly timer toggle.');
assert.match(timerSection, /externalMonthlyTimerEnabled/, 'Timer section should own external monthly timer toggle.');
assert.match(timerSection, /anonymizeExternalReports/, 'Timer section should own external anonymization toggle.');
assert.match(timerSection, /weekOptions\.map/, 'Timer section should preserve weekday option rendering.');
assert.match(timerSection, /Number\(event\.target\.value\)/, 'Timer section should preserve numeric weekday coercion.');
assert.match(timerSection, /Number\(value\) \|\| 1/, 'Timer section should preserve monthly day fallback.');
assert.match(timerSection, /updateAiReview/, 'Timer section should update the same AI review settings keys through updateAiReview.');
assert.match(timerSection, /updateAiReviewInput/, 'Timer section should accept deferred text-input persistence.');
for (const key of [
  'weeklyTimerTime',
  'monthlyTimerDay',
  'monthlyTimerTime',
  'externalWeeklyTimerTime',
  'externalMonthlyTimerDay',
  'externalMonthlyTimerTime',
]) {
  assert.match(timerSection, new RegExp(`updateAiReviewInput\\('${key}'`), `${key} text edits should use deferred persistence.`);
}

assert.match(parentSection, /from '\.\/AiReviewTimerSettingsSection'/, 'AiReviewSettingsSection should import AiReviewTimerSettingsSection.');
assert.match(parentSection, /<AiReviewTimerSettingsSection\b/, 'AiReviewSettingsSection should render AiReviewTimerSettingsSection.');
assert.doesNotMatch(parentSection, /weeklyTimerEnabled/, 'AiReviewSettingsSection should not keep timer settings fields inline.');
assert.doesNotMatch(parentSection, /externalWeeklyTimerEnabled/, 'AiReviewSettingsSection should not keep external timer fields inline.');
assert.doesNotMatch(parentSection, /anonymizeExternalReports/, 'AiReviewSettingsSection should not keep external anonymization timer field inline.');

console.log('AI review timer settings section verification passed');
