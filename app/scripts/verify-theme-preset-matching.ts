import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_PERSONALIZATION } from '../src/types/personalization';
import { THEME_PRESETS } from '../src/types/themePresets';
import { findMatchingThemePresetId } from '../src/types/themePresetMatching';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const matchingPath = join(root, 'src/types/themePresetMatching.ts');
const presetsPath = join(root, 'src/types/themePresets.ts');

assert.ok(existsSync(matchingPath), 'Theme preset matching should live in a dedicated pure module.');

const matching = readFileSync(matchingPath, 'utf8');
const presets = readFileSync(presetsPath, 'utf8');

assert.match(matching, /export function findMatchingThemePresetId\b/, 'matching module should export the preset-id lookup.');
assert.match(matching, /accentColor\.toLowerCase\(\)/, 'matching should retain case-insensitive accent color comparison.');
assert.match(matching, /secondaryColor\.toLowerCase\(\)/, 'matching should retain case-insensitive secondary color comparison.');
assert.match(presets, /findMatchingThemePresetId\(THEME_PRESETS, settings\)/, 'preset catalog should delegate matching to the pure module.');

const minimal = THEME_PRESETS.find((preset) => preset.id === 'minimal');
assert.ok(minimal, 'minimal preset should be available for matching coverage.');
assert.equal(
  findMatchingThemePresetId(THEME_PRESETS, {
    ...minimal.settings,
    accentColor: minimal.settings.accentColor.toLowerCase(),
    secondaryColor: minimal.settings.secondaryColor.toLowerCase(),
  }),
  'minimal',
  'matching should ignore color-case differences.',
);
assert.equal(
  findMatchingThemePresetId([], minimal.settings),
  null,
  'matching should return null when no presets are available.',
);
assert.equal(
  findMatchingThemePresetId(THEME_PRESETS, { ...DEFAULT_PERSONALIZATION, radius: 999 }),
  null,
  'matching should reject settings that do not fully match a preset.',
);

console.log('Theme preset matching verification passed');
