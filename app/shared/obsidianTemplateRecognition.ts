import type { ChatMessage } from './llm/openaiClient';
import {
  OBSIDIAN_TEMPLATE_MODULE_IDS,
  createDefaultModules,
  normalizeTemplateModules,
  normalizeTemplatePresetId,
  type ObsidianTemplateModules,
  type ObsidianTemplatePresetId,
} from './obsidianTemplateCenter';
import { missingDailyCoreTokens } from './dailyMarkdownTemplate';

export const MAX_OBSIDIAN_TEMPLATE_RECOGNITION_CHARS = 20_000;

export interface RecognizedUnmappedSection {
  title: string;
  reason: string;
  excerpt: string;
}

export interface RecognizedObsidianTemplateDraft {
  presetId: ObsidianTemplatePresetId;
  dailyNotePath?: string;
  dailyMarkdownTemplate?: string;
  missingCoreFields: string[];
  modules: ObsidianTemplateModules;
  taskLineTemplate?: string;
  completionReviewTemplate?: string;
  unmappedSections: RecognizedUnmappedSection[];
  notes: string[];
  unmatched: boolean;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function cleanJson(raw: string) {
  return raw
    .replace(/^```(?:json|markdown|md)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}

function text(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function optionalText(value: unknown) {
  const trimmed = text(value);
  return trimmed || undefined;
}

function textArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => text(item)).filter(Boolean)
    : [];
}

function unmappedSections(value: unknown): RecognizedUnmappedSection[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!isObject(item)) return null;
      const title = text(item.title) || '未命名片段';
      const reason = text(item.reason) || '无法可靠映射到 DailyTodo 模块';
      const excerpt = text(item.excerpt).slice(0, 500);
      return { title, reason, excerpt };
    })
    .filter((item): item is RecognizedUnmappedSection => item !== null);
}

function fallbackDraft(unmatched = true): RecognizedObsidianTemplateDraft {
  return {
    presetId: 'simple',
    modules: createDefaultModules(),
    missingCoreFields: [],
    unmappedSections: [],
    notes: unmatched ? ['未能识别出可靠模板结构，已回落到简洁日记。'] : [],
    unmatched,
  };
}

export function buildRecognizeObsidianTemplateMessages(rawTemplate: string): ChatMessage[] {
  const clipped = rawTemplate.slice(0, MAX_OBSIDIAN_TEMPLATE_RECOGNITION_CHARS);
  return [
    {
      role: 'system',
      content:
        '用户会给出一段 Obsidian 每日记录模板。请识别它适合映射到 DailyTodo 的哪些模块，并只输出 JSON。' +
        'JSON 格式必须是：{"presetId":"simple"|"work-review"|"knowledge"|"custom","dailyNotePath":"可选路径","dailyMarkdownTemplate":"保留用户结构的 Markdown 模板，尽量插入 {{work}} {{inspiration}} {{tasks}} 占位符，可选 {{date}} {{review}} {{tomorrow}} {{knowledge}}","modules":{"work":{"enabled":boolean,"title":"标题"},"inspiration":{"enabled":boolean,"title":"标题"},"tasks":{"enabled":boolean,"title":"标题"},"review":{"enabled":boolean,"title":"标题"},"tomorrow":{"enabled":boolean,"title":"标题"},"knowledge":{"enabled":boolean,"title":"标题"}},"taskLineTemplate":"可选","completionReviewTemplate":"可选","unmappedSections":[{"title":"标题","reason":"原因","excerpt":"片段"}],"notes":["给用户看的简短说明"]}。' +
        '尽量忠于用户原始结构和标题，只在合适的位置插入占位符；无法识别到某个核心内容（今日工作/灵感随笔/每日任务）时不要硬造，留给系统提示用户补充。' +
        '不要输出代码块围栏，不要解释。无法确定的内容放入 unmappedSections，不要硬塞进模块。DailyTodo 支持的模块只有：今日工作、灵感闪念、每日任务、AI 复盘、明日待办、可复用知识。',
    },
    { role: 'user', content: clipped.trim() || '（空模板）' },
  ];
}

export function parseRecognizedObsidianTemplateDraft(raw: string): RecognizedObsidianTemplateDraft {
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanJson(raw));
  } catch {
    return fallbackDraft(true);
  }

  if (!isObject(parsed)) return fallbackDraft(true);

  const modules = normalizeTemplateModules(parsed.modules);
  const hasEnabledModule = OBSIDIAN_TEMPLATE_MODULE_IDS.some((id) => modules[id].enabled);
  if (!hasEnabledModule) return fallbackDraft(true);

  const dailyMarkdownTemplate = optionalText(parsed.dailyMarkdownTemplate);

  return {
    presetId: normalizeTemplatePresetId(parsed.presetId),
    dailyNotePath: optionalText(parsed.dailyNotePath),
    dailyMarkdownTemplate,
    missingCoreFields: dailyMarkdownTemplate ? missingDailyCoreTokens(dailyMarkdownTemplate) : [],
    modules,
    taskLineTemplate: optionalText(parsed.taskLineTemplate),
    completionReviewTemplate: optionalText(parsed.completionReviewTemplate),
    unmappedSections: unmappedSections(parsed.unmappedSections),
    notes: textArray(parsed.notes),
    unmatched: false,
  };
}

export function validateObsidianTemplateRecognitionInput(rawTemplate: unknown) {
  if (typeof rawTemplate !== 'string' || !rawTemplate.trim()) {
    return { ok: false as const, error: '请粘贴你的 Obsidian 模板内容' };
  }
  if (rawTemplate.length > MAX_OBSIDIAN_TEMPLATE_RECOGNITION_CHARS) {
    return {
      ok: false as const,
      error: `模板太长，请控制在 ${MAX_OBSIDIAN_TEMPLATE_RECOGNITION_CHARS} 个字符以内再识别`,
    };
  }
  return { ok: true as const, rawTemplate };
}
