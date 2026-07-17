# Compact Day Strip Header Design

## Goal

Replace the current header + bottom date navigator combination with a compact top day strip that keeps DailyTodo optimized for "execute today's tasks quickly" while still supporting nearby-day switching and full month jumps.

This redesign keeps the user's existing operational habits, reduces vertical clutter, and makes the date area responsive under narrow desktop-widget widths.

## Scope

In scope:

- Header title and progress summary layout.
- Compact nearby-day strip above the task workflow.
- Calendar entry moved into the header action group.
- Conditional "Back to today" control.
- Responsive day-count levels: 7 / 5 / 3.
- Low-saturation status colors for day cells.
- Chinese-default copy with English only after language setting switches to English.

Out of scope:

- Redesigning task list, filters, tabs, or bottom composer.
- Changing task completion semantics.
- Redesigning the full month calendar grid itself beyond reusing it as a popup.
- Introducing a multi-layer dashboard or timeline visualization.

## Approved Layout

```text
Title bar (unchanged)
Header:
  Daily Todo
  today/date label
  [workspace] [open note] [calendar] [theme]
  Compact day strip
    optional [Back to today] + visible nearby days
  Progress summary:
    open count · overdue count + mini progress + completed/total
Existing panels / tabs / filters / tasks / composer
```

Key decisions:

1. Delete the old bottom row of `previous / today / date / calendar`.
2. Do not keep any `Home/Today UI` subtitle. It is unnecessary.
3. Calendar becomes a fourth header action button.
4. The day strip is the primary nearby-date switcher.
5. Progress remains under the day strip as a compact summary bar.

## Behavior Rules

### Date window

- Always center the selected date.
- Responsive visible-day levels based on available width:
  - Wide: 7 days
  - Medium: 5 days
  - Narrow: 3 days
- When the selected date changes, recompute the window around the selected date.
- Do not horizontally squeeze seven labels into a too-narrow width; drop to 5, then 3.

### Back to today

- Hidden when selected date is today.
- Visible only when:
  - selected date is not today, and
  - current responsive level is 7-day or 5-day.
- Hidden in 3-day layout even if the user is viewing another day.
- In 3-day layout, return paths are:
  - click today's cell if visible
  - open calendar and jump to today

### Calendar

- Header calendar opens the existing month calendar popup.
- Choosing a day in the popup:
  - updates selected date
  - recenters the strip window around that date
  - closes the popup

### Language

- Default language remains Chinese.
- All new day-strip strings use the existing language setting path.
- English strings appear only after the user switches language to English in settings.
- Product name `Daily Todo` may remain as brand text.

Chinese examples:

- `今天 · 7月17日星期五`
- `回到今天`
- `4 项待推进 · 1 项逾期`
- weekday labels: `周一` ... `周日`, with selected today labeled `今天`

English examples:

- `Today · Fri, Jul 17`
- `Back to today`
- `4 in progress · 1 overdue`
- weekday labels: `Mon` ... `Sun`, with selected today labeled `Today`

## Day Status Color System

Use the approved low-saturation palette from the reference image and extend it with amber for open-but-not-overdue days.

Visual channel:

- Day number color
- Status dot color
- Selected day uses a compact bordered pill; selected is a viewing state, not a task state

Status definitions:

| Status | Meaning | Visual |
|---|---|---|
| future/empty | Future day, or day with no tasks | muted gray text + hollow/muted dot |
| incomplete-past | Past day with open tasks, not overdue by the chosen rule | neutral gray-white text + solid muted dot |
| done | All tasks for that day completed | soft green |
| active-open | Day has open tasks and is not overdue | soft amber |
| overdue | Day has at least one overdue task | soft red, highest priority |
| selected | Currently viewed day | compact selected frame + blue label/dot |

Priority when multiple statuses could apply:

1. selected viewing style is applied on top as interaction state
2. task-status priority underneath: overdue > done > active-open > incomplete-past > future/empty

Implementation notes:

- Do not flood the whole day cell with strong fill colors.
- Keep saturation low to match the current dark desktop widget aesthetic.
- Color is not the only signal; keep status dots and accessible labels/tooltips.

Suggested dark-theme tokens based on the approved preview:

