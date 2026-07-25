import { describe, expect, it } from 'vitest';
import { projectTomorrowTasks, renderTomorrowProjection } from '../shared/aiReview/tomorrowProjection';

describe('tomorrow projection', () => {
  it('only projects open work from the reviewed date and its real next-day carryovers', () => {
    const result = projectTomorrowTasks([
      { id: 'reviewed', text: 'Finish release', completed: false, taskDate: '2026-07-20' },
      { id: 'cleared', text: 'Do not show', completed: false, cleared: true, taskDate: '2026-07-20' },
      { id: 'historic', text: 'Historic work', completed: false, taskDate: '2026-07-19' },
      { id: 'future', text: 'Unrelated future work', completed: false, taskDate: '2026-07-21' },
      {
        id: 'carried',
        text: 'Finish release',
        completed: false,
        taskDate: '2026-07-21',
        carriedFromDate: '2026-07-20',
        carriedFromTaskId: 'reviewed',
        carryoverContext: { nextStep: 'Publish release notes' },
      },
    ], '2026-07-20');

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      carried: true,
      task: { id: 'carried', carryoverContext: { nextStep: 'Publish release notes' } },
    });
  });

  it('uses a deterministic Chinese status label for source work that has not rolled over yet', () => {
    expect(renderTomorrowProjection([
      { id: 'reviewed', text: 'Finish release', completed: false, taskDate: '2026-07-20', nextStep: 'Write release notes' },
    ], '2026-07-20')).toBe('- [ ] Write release notes \uff08\u5f85\u7ed3\u8f6c\uff09');
  });
});
