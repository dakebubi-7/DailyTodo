# Compact Day Strip and Task Toolbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the old date-stepper and tall daily-note switch with a responsive 7-or-5-day strip, a compact proportional selected-day progress row, and task-toolbar Daily Work and Inspiration actions.

**Architecture:** Keep task storage, completion, carry-forward, filtering, ordering, review, and composer ownership unchanged. Put deterministic date-window, status, and progress calculations in focused pure helpers; let `CompactDayStrip` observe its own container; make `AppTopContent` own one calendar controller shared by `Header` and `DateNavigator`. Keep Daily Work and Inspiration panels lazy in `AppTopContent`, but render their launch controls from `TaskListToolbar` beside the existing task tools.

**Tech Stack:** React 18, TypeScript, Framer Motion, `ResizeObserver`, existing `taskAppliesToDate` and task-date helpers, CSS custom properties, Vitest with jsdom, Testing Library, and the repository's `tsx` source verifiers.

---

## Product Contract

1. The header renders only the `Daily Todo` product title plus workspace, selected-note, calendar, and theme actions. It must not render `Today`, a date-context label, a completed-count sentence, or a header progress row.
2. The compact strip measures its own container. At `>= 440px` it renders seven dates; at every smaller width it renders five dates. There is no three-day level and no return-to-today button.
3. Each strip date is a stable-grid button with localized weekday/full-date status text, a semantic status dot, and `aria-current="date"` for the selected date. Status priority is `overdue`, `done`, `active-open`, `incomplete-past`, then `future-empty`; selected blue framing is an overlay, not a status replacement.
4. The selected-day summary is one 34px-high row below the strip. Its 24px internal track has a dark continuous background, a proportional white completion fill containing the percentage, and the `completed/total` ratio at the right edge of that same track. With one completed task out of five, it shows `20%` and `1/5`.
5. Header calendar opens the existing lazy month popup through one shared controller. Selecting a month-cell date recenters the strip and closes the popup. The old previous/today/next/date/calendar row and the popup's duplicate history row disappear.
6. Search and filter are accessible icon-only launcher buttons in the task toolbar. Search preserves the existing input behavior; filter reveals the existing open-only, priority, and clear controls in an expandable toolbar area.
7. Daily Work and Inspiration are larger text buttons at the right of the same toolbar row. They preserve their content indicator, open state, mutual exclusion, and lazy panel mounting.
8. All new visible copy and accessible labels use `getShellText(language)`, with Chinese as default and English through the existing `en-US` setting.

## File Structure

| File | Responsibility |
| --- | --- |
| Create `src/components/compactDayStrip/compactDayStripUtils.ts` | Pure 7/5 sizing, centered-window, selected-day summary, semantic status, progress, and localization helpers. |
| Create `src/components/CompactDayStrip.tsx` | Width-observed accessible strip that emits only `onDateChange`. |
| Create `tests/compactDayStripUtils.test.ts` | Pure behavior tests for 7/5 windows, status priority, and progress calculations. |
| Create `tests/compactDayStrip.dom.test.tsx` | jsdom `ResizeObserver` test for wide, medium, and very narrow strip behavior. |
| Create `scripts/verify-compact-day-strip.ts` | Focused source/contract verifier registered with cleanup-core. |
| Modify `src/components/dateNavigator/useDateNavigatorCalendar.ts` | Export the typed shared calendar controller. |
| Modify `src/components/DateNavigator.tsx` | Compose strip, summary/progress row, and lazy month popup; remove old stepper markup. |
| Modify `src/components/dateNavigator/MonthCalendar.tsx` | Remove the duplicate history row and receive localized calendar copy. |
| Modify `src/components/Header.tsx` | Render the product-only header and shared calendar icon action. |
| Modify `src/components/AppTopContent.tsx` | Own one calendar controller and preserve only conditional lazy editor panels. |
| Modify `src/components/TaskList.tsx`, `src/components/taskList/TaskListToolbar.tsx` | Thread and render toolbar editor actions plus icon-only filter launcher. |
| Modify `src/app/appShellMainContentComposition.tsx`, `src/app/appShellCompositionInputs.ts` | Pass localized top-area and task-toolbar props through existing composition boundaries; remove the unused `allDates` navigator handoff. |
| Modify `src/i18n/shellTextZh.ts`, `src/i18n/shellTextEn.ts` | Add matching header, calendar, strip, summary, filter, and accessible-label copy. |
| Modify `src/styles/globals.css` | Add isolated compact-strip/summary/toolbar styles and theme tokens without broad theme cleanup. |
| Modify existing verifier scripts and `package.json` | Update stale source expectations and register the new focused verifier. |

### Task 1: Prove the Pure 7/5, Status, and Progress Rules

**Files:**
- Create: `tests/compactDayStripUtils.test.ts`
- Create: `src/components/compactDayStrip/compactDayStripUtils.ts`

