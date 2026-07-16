# Task Menu Verifier Calibration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the task-menu structural verifier with the shared payload-normalization boundary and restore the aggregate cleanup verification.

**Architecture:** `shared/taskMenuActionUpdates.ts` remains the owner of unknown-payload narrowing and update-field filtering. `src/app/taskMenuActions.ts` remains the owner of interpreting normalized payloads into application actions. The verifier will inspect both modules, preserving structural protection while removing requirements tied to the obsolete local guard.

**Tech Stack:** TypeScript, Node.js assertion scripts, npm, Vite production build.

---

## File Structure

- Modify: `app/scripts/verify-app-task-menu-actions-module.ts` - replace stale local-guard assertions with assertions for the shared normalizer boundary.
- Modify: `app/task_plan.md` - record Phase 505 execution and verification outcome.
- Modify: `app/findings.md` - record the verified root cause and chosen boundary checks.
- Modify: `app/progress.md` - record the TDD and regression results.

### Task 1: Add the Failing Boundary Assertions

**Files:**
- Modify: `app/scripts/verify-app-task-menu-actions-module.ts:8-39`

- [ ] **Step 1: Replace the helper-only source setup with paths and source reads for both owners**

```ts
const sharedUpdatesPath = join(root, '..', 'shared', 'taskMenuActionUpdates.ts');

assert.ok(existsSync(sharedUpdatesPath), 'Shared task-menu update normalizer should exist.');

const sharedUpdates = readFileSync(sharedUpdatesPath, 'utf8');
```

- [ ] **Step 2: Replace stale local-guard assertions with assertions that initially fail if delegation is removed**

```ts
assert.match(
  helper,
  /import \{ normalizeTaskMenuActionPayload \} from '\.\.\/\.\.\/shared\/taskMenuActionUpdates';/,
  'task menu helper should delegate unknown payload normalization to the shared helper.',
);
assert.match(
  helper,
  /const normalized = normalizeTaskMenuActionPayload\(payload\);/,
  'task menu parser should normalize forwarded runtime payloads before interpreting actions.',
);
assert.match(
  sharedUpdates,
  /import \{ isObjectRecord \} from '\.\/unknownValueGuards';/,
  'shared task-menu normalizer should reuse the shared object-record predicate.',
);
assert.match(
  sharedUpdates,
  /typeof value\.taskId !== 'string' \|\| !value\.taskId\.trim\(\)/,
  'shared task-menu normalizer should require a non-empty string taskId.',
);
assert.match(
  sharedUpdates,
  /const updates = pickTaskMenuActionUpdates\(value\.updates\);/,
  'shared task-menu normalizer should filter untrusted updates through the allowlist.',
);
```

- [ ] **Step 3: Run the focused verifier before completing the calibration**

Run: `npm.cmd run verify:app-task-menu-actions-module`

Expected: the verifier passes against the current delegated implementation once all obsolete assertions have been removed. If it fails, record the exact mismatch and revise only the assertion that does not describe current ownership.

### Task 2: Preserve Action-Parsing Coverage And Verify the Fix

**Files:**
- Modify: `app/scripts/verify-app-task-menu-actions-module.ts:20-52`

- [ ] **Step 1: Keep action-level assertions tied to the application helper**

```ts
assert.match(helper, /kind: 'addSubtask'/, 'task menu helper should normalize addSubtask actions.');
assert.match(helper, /kind: 'delete'/, 'task menu helper should normalize delete actions.');
assert.match(helper, /kind: 'edit'/, 'task menu helper should normalize edit actions.');
assert.match(helper, /kind: 'update'/, 'task menu helper should normalize ordinary task updates.');
assert.match(helper, /kind: 'noop'/, 'task menu helper should provide a no-op action for malformed runtime payloads.');
assert.match(
  helper,
  /if \(!normalized\) \{[\s\S]*return \{ kind: 'noop' \};[\s\S]*\}/,
  'task menu parser should return noop when shared normalization rejects a runtime payload.',
);
```

- [ ] **Step 2: Run the focused verifier**

Run: `npm.cmd run verify:app-task-menu-actions-module`

Expected: `app task menu action helper verification passed`

- [ ] **Step 3: Run the aggregate cleanup suite**

Run: `npm.cmd run verify:cleanup-core`

Expected: all listed cleanup checks pass, including `verify:app-task-menu-actions-module`.

- [ ] **Step 4: Run type and production verification**

Run: `npm.cmd run typecheck; npm.cmd run build; git diff --check`

Expected: all commands exit with code 0 and `git diff --check` prints no whitespace errors.

### Task 3: Record the Completed Calibration

**Files:**
- Modify: `app/task_plan.md`
- Modify: `app/findings.md`
- Modify: `app/progress.md`

- [ ] **Step 1: Mark Phase 505 complete after verification succeeds**

```markdown
### Phase 505: Task Menu Verifier Calibration
- [x] Updated the task-menu structural verifier to follow the shared payload-normalization boundary.
- [x] Verified the focused script, cleanup-core, TypeScript, build, and whitespace checks.
- **Status:** complete
```

- [ ] **Step 2: Record the outcome without claiming runtime behavior changed**

```markdown
- The calibration changed only structural assertions: shared input normalization remains in `shared/taskMenuActionUpdates.ts`, while task-menu action interpretation remains in `src/app/taskMenuActions.ts`.
- Aggregate cleanup verification now protects both sides of that boundary.
```

- [ ] **Step 3: Inspect the final diff**

Run: `git -C .. diff -- scripts/verify-app-task-menu-actions-module.ts task_plan.md findings.md progress.md`

Expected: only the planned verifier and planning-record changes are present.

## Plan Self-Review

- Spec coverage: Task 1 establishes the two-module ownership checks; Task 2 retains application-level action parsing and runs the required regressions; Task 3 records the result.
- Placeholder scan: no TBD, TODO, or unspecified test steps remain.
- Type consistency: the plan uses the current exported `normalizeTaskMenuActionPayload`, `pickTaskMenuActionUpdates`, and `isObjectRecord` identifiers from the implementation.
