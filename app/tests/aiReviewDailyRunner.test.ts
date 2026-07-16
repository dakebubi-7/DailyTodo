import { describe, expect, it, vi } from 'vitest';
import { createAiReviewDailyRunner } from '../electron/aiReviewDailyRunner';
import { createDefaultObsidianTemplateSettings } from '../shared/appSettings';
import type { AiReviewStageDiagnostic } from '../shared/aiReview/runDiagnostics';

function createRunner(available: boolean, filePath = 'G:/missing/daily.md') {
  const callLlm = vi.fn();
  const stages: AiReviewStageDiagnostic[] = [];
  const runner = createAiReviewDailyRunner({
    getDailyFilePath: () => filePath,
    getTemplates: createDefaultObsidianTemplateSettings,
    getReviewSections: () => [],
    ensureReportLlmAvailable: () => available
      ? { ok: true as const, callLlm, resolution: { ok: true, profile: { id: 'p', name: 'P', provider: 'openai', apiKey: 'key', model: 'm', baseUrl: 'https://example.test' }, source: 'specific' as const } }
      : { ok: false as const, error: 'AI account unavailable' },
    emitAiReviewProgress: () => undefined,
    stage: (key, label, status, durationMs, message) => {
      const value = { key, label, status, durationMs, message } as AiReviewStageDiagnostic;
      stages.push(value);
      return value;
    },
    createDiagnostic: ({ reportKind, startedAt, finalStatus, resolution, stages: diagnosticStages, sourceChars, error, warning }) => ({
      runId: 'test', reportKind, startedAt: new Date(startedAt).toISOString(), finalStatus,
      profile: { provider: resolution?.profile?.provider ?? 'missing', model: resolution?.profile?.model ?? 'missing' }, stages: diagnosticStages, sourceChars, error, warning,
    }),
  });
  return { runner, callLlm, stages };
}

describe('AI daily review runner', () => {
  it('returns an account diagnostic without reading the source or calling the LLM', async () => {
    const { runner, callLlm } = createRunner(false);
    await expect(runner.runReviewForDate('2026-07-14', [])).resolves.toMatchObject({ ok: false, diagnostic: { finalStatus: 'accountUnavailable' } });
    expect(callLlm).not.toHaveBeenCalled();
  });

  it('returns a no-source diagnostic when the daily note is missing', async () => {
    const { runner, callLlm } = createRunner(true);
    await expect(runner.runReviewForDate('2026-07-14', [])).resolves.toMatchObject({ ok: false, diagnostic: { finalStatus: 'noSourceMaterials' } });
    expect(callLlm).not.toHaveBeenCalled();
  });
});