- [ ] **Step 1: Write the failing pure-function tests.**

  Create `tests/compactDayStripUtils.test.ts`. Use complete `Task` fixtures so the tests verify the real task contract rather than an invented lightweight shape.

  ```ts
  import { describe, expect, it } from 'vitest';
  import type { Task } from '../src/types/task';
  import {
    buildCenteredDayWindow,
    getCompactDayStripCount,
    summarizeCompactDay,
  } from '../src/components/compactDayStrip/compactDayStripUtils';

  const openTask: Task = {
    id: 'open', text: 'Open task', completed: false, priority: 'medium',
    createdAt: '2026-07-17T09:00:00.000Z', taskDate: '2026-07-17', isToday: true,
  };

  describe('compact day strip helpers', () => {
    it('uses seven days only at wide width and five days everywhere else', () => {
      expect(getCompactDayStripCount(440)).toBe(7);
      expect(getCompactDayStripCount(439)).toBe(5);
      expect(getCompactDayStripCount(320)).toBe(5);
      expect(getCompactDayStripCount(1)).toBe(5);
    });

    it('centers both permitted windows on the selected date', () => {
      expect(buildCenteredDayWindow('2026-07-17', 7)).toEqual([
        '2026-07-14', '2026-07-15', '2026-07-16', '2026-07-17',
        '2026-07-18', '2026-07-19', '2026-07-20',
      ]);
      expect(buildCenteredDayWindow('2026-07-17', 5)).toEqual([
        '2026-07-15', '2026-07-16', '2026-07-17', '2026-07-18', '2026-07-19',
      ]);
    });

    it('prioritizes overdue and produces proportional selected-day progress', () => {
      const tasks = [
        { ...openTask, id: 'done', completed: true },
        { ...openTask, id: 'open-2' }, { ...openTask, id: 'open-3' },
        { ...openTask, id: 'open-4' },
        { ...openTask, id: 'carryover', carriedFromDate: '2026-07-16' },
      ];
      const summary = summarizeCompactDay(tasks, '2026-07-17', '2026-07-17');

      expect(summary).toMatchObject({ total: 5, completed: 1, open: 4, overdue: 1, status: 'overdue' });
      expect(summary.progress).toEqual({ percentage: 20, ratioLabel: '1/5' });
    });
  });
  ```

- [ ] **Step 2: Run the test and verify the expected failure.**

  Run: `npm test -- --run tests/compactDayStripUtils.test.ts`

  Expected: FAIL because `src/components/compactDayStrip/compactDayStripUtils.ts` does not yet exist.

- [ ] **Step 3: Implement the pure helper module with no 3-day union member.**

  Create `src/components/compactDayStrip/compactDayStripUtils.ts`. Its imports must be exactly:

  ```ts
  import { formatLocalDateKey, shiftDateKey } from '../../../shared/taskRollover';
  import type { AppLanguage } from '../../../shared/appSettings';
  import { getTaskDate, taskAppliesToDate } from '../../hooks/taskTransforms';
  import type { getShellText } from '../../i18n';
  import type { Task } from '../../types/task';

  export type CompactDayStripCount = 5 | 7;
  export type CompactDayStatus = 'future-empty' | 'incomplete-past' | 'done' | 'active-open' | 'overdue';

  export interface CompactDaySummary {
    total: number;
    completed: number;
    open: number;
    overdue: number;
    status: CompactDayStatus;
    progress: { percentage: number; ratioLabel: string };
  }

  export function getCompactDayStripCount(containerWidth: number): CompactDayStripCount {
    return containerWidth >= 440 ? 7 : 5;
  }

  export function buildCenteredDayWindow(selectedDate: string, count: CompactDayStripCount): string[] {
    const startOffset = -Math.floor(count / 2);
    return Array.from({ length: count }, (_, index) => shiftDateKey(selectedDate, startOffset + index));
  }

  export function summarizeCompactDay(tasks: Task[], date: string, today = formatLocalDateKey()): CompactDaySummary {
    const visible = tasks.filter((task) => !task.cleared && taskAppliesToDate(task, date, today));
    const completed = visible.filter((task) => task.completed).length;
    const overdue = visible.filter((task) => !task.completed && (
      (task.carriedFromDate && task.carriedFromDate < date) || getTaskDate(task, today) < date
    )).length;
    const total = visible.length;
    const open = total - completed;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    const status: CompactDayStatus = total === 0
      ? 'future-empty'
      : overdue > 0 ? 'overdue'
        : completed === total ? 'done'
          : date < today ? 'incomplete-past'
            : 'active-open';

    return { total, completed, open, overdue, status, progress: { percentage, ratioLabel: `${completed}/${total}` } };
  }
  ```

  Add these exact formatter contracts below `summarizeCompactDay`. They keep language copy in the i18n files and prevent all JSX consumers from rebuilding counts or dates.

  ```ts
  export type CompactDayStripText = ReturnType<typeof getShellText>['app'];

  function replaceTemplate(template: string, values: Record<string, string | number>) {
    return Object.entries(values).reduce(
      (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
      template,
    );
  }

  export function formatCompactWeekday(date: string, language: AppLanguage) {
    return new Intl.DateTimeFormat(language, { weekday: 'short' }).format(new Date(`${date}T00:00:00`));
  }

  export function formatCompactFullDate(date: string, language: AppLanguage) {
    return new Intl.DateTimeFormat(language, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
      .format(new Date(`${date}T00:00:00`));
  }

  export function formatCompactSummaryCount(
    count: number,
    kind: 'open' | 'overdue',
    text: CompactDayStripText,
  ) {
    return replaceTemplate(kind === 'open' ? text.openCount : text.overdueCount, { count });
  }

  export function formatCompactProgressLabel(summary: CompactDaySummary, text: CompactDayStripText) {
    return `${replaceTemplate(text.completionPercent, { percentage: summary.progress.percentage })} ${replaceTemplate(
      text.completionRatio,
      { completed: summary.completed, total: summary.total },
    )}`;
  }

  export function formatCompactDayAriaLabel(
    date: string,
    status: CompactDayStatus,
    language: AppLanguage,
    text: CompactDayStripText,
  ) {
    const statusKey = {
      'future-empty': 'futureEmpty', 'incomplete-past': 'incompletePast', done: 'done',
      'active-open': 'activeOpen', overdue: 'overdue',
    } as const;
    return `${text.selectDate}: ${formatCompactFullDate(date, language)}. ${text.status[statusKey[status]]}.`;
  }
  ```

  For zero tasks, `summarizeCompactDay` must return percentage `0` and ratio `0/0`; the renderer decides that no white fill is drawn for this state.

