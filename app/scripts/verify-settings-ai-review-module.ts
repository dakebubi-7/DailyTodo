import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const settingsPanelPath = join(root, 'src/components/SettingsPanel.tsx');
const aiWidgetsPath = join(root, 'src/components/settings/AiReviewSettingsWidgets.tsx');
const aiPresentationPath = join(root, 'src/components/settings/AiReviewGenerationPresentation.tsx');
const aiAccountManagerPath = join(root, 'src/components/settings/AiAccountManager.tsx');
const aiAccountDetailsPath = join(root, 'src/components/settings/AiAccountDetails.tsx');
const persistencePath = join(root, 'src/components/settings/aiReviewSettingsPersistence.ts');
const aiReviewGenerationPath = join(root, 'src/components/settings/useAiReviewGeneration.ts');
const aiReviewStatePath = join(root, 'src/components/settings/useAiReviewSettingsPanelState.ts');
const aiReviewPanelOptionsPath = join(root, 'src/components/settings/aiReviewSettingsPanelOptions.ts');

const settingsPanel = readFileSync(settingsPanelPath, 'utf8');

assert.ok(existsSync(aiWidgetsPath), 'AI review settings widgets module should exist.');
assert.ok(existsSync(aiPresentationPath), 'AI review generation presentation module should exist.');
assert.ok(existsSync(aiAccountManagerPath), 'AI account manager module should exist.');
assert.ok(existsSync(aiAccountDetailsPath), 'AI account details module should exist.');
assert.ok(existsSync(persistencePath), 'AI review settings persistence helper should exist.');
assert.ok(existsSync(aiReviewGenerationPath), 'AI review generation hook should exist.');
assert.ok(existsSync(aiReviewStatePath), 'AI review settings panel state hook should exist.');
assert.ok(existsSync(aiReviewPanelOptionsPath), 'AI review settings panel options module should exist.');

const aiWidgets = readFileSync(aiWidgetsPath, 'utf8');
const aiPresentation = readFileSync(aiPresentationPath, 'utf8');
const aiAccountManager = readFileSync(aiAccountManagerPath, 'utf8');
const aiAccountDetails = readFileSync(aiAccountDetailsPath, 'utf8');
const persistence = readFileSync(persistencePath, 'utf8');
const aiReviewGeneration = readFileSync(aiReviewGenerationPath, 'utf8');
const aiReviewState = readFileSync(aiReviewStatePath, 'utf8');
const aiReviewPanelOptions = readFileSync(aiReviewPanelOptionsPath, 'utf8');
const aiWidgetsLineCount = aiWidgets.split(/\r?\n/).length;
const aiReviewStateLineCount = aiReviewState.split(/\r?\n/).length;

for (const exportName of [
  'AiAccountZone',
  'DiagnosticCard',
  'GenerationProgress',
  'finishProgress',
  'initialProgressForAction',
  'previousWeekDate',
  'previousMonthStart',
  'progressDisplay',
  'resultMessage',
]) {
  assert.ok(aiWidgets.includes(exportName), `AiReviewSettingsWidgets should re-export ${exportName}.`);
}

for (const inlineName of [
  'AiAccountZone',
  'AiAccountManager',
  'DiagnosticCard',
  'GenerationProgress',
  'finishProgress',
  'initialProgressForAction',
  'previousWeekDate',
  'previousMonthStart',
  'progressDisplay',
  'resultMessage',
]) {
  assert.doesNotMatch(settingsPanel, new RegExp(`function ${inlineName}\\b`), `SettingsPanel should import ${inlineName} instead of defining it inline.`);
}

assert.ok(aiWidgetsLineCount < 300, `AiReviewSettingsWidgets should stay below 300 lines after account-manager extraction; saw ${aiWidgetsLineCount}.`);
assert.match(aiWidgets, /from '\.\/AiAccountManager'/, 'AiReviewSettingsWidgets should import the extracted AI account manager.');
assert.doesNotMatch(aiWidgets, /function AiAccountManager\b/, 'AiReviewSettingsWidgets should not define the account manager inline.');

