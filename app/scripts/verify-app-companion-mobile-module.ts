import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const helperPath = join(root, 'src/app/appCompanionMobile.ts');
const appPath = join(root, 'src/App.tsx');
const actionsHelperPath = join(root, 'src/app/appCompanionActions.ts');
const localStatePath = join(root, 'src/app/useAppLocalState.ts');
const shellCompositionHookPath = join(root, 'src/app/useAppShellComposition.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(helperPath), 'App companion mobile helper module should exist.');
assert.ok(existsSync(actionsHelperPath), 'App Companion actions helper module should exist.');
assert.ok(existsSync(localStatePath), 'App local state hook should exist for mobile capture state ownership verification.');
assert.ok(existsSync(shellCompositionHookPath), 'Runtime shell composition hook should exist for mobile capture action wiring verification.');

const helper = readFileSync(helperPath, 'utf8');
const actionsHelper = readFileSync(actionsHelperPath, 'utf8');
const localState = readFileSync(localStatePath, 'utf8');
const shellCompositionHook = readFileSync(shellCompositionHookPath, 'utf8');
const app = readFileSync(appPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export function mergeImportedMobileCaptureItems\b/, 'helper should export mergeImportedMobileCaptureItems.');
assert.match(helper, /existing: CaptureItem\[\]/, 'helper should accept existing CaptureItem array.');
assert.match(helper, /items: CaptureItem\[\]/, 'helper should accept imported CaptureItem array.');
assert.match(helper, /if \(!items\.length\) return existing;/, 'helper should preserve no-item identity behavior.');
assert.match(helper, /return \[\.\.\.existing, \.\.\.items\];/, 'helper should append imported items after existing items.');

assert.match(actionsHelper, /from '\.\/appCompanionMobile'/, 'Companion actions helper should import companion mobile helper.');
assert.match(actionsHelper, /mergeImportedMobileCaptureItems\(existing, result\.items\)/, 'Companion actions helper should delegate mobile capture item merging.');
assert.match(actionsHelper, /setMobileCaptureItems\(\(existing\) => mergeImportedMobileCaptureItems\(existing, result\.items\)\)/, 'Companion actions helper should keep state update ownership while delegating merge logic.');
assert.match(app, /useAppLocalState\(\)/, 'App should obtain local mobile capture state through the local state hook.');
assert.match(localState, /setMobileCaptureItems/, 'App local state hook should own the mobile capture item state setter.');
assert.match(shellCompositionHook, /setMobileCaptureItems: appState\.setMobileCaptureItems/, 'Runtime shell composition hook should pass the mobile capture item setter into companion actions.');
assert.doesNotMatch(actionsHelper, /if \(result\.items\.length\) \{\s*setMobileCaptureItems\(\(existing\) => \[\.\.\.existing, \.\.\.result\.items\]\);\s*\}/s, 'Companion actions helper should not inline imported mobile item merge.');
assert.doesNotMatch(app, /if \(result\.items\.length\) \{\s*setMobileCaptureItems\(\(existing\) => \[\.\.\.existing, \.\.\.result\.items\]\);\s*\}/s, 'App should not inline imported mobile item merge.');
assert.equal(scripts['verify:app-companion-mobile-module'], 'tsx scripts/verify-app-companion-mobile-module.ts', 'package.json should expose the focused companion mobile verifier.');
assertCleanupCoreIncludes('verify:app-companion-mobile-module', 'cleanup-core should include the focused companion mobile verifier.');

console.log('App companion mobile helper verification passed');
