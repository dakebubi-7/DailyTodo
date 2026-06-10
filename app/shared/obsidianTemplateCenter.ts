import type { ObsidianTemplateSettings } from './appSettings';

export type ObsidianTemplatePresetId = 'simple' | 'work-review' | 'knowledge' | 'custom';
export type ObsidianTemplateModuleId = 'work' | 'inspiration' | 'tasks' | 'review' | 'tomorrow' | 'knowledge';

export interface ObsidianTemplateModuleSettings {
  enabled: boolean;
  title: string;
}

export type ObsidianTemplateModules = Record<ObsidianTemplateModuleId, ObsidianTemplateModuleSettings>;

export interface ObsidianTemplatePreset {
  id: Exclude<ObsidianTemplatePresetId, 'custom'>;
  label: {
    zh: string;
    en: string;
  };
  description: {
    zh: string;
    en: string;
  };
  modules: ObsidianTemplateModules;
  taskLineTemplate: string;
  completionReviewTemplate: string;
}

export const OBSIDIAN_TEMPLATE_MODULE_IDS: ObsidianTemplateModuleId[] = [
  'work',
  'inspiration',
  'tasks',
  'review',
  'tomorrow',
  'knowledge',
];

export const OBSIDIAN_TEMPLATE_MODULE_LABELS: Record<ObsidianTemplateModuleId, { zh: string; en: string }> = {
  work: { zh: '工作', en: 'Work' },
  inspiration: { zh: '灵感', en: 'Inspiration' },
  tasks: { zh: '任务', en: 'Tasks' },
  review: { zh: '复盘', en: 'Review' },
  tomorrow: { zh: '明日待办', en: 'Tomorrow' },
  knowledge: { zh: '可复用知识', en: 'Reusable knowledge' },
};

export const DEFAULT_TASK_LINE_TEMPLATE = '- [{{checked}}] {{text}} #{{priority}}{{dateNote}}';

export const DEFAULT_COMPLETION_REVIEW_TEMPLATE = [
  '  - 阶段记录 {{index}}：{{status}}，完成度 {{percent}}%，记录时间 {{reviewedAt}}',
  '    - 今天情况：{{summary}}',
  '    - 还没懂/卡点：{{unknowns}}',
  '    - 下一步：{{nextStep}}',
].join('\n');

export function createDefaultModules(): ObsidianTemplateModules {
  return {
    work: { enabled: true, title: '今日工作' },
    inspiration: { enabled: false, title: '灵感闪念' },
    tasks: { enabled: true, title: '每日任务' },
    review: { enabled: true, title: '复盘' },
    tomorrow: { enabled: false, title: '明日待办' },
    knowledge: { enabled: false, title: '可复用知识' },
  };
}

function createSimplePreset(): ObsidianTemplatePreset {
  return {
    id: 'simple',
    label: { zh: '简洁日记', en: 'Simple daily note' },
    description: { zh: '保留工作、任务和复盘的默认结构。', en: 'Keep the default work, task, and review sections.' },
    modules: createDefaultModules(),
    taskLineTemplate: DEFAULT_TASK_LINE_TEMPLATE,
    completionReviewTemplate: DEFAULT_COMPLETION_REVIEW_TEMPLATE,
  };
}

function createWorkReviewPreset(): ObsidianTemplatePreset {
  return {
    id: 'work-review',
    label: { zh: '工作复盘', en: 'Work review' },
    description: { zh: '突出今日推进、任务完成记录、复盘和明日待办。', en: 'Focus on progress, task completion, review, and tomorrow planning.' },
    modules: {
      ...createDefaultModules(),
      work: { enabled: true, title: '今日推进' },
      inspiration: { enabled: false, title: '灵感闪念' },
      tasks: { enabled: true, title: '任务与完成记录' },
      review: { enabled: true, title: '复盘' },
      tomorrow: { enabled: true, title: '明日待办' },
      knowledge: { enabled: false, title: '可复用知识' },
    },
    taskLineTemplate: DEFAULT_TASK_LINE_TEMPLATE,
    completionReviewTemplate: DEFAULT_COMPLETION_REVIEW_TEMPLATE,
  };
}

function createKnowledgePreset(): ObsidianTemplatePreset {
  return {
    id: 'knowledge',
    label: { zh: '知识沉淀', en: 'Knowledge capture' },
    description: { zh: '聚焦灵感、任务、复盘和可复用知识沉淀。', en: 'Focus on inspiration, tasks, review, and reusable knowledge.' },
    modules: {
      ...createDefaultModules(),
      work: { enabled: false, title: '今日工作' },
      inspiration: { enabled: true, title: '灵感闪念' },
      tasks: { enabled: true, title: '每日任务' },
      review: { enabled: true, title: '复盘' },
      tomorrow: { enabled: false, title: '明日待办' },
      knowledge: { enabled: true, title: '可复用知识' },
    },
    taskLineTemplate: DEFAULT_TASK_LINE_TEMPLATE,
    completionReviewTemplate: DEFAULT_COMPLETION_REVIEW_TEMPLATE,
  };
}

