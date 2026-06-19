import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const settingsPanel = readFileSync(join(root, 'src/components/SettingsPanel.tsx'), 'utf8');
const preload = readFileSync(join(root, 'electron/preload.ts'), 'utf8');
const viteEnv = readFileSync(join(root, 'src/vite-env.d.ts'), 'utf8');
const main = readFileSync(join(root, 'electron/main.ts'), 'utf8');

assert.ok(
  viteEnv.includes('runForDate: (date: string, tasks: import(\'./types/task\').Task[], force?: boolean)'),
  'Renderer API type should allow forcing daily regeneration.',
);
assert.ok(
  preload.includes('runForDate: (date: string, tasks: unknown, force?: boolean) => ipcRenderer.invoke(\'aiReview:runForDate\', date, tasks, force)'),
  'Preload should forward the force flag to the main process.',
);
assert.ok(
  main.includes("ipcMain.handle('aiReview:runForDate', (_e, date: string, tasks: Task[], force?: boolean) => runReviewForDate(getDateKey(date), tasks, Boolean(force)))"),
  'Main IPC should pass a boolean force flag into runReviewForDate.',
);
assert.ok(
  main.includes('async function runReviewForDate(date: string, tasks: Task[], force = false)'),
  'runReviewForDate should accept a force flag.',
);
assert.ok(
  main.includes('force,'),
  'runReviewForDate should forward force into runReviewForFile.',
);
assert.ok(
  settingsPanel.includes('confirmDailyRegeneration'),
  'SettingsPanel should explicitly confirm forced daily regeneration when previous content exists.',
);
assert.ok(
  settingsPanel.includes('window.confirm(confirmDailyRegeneration)'),
  'SettingsPanel should ask before force-regenerating an existing daily report.',
);
assert.ok(
  settingsPanel.includes('aiReview.runForDate(selectedDate, tasks, true)'),
  'Manual daily regeneration should call runForDate with force=true after confirmation.',
);

console.log('verify-ai-regenerate-force passed');
