# AI Review Report Source Collection Orchestration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the remaining weekly/monthly personal report source-collection orchestration into a focused Electron helper module without changing runtime behavior.

**Architecture:** Add `electron/aiReviewReportIpcSourceCollection.ts` as the single owner of weekly/monthly source-collection setup between preflight and shared source preparation. Weekly/monthly IPC handlers will keep preflight, stats, and report-writer callback wiring while delegating date/range-specific collection setup to the new helper.

**Tech Stack:** TypeScript, Electron main-process modules, existing AI Review source-material helpers, structural/runtime verifiers run with `tsx`.

---

### Task 1: Add the RED verifier boundary

**Files:**
- Create: `G:\Personal-AI\DailyTodo\app\scripts\verify-electron-ai-review-report-ipc-source-collection-module.ts`
- Modify: `G:\Personal-AI\DailyTodo\app\scripts\verify-electron-ai-review-weekly-report-ipc-module.ts`
- Modify: `G:\Personal-AI\DailyTodo\app\scripts\verify-electron-ai-review-monthly-report-ipc-module.ts`
- Modify: `G:\Personal-AI\DailyTodo\app\scripts\verify-cleanup-core.ts`
- Modify: `G:\Personal-AI\DailyTodo\app\package.json`

- [ ] **Step 1: Write the failing verifier script**

Create `G:\Personal-AI\DailyTodo\app\scripts\verify-electron-ai-review-report-ipc-source-collection-module.ts` so it checks:

```ts
assert.ok(existsSync(modulePath));
assert.match(moduleSource, /export function collectWeeklyReportSources\b/);
assert.match(moduleSource, /export function collectMonthlyReportSources\b/);
assert.match(weeklySource, /from '\.\/aiReviewReportIpcSourceCollection'/);
assert.match(monthlySource, /from '\.\/aiReviewReportIpcSourceCollection'/);
assert.doesNotMatch(weeklySource, /collectDailySourcesForDates\(/);
assert.doesNotMatch(monthlySource, /collectMonthlySources\(/);
```

- [ ] **Step 2: Register the verifier before implementation**

Add the script to `G:\Personal-AI\DailyTodo\app\package.json`:

```json
"verify:electron-ai-review-report-ipc-source-collection-module": "tsx scripts/verify-electron-ai-review-report-ipc-source-collection-module.ts"
```

Add it to `cleanupCoreCommands` in `G:\Personal-AI\DailyTodo\app\scripts\verify-cleanup-core.ts` immediately before:

```ts
"verify:electron-ai-review-report-ipc-source-preparation-module",
```

Update weekly/monthly verifiers so they now require helper usage instead of inline source-collection code.

- [ ] **Step 3: Run the new RED check**

Run:

```powershell
npm run verify:electron-ai-review-report-ipc-source-collection-module
```

Expected: FAIL because `G:\Personal-AI\DailyTodo\app\electron\aiReviewReportIpcSourceCollection.ts` does not exist yet and weekly/monthly still keep inline collection logic.

### Task 2: Extract the source-collection helper

**Files:**
- Create: `G:\Personal-AI\DailyTodo\app\electron\aiReviewReportIpcSourceCollection.ts`
- Modify: `G:\Personal-AI\DailyTodo\app\electron\aiReviewWeeklyReportIpc.ts`
- Modify: `G:\Personal-AI\DailyTodo\app\electron\aiReviewMonthlyReportIpc.ts`

- [ ] **Step 1: Write the shared helper skeleton**

In `G:\Personal-AI\DailyTodo\app\electron\aiReviewReportIpcSourceCollection.ts`, add the internal orchestration helper:

```ts
function collectPreparedReportSources<RawSource, PreparedSource>({
  collect,
  mapSource,
}: {
  collect(): RawSource[];
  mapSource(source: RawSource): PreparedSource;
}): { prepareStartedAt: number; sources: PreparedSource[] } {
  const prepareStartedAt = Date.now();
  return {
    prepareStartedAt,
    sources: collect().map(mapSource),
  };
}
```

