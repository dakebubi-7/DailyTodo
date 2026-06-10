import { strict as assert } from 'node:assert';
import {
  applyObsidianTemplatePreset,
  createDefaultObsidianTemplateSettings,
  normalizeObsidianTemplateSettings,
  updateAdvancedTemplateField,
  updateTemplateModule,
} from '../shared/appSettings';
import { buildDailyNoteContent, buildSyncPreview } from '../shared/obsidianTemplates';

const defaults = createDefaultObsidianTemplateSettings();
assert.equal(defaults.presetId, 'simple');
assert.equal(defaults.modules.work.enabled, true);
assert.equal(defaults.modules.inspiration.enabled, false);
assert.equal(defaults.workSectionTitle, defaults.modules.work.title);

const normalizedLegacyTitleWinsOverModule = normalizeObsidianTemplateSettings({
  ...defaults,
  modules: {
    ...defaults.modules,
    work: { ...defaults.modules.work, title: '今日工作' },
  },
  workSectionTitle: '新的工作标题',
});
assert.equal(normalizedLegacyTitleWinsOverModule.modules.work.title, '新的工作标题');
assert.equal(normalizedLegacyTitleWinsOverModule.workSectionTitle, '新的工作标题');

const legacy = normalizeObsidianTemplateSettings({
  dailyNotePath: 'notes/{{date}}.md',
  taskExportPath: 'tasks/{{date}}.md',
  workSectionTitle: '旧工作',
  inspirationSectionTitle: '旧灵感',
  taskSectionTitle: '旧任务',
  reviewSectionTitle: '旧复盘',
  tomorrowTaskSectionTitle: '旧明日',
  reusableKnowledgeSectionTitle: '旧知识',
});
assert.equal(legacy.modules.work.title, '旧工作');
assert.equal(legacy.modules.inspiration.title, '旧灵感');
assert.equal(legacy.modules.tasks.title, '旧任务');
assert.equal(legacy.modules.review.title, '旧复盘');
assert.equal(legacy.modules.tomorrow.title, '旧明日');
assert.equal(legacy.modules.knowledge.title, '旧知识');
assert.equal(legacy.workSectionTitle, '旧工作');
assert.equal(legacy.inspirationSectionTitle, '旧灵感');
assert.equal(legacy.taskSectionTitle, '旧任务');
assert.equal(legacy.reviewSectionTitle, '旧复盘');
assert.equal(legacy.tomorrowTaskSectionTitle, '旧明日');
assert.equal(legacy.reusableKnowledgeSectionTitle, '旧知识');

const workReview = applyObsidianTemplatePreset(defaults, 'work-review');
assert.equal(workReview.presetId, 'work-review');
assert.equal(workReview.modules.tomorrow.enabled, true);
assert.equal(workReview.modules.tasks.title, '任务与完成记录');
assert.equal(workReview.taskSectionTitle, '任务与完成记录');

const updatedModule = updateTemplateModule(defaults, 'inspiration', { enabled: true, title: '闪念' });
assert.equal(updatedModule.presetId, 'custom');
assert.equal(updatedModule.modules.inspiration.enabled, true);
assert.equal(updatedModule.inspirationSectionTitle, '闪念');

const updatedAdvanced = updateAdvancedTemplateField(defaults, 'reviewSectionTitle', '阶段复盘');
assert.equal(updatedAdvanced.presetId, 'custom');
assert.equal(updatedAdvanced.modules.review.title, '阶段复盘');
assert.equal(updatedAdvanced.reviewSectionTitle, '阶段复盘');

const normalizedRawModules = normalizeObsidianTemplateSettings({
  modules: {
    tasks: { enabled: false, title: '自定义任务' },
  },
});
assert.equal(normalizedRawModules.modules.tasks.enabled, false);
assert.equal(normalizedRawModules.modules.tasks.title, '自定义任务');
assert.equal(normalizedRawModules.taskSectionTitle, '自定义任务');

const noWork = updateTemplateModule(defaults, 'work', { enabled: false });
const noWorkContent = buildDailyNoteContent({
  date: '2026-06-10',
  tasks: [],
  dailyWork: 'should not render',
  dailyInspiration: '',
  templates: noWork,
});
assert.equal(noWorkContent.includes('DAILYTODO:WORK:START'), false);
assert.equal(noWorkContent.includes('should not render'), false);
assert.equal(noWorkContent.includes('DAILYTODO:TASKS:START'), true);
assert.equal(noWorkContent.includes('DAILYTODO:REVIEW:START'), true);

const noTasks = updateTemplateModule(defaults, 'tasks', { enabled: false });
const noTasksPreview = buildSyncPreview({
  date: '2026-06-10',
  tasksAfterDelete: [],
  dailyWork: '',
  dailyInspiration: '',
  templates: noTasks,
  vaultPath: process.cwd(),
  existingDailyNote: '',
});
assert.equal(noTasksPreview.managedBlocks.some((block) => block.marker === 'DAILYTODO:TASKS'), false);

console.log('Obsidian template center verification passed');
