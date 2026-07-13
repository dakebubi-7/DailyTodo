import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'mainLocalization.ts');
const mainPath = join(root, 'electron', 'main.ts');
const mainObsidianServicesPath = join(root, 'electron', 'mainObsidianServices.ts');
const mainAiReviewServicesPath = join(root, 'electron', 'mainAiReviewServices.ts');
const appStateAccessorsPath = join(root, 'electron', 'appStateAccessors.ts');
const dailyNoteContentPath = join(root, 'electron', 'obsidianDailyNoteContent.ts');
const shellControllerPath = join(root, 'electron', 'mainShellController.ts');
const bootstrapPath = join(root, 'electron', 'mainWindowBootstrap.ts');
const compositionPath = join(root, 'electron', 'mainWindowComposition.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron main localization module should exist.');

const helper = readFileSync(modulePath, 'utf8');
const main = readFileSync(mainPath, 'utf8');
const mainObsidianServices = readFileSync(mainObsidianServicesPath, 'utf8');
const mainAiReviewServices = readFileSync(mainAiReviewServicesPath, 'utf8');
const appStateAccessors = readFileSync(appStateAccessorsPath, 'utf8');
const dailyNoteContent = readFileSync(dailyNoteContentPath, 'utf8');
const shellController = readFileSync(shellControllerPath, 'utf8');
const bootstrap = readFileSync(bootstrapPath, 'utf8');
const composition = readFileSync(compositionPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export type MainLocalizer = \(text: string\) => string;/, 'mainLocalization should export the localizer function type.');
assert.match(helper, /export function zh\(text: string\): string \{\s*return text;\s*\}/, 'mainLocalization should preserve the existing identity zh localizer.');

assert.match(main, /from '\.\/mainLocalization'/, 'main should import the main-process localizer helper.');
assert.doesNotMatch(main, /function zh\(text: string\) \{\s*return text;\s*\}/, 'main should not keep the identity localizer inline after extraction.');
assert.match(main, /createAppStateAccessors\(\{[\s\S]*?zh,[\s\S]*?\}\)/, 'main should keep passing zh into app-state accessors.');
assert.match(main, /createMainAiReviewServices\(\{[\s\S]*?zh,[\s\S]*?\}\)/, 'main should keep passing zh into the AI review service composition root.');
assert.match(mainAiReviewServices, /createMainObsidianServices\(\{[\s\S]*?zh,[\s\S]*?\}\)/, 'AI review services should pass zh into the Obsidian service composition root.');
assert.match(mainObsidianServices, /createObsidianDailyNoteContentHelpers\(\{[\s\S]*?zh,[\s\S]*?\}\)/, 'mainObsidianServices should pass zh into Obsidian daily-note helpers.');
assert.match(main, /createMainWindowComposition\(\{[\s\S]*?zh,[\s\S]*?\}\)/, 'main should keep passing zh into main-window composition.');
assert.match(composition, /createMainShellController\(\{[\s\S]*?zh:[\s\S]*?zh,[\s\S]*?\}\)/, 'main-window composition should pass zh into the shell controller.');
assert.match(composition, /createMainWindowBootstrap\(\{[\s\S]*?\.\.\.bootstrapDependencies,[\s\S]*?\}\)/, 'main-window composition should forward localized bootstrap dependencies.');

assert.match(appStateAccessors, /zh\(text: string\): string;/, 'appStateAccessors should continue to depend on a localizer callback.');
assert.match(dailyNoteContent, /zh\(text: string\): string;/, 'obsidianDailyNoteContent should continue to depend on a localizer callback.');
assert.match(shellController, /zh\(text: string\): string;/, 'mainShellController should continue to depend on a localizer callback.');
assert.match(bootstrap, /zh\(text: string\): string;/, 'mainWindowBootstrap should continue to depend on a localizer callback.');

assert.equal(
  scripts['verify:electron-main-localization-module'],
  'tsx scripts/verify-electron-main-localization-module.ts',
  'package.json should expose the focused main localization verifier.',
);
assertCleanupCoreIncludes('verify:electron-main-localization-module', 'cleanup-core should include the focused main localization verifier.');

console.log('electron main localization module verification passed');