- [ ] **Step 4: Extend the same test with status edge cases and run it to green.**

  Add these assertions to `tests/compactDayStripUtils.test.ts`, then run the focused test and TypeScript check.

  ```ts
  expect(summarizeCompactDay([{ ...openTask, taskDate: '2026-07-16' }], '2026-07-16', '2026-07-17').status)
    .toBe('incomplete-past');
  expect(summarizeCompactDay([{ ...openTask, completed: true }], '2026-07-17', '2026-07-17').status)
    .toBe('done');
  expect(summarizeCompactDay([], '2026-07-17', '2026-07-17').progress)
    .toEqual({ percentage: 0, ratioLabel: '0/0' });
  ```

  Run: `npm test -- --run tests/compactDayStripUtils.test.ts && npm run typecheck`

  Expected: both commands exit `0`; no test or type references a three-day count.

- [ ] **Step 5: Commit only the isolated helper/test work.**

  ```bash
  git add src/components/compactDayStrip/compactDayStripUtils.ts tests/compactDayStripUtils.test.ts
  git commit -m "feat: add compact day strip helpers"
  ```

### Task 2: Render and Test the Container-Responsive Strip

**Files:**
- Create: `src/components/CompactDayStrip.tsx`
- Create: `tests/compactDayStrip.dom.test.tsx`

- [ ] **Step 1: Write the failing jsdom test with a controllable ResizeObserver.**

  Create `tests/compactDayStrip.dom.test.tsx` beginning with `// @vitest-environment jsdom`. Install a test-local observer double before rendering. Assert 7 cells at 500px, 5 at 360px, and still 5 at 180px; also assert that the selected date is the middle cell and no return-to-today control exists.

  ```tsx
  class ResizeObserverDouble {
    static callback: ResizeObserverCallback | undefined;
    constructor(callback: ResizeObserverCallback) { ResizeObserverDouble.callback = callback; }
    observe() {} disconnect() {} unobserve() {}
    static emit(width: number) {
      ResizeObserverDouble.callback?.([{ contentRect: { width } } as ResizeObserverEntry], {} as ResizeObserver);
    }
  }

  vi.stubGlobal('ResizeObserver', ResizeObserverDouble);
  render(<CompactDayStrip selectedDate="2026-07-17" today="2026-07-17" tasks={[]} language="en-US" text={getShellText('en-US').app} onDateChange={vi.fn()} />);
  ResizeObserverDouble.emit(500);
  expect(screen.getAllByRole('button', { name: /July 2026/i })).toHaveLength(7);
  ResizeObserverDouble.emit(360);
  expect(screen.getAllByRole('button', { name: /July 2026/i })).toHaveLength(5);
  ResizeObserverDouble.emit(180);
  expect(screen.getAllByRole('button', { name: /July 2026/i })).toHaveLength(5);
  expect(screen.getByRole('button', { current: 'date' })).toBe(screen.getAllByRole('button', { name: /July 2026/i })[2]);
  expect(screen.queryByRole('button', { name: /back to today/i })).toBeNull();
  ```

- [ ] **Step 2: Run the DOM test and verify the expected failure.**

  Run: `npm test -- --run tests/compactDayStrip.dom.test.tsx`

  Expected: FAIL because `CompactDayStrip` does not yet exist.

- [ ] **Step 3: Implement the strip as an observed, stable-grid control.**

  Create `src/components/CompactDayStrip.tsx` with this shape. Start at 5 rather than inventing a transient 3-day mode.

  ```tsx
  import { memo, useEffect, useMemo, useRef, useState } from 'react';
  import type { AppLanguage } from '../../shared/appSettings';
  import type { getShellText } from '../i18n';
  import type { Task } from '../types/task';
  import {
    buildCenteredDayWindow, formatCompactDayAriaLabel, formatCompactWeekday,
    getCompactDayStripCount, summarizeCompactDay, type CompactDayStripCount,
  } from './compactDayStrip/compactDayStripUtils';

  type CompactDayStripText = ReturnType<typeof getShellText>['app'];
  interface CompactDayStripProps {
    selectedDate: string; today: string; tasks: Task[]; language: AppLanguage;
    text: CompactDayStripText; onDateChange: (date: string) => void;
  }

  export const CompactDayStrip = memo(function CompactDayStrip(props: CompactDayStripProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [count, setCount] = useState<CompactDayStripCount>(5);
    useEffect(() => {
      const element = containerRef.current;
      if (!element) return undefined;
      const observer = new ResizeObserver(([entry]) => setCount(getCompactDayStripCount(entry.contentRect.width)));
      observer.observe(element);
      return () => observer.disconnect();
    }, []);
    const dates = useMemo(() => buildCenteredDayWindow(props.selectedDate, count), [count, props.selectedDate]);

  return <div ref={containerRef} className="compact-day-strip" data-day-count={count}>
      <div className="compact-day-strip-days">
        {dates.map((date) => {
          const summary = summarizeCompactDay(props.tasks, date, props.today);
          const selected = date === props.selectedDate;
          return <button key={date} type="button" className="compact-day-strip-day" data-status={summary.status}
            aria-current={selected ? 'date' : undefined}
            aria-label={formatCompactDayAriaLabel(date, summary.status, props.language, props.text)}
            onClick={() => props.onDateChange(date)}>
            <span className="compact-day-strip-weekday">{formatCompactWeekday(date, props.language)}</span>
            <span className="compact-day-strip-number">{date.slice(-2)}</span>
            <span className="compact-day-strip-dot" aria-hidden="true" />
          </button>;
        })}
      </div>
    </div>;
  });
  ```

  Keep `CompactDayStripText` exported from `compactDayStripUtils.ts`; import that type here instead of declaring a second identical `ReturnType<typeof getShellText>['app']` alias.

