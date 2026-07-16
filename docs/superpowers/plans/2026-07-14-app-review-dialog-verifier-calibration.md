# App Review Dialog Verifier Calibration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update review-dialog structural verification to follow grouped overlay composition.

**Architecture:** Shell inputs assemble `overlay.reviewDialogState`, the App Shell delegates the complete overlay group, and overlay composition maps the derived task values to the two dialog prop bags. The verifier will assert this existing path rather than an obsolete inline object in the Shell facade.

**Tech Stack:** TypeScript, Node.js assertion scripts, npm, Vite.

---

### Task 1: Calibrate the Review Dialog Route Assertion

**Files:**
- Modify: `app/scripts/verify-app-review-dialog-state-module.ts:38-44`

- [ ] **Step 1: Replace the obsolete inline-overlay assertion with grouped input and delegation assertions**

```ts
assert.match(
  shellInputs,
  /overlay: \{[\s\S]*reviewDialogState,[\s\S]*\},/,
  'Shell input composition should place derived review dialog state in the overlay group.',
);
assert.match(
  shellHelper,
  /const overlayStackProps = createAppShellOverlayComposition\(overlay\);/,
  'Shell composition should delegate grouped overlay inputs unchanged to the overlay composition helper.',
);
```

- [ ] **Step 2: Preserve existing overlay dialog mapping checks**

```ts
assert.match(overlayHelper, /task: reviewDialogState\.completionTask/, 'Overlay composition should consume derived completion dialog task.');
assert.match(overlayHelper, /task: reviewDialogState\.currentReviewTask/, 'Overlay composition should consume derived current review task.');
```

- [ ] **Step 3: Run focused and aggregate checks**

Run: `npm.cmd run verify:app-review-dialog-state-module; npm.cmd run verify:cleanup-core`

Expected: the focused verifier passes and cleanup-core progresses without this stale assertion.

### Task 2: Verify and Record

**Files:**
- Modify: `app/task_plan.md`
- Modify: `app/findings.md`
- Modify: `app/progress.md`

- [ ] **Step 1: Run full phase verification**

Run: `npm.cmd run typecheck; npm.cmd run build; git diff --check`

Expected: all commands exit with code 0 and no whitespace errors.

- [ ] **Step 2: Mark Phase 507 complete only after fresh verification evidence**

```markdown
### Phase 507: App Review Dialog Verifier Calibration
- [x] Updated the review-dialog structural verifier to follow grouped overlay composition.
- [x] Verified the focused script, cleanup-core, TypeScript, build, and whitespace checks.
- **Status:** complete
```

## Plan Self-Review

- The plan covers grouped input construction, Shell delegation, both overlay dialog mappings, aggregate regressions, and final scoped verification.
- All identifiers and commands match the current implementation.
