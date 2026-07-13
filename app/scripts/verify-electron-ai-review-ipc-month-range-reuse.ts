import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const ipcPath = join(root, 'electron', 'aiReviewIpc.ts');
const externalReportPath = join(root, 'electron', 'aiReviewExternalReportIpc.ts');
const helperPath = join(root, 'electron', 'aiReviewIpcHelpers.ts');
const monthlyReportPath = join(root, 'electron', 'aiReviewMonthlyReportIpc.ts');
const sourceCollectionPath = join(root, 'electron', 'aiReviewReportIpcSourceCollection.ts');
const packagePath = join(root, 'package.json');

const ipc = readFileSync(ipcPath, 'utf8');
const externalReport = readFileSync(externalReportPath, 'utf8');
const helper = readFileSync(helperPath, 'utf8');
const monthlyReport = readFileSync(monthlyReportPath, 'utf8');
const sourceCollection = readFileSync(sourceCollectionPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /import \{ monthRange \} from '\.\.\/shared\/aiReview\/monthly';/, 'AI Review IPC helpers should own direct monthRange import.');
assert.match(helper, /export function getMonthDates\b/, 'AI Review IPC helpers should expose the shared month-date helper.');
assert.doesNotMatch(ipc, /from '\.\.\/shared\/aiReview\/monthly'/, 'AI Review IPC parent should not import shared monthly helpers after monthly report extraction.');
assert.match(externalReport, /import \{ buildMonthlyMessages, monthKey \} from '\.\.\/shared\/aiReview\/monthly';/, 'external report IPC module should own external monthly message/month key helpers.');
assert.match(monthlyReport, /import \{ collectMonthlyReportSources \} from '\.\/aiReviewReportIpcSourceCollection';/, 'monthly report IPC module should consume the shared source-collection helper.');
assert.match(sourceCollection, /import \{ monthKey \} from '\.\.\/shared\/aiReview\/monthly';/, 'report source-collection helper should own personal monthly month-key derivation.');
assert.match(sourceCollection, /import \{ getMonthDates, getWeekDates \} from '\.\/aiReviewIpcHelpers';/, 'report source-collection helper should reuse shared AI Review IPC date helpers.');
assert.doesNotMatch(ipc, /\bmonthRange\b/, 'AI Review IPC should not use monthRange directly after month-date helper extraction.');
assert.doesNotMatch(externalReport, /\bmonthRange\b/, 'AI Review external report IPC should not use monthRange directly after month-date helper extraction.');
assert.doesNotMatch(monthlyReport, /\bmonthRange\b/, 'AI Review monthly report IPC should not use monthRange directly after month-date helper extraction.');
assert.doesNotMatch(monthlyReport, /import \{ monthKey \} from '\.\.\/shared\/aiReview\/monthly';/, 'monthly report IPC module should not own direct month-key derivation after source-collection extraction.');
assert.doesNotMatch(monthlyReport, /const \{ first, last \} = getMonthDates\(month\);/, 'monthly report IPC module should not keep inline month-date derivation after source-collection extraction.');
assert.match(sourceCollection, /const month = monthKey\(getDateKey\(date\)\);/, 'report source-collection helper should derive the personal monthly month key.');
assert.match(sourceCollection, /const \{ first, last \} = getMonthDates\(month\);/, 'report source-collection helper should reuse the extracted month-date helper for personal monthly stats range.');
assert.match(externalReport, /const monthDates = getMonthDates\(month\);/, 'external monthly generation should keep reusing the extracted month-date helper for date lists.');

assert.equal(
  scripts['verify:electron-ai-review-ipc-month-range-reuse'],
  'tsx scripts/verify-electron-ai-review-ipc-month-range-reuse.ts',
  'package.json should expose the focused AI Review IPC month-range reuse verifier.',
);
assertCleanupCoreIncludes('verify:electron-ai-review-ipc-month-range-reuse', 'cleanup-core should include the focused AI Review IPC month-range reuse verifier.');

console.log('electron AI Review IPC month-range reuse verification passed');