- [ ] **Step 4: Run the unit and DOM checks to prove the exact 7/5/5 matrix.**

  Run: `npm test -- --run tests/compactDayStripUtils.test.ts tests/compactDayStrip.dom.test.tsx && npm run typecheck`

  Expected: all checks pass; the strip has five cells at both medium and very narrow widths, all cells have accessible full-date/status names, and the selected cell stays in the center.

- [ ] **Step 5: Commit the responsive component and DOM behavior.**

  ```bash
  git add src/components/CompactDayStrip.tsx tests/compactDayStrip.dom.test.tsx
  git commit -m "feat: render responsive compact day strip"
  ```

### Task 3: Move Calendar Ownership and Replace the Legacy Date Row

**Files:**
- Modify: `src/components/dateNavigator/useDateNavigatorCalendar.ts`
- Modify: `src/components/DateNavigator.tsx`
- Modify: `src/components/dateNavigator/MonthCalendar.tsx`
- Modify: `scripts/verify-date-navigator-module.ts`

- [ ] **Step 1: Make the date-navigator verifier fail against the legacy row.**

  Replace assertions that require `DateNavigator` to call the hook internally or render `.date-stepper`, `.date-today-button`, `.date-current`, and `.date-calendar-button`. Add exact final-contract checks:

  ```ts
  assert.match(navigator, /<CompactDayStrip\b/, 'DateNavigator should render the compact strip.');
  assert.match(navigator, /className="compact-day-summary"/, 'DateNavigator should own the selected-day summary.');
  assert.match(navigator, /isCalendarOpen && \([\s\S]*?<MonthCalendar\b/, 'Month calendar should remain lazy.');
  assert.doesNotMatch(navigator, /date-stepper|date-today-button|date-current|date-calendar-button/);
  assert.doesNotMatch(calendar, /month-calendar-history/);
  assert.match(calendar, /onDateChange\(cell\.key\);\s*onClose\(\);/);
  ```

  Require an exported `DateNavigatorCalendarController` with `calendarRef`, `closeCalendar`, `isCalendarOpen`, `toggleCalendar`, `visibleMonth`, and `setVisibleMonth`.

- [ ] **Step 2: Run the navigator verifier and verify it fails.**

  Run: `npm run verify:date-navigator-module`

  Expected: FAIL because the old date row and popup history controls still exist.

- [ ] **Step 3: Implement shared calendar state, compact summary, and localized month popup.**

  In `src/components/dateNavigator/useDateNavigatorCalendar.ts`, export this controller type and annotate the return value:

  ```ts
  import type { Dispatch, RefObject, SetStateAction } from 'react';

  export interface DateNavigatorCalendarController {
    calendarRef: RefObject<HTMLDivElement>;
    closeCalendar: () => void;
    isCalendarOpen: boolean;
    toggleCalendar: () => void;
    visibleMonth: string;
    setVisibleMonth: Dispatch<SetStateAction<string>>;
  }
  ```

  Change `DateNavigator` props to receive `calendar: DateNavigatorCalendarController`, `language`, and `text`; remove `allDates`. Render `CompactDayStrip`, then this summary structure using `summarizeCompactDay(tasks, selectedDate, today)`:

  ```tsx
  <div className="compact-day-summary">
    <p className="compact-day-summary-counts">
      <span>{formatCompactSummaryCount(summary.open, 'open', language, text)}</span>
      <span className="compact-day-summary-overdue">{formatCompactSummaryCount(summary.overdue, 'overdue', language, text)}</span>
    </p>
    <div className="compact-day-progress-track" aria-label={formatCompactProgressLabel(summary, language, text)}>
      {summary.total > 0 && <div className="compact-day-progress-fill" style={{ width: `max(${summary.progress.percentage}%, 2.65rem)` }}>
        <span>{`${summary.progress.percentage}%`}</span>
      </div>}
      <span className="compact-day-progress-ratio">{summary.progress.ratioLabel}</span>
    </div>
  </div>
  ```

  Clamp the fill to `100%` in the helper/render path so 100% cannot overflow. For zero tasks, render no white fill, retain the dark track, show `0/0`, and expose `0%` in the track label. Keep the existing lazy import and pass localized calendar text to `MonthCalendar`.

  In `MonthCalendar`, remove the `allDates` prop and the entire `.month-calendar-history` block. Derive weekday labels as `Array.from({ length: 7 }, (_, index) => new Intl.DateTimeFormat(language, { weekday: 'short' }).format(new Date(2026, 6, 13 + index)))`, and derive the month label with `Intl.DateTimeFormat(language, { year: 'numeric', month: 'long' })`. Accept `selectDate`, `previousMonth`, and `nextMonth` labels from `text` for dialog/buttons. Keep month navigation, task heat data, and `onDateChange(cell.key); onClose();` unchanged.

