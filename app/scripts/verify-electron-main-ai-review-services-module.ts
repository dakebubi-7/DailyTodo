import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const servicesPath = join(root, 'electron/mainAiReviewServices.ts');
const mainPath = join(root, 'electron/main.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(servicesPath), 'main AI review services composition module should exist.');

const services = readFileSync(servicesPath, 'utf8');
const main = readFileSync(mainPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(services, /export function createMainAiReviewServices\b/, 'services module should export its composition factory.');
assert.match(services, /createAiReviewRuntimeHelpers\(\{[\s\S]*?getAiReviewSettings/, 'services module should compose AI runtime helpers.');
assert.match(services, /const aiReviewRunnerBridge = createAiReviewRunnerBridge\(\)/, 'services module should create the delayed runner bridge before Obsidian services.');
assert.match(services, /createMainObsidianServices\(\{[\s\S]*?runReviewForDate: aiReviewRunnerBridge\.runReviewForDate/, 'services module should inject the bridge callback into Obsidian services.');
assert.match(services, /createAiReviewDailyRunner\(\{[\s\S]*?getDailyFilePath/, 'services module should create the daily runner from Obsidian path access.');
assert.match(services, /aiReviewRunnerBridge\.setRunner\(runReviewForDate\)/, 'services module should bind the concrete daily runner after construction.');
assert.match(services, /createAiReviewTimerScheduler\(\{[\s\S]*?getMainWindow/, 'services module should compose the timer scheduler.');

for (const capability of [
  'ensureReportLlmAvailable',
  'emitAiReviewProgress',
  'createDiagnostic',
  'extractDocxText',
  'inspectDailyAiContent',
  'runReviewForDate',
  'scheduleAiTimers',
  'syncTasksToObsidian',
  'previewTasksToObsidian',
  'buildDailyTemplate',
  'triggerOverviewUpdate',
]) {
  assert.match(services, new RegExp(`\\b${capability},`), `services module should return ${capability}.`);
}

assert.match(main, /from '\.\/mainAiReviewServices'/, 'main should import the focused AI review services composition helper.');
assert.match(main, /createMainAiReviewServices\(\{/, 'main should create AI review and Obsidian services through the composition helper.');
assert.doesNotMatch(main, /from '\.\/aiReviewRuntime'/, 'main should not import AI runtime helpers directly after services composition extraction.');
assert.doesNotMatch(main, /from '\.\/aiReviewDailyRunner'/, 'main should not import the daily runner directly after services composition extraction.');
assert.doesNotMatch(main, /from '\.\/aiReviewRunnerBridge'/, 'main should not import the runner bridge directly after services composition extraction.');
assert.doesNotMatch(main, /from '\.\/aiReviewTimers'/, 'main should not import timer scheduling directly after services composition extraction.');
assert.doesNotMatch(main, /from '\.\/mainObsidianServices'/, 'main should not import Obsidian services directly after services composition extraction.');

assert.equal(
  scripts['verify:electron-main-ai-review-services-module'],
  'tsx scripts/verify-electron-main-ai-review-services-module.ts',
  'package.json should expose the focused main AI review services verifier.',
);
assertCleanupCoreIncludes('verify:electron-main-ai-review-services-module', 'cleanup-core should include the focused main AI review services verifier.');

console.log('electron main AI review services module verification passed');
