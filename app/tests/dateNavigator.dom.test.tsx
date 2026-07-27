// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DateNavigator } from '../src/components/DateNavigator';
import { getShellText } from '../src/i18n';
import type { Task } from '../src/types/task';
import type { DateNavigatorCalendarController } from '../src/components/dateNavigator/useDateNavigatorCalendar';

class ResizeObserverDouble {
  constructor(_callback: ResizeObserverCallback) {}

  observe() {}

  disconnect() {}

  unobserve() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverDouble);

const calendar: DateNavigatorCalendarController = {
  calendarRef: { current: null },
  closeCalendar: vi.fn(),
  isCalendarOpen: false,
  toggleCalendar: vi.fn(),
  visibleMonth: '2026-07-01',
  setVisibleMonth: vi.fn(),
};

const openTask: Task = {
  id: 'open',
  text: 'Open task',
  completed: false,
  priority: 'medium',
  createdAt: '2026-07-17T09:00:00.000Z',
  taskDate: '2026-07-17',
  isToday: true,
};

afterEach(cleanup);

describe('DateNavigator', () => {
  it('does not render a progress fill before any task is completed', () => {
    const { container } = render(
      <DateNavigator
        selectedDate="2026-07-17"
        tasks={[openTask]}
        language="en-US"
        text={getShellText('en-US').app}
        calendar={calendar}
        onDateChange={vi.fn()}
      />,
    );

    expect(container.querySelector('.compact-day-progress-fill')).toBeNull();
    expect(container.querySelector('.compact-day-progress-ratio')?.textContent).toBe('0/1');
  });
});
