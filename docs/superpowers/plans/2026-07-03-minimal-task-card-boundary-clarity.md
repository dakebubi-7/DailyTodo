# Minimal Task Card Boundary Clarity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the minimal white theme task card read more clearly against the page by adding a crisp 1px boundary and a very soft bottom fade, without changing task behavior or layout.

**Architecture:** Keep this as a CSS-only surface refinement scoped to the minimal theme. Update the existing `.theme-minimal .task-card` surface once, let the same rule apply to normal and completed task cards, and lock the result with a targeted verifier update so the boundary does not get flattened again by future polish work.

**Tech Stack:** Electron, React, TypeScript, CSS, existing `tsx` verification script.

---

## File Structure

- Modify `src/styles/globals.css:6101-6118`: tighten the minimal-theme task-card surface with a 1px divider and a soft bottom gradient, plus a slightly clearer hover state.
- Modify `scripts/verify-theme-visual-isolation.ts:39-80`: add assertions that the minimal task card keeps the new boundary treatment.

## Task 1: Tighten the minimal task-card surface

**Files:**
- Modify: `src/styles/globals.css:6101-6118`

- [ ] **Step 1: Replace the minimal task-card surface with a clearer boundary treatment**

Replace the current `.theme-minimal .task-card` block with:

```css
.theme-minimal .task-card {
  border: 1px solid rgba(39, 39, 42, 0.055) !important;
  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, var(--card-opacity)) 0%,
      rgba(255, 255, 255, var(--card-opacity)) 82%,
      rgba(247, 249, 251, var(--card-opacity)) 100%
    ) !important;
  box-shadow:
    0 8px 24px rgba(54, 68, 88, 0.045) !important,
    inset 0 1px 0 rgba(255, 255, 255, 0.72) !important,
    inset 0 -1px 0 rgba(39, 39, 42, 0.03) !important;
}

.theme-minimal .task-card:hover {
  border-color: rgba(39, 39, 42, 0.075) !important;
  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, calc(var(--card-opacity) + 0.025)) 0%,
      rgba(255, 255, 255, calc(var(--card-opacity) + 0.025)) 82%,
      rgba(247, 249, 251, calc(var(--card-opacity) + 0.025)) 100%
    ) !important;
  box-shadow:
    0 10px 26px rgba(54, 68, 88, 0.055) !important,
    inset 0 1px 0 rgba(255, 255, 255, 0.76) !important,
    inset 0 -1px 0 rgba(39, 39, 42, 0.035) !important;
}
```

This keeps the visual language the same, but makes the bottom edge easier to read on the white background.

- [ ] **Step 2: Keep the scope limited to the minimal theme**

Do not touch the global `.task-card` rules or any other theme blocks. The new surface treatment should only affect `.theme-minimal` so dark, watercolor, neumorphism, and other themes stay unchanged.

- [ ] **Step 3: Run the app and inspect the white theme card edge**

Run:

```bash
cd /g/Personal-AI/DailyTodo/app && npm run dev
```

Expected: the main task card in the minimal theme now reads with a crisp 1px edge plus a very faint bottom fade, instead of melting into the white background.

## Task 2: Lock the boundary with a targeted verifier

**Files:**
- Modify: `scripts/verify-theme-visual-isolation.ts:39-80`

- [ ] **Step 1: Add minimal-theme task-card boundary assertions**

Add assertions near the existing minimal-theme checks:

```ts
assert.ok(
  globals.includes(".theme-minimal .task-card") &&
    globals.includes('border: 1px solid rgba(39, 39, 42, 0.055) !important;'),
  'Minimal task cards should use a crisp 1px divider.'
);

assert.ok(
  globals.includes(".theme-minimal .task-card") &&
    globals.includes('rgba(247, 249, 251, var(--card-opacity)) 100%'),
  'Minimal task cards should keep a very soft bottom gradient.'
);

assert.ok(
  globals.includes(".theme-minimal .task-card:hover") &&
    globals.includes('inset 0 -1px 0 rgba(39, 39, 42, 0.035) !important;'),
  'Minimal hover cards should keep the bottom edge readable.'
);
```

- [ ] **Step 2: Run the targeted verifier**

Run:

```bash
cd /g/Personal-AI/DailyTodo/app && npm run verify:theme-visual-isolation
```

Expected: `verify-theme-visual-isolation passed`.

- [ ] **Step 3: Do a quick diff sanity check**

Run:

```bash
git -C /g/Personal-AI/DailyTodo diff --check -- app/src/styles/globals.css app/scripts/verify-theme-visual-isolation.ts
```

Expected: exit code 0 with no whitespace errors.

## Self-Review

- Spec coverage: the plan covers the visual boundary update, scope isolation to the minimal theme, verifier coverage, and a real-app visual pass.
- Placeholder scan: no TBD/TODO placeholders remain.
- Type consistency: selector names and literal values are identical between CSS and verifier checks (`.theme-minimal .task-card`, `.theme-minimal .task-card:hover`).
- Scope check: this is a single CSS refinement plus one targeted test update; it does not require a broader refactor.
