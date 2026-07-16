# Quality, Performance, and Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve measurable renderer payload, verification feedback, domain behavior confidence, text integrity, accessibility regression protection, and Windows-native failure handling without changing supported product workflows.

**Architecture:** Keep the existing Electron/React ownership boundaries. Add narrowly scoped pure helpers and Vitest outcome tests where they create observable confidence, retain structural verifiers as composition checks, and provide thin package-script aggregates for local domains while leaving `verify:cleanup-core` intact as the release gate.

**Tech Stack:** Electron 34, React 18, TypeScript 5, electron-vite/Vite, Vitest, tsx verifier scripts, koffi.

---

## File Map

- Modify: `package.json` - add domain-focused verifier aggregates only.
- Modify/Create: `scripts/verify-build-output.ts` - report renderer asset baseline from the production HTML entry, with manifest support only when a build emits one.
- Modify/Create: `tests/obsidianSyncRequest.test.ts` - assert request errors and affected dates at the existing request-preparation boundary.
- Modify/Create: `tests/aiReviewDailyRunner.test.ts` - assert unavailable account, missing source, and diagnostic outcomes.
- Modify/Create: `tests/taskCompletionActions.test.ts` - assert completion/review state transitions including deleted-review retention.
- Modify/Create: `scripts/audit-utf8-text.ts` - scan decoded UTF-8 source data; add text tests only for confirmed repaired strings.
- Modify/Create: dialog/task interaction helpers and focused verifier/test files only after inspecting existing testable seams; do not add a browser DOM dependency unless pure/event seams cannot express the behavior.
- Modify: `electron/win32Native.ts` and its focused verifier/test - expose guarded native operations and diagnostics while retaining the supported Windows binding path.
- Modify: `task_plan.md`, `findings.md`, `progress.md` - record baselines, decisions, errors, and completion state.

## Task 1: Establish Build and Verification Baselines

**Files:**
- Create: `scripts/verify-build-output.ts`
- Modify: `package.json`
- Modify: `task_plan.md`, `findings.md`, `progress.md`

- [x] **Step 1: Record baseline production asset sizes before changing lazy boundaries or CSS.**

Run: `npm.cmd run build`

Then enumerate the main output assets with:

```powershell
Get-ChildItem dist\assets -File |
  Sort-Object Length -Descending |
  Select-Object Name, Length
```

Expected: a renderer JavaScript asset near the recorded 556.18 kB baseline and a CSS asset near 323.94 kB; write exact values to `findings.md`.

- [x] **Step 2: Write the failing build-output verifier.**

Create `scripts/verify-build-output.ts` to load the app entry from `dist/index.html` (or a Vite manifest when a build emits one), then emit a stable JSON record:

```ts
console.log(JSON.stringify({
  entry: entry.file,
  entryBytes: statSync(join(dist, entry.file)).size,
  css: css.map((file) => ({ file, bytes: statSync(join(dist, file)).size })),
}, null, 2));
```

Run: `npx tsx scripts/verify-build-output.ts`

Expected: FAIL before the script is created.

- [x] **Step 3: Implement the entry-based output report without parsing terminal build text.**

Use `readFileSync`, `statSync`, and `dist/index.html` asset references rather than filename assumptions or terminal build text. Prefer a Vite manifest when present; otherwise identify the entry JavaScript and CSS links from the production HTML. Throw a clear error when `dist` or its app entry is missing, instructing callers to run `npm.cmd run build` first.

- [x] **Step 4: Add narrow verifier aggregates.**

Add scripts following this exact composition pattern, using only existing focused commands plus the tests introduced by later tasks:

```json
"verify:obsidian": "npm run verify:electron-obsidian-sync-module && npm run verify:electron-obsidian-sync-preview-module && npm test -- --run tests/obsidianSyncRequest.test.ts tests/obsidianSync.integration.test.ts",
"verify:ai-review": "npm run verify:electron-ai-review-daily-runner-module && npm run verify:electron-ai-review-runtime-module && npm test -- --run tests/aiReviewDailyRunner.test.ts",
"verify:task-ui": "npm run verify:task-completion-actions && npm run verify:task-list-interactions && npm test -- --run tests/taskCompletionActions.test.ts",
"verify:build-output": "tsx scripts/verify-build-output.ts"
```

Do not remove commands from `verify:cleanup-core`.

- [x] **Step 5: Verify the baseline tooling.**

Run: `npm.cmd run verify:build-output`

Expected: PASS with JSON containing entry and CSS byte counts.

Run: `npm.cmd run typecheck`

Expected: PASS.

## Task 2: Add Obsidian and AI Outcome Tests

**Files:**
- Create: `tests/obsidianSyncRequest.test.ts`
- Create: `tests/obsidianSync.integration.test.ts`
- Create: `tests/aiReviewDailyRunner.test.ts`
- Modify: `electron/obsidianSync.ts` only if a test exposes an untestable or incorrect behavior
- Modify: `electron/aiReviewDailyRunner.ts` only if a test exposes an untestable or incorrect behavior

