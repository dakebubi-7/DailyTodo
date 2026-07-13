import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const helperPath = join(root, 'src/app/appScheduledReports.ts');
const appPath = join(root, 'src/App.tsx');
const lifecyclePath = join(root, 'src/app/appAiReviewLifecycle.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(helperPath), 'App scheduled reports helper module should exist.');

const helper = readFileSync(helperPath, 'utf8');
const app = readFileSync(appPath, 'utf8');
const lifecycle = existsSync(lifecyclePath) ? readFileSync(lifecyclePath, 'utf8') : '';
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export function formatScheduledReportDateKey\b/, 'helper should export formatScheduledReportDateKey.');
assert.match(helper, /export function getScheduledWeeklyReportDateKey\b/, 'helper should export getScheduledWeeklyReportDateKey.');
assert.match(helper, /export function getScheduledMonthlyReportDateKey\b/, 'helper should export getScheduledMonthlyReportDateKey.');
assert.match(helper, /export function handleScheduledReportResult\b/, 'helper should export handleScheduledReportResult.');
assert.match(helper, /setDate\(lastWeek\.getDate\(\) - 7\)/, 'helper should preserve previous-week date calculation.');
assert.match(helper, /new Date\(now\.getFullYear\(\), now\.getMonth\(\), 0\)/, 'helper should preserve previous-month-end calculation.');
assert.match(helper, /String\(.*\)\.padStart\(2, '0'\)/, 'helper should preserve two-digit month/day formatting.');
assert.match(helper, /__dailytodoLastScheduledError/, 'helper should preserve scheduled error window diagnostic key.');
assert.doesNotMatch(
  helper,
  /window as unknown as \{ __dailytodoLastScheduledError\?: string \}/,
  'scheduled report helper should expose the window diagnostic field through a local typed window bridge instead of double-casting window.',
);
assert.match(helper, /console\.warn\('\[scheduled report\]'/, 'helper should preserve scheduled report console warning.');
assert.match(helper, /parsed\.error \|\|/, 'helper should preserve fallback behavior when scheduled report errors omit a message.');

assert.ok(
  /from '\.\/app\/appScheduledReports'/.test(app) || /from '\.\/appScheduledReports'/.test(lifecycle),
  'App or the App AI lifecycle helper should import scheduled report helpers.'
);
assert.ok(
  /getScheduledWeeklyReportDateKey\(\)/.test(app) || /getScheduledWeeklyReportDateKey\(\)/.test(lifecycle),
  'App scheduled report flow should delegate weekly report date selection.'
);
assert.ok(
  /getScheduledMonthlyReportDateKey\(\)/.test(app) || /getScheduledMonthlyReportDateKey\(\)/.test(lifecycle),
  'App scheduled report flow should delegate monthly report date selection.'
);
assert.ok(
  /then\(handleScheduledReportResult\)/.test(app) || /then\(handleScheduledReportResult\)/.test(lifecycle),
  'App scheduled report flow should delegate scheduled report result handling.'
);
assert.doesNotMatch(app, /const pad2 = \(n: number\)/, 'App should not inline scheduled report date formatting.');
assert.doesNotMatch(app, /__dailytodoLastScheduledError/, 'App should not inline scheduled report error diagnostic key.');
assert.equal(scripts['verify:app-scheduled-reports-module'], 'tsx scripts/verify-app-scheduled-reports-module.ts', 'package.json should expose the focused scheduled reports verifier.');
assertCleanupCoreIncludes('verify:app-scheduled-reports-module', 'cleanup-core should include the focused scheduled reports verifier.');

console.log('App scheduled reports helper verification passed');
