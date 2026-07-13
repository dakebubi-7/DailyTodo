import {
  readBackfillReport,
  readDailyInspection,
  readGenerationResult,
} from './aiReviewIpcResultReaders';
export {
  isAiReviewProgressEvent,
  isAiReviewRunDiagnostic,
  readAiReviewRunDiagnostic,
} from './aiReviewDiagnosticsValidation';

export type AiReviewRunReportKind = 'daily' | 'weekly' | 'monthly';

export type AiReviewRunFinalStatus =
  | 'completed'
  | 'completedWithWarning'
  | 'generatedButNotWritten'
  | 'providerFailed'
  | 'contentInvalid'
  | 'writeFailed'
  | 'noSourceMaterials'
  | 'accountUnavailable';

export interface AiReviewTokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  source: 'openai' | 'anthropic' | 'gemini' | 'missing';
}

export interface AiReviewProfileDiagnostic {
  profileId?: string;
  profileName?: string;
  profileSource?: 'specific' | 'default' | 'fallbackDefault' | 'missing';
  provider: string;
  model: string;
  baseUrlHost?: string;
}

export type AiReviewStageKey =
  | 'inspectDaily'
  | 'prepareMaterials'
  | 'buildPrompt'
  | 'requestAi'
  | 'receiveResult'
  | 'writeObsidian'
  | 'confirmResult';

export interface AiReviewStageDiagnostic {
  key: AiReviewStageKey;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'warning';
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  message?: string;
}

export interface AiReviewRunDiagnostic {
  runId: string;
  reportKind: AiReviewRunReportKind;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  finalStatus: AiReviewRunFinalStatus;
  profile: AiReviewProfileDiagnostic;
  stages: AiReviewStageDiagnostic[];
  usage?: AiReviewTokenUsage;
  truncated?: boolean;
  outputChars?: number;
  sourceChars?: number;
  error?: string;
  warning?: string;
}

export interface AiReviewProgressEvent {
  reportKind: AiReviewRunReportKind;
  stageKey: AiReviewStageKey;
  label: string;
  status: 'running' | 'completed' | 'failed' | 'warning';
  message?: string;
  at: string;
}

export function safeBaseUrlHost(baseUrl: string): string | undefined {
  try {
    return new URL(baseUrl).host;
  } catch {
    return undefined;
  }
}

export function mergeTokenUsage(items: Array<AiReviewTokenUsage | undefined>): AiReviewTokenUsage | undefined {
  let hasUsage = false;
  let source: AiReviewTokenUsage['source'] | undefined;
  let promptTokens: number | undefined;
  let completionTokens: number | undefined;
  let totalTokens: number | undefined;

  for (const item of items) {
    if (!item) continue;
    hasUsage = true;
    if (item.source === 'missing') continue;
    source ??= item.source;
    if (typeof item.promptTokens === 'number') promptTokens = (promptTokens ?? 0) + item.promptTokens;
    if (typeof item.completionTokens === 'number') completionTokens = (completionTokens ?? 0) + item.completionTokens;
    if (typeof item.totalTokens === 'number') totalTokens = (totalTokens ?? 0) + item.totalTokens;
  }

  if (!hasUsage) return undefined;
  if (!source) return { source: 'missing' };
  return {
    source,
    promptTokens,
    completionTokens,
    totalTokens,
  };
}

export interface AiReviewGenerationResult {
  ok: boolean;
  error?: string;
  filePath?: string;
  truncated?: boolean;
  filledMarkers?: string[];
  skippedMarkers?: string[];
}

export interface AiReviewDailyInspection {
  exists: boolean;
  hasAiContent: boolean;
  filePath: string;
  error?: string;
}

export function readAiReviewGenerationResult(value: unknown): AiReviewGenerationResult | undefined {
  return readGenerationResult(value);
}

export function readAiReviewDailyInspection(value: unknown): AiReviewDailyInspection | undefined {
  return readDailyInspection(value);
}

export interface AiReviewBackfillReport {
  processed: string[];
  filled: string[];
  errors: Array<{ date: string; error: string }>;
}

export function readAiReviewBackfillReport(value: unknown): AiReviewBackfillReport | undefined {
  return readBackfillReport(value);
}