- future/empty: `#777c83` / hollow `#575c61`
- incomplete-past: text `#c4c7cc`, dot `#8f949b`
- done: text `#73c69a`, dot `#65bd90`
- active-open: text `#d2b07a`, dot `#c9a56d`
- overdue: text `#dd7777`, dot `#d26868`
- selected: frame `#5c6066`, surface `#2a2d31`, label `#8fb8ff`, dot `#7aa8f7`

Light theme should use equivalent low-saturation tokens rather than pure neon colors.

## Component Architecture

Recommended structure:

1. `Header`
   - brand + date label
   - action buttons including calendar toggle
   - progress summary
2. New compact strip component, e.g. `DayStrip`
   - receives `selectedDate`, `today`, task summaries, language, and width level
   - emits `onSelectDate` and `onBackToToday`
3. Existing month calendar remains reusable from header calendar button
4. `DateNavigator` bottom control row is removed from the main surface once the strip + header calendar are live

Data dependencies already available in app:

- `selectedDate`
- task list / day summaries
- language setting
- open / completed counts for selected day

New pure helpers should cover:

- build visible day window for 7/5/3 around selected date
- derive day status from day tasks + today
- decide whether back-to-today is visible
- format header/day labels by language

## Responsive Strategy

Prefer container-width driven levels over hard viewport assumptions because this is a resizable desktop widget.

Recommended thresholds can be tuned during implementation, but the behavior contract is:

- enough width for 7 labels without clipping -> 7
- otherwise enough for 5 -> 5
- otherwise 3

When back-to-today appears, it occupies a fixed compact slot to the left of the strip and the remaining width still must satisfy the current day-count level cleanly.

## Interaction And Accessibility

- Each day cell is a button with an accessible name including full date and status.
- Selected day uses `aria-current="date"`.
- Back-to-today has an explicit accessible name.
- Keyboard:
  - left/right can move selected day if already supported by surrounding date controls; if not already present, keep first implementation click-first and preserve calendar keyboard behavior
- Do not introduce hover-only status meaning.

## Error Handling / Edge Cases

- Empty task day remains valid and shows empty/future style.
- Timezone-sensitive date keys continue using local date keys, not UTC.
- If calendar is open and window resizes, keep selected date stable; only visible strip length changes.
- If selected date is far from today, strip still centers on selected date; today may not be visible, which is acceptable.
- In 3-day mode without back-to-today, calendar remains the long-range jump path.

## Testing

Add focused pure-function and component-level verification for:

- visible day windows for 7/5/3
- centering around selected date
- back-to-today visibility matrix:
  - today + any width: hidden
  - non-today + 7/5: visible
  - non-today + 3: hidden
- status derivation:
  - empty/future
  - incomplete-past
  - done
  - active-open
  - overdue priority over other task states
- Chinese/English label switching based on language setting
- header composition:
  - calendar action present
  - bottom old date navigator removed from main surface
- narrow-width non-clipping checks for day labels

Prefer the repo's existing lightweight verification script style for pure logic, plus any current component/DOM verification patterns already used around header/date navigation.

## Acceptance Criteria

- Default Chinese UI shows the compact day strip with no `Home/Today UI` text.
- Header actions include workspace/folder, open note, calendar, and theme.
- Bottom previous/today/date/calendar navigator is gone from the main task surface.
- Day strip shows 7, then 5, then 3 days as the widget narrows, without clipped labels.
- Back to today appears only for non-today dates in 7/5 day layouts.
- Day colors follow the approved low-saturation status system.
- English labels appear only after language is switched to English in settings.
- Selecting a day from the strip or month calendar updates the selected date and recenters the strip.
- Existing task workflow under the header remains intact.

## Non-Goals / Explicit Rejections

- No tall multi-row timeline dashboard.
- No per-day percentage labels in the strip.
- No permanent Home/Today button when already viewing today.
- No back-to-today button in the 3-day layout.
- No high-saturation neon status colors.

## Migration / Rollout

This is a UI composition change on the existing selected-date model. No data migration is required.

Implementation should land as one coherent interaction change:

1. pure date-window and status helpers
2. day strip UI
3. header action/calendar move
4. remove obsolete bottom navigator from main surface
5. i18n strings
6. verification scripts/tests

## Open Implementation Details

These may be decided during implementation without changing product intent:

- exact pixel breakpoints for 7/5/3
- whether back-to-today is icon-only or icon + short text at medium width
- whether overdue is derived only from past open tasks or also high-priority carry-over semantics already present in task model

Any of those details must preserve the approved behavior matrix above.
