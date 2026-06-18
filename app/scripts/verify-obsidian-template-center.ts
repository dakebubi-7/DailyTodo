import { strict as assert } from 'node:assert';
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

const defaults = createDefaultObsidianTemplateSettings();
const defaultModules = modulesFromDailyTemplate(defaults.dailyTemplate);
assert.equal(defaults.dailyPath, 'logs/daily/{{date}}.md');
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
assert.equal(legacyPaths.monthlyPath, 'monthly-reports/{{year}}-W{{week}}.md');

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
assert.equal(workReviewModules.work.title, '今日推进');
assert.equal(workReviewModules.tasks.title, '任务与完成记录');
assert.equal(workReviewModules.tomorrow.enabled, true);
assert.equal(workReviewModules.knowledge.enabled, false);

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

console.log('Obsidian template center verification passed');
