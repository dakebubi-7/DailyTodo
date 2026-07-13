import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron/aiReviewTimers.ts');
const servicesPath = join(root, 'electron/mainAiReviewServices.ts');
const mainPath = join(root, 'electron/main.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron AI review timer module should exist.');

const helper = readFileSync(modulePath, 'utf8');
const services = readFileSync(servicesPath, 'utf8');
const main = readFileSync(mainPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /getNextTimerDelay/, 'AI review timer module should own daily timer delay calculation.');
assert.match(helper, /getNextWeeklyDelay/, 'AI review timer module should own weekly timer delay calculation.');
assert.match(helper, /getNextMonthlyDelay/, 'AI review timer module should own monthly timer delay calculation.');
assert.match(helper, /export function createAiReviewTimerScheduler\b/, 'AI review timer module should export a timer scheduler factory.');
assert.match(helper, /function scheduleAiTimer\b/, 'AI review timer module should own the daily timer scheduler.');
assert.match(helper, /function scheduleWeeklyTimer\b/, 'AI review timer module should own the weekly timer scheduler.');
assert.match(helper, /function scheduleMonthlyTimer\b/, 'AI review timer module should own the monthly timer scheduler.');
assert.match(helper, /function scheduleExternalWeeklyTimer\b/, 'AI review timer module should own the external weekly timer scheduler.');
assert.match(helper, /function scheduleExternalMonthlyTimer\b/, 'AI review timer module should own the external monthly timer scheduler.');
assert.match(helper, /function scheduleAiTimers\b/, 'AI review timer module should own the shared AI timer rescheduler.');
assert.match(helper, /'aiReview:tick'/, 'AI review timer module should preserve the daily timer event.');
assert.match(helper, /'aiReview:weeklyTick'/, 'AI review timer module should preserve the weekly timer event.');
assert.match(helper, /'aiReview:monthlyTick'/, 'AI review timer module should preserve the monthly timer event.');
assert.match(helper, /'aiReview:externalWeeklyTick'/, 'AI review timer module should preserve the external weekly timer event.');
assert.match(helper, /'aiReview:externalMonthlyTick'/, 'AI review timer module should preserve the external monthly timer event.');

assert.match(services, /from '\.\/aiReviewTimers'/, 'services composition should import timer scheduling from aiReviewTimers.');
assert.match(services, /createAiReviewTimerScheduler\(\{/, 'services composition should create the AI review timer scheduler through the module.');
assert.match(services, /getAiReviewSettings,/, 'services composition should pass AI review settings access into the timer scheduler.');
assert.match(services, /getMainWindow,/, 'services composition should pass runtime main-window access into the timer scheduler.');
assert.match(main, /scheduleAiTimers,/, 'main should continue to pass the shared timer rescheduler to its consumers.');

for (const movedFunction of [
  'scheduleAiTimer',
  'scheduleWeeklyTimer',
  'scheduleMonthlyTimer',
  'scheduleExternalWeeklyTimer',
  'scheduleExternalMonthlyTimer',
]) {
  const declarationPattern = new RegExp(`function ${movedFunction}\\b`);
  assert.doesNotMatch(main, declarationPattern, `main should not keep ${movedFunction} inline after extraction.`);
}

assert.equal(
  scripts['verify:electron-ai-review-timer-module'],
  'tsx scripts/verify-electron-ai-review-timer-module.ts',
  'package.json should expose the focused AI review timer verifier.',
);
assertCleanupCoreIncludes('verify:electron-ai-review-timer-module', 'cleanup-core should include the focused AI review timer verifier.');

console.log('electron AI review timer module verification passed');