- [ ] **Step 4: Run focused date checks and TypeScript.**

  Run: `npm run verify:date-navigator-module && npm test -- --run tests/compactDayStripUtils.test.ts tests/compactDayStrip.dom.test.tsx && npm run typecheck`

  Expected: the legacy bottom row and popup history are absent, the month calendar remains lazy, a selected cell closes it, and the 20%/1/5 calculations remain intact.

- [ ] **Step 5: Commit the calendar and navigator refactor.**

  ```bash
  git add src/components/dateNavigator/useDateNavigatorCalendar.ts src/components/DateNavigator.tsx src/components/dateNavigator/MonthCalendar.tsx scripts/verify-date-navigator-module.ts
  git commit -m "feat: replace date stepper with compact navigation"
  ```

### Task 4: Simplify Header and Share Its Calendar Controller

**Files:**
- Modify: `src/components/Header.tsx`
- Modify: `src/components/AppTopContent.tsx`
- Modify: `src/app/appShellMainContentComposition.tsx`
- Modify: `src/app/appShellCompositionInputs.ts`
- Modify: `scripts/verify-app-top-content-module.ts`
- Modify: `scripts/verify-app-shell-composition-module.ts`

- [ ] **Step 1: Update source verifiers so the old header and permanent switch fail.**

  In `scripts/verify-app-top-content-module.ts`, remove expectations for `formatDateLabel`, `dateContextLabel`, header `<p>`, `.header-progress-row`, and `.daily-panel-switch`. Add checks for one hook call in `AppTopContent`, a shared wrapper, a Header calendar button, and conditional panel mounts:

  ```ts
  assert.match(topContent, /const calendar = useDateNavigatorCalendar\(headerProps\.selectedDate\);/);
  assert.match(topContent, /className="top-calendar-controller" ref=\{calendar\.calendarRef\}/);
  assert.match(topContent, /<Header \{\.\.\.headerProps\} calendar=\{calendar\} \/>/);
  assert.match(topContent, /<DateNavigator \{\.\.\.dateNavigatorProps\} calendar=\{calendar\} \/>/);
  assert.doesNotMatch(topContent, /daily-panel-switch/);
  assert.match(topContent, /isDailyWorkOpen && \([\s\S]*?<DailyWorkPanel\b/);
  assert.match(topContent, /isInspirationOpen && \([\s\S]*?<DailyWorkPanel\b/);
  assert.doesNotMatch(header, /dateContextLabel|formattedDateLabel|header-progress-row/);
  assert.match(header, /onClick=\{calendar\.toggleCalendar\}/);
  ```

  In `scripts/verify-app-shell-composition-module.ts`, remove the `allDates` requirement from the main-content date-navigation handoff and require `language` plus `shellText.app` to reach both header/date navigator and task toolbar props.

- [ ] **Step 2: Run the affected verifiers and verify they fail.**

  Run: `npm run verify:app-top-content-module && npm run verify:app-shell-composition-module`

  Expected: FAIL because `Header` owns date context/progress and `AppTopContent` still renders the permanent daily-panel switch.

- [ ] **Step 3: Implement the product-only Header and one shared controller.**

  Remove `formatDateLabel`, `getLocalDateKey`, `dateContextLabel`, `formattedDateLabel`, `openCount`, and the entire `.header-progress-row` from `Header.tsx`. Retain `completedCount` and `totalCount` only for `useCompletionCelebration`. Add `calendar: DateNavigatorCalendarController` and localized app text to `HeaderProps`; render `Daily Todo` as the sole heading. Preserve workspace/folder, selected-note, and theme buttons. Insert calendar between note and theme as an icon-only button:

  ```tsx
  <motion.button type="button" whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}
    onClick={calendar.toggleCalendar} className="header-icon-button"
    aria-label={text.openCalendar} title={text.openCalendar} aria-expanded={calendar.isCalendarOpen}>
    <CalendarIcon aria-hidden="true" />
  </motion.button>
  ```

  Use the project's existing inline SVG style for `CalendarIcon`; do not introduce a new dependency. Every icon-only header action must keep `title` and `aria-label`.

  In `AppTopContent.tsx`, call `useDateNavigatorCalendar(headerProps.selectedDate)` once and wrap `Header` plus `DateNavigator` with the returned `calendarRef`. Delete the `.daily-panel-switch` JSX entirely, but leave the existing two lazy `<DailyWorkPanel>` branches in place. Pass the controller into Header and DateNavigator. Do not move calendar state into `App.tsx`.

  In the two composition files, remove `allDates` from `DateNavigator` and the top-content input type, then thread `language`, `shellText.app`, and shared editor panel data through their existing prop objects. Do not change `visibleTasks`, completion callbacks, drag ordering, review props, or `AddTaskInput` wiring.

- [ ] **Step 4: Run header/top-area and workspace regression checks.**

  Run: `npm run verify:app-top-content-module && npm run verify:app-shell-composition-module && npm run verify:app-main-content-module && npm run verify:daily-work-panel-resize-hook && npm run typecheck`

  Expected: Header has only product context and four action categories, its calendar controls the shared lazy popup, daily panels remain lazy/conditional, and `TaskList` plus `AddTaskInput` remain routed via `AppMainContent`.

