import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const aiReviewGeneration = readFileSync(join(root, 'src/components/settings/useAiReviewGeneration.ts'), 'utf8');
const preload = readFileSync(join(root, 'electron/preload.ts'), 'utf8');
const viteEnv = readFileSync(join(root, 'src/vite-env.d.ts'), 'utf8');
const main = readFileSync(join(root, 'electron/main.ts'), 'utf8');
const bootstrap = readFileSync(join(root, 'electron/mainWindowBootstrap.ts'), 'utf8');
const ipcRegistration = readFileSync(join(root, 'electron/mainWindowIpcRegistration.ts'), 'utf8');
const dailyRunner = readFileSync(join(root, 'electron/aiReviewDailyRunner.ts'), 'utf8');
const dailyRunInspectIpc = readFileSync(join(root, 'electron/aiReviewDailyRunInspectIpc.ts'), 'utf8');
const backfillIpc = readFileSync(join(root, 'electron/aiReviewBackfillIpc.ts'), 'utf8');
const weeklyReportIpc = readFileSync(join(root, 'electron/aiReviewWeeklyReportIpc.ts'), 'utf8');
const monthlyReportIpc = readFileSync(join(root, 'electron/aiReviewMonthlyReportIpc.ts'), 'utf8');

assert.ok(
  viteEnv.includes('runForDate: (date: unknown, tasks: unknown, force?: unknown)'),
  'Renderer AI Review daily run API should expose runtime date and task input as unknown.',
);
assert.ok(
  viteEnv.includes('backfill: (tasks: unknown)'),
  'Renderer AI Review backfill API should expose runtime task input as unknown.',
);
assert.ok(
  viteEnv.includes('generateWeekly: (date: unknown, tasks: unknown)'),
  'Renderer AI Review weekly report API should expose runtime date and task input as unknown.',
);
assert.ok(
  viteEnv.includes('generateMonthly: (date: unknown, tasks: unknown)'),
  'Renderer AI Review monthly report API should expose runtime date and task input as unknown.',
);
assert.ok(
  !/runForDate: \(date: string, tasks: import\('\.\/types\/task'\)\.Task\[], force\?: boolean\)/.test(viteEnv),
  'Renderer AI Review daily run API should not advertise trusted Task[] input.',
);
assert.ok(
  !/backfill: \(tasks: import\('\.\/types\/task'\)\.Task\[]\)/.test(viteEnv),
  'Renderer AI Review backfill API should not advertise trusted Task[] input.',
);
assert.ok(
  !/generateWeekly: \(date: string, tasks: import\('\.\/types\/task'\)\.Task\[]\)/.test(viteEnv),
  'Renderer AI Review weekly report API should not advertise trusted Task[] input.',
);
assert.ok(
  !/generateMonthly: \(date: string, tasks: import\('\.\/types\/task'\)\.Task\[]\)/.test(viteEnv),
  'Renderer AI Review monthly report API should not advertise trusted Task[] input.',
);
assert.ok(
  preload.includes('runForDate: (date: unknown, tasks: unknown, force?: unknown) => ipcRenderer.invoke(\'aiReview:runForDate\', date, tasks, force)'),
  'Preload should forward untrusted daily-run dates and the force flag to the main process.',
);
assert.ok(
  preload.includes('backfill: (tasks: unknown) => ipcRenderer.invoke(\'aiReview:backfill\', tasks)'),
  'Preload should forward backfill task input as runtime data.',
);
assert.ok(
  preload.includes('generateWeekly: (date: unknown, tasks: unknown) => ipcRenderer.invoke(\'aiReview:generateWeekly\', date, tasks)'),
  'Preload should forward weekly report date and task input as runtime data.',
);
assert.ok(
  preload.includes('generateMonthly: (date: unknown, tasks: unknown) => ipcRenderer.invoke(\'aiReview:generateMonthly\', date, tasks)'),
  'Preload should forward monthly report date and task input as runtime data.',
);
assert.ok(
  dailyRunInspectIpc.includes("ipcMain.handle('aiReview:runForDate'"),
  'AI Review daily run/inspect IPC module should expose aiReview:runForDate.',
);
assert.ok(
  backfillIpc.includes("ipcMain.handle('aiReview:backfill'"),
  'AI Review backfill IPC module should expose aiReview:backfill.',
);
assert.ok(
  weeklyReportIpc.includes("ipcMain.handle('aiReview:generateWeekly'"),
  'AI Review weekly report IPC module should expose aiReview:generateWeekly.',
);
assert.ok(
  monthlyReportIpc.includes("ipcMain.handle('aiReview:generateMonthly'"),
  'AI Review monthly report IPC module should expose aiReview:generateMonthly.',
);
assert.ok(
  dailyRunInspectIpc.includes('return runReviewForDate(getDateKey(date), tasks, force === true);'),
  'AI Review daily run/inspect IPC module should pass only strict true as the force flag into runReviewForDate.',
);
assert.ok(
  main.includes("from './mainWindowComposition'"),
  'Main process should delegate bootstrap callback assembly through main-window composition.',
);
assert.ok(
  bootstrap.includes("from './mainWindowIpcRegistration'"),
  'Main-window bootstrap should delegate AI Review IPC composition.',
);
assert.ok(
  ipcRegistration.includes('registerAiReviewIpcHandlers({'),
  'Main-window IPC composition should delegate AI Review IPC registration.',
);
assert.ok(
  main.includes('createAiReviewDailyRunner({'),
  'Main process should delegate the daily review runner through aiReviewDailyRunner.',
);
assert.ok(
  dailyRunner.includes('async function runReviewForDate(') && dailyRunner.includes('force = false'),
  'Daily review runner helper should accept a force flag.',
);
assert.ok(
  dailyRunner.includes('force,'),
  'Daily review runner helper should forward force into runReviewForFile.',
);
assert.ok(
  aiReviewGeneration.includes('confirmDailyRegeneration'),
  'AI Review generation hook should explicitly confirm forced daily regeneration when previous content exists.',
);
assert.ok(
  aiReviewGeneration.includes('window.confirm(confirmDailyRegeneration)'),
  'AI Review generation hook should ask before force-regenerating an existing daily report.',
);
assert.ok(
  aiReviewGeneration.includes('const shouldRegenerate = Boolean(inspection?.hasAiContent);'),
  'Manual daily regeneration should derive the force flag from inspectDaily.',
);
assert.ok(
  aiReviewGeneration.includes('aiReview.runForDate(selectedDate, tasks, shouldRegenerate)'),
  'Manual daily regeneration should pass the derived force flag into runForDate.',
);

console.log('verify-ai-regenerate-force passed');
