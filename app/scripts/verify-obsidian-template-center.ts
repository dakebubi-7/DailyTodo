import { strict as assert } from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';
import {
  createDefaultObsidianTemplateSettings,
  normalizeObsidianTemplateSettings,
} from '../shared/appSettings';
import {
  applyObsidianTemplatePreset,
  modulesFromDailyTemplate,
  updateAdvancedTemplateField,
  updateTemplateModule,
} from '../shared/obsidianTemplateCenter';
import { buildDailyNoteContent, buildSyncPreview } from '../shared/obsidianTemplates';
import { renderDailyTemplate } from '../shared/templateRenderer';

const defaults = createDefaultObsidianTemplateSettings();
const appSettingsSource = readFileSync(new URL('../shared/appSettings.ts', import.meta.url), 'utf8');
const templateCenterSource = readFileSync(new URL('../shared/obsidianTemplateCenter.ts', import.meta.url), 'utf8');
const moduleSettingsUrl = new URL('../shared/obsidianTemplateModuleSettings.ts', import.meta.url);

assert.equal(existsSync(moduleSettingsUrl), true, 'template module settings module should exist.');
const moduleSettingsSource = readFileSync(moduleSettingsUrl, 'utf8');

assert.match(
  templateCenterSource,
  /from '\.\/obsidianTemplateModuleSettings';/,
  'template center should re-export static module settings for existing consumers.',
);
assert.doesNotMatch(
  templateCenterSource,
  /export const OBSIDIAN_TEMPLATE_MODULE_IDS\b/,
  'template center should delegate canonical module ids to the module settings module.',
);
assert.doesNotMatch(
  templateCenterSource,
  /export function createDefaultModules\b/,
  'template center should delegate default module construction to the module settings module.',
);
assert.doesNotMatch(
  templateCenterSource,
  /export function normalizeTemplateModules\b/,
  'template center should delegate module normalization to the module settings module.',
);
assert.match(
  moduleSettingsSource,
  /export const OBSIDIAN_TEMPLATE_MODULE_IDS\b/,
  'module settings should own canonical template module ids.',
);
assert.match(
  moduleSettingsSource,
  /export const OBSIDIAN_TEMPLATE_PRESETS\b/,
  'module settings should own template presets.',
);
assert.match(
  moduleSettingsSource,
  /export function normalizeTemplateModules\b/,
  'module settings should own template module normalization.',
);

assert.doesNotMatch(
  templateCenterSource,
  /\{\} as ObsidianTemplateModules/,
  'normalizeTemplateModules should not cast a reduce accumulator as ObsidianTemplateModules.',
);
assert.doesNotMatch(
  appSettingsSource,
  /value\[key\] as string/,
  'readStringSetting should narrow the indexed value before returning it.',
);
assert.doesNotMatch(
  appSettingsSource,
  /value as Record<string, unknown>/,
  'normalizeObsidianTemplateSettings should use the shared object guard instead of casting values to records.',
);

const defaultModules = modulesFromDailyTemplate(defaults.dailyTemplate);
assert.equal(defaults.dailyPath, 'logs/daily/DailyTodo/{{date}}.md');
assert.equal(defaultModules.work.enabled, true);
assert.equal(defaultModules.work.title, '今日工作');
assert.equal(defaultModules.inspiration.title, '灵感随笔');

const legacyPaths = normalizeObsidianTemplateSettings({
  dailyNotePath: 'notes/{{date}}.md',
  weeklyDir: 'weekly-reports',
  monthlyDir: 'monthly-reports',
});
assert.equal(legacyPaths.dailyPath, 'notes/{{date}}.md');
assert.equal(legacyPaths.weeklyPath, 'weekly-reports/{{year}}-W{{week}}.md');
assert.equal(legacyPaths.monthlyPath, 'monthly-reports/{{year}}-{{month}}.md');

const legacyMarkdown = normalizeObsidianTemplateSettings({
  dailyMarkdownTemplate: '{{work}}\n{{tasks}}\n{{review}}',
});
assert.equal(legacyMarkdown.dailyTemplate.blockOrder[0].type, 'fixed');
assert.deepEqual(
  legacyMarkdown.dailyTemplate.fixedBlocks.map((block) => block.displayName),
  ['今日工作', '灵感随笔', '每日任务'],
);

const workReview = applyObsidianTemplatePreset(defaults, 'work-review');
const workReviewModules = modulesFromDailyTemplate(workReview.dailyTemplate);
const workReviewKnowledgeBlock = workReview.dailyTemplate.customBlocks[2];
if (!workReviewKnowledgeBlock) throw new Error('work-review preset should still carry a knowledge block record');
const workReviewContent = buildDailyNoteContent({
  date: '2026-06-10',
  tasks: [],
  dailyWork: '',
  dailyInspiration: '',
  templates: workReview,
});
assert.equal(workReviewModules.work.title, '今日推进');
assert.equal(workReviewModules.tasks.title, '任务与完成记录');
assert.equal(workReviewModules.tomorrow.enabled, true);
assert.equal(workReviewModules.knowledge.enabled, false);
assert.equal(workReviewKnowledgeBlock.aiGenerate, false);
assert.equal(
  workReviewContent.includes(workReviewKnowledgeBlock.name),
  false,
  'disabled daily-template modules should not keep rendering their hidden custom block headings.',
);
const renderedWorkReviewTemplate = renderDailyTemplate({
  template: workReview.dailyTemplate,
  work: '',
  inspiration: '',
  tasks: '',
  date: '2026-06-10',
});
assert.equal(
  renderedWorkReviewTemplate.includes(workReviewKnowledgeBlock.name),
  false,
  'renderDailyTemplate should hide disabled daily custom block headings too.',
);

const updatedModule = updateTemplateModule(defaults, 'inspiration', { enabled: true, title: '闪念' });
const updatedModuleState = modulesFromDailyTemplate(updatedModule.dailyTemplate);
assert.equal(updatedModuleState.inspiration.enabled, true);
assert.equal(updatedModuleState.inspiration.title, '闪念');

const updatedAdvanced = updateAdvancedTemplateField(defaults, 'dailyPath', 'journal/{{date}}.md');
assert.equal(updatedAdvanced.dailyPath, 'journal/{{date}}.md');
assert.equal(modulesFromDailyTemplate(updatedAdvanced.dailyTemplate).review.title, '复盘');

const retitledWork = updateTemplateModule(defaults, 'work', { title: '今日推进' });
const retitledContent = buildDailyNoteContent({
  date: '2026-06-10',
  tasks: [],
  dailyWork: 'should render',
  dailyInspiration: '',
  templates: retitledWork,
});
assert.equal(retitledContent.includes('## 今日推进'), true);
assert.equal(retitledContent.includes('should render'), true);
assert.equal(retitledContent.includes('DAILYTODO:TASKS:START'), true);
assert.equal(retitledContent.includes('复盘'), true);

const noTasksPreview = buildSyncPreview({
  date: '2026-06-10',
  tasksAfterDelete: [],
  dailyWork: '',
  dailyInspiration: '',
  templates: defaults,
  vaultPath: process.cwd(),
  existingDailyNote: '',
});
assert.equal(noTasksPreview.managedBlocks.some((block) => block.marker === 'DAILYTODO:TASKS'), true);

assert.match(moduleSettingsSource, /import \{ isObjectRecord \} from '\.\/unknownValueGuards';/, 'template module normalization should reuse the shared object-record guard.');
assert.doesNotMatch(moduleSettingsSource, /function isObject\(value: unknown\)/, 'template module normalization should not redeclare the shared object-record guard.');

console.log('Obsidian template center verification passed');
