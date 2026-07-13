import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const settingsPanelPath = join(root, 'src/components/SettingsPanel.tsx');
const sectionPath = join(root, 'src/components/settings/AppearanceSettingsSection.tsx');

const settingsPanel = readFileSync(settingsPanelPath, 'utf8');

assert.ok(existsSync(sectionPath), 'AppearanceSettingsSection module should exist.');
const section = readFileSync(sectionPath, 'utf8');

assert.match(section, /export function AppearanceSettingsSection\b/, 'AppearanceSettingsSection should be exported.');
assert.match(section, /THEME_PRESETS\.filter/, 'AppearanceSettingsSection should own preset-card rendering.');
assert.match(section, /withUnifiedGlassOpacity/, 'AppearanceSettingsSection should own unified glass opacity updates.');
assert.match(section, /RangeControl/, 'AppearanceSettingsSection should own appearance sliders.');
assert.match(section, /settings-color-grid/, 'AppearanceSettingsSection should own appearance color inputs.');
assert.match(section, /onApplyTheme\(preset\)/, 'AppearanceSettingsSection should preserve preset apply callback.');
assert.match(section, /onResetTheme/, 'AppearanceSettingsSection should preserve reset theme callback.');
assert.match(section, /type ThemePresetPreviewStyle = CSSProperties & \{[\s\S]*?'--tp-accent': string;[\s\S]*?'--tp-secondary': string;[\s\S]*?'--tp-radius': string;[\s\S]*?\}/, 'AppearanceSettingsSection should type theme preset custom CSS properties.');
assert.match(section, /function getThemePresetPreviewStyle\(preset: ThemePreset\): ThemePresetPreviewStyle/, 'AppearanceSettingsSection should build preset preview styles through a typed helper.');
assert.match(section, /style=\{getThemePresetPreviewStyle\(preset\)\}/, 'AppearanceSettingsSection should use the typed preset preview style helper.');
assert.doesNotMatch(section, /as CSSProperties/, 'AppearanceSettingsSection should not cast theme preset preview style objects to CSSProperties.');

assert.match(
  settingsPanel,
  /from '\.\/settings\/AppearanceSettingsSection'/,
  'SettingsPanel should import AppearanceSettingsSection.',
);
assert.match(settingsPanel, /<AppearanceSettingsSection\b/, 'SettingsPanel should render AppearanceSettingsSection.');
assert.doesNotMatch(settingsPanel, /theme-preset-grid/, 'SettingsPanel should not keep appearance preset grid inline.');
assert.doesNotMatch(settingsPanel, /settings-color-grid/, 'SettingsPanel should not keep appearance color grid inline.');
assert.doesNotMatch(settingsPanel, /withUnifiedGlassOpacity/, 'SettingsPanel should not own appearance opacity updates.');

console.log('settings appearance section verification passed');
