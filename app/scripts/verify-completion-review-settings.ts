import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDefaultAppSettings, normalizeAppSettings } from '../shared/appSettings';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const settingsSource = readFileSync(join(root, 'shared/appSettings.ts'), 'utf8');
const appSource = readFileSync(join(root, 'src/App.tsx'), 'utf8');
const settingsPanelSource = readFileSync(join(root, 'src/components/SettingsPanel.tsx'), 'utf8');

const defaults = createDefaultAppSettings();
assert.equal(defaults.mainTaskCompletionReviewEnabled, true, 'Main task completion review should default to enabled.');
assert.equal(defaults.subtaskCompletionReviewEnabled, true, 'Subtask completion review should default to enabled.');

const normalized = normalizeAppSettings({ language: 'zh-CN', rolloverTime: '05:00' });
assert.equal(normalized.mainTaskCompletionReviewEnabled, true, 'Missing main task completion setting should normalize to enabled.');
assert.equal(normalized.subtaskCompletionReviewEnabled, true, 'Missing subtask completion setting should normalize to enabled.');

const disabled = normalizeAppSettings({
  language: 'zh-CN',
  rolloverTime: '05:00',
  mainTaskCompletionReviewEnabled: false,
  subtaskCompletionReviewEnabled: false,
});
assert.equal(disabled.mainTaskCompletionReviewEnabled, false, 'Explicit disabled main task setting should be preserved.');
assert.equal(disabled.subtaskCompletionReviewEnabled, false, 'Explicit disabled subtask setting should be preserved.');

assert.ok(settingsSource.includes('mainTaskCompletionReviewEnabled: boolean'), 'AppBehaviorSettings should declare mainTaskCompletionReviewEnabled.');
assert.ok(settingsSource.includes('subtaskCompletionReviewEnabled: boolean'), 'AppBehaviorSettings should declare subtaskCompletionReviewEnabled.');
assert.ok(appSource.includes('appSettings.mainTaskCompletionReviewEnabled'), 'App should read main task completion review setting.');
assert.ok(appSource.includes('appSettings.subtaskCompletionReviewEnabled'), 'App should read subtask completion review setting.');
assert.ok(settingsPanelSource.includes('主任务完成时填写完成记录'), 'Settings UI should render main task completion review switch.');
assert.ok(settingsPanelSource.includes('子任务完成时填写完成记录'), 'Settings UI should render subtask completion review switch.');

console.log('verify-completion-review-settings passed');
