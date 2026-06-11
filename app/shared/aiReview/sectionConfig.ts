import type { ReviewMarkerKey } from './markers';

export enum SectionType {
  Ai = 'ai',
  Deterministic = 'deterministic',
}

export interface SectionConfig {
  markerKey: ReviewMarkerKey;
  title: string;
  type: SectionType;
  prompt: string;
}

export function createDefaultSections(): SectionConfig[] {
  return [
    {
      markerKey: 'REVIEW',
      title: '复盘',
      type: SectionType.Ai,
      prompt: '基于今天的工作记录、完成的任务和灵感，总结今天做了什么、有什么收获、可以改进的地方。语气口语、简洁。',
    },
    {
      markerKey: 'TOMORROW',
      title: '明日待办',
      type: SectionType.Deterministic,
      prompt: '根据今天进度，列出明天要完成的事；未完成任务自动结转，AI 仅追加建议。',
    },
    {
      markerKey: 'KNOWLEDGE',
      title: '可复用知识',
      type: SectionType.Ai,
      prompt: '从今天的内容里提炼可复用的经验/结论，给出可沉淀到主题笔记的要点。没有就如实说没有。',
    },
  ];
}

function isObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v && typeof v === 'object' && !Array.isArray(v));
}

/** 用户配置覆盖默认；非法项回落默认。 */
export function normalizeSections(value: unknown): SectionConfig[] {
  if (!Array.isArray(value)) return createDefaultSections();
  const defaults = createDefaultSections();
  const byKey = new Map(defaults.map((s) => [s.markerKey, s]));
  for (const raw of value) {
    if (!isObject(raw)) continue;
    const key = raw.markerKey as ReviewMarkerKey;
    const base = byKey.get(key);
    if (!base) continue;
    byKey.set(key, {
      ...base,
      title: typeof raw.title === 'string' && raw.title.trim() ? raw.title : base.title,
      type: raw.type === SectionType.Deterministic ? SectionType.Deterministic : raw.type === SectionType.Ai ? SectionType.Ai : base.type,
      prompt: typeof raw.prompt === 'string' && raw.prompt.trim() ? raw.prompt : base.prompt,
    });
  }
  return defaults.map((s) => byKey.get(s.markerKey)!);
}

// === New unified block model (added by template hub rewrite) ===

export type RenderType = 'text' | 'list' | 'table' | 'callout' | 'dataview';

export interface CustomBlock {
  id: string;
  name: string;
  aiGenerate: boolean;
  renderType: RenderType;
  prompt: string;
}

export interface FixedBlock {
  id: 'work' | 'inspire' | 'tasks';
  displayName: string;
}

export interface DailyTemplate {
  fixedBlocks: FixedBlock[];
  customBlocks: CustomBlock[];
}

export interface ReportTemplate {
  customBlocks: CustomBlock[];
}

export function createDefaultDailyTemplate(): DailyTemplate {
  return {
    fixedBlocks: [
      { id: 'work', displayName: '今日工作' },
      { id: 'inspire', displayName: '灵感随笔' },
      { id: 'tasks', displayName: '每日任务' },
    ],
    customBlocks: [
      { id: crypto.randomUUID(), name: '复盘', aiGenerate: true, renderType: 'text', prompt: '' },
      { id: crypto.randomUUID(), name: '明日待办', aiGenerate: true, renderType: 'list', prompt: '' },
      { id: crypto.randomUUID(), name: '可复用知识', aiGenerate: true, renderType: 'text', prompt: '' },
    ],
  };
}

