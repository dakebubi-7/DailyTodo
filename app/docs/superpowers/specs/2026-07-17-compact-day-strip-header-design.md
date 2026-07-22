# Compact Day Strip and Task Toolbar Design

## Goal

Replace DailyTodo's vertically expensive date controls with a compact day strip and a one-line progress summary. Keep the task workspace as the main surface, move the Daily Work and Inspiration entry points beside task tools, and make the top area reliable across wide and narrow desktop-widget widths.

This design is based on the approved visual direction in `compact-day-strip-progress-reference-v9.html`:

- no header date-context text such as `Today - Friday, July 17`
- seven nearby days only when there is sufficient room
- five nearby days at every smaller width; there is no three-day mode
- a compact summary strip with a 20% / 1/5 reference presentation
- icon-only search and filter controls beside larger Daily Work and Inspiration actions

## Scope

In scope:

- Simplifying the header title and action group.
- A responsive 7-day / 5-day compact day strip above the task workflow.
- Moving the month calendar trigger into the header action group.
- Replacing the old bottom date navigator row.
- A compact selected-day summary and progress track.
- Moving Daily Work and Inspiration launch actions into the task toolbar.
- Making search and filter launchers icon-only while preserving their existing functions.
- Chinese and English copy for every new accessible label and visible string.
- Low-saturation day-status and summary styling in all supported themes.

Out of scope:

- Changes to task completion, carry-forward, persistence, ordering, review, or Obsidian-sync semantics.
- A redesign of the full month calendar beyond removing its duplicate history row and localizing it.
- A dashboard, timeline, new task-list surface, or a second set of task filters.
- A permanent `Back to today` command in the compact strip.

## Approved Layout

```text
Header
  Daily Todo
  [workspace] [open note] [calendar] [theme]

Compact day strip
  7 day buttons at wide width
  5 day buttons at medium and narrow width

Selected-day summary, one line
  4 items for progress | 1 item overdue     [20%..................1/5]

Existing tab bar

Task toolbar
  [search] [filter]                         [Daily Work] [Inspiration]
  optional expanded search input / filter controls below this row

Existing task list and composer
```

The title area contains the product name only. It must not render a contextual date label, `Today`, `Planned`, `History`, completed-count sentence, or a separate header progress row.

The header action group retains the existing workspace/folder, selected-note, and theme controls. Calendar is the fourth header action. Daily Work and Inspiration are deliberately not header actions: they belong on the task toolbar because they start focused work for the selected day.

## Date Strip Behavior

### Visible-date levels

- Use the strip container's measured width, not the browser viewport width.
- At a container width of **440px or greater**, render **7** consecutive days centered on the selected date.
- Below **440px**, render **5** consecutive days centered on the selected date.
- Never render 3 days. Do not shrink the day-button labels to create a third compact level.
- Each date change recomputes a centered day window.

The first implementation does not display a separate return-to-today control. Returning to today remains possible by selecting the day in the strip when visible or by using the month calendar. This protects the required 7/5 day count from being reduced by another control.

### Day cells

- Every visible day is a button and exposes a localized full-date and status label to assistive technology.
- The selected date has `aria-current="date"`.
- A cell shows a localized weekday label, day number, and a small semantic status dot.
- The selected styling is a compact blue frame/label overlay. It does not replace the semantic status color.
- Cells use stable grid tracks, `min-width: 0`, and deliberate label sizing so 5-day layouts do not clip or alter their width while selected.

### Month calendar

- The header calendar action opens the existing lazy-loaded month calendar.
- Selecting a calendar date updates `selectedDate`, recenters the strip, and closes the popup.
- The popup keeps its existing previous/next month navigation and click-outside behavior.
- Remove the duplicate `today + recent date` history row from the popup. The day strip is now the nearby-date control.

## Day Status System

Task-state colors remain low saturation and are communicated by text, dot, and accessible label rather than color alone.

| Status | Meaning | Dark-mode visual |
| --- | --- | --- |
| `future-empty` | Future date or no tasks | muted gray |
| `incomplete-past` | Past date with unfinished work that is not an overdue carryover | neutral gray-white |
| `done` | All visible tasks completed | soft green |
| `active-open` | Selected/current/future date with open tasks | soft amber |
| `overdue` | Date has an open carryover or earlier-primary-date task | soft red |

When a task is visible on several dates, use the existing task-date helpers and do not change task semantics. Status priority is:

1. `overdue`
2. `done`
3. `active-open`
4. `incomplete-past`
5. `future-empty`

Selected blue treatment is applied after this semantic status decision.

Suggested dark-theme values:

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

Equivalent restrained tokens must exist for light mode and theme overrides. Do not use neon, large color fills, gradients, or a separate status legend.

## Selected-Day Summary And Progress

The summary is one compact bordered row directly below the day strip.

```text
4 items for progress | 1 item overdue     [20%..................1/5]
```

