// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TodayFocusPanel } from '../src/components/taskList/TodayFocusPanel';
import { getShellText } from '../src/i18n';
import type { Task } from '../src/types/task';

const candidates: Task[] = [
  { id: 'first', text: 'First focus task', completed: false, priority: 'high', createdAt: '2026-07-26T08:00:00.000Z', taskDate: '2026-07-26', isToday: true },
  { id: 'second', text: 'Second focus task', completed: false, priority: 'medium', createdAt: '2026-07-26T08:00:00.000Z', taskDate: '2026-07-26', isToday: true },
];

afterEach(cleanup);

describe('TodayFocusPanel', () => {
  it('lets a keyboard-accessible temporary selection be confirmed or cancelled', () => {
    const onSelectionChange = vi.fn();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <TodayFocusPanel
        candidates={candidates}
        selectedTaskIds={['first']}
        onSelectionChange={onSelectionChange}
        onConfirm={onConfirm}
        onCancel={onCancel}
        text={getShellText('en-US').app}
      />,
    );

    expect(screen.getByRole<HTMLInputElement>('checkbox', { name: 'First focus task' }).checked).toBe(true);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Second focus task' }));
    expect(onSelectionChange).toHaveBeenCalledWith(['first', 'second']);

    fireEvent.click(screen.getByRole('button', { name: /save focus/i }));
    expect(onConfirm).toHaveBeenCalledWith();

    fireEvent.keyDown(screen.getByRole('group', { name: /today focus/i }), { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledWith();
  });
});
