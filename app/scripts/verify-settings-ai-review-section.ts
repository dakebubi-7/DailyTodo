import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const settingsPanelPath = join(root, 'src/components/SettingsPanel.tsx');
const sectionPath = join(root, 'src/components/settings/AiReviewSettingsSection.tsx');
const aiReviewStatePath = join(root, 'src/components/settings/useAiReviewSettingsPanelState.ts');

const settingsPanel = readFileSync(settingsPanelPath, 'utf8');

assert.ok(existsSync(sectionPath), 'AiReviewSettingsSection module should exist.');
assert.ok(existsSync(aiReviewStatePath), 'AI review settings panel state hook should exist.');
const section = readFileSync(sectionPath, 'utf8');
const aiReviewState = readFileSync(aiReviewStatePath, 'utf8');

assert.match(section, /export function AiReviewSettingsSection\b/, 'AI review settings section should export AiReviewSettingsSection.');
assert.match(section, /settings-section-content/, 'AI review settings section should own the page content wrapper.');
assert.match(section, /settings-zone settings-highlight-section/, 'AI review settings section should own the highlighted root AI settings zone.');
assert.match(section, /<ToggleRow[\s\S]*checked=\{aiReviewSettings\.enabled\}[\s\S]*onChange=\{\(value\) => updateAiReview\('enabled', value\)\}/, 'AI review settings section should preserve the enable toggle binding.');
assert.match(section, /<AiAccountZone[\s\S]*settings=\{aiReviewSettings\}[\s\S]*onChange=\{saveAiReviewSettings\}/, 'AI review settings section should preserve AI account settings binding.');
assert.match(section, /updateAiReviewInput/, 'AI review settings section should pass deferred input persistence to child sections.');
assert.match(aiReviewState, /const updateAiReviewInput = <K extends keyof AiReviewSettings>/, 'AI review state hook should define a deferred AI input updater.');
assert.match(aiReviewState, /updateAiReviewInput,/, 'AI review state hook should return deferred input updates to the AI settings section.');
for (const childName of [
  'AiReviewReportRoutingSection',
  'AiReviewManualGenerationSection',
  'AiReviewSourceSettingsSection',
  'AiReviewTimerSettingsSection',
]) {
  assert.match(section, new RegExp(`<${childName}\\b`), `AI review settings section should render ${childName}.`);
}
assert.doesNotMatch(section, /window\.electronAPI/, 'AI review settings section should not own persistence or generation IPC side effects.');
assert.doesNotMatch(section, /useState|useEffect|useRef/, 'AI review settings section should remain presentational and stateless.');

assert.match(settingsPanel, /from '\.\/settings\/AiReviewSettingsSection'/, 'SettingsPanel should import AiReviewSettingsSection.');
assert.match(settingsPanel, /<AiReviewSettingsSection\b/, 'SettingsPanel should render AiReviewSettingsSection.');
assert.match(settingsPanel, /\{\.\.\.aiReviewState\}/, 'SettingsPanel should pass the extracted AI review state into the section.');
assert.doesNotMatch(settingsPanel, /settings-zone settings-highlight-section/, 'SettingsPanel should not keep the AI review highlighted zone inline.');
assert.doesNotMatch(settingsPanel, /<AiAccountZone\b/, 'SettingsPanel should not render AiAccountZone directly.');
assert.doesNotMatch(settingsPanel, /<AiReviewReportRoutingSection\b/, 'SettingsPanel should not render report routing directly.');
assert.doesNotMatch(settingsPanel, /<AiReviewManualGenerationSection\b/, 'SettingsPanel should not render manual generation directly.');
assert.doesNotMatch(settingsPanel, /<AiReviewSourceSettingsSection\b/, 'SettingsPanel should not render source settings directly.');
assert.doesNotMatch(settingsPanel, /<AiReviewTimerSettingsSection\b/, 'SettingsPanel should not render timer settings directly.');

console.log('AI review settings section verification passed');
