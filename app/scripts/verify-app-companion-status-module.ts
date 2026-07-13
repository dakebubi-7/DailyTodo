import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const helperPath = join(root, 'src/app/appCompanionStatus.ts');
const appPath = join(root, 'src/App.tsx');
const actionsHelperPath = join(root, 'src/app/appCompanionActions.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(helperPath), 'App companion status helper module should exist.');
assert.ok(existsSync(actionsHelperPath), 'App Companion actions helper module should exist.');

const helper = readFileSync(helperPath, 'utf8');
const actionsHelper = readFileSync(actionsHelperPath, 'utf8');
const app = readFileSync(appPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export function getCompanionPreviewStatus\b/, 'helper should export getCompanionPreviewStatus.');
assert.match(helper, /export function getCompanionSyncStatus\b/, 'helper should export getCompanionSyncStatus.');
assert.match(helper, /export function getCompanionMobileImportStatus\b/, 'helper should export getCompanionMobileImportStatus.');
assert.match(helper, /Preview ready: \$\{plan\.changes\.length\} change\(s\)\./, 'helper should preserve preview success copy and change count.');
assert.match(helper, /Synced to Obsidian\./, 'helper should preserve sync success copy.');
assert.match(helper, /Imported \$\{result\.items\.length\} mobile item\(s\)\./, 'helper should preserve mobile import success copy and count.');
assert.match(helper, /errors\.join\(' '\)/, 'helper should preserve error joining behavior.');

assert.match(actionsHelper, /from '\.\/appCompanionStatus'/, 'Companion actions helper should import companion status helpers.');
assert.match(actionsHelper, /getCompanionPreviewStatus\(plan\)/, 'Companion actions helper should delegate preview status copy.');
assert.match(actionsHelper, /getCompanionSyncStatus\(result\)/, 'Companion actions helper should delegate sync status copy.');
assert.match(actionsHelper, /getCompanionMobileImportStatus\(result\)/, 'Companion actions helper should delegate mobile import status copy.');
assert.doesNotMatch(actionsHelper, /Preview ready: \$\{plan\.changes\.length\} change\(s\)\./, 'Companion actions helper should not inline preview status copy.');
assert.doesNotMatch(app, /Preview ready: \$\{plan\.changes\.length\} change\(s\)\./, 'App should not inline preview status copy.');
assert.doesNotMatch(actionsHelper, /Synced to Obsidian\./, 'Companion actions helper should not inline sync status copy.');
assert.doesNotMatch(app, /Synced to Obsidian\./, 'App should not inline sync status copy.');
assert.doesNotMatch(actionsHelper, /Imported \$\{result\.items\.length\} mobile item\(s\)\./, 'Companion actions helper should not inline mobile import status copy.');
assert.doesNotMatch(app, /Imported \$\{result\.items\.length\} mobile item\(s\)\./, 'App should not inline mobile import status copy.');
assert.equal(scripts['verify:app-companion-status-module'], 'tsx scripts/verify-app-companion-status-module.ts', 'package.json should expose the focused companion status verifier.');
assertCleanupCoreIncludes('verify:app-companion-status-module', 'cleanup-core should include the focused companion status verifier.');

console.log('App companion status helper verification passed');
