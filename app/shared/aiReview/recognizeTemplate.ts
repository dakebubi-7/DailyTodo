import { isReviewMarkerKey, SectionType, type SectionConfig } from './sectionConfig';
import type { ChatMessage } from '../llm/openaiClient';
import { isObjectRecord } from '../unknownValueGuards';

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
  if (!isObjectRecord(json) || !Array.isArray(json.sections)) {
    return { sections: fallback, confidence: 'low', unmatched: true };
  }
  const arr = json.sections;
  if (!arr.every(isObjectRecord)) {
    return { sections: fallback, confidence: 'low', unmatched: true };
  }
  const confidence = isRecognizeConfidence(json.confidence) ? json.confidence : 'low';
  const sections: SectionConfig[] = arr.map((raw, i) => ({
    markerKey: isReviewMarkerKey(raw.markerKey) ? raw.markerKey : fallback[i]?.markerKey ?? 'REVIEW',
    title: typeof raw.title === 'string' && raw.title.trim() ? raw.title : fallback[i]?.title ?? '未命名',
    type: raw.type === SectionType.Deterministic ? SectionType.Deterministic : SectionType.Ai,
    prompt: fallback[i]?.prompt ?? '',
  }));
  return { sections, confidence, unmatched: confidence === 'low' && sections.length < 1 };
}

function isRecognizeConfidence(value: unknown): value is 'high' | 'medium' | 'low' {
  return value === 'high' || value === 'medium' || value === 'low';
}

function isSectionConfigLike(value: unknown): value is SectionConfig {
  if (!isObjectRecord(value)) return false;
  return (
    typeof value.markerKey === 'string' &&
    typeof value.title === 'string' &&
    (value.type === 'ai' || value.type === 'deterministic') &&
    typeof value.prompt === 'string'
  );
}

export interface AiReviewRecognizeTemplateResult {
  ok: boolean;
  error?: string;
  sections: SectionConfig[];
  confidence?: 'high' | 'medium' | 'low';
  unmatched?: boolean;
}

export function readAiReviewRecognizeTemplateResult(value: unknown): AiReviewRecognizeTemplateResult | undefined {
  if (!isObjectRecord(value) || typeof value.ok !== 'boolean') return undefined;
  if (value.error !== undefined && typeof value.error !== 'string') return undefined;
  if (!Array.isArray(value.sections) || !value.sections.every(isSectionConfigLike)) return undefined;
  if (
    value.confidence !== undefined &&
    value.confidence !== 'high' &&
    value.confidence !== 'medium' &&
    value.confidence !== 'low'
  ) {
    return undefined;
  }
  if (value.unmatched !== undefined && typeof value.unmatched !== 'boolean') return undefined;
  const result: AiReviewRecognizeTemplateResult = {
    ok: value.ok,
    sections: value.sections,
  };
  if (typeof value.error === 'string') result.error = value.error;
  if (value.confidence === 'high' || value.confidence === 'medium' || value.confidence === 'low') {
    result.confidence = value.confidence;
  }
  if (typeof value.unmatched === 'boolean') result.unmatched = value.unmatched;
  return result;
}
