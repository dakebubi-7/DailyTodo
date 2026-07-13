import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const settingsPanelPath = join(root, 'src/components/SettingsPanel.tsx');
const controlsPath = join(root, 'src/components/settings/SettingsControls.tsx');
const shellPath = join(root, 'src/components/settings/SettingsPanelShell.tsx');
const navigationPath = join(root, 'src/components/settings/settingsPanelNavigation.ts');
const aiReviewStatePath = join(root, 'src/components/settings/useAiReviewSettingsPanelState.ts');
const aiReviewGenerationPath = join(root, 'src/components/settings/useAiReviewGeneration.ts');
const consumerPaths = [
  'src/components/settings/AppearanceSettingsSection.tsx',
  'src/components/settings/GeneralSettingsSection.tsx',
  'src/components/settings/ScheduleSettingsSection.tsx',
  'src/components/settings/SyncSettingsSection.tsx',
  'src/components/settings/AiReviewSettingsSection.tsx',
  'src/components/settings/AiReviewSettingsWidgets.tsx',
  'src/components/settings/AiReviewSourceSettingsSection.tsx',
  'src/components/settings/AiReviewTimerSettingsSection.tsx',
].map((path) => join(root, path));

const settingsPanel = readFileSync(settingsPanelPath, 'utf8');

assert.ok(existsSync(controlsPath), 'Settings controls module should exist.');
assert.ok(existsSync(shellPath), 'Settings panel shell module should exist.');
assert.ok(existsSync(navigationPath), 'Settings panel navigation module should exist.');
assert.ok(existsSync(aiReviewStatePath), 'AI review settings panel state hook should exist.');
assert.ok(existsSync(aiReviewGenerationPath), 'AI review generation hook should exist.');

const settingsControls = readFileSync(controlsPath, 'utf8');
const settingsShell = readFileSync(shellPath, 'utf8');
const settingsNavigation = readFileSync(navigationPath, 'utf8');
const aiReviewState = readFileSync(aiReviewStatePath, 'utf8');
const aiReviewGeneration = readFileSync(aiReviewGenerationPath, 'utf8');
const consumers = consumerPaths.map((path) => readFileSync(path, 'utf8')).join('\n');
const settingsPanelLineCount = settingsPanel.split(/\r?\n/).length;

for (const exportName of ['RangeControl', 'Field', 'AutoStartToggle', 'ToggleRow']) {
  assert.match(
    settingsControls,
    new RegExp(`export function ${exportName}\\b`),
    `Settings controls module should export ${exportName}.`,
  );
  assert.doesNotMatch(
    settingsPanel,
    new RegExp(`function ${exportName}\\b`),
    `SettingsPanel should not define ${exportName} inline.`,
  );
  assert.match(
    consumers,
    new RegExp(`\\b${exportName}\\b`),
    `A settings section should import or render shared ${exportName}.`,
  );
}

assert.match(consumers, /from '\.\/SettingsControls'/, 'Settings section modules should import shared controls from SettingsControls.');
assert.match(settingsControls, /settings-range-row/, 'RangeControl markup should stay in the shared controls module.');
assert.match(settingsControls, /window\.electronAPI\?\.getAutoStart/, 'AutoStartToggle should keep using the Electron auto-start bridge.');
assert.match(settingsControls, /aria-pressed=\{checked\}/, 'ToggleRow should keep switch accessibility state.');

assert.match(settingsNavigation, /export type SettingsSection\b/, 'Settings panel navigation module should export the SettingsSection type.');
assert.match(settingsNavigation, /export function getSettingsSectionEntries\b/, 'Settings panel navigation module should export section entry creation.');
assert.match(settingsNavigation, /export function getSettingsNavSections\b/, 'Settings panel navigation module should export grouped navigation sections.');
assert.match(settingsNavigation, /export function getSettingsSectionMeta\b/, 'Settings panel navigation module should export section metadata lookup.');
assert.match(settingsNavigation, /primary:\s*true/, 'Settings panel navigation module should mark primary sections.');

assert.match(settingsShell, /export function SettingsPanelShell\b/, 'Settings panel shell module should export SettingsPanelShell.');
assert.match(settingsShell, /motion\.aside/, 'Settings panel shell module should own the panel motion shell.');
assert.match(settingsShell, /settings-v2-sidebar/, 'Settings panel shell module should own sidebar markup.');
assert.match(settingsShell, /settings-nav-section-title/, 'Settings panel shell module should own grouped navigation headings.');
assert.match(settingsShell, /entry\.primary \? 'settings-nav-primary'/, 'Settings panel shell module should preserve primary navigation styling.');
assert.match(settingsShell, /settings-floating-close/, 'Settings panel shell module should own the floating close button.');
assert.match(settingsShell, /settings-page-title/, 'Settings panel shell module should own the page title area.');