- [ ] **Step 5: Commit the top-area composition changes.**

  ```bash
  git add src/components/Header.tsx src/components/AppTopContent.tsx src/app/appShellMainContentComposition.tsx src/app/appShellCompositionInputs.ts scripts/verify-app-top-content-module.ts scripts/verify-app-shell-composition-module.ts
  git commit -m "feat: simplify header and share calendar state"
  ```

### Task 5: Put Search, Filter, Daily Work, and Inspiration in One Toolbar

**Files:**
- Modify: `src/components/TaskList.tsx`
- Modify: `src/components/taskList/TaskListToolbar.tsx`
- Modify: `src/app/appShellMainContentComposition.tsx`
- Modify: `scripts/verify-task-list-interactions.ts`
- Modify: `scripts/verify-app-daily-panel-presentation-module.ts`

- [ ] **Step 1: Add failing toolbar source assertions.**

  Update `scripts/verify-task-list-interactions.ts` to replace the permanent `.task-filter-button`/`.task-filter-select` expectation with the final contract:

  ```ts
  assert.match(toolbar, /task-filter-launcher/, 'Toolbar should render the icon-only filter launcher.');
  assert.match(toolbar, /aria-label=\{text\.filterTasks\}/, 'Filter launcher needs an accessible name.');
  assert.match(toolbar, /isFilterOpen && \([\s\S]*task-filter-select/, 'Existing filter controls should be expandable.');
  assert.match(toolbar, /task-daily-actions/, 'Toolbar should own the right-side daily editor group.');
  assert.match(toolbar, /onToggleDailyWorkPanel/, 'Toolbar should receive the Daily Work callback.');
  assert.match(toolbar, /onToggleInspirationPanel/, 'Toolbar should receive the Inspiration callback.');
  ```

  Update `scripts/verify-app-daily-panel-presentation-module.ts` to assert that the daily panel style/title helpers are used from `TaskListToolbar`, not `AppTopContent`, while `AppTopContent` retains only lazy panel mounts.

- [ ] **Step 2: Run the focused task-toolbar verifiers and verify they fail.**

  Run: `npm run verify:task-list-interactions && npm run verify:app-daily-panel-presentation-module`

  Expected: FAIL because filter is permanently text/select based and Daily Work/Inspiration live in the top area.

- [ ] **Step 3: Implement icon launchers and larger toolbar editor actions.**

  Add these props to `TaskList` and forward them unchanged to `TaskListToolbar`: `text`, `hasDailyWorkContent`, `hasDailyInspirationContent`, `isDailyWorkOpen`, `isInspirationOpen`, `onToggleDailyWorkPanel`, and `onToggleInspirationPanel`. Add the corresponding fields to `taskListProps` in `appShellMainContentComposition.tsx`, reusing the existing `appUiActions` callbacks so opening one editor still closes the other.

  In `TaskListToolbar.tsx`, keep search as the left icon-only button, with `title={text.searchTasks}`, `aria-label={text.searchTasks}`, and `aria-pressed={searchOpen}`. Add local `isFilterOpen` state and an icon-only funnel launcher:

  ```tsx
  <button type="button" className={`task-tool-icon task-filter-launcher ${isFilterOpen || filtersActive ? 'task-tool-active' : ''}`}
    onClick={() => setIsFilterOpen((open) => !open)} title={text.filterTasks}
    aria-label={text.filterTasks} aria-pressed={isFilterOpen}>
    <FilterIcon aria-hidden="true" />
  </button>
  ```

  Render open-only, priority select, and clear button only inside `{isFilterOpen && <div className="task-filter-controls">...</div>}`. Keep `isPriorityFilter(event.target.value)` before updating the priority filter. A nonempty search/open-only/priority filter must keep the funnel visibly active; clear remains available when the filter controls are open.

  Add the right-aligned toolbar group:

  ```tsx
  <div className="task-daily-actions">
    <button type="button" className={`task-daily-action ${getDailyPanelTabClassName(hasDailyWorkContent, isDailyWorkOpen)}`}
      onClick={onToggleDailyWorkPanel} aria-pressed={isDailyWorkOpen}
      title={getDailyPanelTabTitle(text.editDailyWork, hasDailyWorkContent)}>
      {text.dailyWork}{hasDailyWorkContent && <span className="daily-panel-dot" aria-hidden="true" />}
    </button>
    <button type="button" className={`task-daily-action ${getDailyPanelTabClassName(hasDailyInspirationContent, isInspirationOpen)}`}
      onClick={onToggleInspirationPanel} aria-pressed={isInspirationOpen}
      title={getDailyPanelTabTitle(text.editInspiration, hasDailyInspirationContent)}>
      {text.inspiration}{hasDailyInspirationContent && <span className="daily-panel-dot" aria-hidden="true" />}
    </button>
  </div>
  ```

  Give both visible action buttons matching `aria-label`s. Keep the existing search input branch under the row, and add the filter expansion beneath the same row so narrow widths never displace the primary task controls.

- [ ] **Step 4: Run task-workspace regression checks.**

  Run: `npm run verify:task-list-interactions && npm run verify:app-daily-panel-presentation-module && npm run verify:app-main-content-module && npm run verify:daily-work-panel-resize-hook && npm run typecheck`

  Expected: search/filter have icon-only launchers, actual filtering/search behavior remains wired, the daily actions live in the task toolbar, and the two editor panels still mount only while open.