- [x] **Step 1: Write request-reader tests before changing sync behavior.**

Use `createObsidianSyncRequestReader` with injected date helpers and vault status. Cover unavailable vault, malformed task payload, selected-date normalization, and a task/review that adds affected dates. For example:

```ts
expect(read([], '2026-07-14')).toEqual({
  ok: false,
  error: 'Vault unavailable',
});
```

Run: `npm test -- --run tests/obsidianSyncRequest.test.ts`

Expected: FAIL until the test file and fixtures are present, then PASS without production behavior changes.

- [~] **Step 2: Evaluate sync orchestration outcome tests with injected helpers.**

Not added: the existing request-boundary tests cover the safe, testable seam and no orchestration injection need or behavior defect was identified. Avoided a test-only architectural change.

Exercise `createObsidianSyncHelpers` with a temporary vault and callback spies. Assert an invalid request never calls note writes, an unchanged selected note never invokes overview/AI follow-up, and a changed selected note invokes each once.

```ts
expect(runReviewForDate).not.toHaveBeenCalled();
expect(triggerOverviewUpdate).toHaveBeenCalledWith(selectedPath);
```

Run: `npm test -- --run tests/obsidianSync.integration.test.ts`

Expected: PASS; if injection is insufficient, extract only the direct orchestration dependency required by the test.

- [x] **Step 3: Write AI daily-runner diagnostic outcome tests.**

Create three fixtures: unavailable LLM, missing daily file, and a successful no-op/filled review path. Assert `finalStatus`, error text, diagnostic stages, and that no LLM call occurs when source/account preconditions fail.

```ts
expect(result).toMatchObject({ ok: false, diagnostic: { finalStatus: 'accountUnavailable' } });
expect(callLlm).not.toHaveBeenCalled();
```

Run: `npm test -- --run tests/aiReviewDailyRunner.test.ts`

Expected: PASS; correct only behavior revealed by a failing assertion.

- [x] **Step 4: Run the new domain aggregate and TypeScript checks.**

Run: `npm.cmd run verify:obsidian; npm.cmd run verify:ai-review; npm.cmd run typecheck`

Expected: all PASS.

## Task 3: Cover Task Completion Outcomes

**Files:**
- Create: `tests/taskCompletionActions.test.ts`
- Modify: `src/hooks/taskCompletionActions.ts` only if a tested transition is incorrect

- [x] **Step 1: Write completion action tests using captured state updaters.**

Inject deterministic IDs/timestamps and an in-memory `setAllTasks`. Cover main-task review append, subtask complete-without-review, review deletion rejection when confirmation is declined, and deleted-review retention when Obsidian deletion sync is disabled.

```ts
expect(task.completionReviews).toHaveLength(1);
expect(task.completedAt).toBe('2026-07-14T08:00:00.000Z');
expect(persistRetainedReviews).toHaveBeenCalledTimes(1);
```

- [x] **Step 2: Run it once before any corrective code change.**

Run: `npm test -- --run tests/taskCompletionActions.test.ts`

Expected: PASS for current intended behavior or reveal one narrow state transition defect to fix.

- [x] **Step 3: Correct only an observed state-transition defect, if any.**

Keep the handler contract unchanged: `setAllTasks` owns task-tree updates; retained-review persistence happens only when its setting requires it.

- [x] **Step 4: Run the task aggregate.**

Run: `npm.cmd run verify:task-ui; npm.cmd run typecheck`

Expected: PASS.

## Task 4: Perform a UTF-8 Text Integrity Audit

**Files:**
- Create: `scripts/audit-utf8-text.ts`
- Create/Modify: focused i18n tests or verifier only for confirmed repaired strings
- Modify: affected source strings only after the audit confirms replacement text

- [x] **Step 1: Write the audit as a byte-aware scanner.**

Read `src`, `electron`, and `shared` text files as `Buffer`, decode with `TextDecoder('utf-8', { fatal: true })`, and report only:

```ts
{ file, issue: 'invalid-utf8' | 'replacement-character' | 'mojibake-signature', line }
```

Use a small explicit signature list such as `['\uFFFD', 'Ã', 'Â', 'â']`; do not flag valid Chinese text.

- [x] **Step 2: Run the audit and classify every finding.**

Run: `npx tsx scripts/audit-utf8-text.ts`

Expected: either a clean report or a finite list with source locations. Record each result in `findings.md`; terminal glyph rendering alone is not a finding.

- [x] **Step 3: For every confirmed user-visible issue, add a narrow regression assertion and fix the literal.**

No confirmed source issue was found, so no literal fix or text-specific regression assertion was needed.

