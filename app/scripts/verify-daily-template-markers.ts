import { strict as assert } from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TASK_START_MARKER,
  WORK_START_MARKER,
  INSPIRATION_START_MARKER,
  buildDailyNoteContent,
  buildDailyNoteFromTemplate,
  buildSyncPreview,
  replaceManagedBlock,
  WORK_END_MARKER,
} from '../shared/obsidianTemplates';
import { customBlockMarker } from '../shared/aiReview/markers';
import { createDefaultObsidianTemplateSettings } from '../shared/appSettings';

const templates = createDefaultObsidianTemplateSettings();
const workSectionTitle = templates.dailyTemplate.fixedBlocks.find((block) => block.id === 'work')?.displayName || '今日工作';

// 1) A custom template renders core tokens as titled marker blocks, with no duplicate heading.
const fromTemplate = buildDailyNoteFromTemplate({
  date: '2026-06-11',
  tasks: [],
  dailyWork: '写代码',
  dailyInspiration: '一个点子',
  templates: { ...templates, dailyMarkdownTemplate: '# 我的日报 {{date}}\n\n{{work}}\n\n{{inspiration}}\n\n{{tasks}}' },
});
assert.ok(fromTemplate.includes('# 我的日报 2026-06-11'));
assert.ok(fromTemplate.includes(WORK_START_MARKER));
assert.ok(fromTemplate.includes(INSPIRATION_START_MARKER));
assert.ok(fromTemplate.includes(TASK_START_MARKER));
assert.ok(fromTemplate.includes('写代码'));
// Work title appears exactly once (no double heading).
assert.equal(fromTemplate.split(`## ${workSectionTitle}`).length - 1, 1);


// 1b) Custom daily template tokens tolerate whitespace and case, matching migration recognition.
const spacedTokenTemplate = buildDailyNoteFromTemplate({
  date: '2026-06-12',
  tasks: [],
  dailyWork: 'spaced work',
  dailyInspiration: 'spaced idea',
  templates: {
    ...templates,
    dailyMarkdownTemplate: '# spaced {{ DATE }}\n\n{{ work }}\n\n{{ Inspiration }}\n\n{{ TASKS }}',
  },
});
assert.ok(spacedTokenTemplate.includes('# spaced 2026-06-12'));
assert.ok(spacedTokenTemplate.includes(WORK_START_MARKER));
assert.ok(spacedTokenTemplate.includes(INSPIRATION_START_MARKER));
assert.ok(spacedTokenTemplate.includes(TASK_START_MARKER));
assert.equal(/\{\{\s*(date|work|inspiration|tasks)\s*\}\}/i.test(spacedTokenTemplate), false, 'recognized daily template tokens should not leak into generated notes');


// 1c) Custom AI tokens also render as managed marker blocks, not raw placeholders.
const [reviewCustomBlock, tomorrowCustomBlock, knowledgeCustomBlock] = templates.dailyTemplate.customBlocks;
const customAiTokenTemplate = buildDailyNoteFromTemplate({
  date: '2026-06-13',
  tasks: [],
  dailyWork: '',
  dailyInspiration: '',
  templates: {
    ...templates,
    dailyMarkdownTemplate: '# custom ai\n\n{{ review }}\n\n{{ TOMORROW }}\n\n{{ Knowledge }}',
  },
});
assert.ok(customAiTokenTemplate.includes(customBlockMarker(reviewCustomBlock.id).start));
assert.ok(customAiTokenTemplate.includes(customBlockMarker(tomorrowCustomBlock.id).start));
assert.ok(customAiTokenTemplate.includes(customBlockMarker(knowledgeCustomBlock.id).start));
assert.equal(/\{\{\s*(review|tomorrow|knowledge)\s*\}\}/i.test(customAiTokenTemplate), false, 'recognized custom AI tokens should not leak into generated notes');

