# AI Review Report Source Collection Orchestration Design

Date: 2026-07-08

## Goal

Continue the DailyTodo cleanup by removing the remaining weekly/monthly personal report source-collection duplication from the Electron AI Review IPC layer without changing runtime behavior, progress messages, diagnostics, or report outputs.

## Scope

This pass extracts only the range-specific source-collection orchestration that still lives inline in:

- `G:\Personal-AI\DailyTodo\app\electron\aiReviewWeeklyReportIpc.ts`
- `G:\Personal-AI\DailyTodo\app\electron\aiReviewMonthlyReportIpc.ts`

The extraction includes:

- prepare-start timing for source collection
- weekly selected-date normalization and week-date expansion
- monthly selected-date normalization and month-range expansion
- source collector invocation
- raw-source to prepared-source mapping for the later shared `prepareReportSources(...)` step

This pass does not change:

- preflight behavior in `aiReviewReportIpcPreflight.ts`
- source-preparation behavior in `aiReviewReportIpcSourcePreparation.ts`
- stats calculation
- report writer callbacks
- source selection semantics for `manual-files`, `weekly-reports`, or `weekly-then-daily`
- progress/diagnostic copy

## Current State

After Phase 157, weekly/monthly report IPC handlers are already much thinner and share:

1. preflight
2. source preparation
3. execution/finalization

The largest repeated block still left between the two handlers is the source-collection setup that happens between preflight success and shared source preparation:

- weekly:
  - `const prepareStart = Date.now()`
  - `const selected = getDateKey(date)`
  - `getWeekDates(selected)`
  - `settings.weeklySourceMode === 'manual-files' ? [] : collectDailySourcesForDates(...).map(...)`

- monthly:
  - `const prepareStart = Date.now()`
  - `const month = monthKey(getDateKey(date))`
  - `getMonthDates(month)`
  - `collectMonthlySources(...).map(...)`

The business rules are not identical, so forcing both report kinds through one large generic collector would be brittle. The shared opportunity is the orchestration shape, not the exact collection expressions.

## Approach

Create a new module:

- `G:\Personal-AI\DailyTodo\app\electron\aiReviewReportIpcSourceCollection.ts`

This module will expose:

1. a small internal generic helper that captures the shared orchestration skeleton:
   - stamp `prepareStartedAt`
   - invoke a collector callback
   - map the raw collector result into the reduced source-content shape needed by downstream report IPC helpers

2. two focused exported adapters:
   - `collectWeeklyReportSources(...)`
   - `collectMonthlyReportSources(...)`

### Weekly adapter responsibility

`collectWeeklyReportSources(...)` will own:

- `selected = getDateKey(date)`
- `getWeekDates(selected)`
- `manual-files` short-circuit to `[]`
- `collectDailySourcesForDates(...)`
- mapping to `{ date, content }`

It will return:

- `prepareStartedAt`
- `selected`
- `monday`
- `weekDates`
- `dailyContents`

### Monthly adapter responsibility

`collectMonthlyReportSources(...)` will own:

- `month = monthKey(getDateKey(date))`
- `getMonthDates(month)`
- `collectMonthlySources(...)`
- mapping to `{ label, content }`

It will return:

- `prepareStartedAt`
- `month`
- `first`
- `last`
- `sources`

### Why this boundary

This keeps the abstraction honest:

- weekly/monthly still control their own date/range identity and report-writer arguments
- the new helper owns the remaining source-collection setup and mapping boilerplate
- `prepareReportSources(...)` stays responsible only for post-collection source summarization/progress/failure handling

The result should make weekly/monthly handlers read more like:

1. preflight
2. collect range-specific sources through one helper module
3. shared source preparation
4. stats
5. execute report generation

## Verification

Add:

- `G:\Personal-AI\DailyTodo\app\scripts\verify-electron-ai-review-report-ipc-source-collection-module.ts`
- `verify:electron-ai-review-report-ipc-source-collection-module` in `G:\Personal-AI\DailyTodo\app\package.json`

The verifier should check that:

- the new source-collection module exists
- it exports the two focused adapters and the shared orchestration boundary
- weekly/monthly import and use the new helper module
- weekly/monthly no longer keep the old inline source-collection blocks
- weekly `manual-files` behavior is preserved
- monthly `collectMonthlySources(...)` wiring is preserved
- prepare-start timing and returned range/source payloads stay unchanged

Then run focused and broader verification:

- `npm run verify:electron-ai-review-report-ipc-source-collection-module`
- `npm run verify:electron-ai-review-weekly-report-ipc-module`
- `npm run verify:electron-ai-review-monthly-report-ipc-module`
- `npm run verify:cleanup-core`
- `npm run typecheck`
- `npm run build`

## Non-Goals

- No change to source file reading rules
- No merge of weekly/monthly stats logic
- No change to report prompt selection
- No change to output directory fallback logic
- No cleanup of mojibake or user-facing copy in this pass

## Risks And Mitigations

| Risk | Mitigation |
|------|------------|
| Over-generalizing weekly and monthly into one opaque helper | Keep a tiny shared skeleton plus two explicit adapters instead of one giant generic function. |
| Losing report-kind-specific range values | Return `selected/monday/weekDates` for weekly and `month/first/last` for monthly explicitly. |
| Breaking manual-files behavior | Freeze it in the new focused verifier and keep the weekly adapter branch explicit. |
| Moving too much into source preparation | Keep `prepareReportSources(...)` untouched so the new boundary stays limited to collection orchestration only. |
