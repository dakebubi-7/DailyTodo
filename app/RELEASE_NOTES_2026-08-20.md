# Release notes — August 20, 2026

## Summary

This release packages the latest DailyTodo work into a clearer AI-assisted daily execution workflow and a more reliable desktop experience.

## What changed

### AI review and integrations

- Improved custom review-block matching for legacy daily-note templates.
- Added an explicit failure result when a daily note has no writable AI review blocks.
- Added daily-review regeneration confirmation and cancellation.
- Hardened AI review runner and daily-runner result handling.
- Added tests for review generation and Electron app-state accessors.

### Account settings

- Added safe empty-state behavior when no AI account is selected.
- Guarded duplicate, activate, delete, and model-fetch actions against missing profiles.
- Added DOM coverage for the account manager and generation confirmation flow.

### Daily review interaction

- The generated review detail dialog can now be closed with **Escape**.
- Long review content scrolls inside the dialog instead of overflowing the window.
- Added regression coverage for the close and scroll interaction.

### Desktop polish

- Continued the invisible-focus and transparent/glass surface polish.
- Kept completed-task styling readable while preserving the low-distraction focus surface.

## Verification

- `npm.cmd test -- --run` — 69 test files, 272 tests passed.
- `npm.cmd run typecheck` — passed.
- `npm.cmd run build` — passed.

## Notes

The Windows installer is unsigned. SmartScreen may display a warning on first launch.
