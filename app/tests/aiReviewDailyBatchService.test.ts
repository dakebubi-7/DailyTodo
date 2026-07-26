import { describe, expect, it, vi } from 'vitest';
import {
  DAILY_REVIEW_BATCHES_KEY,
  createAiReviewDailyBatchService,
} from '../electron/aiReviewDailyBatchService';

function createStore(initial: Record<string, unknown>) {
  const values = new Map(Object.entries(initial));
  return {
    get: vi.fn((key: string) => values.get(key)),
    set: vi.fn((key: string, value: unknown) => values.set(key, value)),
  };
}

function createPartialTask(id: string) {
  return {
    id,
    text: `Task ${id}`,
    completed: false,
    priority: 'high' as const,
    createdAt: '2026-07-25T08:00:00.000Z',
    taskDate: '2026-07-25',
    isToday: true,
    completionReview: {
      id: `${id}-review`,
      status: 'partial' as const,
      percent: 60,
      summary: 'Drafted the first version',
      unknowns: '',
      nextStep: 'Review the legal wording',
      reviewedAt: '2026-07-25T17:00:00.000Z',
    },
  };
}

describe('AI daily review batch service', () => {
  it('blocks a disabled assisted review without loading tasks or calling the LLM', async () => {
    const store = createStore({ tasks: [createPartialTask('task-1')] });
    const callLlm = vi.fn();
    const service = createAiReviewDailyBatchService({
      store,
      getAiReviewSettings: () => ({ enabled: false }),
      ensureDailyReviewLlmAvailable: () => ({ ok: true, callLlm }),
      now: () => '2026-07-26T08:00:00.000Z',
    });

    await expect(service.runDailyReviewBatch('2026-07-25')).resolves.toMatchObject({
      ok: false,
      error: 'AI-assisted review is disabled.',
    });
    expect(store.get).not.toHaveBeenCalled();
    expect(callLlm).not.toHaveBeenCalled();
  });

  it('loads source-date tasks from main-process storage and persists a result by source date', async () => {
    const store = createStore({ tasks: [createPartialTask('task-1')] });
    const callLlm = vi.fn().mockResolvedValue({
      ok: true,
      content: JSON.stringify({
        progressSummary: 'The first version is drafted.',
        blocker: '',
        suggestedAction: 'Review the legal wording.',
        shouldCarryForward: true,
      }),
    });
    const service = createAiReviewDailyBatchService({
      store,
      getAiReviewSettings: () => ({ enabled: true }),
      ensureDailyReviewLlmAvailable: () => ({ ok: true, callLlm }),
      now: () => '2026-07-26T08:00:00.000Z',
    });

    const result = await service.runDailyReviewBatch('2026-07-25');

    expect(store.get).toHaveBeenCalledWith('tasks');
    expect(callLlm).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      ok: true,
      batch: {
        sourceDate: '2026-07-25',
        items: [{
          taskId: 'task-1',
          status: 'completed',
          suggestion: { suggestedAction: 'Review the legal wording.' },
        }],
      },
    });
    expect(store.set).toHaveBeenLastCalledWith(DAILY_REVIEW_BATCHES_KEY, expect.objectContaining({
      '2026-07-25': expect.objectContaining({ sourceDate: '2026-07-25' }),
    }));
  });

  it('retries only unresolved items and retains completed suggestions for the same evidence revision', async () => {
    const store = createStore({ tasks: [createPartialTask('task-1'), createPartialTask('task-2')] });
    const callLlm = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        content: JSON.stringify({
          progressSummary: 'The first version is drafted.',
          blocker: '',
          suggestedAction: 'Review the legal wording.',
          shouldCarryForward: true,
        }),
      })
      .mockResolvedValueOnce({ ok: false, error: 'Temporary provider error' })
      .mockResolvedValueOnce({
        ok: true,
        content: JSON.stringify({
          progressSummary: 'The first version is drafted.',
          blocker: '',
          suggestedAction: 'Review the legal wording.',
          shouldCarryForward: true,
        }),
      });
    const service = createAiReviewDailyBatchService({
      store,
      getAiReviewSettings: () => ({ enabled: true }),
      ensureDailyReviewLlmAvailable: () => ({ ok: true, callLlm }),
      now: () => '2026-07-26T08:00:00.000Z',
    });

    const firstRun = await service.runDailyReviewBatch('2026-07-25');
    const retry = await service.runDailyReviewBatch('2026-07-25');

    expect(firstRun.batch.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ taskId: 'task-1', status: 'completed' }),
      expect.objectContaining({ taskId: 'task-2', status: 'failed', attempts: 1 }),
    ]));
    expect(retry.batch.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ taskId: 'task-1', status: 'completed', suggestion: expect.any(Object) }),
      expect.objectContaining({ taskId: 'task-2', status: 'completed', attempts: 2 }),
    ]));
    expect(callLlm).toHaveBeenCalledTimes(3);
  });
});
