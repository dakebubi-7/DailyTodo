import { describe, expect, it, vi } from 'vitest';

const { handlers, handle } = vi.hoisted(() => {
  const handlers = new Map<string, (...args: unknown[]) => unknown>();
  const handle = vi.fn((channel: string, listener: (...args: unknown[]) => unknown) => {
    handlers.set(channel, listener);
  });
  return { handlers, handle };
});

vi.mock('electron', () => ({ ipcMain: { handle } }));

import { registerAiReviewDailyBatchIpcHandlers } from '../electron/aiReviewDailyBatchIpc';

describe('AI daily review batch IPC', () => {
  it('exposes date-only read and explicit-run commands without accepting renderer task data', async () => {
    const getDailyReviewBatch = vi.fn().mockReturnValue({ sourceDate: '2026-07-25', items: [] });
    const runDailyReviewBatch = vi.fn().mockResolvedValue({ ok: true, batch: { sourceDate: '2026-07-25', items: [] } });
    registerAiReviewDailyBatchIpcHandlers({
      getDateKey: (value) => value === 'yesterday' ? '2026-07-25' : '2026-07-26',
      getDailyReviewBatch,
      runDailyReviewBatch,
    });

    const getHandler = handlers.get('aiReview:getDailyReviewBatch');
    const runHandler = handlers.get('aiReview:runDailyReviewBatch');
    expect(getHandler).toEqual(expect.any(Function));
    expect(runHandler).toEqual(expect.any(Function));

    expect(getHandler?.({}, 'yesterday', [{ id: 'renderer-task' }])).toEqual({
      sourceDate: '2026-07-25',
      items: [],
    });
    await expect(runHandler?.({}, 'yesterday', [{ id: 'renderer-task' }])).resolves.toMatchObject({
      ok: true,
      batch: { sourceDate: '2026-07-25' },
    });
    expect(getDailyReviewBatch).toHaveBeenCalledWith('2026-07-25');
    expect(runDailyReviewBatch).toHaveBeenCalledWith('2026-07-25');
  });
});
