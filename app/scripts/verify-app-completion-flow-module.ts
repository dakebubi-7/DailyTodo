import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const helperPath = join(root, 'src/app/appCompletionFlow.ts');
const actionsPath = join(root, 'src/app/appCompletionActions.ts');
const appPath = join(root, 'src/App.tsx');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(helperPath), 'App completion flow helper module should exist.');

const helper = readFileSync(helperPath, 'utf8');
const actions = readFileSync(actionsPath, 'utf8');
const app = readFileSync(appPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export type CompletionTarget\b/, 'helper should export CompletionTarget.');
assert.match(helper, /export type ToggleCompletionDecision\b/, 'helper should export ToggleCompletionDecision.');
assert.match(helper, /export type ViewCompletionDecision\b/, 'helper should export ViewCompletionDecision.');
assert.match(helper, /export function getMainTaskToggleDecision\b/, 'helper should export getMainTaskToggleDecision.');
assert.match(helper, /export function getSubtaskToggleDecision\b/, 'helper should export getSubtaskToggleDecision.');
assert.match(helper, /export function resolveCompletionTarget\b/, 'helper should export resolveCompletionTarget.');
assert.match(helper, /export function getViewCompletionDecision\b/, 'helper should export getViewCompletionDecision.');
assert.match(helper, /task\.completed/, 'helper should preserve completed-task direct toggle behavior.');
assert.match(helper, /mainTaskCompletionReviewEnabled/, 'helper should preserve main-task review setting branching.');
assert.match(helper, /subtaskCompletionReviewEnabled/, 'helper should preserve subtask review setting branching.');
assert.match(helper, /mode: 'task'/, 'helper should preserve task target mode.');
assert.match(helper, /mode: 'subtask'/, 'helper should preserve subtask target mode.');
assert.match(helper, /completionTarget\?\.id === taskId \? completionTarget : \{ mode: 'task' as const, id: taskId \}/, 'helper should preserve fallback target resolution.');
assert.match(helper, /Boolean\(task\.completionReviews\?\.length \|\| task\.completionReview\)/, 'helper should preserve review-presence detection.');
assert.match(helper, /isSubtask\(task\) \? 'subtask' : 'task'/, 'helper should preserve view target mode detection.');
assert.match(helper, /!hasReview && task\.completed/, 'helper should preserve completed-without-review edit route.');

assert.match(actions, /from '\.\/appCompletionFlow'/, 'Completion action helper should import completion flow helpers.');
assert.match(actions, /getMainTaskToggleDecision\(/, 'Completion action helper should delegate main task toggle decision.');
assert.match(actions, /getSubtaskToggleDecision\(/, 'Completion action helper should delegate subtask toggle decision.');
assert.match(actions, /resolveCompletionTarget\(completionTarget, taskId\)/, 'Completion action helper should delegate completion target resolution.');
assert.match(actions, /getViewCompletionDecision\(task\)/, 'Completion action helper should delegate review view routing.');
assert.doesNotMatch(app, /const target = completionTarget\?\.id === taskId \? completionTarget : \{ mode: 'task' as const, id: taskId \}/, 'App should not inline completion target fallback.');
assert.doesNotMatch(app, /const hasReview = Boolean\(task\.completionReviews\?\.length \|\| task\.completionReview\)/, 'App should not inline review-presence detection.');
assert.doesNotMatch(app, /isSubtask\(task\) \? 'subtask' : 'task'/, 'App should not inline subtask mode detection for review routing.');
assert.equal(scripts['verify:app-completion-flow-module'], 'tsx scripts/verify-app-completion-flow-module.ts', 'package.json should expose the focused completion-flow verifier.');
assertCleanupCoreIncludes('verify:app-completion-flow-module', 'cleanup-core should include the focused completion-flow verifier.');

console.log('App completion flow helper verification passed');
