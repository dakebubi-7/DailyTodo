import type {
  ObsidianTemplateModules,
  ObsidianTemplatePresetId,
} from './obsidianTemplateCenter';
import { OBSIDIAN_TEMPLATE_MODULE_IDS } from './obsidianTemplateCenter';
import { isObjectRecord } from './unknownValueGuards';

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

export type ObsidianTemplateRecognitionResult =
  | { ok: true; draft: RecognizedObsidianTemplateDraft }
  | { ok: false; error: string; draft: null };

export interface TemplatePickerResult {
  ok: boolean;
  text?: string;
  fileName?: string;
  error?: string;
  canceled?: boolean;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isObsidianTemplatePresetId(value: unknown): value is ObsidianTemplatePresetId {
  return value === 'simple' || value === 'work-review' || value === 'knowledge' || value === 'custom';
}

function isRecognizedUnmappedSection(value: unknown): value is RecognizedUnmappedSection {
  return (
    isObjectRecord(value) &&
    typeof value.title === 'string' &&
    typeof value.reason === 'string' &&
    typeof value.excerpt === 'string'
  );
}

function isObsidianTemplateModuleSettings(value: unknown): value is { enabled: boolean; title: string } {
  return isObjectRecord(value) && typeof value.enabled === 'boolean' && typeof value.title === 'string';
}

function isObsidianTemplateModules(value: unknown): value is ObsidianTemplateModules {
  return isObjectRecord(value) && OBSIDIAN_TEMPLATE_MODULE_IDS.every((moduleId) => isObsidianTemplateModuleSettings(value[moduleId]));
}

function hasOptionalString(value: Record<string, unknown>, key: string) {
  return value[key] === undefined || typeof value[key] === 'string';
}

function isRecognizedObsidianTemplateDraft(value: unknown): value is RecognizedObsidianTemplateDraft {
  return (
    isObjectRecord(value) &&
    isObsidianTemplatePresetId(value.presetId) &&
    hasOptionalString(value, 'dailyNotePath') &&
    hasOptionalString(value, 'dailyMarkdownTemplate') &&
    hasOptionalString(value, 'taskLineTemplate') &&
    hasOptionalString(value, 'completionReviewTemplate') &&
    isStringArray(value.missingCoreFields) &&
    isObsidianTemplateModules(value.modules) &&
    Array.isArray(value.unmappedSections) &&
    value.unmappedSections.every(isRecognizedUnmappedSection) &&
    isStringArray(value.notes) &&
    typeof value.unmatched === 'boolean'
  );
}

export function readObsidianTemplateRecognitionResult(value: unknown): ObsidianTemplateRecognitionResult | undefined {
  if (!isObjectRecord(value) || typeof value.ok !== 'boolean') return undefined;

  if (value.ok) {
    return isRecognizedObsidianTemplateDraft(value.draft) ? { ok: true, draft: value.draft } : undefined;
  }

  if (value.error !== undefined && typeof value.error !== 'string') return undefined;
  if (value.draft !== undefined && value.draft !== null) return undefined;
  return { ok: false, error: typeof value.error === 'string' ? value.error : '', draft: null };
}

export function readTemplatePickerResult(value: unknown): TemplatePickerResult | undefined {
  if (!isObjectRecord(value) || typeof value.ok !== 'boolean') return undefined;
  if (value.text !== undefined && typeof value.text !== 'string') return undefined;
  if (value.fileName !== undefined && typeof value.fileName !== 'string') return undefined;
  if (value.error !== undefined && typeof value.error !== 'string') return undefined;
  if (value.canceled !== undefined && typeof value.canceled !== 'boolean') return undefined;

  const result: TemplatePickerResult = { ok: value.ok };
  if (typeof value.text === 'string') result.text = value.text;
  if (typeof value.fileName === 'string') result.fileName = value.fileName;
  if (typeof value.error === 'string') result.error = value.error;
  if (typeof value.canceled === 'boolean') result.canceled = value.canceled;
  return result;
}
