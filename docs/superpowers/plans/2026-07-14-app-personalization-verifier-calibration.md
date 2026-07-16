# App Personalization Verifier Calibration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the personalization structural verifier to follow the grouped App Shell main-content composition route.

**Architecture:** `appShellCompositionInputs.ts` creates grouped composition inputs, `appShellComposition.tsx` delegates the `mainContent` group, and `appShellMainContentComposition.tsx` maps the dark-mode action to Header. The verifier will assert each owner in that route instead of requiring the shell facade to retain obsolete flat wiring.

**Tech Stack:** TypeScript, Node.js assertion scripts, npm, Vite production build.

---

## File Structure

- Modify: `app/scripts/verify-app-personalization-module.ts` - replace the stale flat-shell dark-mode assertion with grouped-route assertions.
- Modify: `app/task_plan.md` - record Phase 506 completion and verification.
- Modify: `app/findings.md` - record the calibrated ownership boundary.
- Modify: `app/progress.md` - record focused and aggregate regression results.

### Task 1: Replace the Stale Flat-Shell Assertion

**Files:**
- Modify: `app/scripts/verify-app-personalization-module.ts:143-146`

- [ ] **Step 1: Add a route assertion for grouped input construction**

```ts
assert.match(
  shellInputs,
  /mainContent: \{[\s\S]*toggleDarkModeAction: appPersonalizationActions\.toggleDarkModeAction,[\s\S]*\},/,
  'Shell input composition should place the dark-mode toggle action in the main-content group.',
);
```

- [ ] **Step 2: Replace the obsolete facade assertion with delegation coverage**

```ts
assert.match(
  shellHelper,
  /const mainContentProps = createAppShellMainContentComposition\(mainContent\);/,
  'Shell composition should delegate grouped main-content inputs unchanged to the main-content composition helper.',
);
```

- [ ] **Step 3: Run the focused verifier to establish the intended result**

Run: `npm.cmd run verify:app-personalization-module`

Expected: `App personalization helper verification passed`.

### Task 2: Verify the Calibration Across the Cleanup Suite

**Files:**
- Modify: `app/scripts/verify-app-personalization-module.ts:143-151`

- [ ] **Step 1: Retain the Header mapping assertion**

```ts
assert.match(
  mainContentComposition,
  /const headerProps = \{[\s\S]*onToggleDark: toggleDarkModeAction,[\s\S]*\};/,
  'Header dark-mode toggle should flow through the main-content composition header prop bag.',
);
```

- [ ] **Step 2: Run focused and aggregate verification**

Run: `npm.cmd run verify:app-personalization-module; npm.cmd run verify:cleanup-core`

Expected: the focused verifier and every cleanup-core subcheck exit with code 0.

- [ ] **Step 3: Run type, build, and whitespace verification**

Run: `npm.cmd run typecheck; npm.cmd run build; git diff --check`

Expected: all commands exit with code 0 and the whitespace check reports no errors.

### Task 3: Record the Completed Calibration

**Files:**
- Modify: `app/task_plan.md`
- Modify: `app/findings.md`
- Modify: `app/progress.md`

- [ ] **Step 1: Mark the phase complete after all verification commands pass**

```markdown
### Phase 506: App Personalization Verifier Calibration
- [x] Updated the personalization structural verifier to follow grouped main-content composition.
- [x] Verified the focused script, cleanup-core, TypeScript, build, and whitespace checks.
- **Status:** complete
```

- [ ] **Step 2: Record the boundary outcome**

```markdown
- The calibration preserves the actual dark-mode route: shell inputs assemble the action in `mainContent`, App Shell delegates that group, and main-content composition maps it to Header.
```

- [ ] **Step 3: Inspect the final scoped diff**

Run: `git -C .. diff -- scripts/verify-app-personalization-module.ts task_plan.md findings.md progress.md`

Expected: only planned verifier and planning-record changes are present.

## Plan Self-Review

- Spec coverage: Task 1 checks the grouped source and delegation owner, Task 2 retains Header mapping and runs regressions, and Task 3 records the verified result.
- Placeholder scan: all code, paths, commands, and expected outputs are explicit.
- Type consistency: assertions use the current `mainContent`, `toggleDarkModeAction`, `createAppShellMainContentComposition`, and `onToggleDark` identifiers.
