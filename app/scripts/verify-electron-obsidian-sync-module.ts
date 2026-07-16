import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron/obsidianSync.ts');
const dailyNotePath = join(root, 'electron/obsidianSyncDailyNote.ts');
const planningPath = join(root, 'electron/obsidianSyncPlanning.ts');
const previewPath = join(root, 'electron/obsidianSyncPreview.ts');
const blogDraftOutputPath = join(root, 'electron/obsidianSyncBlogDraftOutput.ts');
const validationPath = join(root, 'electron/obsidianSyncValidation.ts');
const requestPath = join(root, 'electron/obsidianSyncRequest.ts');
const unknownValueGuardsPath = join(root, 'electron/unknownValueGuards.ts');
const servicesPath = join(root, 'electron/mainObsidianServices.ts');
const aiReviewServicesPath = join(root, 'electron/mainAiReviewServices.ts');
const mainPath = join(root, 'electron/main.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron Obsidian sync module should exist.');
assert.ok(existsSync(dailyNotePath), 'Electron Obsidian sync daily-note helper module should exist.');
assert.ok(existsSync(planningPath), 'Electron Obsidian sync planning module should exist.');
assert.ok(existsSync(previewPath), 'Electron Obsidian sync preview module should exist.');
assert.ok(existsSync(blogDraftOutputPath), 'Electron Obsidian sync blog-draft output module should exist.');
assert.ok(existsSync(validationPath), 'Electron Obsidian sync validation module should exist.');
assert.ok(existsSync(requestPath), 'Electron Obsidian sync request preparation module should exist.');
assert.ok(existsSync(unknownValueGuardsPath), 'Electron unknown-value guards module should exist.');
assert.ok(existsSync(servicesPath), 'Electron main Obsidian services module should exist.');

