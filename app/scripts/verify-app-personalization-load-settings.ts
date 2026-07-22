import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const loadSettingsPath = join(root, 'src/app/personalizationLoadSettings.ts');
const settingsPath = join(root, 'src/app/personalizationSettings.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(loadSettingsPath), 'Personalization load-settings module should exist.');

const { normalizeLoadedPersonalization, parseStoredThemeOpacityOverrides } = await import('../src/app/personalizationLoadSettings');
const loadSettings = readFileSync(loadSettingsPath, 'utf8');
const settings = readFileSync(settingsPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(loadSettings, /export function normalizeLoadedPersonalization\b/, 'Load-settings module should own unknown personalization normalization.');
assert.match(loadSettings, /export function parseStoredThemeOpacityOverrides\b/, 'Load-settings module should own unknown opacity-override parsing.');
assert.match(loadSettings, /from '..\/..\/shared\/unknownValueGuards'/, 'Load-settings module should reuse shared object-record narrowing.');
assert.match(settings, /from '\.\/personalizationLoadSettings'/, 'Personalization settings should compose the focused load-settings module.');
assert.doesNotMatch(settings, /function parseStoredThemeOpacityOverride\b/, 'Personalization settings should not keep stored override parsing inline.');
assert.doesNotMatch(settings, /function isLayoutDensity\b/, 'Personalization settings should not keep unknown stored-value parsing inline.');

const normalized = normalizeLoadedPersonalization({ themeId: 'minimal', windowOpacity: 56, texture: 'bad' });
assert.equal(normalized?.windowOpacity, 56, 'Load normalization should retain valid numeric settings.');
assert.equal(normalized?.texture, false, 'Load normalization should reject malformed boolean settings.');
assert.equal(normalizeLoadedPersonalization(null), null, 'Load normalization should reject non-object values.');
assert.equal(
  normalizeLoadedPersonalization({ themeId: 'invisible', blurStrength: 0 })?.blurStrength,
  0,
  'The invisible theme should preserve an explicit zero-blur setting as a clear surface.',
);
assert.deepEqual(
  parseStoredThemeOpacityOverrides({ minimal: { windowOpacity: 42, panelOpacity: 'bad' }, invalid: [] }),
  { minimal: { windowOpacity: 42 } },
  'Load parsing should retain only known numeric opacity settings.',
);

assert.equal(
  scripts['verify:app-personalization-load-settings'],
  'tsx scripts/verify-app-personalization-load-settings.ts',
  'package.json should expose the focused personalization load-settings verifier.',
);
assertCleanupCoreIncludes('verify:app-personalization-load-settings', 'cleanup-core should include the focused personalization load-settings verifier.');

console.log('app personalization load-settings verification passed');
