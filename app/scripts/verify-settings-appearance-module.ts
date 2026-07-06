import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const settingsPanelPath = join(root, 'src/components/SettingsPanel.tsx');
const appearancePath = join(root, 'src/components/settings/appearanceSettings.ts');

const settingsPanel = readFileSync(settingsPanelPath, 'utf8');

assert.ok(existsSync(appearancePath), 'Settings appearance helper module should exist.');

const appearance = readFileSync(appearancePath, 'utf8');

for (const exportName of [
  'OPACITY_SLIDER_MIN',
  'OPACITY_SLIDER_MAX',
  'getThemeRecommendation',
  'opacityValue',
  'glassOpacityValue',
  'withUnifiedGlassOpacity',
]) {
  assert.match(appearance, new RegExp(`export (function|const) ${exportName}\\b`), `appearanceSettings should export ${exportName}.`);
}

for (const inlineName of [
  'getThemeRecommendation',
  'opacityValue',
  'glassOpacityValue',
  'withUnifiedGlassOpacity',
]) {
  assert.doesNotMatch(settingsPanel, new RegExp(`function ${inlineName}\\b`), `SettingsPanel should import ${inlineName} instead of defining it inline.`);
}

assert.match(
  settingsPanel,
  /from '\.\/settings\/appearanceSettings'/,
  'SettingsPanel should import appearance helpers from the settings module.',
);
assert.match(appearance, /THEME_PRESETS/, 'appearanceSettings should own theme preset lookup.');
assert.match(appearance, /OPACITY_KEYS/, 'appearanceSettings should own unified opacity key iteration.');

console.log('settings appearance module verification passed');
