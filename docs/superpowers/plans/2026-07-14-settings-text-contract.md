# Settings Text Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the English settings text module's type-only dependency on Chinese locale data with a shared `SettingsText` contract while preserving all localized values and runtime imports.

**Architecture:** `src/i18n/settingsTextTypes.ts` owns the exported compile-time contract, inferred from the canonical Chinese settings data. The English data module imports the contract and uses `satisfies SettingsText`; the Chinese module remains unchanged to avoid a self-referential inferred-type cycle. Shell composition continues importing the same language data modules as before. The existing i18n structural/runtime verifier protects the new type boundary and confirms representative runtime text remains unchanged.

**Tech Stack:** TypeScript, Node assert, tsx, Vite production build.

---

## File Structure

- Create: `src/i18n/settingsTextTypes.ts` -- type-only `SettingsText` contract derived from the existing Chinese settings payload.
- Modify: `src/i18n/shellTextZhSettings.ts` -- retain the canonical settings data shape without changing its object data.
- Modify: `src/i18n/shellTextEnSettings.ts` -- replace its Chinese-data type import with the shared type; retain its object data and export.
- Modify: `scripts/verify-i18n-shell-text-module.ts` -- assert the shared contract boundary and retain existing runtime locale checks.
- Modify: `task_plan.md`, `findings.md`, `progress.md` -- capture the RED/GREEN result and verification evidence.

### Task 1: Protect The Shared Contract Boundary

**Files:**
- Modify: `scripts/verify-i18n-shell-text-module.ts:12-52`
- Test: `scripts/verify-i18n-shell-text-module.ts`

- [x] **Step 1: Write the failing structural assertions**

Add a settings type-module path next to the existing locale paths, require its existence, and add these assertions after reading the locale modules:

```ts
assert.match(settingsTypes, /export type SettingsText\s*=\s*typeof import\('\.\/shellTextZhSettings'\)\.zhSettingsText/, 'Settings text type module should own the shared contract.');
assert.match(enSettings, /import type \{ SettingsText \} from '\.\/settingsTextTypes'/, 'English settings module should use the shared settings text contract.');
assert.doesNotMatch(enSettings, /from '\.\/shellTextZhSettings'/, 'English settings module should not depend on Chinese locale data.');
assert.match(enSettings, /satisfies SettingsText/, 'English settings module should satisfy the shared settings text contract.');
```

- [x] **Step 2: Run the verifier to confirm RED**

Run: `npm.cmd run verify:i18n-shell-text-module`

Expected: FAIL because `src/i18n/settingsTextTypes.ts` does not yet exist.

### Task 2: Extract The Type-Only Contract

**Files:**
- Create: `src/i18n/settingsTextTypes.ts`
- Modify: `src/i18n/shellTextZhSettings.ts:1,284` (no text or structural edit expected; listed for verification scope only)
- Modify: `src/i18n/shellTextEnSettings.ts:1,284`

- [x] **Step 1: Create the minimal shared contract**

Create `src/i18n/settingsTextTypes.ts` with this complete content:

```ts
export type SettingsText = typeof import('./shellTextZhSettings').zhSettingsText;
```

- [x] **Step 2: Make both locale payloads satisfy the contract**

At the top of `shellTextEnSettings.ts`, replace the Chinese-data type import with:

```ts
import type { SettingsText } from './settingsTextTypes';
```

Change its final terminator from `} satisfies typeof zhSettingsText;` to:

```ts
} satisfies SettingsText;
```

Do not edit any localized object key or string literal.

- [x] **Step 3: Run the focused verifier to confirm GREEN**

Run: `npm.cmd run verify:i18n-shell-text-module`

Expected: PASS with `i18n shell text module verification passed`.

### Task 3: Run Type And Production Regression Checks

**Files:**
- Test: `src/i18n/settingsTextTypes.ts`
- Test: `src/i18n/shellTextZhSettings.ts`
- Test: `src/i18n/shellTextEnSettings.ts`
- Test: `scripts/verify-i18n-shell-text-module.ts`

- [x] **Step 1: Run TypeScript checking**

Run: `npm.cmd run typecheck`

Expected: PASS with no type errors, proving both locale payloads conform to the shared contract.

- [x] **Step 2: Run the production build**

Run: `npm.cmd run build`

Expected: PASS, proving the compile-time-only contract adds no runtime import regression.

- [x] **Step 3: Check phase whitespace and review the diff**

Run: `git diff --check -- src/i18n/settingsTextTypes.ts src/i18n/shellTextZhSettings.ts src/i18n/shellTextEnSettings.ts scripts/verify-i18n-shell-text-module.ts task_plan.md findings.md progress.md`

Expected: exit code `0`; existing LF-to-CRLF advisories may appear but must not be errors.

- [x] **Step 4: Record verified completion**

Mark Phase 504 complete in `task_plan.md` and record the contract boundary plus passing commands in `findings.md` and `progress.md`.