- [ ] **Step 5: Commit the toolbar migration.**

  ```bash
  git add src/components/TaskList.tsx src/components/taskList/TaskListToolbar.tsx src/app/appShellMainContentComposition.tsx scripts/verify-task-list-interactions.ts scripts/verify-app-daily-panel-presentation-module.ts
  git commit -m "feat: move daily editor actions into task toolbar"
  ```

### Task 6: Localize and Style the Approved Compact Presentation

**Files:**
- Modify: `src/i18n/shellTextZh.ts`
- Modify: `src/i18n/shellTextEn.ts`
- Modify: `src/styles/globals.css`
- Modify: `scripts/verify-i18n-shell-text-module.ts`
- Modify: `scripts/verify-compact-day-strip.ts`

- [ ] **Step 1: Add failing localization and visual-contract checks.**

  Extend `scripts/verify-i18n-shell-text-module.ts` to require matching app keys: `openCalendar`, `closeCalendar`, `selectDate`, `previousMonth`, `nextMonth`, `searchTasks`, `filterTasks`, `clearFilters`, `openCount`, `overdueCount`, `completionPercent`, `completionRatio`, and all five status labels. Assert English values include `Open calendar`, `{count} in progress`, and `{completed}/{total}`; assert Chinese has nonempty matching fields.

  Create `scripts/verify-compact-day-strip.ts` that reads components/CSS and contains:

  ```ts
  assert.match(styles, /--compact-day-empty-text:/);
  assert.match(styles, /--compact-day-overdue-dot:/);
  assert.match(styles, /\.compact-day-summary\s*\{[\s\S]*height:\s*34px/);
  assert.match(styles, /\.compact-day-progress-track\s*\{[\s\S]*height:\s*24px/);
  assert.match(styles, /\.compact-day-strip-day\[data-status='overdue'\]/);
  assert.doesNotMatch(stripUtils, /\b3\b\s*\|\s*5\s*\|\s*7|return 3|count:\s*3/);
  assert.doesNotMatch(header, /dateContextLabel|header-progress-row/);
  ```

- [ ] **Step 2: Run the checks and verify they fail before copy/style work.**

  Run: `npm run verify:i18n-shell-text-module && npm run verify:compact-day-strip`

  Expected: FAIL because the new localized fields, compact token family, geometry, and verifier command have not yet been added.

- [ ] **Step 3: Add matching locale text and scoped visual rules.**

  Add the new app keys to `shellTextZh.ts`; make `shellTextEn.ts` satisfy the exact Chinese shape. Use template values equivalent to:

  ```ts
  // English examples
  openCount: '{count} in progress', overdueCount: '{count} overdue',
  completionPercent: '{percentage}%', completionRatio: '{completed}/{total}',
  searchTasks: 'Search tasks', filterTasks: 'Filter tasks', clearFilters: 'Clear filters',
  status: { futureEmpty: 'No tasks', incompletePast: 'Incomplete past work', done: 'Completed', activeOpen: 'Open tasks', overdue: 'Overdue' },
  ```

  Append an isolated compact block near the latest date/task toolbar rules in `globals.css`; do not reorganize unrelated theme rules. Define light defaults and `.dark .app-shell` overrides for the approved low-saturation status tokens, including the specified dark values:

  ```css
  --compact-day-empty-text: #777c83;
  --compact-day-empty-dot: #575c61;
  --compact-day-past-text: #c4c7cc;
  --compact-day-past-dot: #8f949b;
  --compact-day-done-text: #73c69a;
  --compact-day-done-dot: #65bd90;
  --compact-day-open-text: #d2b07a;
  --compact-day-open-dot: #c9a56d;
  --compact-day-overdue-text: #dd7777;
  --compact-day-overdue-dot: #d26868;
  --compact-day-selected-frame: #5c6066;
  --compact-day-selected-surface: #2a2d31;
  --compact-day-selected-label: #8fb8ff;
  ```

  Use `grid-template-columns: repeat(var(--compact-day-count), minmax(0, 1fr))` for day cells, set `--compact-day-count` from `[data-day-count='5']` and `[data-day-count='7']`, and keep `min-width: 0`. Style selected cells through `[aria-current='date']` without changing status-dot colors. Set `.compact-day-summary { height: 34px; }` and `.compact-day-progress-track { height: 24px; }`; keep fill/ratio in one clipped dark track. The white fill is proportional, uses a short minimum only when completion is nonzero, and places percentage text inside it.

  Give `.task-toolbar-row` a left tool group and right `.task-daily-actions` group, make `.task-daily-action` visibly larger than `.task-tool-icon`, and keep action text on a stable single line. Style `.task-filter-controls` and `.task-search-input` as expandable content below the row. Add visible `:focus-visible` outlines for all new controls. Do not use gradients, neon, a third responsive strip level, or unrelated page/card restyling.

- [ ] **Step 4: Run localized presentation checks.**

  Run: `npm run verify:i18n-shell-text-module && npm run verify:compact-day-strip && npm test -- --run tests/compactDayStripUtils.test.ts tests/compactDayStrip.dom.test.tsx && npm run typecheck`

  Expected: all commands exit `0`; CSS proves 34px/24px geometry, source has no 3-day mode, default locale remains Chinese, and English is selected only through the existing language setting.

- [ ] **Step 5: Commit the localization and visual contract.**

  ```bash
  git add src/i18n/shellTextZh.ts src/i18n/shellTextEn.ts src/styles/globals.css scripts/verify-i18n-shell-text-module.ts scripts/verify-compact-day-strip.ts
  git commit -m "feat: style and localize compact day workspace"
  ```