// 2) Markers survive an incremental upsert, so sync keeps working on template-built files.
const upserted = replaceManagedBlock(
  fromTemplate,
  WORK_START_MARKER,
  WORK_END_MARKER,
  `${WORK_START_MARKER}\n## ${workSectionTitle}\n更新后的工作\n${WORK_END_MARKER}`,
);
assert.ok(upserted.includes('更新后的工作'));
assert.ok(!upserted.includes('写代码'));

// 3) Missing core token still appends its marker block so sync can locate it.
const missingTasks = buildDailyNoteFromTemplate({
  date: '2026-06-11',
  tasks: [],
  dailyWork: 'w',
  dailyInspiration: 'i',
  templates: { ...templates, dailyMarkdownTemplate: '# only work\n{{work}}' },
});
assert.ok(missingTasks.includes(TASK_START_MARKER));
assert.ok(missingTasks.includes(INSPIRATION_START_MARKER));


// 3b) Legacy disabled fixed modules should stay hidden in generated content,
// matching the sync preview's managed-block list.
const legacyDisabledFixedTemplates = {
  ...templates,
  modules: {
    work: { enabled: false },
    inspiration: { enabled: false },
    tasks: { enabled: false },
  },
} as any;
const legacyDisabledPreview = buildSyncPreview({
  date: '2026-06-11',
  tasksAfterDelete: [],
  dailyWork: 'hidden work',
  dailyInspiration: 'hidden inspiration',
  templates: legacyDisabledFixedTemplates,
  vaultPath: process.cwd(),
  existingDailyNote: '',
});
assert.deepEqual(legacyDisabledPreview.managedBlocks, []);
const legacyDisabledFallback = buildDailyNoteContent({
  date: '2026-06-11',
  tasks: [],
  dailyWork: 'hidden work',
  dailyInspiration: 'hidden inspiration',
  templates: legacyDisabledFixedTemplates,
});
assert.equal(legacyDisabledFallback.includes(WORK_START_MARKER), false, 'disabled legacy work module should not render in fallback daily content');
assert.equal(legacyDisabledFallback.includes(INSPIRATION_START_MARKER), false, 'disabled legacy inspiration module should not render in fallback daily content');
assert.equal(legacyDisabledFallback.includes(TASK_START_MARKER), false, 'disabled legacy tasks module should not render in fallback daily content');
const legacyDisabledCustomTemplate = buildDailyNoteFromTemplate({
  date: '2026-06-11',
  tasks: [],
  dailyWork: 'hidden work',
  dailyInspiration: 'hidden inspiration',
  templates: { ...legacyDisabledFixedTemplates, dailyMarkdownTemplate: '# legacy\n\n{{work}}\n{{inspiration}}\n{{tasks}}' },
});
assert.equal(legacyDisabledCustomTemplate.includes(WORK_START_MARKER), false, 'disabled legacy work module should not render from custom daily token');
assert.equal(legacyDisabledCustomTemplate.includes(INSPIRATION_START_MARKER), false, 'disabled legacy inspiration module should not render from custom daily token');
assert.equal(legacyDisabledCustomTemplate.includes(TASK_START_MARKER), false, 'disabled legacy tasks module should not render from custom daily token');

