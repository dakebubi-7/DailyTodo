// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CompactDayStrip } from '../src/components/CompactDayStrip';
import { getShellText } from '../src/i18n';

class ResizeObserverDouble {
  static callback: ResizeObserverCallback | undefined;

  constructor(callback: ResizeObserverCallback) {
    ResizeObserverDouble.callback = callback;
  }

  observe() {}

  disconnect() {}

  unobserve() {}

  static emit(width: number) {
    ResizeObserverDouble.callback?.(
      [{ contentRect: { width } } as ResizeObserverEntry],
      {} as ResizeObserver,
    );
  }
}

vi.stubGlobal('ResizeObserver', ResizeObserverDouble);

afterEach(() => {
  cleanup();
  ResizeObserverDouble.callback = undefined;
});

describe('CompactDayStrip', () => {
  it('keeps the exact 7/5/3 responsive day matrix and centers selection', () => {
    const { container } = render(
      <CompactDayStrip
        selectedDate="2026-07-17"
        today="2026-07-17"
        tasks={[]}
        language="en-US"
        text={getShellText('en-US').app}
        onDateChange={vi.fn()}
      />,
    );

    act(() => ResizeObserverDouble.emit(500));
    expect(screen.getAllByRole('button', { name: /July .*2026/i })).toHaveLength(7);

    act(() => ResizeObserverDouble.emit(360));
    expect(screen.getAllByRole('button', { name: /July .*2026/i })).toHaveLength(5);

    act(() => ResizeObserverDouble.emit(319));
    const dayButtons = screen.getAllByRole('button', { name: /July .*2026/i });
    expect(dayButtons).toHaveLength(3);
    expect(container.querySelector('.compact-day-strip')?.getAttribute('data-compact')).toBe('true');
    expect(screen.getByRole('button', { current: 'date' })).toBe(dayButtons[1]);
    expect(screen.queryByRole('button', { name: /back to today/i })).toBeNull();

    act(() => ResizeObserverDouble.emit(320));
    expect(screen.getAllByRole('button', { name: /July .*2026/i })).toHaveLength(5);
    expect(container.querySelector('.compact-day-strip')?.hasAttribute('data-compact')).toBe(false);
  });

  it('shows a return-to-today action only away from today and uses the existing date callback', () => {
    const onDateChange = vi.fn();
    const { container, rerender } = render(
      <CompactDayStrip
        selectedDate="2026-07-16"
        today="2026-07-17"
        tasks={[]}
        language="en-US"
        text={getShellText('en-US').app}
        onDateChange={onDateChange}
      />,
    );

    const strip = container.querySelector('.compact-day-strip');
    const todayAction = screen.getByRole('button', { name: /back to today/i });
    expect(strip?.firstElementChild).toBe(todayAction);
    expect(todayAction.querySelector('.compact-day-strip-today-icon')).not.toBeNull();
    expect(todayAction.querySelector('.compact-day-strip-today-label')?.textContent).toBe('Back to today');
    expect(todayAction.getAttribute('title')).toBe('Back to today');
    expect(todayAction.getAttribute('aria-label')).toBe('Back to today');
    expect(todayAction.querySelector('.compact-day-strip-today-icon')?.getAttribute('aria-hidden')).toBe('true');

    todayAction.click();
    expect(onDateChange).toHaveBeenCalledWith('2026-07-17');

    rerender(
      <CompactDayStrip
        selectedDate="2026-07-17"
        today="2026-07-17"
        tasks={[]}
        language="en-US"
        text={getShellText('en-US').app}
        onDateChange={onDateChange}
      />,
    );

    expect(screen.queryByRole('button', { name: /back to today/i })).toBeNull();
  });
});