### Task 7: Register Guardrails and Complete Integration Verification

**Files:**
- Modify: `package.json`
- Modify: `scripts/verify-cleanup-core.ts`
- Modify: `scripts/verify-compact-day-strip.ts`
- Modify: `scripts/verify-date-navigator-module.ts`
- Modify: `scripts/verify-app-top-content-module.ts`
- Modify: `scripts/verify-app-shell-composition-module.ts`
- Modify: `scripts/verify-app-main-content-module.ts`

- [ ] **Step 1: Add the failing cleanup-core inclusion assertion.**

  In `scripts/verify-compact-day-strip.ts`, import `assertCleanupCoreIncludes` from `./verifyCleanupCore` and add:

  ```ts
  assertCleanupCoreIncludes(
    'verify:compact-day-strip',
    'cleanup-core should include the compact day strip verifier.',
  );
  ```

  Add the package script before registering it in cleanup-core:

  ```json
  "verify:compact-day-strip": "tsx scripts/verify-compact-day-strip.ts"
  ```

- [ ] **Step 2: Run the compact verifier and verify cleanup registration fails.**

  Run: `npm run verify:compact-day-strip`

  Expected: FAIL stating that `verify:cleanup-core` does not include `verify:compact-day-strip`.

- [ ] **Step 3: Register the verifier and align every stale source expectation.**

  Insert `"verify:compact-day-strip"` immediately after `"verify:date-navigator-module"` in `cleanupCoreCommands` in `scripts/verify-cleanup-core.ts`. Ensure the modified source verifiers assert the final contract instead of legacy markup:

  ```ts
  assert.doesNotMatch(navigator, /date-stepper|date-today-button|date-current/);
  assert.doesNotMatch(topContent, /daily-panel-switch/);
  assert.doesNotMatch(header, /header-progress-row|dateContextLabel/);
  assert.match(mainContent, /<TaskList \{\.\.\.taskListProps\} \/>/);
  assert.match(mainContent, /<AddTaskInput \{\.\.\.addTaskInputProps\} \/>/);
  ```

  Keep existing verifiers for lazy calendar import, lazy daily panels, task-list filtering, drag behavior, review, and composer wiring; update only their expectations that conflict with the approved compact layout.

- [ ] **Step 4: Run focused checks, TypeScript, and the full test suite.**

  Run:

  ```powershell
  npm run verify:compact-day-strip
  npm run verify:date-navigator-module
  npm run verify:app-top-content-module
  npm run verify:app-shell-composition-module
  npm run verify:app-main-content-module
  npm run verify:app-daily-panel-presentation-module
  npm run verify:task-list-interactions
  npm run verify:i18n-shell-text-module
  npm run verify:daily-work-panel-resize-hook
  npm run typecheck
  npm test
  npm run verify:cleanup-core
  ```

  Expected: every command exits `0`. If a legacy source verifier fails, update only its expected source contract; do not restore a removed date row, permanent daily switch, or three-day mode merely to satisfy the check.

- [ ] **Step 5: Commit the registered regression guardrails.**

  ```bash
  git add package.json scripts/verify-cleanup-core.ts scripts/verify-compact-day-strip.ts scripts/verify-date-navigator-module.ts scripts/verify-app-top-content-module.ts scripts/verify-app-shell-composition-module.ts scripts/verify-app-main-content-module.ts
  git commit -m "test: guard compact day strip workspace flow"
  ```

## Acceptance Checklist

- [ ] Header shows only `Daily Todo` and workspace, note, calendar, and theme actions; it has no date context, header completion sentence, or header progress row.
- [ ] Calendar opens from Header, stays lazy, has no popup date-history row, closes on date selection, and recenters the strip.
- [ ] Wide strip is 7 days at `>= 440px`; medium and very narrow strips are both 5 days; no source, test, CSS, or UI exposes 3 days or a return-to-today control.
- [ ] Day cells keep semantic dot/status/accessibility labels and centered selected state without changing their grid width.
- [ ] Summary is 34px high with a 24px single dark progress track; `1/5` renders with `20%` in a proportional white fill and zero-task days remain stable.
- [ ] Search and filter are icon-only launchers; existing search/open-only/priority/clear behavior remains available on demand.
- [ ] Daily Work and Inspiration are larger task-toolbar actions, retain content state and mutual exclusion, and their editor panels are still lazy/conditional.
- [ ] Chinese is the default localized presentation; English uses the existing setting; all icon-only controls have labels, titles, pressed states where applicable, and visible keyboard focus.
- [ ] Task filtering, task ordering, drag-and-drop, completion review, `TaskList`, `ReviewView`, and `AddTaskInput` remain wired through `AppMainContent` without semantic changes.

## Plan Self-Review

- The plan implements the approved 7/5-only responsive behavior in Tasks 1 and 2, then explicitly guards against reintroducing 3-day or return-to-today logic in Tasks 6 and 7.
- Header simplification, calendar relocation, summary geometry/proportion, toolbar ownership, localization, accessibility, and lazy panels each have a concrete implementation task and regression check.
- File names and source boundaries match the current repository: calendar lifecycle is already a focused hook, top-content composition is already separate from `App.tsx`, and task-tool markup is already isolated in `TaskListToolbar`.
- No task changes task persistence, carry-forward, ordering, review, or Obsidian semantics. Existing dirty worktree changes remain outside all staged commit commands.
