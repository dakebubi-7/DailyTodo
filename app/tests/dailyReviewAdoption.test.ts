import { describe, expect, it } from 'vitest';
import { applyConfirmedDailyReviewAdoption } from '../shared/dailyReviewAdoption';

function task(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    text: `Task ${id}`,
    completed: false,
    priority: 'medium',
    createdAt: '2026-07-25T08:00:00.000Z',
    taskDate: '2026-07-25',
    ...overrides,
  };
}

const adoption = {
  sourceDate: '2026-07-25',
  sourceReviewId: 'review-1',
  sourceReviewRevision: 'review-1|done|100',
  suggestedAction: 'Prepare the post-release report.',
  action: 'Prepare the post-release report.',
  adoptedAt: '2026-07-26T08:30:00.000Z',
};

describe('daily review suggestion adoption', () => {
  it('reopens a completed stage only after confirmed continuation and preserves its evidence', () => {
    const sourceReview = {
      id: 'review-1',
      status: 'done' as const,
      percent: 100,
      summary: 'Released the feature',
      unknowns: '',
      nextStep: 'Prepare the post-release report',
      reviewedAt: '2026-07-25T18:00:00.000Z',
    };
    const result = applyConfirmedDailyReviewAdoption({
      tasks: [task('completed-stage', {
        completed: true,
        completedAt: '2026-07-25T18:00:00.000Z',
        cleared: true,
        priority: 'high',
        completionReview: sourceReview,
        completionReviews: [sourceReview],
      })],
      focusDate: '2026-07-26',
      ...adoption,
    });

    expect(result).toMatchObject({ ok: true });
    expect(result.tasks[0]).toMatchObject({
      id: 'completed-stage',
      text: 'Task completed-stage',
      priority: 'high',
      completed: false,
      focusDate: '2026-07-26',
      focusOrder: 0,
      focusAction: 'Prepare the post-release report.',
      focusAdoption: {
        suggestedAction: 'Prepare the post-release report.',
        finalAction: 'Prepare the post-release report.',
        mode: 'unchanged',
        sourceReviewRevision: 'review-1|done|100',
      },
      completionReviews: [sourceReview],
    });
    expect(result.tasks[0]).not.toHaveProperty('completedAt');
    expect(result.tasks[0]).not.toHaveProperty('cleared');
  });

  it('records an edited final action without overwriting the original AI suggestion', () => {
    const result = applyConfirmedDailyReviewAdoption({
      tasks: [task('open')],
      focusDate: '2026-07-26',
      ...adoption,
      action: 'Draft the report outline, then collect release metrics.',
    });

    expect(result).toMatchObject({ ok: true });
    expect(result.tasks[0]).toMatchObject({
      completed: false,
      focusAction: 'Draft the report outline, then collect release metrics.',
      focusAdoption: {
        suggestedAction: 'Prepare the post-release report.',
        finalAction: 'Draft the report outline, then collect release metrics.',
        mode: 'edited',
      },
    });
  });

  it('rejects empty or over-limit confirmations without mutating tasks', () => {
    const tasks = [
      task('first', { focusDate: '2026-07-26', focusOrder: 0 }),
      task('second', { focusDate: '2026-07-26', focusOrder: 1 }),
      task('third', { focusDate: '2026-07-26', focusOrder: 2 }),
      task('candidate', { completed: true }),
    ];

    const cancelled = applyConfirmedDailyReviewAdoption({
      tasks,
      focusDate: '2026-07-26',
      ...adoption,
      taskId: 'candidate',
      action: '   ',
    });
    const full = applyConfirmedDailyReviewAdoption({
      tasks,
      focusDate: '2026-07-26',
      ...adoption,
      taskId: 'candidate',
    });

    expect(cancelled).toMatchObject({ ok: false, reason: 'empty-action', tasks });
    expect(full).toMatchObject({ ok: false, reason: 'focus-limit', tasks });
    expect(full.tasks[3]).toMatchObject({ id: 'candidate', completed: true });
  });
});
