import type { ObsidianTemplateSettings } from './appSettings';
import type { DailyTemplate } from './aiReview/sectionConfig';
import {
  createDefaultModules,
  getObsidianTemplatePreset,
  normalizeTemplateModules,
} from './obsidianTemplateModuleSettings';
import type {
  ObsidianTemplateModuleId,
  ObsidianTemplateModuleSettings,
  ObsidianTemplateModules,
  ObsidianTemplatePresetId,
} from './obsidianTemplateModuleSettings';

export * from './obsidianTemplateModuleSettings';

function text(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

export function modulesFromDailyTemplate(template: DailyTemplate): ObsidianTemplateModules {
  const modules = createDefaultModules();
  for (const block of template.fixedBlocks) {
    if (block.id === 'work') modules.work.title = block.displayName;
    if (block.id === 'inspire') modules.inspiration.title = block.displayName;
    if (block.id === 'tasks') modules.tasks.title = block.displayName;
  }
  const [review, tomorrow, knowledge] = template.customBlocks;
  if (review) modules.review = { enabled: review.aiGenerate, title: review.name };
  if (tomorrow) modules.tomorrow = { enabled: tomorrow.aiGenerate, title: tomorrow.name };
  if (knowledge) modules.knowledge = { enabled: knowledge.aiGenerate, title: knowledge.name };
  return modules;
}

function applyModulesToDailyTemplate(template: DailyTemplate, modules: ObsidianTemplateModules): DailyTemplate {
  return {
    fixedBlocks: template.fixedBlocks.map((block) => {
      if (block.id === 'work') return { ...block, displayName: modules.work.title };
      if (block.id === 'inspire') return { ...block, displayName: modules.inspiration.title };
      return { ...block, displayName: modules.tasks.title };
    }),
    customBlocks: template.customBlocks.map((block, index) => {
      const moduleId = index === 0 ? 'review' : index === 1 ? 'tomorrow' : index === 2 ? 'knowledge' : null;
      if (!moduleId) return block;
      return { ...block, name: modules[moduleId].title, aiGenerate: modules[moduleId].enabled };
    }),
    blockOrder: template.blockOrder,
  };
}

export function applyObsidianTemplatePreset(
  settings: ObsidianTemplateSettings,
  presetId: ObsidianTemplatePresetId,
): ObsidianTemplateSettings {
  const preset = getObsidianTemplatePreset(presetId);
  return {
    ...settings,
    dailyTemplate: applyModulesToDailyTemplate(settings.dailyTemplate, normalizeTemplateModules(preset.modules)),
  };
}

export function updateTemplateModule(
  settings: ObsidianTemplateSettings,
  moduleId: ObsidianTemplateModuleId,
  patch: Partial<ObsidianTemplateModuleSettings>,
): ObsidianTemplateSettings {
  const nextModules = modulesFromDailyTemplate(settings.dailyTemplate);
  nextModules[moduleId] = {
    ...nextModules[moduleId],
    ...patch,
    title: text(patch.title, nextModules[moduleId].title),
  };
  return {
    ...settings,
    dailyTemplate: applyModulesToDailyTemplate(settings.dailyTemplate, nextModules),
  };
}

export function updateAdvancedTemplateField<K extends keyof ObsidianTemplateSettings>(
  settings: ObsidianTemplateSettings,
  key: K,
  value: ObsidianTemplateSettings[K],
): ObsidianTemplateSettings {
  return { ...settings, [key]: value };
}
