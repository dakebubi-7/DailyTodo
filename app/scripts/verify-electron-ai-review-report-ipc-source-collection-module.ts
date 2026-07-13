import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'aiReviewReportIpcSourceCollection.ts');
const weeklyPath = join(root, 'electron', 'aiReviewWeeklyReportIpc.ts');
const monthlyPath = join(root, 'electron', 'aiReviewMonthlyReportIpc.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron AI Review report IPC source-collection helper module should exist.');

const moduleSource = readFileSync(modulePath, 'utf8');
const weekly = readFileSync(weeklyPath, 'utf8');
const monthly = readFileSync(monthlyPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(moduleSource, /export type CollectWeeklyReportSourcesOptions\b/, 'report IPC source-collection helper should export explicit weekly options.');
assert.match(moduleSource, /export type CollectMonthlyReportSourcesOptions\b/, 'report IPC source-collection helper should export explicit monthly options.');
assert.match(moduleSource, /function collectPreparedReportSources<PreparedContext(?: extends object)?, RawSource, PreparedSource>\(/, 'report IPC source-collection helper should own the shared orchestration skeleton.');
assert.match(moduleSource, /const prepareStartedAt = Date\.now\(\)/, 'report IPC source-collection helper should own prepare-start timing.');
assert.match(moduleSource, /const prepared = prepare\(\)/, 'report IPC source-collection helper should preserve prepared range-derivation before source collection.');
assert.match(moduleSource, /sources: collect\(prepared\)\.map\(mapSource\)/, 'report IPC source-collection helper should preserve raw-source collection plus mapping.');
assert.match(moduleSource, /export function collectWeeklyReportSources\b/, 'report IPC source-collection helper should export collectWeeklyReportSources.');
assert.match(moduleSource, /export function collectMonthlyReportSources\b/, 'report IPC source-collection helper should export collectMonthlyReportSources.');
assert.match(moduleSource, /collectDailySourcesForDates\(\{/, 'report IPC source-collection helper should preserve weekly daily-source collection.');
assert.match(moduleSource, /collectMonthlySources\(\{/, 'report IPC source-collection helper should preserve monthly source collection.');
assert.match(moduleSource, /weeklySourceMode === 'manual-files'/, 'report IPC source-collection helper should preserve weekly manual-files behavior.');
assert.match(moduleSource, /weeklyPathTemplate:\s*ObsidianTemplateSettings\['weeklyPath'\]/, 'report IPC source-collection helper should accept the template-owned weekly report path.');
assert.match(moduleSource, /weeklyPathTemplate,/, 'report IPC source-collection helper should pass the weekly path template to monthly source discovery.');
assert.match(moduleSource, /mapSource:\s*\(source\)\s*=>\s*\(\{\s*date:\s*source\.date,\s*content:\s*source\.content\s*\}\)/s, 'report IPC source-collection helper should reduce weekly sources to date/content.');
assert.match(moduleSource, /mapSource:\s*\(source\)\s*=>\s*\(\{\s*label:\s*source\.label,\s*content:\s*source\.content\s*\}\)/s, 'report IPC source-collection helper should reduce monthly sources to label/content.');

assert.match(weekly, /from '\.\/aiReviewReportIpcSourceCollection'/, 'weekly report IPC module should import the shared report source-collection helper.');
assert.match(weekly, /const \{ prepareStartedAt, selected, monday, weekDates, dailyContents \} = collectWeeklyReportSources\(\{/, 'weekly report IPC module should delegate source collection through the shared helper.');
assert.doesNotMatch(weekly, /collectDailySourcesForDates\(\{/, 'weekly report IPC module should not keep inline daily-source collection after source-collection extraction.');
assert.doesNotMatch(weekly, /settings\.weeklySourceMode === 'manual-files'/, 'weekly report IPC module should not keep inline manual-files source branching after source-collection extraction.');
assert.doesNotMatch(weekly, /const prepareStart = Date\.now\(\)/, 'weekly report IPC module should not keep inline prepare-start timing after source-collection extraction.');
assert.doesNotMatch(weekly, /const \{ monday, dates: weekDates \} = getWeekDates\(selected\)/, 'weekly report IPC module should not keep inline week-date expansion after source-collection extraction.');

assert.match(monthly, /from '\.\/aiReviewReportIpcSourceCollection'/, 'monthly report IPC module should import the shared report source-collection helper.');
assert.match(monthly, /const \{ prepareStartedAt, month, first, last, sources \} = collectMonthlyReportSources\(\{/, 'monthly report IPC module should delegate source collection through the shared helper.');
assert.doesNotMatch(monthly, /collectMonthlySources\(\{/, 'monthly report IPC module should not keep inline monthly-source collection after source-collection extraction.');
assert.doesNotMatch(monthly, /const prepareStart = Date\.now\(\)/, 'monthly report IPC module should not keep inline prepare-start timing after source-collection extraction.');
assert.doesNotMatch(monthly, /const month = monthKey\(getDateKey\(date\)\)/, 'monthly report IPC module should not keep inline month derivation after source-collection extraction.');
assert.doesNotMatch(monthly, /const \{ first, last \} = getMonthDates\(month\)/, 'monthly report IPC module should not keep inline month-range derivation after source-collection extraction.');

const sourceCollection = await import('../electron/aiReviewReportIpcSourceCollection');
const { isoWeekKey } = await import('../shared/aiReview/weekly');

const tempRoot = mkdtempSync(join(tmpdir(), 'dailytodo-ai-review-source-collection-'));
const realDateNow = Date.now;

try {
  mkdirSync(join(tempRoot, 'Daily'), { recursive: true });
  writeFileSync(join(tempRoot, 'Daily', '2026-07-06.md'), 'monday note', 'utf8');
  writeFileSync(join(tempRoot, 'Daily', '2026-07-08.md'), 'wednesday note', 'utf8');

  Date.now = () => 1200;
  const weeklyManual = sourceCollection.collectWeeklyReportSources({
    date: '2026-07-08',
    vaultPath: tempRoot,
    weeklySourceMode: 'manual-files',
    getDateKey: (date?: unknown) => typeof date === 'string' ? date : '2026-07-08',
    getDailySourceRules: () => [{ id: 'daily', label: 'Daily', path: 'Daily/{{date}}.md', enabled: true }],
  });
  assert.deepEqual(
    weeklyManual,
    {
      prepareStartedAt: 1200,
      selected: '2026-07-08',
      monday: '2026-07-06',
      weekDates: ['2026-07-06', '2026-07-07', '2026-07-08', '2026-07-09', '2026-07-10', '2026-07-11', '2026-07-12'],
      dailyContents: [],
    },
    'report IPC source-collection helper should preserve weekly manual-files output shape and range data.',
  );

  Date.now = () => 1300;
  const weeklyCollected = sourceCollection.collectWeeklyReportSources({
    date: '2026-07-08',
    vaultPath: tempRoot,
    weeklySourceMode: 'daily-notes',
    getDateKey: (date?: unknown) => typeof date === 'string' ? date : '2026-07-08',
    getDailySourceRules: () => [{ id: 'daily', label: 'Daily', path: 'Daily/{{date}}.md', enabled: true }],
  });
  assert.deepEqual(
    weeklyCollected,
    {
      prepareStartedAt: 1300,
      selected: '2026-07-08',
      monday: '2026-07-06',
      weekDates: ['2026-07-06', '2026-07-07', '2026-07-08', '2026-07-09', '2026-07-10', '2026-07-11', '2026-07-12'],
      dailyContents: [
        { date: '2026-07-06', content: 'monday note' },
        { date: '2026-07-08', content: 'wednesday note' },
      ],
    },
    'report IPC source-collection helper should preserve weekly daily-note collection and reduce results to date/content.',
  );

  const weeklyPathTemplate = 'Reports/weekly/{{year}}-W{{week}}.md';
  const weeklyDir = join(tempRoot, 'Reports', 'weekly');
  mkdirSync(weeklyDir, { recursive: true });
  const julyWeek = isoWeekKey('2026-07-08');
  writeFileSync(join(weeklyDir, `${julyWeek}.md`), 'weekly summary', 'utf8');

  Date.now = () => 1400;
  const monthlyCollected = sourceCollection.collectMonthlyReportSources({
    date: '2026-07-08',
    vaultPath: tempRoot,
    weeklyPathTemplate,
    monthlySourceMode: 'weekly-reports',
    getDateKey: (date?: unknown) => typeof date === 'string' ? date : '2026-07-08',
    getDailySourceRules: () => [{ id: 'daily', label: 'Daily', path: 'Daily/{{date}}.md', enabled: true }],
  });
  assert.equal(monthlyCollected.prepareStartedAt, 1400, 'report IPC source-collection helper should preserve monthly prepare-start timing.');
  assert.equal(monthlyCollected.month, '2026-07', 'report IPC source-collection helper should preserve monthly month-key derivation.');
  assert.equal(monthlyCollected.first, '2026-07-01', 'report IPC source-collection helper should preserve monthly first-day derivation.');
  assert.equal(monthlyCollected.last, '2026-07-31', 'report IPC source-collection helper should preserve monthly last-day derivation.');
  assert.equal(monthlyCollected.sources.length, 1, 'report IPC source-collection helper should preserve monthly source count.');
  assert.equal(monthlyCollected.sources[0]?.content, 'weekly summary', 'report IPC source-collection helper should preserve monthly source content.');
  assert.ok(monthlyCollected.sources[0]?.label.includes(julyWeek), 'report IPC source-collection helper should preserve monthly weekly-report labels.');
} finally {
  Date.now = realDateNow;
  rmSync(tempRoot, { recursive: true, force: true });
}

assert.equal(
  scripts['verify:electron-ai-review-report-ipc-source-collection-module'],
  'tsx scripts/verify-electron-ai-review-report-ipc-source-collection-module.ts',
  'package.json should expose the focused AI Review report IPC source-collection helper verifier.',
);
assertCleanupCoreIncludes('verify:electron-ai-review-report-ipc-source-collection-module', 'cleanup-core should include the focused AI Review report IPC source-collection helper verifier.');

console.log('electron AI Review report IPC source-collection helper verification passed');
