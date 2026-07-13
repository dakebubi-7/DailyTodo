import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron/obsidianDailyNoteContent.ts');
const blogDraftPath = join(root, 'electron/obsidianBlogDraft.ts');
const servicesPath = join(root, 'electron/mainObsidianServices.ts');
const aiReviewServicesPath = join(root, 'electron/mainAiReviewServices.ts');
const mainPath = join(root, 'electron/main.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron Obsidian daily-note content module should exist.');
assert.ok(existsSync(blogDraftPath), 'Electron Obsidian blog-draft module should exist.');
assert.ok(existsSync(servicesPath), 'Electron main Obsidian services module should exist.');

const helper = readFileSync(modulePath, 'utf8');
const blogDraft = readFileSync(blogDraftPath, 'utf8');
const services = readFileSync(servicesPath, 'utf8');
const aiReviewServices = readFileSync(aiReviewServicesPath, 'utf8');
const main = readFileSync(mainPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export function createObsidianDailyNoteContentHelpers\b/, 'Daily-note content module should export a helper factory.');
assert.match(helper, /buildDailyNoteFromTemplate/, 'Daily-note content module should own daily-note bootstrap template generation.');
assert.match(helper, /buildTemplateTaskLines/, 'Daily-note content module should own task-line template delegation.');
assert.match(helper, /buildTemplateTaskBlock/, 'Daily-note content module should own task-block template delegation.');
assert.match(helper, /buildTemplateWorkBlock/, 'Daily-note content module should own work-block template delegation.');
assert.match(helper, /buildTemplateInspirationBlock/, 'Daily-note content module should own inspiration-block template delegation.');
assert.match(helper, /replaceManagedBlock/, 'Daily-note content module should own managed-block replacement wiring.');
assert.match(helper, /readTemplateMarkedBlockBody/, 'Daily-note content module should own managed-block body reads.');
assert.match(helper, /function migrateLegacyInspirationSection\b/, 'Daily-note content module should own inspiration legacy migration.');
assert.match(helper, /function removeUnmarkedWorkSections\b/, 'Daily-note content module should own unmarked work cleanup.');
assert.match(helper, /function migrateLegacyWorkSection\b/, 'Daily-note content module should own work legacy migration.');
assert.match(helper, /from '\.\/obsidianBlogDraft'/, 'Daily-note content module should compose the focused blog-draft builder.');
assert.match(blogDraft, /function buildBlogDraft\b/, 'Blog-draft module should own draft assembly.');
assert.match(blogDraft, /let completed = 0;\s*let total = 0;\s*for \(const task of tasks\)/, 'Blog draft statistics should count matching tasks in one traversal.');
assert.doesNotMatch(blogDraft, /tasks\.filter\(\(task\) => getTaskDate\(task\) === selected/, 'Blog draft statistics should not filter the task list separately for completed and total counts.');
assert.doesNotMatch(helper, /tasks as any/, 'Daily-note content helpers should pass template tasks without any-casting Electron tasks.');

assert.match(services, /from '\.\/obsidianDailyNoteContent'/, 'main Obsidian services should import the daily-note content helper module.');
assert.match(services, /createObsidianDailyNoteContentHelpers\(\{/, 'main Obsidian services should create daily-note content helpers.');
assert.match(services, /getDateKey,/, 'main Obsidian services should pass date-key normalization into the daily-note content helper.');
assert.match(services, /getTaskDate,/, 'main Obsidian services should pass task-date resolution into the daily-note content helper.');
assert.match(services, /getTemplates: getObsidianTemplateSettings,/, 'main Obsidian services should pass template settings access into the daily-note content helper.');
assert.match(services, /zh,/, 'main Obsidian services should pass localization into the daily-note content helper.');

assert.match(aiReviewServices, /from '\.\/mainObsidianServices'/, 'AI review services should import the Obsidian services composition helper.');
assert.match(aiReviewServices, /createMainObsidianServices\(\{/, 'AI review services should create Obsidian services through the composition helper.');
assert.match(main, /from '\.\/mainAiReviewServices'/, 'main should import the AI review services composition helper.');
assert.match(main, /createMainAiReviewServices\(\{/, 'main should create services through the AI review composition helper.');
assert.doesNotMatch(main, /from '\.\/obsidianDailyNoteContent'/, 'main should not import daily-note content helpers directly after services extraction.');

for (const movedFunction of [
  'buildTaskLines',
  'buildTaskBlock',
  'buildWorkBlock',
  'buildInspirationBlock',
  'buildDailyTemplate',
  'migrateLegacyInspirationSection',
  'upsertMarkedBlock',
  'readMarkedBlockBody',
  'removeUnmarkedWorkSections',
  'migrateLegacyWorkSection',
  'buildBlogDraft',
]) {
  const declarationPattern = new RegExp(`function ${movedFunction}\\b`);
  assert.doesNotMatch(main, declarationPattern, `main should not keep ${movedFunction} inline after extraction.`);
}

assert.equal(
  scripts['verify:electron-obsidian-daily-note-content-module'],
  'tsx scripts/verify-electron-obsidian-daily-note-content-module.ts',
  'package.json should expose the focused daily-note content verifier.',
);
assertCleanupCoreIncludes('verify:electron-obsidian-daily-note-content-module', 'cleanup-core should include the focused daily-note content verifier.');

console.log('electron Obsidian daily-note content module verification passed');
