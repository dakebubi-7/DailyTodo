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
  const present = items.filter((item): item is AiReviewTokenUsage => Boolean(item));
  if (!present.length) return undefined;
  const usable = present.filter((item) => item.source !== 'missing');
  if (!usable.length) return { source: 'missing' };
  const sum = (field: 'promptTokens' | 'completionTokens' | 'totalTokens') => {
    const values = usable.map((item) => item[field]).filter((value): value is number => typeof value === 'number');
    return values.length ? values.reduce((acc, value) => acc + value, 0) : undefined;
  };
  return {
    source: usable[0].source,
    promptTokens: sum('promptTokens'),
    completionTokens: sum('completionTokens'),
    totalTokens: sum('totalTokens'),
  };
}
