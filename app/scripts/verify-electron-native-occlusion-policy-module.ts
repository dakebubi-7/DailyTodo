import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'nativeOcclusionPolicy.ts');
const mainPath = join(root, 'electron', 'main.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron native occlusion policy module should exist.');

const helper = readFileSync(modulePath, 'utf8');
const main = readFileSync(mainPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export type NativeOcclusionPolicyApp\b/, 'native occlusion policy should export the narrow app contract.');
assert.match(helper, /commandLine:\s*\{\s*appendSwitch:\s*\(name:\s*string,\s*value:\s*string\)\s*=>\s*void;\s*\}/, 'native occlusion policy app contract should only require commandLine.appendSwitch.');
assert.match(helper, /export function disableNativeWindowOcclusion\b/, 'native occlusion policy should export disableNativeWindowOcclusion.');
assert.match(helper, /app\.commandLine\.appendSwitch\('disable-features',\s*'CalculateNativeWinOcclusion'\)/, 'native occlusion policy should preserve the Chromium feature-disable switch.');

assert.match(main, /from '\.\/nativeOcclusionPolicy'/, 'main should import the native occlusion policy helper.');
assert.match(main, /disableNativeWindowOcclusion\(app\);/, 'main should invoke native occlusion policy before app ready.');
assert.ok(
  main.indexOf('disableNativeWindowOcclusion(app);') < main.indexOf('createAppEnvironment({'),
  'main should disable native window occlusion before app-environment setup and app ready work.',
);
assert.doesNotMatch(main, /app\.commandLine\.appendSwitch\('disable-features',\s*'CalculateNativeWinOcclusion'\)/, 'main should not own the Chromium native occlusion switch inline after extraction.');

assert.equal(
  scripts['verify:electron-native-occlusion-policy-module'],
  'tsx scripts/verify-electron-native-occlusion-policy-module.ts',
  'package.json should expose the focused native occlusion policy verifier.',
);
assertCleanupCoreIncludes('verify:electron-native-occlusion-policy-module', 'cleanup-core should include the focused native occlusion policy verifier.');

console.log('electron native occlusion policy module verification passed');
