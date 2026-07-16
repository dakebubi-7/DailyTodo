# Dialog Focus Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the task completion and review dialogs initial focus, Tab containment, and focus restoration without adding a browser DOM test dependency.

**Architecture:** `dialogFocus.ts` contains pure helpers accepting narrow DOM-like interfaces so Vitest can use fakes. `useDialogFocus.ts` owns the React ref and effect lifecycle; the two dialog components attach the returned ref and key handler.

**Tech Stack:** React 18 hooks, TypeScript 5, Vitest 3, Framer Motion.

---

## File Map

- Create `app/src/components/dialogFocus.ts`: focusable selection, initial focus, Tab containment, restoration.
- Create `app/src/components/useDialogFocus.ts`: React ref/effect lifecycle wrapper.
- Create `app/tests/dialogFocus.test.ts`: fake-element behavior tests.
- Modify `app/src/components/TaskCompletionDialog.tsx` and `app/src/components/TaskReviewDialog.tsx`: attach the hook.
- Modify `app/task_plan.md`, `app/findings.md`, and `app/progress.md`: final records.

## Task 1: Establish Pure Focus Behavior

**Files:** `app/tests/dialogFocus.test.ts`, `app/src/components/dialogFocus.ts`

- [ ] **Step 1: Add failing helper tests.** Create fake focusable and dialog factories, then test: first enabled control receives initial focus; an empty dialog focuses its container; Tab from the last element wraps to the first; Shift+Tab from the first wraps to the last; Tab from an interior element is not prevented; restoration skips disconnected triggers.

- [ ] **Step 2: Confirm RED.** Run `npm.cmd test -- --run tests/dialogFocus.test.ts`. Expected: failure because the `dialogFocus` module does not exist.

- [ ] **Step 3: Implement minimal helper contracts.** Export `DialogFocusableElement`, `DialogFocusContainer`, and `DialogTabEvent`, plus `getDialogFocusableElements`, `focusDialog`, `handleDialogTabKeyDown`, and `restoreDialogFocus`. Query enabled buttons, links, inputs, selects, textareas, and non-negative tabindex elements. Filter disabled elements; focus the first result or dialog fallback; only prevent Tab at the first/last boundaries or when no controls exist; restore only a connected focusable trigger.

- [ ] **Step 4: Confirm GREEN.** Run `npm.cmd test -- --run tests/dialogFocus.test.ts`. Expected: every helper behavior test passes.

## Task 2: Connect React Dialog Lifecycle

**Files:** `app/src/components/useDialogFocus.ts`, `app/src/components/TaskCompletionDialog.tsx`, `app/src/components/TaskReviewDialog.tsx`, `app/tests/dialogFocus.test.ts`

- [ ] **Step 1: Add a failing source-level hook adoption test.** Read both dialog sources and require the exact import `import { useDialogFocus } from './useDialogFocus'` and the call fragment `const { dialogRef, handleKeyDown } = useDialogFocus`.

- [ ] **Step 2: Confirm RED.** Run `npm.cmd test -- --run tests/dialogFocus.test.ts`. Expected: failure because neither dialog adopts the hook.

- [ ] **Step 3: Implement `useDialogFocus`.** Use dialog and previous-focus refs. In a mount-only effect, capture `document.activeElement` if it is an `HTMLElement`, focus the current dialog through `focusDialog`, and restore the captured element on cleanup. The key handler delegates to `handleDialogTabKeyDown` before existing `handleDialogKeyDown` Escape behavior.

- [ ] **Step 4: Attach the hook.** In `TaskCompletionDialog`, call `useDialogFocus(onCancel)`; in `TaskReviewDialog`, call `useDialogFocus(onClose)`. Attach `ref={dialogRef}` and `onKeyDown={handleKeyDown}` to each current `motion.div`. Remove direct `handleDialogKeyDown` imports without changing visual classes, ARIA attributes, callbacks, or task guards.

- [ ] **Step 5: Verify focused behavior.** Run `npm.cmd test -- --run tests/dialogFocus.test.ts tests/dialogKeyboard.test.ts`, then `npm.cmd run typecheck`, then `npm.cmd run verify:task-ui`. Expected: all pass.

## Task 3: Record And Release-Verify

**Files:** `app/task_plan.md`, `app/findings.md`, `app/progress.md`

- [ ] **Step 1: Update records.** Replace the Phase 510 residual focus-management note with delivered first-control/container focus, Tab containment, and connected-trigger restoration. Record no DOM dependency was added and the worktree remains uncommitted.

- [ ] **Step 2: Run release gates.** Run `npm.cmd run typecheck`, `npm.cmd run verify:task-ui`, `npm.cmd run verify:cleanup-core`, `npm.cmd run build`, and `git -C .. diff --check`. Expected: every command exits 0.

- [ ] **Step 3: Inspect without staging or committing.** Run `git -C .. status --short` and `git -C .. diff --stat`. Expected: existing unrelated changes remain present; no file is staged and no commit is created.

## Self-Review

- The plan covers every accepted behavior: initial focus, empty fallback, Tab boundaries, restoration, Escape coexistence, and release verification.
- No production implementation occurs before an observed failing test.
- No browser test dependency, modal stacking coordination, or unrelated UI changes are in scope.
