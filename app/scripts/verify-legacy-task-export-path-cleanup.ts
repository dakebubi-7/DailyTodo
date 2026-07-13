import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const mainPath = join(root, 'electron', 'main.ts');
const obsidianTemplatesPath = join(root, 'shared', 'obsidianTemplates.ts');
const packagePath = join(root, 'package.json');

const main = readFileSync(mainPath, 'utf8');
const obsidianTemplates = readFileSync(obsidianTemplatesPath, 'utf8');
const i18n = [
  join(root, 'src', 'i18n.ts'),
  join(root, 'src', 'i18n', 'shellTextZh.ts'),
  join(root, 'src', 'i18n', 'shellTextZhSettings.ts'),
  join(root, 'src', 'i18n', 'shellTextEn.ts'),
  join(root, 'src', 'i18n', 'shellTextEnSettings.ts'),
].map((filePath) => readFileSync(filePath, 'utf8')).join('\n');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.doesNotMatch(main, /function getTaskExportFilePath\b/, 'main should not keep the dead getTaskExportFilePath helper inline.');
assert.doesNotMatch(main, /taskExportPath/, 'main should not reference the legacy taskExportPath setting.');
assert.doesNotMatch(main, /resolveTemplatePath/, 'main should not import or use resolveTemplatePath after task-export-path cleanup.');

assert.doesNotMatch(obsidianTemplates, /taskExportPath:/, 'shared/obsidianTemplates.ts should not preserve the dead taskExportPath compatibility field.');
assert.doesNotMatch(i18n, /taskExportPath:/, 'i18n should not expose labels for the removed taskExportPath setting.');

assert.equal(
  scripts['verify:legacy-task-export-path-cleanup'],
  'tsx scripts/verify-legacy-task-export-path-cleanup.ts',
  'package.json should expose the focused legacy task-export-path verifier.',
);
assertCleanupCoreIncludes('verify:legacy-task-export-path-cleanup', 'cleanup-core should include the focused legacy task-export-path verifier.');

console.log('legacy task-export-path cleanup verification passed');
