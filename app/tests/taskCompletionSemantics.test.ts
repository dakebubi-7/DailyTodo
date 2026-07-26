import { describe, expect, it } from 'vitest';
import { resolveCompletionState } from '../shared/taskCompletionSemantics';

describe('task completion semantics', () => {
  it('keeps a partial evidence record open for ordinary carryover', () => {
    expect(resolveCompletionState({
      status: 'partial',
      percent: 70,
      reviewedAt: '2026-07-26T09:00:00.000Z',
    })).toEqual({ completed: false, completedAt: undefined });
  });

  it('keeps a blocked evidence record open for ordinary carryover', () => {
    expect(resolveCompletionState({
      status: 'blocked',
      percent: 40,
      reviewedAt: '2026-07-26T09:00:00.000Z',
    })).toEqual({ completed: false, completedAt: undefined });
  });

  it('completes a done evidence record even when it contains a future next step', () => {
    expect(resolveCompletionState({
      status: 'done',
      percent: 100,
      reviewedAt: '2026-07-26T09:00:00.000Z',
      nextStep: 'Prepare the next stage',
    })).toEqual({ completed: true, completedAt: '2026-07-26T09:00:00.000Z' });
  });
});
