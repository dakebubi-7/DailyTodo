import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const helperPath = join(root, 'src/app/appAiReviewLifecycle.ts');
const runtimeHookPath = join(root, 'src/app/useAppRuntimeEffects.ts');
const appPath = join(root, 'src/App.tsx');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(helperPath), 'App AI review lifecycle helper module should exist.');
assert.ok(existsSync(runtimeHookPath), 'App runtime effects hook module should exist.');

const helper = readFileSync(helperPath, 'utf8');
const runtimeHook = readFileSync(runtimeHookPath, 'utf8');
const app = readFileSync(appPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export function registerAiReviewLifecycle\b/, 'helper should export registerAiReviewLifecycle.');
assert.match(helper, /export function requestAiReviewOnboarding\b/, 'helper should export requestAiReviewOnboarding.');
assert.match(helper, /normalizeAiReviewSettings\(/, 'helper should normalize AI Review settings returns before use.');
assert.match(helper, /startupBackfillEnabled/, 'helper should preserve startup backfill settings guard.');
assert.match(helper, /getCurrentTasks\(\)/, 'helper should read tasks lazily for startup and scheduled callbacks.');
assert.match(helper, /aiReview\?\.backfill\(getCurrentTasks\(\)\)/, 'helper should preserve daily backfill behavior.');
assert.match(helper, /readAiReviewBackfillReport/, 'helper should parse backfill IPC returns before any future side effects.');
assert.match(helper, /backfill\(getCurrentTasks\(\)\)\.then\(readAiReviewBackfillReport\)/, 'helper should revalidate backfill IPC returns at the lifecycle boundary.');
assert.match(helper, /onTick\(\(\) => \{/, 'helper should register the daily AI review tick listener.');
assert.match(helper, /onWeeklyTick\(\(\) => \{/, 'helper should register the weekly AI review tick listener.');
assert.match(helper, /onMonthlyTick\(\(\) => \{/, 'helper should register the monthly AI review tick listener.');
assert.match(helper, /generateWeekly\(getScheduledWeeklyReportDateKey\(\), getCurrentTasks\(\)\)\.then\(handleScheduledReportResult\)/, 'helper should preserve weekly date selection, lazy tasks, and result handling.');
assert.match(helper, /generateMonthly\(getScheduledMonthlyReportDateKey\(\), getCurrentTasks\(\)\)\.then\(handleScheduledReportResult\)/, 'helper should preserve monthly date selection, lazy tasks, and result handling.');
assert.match(helper, /offDaily\?\.\(\)/, 'helper cleanup should unsubscribe the daily tick listener.');
assert.match(helper, /offWeekly\?\.\(\)/, 'helper cleanup should unsubscribe the weekly tick listener.');
assert.match(helper, /offMonthly\?\.\(\)/, 'helper cleanup should unsubscribe the monthly tick listener.');
assert.match(helper, /shouldShowOnboarding\(settings\)/, 'helper should preserve onboarding visibility rules.');
assert.match(helper, /let active = true/, 'helper should guard asynchronous onboarding completion.');
assert.match(helper, /active = false/, 'helper onboarding cleanup should deactivate pending async completion.');

assert.match(app, /from '\.\/app\/useAppRuntimeEffects'/, 'App should import the runtime effects hook.');
assert.match(app, /useAppRuntimeEffects\(\{/, 'App should delegate runtime effects through the runtime hook.');
assert.match(runtimeHook, /from '\.\/appAiReviewLifecycle'/, 'runtime hook should import AI review lifecycle helpers.');
assert.match(runtimeHook, /registerAiReviewLifecycle\(\{/, 'runtime hook should delegate AI review startup and tick registration.');
assert.match(runtimeHook, /requestAiReviewOnboarding\(\{/, 'runtime hook should delegate AI onboarding request logic.');
assert.match(runtimeHook, /getCurrentTasks: \(\) => allTasksRef\.current/, 'runtime hook should pass a lazy allTasks reader to the lifecycle helper.');
assert.match(runtimeHook, /setAiOnboarding: appState\.setAiOnboarding/, 'runtime hook should keep AI onboarding state ownership in App state while passing its setter.');
assert.doesNotMatch(app, /startupBackfillEnabled[\s\S]{0,120}backfill\(allTasksRef\.current\)/, 'App should not inline startup backfill logic.');
assert.doesNotMatch(app, /onWeeklyTick\(\(\) => \{[\s\S]{0,200}generateWeekly/, 'App should not inline weekly scheduled AI review generation.');
assert.doesNotMatch(app, /onMonthlyTick\(\(\) => \{[\s\S]{0,200}generateMonthly/, 'App should not inline monthly scheduled AI review generation.');
assert.doesNotMatch(app, /shouldShowOnboarding\(settings\)/, 'App should not inline AI onboarding visibility checks.');
assert.equal(scripts['verify:app-ai-review-lifecycle-module'], 'tsx scripts/verify-app-ai-review-lifecycle-module.ts', 'package.json should expose the focused AI review lifecycle verifier.');
assertCleanupCoreIncludes('verify:app-ai-review-lifecycle-module', 'cleanup-core should include the focused AI review lifecycle verifier.');

console.log('App AI review lifecycle helper verification passed');
