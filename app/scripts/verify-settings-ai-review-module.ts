import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const settingsPanelPath = join(root, 'src/components/SettingsPanel.tsx');
const aiWidgetsPath = join(root, 'src/components/settings/AiReviewSettingsWidgets.tsx');

const settingsPanel = readFileSync(settingsPanelPath, 'utf8');

assert.ok(existsSync(aiWidgetsPath), 'AI review settings widgets module should exist.');

const aiWidgets = readFileSync(aiWidgetsPath, 'utf8');

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
  assert.match(aiWidgets, new RegExp(`export (function|const) ${exportName}\\b`), `AiReviewSettingsWidgets should export ${exportName}.`);
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

assert.match(
  settingsPanel,
  /from '\.\/settings\/AiReviewSettingsWidgets'/,
  'SettingsPanel should import AI review widgets from the settings module.',
);
assert.match(aiWidgets, /window\.electronAPI\?\.aiReview\.listModels/, 'AI account module should keep model-list bridge logic.');
assert.match(aiWidgets, /createDefaultAiProfile/, 'AI account module should own profile creation controls.');
assert.match(aiWidgets, /settings-progress-fill/, 'AI progress UI should live with AI review widgets.');

console.log('settings AI review module verification passed');
