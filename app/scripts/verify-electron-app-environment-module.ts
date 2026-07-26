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
assert.match(helper, /const USER_DATA_OVERRIDE_ENV = 'DAILTODO_USER_DATA_DIR';/, 'appEnvironment should define an explicit development user-data override variable.');
assert.match(helper, /const OBSIDIAN_PATH_OVERRIDE_ENV = 'DAILTODO_OBSIDIAN_PATH';/, 'appEnvironment should define an explicit development Obsidian override variable.');
assert.match(helper, /const BLOG_DRAFT_DIR_OVERRIDE_ENV = 'DAILTODO_BLOG_DRAFT_DIR';/, 'appEnvironment should define an explicit development blog-draft override variable.');
assert.match(helper, /env\?: NodeJS\.ProcessEnv;/, 'appEnvironment should accept environment values as an explicit dependency.');
assert.doesNotMatch(helper, /G:\\Personal-AI|C:\\Users\\25788/, 'appEnvironment should not contain machine-specific paths.');
assert.match(helper, /function isDevelopmentBuild\(\)/, 'appEnvironment should own build-mode detection.');
assert.match(helper, /return !app\.isPackaged;/, 'appEnvironment should define development mode as !app.isPackaged.');
assert.match(helper, /function applyDevelopmentUserDataOverride\(\)/, 'appEnvironment should own development userData override wiring.');
assert.match(helper, /const userDataDirectory = isDevelopmentBuild\(\) \? env\[USER_DATA_OVERRIDE_ENV\] : '';/, 'appEnvironment should only read user-data overrides for development builds.');
assert.match(helper, /fs\.existsSync\(userDataDirectory\)/, 'appEnvironment should guard the userData override behind the configured path existing.');
assert.match(helper, /fs\.statSync\(userDataDirectory\)\.isDirectory\(\)/, 'appEnvironment should only apply the development userData override when the configured path is a directory.');
assert.match(helper, /app\.setPath\('userData', userDataDirectory\)/, 'appEnvironment should apply the development userData override.');
assert.match(helper, /const devObsidianPath = isDevelopmentBuild\(\) \? env\[OBSIDIAN_PATH_OVERRIDE_ENV\] \|\| '' : '';/, 'appEnvironment should keep Obsidian overrides development-only.');
assert.match(helper, /const localBlogDraftDir = isDevelopmentBuild\(\) \? env\[BLOG_DRAFT_DIR_OVERRIDE_ENV\] \|\| '' : '';/, 'appEnvironment should keep blog-draft overrides development-only.');
assert.match(helper, /function getIconPathOptions\(\): IconPathOptions/, 'appEnvironment should own icon path option construction.');
assert.match(helper, /isDevelopment: isDevelopmentBuild\(\)/, 'appEnvironment should preserve icon path dev/prod switching.');
assert.match(helper, /appDirname,/, 'appEnvironment should preserve appDirname in icon path options.');
assert.match(helper, /resourcesPath,/, 'appEnvironment should preserve resourcesPath in icon path options.');
assert.match(helper, /return \{[\s\S]*isDevelopmentBuild,[\s\S]*applyDevelopmentUserDataOverride,[\s\S]*getIconPathOptions,[\s\S]*devObsidianPath,[\s\S]*localBlogDraftDir,[\s\S]*\}/, 'appEnvironment should return the environment helper set.');

assert.match(main, /from '\.\/appEnvironment'/, 'main should import the app environment helper.');
assert.match(main, /const \{[\s\S]*isDevelopmentBuild,[\s\S]*applyDevelopmentUserDataOverride,[\s\S]*getIconPathOptions,[\s\S]*devObsidianPath,[\s\S]*localBlogDraftDir,[\s\S]*\} = createAppEnvironment\([\s\S]*app,[\s\S]*appDirname: __dirname,[\s\S]*resourcesPath: process\.resourcesPath,[\s\S]*\}/, 'main should create and destructure the app environment helper.');
assert.match(main, /applyDevelopmentUserDataOverride\(\);/, 'main should trigger the shared development userData override helper.');
assert.match(main, /createAppStateAccessors\([\s\S]*isDevelopmentBuild,[\s\S]*devObsidianPath,[\s\S]*zh,[\s\S]*\}/, 'main should pass the shared environment helpers into appStateAccessors.');
assert.match(main, /localBlogDraftDir,/, 'main should pass the shared local blog draft path into Obsidian sync helpers.');
assert.doesNotMatch(main, /import fs from 'fs';/, 'main should not import fs directly after appEnvironment extraction.');
assert.doesNotMatch(main, /G:\\Personal-AI|C:\\Users\\25788/, 'main should not keep machine-specific paths inline after environment extraction.');
assert.doesNotMatch(main, /function isDevelopmentBuild\(\)/, 'main should not define isDevelopmentBuild inline after extraction.');
assert.doesNotMatch(main, /function getIconPathOptions\(\): IconPathOptions/, 'main should not define getIconPathOptions inline after extraction.');
assert.doesNotMatch(main, /app\.setPath\('userData'/, 'main should not apply the development userData override inline after extraction.');

assert.equal(
  scripts['verify:electron-app-environment-module'],
  'tsx scripts/verify-electron-app-environment-module.ts',
  'package.json should expose the focused app environment verifier.',
);
assertCleanupCoreIncludes('verify:electron-app-environment-module', 'cleanup-core should include the focused app environment verifier.');

console.log('electron app environment module verification passed');
