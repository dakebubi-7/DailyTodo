import type { SectionConfig, SectionType } from './sectionConfig';
import type { ChatMessage } from '../llm/openaiClient';

export interface RecognizedSection {
  markerKey: 'REVIEW' | 'TOMORROW' | 'KNOWLEDGE';
  title: string;
  type: 'ai' | 'deterministic';
}

export function buildRecognizeMessages(rawTemplate: string): ChatMessage[] {
  return [
    {
      role: 'system',
      content:
        '用户给出一段日计划模板。你判断哪些段落对应「复盘」「明日待办」「可复用知识」，并输出一个 JSON 对象。格式：{"sections":[{"markerKey":"REVIEW"|"TOMORROW"|"KNOWLEDGE","title":"标题","type":"ai"|"deterministic"}]}。即便不完全确定也要把三段的猜测都列出来，然后额外加一个字段 "confidence": "high"|"medium"|"low"。只输出 JSON，不加围栏。如果完全认不出，confidence 必须为 low。',
    },
    { role: 'user', content: rawTemplate.trim() || '（空模板）' },
  ];
}

export function parseRecognizedSections(raw: string, fallback: SectionConfig[]): { sections: SectionConfig[]; confidence: 'high' | 'medium' | 'low'; unmatched: boolean } {
  let json: unknown;
  try {
    // 容忍围栏
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
    json = JSON.parse(cleaned.trim());
  } catch {
    return { sections: fallback, confidence: 'low', unmatched: true };
  }
  if (!json || typeof json !== 'object' || !Array.isArray((json as Record<string, unknown>).sections)) {
    return { sections: fallback, confidence: 'low', unmatched: true };
  }
  const arr = (json as Record<string, unknown>).sections as Array<Record<string, unknown>>;
  const confidence = (json as Record<string, unknown>).confidence === 'high' || (json as Record<string, unknown>).confidence === 'medium' ? (json as Record<string, unknown>).confidence as 'high' | 'medium' : 'low';
  const knownKeys = new Set(['REVIEW', 'TOMORROW', 'KNOWLEDGE']);
  const sections: SectionConfig[] = arr.map((raw, i) => ({
    markerKey: knownKeys.has(String(raw.markerKey)) ? (raw.markerKey as 'REVIEW' | 'TOMORROW' | 'KNOWLEDGE') : fallback[i]?.markerKey ?? 'REVIEW',
    title: typeof raw.title === 'string' && raw.title.trim() ? raw.title : fallback[i]?.title ?? '未命名',
    type: raw.type === 'deterministic' ? 'deterministic' as SectionType : 'ai' as SectionType,
    prompt: fallback[i]?.prompt ?? '',
  }));
  return { sections, confidence, unmatched: confidence === 'low' && sections.length < 1 };
}
