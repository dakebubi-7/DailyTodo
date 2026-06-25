import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REVIEW_MARKERS, customBlockMarker, hasManagedAiContent } from '../shared/aiReview/markers';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const mainSource = readFileSync(join(root, 'electron/main.ts'), 'utf8');
const preloadSource = readFileSync(join(root, 'electron/preload.ts'), 'utf8');
const viteEnvSource = readFileSync(join(root, 'src/vite-env.d.ts'), 'utf8');
const settingsPanelSource = readFileSync(join(root, 'src/components/SettingsPanel.tsx'), 'utf8');

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

assert.ok(mainSource.includes("ipcMain.handle('aiReview:inspectDaily'"), 'Main process should expose aiReview:inspectDaily.');
assert.ok(preloadSource.includes("inspectDaily: (date: string) => ipcRenderer.invoke('aiReview:inspectDaily', date)"), 'Preload should expose inspectDaily.');
assert.ok(viteEnvSource.includes('inspectDaily: (date: string) => Promise<'), 'Renderer types should include inspectDaily.');
assert.ok(viteEnvSource.includes('error?: string'), 'Renderer inspectDaily type should allow a safe read-error message.');
assert.ok(mainSource.includes('hasAiContent: false, filePath, error:'), 'inspectDaily should return a safe fallback on read errors.');
assert.ok(mainSource.includes('if (inspection.error)'), 'runReviewForDate should return a structured failure when daily inspection cannot read the file.');
assert.ok(mainSource.includes('读取日记失败'), 'runReviewForDate should surface daily inspection read errors as user-facing failures.');
assert.ok(settingsPanelSource.includes('aiReview.inspectDaily(selectedDate)'), 'SettingsPanel daily generation should inspect AI content before confirming.');
assert.ok(!settingsPanelSource.includes('window.confirm(confirmDailyRegeneration)) {\n          setCurrentProgress'), 'Daily regeneration should not confirm unconditionally before inspectDaily.');

console.log('verify-ai-regenerate-detection passed');