Use the current locale accessor or component-focused test. Do not rewrite a full locale module or alter correctly decoded historical content.

- [x] **Step 4: Re-run text checks and the production build.**

Run: `npx tsx scripts/audit-utf8-text.ts; npm.cmd run verify:i18n-shell-text-module; npm.cmd run build`

Expected: no audit findings and all focused checks PASS, or documented intentionally unsupported legacy data with no user-visible path.

## Task 5: Add Keyboard and Accessibility Regression Coverage

**Files:**
- Modify/Create: `tests/taskItemInteractions.test.ts` or existing focused task interaction verifier
- Modify/Create: dialog focus/escape helper tests after identifying existing seams
- Modify: `src/components/TaskItem.tsx`, `src/components/TaskCompletionDialog.tsx`, `src/components/TaskReviewDialog.tsx` only if a test exposes a behavior gap

- [x] **Step 1: Test existing pure task keyboard behavior.**

Exercise `shouldToggleTaskClusterForKey` and `stopClusterToggle` for Enter, Space, unrelated keys, and prevented propagation. Assert ARIA expansion remains tied to collapsed state through the existing focused verifier.

- [x] **Step 2: Identify the minimum DOM test surface for modal focus and Escape behavior.**

First inspect installed React test utilities and existing browserless test patterns. If no suitable DOM setup exists, extract a pure `createDialogKeyboardHandler` helper that maps `Escape` to `onClose` and ignores unrelated keys; test it in Node. Do not add a dependency merely to simulate a single key.

- [x] **Step 3: Add semantic corrections revealed by tests.**

Ensure dialog surfaces expose `role="dialog"`, `aria-modal="true"`, and an accessible label/title linkage; buttons retain specific accessible names. Keep visual classes and button behavior unchanged.

- [x] **Step 4: Run focused checks.**

Run: `npm.cmd run verify:task-list-interactions; npm.cmd run verify:task-ui; npm.cmd run typecheck`

Expected: PASS.

## Task 6: Harden Windows-Native Fallback and Diagnostics

**Files:**
- Modify: `electron/win32Native.ts`
- Modify: `scripts/verify-electron-win32-native-module.ts`
- Create: `tests/win32Native.test.ts`
- Modify: direct callers only if the returned native operation status requires explicit handling

- [x] **Step 1: Write failing tests for unsupported platforms and failing native operations.**

Refactor the pure decision logic behind injected `Win32Api` operations so tests can assert unavailable/failure results without importing Electron's runtime.

```ts
expect(applyNativeOperation(null, 'sendToBottom', handle)).toEqual({ ok: false, reason: 'native-unavailable' });
expect(diag).toHaveBeenCalledWith(expect.stringContaining('sendToBottom failed'));
```

- [~] **Step 2: Guard native operations while retaining established return contracts.**

Implemented `runWin32Operation` with operation-specific diagnostics and existing fallback return values. A structured result contract would require widening established primitive return contracts across callers, so it was deliberately deferred.

Use a discriminated result, for example:

```ts
export type Win32OperationResult =
  | { ok: true }
  | { ok: false; reason: 'not-windows' | 'native-unavailable' | 'native-operation-failed' };
```

Wrap each calling boundary with `try/catch`, return the structured result, and call `diag` with the operation name plus `String(error)`. Do not expose native error details to renderer IPC values.

- [x] **Step 3: Preserve normal Windows behavior in caller checks.**

Callers may ignore a false result only where their existing fallback behavior is already non-native; any call that previously assumed success must retain its Electron-level mode state and append diagnostics rather than throw.

- [x] **Step 4: Update the structural verifier and run both tests.**

Run: `npm test -- --run tests/win32Native.test.ts; npm.cmd run verify:electron-win32-native-module; npm.cmd run typecheck`

Expected: PASS on the current platform, including unavailable-native behavior.

## Task 7: Compare Final Output and Run Release Gates

**Files:**
- Modify: `findings.md`, `progress.md`, `task_plan.md`

- [x] **Step 1: Produce final output metrics.**

Run: `npm.cmd run build; npm.cmd run verify:build-output`

Expected: a final JSON report; compare entry/CSS byte values against Task 1 and record both absolute and percentage deltas.

- [x] **Step 2: Run all focused domain aggregates.**

Run: `npm.cmd run verify:obsidian; npm.cmd run verify:ai-review; npm.cmd run verify:task-ui`

Expected: PASS.

- [x] **Step 3: Run release gates and integrity check.**

Run: `npm.cmd run typecheck; npm.cmd run verify:cleanup-core; npm.cmd run build; git -C .. diff --check`

Expected: all commands exit 0. Preserve and report unrelated pre-existing worktree modifications rather than reverting them.

- [x] **Step 4: Update persistent records.**

Mark Phase 510 complete only after every required gate passes. Record failures with their attempted resolution; do not report an unverified performance reduction as achieved.
