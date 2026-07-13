import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'appEnvironment.ts');
const mainPath = join(root, 'electron', 'main.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron app environment module should exist.');

const helper = readFileSync(modulePath, 'utf8');
const main = readFileSync(mainPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export function createAppEnvironment\b/, 'appEnvironment should export createAppEnvironment.');
assert.match(helper, /type CreateAppEnvironmentOptions\b/, 'appEnvironment should define explicit environment dependencies.');
assert.match(helper, /const DEV_APPDATA_ROOT = 'G:\\\\Personal-AI\\\\DailyTodo\\\\data';/, 'appEnvironment should own the development app-data path.');
assert.match(helper, /const DEV_OBSIDIAN_PATH = 'G:\\\\Personal-AI\\\\Personal-KB';/, 'appEnvironment should own the development Obsidian path.');
assert.match(helper, /const LOCAL_BLOG_DRAFT_DIR = 'C:\\\\Users\\\\25788\\\\blog\\\\content\\\\posts';/, 'appEnvironment should own the local blog draft path.');
assert.match(helper, /function isDevelopmentBuild\(\)/, 'appEnvironment should own build-mode detection.');
assert.match(helper, /return !app\.isPackaged;/, 'appEnvironment should define development mode as !app.isPackaged.');
assert.match(helper, /function applyDevelopmentUserDataOverride\(\)/, 'appEnvironment should own development userData override wiring.');
assert.match(helper, /fs\.existsSync\(DEV_APPDATA_ROOT\)/, 'appEnvironment should guard the userData override behind the dev app-data path existing.');
assert.match(
  helper,
  /fs\.statSync\(DEV_APPDATA_ROOT\)\.isDirectory\(\)/,
  'appEnvironment should only apply the development userData override when the path is a directory.',
);
assert.match(helper, /app\.setPath\('userData', DEV_APPDATA_ROOT\)/, 'appEnvironment should apply the development userData override.');
assert.match(helper, /function getIconPathOptions\(\): IconPathOptions/, 'appEnvironment should own icon path option construction.');
assert.match(helper, /isDevelopment: isDevelopmentBuild\(\)/, 'appEnvironment should preserve icon path dev/prod switching.');
assert.match(helper, /appDirname,/, 'appEnvironment should preserve appDirname in icon path options.');
assert.match(helper, /resourcesPath,/, 'appEnvironment should preserve resourcesPath in icon path options.');
assert.match(helper, /return \{[\s\S]*isDevelopmentBuild,[\s\S]*applyDevelopmentUserDataOverride,[\s\S]*getIconPathOptions,[\s\S]*devObsidianPath: DEV_OBSIDIAN_PATH,[\s\S]*localBlogDraftDir: LOCAL_BLOG_DRAFT_DIR,[\s\S]*\}/, 'appEnvironment should return the environment helper set.');

assert.match(main, /from '\.\/appEnvironment'/, 'main should import the app environment helper.');
assert.match(main, /const \{[\s\S]*isDevelopmentBuild,[\s\S]*applyDevelopmentUserDataOverride,[\s\S]*getIconPathOptions,[\s\S]*devObsidianPath,[\s\S]*localBlogDraftDir,[\s\S]*\} = createAppEnvironment\(\{[\s\S]*app,[\s\S]*appDirname: __dirname,[\s\S]*resourcesPath: process\.resourcesPath,[\s\S]*\}\)/, 'main should create and destructure the app environment helper.');
assert.match(main, /applyDevelopmentUserDataOverride\(\);/, 'main should trigger the shared development userData override helper.');
assert.match(main, /createAppStateAccessors\(\{[\s\S]*isDevelopmentBuild,[\s\S]*devObsidianPath,[\s\S]*zh,[\s\S]*\}\)/, 'main should pass the shared environment helpers into appStateAccessors.');
assert.match(main, /localBlogDraftDir,/, 'main should pass the shared local blog draft path into Obsidian sync helpers.');

assert.doesNotMatch(main, /import fs from 'fs';/, 'main should not import fs directly after appEnvironment extraction.');
assert.doesNotMatch(main, /const DEV_APPDATA_ROOT = 'G:\\\\Personal-AI\\\\DailyTodo\\\\data';/, 'main should not keep the dev app-data path inline after extraction.');
assert.doesNotMatch(main, /const DEV_OBSIDIAN_PATH = 'G:\\\\Personal-AI\\\\Personal-KB';/, 'main should not keep the dev Obsidian path inline after extraction.');
assert.doesNotMatch(main, /const LOCAL_BLOG_DRAFT_DIR = 'C:\\\\Users\\\\25788\\\\blog\\\\content\\\\posts';/, 'main should not keep the local blog draft path inline after extraction.');
assert.doesNotMatch(main, /function isDevelopmentBuild\(\)/, 'main should not define isDevelopmentBuild inline after extraction.');
assert.doesNotMatch(main, /function getIconPathOptions\(\): IconPathOptions/, 'main should not define getIconPathOptions inline after extraction.');
assert.doesNotMatch(main, /app\.setPath\('userData', DEV_APPDATA_ROOT\)/, 'main should not apply the development userData override inline after extraction.');

assert.equal(
  scripts['verify:electron-app-environment-module'],
  'tsx scripts/verify-electron-app-environment-module.ts',
  'package.json should expose the focused app environment verifier.',
);
assertCleanupCoreIncludes('verify:electron-app-environment-module', 'cleanup-core should include the focused app environment verifier.');

console.log('electron app environment module verification passed');
