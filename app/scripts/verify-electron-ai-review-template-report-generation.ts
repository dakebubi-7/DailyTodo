import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const generationPath = join(root, 'electron/aiReview/templateReportGeneration.ts');
const exportReportsPath = join(root, 'electron/aiReview/exportReports.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(generationPath), 'Template report generation module should exist.');
const generation = readFileSync(generationPath, 'utf8');
const exportReports = readFileSync(exportReportsPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));

assert.match(generation, /export async function generateTemplateBackedReport\b/, 'Template report generation should own the shared template-aware execution flow.');
assert.match(generation, /export async function generateLlmBackedReport\b/, 'Template report generation should own legacy single-call execution.');
assert.match(generation, /buildBlockPrompt/, 'Template report generation should build block prompts.');
assert.match(generation, /validateBlockOutput/, 'Template report generation should validate generated block output.');
assert.match(generation, /let truncated = false;\s*\n\s*for \(const \{ llm \} of blockResults\)/, 'Template report generation should detect failures and truncation in one result traversal.');
assert.match(exportReports, /from '\.\/templateReportGeneration'/, 'Export report facade should compose the template report generation module.');
assert.doesNotMatch(exportReports, /async function generateTemplateBackedReport\b/, 'Export report facade should delegate template-aware execution.');
assert.doesNotMatch(exportReports, /async function generateLlmBackedReport\b/, 'Export report facade should delegate legacy single-call execution.');
assert.equal(
  packageJson.scripts['verify:electron-ai-review-template-report-generation'],
  'tsx scripts/verify-electron-ai-review-template-report-generation.ts',
  'package.json should expose the template report generation verifier.',
);
assertCleanupCoreIncludes('verify:electron-ai-review-template-report-generation', 'cleanup-core should include the template report generation verifier.');

console.log('electron AI review template report generation verification passed');
