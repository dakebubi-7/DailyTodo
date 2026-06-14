# Native Frosted Glass Denoise Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make transparent themes look like native misted/frosted glass by enabling a safe Electron/Windows background material enhancement and reducing heavy per-card CSS blur/tint blocks.

**Architecture:** Add a small progressive-enhancement helper in Electron main process that attempts native background material after the main `BrowserWindow` is created, never throwing during startup. Update static verification to lock this behavior and to prevent task cards from regressing into high-opacity blurred blocks. Tune CSS so the app shell is the main glass pane while task rows stay crisp and quiet.

**Tech Stack:** Electron 34, TypeScript, React, CSS custom properties, existing `tsx` verification scripts.

---

## File Structure

- Modify `app/electron/main.ts`
  - Add `applyNativeBackgroundMaterial(win: BrowserWindow): void` near other window-style helpers.
  - Call it immediately after `mainWindow = win` and before other window mode styling.
- Modify `app/scripts/verify-frosted-glass-opacity-controls.ts`
  - Read `app/electron/main.ts`.
  - Add static assertions for native material progressive enhancement.
  - Add CSS assertions that task cards retain opacity variables but reduce local blur and avoid heavy hover fill.
- Modify `app/src/styles/globals.css`
  - Reduce `.task-card` local blur versus `.app-shell`.
  - Make default and hover task card fills use lower effective opacity via `color-mix(...)` with `transparent`.
  - Update `theme-invisible` shell to continue using opacity/blur variables and keep task rows transparent/subtle.
- Modify `app/package.json`
  - Keep existing `verify:frosted-glass-opacity` command pointing at the updated verification script. No new script is required.

---

### Task 1: Add failing verification for native material and denoised task surfaces

**Files:**
- Modify: `app/scripts/verify-frosted-glass-opacity-controls.ts`
- Test: `app/scripts/verify-frosted-glass-opacity-controls.ts`

- [ ] **Step 1: Write the failing test**

Add the Electron main file read near the existing file reads:

```ts
const electronMain = readFileSync(join(root, 'electron/main.ts'), 'utf8');
```

Add these helpers after `assertSelectorUses(...)`:

```ts
function assertSelectorDoesNotUse(selector: string, rejected: RegExp, message: string) {
  const blocks = extractCssBlocksForSelector(globalsCss, selector);
  assert.ok(blocks.length > 0, `Missing CSS selector: ${selector}`);
  assert.ok(blocks.every((block) => !rejected.test(block)), message);
}

function assertSelectorBlockUses(selector: string, required: RegExp, message: string) {
  const blocks = extractCssBlocksForSelector(globalsCss, selector);
  assert.ok(blocks.length > 0, `Missing CSS selector: ${selector}`);
  assert.ok(blocks.some((block) => required.test(block)), message);
}
```

Add these assertions before the final `console.log(...)`:

```ts
assert.match(
  electronMain,
  /function applyNativeBackgroundMaterial\(win: BrowserWindow\)/,
  'Electron main should define a native background material progressive enhancement helper.'
);
assert.match(
  electronMain,
  /setBackgroundMaterial/,
  'Native material helper should attempt Electron setBackgroundMaterial when available.'
);
assert.match(
  electronMain,
  /for \(const material of \['acrylic', 'mica'/,
  'Native material helper should prefer acrylic and fall back to mica-like materials.'
);
assert.match(
  electronMain,
  /try \{[\s\S]*setBackgroundMaterial[\s\S]*\} catch/s,
  'Native material helper should guard unsupported platforms and APIs with try/catch.'
);
assert.match(
  electronMain,
  /applyNativeBackgroundMaterial\(win\);/,
  'Main window creation should call the native material helper after BrowserWindow creation.'
);
assert.match(
  electronMain,
  /transparent: true,[\s\S]*backgroundColor: '#00000000'/,
  'Main window should preserve transparent fallback settings.'
);

assertSelectorBlockUses(
  '.task-card',
  /backdrop-filter:\s*blur\(calc\(var\(--blur-strength\) \* 0\.22\)\)/,
  'Task cards should use much less local blur than the app shell.'
);
assertSelectorBlockUses(
  '.task-card',
  /color-mix\(in srgb, rgba\(255, 255, 255, var\(--card-opacity\)\) 38%, transparent\)/,
  'Light task cards should soften --card-opacity instead of using it as a full opaque card fill.'
);
assertSelectorBlockUses(
  '.dark .task-card',
  /color-mix\(in srgb, rgba\(32, 34, 37, var\(--card-opacity\)\) 42%, transparent\)/,
  'Dark task cards should soften --card-opacity instead of using it as a full opaque card fill.'
);
assertSelectorDoesNotUse(
  '.task-card:hover',
  /background:\s*rgba\(255, 255, 255, var\(--card-opacity\)\)/,
  'Light task card hover should not restore a full card-opacity white block.'
);
assertSelectorDoesNotUse(
  '.dark .task-card:hover',
  /background:\s*rgba\(38, 40, 43, var\(--card-opacity\)\)/,
  'Dark task card hover should not restore a full card-opacity dark block.'
);
assertSelectorBlockUses(
  '.theme-invisible.app-shell',
  /var\(--window-opacity\)/,
  'Invisible shell should keep using --window-opacity so the existing slider still controls the pane.'
);
assertSelectorBlockUses(
  '.theme-invisible.app-shell',
  /var\(--blur-strength\)/,
  'Invisible shell should keep using --blur-strength so blur controls still affect the main pane.'
);
```

