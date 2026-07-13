import { isObjectRecord } from './unknownValueGuards';

export type ObsidianTemplatePresetId = 'simple' | 'work-review' | 'knowledge' | 'custom';
export type ObsidianTemplateModuleId = 'work' | 'inspiration' | 'tasks' | 'review' | 'tomorrow' | 'knowledge';

export interface ObsidianTemplateModuleSettings {
  enabled: boolean;
  title: string;
}

export type ObsidianTemplateModules = Record<ObsidianTemplateModuleId, ObsidianTemplateModuleSettings>;

export interface ObsidianTemplatePreset {
  id: Exclude<ObsidianTemplatePresetId, 'custom'>;
  label: { zh: string; en: string };
  description: { zh: string; en: string };
  modules: ObsidianTemplateModules;
}

export const OBSIDIAN_TEMPLATE_MODULE_IDS: ObsidianTemplateModuleId[] = [
  'work', 'inspiration', 'tasks', 'review', 'tomorrow', 'knowledge',
];

export const OBSIDIAN_TEMPLATE_MODULE_LABELS: Record<ObsidianTemplateModuleId, { zh: string; en: string }> = {
  work: { zh: '\u5de5\u4f5c', en: 'Work' },
  inspiration: { zh: '\u7075\u611f', en: 'Inspiration' },
  tasks: { zh: '\u4efb\u52a1', en: 'Tasks' },
  review: { zh: '\u590d\u76d8', en: 'Review' },
  tomorrow: { zh: '\u660e\u65e5\u5f85\u529e', en: 'Tomorrow' },
  knowledge: { zh: '\u53ef\u590d\u7528\u77e5\u8bc6', en: 'Reusable knowledge' },
};

export const DEFAULT_TASK_LINE_TEMPLATE = '- [{{checked}}] {{text}} #{{priority}}{{dateNote}}';
export const DEFAULT_COMPLETION_REVIEW_TEMPLATE = [
  '  - \u9636\u6bb5\u8bb0\u5f55 {{index}}\uff1a{{status}}\uff0c\u5b8c\u6210\u5ea6 {{percent}}%\uff0c\u8bb0\u5f55\u65f6\u95f4 {{reviewedAt}}',
  '    - \u4eca\u5929\u60c5\u51b5\uff1a{{summary}}',
  '    - \u8fd8\u6ca1\u61c2\u7684\u5361\u70b9\uff1a{{unknowns}}',
  '    - \u4e0b\u4e00\u6b65\uff1a{{nextStep}}',
].join('\n');

export function createDefaultModules(): ObsidianTemplateModules {
  return {
    work: { enabled: true, title: '\u4eca\u65e5\u5de5\u4f5c' }, inspiration: { enabled: true, title: '\u7075\u611f\u968f\u7b14' },
    tasks: { enabled: true, title: '\u6bcf\u65e5\u4efb\u52a1' }, review: { enabled: true, title: '\u590d\u76d8' },
    tomorrow: { enabled: true, title: '\u660e\u65e5\u5f85\u529e' }, knowledge: { enabled: true, title: '\u53ef\u590d\u7528\u77e5\u8bc6' },
  };
}

export const OBSIDIAN_TEMPLATE_PRESETS: ObsidianTemplatePreset[] = [
  {
    id: 'simple', label: { zh: '\u7b80\u6d01\u65e5\u8bb0', en: 'Simple daily note' },
    description: { zh: '\u4fdd\u7559\u5de5\u4f5c\u3001\u4efb\u52a1\u548c\u590d\u76d8\u7684\u9ed8\u8ba4\u7ed3\u6784\u3002', en: 'Keep the default work, task, and review sections.' },
    modules: createDefaultModules(),
  },
  {
    id: 'work-review', label: { zh: '\u5de5\u4f5c\u590d\u76d8', en: 'Work review' },
    description: { zh: '\u7a81\u51fa\u4eca\u65e5\u63a8\u8fdb\u3001\u4efb\u52a1\u5b8c\u6210\u8bb0\u5f55\u3001\u590d\u76d8\u548c\u660e\u65e5\u5f85\u529e\u3002', en: 'Focus on progress, task completion, review, and tomorrow planning.' },
    modules: { ...createDefaultModules(), work: { enabled: true, title: '\u4eca\u65e5\u63a8\u8fdb' }, tasks: { enabled: true, title: '\u4efb\u52a1\u4e0e\u5b8c\u6210\u8bb0\u5f55' }, knowledge: { enabled: false, title: '\u53ef\u590d\u7528\u77e5\u8bc6' } },
  },
  {
    id: 'knowledge', label: { zh: '\u77e5\u8bc6\u6c89\u6dc0', en: 'Knowledge capture' },
    description: { zh: '\u805a\u7126\u7075\u611f\u3001\u4efb\u52a1\u3001\u590d\u76d8\u548c\u53ef\u590d\u7528\u77e5\u8bc6\u6c89\u6dc0\u3002', en: 'Focus on inspiration, tasks, review, and reusable knowledge.' },
    modules: { ...createDefaultModules(), tomorrow: { enabled: false, title: '\u660e\u65e5\u5f85\u529e' } },
  },
];

export function getObsidianTemplatePreset(id: unknown): ObsidianTemplatePreset {
  return OBSIDIAN_TEMPLATE_PRESETS.find((preset) => preset.id === id) ?? OBSIDIAN_TEMPLATE_PRESETS[0];
}

export function normalizeTemplatePresetId(value: unknown): ObsidianTemplatePresetId {
  return value === 'work-review' || value === 'knowledge' || value === 'custom' ? value : 'simple';
}

function text(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

export function normalizeTemplateModules(value: unknown): ObsidianTemplateModules {
  const defaults = createDefaultModules();
  const rawModules = isObjectRecord(value) ? value : {};
  const modules = createDefaultModules();
  for (const moduleId of OBSIDIAN_TEMPLATE_MODULE_IDS) {
    const defaultModule = defaults[moduleId];
    const rawModule = rawModules[moduleId];
    modules[moduleId] = {
      enabled: isObjectRecord(rawModule) && typeof rawModule.enabled === 'boolean' ? rawModule.enabled : defaultModule.enabled,
      title: isObjectRecord(rawModule) ? text(rawModule.title, defaultModule.title) : defaultModule.title,
    };
  }
  return modules;
}
