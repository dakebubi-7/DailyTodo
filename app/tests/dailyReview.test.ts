import { describe, expect, it } from 'vitest';
import {
  buildDailyReviewBatch,
  getDailyReviewEligibleSources,
  mergeDailyReviewBatch,
} from '../shared/dailyReview';

describe('daily review batches', () => {
  const sourceDate = '2026-07-25';

  it('selects only evidence-backed partial, blocked, continued done, and unfinished focus tasks', () => {
    const sources = getDailyReviewEligibleSources([
      {
        id: 'partial',
        text: 'Partial task',
        completed: false,
        taskDate: sourceDate,
        completionReview: {
          id: 'partial-review', status: 'partial', percent: 60, summary: 'Implemented the form', unknowns: '', nextStep: 'Add validation tests', reviewedAt: `${sourceDate}T10:00:00.000Z`,
        },
      },
      {
        id: 'blocked',
        text: 'Blocked task',
        completed: false,
        taskDate: sourceDate,
        completionReview: {
          id: 'blocked-review', status: 'blocked', percent: 30, summary: 'Investigated', unknowns: 'Missing access', nextStep: '', reviewedAt: `${sourceDate}T11:00:00.000Z`,
        },
      },
      {
        id: 'continued-done',
        text: 'Completed stage',
        completed: true,
        taskDate: sourceDate,
        completionReview: {
          id: 'done-review', status: 'done', percent: 100, summary: 'Released', unknowns: '', nextStep: 'Prepare post-release report', reviewedAt: `${sourceDate}T12:00:00.000Z`,
        },
      },
      {
        id: 'finished',
        text: 'Finished task',
        completed: true,
        taskDate: sourceDate,
        completionReview: {
          id: 'finished-review', status: 'done', percent: 100, summary: 'Released', unknowns: '', nextStep: '', reviewedAt: `${sourceDate}T13:00:00.000Z`,
        },
      },
      {
        id: 'focus',
        text: 'Focus task',
        completed: false,
        taskDate: sourceDate,
        focusDate: sourceDate,
        carryoverContext: { status: 'partial', progressSummary: 'Started', blocker: '', nextStep: 'Continue setup', shouldCarryForward: true, createdAt: `${sourceDate}T09:00:00.000Z`, source: 'manual' },
      },
      { id: 'ordinary', text: 'Ordinary open task', completed: false, taskDate: sourceDate },
    ], sourceDate);

    expect(sources.map((source) => source.taskId)).toEqual(['partial', 'blocked', 'continued-done', 'focus']);
    expect(sources.find((source) => source.taskId === 'finished')).toBeUndefined();
  });

  it('creates one unresolved suggestion per eligible evidence revision', () => {
    const batch = buildDailyReviewBatch({
      sourceDate,
      createdAt: '2026-07-26T08:00:00.000Z',
      tasks: [{
        id: 'task-1', text: 'Review task', completed: false, taskDate: sourceDate,
        completionReview: {
          id: 'review-1', status: 'partial', percent: 50, summary: 'Drafted copy', unknowns: '', nextStep: 'Review legal wording', reviewedAt: `${sourceDate}T15:00:00.000Z`,
        },
      }],
    });

    expect(batch.sourceDate).toBe(sourceDate);
    expect(batch.items).toEqual([expect.objectContaining({ taskId: 'task-1', sourceReviewId: 'review-1', status: 'pending' })]);
    expect(batch.items[0]?.suggestion).toBeUndefined();
  });

  it('preserves successful task suggestions when retrying the same source date and revision', () => {
    const existing = buildDailyReviewBatch({
      sourceDate,
      createdAt: '2026-07-26T08:00:00.000Z',
      tasks: [{
        id: 'task-1', text: 'Review task', completed: false, taskDate: sourceDate,
        completionReview: {
          id: 'review-1', status: 'partial', percent: 50, summary: 'Drafted copy', unknowns: '', nextStep: 'Review legal wording', reviewedAt: `${sourceDate}T15:00:00.000Z`,
        },
      }],
    });
    const resolved = {
      ...existing,
      items: [{
        ...existing.items[0]!,
        status: 'completed' as const,
        suggestion: {
          progressSummary: 'Copy drafted', blocker: '', suggestedAction: 'Review the legal wording.', shouldCarryForward: true, createdAt: '2026-07-26T08:01:00.000Z',
        },
      }],
    };

    const retried = mergeDailyReviewBatch({
      existing: resolved,
      sourceDate,
      updatedAt: '2026-07-26T09:00:00.000Z',
      tasks: [{
        id: 'task-1', text: 'Review task', completed: false, taskDate: sourceDate,
        completionReview: {
          id: 'review-1', status: 'partial', percent: 50, summary: 'Drafted copy', unknowns: '', nextStep: 'Review legal wording', reviewedAt: `${sourceDate}T15:00:00.000Z`,
        },
      }],
    });

    expect(retried.items).toEqual([expect.objectContaining({ status: 'completed', suggestion: resolved.items[0]?.suggestion })]);
  });
});
