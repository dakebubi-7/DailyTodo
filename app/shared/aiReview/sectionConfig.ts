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
