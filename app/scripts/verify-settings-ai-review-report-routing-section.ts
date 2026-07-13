import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const parentSectionPath = join(root, 'src/components/settings/AiReviewSettingsSection.tsx');
const sectionPath = join(root, 'src/components/settings/AiReviewReportRoutingSection.tsx');

const parentSection = readFileSync(parentSectionPath, 'utf8');

assert.ok(existsSync(sectionPath), 'AiReviewReportRoutingSection module should exist.');
const section = readFileSync(sectionPath, 'utf8');

assert.match(section, /export function AiReviewReportRoutingSection\b/, 'Report routing section should export AiReviewReportRoutingSection.');
assert.match(section, /type ReportProfileKey = 'dailyReviewProfileId' \| 'weeklyReportProfileId' \| 'monthlyReportProfileId'/, 'Report routing section should own typed report profile keys.');
assert.match(section, /aria-label="reportAccountRouting"/, 'Report routing section should preserve the reportAccountRouting aria label.');
assert.match(section, /dailyReviewProfileId/, 'Report routing section should preserve daily account routing.');
assert.match(section, /weeklyReportProfileId/, 'Report routing section should preserve weekly account routing.');
assert.match(section, /monthlyReportProfileId/, 'Report routing section should preserve monthly account routing.');
assert.match(section, /aiReviewSettings\.profiles\.some/, 'Report routing section should preserve missing-profile detection.');
assert.match(section, /aiReviewSettings\.profiles\.map/, 'Report routing section should render configured AI profiles.');
assert.match(section, /<option value="">/, 'Report routing section should preserve the follow-current-account option.');
assert.match(section, /updateAiReview\(key, event\.target\.value\)/, 'Report routing section should update the same AI review profile keys.');
assert.match(section, /Missing account/, 'Report routing section should preserve missing account fallback display.');
assert.doesNotMatch(
  section,
  /as Array<\[ReportProfileKey, string\]>/,
  'Report routing section should type its route list without a tuple-array cast.',
);

assert.match(parentSection, /from '\.\/AiReviewReportRoutingSection'/, 'AiReviewSettingsSection should import AiReviewReportRoutingSection.');
assert.match(parentSection, /<AiReviewReportRoutingSection\b/, 'AiReviewSettingsSection should render AiReviewReportRoutingSection.');
assert.doesNotMatch(parentSection, /type ReportProfileKey =/, 'AiReviewSettingsSection should not own report profile key type.');
assert.doesNotMatch(parentSection, /aria-label="reportAccountRouting"/, 'AiReviewSettingsSection should not keep report routing markup inline.');
assert.doesNotMatch(parentSection, /type ReportProfileKey|<select value=|aiReviewSettings\.profiles\.map/, 'AiReviewSettingsSection should not keep report routing internals inline.');

console.log('AI review report routing section verification passed');
