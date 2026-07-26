// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TodayFocusExecutionZone } from '../src/components/taskList/TodayFocusExecutionZone';
import { getShellText } from '../src/i18n';
import type { Task } from '../src/types/task';

const focusTasks: Task[] = [
  {
    id: 'draft-release', text: 'Draft release', completed: false, priority: 'high', createdAt: '2026-07-26T08:00:00.000Z', taskDate: '2026-07-26', isToday: true, focusDate: '2026-07-26', focusOrder: 0, focusState: 'in-progress',
  },
  {
    id: 'prepare-notes', text: 'Prepare release notes', completed: false, priority: 'medium', createdAt: '2026-07-26T08:00:00.000Z', taskDate: '2026-07-26', isToday: true, focusDate: '2026-07-26', focusOrder: 1, focusState: 'blocked', focusReason: 'Waiting on legal review',
  },
];

afterEach(cleanup);

describe('TodayFocusExecutionZone', () => {
  it('shows ordered focus work, progress, current state, and blocker context', () => {
    render(
      <TodayFocusExecutionZone
        focusTasks={focusTasks}
        activeTaskId="draft-release"
        completedCount={1}
        text={getShellText('en-US').app}
        onAdjust={vi.fn()}
        onStateChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: /today focus/i })).not.toBeNull();
    expect(screen.getByText('1 / 2')).not.toBeNull();
    expect(screen.getByText(/active/i)).not.toBeNull();
    expect(screen.getByDisplayValue('Waiting on legal review')).not.toBeNull();
    expect(screen.getByText('Draft release').closest('.today-focus-execution-item')?.classList.contains('today-focus-execution-item')).toBe(true);
    expect(screen.getByRole('combobox', { name: /state for prepare release notes/i }).classList.contains('today-focus-state-select')).toBe(true);
  });

  it('sends state changes and blocker reasons through the explicit focus callback', () => {
    const onStateChange = vi.fn();
    render(
      <TodayFocusExecutionZone
        focusTasks={focusTasks}
        activeTaskId="draft-release"
        completedCount={1}
        text={getShellText('en-US').app}
        onAdjust={vi.fn()}
        onStateChange={onStateChange}
      />,
    );

    fireEvent.change(screen.getByRole('combobox', { name: /state for draft release/i }), {
      target: { value: 'blocked' },
    });
    expect(onStateChange).toHaveBeenCalledWith('draft-release', 'blocked', undefined);

    const reason = screen.getByRole('textbox', { name: /blocker reason for draft release/i });
    fireEvent.change(reason, { target: { value: 'Missing final approval' } });
    fireEvent.blur(reason);
    expect(onStateChange).toHaveBeenLastCalledWith('draft-release', 'blocked', 'Missing final approval');
  });

  it('offers an adjustment route for an empty focus set', () => {
    const onAdjust = vi.fn();
    render(
      <TodayFocusExecutionZone
        focusTasks={[]}
        completedCount={0}
        text={getShellText('en-US').app}
        onAdjust={onAdjust}
        onStateChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/no focus tasks/i)).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /adjust/i }));
    expect(onAdjust).toHaveBeenCalledOnce();
  });
});