assert.match(
  aiReviewState,
  /from '\.\/AiReviewSettingsWidgets'/,
  'AI review state hook should import AI review widgets from the settings module.',
);
assert.match(aiAccountManager, /export function AiAccountManager\b/, 'AI account manager module should export AiAccountManager.');
assert.match(aiAccountManager, /window\.electronAPI\?\.aiReview\.listModels/, 'AI account manager should keep model-list bridge logic.');
assert.match(aiAccountManager, /readListModelsResult\(/, 'AI account manager should parse listModels results with a runtime reader.');
assert.match(aiAccountManager, /readListModelsResult\(await window\.electronAPI\?\.aiReview\.listModels/, 'AI account manager should parse listModels IPC returns before reading ok/models fields.');

assert.match(aiWidgets, /createDefaultAiProfile/, 'AI account module should own profile creation controls.');
assert.match(aiAccountDetails, /isAiProvider\(event\.target\.value\)/, 'AI account details should narrow provider select values with isAiProvider.');
assert.doesNotMatch(aiAccountDetails, /event\.target\.value as AiProfile\['provider'\]/, 'AI account details should not cast provider select values.');
assert.match(aiPresentation, /settings-progress-fill/, 'AI progress UI should live with AI review generation presentation.');

const accountZoneStart = aiWidgets.indexOf('export function AiAccountZone');
assert.notEqual(accountZoneStart, -1, 'AI account zone should be present.');
const accountZone = aiWidgets.slice(accountZoneStart);
assert.match(accountZone, /onChange\(next\)/, 'AI account zone should delegate settings persistence through its onChange boundary.');
assert.doesNotMatch(accountZone, /window\.electronAPI\?\.aiReview\.setSettings\(next\)/, 'AI account zone should not duplicate the parent settings IPC write.');
assert.match(accountZone, /onChangeInput/, 'AI account zone should expose a separate text-input persistence boundary.');
assert.match(aiWidgets, /onUpdateInput/, 'AI account text fields should use deferred account updates.');
assert.match(persistence, /export function createDeferredPersistence/, 'AI settings persistence should be a reusable deferred writer.');
assert.match(aiReviewState, /from '\.\/AiReviewSettingsWidgets'/, 'AI review state hook should import AI review widgets from the settings module.');
assert.match(aiReviewState, /from '\.\/useAiReviewGeneration'/, 'AI review state hook should delegate report generation to the dedicated hook.');
assert.match(aiReviewState, /createDeferredPersistence/, 'AI review state hook should create deferred AI settings persistence.');
assert.match(aiReviewState, /delay:\s*300/, 'Text-entry AI settings persistence should use a short debounce delay.');
assert.ok(
  aiReviewStateLineCount < 300,
  `AI review state hook should stay below 300 lines after panel-options extraction; saw ${aiReviewStateLineCount}.`,
);
assert.match(
  aiReviewState,
  /from '\.\/aiReviewSettingsPanelOptions'/,
  'AI review state hook should import panel option builders from the options module.',
);
assert.match(
  aiReviewState,
  /createAiReviewPanelOptions\(text, zh\)/,
  'AI review state hook should create source and weekday options through the options helper.',
);
assert.doesNotMatch(
  aiReviewState,
  /const weeklySourceOptions:/,
  'AI review state hook should not define weekly source options inline.',
);
assert.doesNotMatch(
  aiReviewState,
  /const monthlySourceOptions:/,
  'AI review state hook should not define monthly source options inline.',
);
assert.match(
  aiReviewPanelOptions,
  /export function createAiReviewPanelOptions\b/,
  'AI review panel options module should export createAiReviewPanelOptions.',
);
assert.match(
  aiReviewPanelOptions,
  /weekdays\.map/,
  'AI review panel options module should preserve weekday option construction.',
);
assert.match(
  aiReviewPanelOptions,
  /weekly-then-daily/,
  'AI review panel options module should preserve monthly source modes.',
);
const saveAiReviewSettings = aiReviewState.match(/const saveAiReviewSettings = \(next: AiReviewSettings\) => \{([\s\S]*?)\n  \};/);
assert.ok(saveAiReviewSettings, 'AI review state hook should define immediate AI settings persistence.');
assert.match(saveAiReviewSettings[1], /aiReviewPersistenceRef\.current\?\.flush\(\);/, 'Immediate AI settings actions should flush a pending text update first.');
assert.match(saveAiReviewSettings[1], /window\.electronAPI\?\.aiReview\.setSettings\(next\)/, 'Immediate AI settings actions should persist through the Electron bridge.');
assert.match(aiReviewState, /if \(!isOpen\) \{[\s\S]*aiReviewPersistenceRef\.current\?\.flush\(\)/, 'Closing settings should flush pending AI text updates.');
assert.match(settingsPanel, /useAiReviewSettingsPanelState\(/, 'SettingsPanel should delegate AI review state to the extracted hook.');
assert.doesNotMatch(settingsPanel, /createDeferredPersistence/, 'SettingsPanel should not create deferred AI settings persistence inline.');
assert.match(aiReviewGeneration, /export function useAiReviewGeneration\b/, 'AI review generation module should export the generation state hook.');
assert.match(aiReviewGeneration, /window\.electronAPI\?\.aiReview\.inspectDaily/, 'AI review generation hook should own daily regeneration inspection.');
assert.match(aiReviewGeneration, /window\.electronAPI\?\.aiReview\.generateWeekly/, 'AI review generation hook should own weekly report generation.');
assert.match(aiReviewGeneration, /window\.electronAPI\?\.aiReview\.generateExternal/, 'AI review generation hook should own external report generation.');
assert.match(aiReviewGeneration, /progressFallbackTimerRef/, 'AI review generation hook should own progress fallback cleanup.');
assert.doesNotMatch(aiReviewState, /const runGeneration = async/, 'AI review settings state hook should not retain report generation orchestration.');
assert.doesNotMatch(aiReviewState, /progressFallbackTimerRef/, 'AI review settings state hook should not retain progress fallback timer state.');

console.log('settings AI review module verification passed');