- [ ] **Step 2: Implement the weekly adapter**

Add `collectWeeklyReportSources(...)` with this behavior:

```ts
const selected = getDateKey(date);
const { monday, dates: weekDates } = getWeekDates(selected);
const { prepareStartedAt, sources: dailyContents } = collectPreparedReportSources({
  collect: () =>
    weeklySourceMode === 'manual-files'
      ? []
      : collectDailySourcesForDates({
          vaultPath,
          dates: weekDates,
          rules: getDailySourceRules(),
        }),
  mapSource: (source) => ({ date: source.date, content: source.content }),
});
return { prepareStartedAt, selected, monday, weekDates, dailyContents };
```

- [ ] **Step 3: Implement the monthly adapter**

Add `collectMonthlyReportSources(...)` with this behavior:

```ts
const month = monthKey(getDateKey(date));
const { first, last } = getMonthDates(month);
const { prepareStartedAt, sources } = collectPreparedReportSources({
  collect: () =>
    collectMonthlySources({
      vaultPath,
      month,
      weeklyDir: sanitizeRelDir(weeklyDir, DEFAULT_REPORT_DIRS.weekly),
      dailyRules: getDailySourceRules(),
      mode: monthlySourceMode,
    }),
  mapSource: (source) => ({ label: source.label, content: source.content }),
});
return { prepareStartedAt, month, first, last, sources };
```

- [ ] **Step 4: Rewire the weekly IPC module**

Replace the inline collection block in `G:\Personal-AI\DailyTodo\app\electron\aiReviewWeeklyReportIpc.ts` with:

```ts
const { prepareStartedAt, selected, monday, weekDates, dailyContents } = collectWeeklyReportSources({
  date,
  vaultPath,
  weeklySourceMode: settings.weeklySourceMode,
  getDateKey,
  getDailySourceRules,
});
```

Keep `prepareReportSources(...)`, `computeRangeStats(...)`, and `generatePersonalWeekly(...)` behavior unchanged.

- [ ] **Step 5: Rewire the monthly IPC module**

Replace the inline collection block in `G:\Personal-AI\DailyTodo\app\electron\aiReviewMonthlyReportIpc.ts` with:

```ts
const { prepareStartedAt, month, first, last, sources } = collectMonthlyReportSources({
  date,
  vaultPath,
  weeklyDir: settings.weeklyDir,
  monthlySourceMode: settings.monthlySourceMode,
  getDateKey,
  getDailySourceRules,
});
```

Keep `prepareReportSources(...)`, `computeRangeStats(...)`, and `generatePersonalMonthly(...)` behavior unchanged.

### Task 3: Verify runtime behavior and update planning files

**Files:**
- Modify: `G:\Personal-AI\DailyTodo\app\task_plan.md`
- Modify: `G:\Personal-AI\DailyTodo\app\progress.md`
- Modify: `G:\Personal-AI\DailyTodo\app\findings.md`

- [ ] **Step 1: Run the focused verifier after implementation**

Run:

```powershell
npm run verify:electron-ai-review-report-ipc-source-collection-module
```

Expected: PASS

- [ ] **Step 2: Run the related module verifiers**

Run:

```powershell
npm run verify:electron-ai-review-weekly-report-ipc-module
npm run verify:electron-ai-review-monthly-report-ipc-module
npm run verify:electron-ai-review-report-ipc-source-preparation-module
```

Expected: PASS for all three commands

- [ ] **Step 3: Run the broader gates**

Run:

```powershell
npm run verify:cleanup-core
npm run typecheck
npm run build
```

Expected: PASS for all three commands

- [ ] **Step 4: Update the planning files**

Record the new Phase 158 work in:

- `G:\Personal-AI\DailyTodo\app\task_plan.md`
- `G:\Personal-AI\DailyTodo\app\progress.md`
- `G:\Personal-AI\DailyTodo\app\findings.md`

Capture:

- the new helper module
- the updated weekly/monthly boundaries
- the fresh verification results
