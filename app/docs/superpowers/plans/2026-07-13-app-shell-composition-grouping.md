# App Shell Composition Grouping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Group App Shell composition inputs by rendered region while preserving the existing public factory and output contracts.

**Architecture:** Move the flat options contract into title-bar, main-content, and overlay input groups in `appShellCompositionTypes.ts`. Build and consume the groups at the two existing composition boundaries, leaving component prop construction and external factory calls behaviorally unchanged.

**Tech Stack:** TypeScript, React component prop inference, Node `assert` structural verifiers, `tsx`, Electron Vite.

---

### Task 1: Add The Failing Grouping Verifier

**Files:**
- Create: `scripts/verify-app-shell-composition-grouping.ts`
- Modify: `package.json`
- Modify: `scripts/verify-cleanup-core.ts`

- [ ] Create a structural verifier for grouped contracts, grouped input assembly, and grouped factory delegation.
- [ ] Add `"verify:app-shell-composition-grouping": "tsx scripts/verify-app-shell-composition-grouping.ts"` to `package.json` and register it in cleanup-core.
- [ ] Run `npm.cmd run verify:app-shell-composition-grouping` and confirm it fails because the grouped contracts do not exist yet.

### Task 2: Group The App Shell Composition Contract And Mappings

**Files:**
- Modify: `src/app/appShellCompositionTypes.ts`
- Modify: `src/app/appShellCompositionInputs.ts`
- Modify: `src/app/appShellComposition.tsx`

- [ ] Define title-bar, main-content, and overlay input groups in `appShellCompositionTypes.ts`; make `AppShellCompositionOptions` contain `titleBar`, `mainContent`, and `overlay`.
- [ ] Preserve the `AppShellCompositionOptions` re-export from `appShellComposition.tsx`.
- [ ] Update the inputs factory to return nested groups while preserving every existing value source and callback identity.
- [ ] Update the shell composition factory to build TitleBar props from `titleBar`, delegate `mainContent` to `createAppShellMainContentComposition`, and delegate `overlay` to `createAppShellOverlayComposition`.
- [ ] Run `npm.cmd run verify:app-shell-composition-grouping` and confirm it passes.

### Task 3: Run Regression Checks And Record The Phase

**Files:**
- Modify: `task_plan.md`
- Modify: `findings.md`
- Modify: `progress.md`

- [ ] Run `verify:app-shell-composition-grouping`, `verify:app-shell-composition-module`, `verify:app-main-content-module`, and `verify:app-overlay-stack-module`.
- [ ] Run `npm.cmd run typecheck`, `npm.cmd run build`, and scoped `git diff --check` for the touched production, verifier, and registration files.
- [ ] Record the grouped contract boundary, preserved public APIs, verifier registration, and fresh verification results in the planning files.

