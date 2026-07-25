import { describe, expect, it } from 'vitest';
import { normalizeTaskMenuActionPayload } from '../shared/taskMenuActionUpdates';

describe('task menu action updates', () => {
  it('keeps only allowlisted fields', () => {
    expect(normalizeTaskMenuActionPayload({
      taskId: '1',
      updates: {
        priority: 'low',
        tags: ['a'],
        completed: true,
        text: 'x',
      },
    })).toEqual({
      taskId: '1',
      updates: {
        priority: 'low',
        tags: ['a'],
        text: 'x',
      },
    });
  });

  it('keeps a supported task source update', () => {
    expect(normalizeTaskMenuActionPayload({
      taskId: '1',
      updates: { source: 'external' },
    })).toEqual({
      taskId: '1',
      updates: { source: 'external' },
    });
  });

  it('rejects malformed payloads', () => {
    expect(normalizeTaskMenuActionPayload(null)).toBeNull();
    expect(normalizeTaskMenuActionPayload({ taskId: '', updates: {} })).toBeNull();
  });
});
