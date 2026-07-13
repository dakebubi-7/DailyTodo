import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'aiReviewReportIpcSourceSummary.ts');
const sourcePreparationPath = join(root, 'electron', 'aiReviewReportIpcSourcePreparation.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron AI Review report IPC source summary module should exist.');

const moduleSource = readFileSync(modulePath, 'utf8');
const sourcePreparation = readFileSync(sourcePreparationPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(moduleSource, /export type AiReviewReportSourceContent\b/, 'source summary module should export its minimal source-content contract.');
assert.match(moduleSource, /export function sumReportSourceChars\b/, 'source summary module should export sumReportSourceChars.');
assert.match(moduleSource, /sources\.reduce\(\(sum, source\) => sum \+ source\.content\.length, 0\)/, 'source summary module should preserve source character summing logic.');
assert.match(sourcePreparation, /from '\.\/aiReviewReportIpcSourceSummary'/, 'report source-preparation helper should import the shared source summary helper.');
assert.match(sourcePreparation, /const sourceChars = sumReportSourceChars\(sources\)/, 'report source-preparation helper should summarize prepared sources through the shared helper.');

const sourceSummary = await import('../electron/aiReviewReportIpcSourceSummary');

assert.equal(sourceSummary.sumReportSourceChars([]), 0, 'empty source lists should have zero source characters.');
assert.equal(
  sourceSummary.sumReportSourceChars([{ content: 'abc' }, { content: '任务' }, { content: '' }]),
  5,
  'source character summing should preserve JavaScript string length semantics.',
);

assert.equal(
  scripts['verify:electron-ai-review-report-ipc-source-summary-module'],
  'tsx scripts/verify-electron-ai-review-report-ipc-source-summary-module.ts',
  'package.json should expose the focused AI Review report IPC source summary verifier.',
);
assertCleanupCoreIncludes('verify:electron-ai-review-report-ipc-source-summary-module', 'cleanup-core should include the focused AI Review report IPC source summary verifier.');

console.log('electron AI Review report IPC source summary module verification passed');
