import { BrowserWindow } from 'electron';
import {
  resolveProfileForReportKind,
  type AiReviewProfileResolution,
  type AiReviewReportKind,
  type AiReviewSettings,
} from '../shared/aiReview/aiReviewSettings';
import type { AiReviewRunReportKind, AiReviewStageDiagnostic } from '../shared/aiReview/runDiagnostics';
import { callChatCompletion, type ChatMessage, type LlmResult } from '../shared/llm/openaiClient';
import { createAiReviewDiagnostics } from './aiReviewDiagnostics';

type CreateAiReviewRuntimeHelpersOptions = {
  getAiReviewSettings(): AiReviewSettings;
};

export function createAiReviewRuntimeHelpers({ getAiReviewSettings }: CreateAiReviewRuntimeHelpersOptions) {
  const { stage, createDiagnostic } = createAiReviewDiagnostics();

  function getLlmCallerForReportKind(reportKind: AiReviewReportKind) {
    const settings = getAiReviewSettings();
    const resolution = resolveProfileForReportKind(settings, reportKind);
    const profile = resolution.profile;
    return {
      resolution,
      callLlm: (messages: ChatMessage[]) =>
        callChatCompletion(
          {
            baseUrl: profile.baseUrl,
            apiKey: profile.apiKey,
            model: profile.model,
            maxTokens: profile.maxTokens,
          },
          messages,
          { timeoutMs: profile.timeoutSeconds * 1000, provider: profile.provider },
        ),
    };
  }

  function ensureReportLlmAvailable(reportKind: AiReviewReportKind):
    | { ok: true; callLlm: (messages: ChatMessage[]) => Promise<LlmResult>; resolution: AiReviewProfileResolution }
    | { ok: false; error: string; resolution?: AiReviewProfileResolution } {
    const settings = getAiReviewSettings();
    if (!settings.enabled) return { ok: false, error: 'AI \u590d\u76d8\u672a\u542f\u7528' };
    const { callLlm, resolution } = getLlmCallerForReportKind(reportKind);
    if (!resolution.profile.apiKey.trim()) {
      return {
        ok: false,
        error: 'AI \u590d\u76d8\u7f3a\u5c11\u53ef\u7528\u8d26\u53f7 Key\uff0c\u8bf7\u5728\u8bbe\u7f6e\u4e2d\u9009\u62e9\u8d26\u53f7\u6216\u586b\u5199 API Key',
        resolution,
      };
    }
    return { ok: true, callLlm, resolution };
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function emitAiReviewProgress(
    reportKind: AiReviewRunReportKind,
    stageKey: AiReviewStageDiagnostic['key'],
    label: string,
    status: 'running' | 'completed' | 'failed' | 'warning',
    message?: string,
  ) {
    const payload = { reportKind, stageKey, label, status, message, at: nowIso() };
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed()) win.webContents.send('aiReview:progress', payload);
    });
  }

  async function extractDocxText(buffer: Buffer): Promise<string> {
    const mammoth = await import('mammoth');
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  }

  return {
    ensureReportLlmAvailable,
    stage,
    emitAiReviewProgress,
    createDiagnostic,
    extractDocxText,
  };
}
