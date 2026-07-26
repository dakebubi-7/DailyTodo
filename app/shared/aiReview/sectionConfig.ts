import { REVIEW_MARKER_KEYS, type ReviewMarkerKey } from './markers';
import { isObjectRecord } from '../unknownValueGuards';
import {
  normalizeDailyBlockOrderValue,
  normalizeDailyTemplateValue,
  normalizeReportTemplateValue,
} from './sectionConfigNormalization';
import {
  createDefaultDailyTemplate,
  createDefaultReportTemplate,
} from './sectionConfigDefaultTemplates';

export {
  createDailyBlockOrder,
  createDefaultDailyTemplate,
  createDefaultReportTemplate,
} from './sectionConfigDefaultTemplates';

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

export function isReviewMarkerKey(value: unknown): value is ReviewMarkerKey {
  return REVIEW_MARKER_KEYS.some((key) => key === value);
}

export function normalizeSections(value: unknown): SectionConfig[] {
  if (!Array.isArray(value)) return createDefaultSections();
  const defaults = createDefaultSections();
  const byKey = new Map(defaults.map((s) => [s.markerKey, s]));
  for (const raw of value) {
    if (!isObjectRecord(raw)) continue;
    const key = raw.markerKey;
    if (!isReviewMarkerKey(key)) continue;
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

export type CustomBlockContentSource = 'ai' | 'tomorrowProjection';

export const RENDER_TYPES = ['text', 'list', 'table', 'callout', 'dataview'] as const satisfies readonly RenderType[];

export function isRenderType(value: unknown): value is RenderType {
  return RENDER_TYPES.some((type) => type === value);
}
export type FixedBlockId = 'work' | 'inspire' | 'tasks';

function isFixedBlockId(value: unknown): value is FixedBlockId {
  return value === 'work' || value === 'inspire' || value === 'tasks';
}

export interface CustomBlock {
  id: string;
  name: string;
  aiGenerate: boolean;
  renderType: RenderType;
  prompt: string;
  contentSource?: CustomBlockContentSource;
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

export function getDailyBlockOrder(template: DailyTemplate): DailyBlockOrderItem[] {
  return normalizeDailyBlockOrderValue(template.blockOrder, template.fixedBlocks, template.customBlocks, isFixedBlockId);
}

export function normalizeDailyTemplate(value: unknown): DailyTemplate {
  const defaults = createDefaultDailyTemplate();
  return normalizeDailyTemplateValue(value, defaults, {
    isFixedBlockId,
    isRenderType,
  });
}

export function normalizeReportTemplate(
  value: unknown,
  kind: 'personalWeekly' | 'personalMonthly' | 'externalWeekly' | 'externalMonthly'
): ReportTemplate {
  const defaults = createDefaultReportTemplate(kind);
  return normalizeReportTemplateValue(value, defaults, isRenderType);
}
