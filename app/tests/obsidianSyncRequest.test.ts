import { describe, expect, it } from 'vitest';
import { createObsidianSyncRequestReader } from '../electron/obsidianSyncRequest';

const task = {
  id: 'task-1',
  text: 'Write release notes',
  completed: true,
  priority: 'medium' as const,
  createdAt: '2026-07-14T08:00:00.000Z',
  isToday: true,
  taskDate: '2026-07-13',
  completionReviews: [{
    id: 'review-1',
    status: 'done' as const,
    percent: 100,
    summary: 'Finished',
    unknowns: '',
    nextStep: '',
    reviewedAt: '2026-07-14T10:00:00.000Z',
  }],
};

function createReader(vaultStatus: { ok: boolean; vaultPath?: string; reason?: string }) {
  return createObsidianSyncRequestReader({
    getDateKey: (date) => date ?? '2026-07-14',
    getTaskDate: (value) => value.taskDate ?? '2026-07-14',
    getReviewDate: (review) => review.reviewedAt.slice(0, 10),
    getVaultStatus: () => vaultStatus.ok && vaultStatus.vaultPath
      ? { ok: true, vaultPath: vaultStatus.vaultPath }
      : { ok: false, reason: vaultStatus.reason },
  });
}

describe('Obsidian sync request preparation', () => {
  it('rejects an unavailable vault before accepting IPC data', () => {
    const read = createReader({ ok: false, reason: 'Vault unavailable' });

    expect(read('not-an-array', '2026-07-14')).toEqual({
      ok: false,
      error: 'Vault unavailable',
    });
  });

  it('normalizes the selected date and includes dates affected by completion reviews', () => {
    const read = createReader({ ok: true, vaultPath: 'G:/vault' });
    const result = read([task], '2026-07-14');

    expect(result).toMatchObject({
      ok: true,
      value: {
        selected: '2026-07-14',
        affectedDates: expect.arrayContaining(['2026-07-14', '2026-07-13']),
      },
    });
  });
});
