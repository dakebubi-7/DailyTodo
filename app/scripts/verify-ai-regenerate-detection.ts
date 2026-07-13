import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REVIEW_MARKERS, customBlockMarker, hasManagedAiContent } from '../shared/aiReview/markers';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const mainSource = readFileSync(join(root, 'electron/main.ts'), 'utf8');
const bootstrapSource = readFileSync(join(root, 'electron/mainWindowBootstrap.ts'), 'utf8');
const ipcRegistrationSource = readFileSync(join(root, 'electron/mainWindowIpcRegistration.ts'), 'utf8');
const dailyRunnerSource = readFileSync(join(root, 'electron/aiReviewDailyRunner.ts'), 'utf8');
const dailyContentInspectionSource = readFileSync(join(root, 'electron/aiReviewDailyContentInspection.ts'), 'utf8');
const dailyRunInspectIpcSource = readFileSync(join(root, 'electron/aiReviewDailyRunInspectIpc.ts'), 'utf8');
const preloadSource = readFileSync(join(root, 'electron/preload.ts'), 'utf8');
const viteEnvSource = readFileSync(join(root, 'src/vite-env.d.ts'), 'utf8');
const aiReviewGenerationSource = readFileSync(join(root, 'src/components/settings/useAiReviewGeneration.ts'), 'utf8');

assert.equal(hasManagedAiContent('# 日报\n\n- [x] 用户自己的任务'), false, 'User-authored daily note should not count as AI content.');
assert.equal(
  hasManagedAiContent(`${REVIEW_MARKERS.REVIEW.start}\nAI 复盘\n${REVIEW_MARKERS.REVIEW.end}`),
  true,
  'Built-in AI review block with content should count as AI content.',
);
assert.equal(
  hasManagedAiContent(`${REVIEW_MARKERS.REVIEW.start}\n\n   \n${REVIEW_MARKERS.REVIEW.end}`),
  false,
  'Empty built-in AI review block should not count as AI content.',
);
const custom = customBlockMarker('learning');
assert.equal(
  hasManagedAiContent(`${custom.start}\nAI 知识\n${custom.end}`),
  true,
  'Custom DailyTodo AI block with content should count as AI content.',
);
assert.equal(
  hasManagedAiContent(`${custom.start}\n\n   \n${custom.end}`),
  false,
  'Empty custom DailyTodo AI block should not count as AI content.',
);
assert.equal(
  hasManagedAiContent('<!-- DAILYTODO:CUSTOM:alpha:START -->\nAI 内容\n<!-- DAILYTODO:CUSTOM:beta:END -->'),
  false,
  'Mismatched custom DailyTodo AI marker IDs should not count as AI content.',
);

assert.ok(dailyRunInspectIpcSource.includes("ipcMain.handle('aiReview:inspectDaily'"), 'AI Review daily run/inspect IPC module should expose aiReview:inspectDaily.');
assert.ok(mainSource.includes("from './mainWindowComposition'"), 'Main process should delegate bootstrap callback assembly through main-window composition.');
assert.ok(bootstrapSource.includes("from './mainWindowIpcRegistration'"), 'Main-window bootstrap should delegate AI Review IPC composition.');
assert.ok(ipcRegistrationSource.includes('registerAiReviewIpcHandlers({'), 'Main-window IPC composition should delegate AI Review IPC registration.');
assert.ok(mainSource.includes('createAiReviewDailyRunner({'), 'Main process should delegate daily inspection/review wiring through aiReviewDailyRunner.');
assert.ok(preloadSource.includes("inspectDaily: (date: unknown) => ipcRenderer.invoke('aiReview:inspectDaily', date)"), 'Preload should expose untrusted inspectDaily dates.');
assert.ok(viteEnvSource.includes('inspectDaily: (date: unknown) => Promise<'), 'Renderer types should expose untrusted inspectDaily dates.');
assert.ok(viteEnvSource.includes('error?: string'), 'Renderer inspectDaily type should allow a safe read-error message.');
assert.ok(dailyContentInspectionSource.includes('hasAiContent: false, filePath, error:'), 'daily content inspection should return a safe fallback on read errors.');
assert.ok(dailyRunnerSource.includes('if (inspection.error)'), 'daily runner helper should return a structured failure when daily inspection cannot read the file.');
assert.ok(dailyRunnerSource.includes('读取日记失败'), 'daily runner helper should surface daily inspection read errors as user-facing failures.');
assert.ok(aiReviewGenerationSource.includes('aiReview.inspectDaily(selectedDate)'), 'AI Review generation hook should inspect AI content before confirming.');
assert.ok(aiReviewGenerationSource.includes('const shouldRegenerate = Boolean(inspection?.hasAiContent);'), 'Daily regeneration should derive confirmation from the inspection result.');
assert.ok(aiReviewGenerationSource.includes('if (shouldRegenerate && !window.confirm(confirmDailyRegeneration)) {'), 'Daily regeneration should only confirm when managed AI content already exists.');

console.log('verify-ai-regenerate-detection passed');