export const OBSIDIAN_TEMPLATE_PRESETS: ObsidianTemplatePreset[] = [
  createSimplePreset(),
  createWorkReviewPreset(),
  createKnowledgePreset(),
];

const SECTION_TITLE_KEYS = {
  work: 'workSectionTitle',
  inspiration: 'inspirationSectionTitle',
  tasks: 'taskSectionTitle',
  review: 'reviewSectionTitle',
  tomorrow: 'tomorrowTaskSectionTitle',
  knowledge: 'reusableKnowledgeSectionTitle',
} as const satisfies Record<ObsidianTemplateModuleId, keyof ObsidianTemplateSettings>;

export type ObsidianTemplateSectionTitleKey = (typeof SECTION_TITLE_KEYS)[ObsidianTemplateModuleId];

export function getObsidianTemplatePreset(id: unknown): ObsidianTemplatePreset {
  return OBSIDIAN_TEMPLATE_PRESETS.find((preset) => preset.id === id) ?? OBSIDIAN_TEMPLATE_PRESETS[0];
}

export function moduleTitleKey(moduleId: ObsidianTemplateModuleId): ObsidianTemplateSectionTitleKey {
  return SECTION_TITLE_KEYS[moduleId];
}

export function normalizeTemplatePresetId(value: unknown): ObsidianTemplatePresetId {
  return value === 'work-review' || value === 'knowledge' || value === 'custom' ? value : 'simple';
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function text(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

export function normalizeTemplateModules(
  value: unknown,
  legacyTitles: Partial<Record<ObsidianTemplateModuleId, string>> = {},
): ObsidianTemplateModules {
  const defaults = createDefaultModules();
  const rawModules = isObject(value) ? value : {};

  return OBSIDIAN_TEMPLATE_MODULE_IDS.reduce((modules, moduleId) => {
    const defaultModule = defaults[moduleId];
    const rawModule = rawModules[moduleId];
    const legacyTitle = legacyTitles[moduleId];

    modules[moduleId] = {
      enabled: isObject(rawModule) && typeof rawModule.enabled === 'boolean' ? rawModule.enabled : defaultModule.enabled,
      title: text(legacyTitle, isObject(rawModule) ? text(rawModule.title, defaultModule.title) : defaultModule.title),
    };

    return modules;
  }, {} as ObsidianTemplateModules);
}

export function syncTemplateTitlesFromModules(settings: ObsidianTemplateSettings): ObsidianTemplateSettings {
  const synced = { ...settings };

  for (const moduleId of OBSIDIAN_TEMPLATE_MODULE_IDS) {
    const titleKey = moduleTitleKey(moduleId);
    synced[titleKey] = settings.modules[moduleId].title;
  }

  return synced;
}

export function applyObsidianTemplatePreset(
  settings: ObsidianTemplateSettings,
  presetId: ObsidianTemplatePresetId,
): ObsidianTemplateSettings {
  const preset = getObsidianTemplatePreset(presetId);

  return syncTemplateTitlesFromModules({
    ...settings,
    presetId: preset.id,
    modules: normalizeTemplateModules(preset.modules),
    taskLineTemplate: preset.taskLineTemplate,
    completionReviewTemplate: preset.completionReviewTemplate,
  });
}

export function updateTemplateModule(
  settings: ObsidianTemplateSettings,
  moduleId: ObsidianTemplateModuleId,
  patch: Partial<ObsidianTemplateModuleSettings>,
): ObsidianTemplateSettings {
  const nextModules = normalizeTemplateModules(settings.modules);
  nextModules[moduleId] = {
    ...nextModules[moduleId],
    ...patch,
    title: text(patch.title, nextModules[moduleId].title),
  };

  return syncTemplateTitlesFromModules({
    ...settings,
    presetId: 'custom',
    modules: nextModules,
  });
}

export function updateAdvancedTemplateField<K extends keyof ObsidianTemplateSettings>(
  settings: ObsidianTemplateSettings,
  key: K,
  value: ObsidianTemplateSettings[K],
): ObsidianTemplateSettings {
  const next: ObsidianTemplateSettings = {
    ...settings,
    [key]: value,
    presetId: 'custom',
  };

  const moduleId = OBSIDIAN_TEMPLATE_MODULE_IDS.find((id) => moduleTitleKey(id) === key);
  if (!moduleId || typeof value !== 'string') {
    return next;
  }

  return {
    ...next,
    modules: {
      ...next.modules,
      [moduleId]: {
        ...next.modules[moduleId],
        title: value,
      },
    },
  };
}