export function createDefaultReportTemplate(
  kind: 'personalWeekly' | 'personalMonthly' | 'externalWeekly' | 'externalMonthly'
): ReportTemplate {
  if (kind === 'personalWeekly') {
    return {
      customBlocks: [
        { id: crypto.randomUUID(), name: '本周工作总结', aiGenerate: true, renderType: 'text', prompt: '请用口语化、亲切的语气总结本周工作。' },
        { id: crypto.randomUUID(), name: '本周完成任务', aiGenerate: true, renderType: 'table', prompt: '' },
        { id: crypto.randomUUID(), name: '本周灵感汇总', aiGenerate: true, renderType: 'callout', prompt: '请用 Obsidian Callout 突出显示。' },
        { id: crypto.randomUUID(), name: '下周计划', aiGenerate: true, renderType: 'list', prompt: '' },
      ],
    };
  }
  if (kind === 'personalMonthly') {
    return {
      customBlocks: [
        { id: crypto.randomUUID(), name: '本月工作总结', aiGenerate: true, renderType: 'text', prompt: '请用口语化总结。' },
        { id: crypto.randomUUID(), name: '本月完成任务', aiGenerate: true, renderType: 'table', prompt: '' },
        { id: crypto.randomUUID(), name: '本月灵感汇总', aiGenerate: true, renderType: 'callout', prompt: '' },
        { id: crypto.randomUUID(), name: '本月复盘', aiGenerate: true, renderType: 'text', prompt: '' },
        { id: crypto.randomUUID(), name: '下月计划', aiGenerate: true, renderType: 'list', prompt: '' },
      ],
    };
  }
  if (kind === 'externalWeekly') {
    return {
      customBlocks: [
        { id: crypto.randomUUID(), name: '本周工作概览', aiGenerate: true, renderType: 'text', prompt: '请用正式书面语,不要包含个人情绪。' },
        { id: crypto.randomUUID(), name: '关键交付', aiGenerate: true, renderType: 'table', prompt: '' },
        { id: crypto.randomUUID(), name: '下周计划', aiGenerate: true, renderType: 'list', prompt: '' },
      ],
    };
  }
  // externalMonthly
  return {
    customBlocks: [
      { id: crypto.randomUUID(), name: '本月工作概览', aiGenerate: true, renderType: 'text', prompt: '请用正式书面语。' },
      { id: crypto.randomUUID(), name: '关键交付', aiGenerate: true, renderType: 'table', prompt: '' },
      { id: crypto.randomUUID(), name: '下月计划', aiGenerate: true, renderType: 'list', prompt: '' },
    ],
  };
}

export function normalizeDailyTemplate(value: unknown): DailyTemplate {
  const defaults = createDefaultDailyTemplate();
  if (!value || typeof value !== 'object') return defaults;
  const v = value as Partial<DailyTemplate>;
  return {
    fixedBlocks: Array.isArray(v.fixedBlocks) && v.fixedBlocks.length === 3
      ? v.fixedBlocks.map((b, i) => ({
          id: defaults.fixedBlocks[i].id,
          displayName: typeof (b as any)?.displayName === 'string' ? (b as any).displayName : defaults.fixedBlocks[i].displayName,
        }))
      : defaults.fixedBlocks,
    customBlocks: Array.isArray(v.customBlocks) && v.customBlocks.length > 0
      ? v.customBlocks.map((b) => normalizeCustomBlock(b, defaults))
      : defaults.customBlocks,
  };
}

export function normalizeReportTemplate(
  value: unknown,
  kind: 'personalWeekly' | 'personalMonthly' | 'externalWeekly' | 'externalMonthly'
): ReportTemplate {
  const defaults = createDefaultReportTemplate(kind);
  if (!value || typeof value !== 'object') return defaults;
  const v = value as Partial<ReportTemplate>;
  return {
    customBlocks: Array.isArray(v.customBlocks) && v.customBlocks.length > 0
      ? v.customBlocks.map((b) => normalizeCustomBlock(b, defaults))
      : defaults.customBlocks,
  };
}

function normalizeCustomBlock(b: any, defaults: { customBlocks: CustomBlock[] }): CustomBlock {
  const fallback = defaults.customBlocks[0];
  if (!b || typeof b !== 'object') return { ...fallback, id: crypto.randomUUID() };
  return {
    id: typeof b.id === 'string' ? b.id : crypto.randomUUID(),
    name: typeof b.name === 'string' ? b.name : fallback.name,
    aiGenerate: typeof b.aiGenerate === 'boolean' ? b.aiGenerate : true,
    renderType: ['text', 'list', 'table', 'callout', 'dataview'].includes(b.renderType) ? b.renderType : 'text',
    prompt: typeof b.prompt === 'string' ? b.prompt : '',
  };
}