- The left side shows the selected day's open count and overdue count. In Chinese: `4 项待推进 · 1 项逾期`; English uses the corresponding localized text.
- Overdue is the only warm/red summary emphasis. The normal open count is high-contrast neutral text, not blue.
- The progress region is a single uninterrupted dark track, with the completion ratio at the right edge inside the same track.
- The white progress fill contains the percentage label. For the approved reference data, it reads `20%` and the right label reads `1/5`.
- Production values are derived from `completed / total`; the fill is proportional, with only the minimum inline width needed to keep the percentage readable.
- A zero-task day shows a stable empty progress treatment and must not produce `NaN%` or a visually misleading full bar.
- Desktop summary height is **34px**; its internal progress track is **24px** high. Narrow mode keeps those heights rather than creating a thinner third variant.
- Use a restrained dark track such as `#111214`, a near-white fill such as `#f3f4f5`, and a subtle surrounding surface/border consistent with the existing dark widget.

## Task Toolbar Behavior

The existing task toolbar keeps responsibility for task search and filters. It gains the two selected-day editor launch actions.

- Search is an icon-only button. It toggles the existing search input and retains its current keyboard/input behavior.
- Filter is an icon-only funnel button. It toggles the existing open-only and priority-filter controls in an expandable toolbar region; active filters remain visibly indicated and clearable.
- The toolbar row places search and filter on the left, and Daily Work plus Inspiration on the right.
- Daily Work and Inspiration are noticeably larger primary task-toolbar buttons, not icon-only controls. They retain their existing selected/open state and content indicator.
- Activating one editor preserves the current behavior of closing the other. Editors remain lazy-loaded and do not reserve vertical space while closed.
- Search/filter/editor controls keep localized `title`, `aria-label`, `aria-pressed`, and visible focus states.

## Component And Data Ownership

1. `Header`
   - Owns product title and the workspace, note, calendar, and theme actions.
   - Receives the shared calendar controller's toggle and open state.
   - Does not own date-context text, summary content, or editor actions.

2. `CompactDayStrip`
   - Receives selected date, tasks, language, and `onDateChange`.
   - Uses `ResizeObserver` and pure helpers for the 7/5 level and centered window.
   - Emits date selection only.

3. `DateNavigator`
   - Keeps its name to minimize surrounding churn.
   - Composes the compact strip, selected-day summary, and lazy `MonthCalendar` popup.
   - Receives the calendar controller from `AppTopContent`; it no longer creates separate popup state.

4. `AppTopContent`
   - Creates one shared calendar controller and wraps Header plus DateNavigator with its click-outside ref.
   - Mounts `DailyWorkPanel` only while either editor is open.
   - Does not render the permanent daily-panel switch.

5. `TaskList` and `TaskListToolbar`
   - Continue owning search/filter UI.
   - Receive the Daily Work and Inspiration labels, state, content indicators, and callbacks needed to render the two toolbar actions.

6. Pure helpers
   - Build 7/5 centered date windows.
   - Choose the strip level from container width.
   - Derive selected-day counts, completion percentage, and day status from the existing task/date helpers.
   - Format localized weekday, full-date, and summary labels without duplicating date-key logic.

## Language And Accessibility

- Default UI remains `zh-CN`; English appears only through the existing `en-US` setting.
- `Intl.DateTimeFormat` uses the configured locale for weekday and month labels.
- Add matching locale entries for calendar open/close, select date, previous month, next month, search, filter, Daily Work, Inspiration, open count, overdue count, completion percentage, and completion ratio.
- Icon-only buttons always have `title` and `aria-label`.
- Day buttons, calendar buttons, and task-tool buttons must be keyboard reachable with visible focus.
- Do not make tooltip text the only way to understand progress or task status.

## Testing And Acceptance Criteria

Add focused pure-function, component DOM, and source-composition checks for:

- wide container produces 7 days; both medium and very narrow containers produce 5 days
- selected date remains centered in both levels
- no source, DOM, or CSS contract retains a 3-day day-strip level
- no header date-context string or separate header progress row is rendered
- calendar action is in Header; month popup stays lazy and closes after selection
- summary calculations render `20%` and `1/5` for one completed task out of five
- summary geometry is 34px outer / 24px track and the ratio remains inside the track
- day-status priority and selected overlay are deterministic
- task-toolbar search and filter are icon-only launchers while existing search/filter behavior remains available
- Daily Work and Inspiration buttons are in the task toolbar, remain bigger than icon tools, and still open the existing lazy panels
- Chinese and English text switch only through the existing language setting
- TaskList, task filtering, drag ordering, completed review, and AddTaskInput remain wired through `AppMainContent`

The change is accepted when the default Chinese widget presents the approved compact hierarchy, shows 7 or 5 days only, displays a proportional summary track, and preserves every existing task-workspace flow.

## Explicit Rejections

- No 3-day responsive layout.
- No title such as `今天 · 7月17日星期五` in the header.
- No permanent bottom previous/today/next/date/calendar row.
- No Daily Work or Inspiration buttons in the header action group.
- No text-labeled search or filter buttons when an accessible familiar icon is available.
- No fixed-width progress badge that is unrelated to the actual completion percentage.
- No dashboard, timeline, or broad restyling unrelated to this top-area workflow.
