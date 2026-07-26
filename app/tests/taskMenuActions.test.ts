import { describe, expect, it, vi } from 'vitest';
import { applyParsedTaskMenuAction, parseTaskMenuAction } from '../src/app/taskMenuActions';

describe('task-menu actions', () => {
  it('turns the Today Focus command into a focus-selection request', () => {
    const action = parseTaskMenuAction({
      taskId: 'focus-task',
      updates: { __action: 'selectTodayFocus' },
    });
    const requestTodayFocus = vi.fn();

    applyParsedTaskMenuAction(action, {
      addSubtask: vi.fn(),
      deleteTask: vi.fn(),
      setEditRequest: vi.fn(),
      requestTodayFocus,
      updateTask: vi.fn(),
    });

    expect(action).toEqual({ kind: 'selectTodayFocus', taskId: 'focus-task' });
    expect(requestTodayFocus).toHaveBeenCalledWith('focus-task');
  });
});
