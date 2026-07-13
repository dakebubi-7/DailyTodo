import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const widgetsPath = join(root, 'src/components/settings/AiReviewSettingsWidgets.tsx');
const presentationPath = join(root, 'src/components/settings/AiReviewGenerationPresentation.tsx');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(widgetsPath), 'AI review settings widgets should exist.');
assert.ok(existsSync(presentationPath), 'AI review generation presentation should live in a focused module.');

const widgets = readFileSync(widgetsPath, 'utf8');
const presentation = readFileSync(presentationPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(widgets, /from '\.\/AiReviewGenerationPresentation'/, 'Widget module should re-export focused generation presentation helpers.');
for (const exportName of ['formatLocalDate', 'previousWeekDate', 'previousMonthStart', 'resultMessage', 'progressDisplay', 'GenerationProgress', 'initialProgressForAction', 'finishProgress']) {
  assert.match(presentation, new RegExp(`export (function|const) ${exportName}\\b`), `Generation presentation should export ${exportName}.`);
}
assert.match(presentation, /const AI_PROGRESS_PERCENT/, 'Generation presentation should own progress-stage percentages.');
assert.doesNotMatch(widgets, /const AI_PROGRESS_PERCENT|function progressPercent\b|function resultMessage\b/, 'Account widget module should not retain generation presentation policy.');
assert.equal(
  scripts['verify:settings-ai-review-generation-presentation'],
  'tsx scripts/verify-settings-ai-review-generation-presentation.ts',
  'package.json should expose the focused AI review generation presentation verifier.',
);
assertCleanupCoreIncludes(
  'verify:settings-ai-review-generation-presentation',
  'cleanup-core should include the focused AI review generation presentation verifier.',
);

console.log('AI review generation presentation verification passed');
