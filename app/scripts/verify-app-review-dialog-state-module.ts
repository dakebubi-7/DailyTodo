import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const helperPath = join(root, 'src/app/appReviewDialogState.ts');
const shellHelperPath = join(root, 'src/app/appShellComposition.tsx');
const overlayHelperPath = join(root, 'src/app/appShellOverlayComposition.ts');
const shellCompositionHookPath = join(root, 'src/app/useAppShellComposition.ts');
const shellInputsPath = join(root, 'src/app/appShellCompositionInputs.ts');
const appPath = join(root, 'src/App.tsx');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(helperPath), 'App review dialog state helper module should exist.');
assert.ok(existsSync(shellHelperPath), 'App shell composition helper should exist for review dialog state wiring verification.');
assert.ok(existsSync(overlayHelperPath), 'App shell overlay composition helper should exist for review dialog state wiring verification.');
assert.ok(existsSync(shellCompositionHookPath), 'Runtime shell composition hook should exist for review dialog state wiring verification.');
assert.ok(existsSync(shellInputsPath), 'Pure shell-inputs helper should exist for review dialog state wiring verification.');

const helper = readFileSync(helperPath, 'utf8');
const shellHelper = readFileSync(shellHelperPath, 'utf8');
const overlayHelper = readFileSync(overlayHelperPath, 'utf8');
const shellCompositionHook = readFileSync(shellCompositionHookPath, 'utf8');
const shellInputs = readFileSync(shellInputsPath, 'utf8');
const app = readFileSync(appPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export interface AppReviewDialogState\b/, 'helper should export AppReviewDialogState.');
assert.match(helper, /export function createAppReviewDialogState\b/, 'helper should export createAppReviewDialogState.');
assert.match(helper, /findTaskInTree\(allTasks, reviewTask\.id\)/, 'helper should preserve current review task lookup.');
assert.match(helper, /completionTask,/, 'helper should preserve completion dialog task passthrough.');
assert.match(helper, /currentReviewTask: reviewTask \? findTaskInTree\(allTasks, reviewTask\.id\) : null/, 'helper should preserve nullable review dialog task derivation.');

assert.match(app, /useAppShellComposition\(\{/, 'App should delegate review dialog wiring through the runtime composition hook.');
assert.match(shellCompositionHook, /from '\.\/appReviewDialogState'/, 'Runtime shell composition hook should import review dialog state helper.');
assert.match(shellCompositionHook, /createAppReviewDialogState\(\{\s*allTasks: taskState\.allTasks,\s*completionTask: appState\.completionTask,\s*reviewTask: appState\.reviewTask,\s*\}\)/s, 'Runtime shell composition hook should delegate review dialog state derivation.');
assert.match(shellInputs, /reviewDialogState,/, 'Pure shell-inputs helper should pass review dialog state into the shell composition helper.');
assert.match(shellHelper, /createAppShellOverlayComposition\(\{[\s\S]*reviewDialogState,[\s\S]*\}\);/, 'Shell composition should forward derived review dialog state into the overlay helper.');
assert.match(overlayHelper, /task: reviewDialogState\.completionTask/, 'Overlay composition should consume derived completion dialog task.');
assert.match(overlayHelper, /task: reviewDialogState\.currentReviewTask/, 'Overlay composition should consume derived current review task.');
assert.doesNotMatch(app, /const currentReviewTask = reviewTask \? findTaskInTree\(allTasks, reviewTask\.id\) : null;/, 'App should not inline current review task lookup.');
assert.equal(scripts['verify:app-review-dialog-state-module'], 'tsx scripts/verify-app-review-dialog-state-module.ts', 'package.json should expose the focused review dialog state verifier.');
assertCleanupCoreIncludes('verify:app-review-dialog-state-module', 'cleanup-core should include the focused review dialog state verifier.');

console.log('App review dialog state helper verification passed');
