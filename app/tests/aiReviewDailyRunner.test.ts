import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAiReviewDailyRunner } from '../electron/aiReviewDailyRunner';
import { createDefaultObsidianTemplateSettings } from '../shared/appSettings';
import type { AiReviewStageDiagnostic } from '../shared/aiReview/runDiagnostics';
import { REVIEW_MARKERS } from '../shared/aiReview/markers';
import { createDefaultSections } from '../shared/aiReview/sectionConfig';

const temporaryDirectories: string[] = [];

function createDailyFile() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dailytodo-daily-runner-'));
  temporaryDirectories.push(directory);
  const filePath = path.join(directory, '2026-07-20.md');
  fs.writeFileSync(filePath, [
    '# 2026-07-20',
    '## Review',
    REVIEW_MARKERS.REVIEW.start,
    REVIEW_MARKERS.REVIEW.end,
  ].join('\n'), 'utf8');
  return filePath;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

function createRunner(available: boolean, filePath = 'G:/missing/daily.md') {
  const callLlm = vi.fn();
  const stages: AiReviewStageDiagnostic[] = [];
  const runner = createAiReviewDailyRunner({
    getDailyFilePath: () => filePath,
    getTemplates: createDefaultObsidianTemplateSettings,
    getReviewSections: () => createDefaultSections().filter((section) => section.markerKey === 'REVIEW'),
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

  it('returns valid AI handoff suggestions after a successful review without persisting them', async () => {
    const filePath = createDailyFile();
    const { runner, callLlm } = createRunner(true, filePath);
    callLlm
      .mockResolvedValueOnce({ ok: true, content: 'Review generated' })
      .mockResolvedValueOnce({
        ok: true,
        content: JSON.stringify({
          status: 'partial',
          progressSummary: 'Implementation is complete',
          blocker: '',
          nextStep: 'Write release notes',
          shouldCarryForward: true,
        }),
      });

    const result = await runner.runReviewForDate('2026-07-20', [{
      id: 'release',
      text: 'Ship the release',
      completed: false,
      priority: 'high',
      createdAt: '2026-07-20T08:00:00.000Z',
      taskDate: '2026-07-20',
      isToday: true,
      focusDate: '2026-07-20',
    }]);

    expect(result).toMatchObject({
      ok: true,
      handoffs: [{
        taskId: 'release',
        handoff: {
          status: 'partial',
          nextStep: 'Write release notes',
          source: 'ai',
        },
      }],
    });
    expect(callLlm).toHaveBeenCalledTimes(2);
  });

  it('does not request a handoff for a carryover task outside the reviewed date', async () => {
    const filePath = createDailyFile();
    const { runner, callLlm } = createRunner(true, filePath);
    callLlm
      .mockResolvedValueOnce({ ok: true, content: 'Review generated' })
      .mockResolvedValueOnce({
        ok: true,
        content: JSON.stringify({
          status: 'partial',
          progressSummary: 'Implementation is complete',
          blocker: '',
          nextStep: 'Write release notes',
          shouldCarryForward: true,
        }),
      });

    const result = await runner.runReviewForDate('2026-07-20', [{
      id: 'future-carryover',
      text: 'Ship the release',
      completed: false,
      priority: 'high',
      createdAt: '2026-07-21T08:00:00.000Z',
      taskDate: '2026-07-21',
      isToday: true,
      carriedFromDate: '2026-07-20',
      carryoverContext: {
        status: 'partial',
        progressSummary: 'Implementation is complete',
        blocker: '',
        nextStep: 'Write release notes',
        shouldCarryForward: true,
        createdAt: '2026-07-20T18:00:00.000Z',
        source: 'manual',
      },
    }]);

    expect(result).toMatchObject({ ok: true, handoffs: [] });
    expect(callLlm).toHaveBeenCalledTimes(1);
  });

  it('shares one in-flight daily review when auto sync and manual generation overlap', async () => {
    const filePath = createDailyFile();
    const { runner, callLlm } = createRunner(true, filePath);
    let releaseReview: ((value: { ok: true; content: string }) => void) | undefined;
    const reviewResponse = new Promise<{ ok: true; content: string }>((resolve) => {
      releaseReview = resolve;
    });
    callLlm.mockImplementation(() => reviewResponse);

    const firstRun = runner.runReviewForDate('2026-07-20', []);
    const secondRun = runner.runReviewForDate('2026-07-20', [], true);
    releaseReview?.({ ok: true, content: 'Review generated once' });

    const [first, second] = await Promise.all([firstRun, secondRun]);
    expect(callLlm).toHaveBeenCalledTimes(1);
    expect(first).toMatchObject({ ok: true, filledMarkers: ['REVIEW'] });
    expect(second).toMatchObject({ ok: true, filledMarkers: ['REVIEW'] });
    expect(fs.readFileSync(filePath, 'utf8')).toContain('Review generated once');
  });

  it('keeps a successful review successful when a handoff request fails', async () => {
    const filePath = createDailyFile();
    const { runner, callLlm } = createRunner(true, filePath);
    callLlm
      .mockResolvedValueOnce({ ok: true, content: 'Review generated' })
      .mockResolvedValueOnce({ ok: false, error: 'handoff provider unavailable' });

    const result = await runner.runReviewForDate('2026-07-20', [{
      id: 'release',
      text: 'Ship the release',
      completed: false,
      priority: 'high',
      createdAt: '2026-07-20T08:00:00.000Z',
      taskDate: '2026-07-20',
      isToday: true,
      focusDate: '2026-07-20',
    }]);

    expect(result).toMatchObject({
      ok: true,
      handoffs: [],
      warning: expect.stringContaining('handoff provider unavailable'),
      diagnostic: { finalStatus: 'completedWithWarning' },
    });
  });

  it('keeps a successful review successful when a handoff request throws', async () => {
    const filePath = createDailyFile();
    const { runner, callLlm } = createRunner(true, filePath);
    callLlm
      .mockResolvedValueOnce({ ok: true, content: 'Review generated' })
      .mockRejectedValueOnce(new Error('handoff transport crashed'));

    const result = await runner.runReviewForDate('2026-07-20', [{
      id: 'release',
      text: 'Ship the release',
      completed: false,
      priority: 'high',
      createdAt: '2026-07-20T08:00:00.000Z',
      taskDate: '2026-07-20',
      isToday: true,
      focusDate: '2026-07-20',
    }]);

    expect(result).toMatchObject({
      ok: true,
      handoffs: [],
      warning: expect.stringContaining('handoff transport crashed'),
      diagnostic: { finalStatus: 'completedWithWarning' },
    });
  });

  it('marks the diagnostic as warning when a handoff response has an invalid format', async () => {
    const filePath = createDailyFile();
    const { runner, callLlm } = createRunner(true, filePath);
    callLlm
      .mockResolvedValueOnce({ ok: true, content: 'Review generated' })
      .mockResolvedValueOnce({ ok: true, content: 'not JSON' });

    const result = await runner.runReviewForDate('2026-07-20', [{
      id: 'release',
      text: 'Ship the release',
      completed: false,
      priority: 'high',
      createdAt: '2026-07-20T08:00:00.000Z',
      taskDate: '2026-07-20',
      isToday: true,
      focusDate: '2026-07-20',
    }]);

    expect(result).toMatchObject({
      ok: true,
      handoffs: [],
      warning: expect.stringContaining('AI \u4ea4\u63a5\u5efa\u8bae\u683c\u5f0f\u65e0\u6548'),
      diagnostic: { finalStatus: 'completedWithWarning' },
    });
  });
});
