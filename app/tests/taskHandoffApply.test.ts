import { describe, expect, it } from 'vitest';
import { applyAiHandoff } from '../src/hooks/taskHandoff';
import type { Task, TaskHandoff } from '../src/types/task';

const task: Task = {
  id: 'release',
  text: 'Ship the release',
  completed: false,
  priority: 'high',
  createdAt: '2026-07-20T08:00:00.000Z',
  taskDate: '2026-07-20',
  isToday: true,
  nextStep: 'Ask QA for final approval',
};

const handoff: TaskHandoff = {
  status: 'partial',
  progressSummary: 'Implementation is complete',
  blocker: '',
  nextStep: 'Write the release notes',
  shouldCarryForward: true,
  createdAt: '2026-07-20T18:00:00.000Z',
  source: 'ai',
};

describe('applying an AI handoff', () => {
  it('keeps the user next step when applying only the handoff', () => {
    expect(applyAiHandoff(task, handoff, false)).toEqual({ handoff });
  });

  it('updates the next step only after the user explicitly chooses it', () => {
    expect(applyAiHandoff(task, handoff, true)).toEqual({
      handoff,
      nextStep: 'Write the release notes',
    });
  });
});
