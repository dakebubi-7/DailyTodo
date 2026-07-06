import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const mainSource = readFileSync(join(root, 'electron/main.ts'), 'utf8');
const settingsPanelSource = readFileSync(join(root, 'src/components/SettingsPanel.tsx'), 'utf8');
const aiReviewWidgetsSource = readFileSync(join(root, 'src/components/settings/AiReviewSettingsWidgets.tsx'), 'utf8');
const globals = readFileSync(join(root, 'src/styles/globals.css'), 'utf8');

for (const stage of ['inspectDaily', 'prepareMaterials', 'buildPrompt', 'requestAi', 'writeObsidian', 'confirmResult']) {
  assert.ok(mainSource.includes(stage), `Main process should emit or record ${stage} progress.`);
}

assert.ok(settingsPanelSource.includes('GenerationProgress'), 'SettingsPanel should render the extracted progress component.');
assert.ok(aiReviewWidgetsSource.includes('AI_PROGRESS_PERCENT'), 'AI review widgets should map AI stages to progress percentages.');
assert.ok(aiReviewWidgetsSource.includes("if (currentProgress.stageKey === 'confirmResult') return 92"), 'Failed terminal progress should not render as 100%.');
assert.ok(aiReviewWidgetsSource.includes('settings-progress-track'), 'AI review widgets should render a progress track.');
assert.ok(aiReviewWidgetsSource.includes('settings-progress-fill'), 'AI review widgets should render a progress fill.');
assert.ok(aiReviewWidgetsSource.includes('aria-valuenow'), 'Progress UI should expose aria-valuenow.');
assert.ok(globals.includes('.settings-progress-track'), 'Global CSS should style progress track.');
assert.ok(globals.includes('.settings-progress-fill'), 'Global CSS should style progress fill.');
assert.ok(globals.includes(".app-shell[data-theme='watercolor'] .settings-progress-fill"), 'Watercolor should own blue progress styling.');
assert.ok(globals.includes(".app-shell[data-theme='minimal'] .settings-progress-fill"), 'Minimal should own neutral progress styling.');
assert.ok(globals.includes(".app-shell[data-theme='invisible'] .settings-progress-fill"), 'Invisible should own neutral progress styling.');
assert.ok(globals.includes(".app-shell[data-theme='neumorphism'] .settings-progress-fill"), 'Neumorphism should own neutral progress styling.');

console.log('verify-ai-progress-ui passed');
