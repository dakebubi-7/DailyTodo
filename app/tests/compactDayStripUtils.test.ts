import { describe, expect, it } from 'vitest';
import type { Task } from '../src/types/task';
import {
  buildCenteredDayWindow,
  formatCompactProgressLabel,
  formatCompactSummaryCount,
  getCompactDayStripCount,
  summarizeCompactDay,
} from '../src/components/compactDayStrip/compactDayStripUtils';
import { getShellText } from '../src/i18n';

const openTask: Task = {
  id: 'open',
  text: 'Open task',
  completed: false,
  priority: 'medium',
  createdAt: '2026-07-17T09:00:00.000Z',
  taskDate: '2026-07-17',
  isToday: true,
};

describe('compact day strip helpers', () => {
  it('uses seven days only for wide strips and never drops below five days', () => {
    expect(getCompactDayStripCount(440)).toBe(7);
    expect(getCompactDayStripCount(439)).toBe(5);
    expect(getCompactDayStripCount(320)).toBe(5);
    expect(getCompactDayStripCount(319)).toBe(5);
    expect(getCompactDayStripCount(1)).toBe(5);
  });

  it('centers both permitted windows on the selected date', () => {
    expect(buildCenteredDayWindow('2026-07-17', 7)).toEqual([
      '2026-07-14',
      '2026-07-15',
      '2026-07-16',
      '2026-07-17',
      '2026-07-18',
      '2026-07-19',
      '2026-07-20',
    ]);
    expect(buildCenteredDayWindow('2026-07-17', 5)).toEqual([
      '2026-07-15',
      '2026-07-16',
      '2026-07-17',
      '2026-07-18',
      '2026-07-19',
    ]);
  });

  it('prioritizes overdue and produces proportional selected-day progress', () => {
    const tasks = [
      { ...openTask, id: 'done', completed: true },
      { ...openTask, id: 'open-2' },
      { ...openTask, id: 'open-3' },
      { ...openTask, id: 'open-4' },
      { ...openTask, id: 'carryover', carriedFromDate: '2026-07-16' },
    ];
    const summary = summarizeCompactDay(tasks, '2026-07-17', '2026-07-17');

    expect(summary).toMatchObject({
      total: 5,
      completed: 1,
      open: 4,
      overdue: 1,
      status: 'overdue',
    });
    expect(summary.progress).toEqual({ percentage: 20, ratioLabel: '1/5' });
  });

  it('distinguishes past incomplete, completed, and empty dates', () => {
    expect(
      summarizeCompactDay(
        [{ ...openTask, taskDate: '2026-07-16' }],
        '2026-07-16',
        '2026-07-17',
      ).status,
    ).toBe('incomplete-past');
    expect(
      summarizeCompactDay(
        [{ ...openTask, completed: true }],
        '2026-07-17',
        '2026-07-17',
      ).status,
    ).toBe('done');
    expect(summarizeCompactDay([], '2026-07-17', '2026-07-17').progress).toEqual({
      percentage: 0,
      ratioLabel: '0/0',
    });
  });

  it('formats localized summary counts and progress from shared templates', () => {
    const text = getShellText('en-US').app;
    const summary = summarizeCompactDay([
      { ...openTask, id: 'done', completed: true },
      { ...openTask, id: 'open-2' },
      { ...openTask, id: 'open-3' },
      { ...openTask, id: 'open-4' },
      { ...openTask, id: 'open-5' },
    ], '2026-07-17', '2026-07-17');

    expect(formatCompactSummaryCount(4, 'open', text)).toBe('4 in progress');
    expect(formatCompactSummaryCount(1, 'overdue', text)).toBe('1 overdue');
    expect(formatCompactProgressLabel(summary, text)).toBe('20% 1/5');
  });
});