const helper = readFileSync(modulePath, 'utf8');
const dailyNote = readFileSync(dailyNotePath, 'utf8');
const planning = readFileSync(planningPath, 'utf8');
const preview = readFileSync(previewPath, 'utf8');
const blogDraftOutput = readFileSync(blogDraftOutputPath, 'utf8');
const validation = readFileSync(validationPath, 'utf8');
const request = readFileSync(requestPath, 'utf8');
const unknownValueGuards = readFileSync(unknownValueGuardsPath, 'utf8');
const services = readFileSync(servicesPath, 'utf8');
const aiReviewServices = readFileSync(aiReviewServicesPath, 'utf8');
const main = readFileSync(mainPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;
const helperLines = helper.split(/\r?\n/).length;

assert.match(helper, /export function createObsidianSyncHelpers\b/, 'Obsidian sync module should export a helper factory.');
assert.match(helper, /from '\.\/obsidianSyncDailyNote'/, 'Obsidian sync module should import daily-note write helpers.');
assert.match(request, /from '\.\/obsidianSyncPlanning'/, 'Obsidian sync request preparation should import pure affected-date planning.');
assert.match(request, /readObsidianSyncInput/, 'Obsidian sync request preparation should reuse shared task payload validation and narrowing.');
assert.match(helper, /from '\.\/obsidianSyncRequest'/, 'Obsidian sync module should delegate common request preparation.');
assert.ok(helperLines < 300, `electron/obsidianSync.ts should stay below 300 lines after daily-note extraction; got ${helperLines}`);
assert.match(helper, /from '\.\/obsidianSyncPreview'/, 'Obsidian sync module should compose the focused sync preview helper.');
assert.match(preview, /buildSyncPreview/, 'Obsidian sync preview module should own sync preview assembly.');
assert.match(dailyNote, /resolveTemplatePath/, 'Obsidian daily-note sync helper should own daily-note path resolution.');
assert.match(dailyNote, /function getDailyFilePath\b/, 'Obsidian daily-note sync helper should own daily-note path resolution helper.');
assert.match(dailyNote, /function triggerOverviewUpdate\b/, 'Obsidian daily-note sync helper should own overview refresh orchestration.');
assert.match(dailyNote, /function syncOneDailyNote\b/, 'Obsidian daily-note sync helper should own single-note sync writes.');
assert.match(dailyNote, /function prepareDailyNoteSync\b/, 'Obsidian daily-note helper should preflight every affected note before commit.');
assert.match(dailyNote, /function commitDailyNoteSync\b/, 'Obsidian daily-note helper should own ordered conditional commits.');
assert.doesNotMatch(helper, /function getDailyFilePath\b/, 'Obsidian sync orchestrator should not keep daily-note path resolution inline.');
assert.doesNotMatch(helper, /function triggerOverviewUpdate\b/, 'Obsidian sync orchestrator should not keep overview refresh inline.');
assert.doesNotMatch(helper, /function syncOneDailyNote\b/, 'Obsidian sync orchestrator should not keep single-note writes inline.');
assert.match(
  dailyNote,
  /didWrite: nextContent !== existingFileContent/,
  'Obsidian sync should skip physical daily-note writes when generated content is unchanged.',
);
assert.match(
  dailyNote,
  /if \(!plan\.didWrite\) continue;[\s\S]*writeTextFileAtomicIfUnchanged\(plan\.filePath, plan\.nextContent, plan\.stamp\)/,
  'Obsidian sync should conditionally atomically replace only changed notes.',
);
assert.match(
  helper,
  /const plans = prepareDailyNoteSync\([\s\S]*?commitDailyNoteSync\(plans, selected\)/,
  'Obsidian sync should complete all daily-note preflight planning before any commit.',
);
assert.match(
  dailyNote,
  /sort\(\(left, right\) => Number\(left\.date === selected\) - Number\(right\.date === selected\)\)/,
  'Obsidian sync should commit the selected date last.',
);
assert.match(
  helper,
  /markerWarnings: plans\.flatMap/,
  'Obsidian sync preview should surface non-blocking marker health warnings.',
);
assert.match(
  helper,
  /if \(selectedResult\.didWrite\) \{\s*triggerOverviewUpdate\(selectedResult\.filePath\);\s*void runReviewForDate\(selected, input\.value\.tasks\)\.catch\(\(\) => \{\}\);\s*\}/,
  'Obsidian sync should only trigger expensive follow-up work after the selected note changes.',
);
assert.match(helper, /from '\.\/obsidianSyncBlogDraftOutput'/, 'Obsidian sync should delegate optional blog-draft output.');
assert.match(helper, /writeObsidianSyncBlogDraftOutput\(\{[\s\S]*?localBlogDraftDir,[\s\S]*?date: selected,[\s\S]*?tasks: input\.value\.tasks,[\s\S]*?obsidianContent: selectedResult\.nextContent,[\s\S]*?buildBlogDraft,[\s\S]*?\}\);/, 'Obsidian sync should provide selected sync output to the blog-draft writer.');
assert.match(blogDraftOutput, /if \(nextBlogDraft !== existingBlogDraft\) \{\s*fs\.writeFileSync\(blogDraftPath, nextBlogDraft, 'utf-8'\);\s*\}/, 'Blog-draft output should skip physical writes when generated content is unchanged.');
assert.match(planning, /export function getDatesAffectedBySync\b/, 'Obsidian sync planning should own affected-date collection.');
assert.match(
  planning,
  /function hasCompletionRecordOnDate\b/,
  'Obsidian sync planning should check completion-record dates without constructing a sorted review list.',
);
assert.doesNotMatch(
  planning,
  /getCompletionReviews\(task\)\.some\(/,
  'Obsidian sync date collection should not sort completion reviews merely to test date membership.',
);
assert.doesNotMatch(helper, /function collectAffectedSyncDates\b/, 'Obsidian sync orchestrator should not retain recursive affected-date traversal.');
assert.doesNotMatch(helper, /function getDatesAffectedBySync\b/, 'Obsidian sync orchestrator should not retain affected-date collection.');
assert.match(helper, /function syncTasksToObsidian\b/, 'Obsidian sync module should own task sync orchestration.');
assert.match(helper, /function previewTasksToObsidian\b/, 'Obsidian sync module should own sync preview orchestration.');
assert.match(
  preview,
  /function buildObsidianSyncPreview[\s\S]*?const templates = getTemplates\(\);[\s\S]*?for \(const affectedDate of affectedDates\)[\s\S]*?taskCount \+= preview\.taskCount[\s\S]*?completionRecordCount \+= preview\.completionRecordCount/,
  'Obsidian sync preview assembly should cache templates and aggregate totals while traversing affected dates.',
);
assert.doesNotMatch(
  preview,
  /previewsByDate\.flatMap[\s\S]*?previewsByDate\.reduce[\s\S]*?previewsByDate\.reduce[\s\S]*?previewsByDate\.some/,
  'Obsidian sync preview assembly should not repeatedly traverse generated previews for each summary field.',
);
assert.match(helper, /runReviewForDate/, 'Obsidian sync module should preserve AI review triggering after sync.');
assert.match(helper, /buildBlogDraft/, 'Obsidian sync module should preserve blog-draft generation after sync.');
assert.match(validation, /export function hasValidObsidianSyncTasks\(value: unknown\): value is ObsidianSyncTask\[\]/, 'Obsidian sync task validation should narrow unknown task arrays before template preview calls.');
assert.match(validation, /export function readObsidianSyncInput\b/, 'Obsidian sync validation should own shared IPC input parsing.');
assert.match(validation, /type ReadObsidianSyncInputResult/, 'Obsidian sync validation should expose an explicit shared parse result.');
assert.match(request, /export function createObsidianSyncRequestReader\b/, 'request preparation should expose a focused factory.');
assert.match(request, /const vaultStatus = getVaultStatus\(\);/, 'request preparation should validate the vault before parsing input.');
assert.match(request, /const input = readObsidianSyncInput\(tasks, date, dailyWork, inspiration, beforeTasks\);/, 'request preparation should parse common unknown inputs through the shared reader.');
assert.match(request, /const selected = getDateKey\(input\.value\.date\);/, 'request preparation should normalize the selected date once.');
assert.match(request, /const affectedDates = getDatesAffectedBySync\(/, 'request preparation should calculate affected dates once.');
assert.match(helper, /const request = readSyncRequest\(tasks, date, dailyWork, inspiration, beforeTasks\);/, 'sync and preview flows should share prepared request data.');
assert.doesNotMatch(helper, /const input = readObsidianSyncInput\(/, 'sync orchestration should not duplicate common input parsing after request preparation extraction.');
assert.match(validation, /function isObsidianSyncTask\(value: unknown\): value is ObsidianSyncTask/, 'Obsidian sync validation should own recursive task payload validation.');
assert.match(unknownValueGuards, /export \{ isObjectRecord \} from '\.\.\/shared\/unknownValueGuards';/, 'Electron unknown-value guards should preserve object-record narrowing through the shared compatibility export.');
assert.match(validation, /from '\.\/unknownValueGuards'/, 'Obsidian sync validation should reuse the Electron object-record guard.');
assert.match(dailyNote, /from '\.\/unknownValueGuards'/, 'Obsidian daily-note sync should reuse the Electron object-record guard.');
assert.doesNotMatch(validation, /function isObject\(value: unknown\): value is Record<string, unknown>/, 'Obsidian sync validation should not retain a duplicate object-record guard.');
assert.doesNotMatch(dailyNote, /function isObject\(value: unknown\): value is Record<string, unknown>/, 'Obsidian daily-note sync should not retain a duplicate object-record guard.');
assert.match(dailyNote, /function readTemplateModuleEnabled\(templates: ObsidianTemplateSettings, moduleId: string, fallback: boolean\)/, 'Obsidian daily-note sync should read legacy template module flags through a local helper.');
assert.doesNotMatch(helper, /as any/, 'Obsidian sync should not use any-casts for templates, vault paths, or preview tasks.');
assert.doesNotMatch(dailyNote, /as any/, 'Obsidian daily-note sync should not use any-casts for templates or vault paths.');
assert.doesNotMatch(validation, /as any/, 'Obsidian sync validation should not use any-casts for task payloads.');

assert.match(services, /from '\.\/obsidianSync'/, 'main Obsidian services should import Obsidian sync helpers from obsidianSync.');
assert.match(main, /from '\.\/appEnvironment'/, 'main should import the app environment helper that owns the local blog draft path.');
assert.match(services, /createObsidianSyncHelpers\(\{/, 'main Obsidian services should create Obsidian sync helpers through the module.');
assert.match(services, /getDateKey,/, 'main Obsidian services should pass date-key normalization into the Obsidian sync helper.');
assert.match(services, /getTaskDate,/, 'main Obsidian services should pass task-date resolution into the Obsidian sync helper.');
assert.match(services, /getReviewDate,/, 'main Obsidian services should pass review-date resolution into the Obsidian sync helper.');
assert.match(services, /getVaultPath,/, 'main Obsidian services should pass vault-path resolution into the Obsidian sync helper.');
assert.match(services, /getVaultStatus,/, 'main Obsidian services should pass vault-status validation into the Obsidian sync helper.');
assert.match(services, /getTemplates: getObsidianTemplateSettings,/, 'main Obsidian services should pass template settings access into the Obsidian sync helper.');
assert.match(services, /buildDailyTemplate,/, 'main Obsidian services should pass daily-template generation into the Obsidian sync helper.');
assert.match(services, /buildWorkBlock,/, 'main Obsidian services should pass work-block generation into the Obsidian sync helper.');
assert.match(services, /buildInspirationBlock,/, 'main Obsidian services should pass inspiration-block generation into the Obsidian sync helper.');
assert.match(services, /buildTaskBlock,/, 'main Obsidian services should pass task-block generation into the Obsidian sync helper.');
assert.match(services, /migrateLegacyInspirationSection,/, 'main Obsidian services should pass inspiration legacy migration into the Obsidian sync helper.');
assert.match(services, /readMarkedBlockBody,/, 'main Obsidian services should pass managed-block body reads into the Obsidian sync helper.');
assert.match(services, /upsertMarkedBlock,/, 'main Obsidian services should pass managed-block updates into the Obsidian sync helper.');
assert.match(services, /migrateLegacyWorkSection,/, 'main Obsidian services should pass work legacy migration into the Obsidian sync helper.');
assert.match(services, /buildBlogDraft,/, 'main Obsidian services should pass blog-draft generation into the Obsidian sync helper.');
assert.match(services, /runReviewForDate,/, 'main Obsidian services should pass AI review triggering into the Obsidian sync helper.');
assert.match(services, /localBlogDraftDir,/, 'main Obsidian services should pass the shared local blog draft directory into the Obsidian sync helper.');

assert.match(aiReviewServices, /from '\.\/mainObsidianServices'/, 'AI review services should import the Obsidian services composition helper.');
assert.match(aiReviewServices, /createMainObsidianServices\(\{/, 'AI review services should create Obsidian services through the composition helper.');
assert.match(main, /from '\.\/mainAiReviewServices'/, 'main should import the AI review services composition helper.');
assert.match(main, /createMainAiReviewServices\(\{/, 'main should create services through the AI review composition helper.');
assert.doesNotMatch(main, /from '\.\/obsidianSync'/, 'main should not import Obsidian sync helpers directly after services extraction.');

for (const movedFunction of [
  'getDailyFilePath',
  'triggerOverviewUpdate',
  'syncOneDailyNote',
  'getDatesAffectedBySync',
  'syncTasksToObsidian',
  'previewTasksToObsidian',
]) {
  const declarationPattern = new RegExp(`function ${movedFunction}\\b`);
  assert.doesNotMatch(main, declarationPattern, `main should not keep ${movedFunction} inline after extraction.`);
}

assert.equal(
  scripts['verify:electron-obsidian-sync-module'],
  'tsx scripts/verify-electron-obsidian-sync-module.ts',
  'package.json should expose the focused Obsidian sync verifier.',
);
assertCleanupCoreIncludes('verify:electron-obsidian-sync-module', 'cleanup-core should include the focused Obsidian sync verifier.');

console.log('electron Obsidian sync module verification passed');
