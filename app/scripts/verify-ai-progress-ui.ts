import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const aiReviewRuntimeSource = readFileSync(join(root, 'electron/aiReviewRuntime.ts'), 'utf8');
const aiReviewDailyRunnerSource = readFileSync(join(root, 'electron/aiReviewDailyRunner.ts'), 'utf8');
const aiReviewWeeklyReportSource = readFileSync(join(root, 'electron/aiReviewWeeklyReportIpc.ts'), 'utf8');
const aiReviewMonthlyReportSource = readFileSync(join(root, 'electron/aiReviewMonthlyReportIpc.ts'), 'utf8');
const settingsPanelSource = readFileSync(join(root, 'src/components/SettingsPanel.tsx'), 'utf8');
const aiReviewManualGenerationSource = readFileSync(join(root, 'src/components/settings/AiReviewManualGenerationSection.tsx'), 'utf8');
const aiReviewPresentationSource = readFileSync(join(root, 'src/components/settings/AiReviewGenerationPresentation.tsx'), 'utf8');
const globals = readFileSync(join(root, 'src/styles/globals.css'), 'utf8');

const progressEmissionSource = [
  aiReviewRuntimeSource,
  aiReviewDailyRunnerSource,
  aiReviewWeeklyReportSource,
  aiReviewMonthlyReportSource,
].join('\n');

for (const stage of ['inspectDaily', 'prepareMaterials', 'buildPrompt', 'requestAi', 'writeObsidian', 'confirmResult']) {
  assert.ok(progressEmissionSource.includes(stage), `AI review runtime path should emit or record ${stage} progress.`);
}

assert.ok(settingsPanelSource.includes('AiReviewSettingsSection'), 'SettingsPanel should delegate AI review rendering to the extracted section component.');
assert.ok(aiReviewManualGenerationSource.includes('GenerationProgress'), 'AI review manual generation section should render the extracted progress component.');
assert.ok(aiReviewPresentationSource.includes('AI_PROGRESS_PERCENT'), 'AI review generation presentation should map AI stages to progress percentages.');
assert.ok(aiReviewPresentationSource.includes("if (currentProgress.stageKey === 'confirmResult') return 92"), 'Failed terminal progress should not render as 100%.');
assert.ok(aiReviewPresentationSource.includes('settings-progress-track'), 'AI review generation presentation should render a progress track.');
assert.ok(aiReviewPresentationSource.includes('settings-progress-fill'), 'AI review generation presentation should render a progress fill.');
assert.ok(aiReviewPresentationSource.includes('aria-valuenow'), 'Progress UI should expose aria-valuenow.');
assert.ok(globals.includes('.settings-progress-track'), 'Global CSS should style progress track.');
assert.ok(globals.includes('.settings-progress-fill'), 'Global CSS should style progress fill.');
assert.ok(globals.includes(".app-shell[data-theme='watercolor'] .settings-progress-fill"), 'Watercolor should own blue progress styling.');
assert.ok(globals.includes(".app-shell[data-theme='minimal'] .settings-progress-fill"), 'Minimal should own neutral progress styling.');
assert.ok(globals.includes(".app-shell[data-theme='invisible'] .settings-progress-fill"), 'Invisible should own neutral progress styling.');
assert.ok(globals.includes(".app-shell[data-theme='neumorphism'] .settings-progress-fill"), 'Neumorphism should own neutral progress styling.');

console.log('verify-ai-progress-ui passed');
