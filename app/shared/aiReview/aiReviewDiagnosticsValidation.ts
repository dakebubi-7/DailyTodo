import type {
  AiReviewProgressEvent,
  AiReviewProfileDiagnostic,
  AiReviewRunDiagnostic,
  AiReviewStageDiagnostic,
  AiReviewTokenUsage,
} from './runDiagnostics';
import { isObjectRecord } from '../unknownValueGuards';

const AI_REVIEW_PROGRESS_STATUSES = new Set(['running', 'completed', 'failed', 'warning']);
const AI_REVIEW_PROGRESS_REPORT_KINDS = new Set(['daily', 'weekly', 'monthly']);
const AI_REVIEW_PROGRESS_STAGE_KEYS = new Set([
  'inspectDaily',
  'prepareMaterials',
  'buildPrompt',
  'requestAi',
  'receiveResult',
  'writeObsidian',
  'confirmResult',
]);
const AI_REVIEW_FINAL_STATUSES = new Set([
  'completed',
  'completedWithWarning',
  'generatedButNotWritten',
  'providerFailed',
  'contentInvalid',
  'writeFailed',
  'noSourceMaterials',
  'accountUnavailable',
]);
const AI_REVIEW_STAGE_STATUSES = new Set(['pending', 'running', 'completed', 'failed', 'skipped', 'warning']);
const AI_REVIEW_TOKEN_SOURCES = new Set(['openai', 'anthropic', 'gemini', 'missing']);
const AI_REVIEW_PROFILE_SOURCES = new Set(['specific', 'default', 'fallbackDefault', 'missing']);

function isOptionalString(value: unknown) {
  return value === undefined || typeof value === 'string';
}

function isOptionalFiniteNumber(value: unknown) {
  return value === undefined || (typeof value === 'number' && Number.isFinite(value));
}

function isOptionalBoolean(value: unknown) {
  return value === undefined || typeof value === 'boolean';
}

function isAiReviewTokenUsage(value: unknown): value is AiReviewTokenUsage {
  if (!isObjectRecord(value)) return false;
  return (
    AI_REVIEW_TOKEN_SOURCES.has(String(value.source)) &&
    isOptionalFiniteNumber(value.promptTokens) &&
    isOptionalFiniteNumber(value.completionTokens) &&
    isOptionalFiniteNumber(value.totalTokens)
  );
}

function isAiReviewProfileDiagnostic(value: unknown): value is AiReviewProfileDiagnostic {
  if (!isObjectRecord(value)) return false;
  return (
    isOptionalString(value.profileId) &&
    isOptionalString(value.profileName) &&
    (value.profileSource === undefined || AI_REVIEW_PROFILE_SOURCES.has(String(value.profileSource))) &&
    typeof value.provider === 'string' &&
    typeof value.model === 'string' &&
    isOptionalString(value.baseUrlHost)
  );
}

function isAiReviewStageDiagnostic(value: unknown): value is AiReviewStageDiagnostic {
  if (!isObjectRecord(value)) return false;
  return (
    AI_REVIEW_PROGRESS_STAGE_KEYS.has(String(value.key)) &&
    typeof value.label === 'string' &&
    AI_REVIEW_STAGE_STATUSES.has(String(value.status)) &&
    isOptionalString(value.startedAt) &&
    isOptionalString(value.finishedAt) &&
    isOptionalFiniteNumber(value.durationMs) &&
    isOptionalString(value.message)
  );
}

export function isAiReviewProgressEvent(value: unknown): value is AiReviewProgressEvent {
  if (!isObjectRecord(value)) return false;
  if (!AI_REVIEW_PROGRESS_REPORT_KINDS.has(String(value.reportKind))) return false;
  if (!AI_REVIEW_PROGRESS_STAGE_KEYS.has(String(value.stageKey))) return false;
  if (typeof value.label !== 'string') return false;
  if (!AI_REVIEW_PROGRESS_STATUSES.has(String(value.status))) return false;
  if (value.message !== undefined && typeof value.message !== 'string') return false;
  return typeof value.at === 'string';
}

export function isAiReviewRunDiagnostic(value: unknown): value is AiReviewRunDiagnostic {
  if (!isObjectRecord(value)) return false;
  return (
    typeof value.runId === 'string' &&
    AI_REVIEW_PROGRESS_REPORT_KINDS.has(String(value.reportKind)) &&
    typeof value.startedAt === 'string' &&
    isOptionalString(value.finishedAt) &&
    isOptionalFiniteNumber(value.durationMs) &&
    AI_REVIEW_FINAL_STATUSES.has(String(value.finalStatus)) &&
    isAiReviewProfileDiagnostic(value.profile) &&
    Array.isArray(value.stages) &&
    value.stages.every(isAiReviewStageDiagnostic) &&
    (value.usage === undefined || isAiReviewTokenUsage(value.usage)) &&
    isOptionalBoolean(value.truncated) &&
    isOptionalFiniteNumber(value.outputChars) &&
    isOptionalFiniteNumber(value.sourceChars) &&
    isOptionalString(value.error) &&
    isOptionalString(value.warning)
  );
}

export function readAiReviewRunDiagnostic(result: unknown): AiReviewRunDiagnostic | undefined {
  if (!isObjectRecord(result) || !('diagnostic' in result)) return undefined;
  return isAiReviewRunDiagnostic(result.diagnostic) ? result.diagnostic : undefined;
}