// 4) Empty template falls back to the module-based builder.
const fallback = buildDailyNoteFromTemplate({
  date: '2026-06-11',
  tasks: [],
  dailyWork: '',
  dailyInspiration: '',
  templates: { ...templates, dailyMarkdownTemplate: '' },
});
assert.ok(fallback.includes(WORK_START_MARKER));
const reviewBlock = templates.dailyTemplate.customBlocks.find((block) => /复盘|review/i.test(block.name));
if (!reviewBlock) throw new Error('default template should include a review custom block');
assert.ok(fallback.includes(customBlockMarker(reviewBlock.id).start));

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const obsidianTemplateCompatPath = join(root, 'shared/obsidianTemplateCompat.ts');
const obsidianTemplateTaskLinesPath = join(root, 'shared/obsidianTemplateTaskLines.ts');
const obsidianTemplateTaskVisibilityPath = join(root, 'shared/obsidianTemplateTaskVisibility.ts');
const obsidianTemplateCompletionReviewVisibilityPath = join(root, 'shared/obsidianTemplateCompletionReviewVisibility.ts');
const obsidianTemplateTaskLineFormattingPath = join(root, 'shared/obsidianTemplateTaskLineFormatting.ts');
const obsidianDailyNoteRenderingPath = join(root, 'shared/obsidianDailyNoteRendering.ts');
const obsidianTemplatesSource = readFileSync(join(root, 'shared/obsidianTemplates.ts'), 'utf8');
assert.ok(existsSync(obsidianTemplateCompatPath), 'obsidian template compatibility should live in a focused shared module.');
assert.ok(existsSync(obsidianTemplateTaskLinesPath), 'obsidian task-line rendering should live in a focused shared module.');
assert.ok(existsSync(obsidianTemplateTaskVisibilityPath), 'task visibility should live in a focused shared module.');
assert.ok(existsSync(obsidianTemplateCompletionReviewVisibilityPath), 'completion-review visibility should live in a focused shared module.');
assert.ok(existsSync(obsidianTemplateTaskLineFormattingPath), 'task-line formatting should live in a focused shared module.');
assert.ok(existsSync(obsidianDailyNoteRenderingPath), 'daily-note rendering should live in a focused shared module.');
const obsidianTemplateCompatSource = readFileSync(obsidianTemplateCompatPath, 'utf8');
const obsidianTemplateTaskLinesSource = readFileSync(obsidianTemplateTaskLinesPath, 'utf8');
const obsidianTemplateTaskVisibilitySource = readFileSync(obsidianTemplateTaskVisibilityPath, 'utf8');
const obsidianTemplateCompletionReviewVisibilitySource = readFileSync(obsidianTemplateCompletionReviewVisibilityPath, 'utf8');
const obsidianTemplateTaskLineFormattingSource = readFileSync(obsidianTemplateTaskLineFormattingPath, 'utf8');
const obsidianDailyNoteRenderingSource = readFileSync(obsidianDailyNoteRenderingPath, 'utf8');
const templateRendererSource = readFileSync(join(root, 'shared/templateRenderer.ts'), 'utf8');
const pathTemplateSource = readFileSync(join(root, 'shared/pathTemplate.ts'), 'utf8');
assert.match(obsidianTemplatesSource, /from '\.\/obsidianTemplateCompat';/, 'obsidianTemplates should import its legacy compatibility reader from the focused module.');
assert.match(obsidianTemplatesSource, /from '\.\/obsidianTemplateTaskLines';/, 'obsidianTemplates should import task-line rendering from the focused module.');
assert.match(obsidianTemplatesSource, /from '\.\/obsidianDailyNoteRendering';/, 'obsidianTemplates should retain stable daily-note rendering exports from the focused module.');
assert.doesNotMatch(obsidianTemplatesSource, /function compat\(/, 'obsidianTemplates should not own the legacy compatibility reader inline.');
assert.doesNotMatch(obsidianTemplatesSource, /function readModuleEnabled\(/, 'obsidianTemplates should not own legacy module flag parsing inline.');
assert.doesNotMatch(obsidianTemplatesSource, /function readString\(/, 'obsidianTemplates should not own legacy string parsing inline.');
assert.doesNotMatch(obsidianTemplatesSource, /function readBoolean\(/, 'obsidianTemplates should not own legacy boolean parsing inline.');
assert.match(obsidianTemplateCompatSource, /export function readObsidianTemplateCompat\(t: ObsidianTemplateSettings\)/, 'obsidianTemplateCompat should export the template compatibility reader.');
assert.match(obsidianTemplateCompatSource, /function readModuleEnabled\(/, 'obsidianTemplateCompat should own legacy module flag parsing.');
assert.match(obsidianTemplateCompatSource, /import \{ isObjectRecord \} from '\.\/unknownValueGuards';/, 'obsidianTemplateCompat should reuse the shared object-record guard.');
assert.doesNotMatch(obsidianTemplateCompatSource, /function isRecord\(value: unknown\)/, 'obsidianTemplateCompat should not redeclare the shared object-record guard.');
assert.match(obsidianTemplateCompatSource, /function findFixedBlockTitle\(/, 'obsidianTemplateCompat should own fixed block title fallback lookup.');
assert.match(obsidianTemplateCompatSource, /function findCustomBlockTitle\(/, 'obsidianTemplateCompat should own custom block title fallback lookup.');
assert.doesNotMatch(obsidianTemplateCompatSource, /\bany\b/, 'obsidianTemplateCompat should keep compatibility parsing free of any.');
assert.match(pathTemplateSource, /export function dateKeyToLocalDate\(date: string\)/, 'pathTemplate should own local calendar conversion for date keys.');
assert.match(obsidianTemplatesSource, /dateKeyToLocalDate/, 'obsidianTemplates should reuse shared date-key conversion.');
assert.doesNotMatch(obsidianTemplatesSource, /function dateKeyToLocalDate\(/, 'obsidianTemplates should not duplicate date-key conversion.');
assert.doesNotMatch(obsidianTemplatesSource, /const a = t as any/, 'obsidianTemplates compat should not cast settings as any.');
assert.doesNotMatch(obsidianTemplatesSource, /\.find\(\(b: any\)/, 'obsidianTemplates compat should not cast legacy block items as any.');
assert.match(obsidianTemplatesSource, /export type \{ ObsidianTemplateCompletionReview, ObsidianTemplateTask \} from '\.\/obsidianTemplateTaskLines';/, 'obsidianTemplates should re-export the shared task-line task shape.');
assert.match(obsidianTemplatesSource, /export \{ buildTaskLines \} from '\.\/obsidianTemplateTaskLines';/, 'obsidianTemplates should re-export task-line rendering for stable callers.');
assert.doesNotMatch(obsidianTemplatesSource, /function escapeTaskText\(/, 'obsidianTemplates should not own task-line escaping helpers inline.');
assert.doesNotMatch(obsidianTemplatesSource, /function collectVisibleTaskData\(/, 'obsidianTemplates should not own task-line visibility indexing inline.');
assert.match(obsidianDailyNoteRenderingSource, /export function buildDailyNoteContent\b/, 'daily-note rendering should own default daily content assembly.');
assert.match(obsidianDailyNoteRenderingSource, /export function buildDailyNoteFromTemplate\b/, 'daily-note rendering should own custom-template token replacement and fallback blocks.');
assert.match(obsidianDailyNoteRenderingSource, /export function buildTaskBlock\b/, 'daily-note rendering should own managed task-block rendering.');
assert.doesNotMatch(obsidianTemplatesSource, /function buildDailyNoteContent\b/, 'obsidianTemplates should not retain default daily content assembly after extraction.');
assert.doesNotMatch(obsidianTemplatesSource, /function buildDailyNoteFromTemplate\b/, 'obsidianTemplates should not retain custom daily template rendering after extraction.');
assert.match(obsidianTemplateTaskLinesSource, /export type ObsidianTemplateTask = \{[\s\S]*?taskDate\?: string;[\s\S]*?subtasks\?: ObsidianTemplateTask\[\];[\s\S]*?\}/, 'obsidianTemplateTaskLines should expose the smaller task shape required for template rendering.');
assert.match(obsidianTemplateTaskLinesSource, /export function buildTaskLines\(tasks: ObsidianTemplateTask\[\]/, 'task-line rendering should accept the shared template task shape instead of the full renderer Task type.');
assert.match(obsidianTemplateTaskLinesSource, /from '\.\/obsidianTemplateCompletionReviewVisibility';/, 'task-line rendering should reuse the focused completion-review visibility module.');
assert.match(obsidianTemplateTaskLinesSource, /from '\.\/obsidianTemplateTaskLineFormatting';/, 'task-line rendering should reuse the focused formatting module.');
assert.match(obsidianTemplateTaskLineFormattingSource, /export function renderTaskLineTemplate\b/, 'task-line formatting should own generic task-line placeholder replacement.');
assert.match(obsidianTemplateTaskLineFormattingSource, /export function compileCompletionReviewTemplate\b/, 'task-line formatting should own completion-review template precompilation.');
assert.doesNotMatch(obsidianTemplateTaskLinesSource, /function escapeTaskText\(/, 'task-line rendering should not retain task-text escaping inline.');
assert.doesNotMatch(obsidianTemplateTaskLinesSource, /function formatTaskTags\(/, 'task-line rendering should not retain task-tag formatting inline.');
assert.doesNotMatch(obsidianTemplateTaskLinesSource, /function formatDateTime\(/, 'task-line rendering should not retain timestamp formatting inline.');
assert.doesNotMatch(obsidianTemplateTaskLinesSource, /function renderTemplate\(/, 'task-line rendering should not retain generic placeholder replacement inline.');
assert.doesNotMatch(obsidianTemplateTaskLinesSource, /function compileCompletionReviewTemplate\(/, 'task-line rendering should not retain completion-review template precompilation inline.');
assert.match(obsidianTemplateCompletionReviewVisibilitySource, /export function getVisibleCompletionReviews\b/, 'completion-review visibility should export ordered review selection.');
assert.match(obsidianTemplateCompletionReviewVisibilitySource, /export function forEachVisibleCompletionReview\b/, 'completion-review visibility should export streaming review selection for statistics.');
assert.doesNotMatch(obsidianTemplateTaskLinesSource, /function getVisibleCompletionReviews\b|function forEachVisibleCompletionReview\b/, 'task-line rendering should not retain completion-review visibility implementations after extraction.');
assert.match(obsidianTemplateCompletionReviewVisibilitySource, /function getVisibleCompletionReviews[\s\S]*?if \(taskDate === date\) \{[\s\S]*?return reviews/, 'Template rendering should reuse each task date while selecting visible completion reviews.');
assert.match(
  obsidianTemplateCompletionReviewVisibilitySource,
  /function getVisibleCompletionReviews[\s\S]*?for \(const review of reviews\) \{[\s\S]*?if \(getReviewDate\(review\) !== date\) continue;[\s\S]*?visibleReviews\.push\(review\);[\s\S]*?return visibleReviews\.length > 1/,
  'cross-date template rendering should filter matching reviews before sorting them.',
);
assert.doesNotMatch(
  obsidianTemplateCompletionReviewVisibilitySource,
  /function getVisibleCompletionReviews[\s\S]*?getCompletionReviews\(task\)\.filter/,
  'cross-date template rendering should not sort every review before discarding unmatched records.',
);
assert.match(obsidianTemplateTaskLinesSource, /const lines: string\[\] = \[\];[\s\S]*?for \(const task of sortTasks\(tasks\)\) \{[\s\S]*?if \(!visibleTasks\.has\(task\)\) continue;[\s\S]*?lines\.push\(\.\.\.renderTask\(task, 0\)\);[\s\S]*?return lines;/, 'Template rendering should append visible root-task lines without filter and flatMap intermediate arrays.');
assert.doesNotMatch(obsidianTemplateTaskLinesSource, /return sortTasks\(tasks\)\s*\.filter\(\(task\) => visibleTasks\.has\(task\)\)\s*\.flatMap\(\(task\) => renderTask\(task, 0\)\);/, 'Template rendering should not allocate filter and flatMap arrays for visible root tasks.');
assert.match(obsidianTemplatesSource, /buildSyncPreview\(params: \{[\s\S]*?tasksAfterDelete: ObsidianTemplateTask\[\];/, 'sync preview should accept the shared template task shape.');
assert.match(
  obsidianTemplateTaskVisibilitySource,
  /function collectVisibleTaskStats\(tasks: ObsidianTemplateTask\[\], date: string\)/,
  'sync preview should collect visible task and review counts in one tree traversal.',
);
assert.match(
  obsidianTemplateCompletionReviewVisibilitySource,
  /function forEachVisibleCompletionReview\([\s\S]*?task: CompletionReviewTask,[\s\S]*?date: string,[\s\S]*?includeAll: boolean,[\s\S]*?visit:/,
  'sync preview should select date-visible review records without sorting them.',
);
assert.doesNotMatch(
  obsidianTemplateTaskVisibilitySource,
  /function collectVisibleTaskStats[\s\S]*?getVisibleCompletionReviews\(task, date, taskDate\)/,
  'sync preview statistics should not construct sorted review lists when record order is unused.',
);
assert.doesNotMatch(
  obsidianTemplateTaskVisibilitySource,
  /function flattenTasks\(|function countCompletionRecords\(|function reviewKeys\(/,
  'sync preview should not repeatedly flatten the same task tree for independent statistics.',
);
assert.doesNotMatch(
  obsidianTemplatesSource,
  /\[\.\.\.beforeStats\.reviewKeys\]\.some\(/,
  'sync preview should compare review identity sets without expanding the entire prior set into an array.',
);
assert.match(
  obsidianTemplatesSource,
  /for \(const key of beforeStats\.reviewKeys\)/,
  'sync preview should short-circuit while scanning prior review identities.',
);
assert.doesNotMatch(
  obsidianTemplatesSource,
  /managedBlocks\.push\(\{ marker: 'DAILYTODO:(?:WORK|INSPIRATION|TASKS)', action: existingDailyNote\.includes\(/,
  'sync preview should calculate managed-marker presence before building preview entries.',
);
assert.match(
  obsidianTemplatesSource,
  /const hasWorkBlock = cc\.workEnabled && existingDailyNote\.includes\(WORK_START_MARKER\);/,
  'sync preview should only scan daily content for enabled managed markers.',
);
assert.match(
  obsidianTemplateTaskVisibilitySource,
  /function collectVisibleTaskData\(tasks: ObsidianTemplateTask\[\], date: string\)/,
  'task rendering should collect visibility and review data before rendering sorted nodes.',
);
assert.match(
  obsidianTemplateTaskLinesSource,
  /const \{ visibleTasks, visibleReviewsByTask, taskDates \} = collectVisibleTaskData\(tasks, date\);/,
  'task rendering should reuse the task-tree visibility index while rendering.',
);
assert.match(
  obsidianTemplateTaskLinesSource,
  /const taskDate = taskDates\.get\(task\) \?\? '';/,
  'task rendering should reuse collected task dates instead of resolving them again.',
);
assert.match(
  obsidianTemplateTaskLinesSource,
  /const visibleReviews = visibleReviewsByTask\.get\(task\) \?\? \[\];/,
  'task rendering should reuse collected completion reviews instead of sorting them again.',
);
assert.doesNotMatch(
  obsidianTemplateTaskLinesSource,
  /const visibleTasks = collectVisibleTasks\(tasks, date\);/,
  'task rendering should not maintain a visibility-only index that forces repeat review lookups during rendering.',
);
assert.match(
  obsidianTemplateTaskLinesSource,
  /const completionReviewLines = compileCompletionReviewTemplate\(String\(c\.completionReviewTemplate\)\);/,
  'task rendering should reuse compiled completion-review template lines for every review.',
);
assert.doesNotMatch(
  obsidianTemplateTaskLinesSource,
  /String\(c\.completionReviewTemplate\)\s*\.split\('\\n'\)/,
  'task rendering should not split the same completion-review template for every review.',
);
assert.match(templateRendererSource, /REVIEW_MARKER_KEYS/, 'templateRenderer should iterate canonical marker keys');
assert.doesNotMatch(templateRendererSource, /Object\.entries\(BLOCK_KEYWORDS\) as Array</, 'templateRenderer should not cast Object.entries(BLOCK_KEYWORDS)');

console.log('verify-daily-template-markers ok');
