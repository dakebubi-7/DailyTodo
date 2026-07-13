# Main Window IPC Registration Types Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the large main-window IPC registration dependency contract into a dedicated type module without changing IPC registration behavior.

**Architecture:** `electron/mainWindowIpcRegistrationTypes.ts` will own the derived input and callback types. `electron/mainWindowIpcRegistration.ts` remains the runtime registration/composition owner and re-exports the public types so existing consumers retain their import path. A focused structural verifier prevents the inline contract from returning.

**Tech Stack:** TypeScript, Electron, Node assertion-based structural verifiers, npm scripts.

---

### Task 1: Add a failing module-boundary verifier

**Files:**
- Create: `scripts/verify-electron-main-window-ipc-registration-types.ts`
- Modify: `package.json`
- Modify: `scripts/verify-cleanup-core.ts`

- [ ] **Step 1: Write the failing test**

```ts
assert.ok(existsSync(typesPath), 'main-window IPC registration options should live in a dedicated type module.');
assert.match(types, /export type MainWindowIpcRegistrationOptions\b/);
assert.match(registration, /export type \{[\s\S]*MainWindowIpcRegistrationOptions[\s\S]*\} from '\.\/mainWindowIpcRegistrationTypes'/);
assert.doesNotMatch(registration, /type MainWindowIpcRegistrationOptions\b/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd run verify:electron-main-window-ipc-registration-types`
Expected: FAIL because `electron/mainWindowIpcRegistrationTypes.ts` does not exist.

- [ ] **Step 3: Register the verifier**

Add this package script and include its command in `cleanupCoreCommands`:

```json
"verify:electron-main-window-ipc-registration-types": "tsx scripts/verify-electron-main-window-ipc-registration-types.ts"
```

### Task 2: Extract the type-only dependency contract

**Files:**
- Create: `electron/mainWindowIpcRegistrationTypes.ts`
- Modify: `electron/mainWindowIpcRegistration.ts`

- [ ] **Step 1: Move the contract**

```ts
export type MainWindowIpcRegistrationOptions = Pick<
  CreateMainWindowBootstrapOptions,
  // retain the current IPC dependency key union unchanged
>;

export type MainWindowIpcRegistrations = Pick<
  SetupMainBrowserWindowOptions,
  // retain the six IPC registration callback names unchanged
>;
```

- [ ] **Step 2: Keep runtime composition stable**

```ts
import type {
  MainWindowIpcRegistrationOptions,
  MainWindowIpcRegistrations,
} from './mainWindowIpcRegistrationTypes';

export type {
  MainWindowIpcRegistrationOptions,
  MainWindowIpcRegistrations,
} from './mainWindowIpcRegistrationTypes';
```

The runtime function body and all six IPC dependency object shapes remain unchanged.

- [ ] **Step 3: Run focused checks**

Run:

```powershell
npm.cmd run verify:electron-main-window-ipc-registration-types
npm.cmd run verify:electron-main-window-bootstrap-module
npm.cmd run verify:electron-main-window-composition-module
```

Expected: all pass.

### Task 3: Regression verification

**Files:**
- Modify: `progress.md`
- Modify: `findings.md`
- Modify: `task_plan.md`

- [ ] **Step 1: Run compiler and production build**

```powershell
npm.cmd run typecheck
npm.cmd run build
```

Expected: both pass with exit code `0`.

- [ ] **Step 2: Record the phase**

Add the extracted boundary, verification commands, and known remaining candidates to the persistent cleanup notes. Do not modify unrelated worktree changes.
