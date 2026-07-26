// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MenuPane } from '../src/components/taskMenuPopup/TaskMenuPopupPanes';
import type { Task } from '../src/types/task';

const task: Task = {
  id: 'focus-task',
  text: 'Prepare launch notes',
  completed: false,
  priority: 'high',
  createdAt: '2026-07-26T08:00:00.000Z',
  taskDate: '2026-07-26',
  isToday: true,
};

afterEach(cleanup);

describe('Task-menu Today Focus fallback', () => {
  it('offers an accessible focus action for an eligible current-day task', () => {
    const onPick = vi.fn();
    render(<MenuPane task={task} canSelectTodayFocus onPick={onPick} />);

    fireEvent.click(screen.getByRole('button', { name: /today focus/i }));

    expect(onPick).toHaveBeenCalledWith('selectTodayFocus');
  });

  it('does not offer the action for an ineligible task', () => {
    render(<MenuPane task={task} canSelectTodayFocus={false} onPick={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /today focus/i })).toBeNull();
  });
});
