import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const parentSectionPath = join(root, 'src/components/settings/AiReviewSettingsSection.tsx');
const sectionPath = join(root, 'src/components/settings/AiReviewManualGenerationSection.tsx');

const parentSection = readFileSync(parentSectionPath, 'utf8');

assert.ok(existsSync(sectionPath), 'AiReviewManualGenerationSection module should exist.');
const section = readFileSync(sectionPath, 'utf8');

assert.match(section, /export function AiReviewManualGenerationSection\b/, 'Manual generation section should export AiReviewManualGenerationSection.');
assert.match(section, /Manual generation/, 'Manual generation section should preserve heading.');
assert.match(section, /personalWeekly/, 'Manual generation section should preserve personal weekly action.');
assert.match(section, /personalMonthly/, 'Manual generation section should preserve personal monthly action.');
assert.match(section, /externalWeekly/, 'Manual generation section should preserve external weekly action.');
assert.match(section, /externalMonthly/, 'Manual generation section should preserve external monthly action.');
assert.match(section, /daily/, 'Manual generation section should preserve daily regeneration action.');
assert.match(section, /disabled=\{generatingAction !== null\}/, 'Manual generation section should keep buttons disabled while generating.');
assert.match(section, /onClick=\{\(\) => runGeneration\(action\)\}/, 'Manual generation section should delegate button clicks to runGeneration.');
assert.match(section, /progressDisplay\(currentProgress, waitingForRealProgress\)/, 'Manual generation section should preserve progress button label.');
assert.match(section, /GenerationProgress/, 'Manual generation section should preserve detailed progress rendering.');
assert.match(section, /DiagnosticCard/, 'Manual generation section should preserve diagnostic rendering.');
assert.doesNotMatch(
  section,
  /as Array<\[GenerationAction, string\]>/,
  'Manual generation section should type its action list without a tuple-array cast.',
);
assert.doesNotMatch(section, /window\.electronAPI/, 'Manual generation section should not own IPC generation side effects.');
assert.doesNotMatch(section, /setGeneratingAction/, 'Manual generation section should not own generation state transitions.');

assert.match(parentSection, /from '\.\/AiReviewManualGenerationSection'/, 'AiReviewSettingsSection should import AiReviewManualGenerationSection.');
assert.match(parentSection, /<AiReviewManualGenerationSection\b/, 'AiReviewSettingsSection should render AiReviewManualGenerationSection.');
assert.doesNotMatch(parentSection, /Manual generation/, 'AiReviewSettingsSection should not keep manual-generation heading inline.');
assert.doesNotMatch(parentSection, /settings-action-row-wide/, 'AiReviewSettingsSection should not keep manual-generation button row inline.');

console.log('AI review manual generation section verification passed');
