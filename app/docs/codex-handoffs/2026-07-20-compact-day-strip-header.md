# DailyTodo Compact Day Strip Header Handoff

## Reactivation Prompt

We are continuing the DailyTodo compact day strip header work. Read this handoff first, then inspect the current app and the two documents under `docs/superpowers/`. Verify the current repository state before making changes. Do not modify unrelated files.

## Project

- Project: repository root
- Goal: Implement the approved compact day-strip header and task workspace layout.
- Status: Design and implementation plan are complete. Application source code has not been changed yet.

## Design Decisions

- Keep the header limited to Daily Todo, workspace, notes, calendar, and theme controls.
- Day strip shows 7 days at widths of 440px or more, and 5 days at every narrower width. Never show a 3-day mode.
- Do not add a separate return-to-today button.
- The calendar entry belongs in the header. Choosing a date returns the visual focus to the day strip.
- Move Daily Work and Inspiration to the right side of the task toolbar as larger text buttons.
- Make Search and Filter icon buttons. Filter expands the existing filter controls.
- Put the progress summary below the day strip. Use a 34px outer control with a 24px dark continuous track, a white proportional fill containing the percentage, and the completion fraction on the remaining track.
- The approved example progress copy is `20% · 1/5`.

## Durable Project Documents

- `docs/superpowers/specs/2026-07-17-compact-day-strip-header-design.md`
- `docs/superpowers/plans/2026-07-17-compact-day-strip-task-workspace.md`

## Visual Explorations

The visual HTML explorations were migrated from the accidental Universe Federation Organization workspace to:

- `.superpowers/migrated-from-universe-federation/2026-07-20/`

They are design references only. They are not application source files and should not be treated as implementation code.

## Constraints

- Follow the seven implementation tasks in the existing plan using TDD and focused verification.
- Preserve unrelated working-tree changes.
- Do not bring back rejected variants: 3-day mode, Daily Work/Inspiration inside the header, return-to-today button, or the prior header progress treatment.

## Next Steps

1. Inspect the current DailyTodo application structure and its existing test setup.
2. Locate the header, day strip, task toolbar, calendar selection, and progress components.
3. Execute the existing implementation plan task by task, starting with failing focused tests.
4. Verify responsive 7-day and 5-day behavior, including the narrow viewport case.
5. Render and visually review the final task workspace at desktop and narrow widths.
