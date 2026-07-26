// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TaskList } from '../src/components/TaskList';
import { getShellText } from '../src/i18n';
import type { Task } from '../src/types/task';

class TestResizeObserver {
  observe() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', TestResizeObserver);

const currentDate = '2026-07-26';
const tasks: Task[] = [
  {
    id: 'focused',
    text: 'Existing focus',
    completed: false,
    priority: 'high',
    createdAt: '2026-07-26T08:00:00.000Z',
    taskDate: currentDate,
    isToday: true,
    focusDate: currentDate,
    focusOrder: 0,
  },
  {
    id: 'requested',
    text: 'Requested focus',
    completed: false,
    priority: 'medium',
    createdAt: '2026-07-26T08:00:00.000Z',
    taskDate: currentDate,
    isToday: true,
  },
];

afterEach(cleanup);

describe('TaskList Today Focus requests', () => {
  it('opens an unpersisted focus draft that includes the requested task', () => {
    const setTodayFocus = vi.fn();
    render(
      <TaskList
        tasks={tasks}
        allTasks={tasks}
        selectedDate={currentDate}
        currentDate={currentDate}
        sourceOrder={['personal', 'external']}
        dragDisabled
        onReorderSources={vi.fn()}
        onReorderTasks={vi.fn()}
        searchQuery=""
        onSearchChange={vi.fn()}
        searchOpen={false}
        onToggleSearch={vi.fn()}
        showOpenOnly={false}
        onToggleOpenOnly={vi.fn()}
        priorityFilter="all"
        onPriorityFilterChange={vi.fn()}
        text={getShellText('en-US').app}
        activeTab="today"
        onTabChange={vi.fn()}
        hasDailyWorkContent={false}
        hasDailyInspirationContent={false}
        isDailyWorkOpen={false}
        isInspirationOpen={false}
        onToggleDailyWorkPanel={vi.fn()}
        onToggleInspirationPanel={vi.fn()}
        setTodayFocus={setTodayFocus}
        setTodayFocusState={vi.fn()}
        selectedDateTasksForCommands={tasks}
        language="en-US"
        dailyWork=""
        dailyInspiration=""
        onChangeDailyWork={vi.fn()}
        onChangeDailyInspiration={vi.fn()}
        onCloseDailyWorkPanel={vi.fn()}
        onCloseInspirationPanel={vi.fn()}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onDeleteTasks={vi.fn()}
        onEdit={vi.fn()}
        onPriorityChange={vi.fn()}
        onViewReview={vi.fn()}
        onToggleSubtask={vi.fn()}
        onDeleteSubtask={vi.fn()}
        onToggleCollapse={vi.fn()}
        onViewSubtaskReview={vi.fn()}
        onEditSubtask={vi.fn()}
        onChangeSubtaskPriority={vi.fn()}
        todayFocusRequest={{ id: 'requested', nonce: 1 }}
        inputKeybindings={{ preset: 'standard', overrides: {} }}
      />,
    );

    expect(screen.getByRole<HTMLInputElement>('checkbox', { name: 'Existing focus' }).checked).toBe(true);
    expect(screen.getByRole<HTMLInputElement>('checkbox', { name: 'Requested focus' }).checked).toBe(true);
    expect(setTodayFocus).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /save focus/i }));
    expect(setTodayFocus).toHaveBeenCalledWith(['focused', 'requested']);
  });

  it('shows the execution zone by default and opens adjustment mode for a requested task', () => {
    render(
      <TaskList
        tasks={tasks}
        allTasks={tasks}
        selectedDate={currentDate}
        currentDate={currentDate}
        sourceOrder={['personal', 'external']}
        dragDisabled
        onReorderSources={vi.fn()}
        onReorderTasks={vi.fn()}
        searchQuery=""
        onSearchChange={vi.fn()}
        searchOpen={false}
        onToggleSearch={vi.fn()}
        showOpenOnly={false}
        onToggleOpenOnly={vi.fn()}
        priorityFilter="all"
        onPriorityFilterChange={vi.fn()}
        text={getShellText('en-US').app}
        activeTab="today"
        onTabChange={vi.fn()}
        hasDailyWorkContent={false}
        hasDailyInspirationContent={false}
        isDailyWorkOpen={false}
        isInspirationOpen={false}
        onToggleDailyWorkPanel={vi.fn()}
        onToggleInspirationPanel={vi.fn()}
        setTodayFocus={vi.fn()}
        setTodayFocusState={vi.fn()}
        selectedDateTasksForCommands={tasks}
        language="en-US"
        dailyWork=""
        dailyInspiration=""
        onChangeDailyWork={vi.fn()}
        onChangeDailyInspiration={vi.fn()}
        onCloseDailyWorkPanel={vi.fn()}
        onCloseInspirationPanel={vi.fn()}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onDeleteTasks={vi.fn()}
        onEdit={vi.fn()}
        onPriorityChange={vi.fn()}
        onViewReview={vi.fn()}
        onToggleSubtask={vi.fn()}
        onDeleteSubtask={vi.fn()}
        onToggleCollapse={vi.fn()}
        onViewSubtaskReview={vi.fn()}
        onEditSubtask={vi.fn()}
        onChangeSubtaskPriority={vi.fn()}
        inputKeybindings={{ preset: 'standard', overrides: {} }}
      />,
    );

    expect(screen.getByRole('heading', { name: /today focus/i })).not.toBeNull();
    expect(screen.queryByRole('button', { name: /^today focus$/i })).toBeNull();
  });
});
