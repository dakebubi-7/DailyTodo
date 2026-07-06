import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const settingsPanelPath = join(root, 'src/components/SettingsPanel.tsx');
const controlsPath = join(root, 'src/components/settings/SettingsControls.tsx');

const settingsPanel = readFileSync(settingsPanelPath, 'utf8');

assert.ok(existsSync(controlsPath), 'Settings controls module should exist.');

const settingsControls = readFileSync(controlsPath, 'utf8');

for (const exportName of ['RangeControl', 'Field', 'AutoStartToggle', 'ToggleRow']) {
  assert.match(
    settingsControls,
    new RegExp(`export function ${exportName}\\b`),
    `Settings controls module should export ${exportName}.`,
  );
  assert.doesNotMatch(
    settingsPanel,
    new RegExp(`function ${exportName}\\b`),
    `SettingsPanel should import ${exportName} instead of defining it inline.`,
  );
}

assert.match(
  settingsPanel,
  /from '\.\/settings\/SettingsControls'/,
  'SettingsPanel should import shared controls from the settings module.',
);
assert.match(settingsControls, /settings-range-row/, 'RangeControl markup should stay in the shared controls module.');
assert.match(settingsControls, /window\.electronAPI\?\.getAutoStart/, 'AutoStartToggle should keep using the Electron auto-start bridge.');
assert.match(settingsControls, /aria-pressed=\{checked\}/, 'ToggleRow should keep switch accessibility state.');

console.log('settings panel modules verification passed');
