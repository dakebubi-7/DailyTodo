import type { AiReviewProfileResolution } from '../shared/aiReview/aiReviewSettings';
import {
  mergeTokenUsage,
  safeBaseUrlHost,
  type AiReviewRunDiagnostic,
  type AiReviewRunFinalStatus,
  type AiReviewRunReportKind,
  type AiReviewStageDiagnostic,
} from '../shared/aiReview/runDiagnostics';
import type { LlmResult } from '../shared/llm/openaiClient';

type CreateAiReviewDiagnosticsOptions = {
  now?(): number;
  runId?(reportKind: AiReviewRunReportKind): string;
};

export function createAiReviewDiagnostics({
  now = Date.now,
  runId = (reportKind) => `${reportKind}-${now().toString(36)}`,
}: CreateAiReviewDiagnosticsOptions = {}) {
  function stage(
    key: AiReviewStageDiagnostic['key'],
    label: string,
    status: AiReviewStageDiagnostic['status'],
    durationMs?: number,
    message?: string,
  ): AiReviewStageDiagnostic {
    return { key, label, status, durationMs, message };
  }

  function createDiagnostic(params: {
    reportKind: AiReviewRunReportKind;
    startedAt: number;
    finalStatus: AiReviewRunFinalStatus;
    resolution?: AiReviewProfileResolution;
    stages: AiReviewStageDiagnostic[];
    llmResults?: LlmResult[];
    sourceChars?: number;
    error?: string;
    warning?: string;
  }): AiReviewRunDiagnostic {
    const finishedAtMs = now();
    const llmResults = params.llmResults ?? [];
    const usageItems = [];
    let requestDuration = 0;
    let successful = false;
    let truncated = false;
    let outputChars = 0;

    for (const result of llmResults) {
      const diagnostic = result.diagnostics;
      usageItems.push(diagnostic?.usage);
      if (typeof diagnostic?.durationMs === 'number') requestDuration += diagnostic.durationMs;
      if (!result.ok) continue;
      successful = true;
      truncated ||= result.truncated === true;
      outputChars += result.content.length;
    }

    const profile = params.resolution?.profile;
    const stages = [...params.stages];
    if (requestDuration > 0 && !stages.some((item) => item.key === 'requestAi')) {
      stages.push(stage('requestAi', '请求 AI', 'completed', requestDuration));
    }
    return {
      runId: runId(params.reportKind),
      reportKind: params.reportKind,
      startedAt: new Date(params.startedAt).toISOString(),
      finishedAt: new Date(finishedAtMs).toISOString(),
      durationMs: finishedAtMs - params.startedAt,
      finalStatus: params.finalStatus,
      profile: {
        profileId: profile?.id,
        profileName: profile?.name,
        profileSource: params.resolution?.source,
        provider: profile?.provider ?? 'unknown',
        model: profile?.model ?? 'unknown',
        baseUrlHost: profile ? safeBaseUrlHost(profile.baseUrl) : undefined,
      },
      stages,
      usage: mergeTokenUsage(usageItems),
      truncated: successful && truncated,
      outputChars,
      sourceChars: params.sourceChars,
      error: params.error,
      warning: params.warning ?? params.resolution?.warning,
    };
  }

  return { stage, createDiagnostic };
}