assert.match(settingsPanel, /from '\.\/settings\/SettingsPanelShell'/, 'SettingsPanel should import SettingsPanelShell.');
assert.match(settingsPanel, /from '\.\/settings\/settingsPanelNavigation'/, 'SettingsPanel should import settings panel navigation helpers.');
assert.match(settingsPanel, /<SettingsPanelShell\b/, 'SettingsPanel should render SettingsPanelShell.');
assert.doesNotMatch(settingsPanel, /motion\.aside/, 'SettingsPanel should not keep the motion shell inline.');
assert.doesNotMatch(settingsPanel, /settings-v2-sidebar/, 'SettingsPanel should not keep sidebar markup inline.');
assert.doesNotMatch(settingsPanel, /settings-nav-section-title/, 'SettingsPanel should not keep grouped navigation headings inline.');
assert.doesNotMatch(settingsPanel, /settings-floating-close/, 'SettingsPanel should not keep the floating close button inline.');
assert.doesNotMatch(settingsPanel, /settings-page-title/, 'SettingsPanel should not keep the page title wrapper inline.');

assert.ok(settingsPanelLineCount < 300, `SettingsPanel should stay below 300 lines after state extraction; saw ${settingsPanelLineCount}.`);
assert.match(
  settingsPanel,
  /from '\.\/settings\/useAiReviewSettingsPanelState'/,
  'SettingsPanel should import the AI review state hook.',
);
assert.match(
  settingsPanel,
  /useAiReviewSettingsPanelState\(/,
  'SettingsPanel should delegate AI review state and side effects to the extracted hook.',
);
for (const inlineResponsibility of [
  'createDefaultAiReviewSettings',
  'normalizeAiReviewSettings',
  'createDeferredPersistence',
]) {
  assert.doesNotMatch(
    settingsPanel,
    new RegExp(`\\b${inlineResponsibility}\\b`),
    `SettingsPanel should not own AI review ${inlineResponsibility} logic.`,
  );
  assert.match(
    aiReviewState,
    new RegExp(`\\b${inlineResponsibility}\\b`),
    `AI review state hook should own ${inlineResponsibility} usage.`,
  );
}
for (const inlineResponsibility of [
  'readAiReviewGenerationResult',
  'readAiReviewDailyInspection',
  'readAiReviewRunDiagnostic',
  'isAiReviewProgressEvent',
]) {
  assert.doesNotMatch(
    settingsPanel,
    new RegExp(`\\b${inlineResponsibility}\\b`),
    `SettingsPanel should not own AI review ${inlineResponsibility} logic.`,
  );
  assert.match(
    aiReviewGeneration,
    new RegExp(`\\b${inlineResponsibility}\\b`),
    `AI review generation hook should own ${inlineResponsibility} usage.`,
  );
}
assert.match(aiReviewState, /export function useAiReviewSettingsPanelState\b/, 'AI review state hook should export useAiReviewSettingsPanelState.');
assert.match(aiReviewState, /window\.electronAPI\?\.aiReview\.getSettings/, 'AI review state hook should load settings through the Electron bridge.');
assert.match(aiReviewState, /useAiReviewGeneration\(/, 'AI review state hook should compose the extracted generation hook.');
assert.match(aiReviewGeneration, /window\.electronAPI\?\.aiReview\.onProgress/, 'AI review generation hook should subscribe to generation progress.');
assert.match(aiReviewGeneration, /window\.electronAPI\?\.aiReview\.runForDate/, 'AI review generation hook should own daily generation orchestration.');
assert.match(aiReviewGeneration, /window\.electronAPI\?\.aiReview\.generateWeekly/, 'AI review generation hook should own weekly generation orchestration.');
assert.match(aiReviewGeneration, /window\.electronAPI\?\.aiReview\.generateMonthly/, 'AI review generation hook should own monthly generation orchestration.');
assert.match(aiReviewGeneration, /window\.electronAPI\?\.aiReview\.generateExternal/, 'AI review generation hook should own external generation orchestration.');
assert.match(aiReviewState, /aiReviewPersistenceRef\.current\?\.flush\(\)/, 'AI review state hook should flush deferred settings persistence.');

console.log('settings panel modules verification passed');