- [ ] **Step 2: Run test to verify it fails**

Run from `app/`:

```bash
npm run verify:frosted-glass-opacity
```

Expected: FAIL with messages about missing `applyNativeBackgroundMaterial`, missing softened card backgrounds, or missing invisible shell variables.

- [ ] **Step 3: Commit is not required yet**

Do not commit the red test alone unless the user explicitly asks for tiny commits. Continue to Task 2.

---

### Task 2: Implement native Electron/Windows background material fallback

**Files:**
- Modify: `app/electron/main.ts`
- Test: `app/scripts/verify-frosted-glass-opacity-controls.ts`

- [ ] **Step 1: Add the helper**

Insert after `applyToolWindowStyle(...)`:

```ts
function applyNativeBackgroundMaterial(win: BrowserWindow): void {
  if (process.platform !== 'win32') return;

  const materialWindow = win as BrowserWindow & {
    setBackgroundMaterial?: (material: 'auto' | 'none' | 'mica' | 'acrylic' | 'tabbed') => void;
  };

  if (typeof materialWindow.setBackgroundMaterial !== 'function') {
    diag('native background material unavailable');
    return;
  }

  for (const material of ['acrylic', 'mica', 'tabbed'] as const) {
    try {
      materialWindow.setBackgroundMaterial(material);
      diag(`native background material enabled: ${material}`);
      return;
    } catch (error) {
      diag(`native background material ${material} failed: ${String(error)}`);
    }
  }

  diag('native background material fallback: transparent css glass');
}
```

- [ ] **Step 2: Call the helper after BrowserWindow creation**

In `createWindow()`, after:

```ts
mainWindow = win;
diag('BrowserWindow created');
```

add:

```ts
applyNativeBackgroundMaterial(win);
```

- [ ] **Step 3: Run verification**

Run from `app/`:

```bash
npm run verify:frosted-glass-opacity
```

Expected: still FAIL until Task 3 CSS changes are added, but native material assertions should no longer be the failing reason.

---

### Task 3: Denoise base task card CSS while preserving opacity controls

**Files:**
- Modify: `app/src/styles/globals.css`
- Test: `app/scripts/verify-frosted-glass-opacity-controls.ts`

- [ ] **Step 1: Reduce shared task-card blur**

In the shared block around `.date-card, .daily-work-panel button, .task-toolbar, .task-card, .settings-panel`, remove `.task-card` from the selector so task cards no longer inherit `blur(calc(var(--blur-strength) * 0.6))`.

Then add a dedicated block near the existing `.task-card` rules:

```css
.task-card {
  backdrop-filter: blur(calc(var(--blur-strength) * 0.22)) saturate(calc(var(--glass-saturation) * 0.94));
  -webkit-backdrop-filter: blur(calc(var(--blur-strength) * 0.22)) saturate(calc(var(--glass-saturation) * 0.94));
}
```

- [ ] **Step 2: Soften light task cards and hover**

Replace the existing base `.task-card` and `.task-card:hover` backgrounds with:

```css
.task-card {
  border-color: rgba(39, 39, 42, 0.085) !important;
  background: color-mix(in srgb, rgba(255, 255, 255, var(--card-opacity)) 38%, transparent) !important;
  box-shadow: none;
}

.task-card:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--personal-accent) 22%, rgba(39, 39, 42, 0.09)) !important;
  background: color-mix(in srgb, rgba(255, 255, 255, var(--card-opacity)) 48%, transparent) !important;
  box-shadow: 0 4px 14px rgba(31, 41, 55, 0.055);
}
```

