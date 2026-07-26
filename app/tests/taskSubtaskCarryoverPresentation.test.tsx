// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TaskSubtasksViewport } from '../src/components/taskItem/TaskSubtasksViewport';

afterEach(cleanup);

const viewportProps = {
  taskId: 'parent-task',
  viewportRef: createRef<HTMLSpanElement>(),
  isVirtual: false,
  totalHeight: undefined,
  visibleVirtualItems: [],
  shouldReduceMotion: true,
  onToggleSubtask: vi.fn(),
  onDeleteSubtask: vi.fn(),
  onViewSubtaskReview: vi.fn(),
  onEditSubtask: vi.fn(),
  onChangeSubtaskPriority: vi.fn(),
};

describe('subtask carryover presentation', () => {
  it('shows the localized continuation snapshot above expanded English subtasks', () => {
    render(
      <TaskSubtasksViewport
        {...{
          ...viewportProps,
          language: 'en-US',
          carriedFromDate: '2026-07-20',
          subtaskCarryoverProgress: { total: 3, remaining: 2 },
        }}
      />,
    );

    expect(screen.getByText('Continued from 7/20/2026 · 2/3 remaining').classList.contains('task-subtask-carryover-notice')).toBe(true);
  });

  it('shows the localized continuation snapshot above expanded Chinese subtasks', () => {
    render(
      <TaskSubtasksViewport
        {...{
          ...viewportProps,
          language: 'zh-CN',
          carriedFromDate: '2026-07-20',
          subtaskCarryoverProgress: { total: 3, remaining: 2 },
        }}
      />,
    );

    expect(screen.getByText('承接自 2026/7/20 · 剩余 2/3 项').classList.contains('task-subtask-carryover-notice')).toBe(true);
  });

  it('does not show a carryover notice without a valid snapshot', () => {
    const { container } = render(
      <TaskSubtasksViewport
        {...viewportProps}
        language="en-US"
        carriedFromDate={undefined}
        subtaskCarryoverProgress={undefined}
      />,
    );

    expect(container.querySelector('.task-subtask-carryover-notice')).toBeNull();
  });
});
