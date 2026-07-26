// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TaskListToolbar } from '../src/components/taskList/TaskListToolbar';
import { getShellText } from '../src/i18n';

afterEach(cleanup);

describe('TaskListToolbar', () => {
  it('does not expose Today Focus as a disconnected toolbar command', () => {
    render(
      <TaskListToolbar
        searchQuery=""
        onSearchChange={vi.fn()}
        searchOpen={false}
        onToggleSearch={vi.fn()}
        showOpenOnly={false}
        onToggleOpenOnly={vi.fn()}
        priorityFilter="all"
        onPriorityFilterChange={vi.fn()}
        filtersActive={false}
        onClearFilters={vi.fn()}
        text={getShellText('en-US').app}
        activeTab="today"
        onTabChange={vi.fn()}
        hasDailyWorkContent={false}
        hasDailyInspirationContent={false}
        isDailyWorkOpen={false}
        isInspirationOpen={false}
        onToggleDailyWorkPanel={vi.fn()}
        onToggleInspirationPanel={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: /today focus/i })).toBeNull();
  });

  it('changes task views from one toolbar menu instead of a separate tab row', () => {
    const onTabChange = vi.fn();
    render(
      <TaskListToolbar
        searchQuery=""
        onSearchChange={vi.fn()}
        searchOpen={false}
        onToggleSearch={vi.fn()}
        showOpenOnly={false}
        onToggleOpenOnly={vi.fn()}
        priorityFilter="all"
        onPriorityFilterChange={vi.fn()}
        filtersActive={false}
        onClearFilters={vi.fn()}
        text={getShellText('en-US').app}
        activeTab="today"
        onTabChange={onTabChange}
        hasDailyWorkContent={false}
        hasDailyInspirationContent={false}
        isDailyWorkOpen={false}
        isInspirationOpen={false}
        onToggleDailyWorkPanel={vi.fn()}
        onToggleInspirationPanel={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /task view: today/i }));
    fireEvent.click(screen.getByRole('menuitemradio', { name: /review/i }));

    expect(onTabChange).toHaveBeenCalledWith('completed');
  });
});