- [ ] **Step 3: Soften dark task cards and hover**

Replace the existing `.dark .task-card` and `.dark .task-card:hover` backgrounds with:

```css
.dark .task-card {
  border-color: rgba(255, 255, 255, 0.09) !important;
  background: color-mix(in srgb, rgba(32, 34, 37, var(--card-opacity)) 42%, transparent) !important;
}

.dark .task-card:hover {
  border-color: color-mix(in srgb, var(--personal-secondary) 22%, rgba(255, 255, 255, 0.1)) !important;
  background: color-mix(in srgb, rgba(38, 40, 43, var(--card-opacity)) 50%, transparent) !important;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.22);
}
```

- [ ] **Step 4: Run verification**

Run from `app/`:

```bash
npm run verify:frosted-glass-opacity
```

Expected: still FAIL if invisible theme variable assertions are not yet satisfied; otherwise PASS.

---

### Task 4: Tune invisible theme to keep one-pane frosted glass behavior configurable

**Files:**
- Modify: `app/src/styles/globals.css`
- Test: `app/scripts/verify-frosted-glass-opacity-controls.ts`

- [ ] **Step 1: Update invisible shell variables**

Replace the `.theme-invisible.app-shell, .theme-invisible.dark.app-shell` block with:

```css
.theme-invisible.app-shell,
.theme-invisible.dark.app-shell {
  background: color-mix(in srgb, rgba(18, 20, 24, var(--window-opacity)) 54%, transparent) !important;
  border: 0.5px solid rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.25) !important;
  backdrop-filter: blur(calc(var(--blur-strength) * 1.08)) saturate(var(--glass-saturation)) !important;
  -webkit-backdrop-filter: blur(calc(var(--blur-strength) * 1.08)) saturate(var(--glass-saturation)) !important;
}
```

- [ ] **Step 2: Keep invisible task rows quiet**

Keep this behavior in the existing invisible task blocks:

```css
.theme-invisible .task-card {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding-top: 0.45rem !important;
  padding-bottom: 0.45rem !important;
}

.theme-invisible .task-card:hover {
  background: rgba(255, 255, 255, 0.04) !important;
  transform: none !important;
  box-shadow: none !important;
}
```

Do not make ordinary invisible task rows opaque.

- [ ] **Step 3: Run verification**

Run from `app/`:

```bash
npm run verify:frosted-glass-opacity
```

Expected: PASS.

---

### Task 5: Run targeted checks and summarize manual follow-up

**Files:**
- No production files beyond Tasks 1-4

- [ ] **Step 1: Run targeted static verification**

Run from `app/`:

```bash
npm run verify:frosted-glass-opacity
```

Expected: PASS with:

```text
verify-frosted-glass-opacity-controls passed
```

- [ ] **Step 2: Run typecheck**

Run from `app/`:

```bash
npm run typecheck
```

Expected: PASS with no TypeScript errors.

- [ ] **Step 3: Optional manual visual check**

Run from `app/`:

```bash
npm run dev
```

Expected visual result:

- Background looks misted/frosted.
- Task text and checkboxes stay sharp.
- Ordinary task rows are not large green/white translucent blocks.
- Hover feedback is subtle.
- Settings/menu/dialog surfaces remain readable.

- [ ] **Step 4: Commit if requested**

If the user wants a commit, run:

```bash
git add app/electron/main.ts app/src/styles/globals.css app/scripts/verify-frosted-glass-opacity-controls.ts docs/superpowers/specs/2026-06-14-native-frosted-glass-denoise-design.md docs/superpowers/plans/2026-06-14-native-frosted-glass-denoise.md
git commit -m "feat: add native frosted glass material fallback"
```

Append the required co-author trailer to the commit message if using the automated commit flow.

---

## Self-Review

- Spec coverage: native material, fallback safety, transparent fallback preservation, local surface denoise, opacity variable preservation, invisible/settings/menu/dialog readability are all covered by Tasks 1-5.
- Placeholder scan: no TBD/TODO/fill-in placeholders remain.
- Type consistency: `applyNativeBackgroundMaterial(win: BrowserWindow): void` is defined and called with the existing `BrowserWindow` instance. CSS assertions match the exact planned values.
