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

export type RenderType = 'text' | 'list' | 'table' | 'callout' | 'dataview';
export type FixedBlockId = 'work' | 'inspire' | 'tasks';

export interface CustomBlock {
  id: string;
  name: string;
  aiGenerate: boolean;
  renderType: RenderType;
  prompt: string;
}

export interface FixedBlock {
  id: FixedBlockId;
  displayName: string;
}

export type DailyBlockOrderItem =
  | { type: 'fixed'; id: FixedBlockId }
  | { type: 'custom'; id: string };

export interface DailyTemplate {
  fixedBlocks: FixedBlock[];
  customBlocks: CustomBlock[];
  blockOrder: DailyBlockOrderItem[];
}

export interface ReportTemplate {
  customBlocks: CustomBlock[];
}

export function createDefaultDailyTemplate(): DailyTemplate {
  const fixedBlocks: FixedBlock[] = [
    { id: 'work', displayName: '今日工作' },
    { id: 'inspire', displayName: '灵感随笔' },
    { id: 'tasks', displayName: '每日任务' },
  ];
  const customBlocks: CustomBlock[] = [
    { id: crypto.randomUUID(), name: '复盘', aiGenerate: true, renderType: 'text', prompt: '' },
    { id: crypto.randomUUID(), name: '明日待办', aiGenerate: true, renderType: 'list', prompt: '' },
    { id: crypto.randomUUID(), name: '可复用知识', aiGenerate: true, renderType: 'text', prompt: '' },
  ];
  return {
    fixedBlocks,
    customBlocks,
    blockOrder: createDailyBlockOrder(fixedBlocks, customBlocks),
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
  return {
    customBlocks: [
      { id: crypto.randomUUID(), name: '本月工作概览', aiGenerate: true, renderType: 'text', prompt: '请用正式书面语。' },
      { id: crypto.randomUUID(), name: '关键交付', aiGenerate: true, renderType: 'table', prompt: '' },
      { id: crypto.randomUUID(), name: '下月计划', aiGenerate: true, renderType: 'list', prompt: '' },
    ],
  };
}

export function createDailyBlockOrder(fixedBlocks: FixedBlock[], customBlocks: CustomBlock[]): DailyBlockOrderItem[] {
  return [
    ...fixedBlocks.map((block) => ({ type: 'fixed' as const, id: block.id })),
    ...customBlocks.map((block) => ({ type: 'custom' as const, id: block.id })),
  ];
}

export function getDailyBlockOrder(template: DailyTemplate): DailyBlockOrderItem[] {
  return normalizeDailyBlockOrder(template.blockOrder, template.fixedBlocks, template.customBlocks);
}

export function normalizeDailyTemplate(value: unknown): DailyTemplate {
  const defaults = createDefaultDailyTemplate();
  if (!value || typeof value !== 'object') return defaults;
  const v = value as Partial<DailyTemplate>;
  const fixedBlocks = normalizeFixedBlocks((v as any).fixedBlocks, defaults.fixedBlocks);
  const customBlocks = Array.isArray(v.customBlocks) && v.customBlocks.length > 0
    ? v.customBlocks.map((b) => normalizeCustomBlock(b, defaults))
    : defaults.customBlocks;

  return {
    fixedBlocks,
    customBlocks,
    blockOrder: normalizeDailyBlockOrder((v as any).blockOrder, fixedBlocks, customBlocks),
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

function normalizeFixedBlocks(value: unknown, defaults: FixedBlock[]): FixedBlock[] {
  if (!Array.isArray(value)) return defaults;
  const byDefault = new Map(defaults.map((block) => [block.id, block]));
  const seen = new Set<FixedBlockId>();
  const blocks: FixedBlock[] = [];

  value.forEach((raw, index) => {
    if (!raw || typeof raw !== 'object') return;
    const candidate = (raw as Partial<FixedBlock>).id;
    const id = candidate === 'work' || candidate === 'inspire' || candidate === 'tasks'
      ? candidate
      : defaults[index]?.id;
    if (!id || seen.has(id)) return;
    seen.add(id);
    blocks.push({
      id,
      displayName: typeof (raw as any).displayName === 'string' && (raw as any).displayName.trim()
        ? (raw as any).displayName
        : byDefault.get(id)!.displayName,
    });
  });

  defaults.forEach((block) => {
    if (!seen.has(block.id)) blocks.push(block);
  });

  return blocks;
}

function normalizeDailyBlockOrder(value: unknown, fixedBlocks: FixedBlock[], customBlocks: CustomBlock[]): DailyBlockOrderItem[] {
  const fixedIds = new Set(fixedBlocks.map((block) => block.id));
  const customIds = new Set(customBlocks.map((block) => block.id));
  const usedFixed = new Set<FixedBlockId>();
  const usedCustom = new Set<string>();
  const order: DailyBlockOrderItem[] = [];

  if (Array.isArray(value)) {
    value.forEach((raw) => {
      if (!raw || typeof raw !== 'object') return;
      const item = raw as DailyBlockOrderItem;
      if (item.type === 'fixed' && fixedIds.has(item.id) && !usedFixed.has(item.id)) {
        usedFixed.add(item.id);
        order.push({ type: 'fixed', id: item.id });
      }
      if (item.type === 'custom' && customIds.has(item.id) && !usedCustom.has(item.id)) {
        usedCustom.add(item.id);
        order.push({ type: 'custom', id: item.id });
      }
    });
  }

  fixedBlocks.forEach((block) => {
    if (!usedFixed.has(block.id)) order.push({ type: 'fixed', id: block.id });
  });
  customBlocks.forEach((block) => {
    if (!usedCustom.has(block.id)) order.push({ type: 'custom', id: block.id });
  });

  return order;
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
