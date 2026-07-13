import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const helperPath = join(root, 'electron', 'aiReviewIpcHelpers.ts');
const ipcPath = join(root, 'electron', 'aiReviewIpc.ts');
const externalReportPath = join(root, 'electron', 'aiReviewExternalReportIpc.ts');
const monthlyReportPath = join(root, 'electron', 'aiReviewMonthlyReportIpc.ts');
const prepareProgressPath = join(root, 'electron', 'aiReviewReportIpcPrepareProgress.ts');
const weeklyReportPath = join(root, 'electron', 'aiReviewWeeklyReportIpc.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(helperPath), 'Electron AI Review IPC helper module should exist.');
assert.ok(existsSync(prepareProgressPath), 'Electron AI Review report prepare-progress helper module should exist.');

const { buildSourceCharsMessage, getMonthDates, getWeekDates } = await import('../electron/aiReviewIpcHelpers');

const helper = readFileSync(helperPath, 'utf8');
const ipc = readFileSync(ipcPath, 'utf8');
const externalReport = readFileSync(externalReportPath, 'utf8');
const monthlyReport = readFileSync(monthlyReportPath, 'utf8');
const prepareProgress = readFileSync(prepareProgressPath, 'utf8');
const weeklyReport = readFileSync(weeklyReportPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /from '\.\.\/shared\/taskRollover'/, 'AI Review IPC helpers should reuse shared date shifting.');
assert.match(helper, /from '\.\.\/shared\/aiReview\/monthly'/, 'AI Review IPC helpers should reuse monthly range calculation.');
assert.match(helper, /export function buildSourceCharsMessage\b/, 'AI Review IPC helpers should export source-character message formatting.');
assert.match(helper, /export function getWeekDates\b/, 'AI Review IPC helpers should export week date expansion.');
assert.match(helper, /export function getMonthDates\b/, 'AI Review IPC helpers should export month date expansion.');
assert.match(helper, /shiftDateKey\(selected, -dayNr\)/, 'week helper should preserve Monday derivation from selected date.');
assert.match(helper, /Array\.from\(\{ length: 7 \}/, 'week helper should preserve seven-day expansion.');
assert.match(helper, /monthRange\(month\)/, 'month helper should preserve shared month range usage.');
assert.match(helper, /Number\(last\.slice\(-2\)\)/, 'month helper should preserve date-count derivation from the range end.');

assert.match(
  prepareProgress,
  /import \{[^}]*\bbuildSourceCharsMessage\b[^}]*\} from '\.\/aiReviewIpcHelpers';/s,
  'AI Review report prepare-progress helper should import the extracted buildSourceCharsMessage helper.',
);

const dateHelperConsumers = `${ipc}\n${externalReport}\n${monthlyReport}\n${weeklyReport}`;
for (const helperName of ['getMonthDates', 'getWeekDates']) {
  assert.match(
    dateHelperConsumers,
    new RegExp(`import \\{[^}]*\\b${helperName}\\b[^}]*\\} from '\\.\\/aiReviewIpcHelpers';`, 's'),
    `AI Review IPC consumers should import the extracted ${helperName} helper.`,
  );
}

const helperConsumers = `${dateHelperConsumers}\n${prepareProgress}`;
assert.doesNotMatch(helperConsumers, /function buildSourceCharsMessage\b/, 'AI Review IPC consumers should not keep source-message helper inline.');
assert.doesNotMatch(helperConsumers, /function getWeekDates\b/, 'AI Review IPC consumers should not keep week-date helper inline.');
assert.doesNotMatch(helperConsumers, /function getMonthDates\b/, 'AI Review IPC consumers should not keep month-date helper inline.');

assert.equal(
  buildSourceCharsMessage(1234),
  '\u7d20\u6750 1234 \u5b57\u7b26',
  'source-character message should preserve existing Chinese text.',
);
assert.deepEqual(
  getWeekDates('2026-07-08'),
  {
    monday: '2026-07-06',
    dates: ['2026-07-06', '2026-07-07', '2026-07-08', '2026-07-09', '2026-07-10', '2026-07-11', '2026-07-12'],
  },
  'week helper should return the Monday key and seven contiguous dates for the selected week.',
);
assert.deepEqual(
  getMonthDates('2026-02'),
  {
    first: '2026-02-01',
    last: '2026-02-28',
    dates: Array.from({ length: 28 }, (_, index) => `2026-02-${String(index + 1).padStart(2, '0')}`),
  },
  'month helper should preserve first/last keys and expand every date in the month.',
);

assert.equal(
  scripts['verify:electron-ai-review-ipc-helpers-module'],
  'tsx scripts/verify-electron-ai-review-ipc-helpers-module.ts',
  'package.json should expose the focused AI Review IPC helpers verifier.',
);
assertCleanupCoreIncludes('verify:electron-ai-review-ipc-helpers-module', 'cleanup-core should include the focused AI Review IPC helpers verifier.');

console.log('electron AI Review IPC helpers module verification passed');
