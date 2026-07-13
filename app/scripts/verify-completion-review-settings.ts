import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDefaultAppSettings, normalizeAppSettings } from '../shared/appSettings';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const settingsSource = readFileSync(join(root, 'shared/appSettings.ts'), 'utf8');
const shellCompositionSource = readFileSync(join(root, 'src/app/useAppShellComposition.ts'), 'utf8');
const completionActionsSource = readFileSync(join(root, 'src/app/appCompletionActions.ts'), 'utf8');
const settingsPanelSource = readFileSync(join(root, 'src/components/SettingsPanel.tsx'), 'utf8');
const generalSettingsSectionSource = readFileSync(join(root, 'src/components/settings/GeneralSettingsSection.tsx'), 'utf8');

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

assert.match(settingsSource, /import \{ isObjectRecord \} from '\.\/unknownValueGuards';/, 'App settings normalization should reuse the shared object-record predicate.');
assert.doesNotMatch(settingsSource, /function isObject\(value: unknown\)/, 'App settings normalization should not retain a duplicate local object predicate.');
assert.ok(settingsSource.includes('mainTaskCompletionReviewEnabled: boolean'), 'AppBehaviorSettings should declare mainTaskCompletionReviewEnabled.');
assert.ok(settingsSource.includes('subtaskCompletionReviewEnabled: boolean'), 'AppBehaviorSettings should declare subtaskCompletionReviewEnabled.');
assert.ok(shellCompositionSource.includes('mainTaskCompletionReviewEnabled: taskState.appSettings.mainTaskCompletionReviewEnabled'), 'App shell composition should pass the main-task completion review setting into completion actions.');
assert.ok(shellCompositionSource.includes('subtaskCompletionReviewEnabled: taskState.appSettings.subtaskCompletionReviewEnabled'), 'App shell composition should pass the subtask completion review setting into completion actions.');
assert.ok(completionActionsSource.includes('getMainTaskToggleDecision('), 'Completion actions should use the main-task review setting when deciding task completion flow.');
assert.ok(completionActionsSource.includes('getSubtaskToggleDecision('), 'Completion actions should use the subtask review setting when deciding subtask completion flow.');
assert.ok(settingsPanelSource.includes('<GeneralSettingsSection'), 'SettingsPanel should delegate general settings rendering to GeneralSettingsSection.');
assert.ok(generalSettingsSectionSource.includes('mainTaskCompletionReviewEnabled'), 'Settings UI should render main task completion review switch.');
assert.ok(generalSettingsSectionSource.includes('subtaskCompletionReviewEnabled'), 'Settings UI should render subtask completion review switch.');
assert.ok(generalSettingsSectionSource.includes('Ask for main task completion record'), 'General settings section should keep the main task completion review label.');
assert.ok(generalSettingsSectionSource.includes('Ask for subtask completion record'), 'General settings section should keep the subtask completion review label.');

console.log('verify-completion-review-settings passed');
