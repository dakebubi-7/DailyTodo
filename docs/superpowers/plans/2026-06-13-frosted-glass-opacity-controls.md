# Frosted Glass Opacity Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make DailyTodo's Appearance controls produce a real frosted-glass effect, show theme-specific recommended opacity ranges on sliders, and allow global font/radius double-click reset to current theme defaults.

**Architecture:** Keep the existing personalization data model and settings page structure. Add small, focused UI helpers inside `SettingsPanel.tsx` for slider recommended ranges and reset behavior, then align `globals.css` surface backgrounds with the existing opacity CSS variables exposed by `App.tsx`. Verification is done with a lightweight static `tsx` script plus typecheck/build.

**Tech Stack:** Electron + React + TypeScript, CSS custom properties, Vite/Electron Vite, `tsx` verification scripts.

---

## File Structure

- Modify `app/src/components/SettingsPanel.tsx`
  - Extend `RangeControl` with optional double-click reset metadata.
  - Add deterministic recommended-range helpers for opacity sliders.
  - Remove the separate opacity recommendation section from Appearance.
  - Render recommended ranges directly on each opacity slider.
- Modify `app/src/styles/globals.css`
  - Add range-track styling for recommended opacity segments.
  - Replace fixed surface `rgba(..., 0.xx)` values on app glass surfaces with the existing opacity variables.
  - Preserve readable hover/focus states without making text/icons transparent.
- Create `app/scripts/verify-frosted-glass-opacity-controls.ts`
  - Static verification for the new UI hooks, removed old recommendation list, CSS variable usage, and double-click reset behavior.
- Modify `app/package.json`
  - Add `verify:frosted-glass-opacity` script.

No migration file is required. Existing settings continue to merge through `DEFAULT_PERSONALIZATION` and the current theme override persistence path.

---

### Task 1: Add failing verification for the new appearance behavior

**Files:**
- Create: `app/scripts/verify-frosted-glass-opacity-controls.ts`
- Modify: `app/package.json:6-65`

- [ ] **Step 1: Create the failing verification script**

Create `app/scripts/verify-frosted-glass-opacity-controls.ts` with this exact content:

```ts
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const settingsPanel = readFileSync(join(root, 'src/components/SettingsPanel.tsx'), 'utf8');
const globalsCss = readFileSync(join(root, 'src/styles/globals.css'), 'utf8');
const app = readFileSync(join(root, 'src/App.tsx'), 'utf8');

assert.match(
  settingsPanel,
  /function getRecommendedOpacityRange\(recommended: number, min = OPACITY_SLIDER_MIN, max = OPACITY_SLIDER_MAX\)/,
  'SettingsPanel should define a deterministic recommended opacity range helper.'
);
assert.match(
  settingsPanel,
  /--recommended-start[\s\S]*--recommended-end/,
  'Opacity sliders should expose recommended range CSS variables.'
);
assert.match(
  settingsPanel,
  /className="settings-range-input settings-opacity-range-input"/,
  'Opacity sliders should use the recommended-range slider class.'
);
assert.doesNotMatch(
  settingsPanel,
  /<h3>\{text\.opacityRecommendations\}<\/h3>/,
  'The old separate opacity recommendation section should be removed from Appearance.'
);
assert.match(
  settingsPanel,
  /onDoubleClick=\{handleReset\}/,
  'RangeControl should support double-click reset on the wrapping control.'
);
assert.match(
  settingsPanel,
  /resetTitle=\{.*双击.*当前主题默认值.*\}/s,
  'Global font and radius controls should explain double-click reset to current theme defaults.'
);
assert.match(
  settingsPanel,
  /defaultValue=\{recommendation\.fontScale \?\? 100\}/,
  'Global font reset should use the current theme font scale or 100.'
);
assert.match(
  settingsPanel,
  /defaultValue=\{recommendation\.radius\}/,
  'Radius reset should use the current theme radius.'
);

for (const cssVar of [
  '--window-opacity',
  '--top-opacity',
  '--card-opacity',
  '--control-opacity',
  '--input-opacity',
  '--dialog-opacity',
  '--menu-opacity',
  '--settings-panel-opacity',
  '--glass-saturation',
]) {
  assert.match(app, new RegExp(cssVar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `App should expose ${cssVar}.`);
  assert.match(globalsCss, new RegExp(cssVar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `CSS should consume ${cssVar}.`);
}

assert.match(
  globalsCss,
  /\.settings-opacity-range-input::\-webkit-slider-runnable-track[\s\S]*linear-gradient[\s\S]*var\(--recommended-start\)[\s\S]*var\(--recommended-end\)/,
  'CSS should paint the recommended range directly on opacity slider tracks.'
);
assert.match(
  globalsCss,
  /\.task-card\s*\{[\s\S]*background: rgba\(255, 255, 255, var\(--card-opacity\)\) !important;/,
  'Light task cards should use --card-opacity.'
);
assert.match(
  globalsCss,
  /\.dark \.task-card\s*\{[\s\S]*background: rgba\(32, 34, 37, var\(--card-opacity\)\) !important;/,
  'Dark task cards should use --card-opacity.'
);
assert.match(
  globalsCss,
  /\.task-toolbar\s*\{[\s\S]*background: rgba\(255, 255, 255, var\(--card-opacity\)\) !important;/,
  'Light task toolbar should use --card-opacity.'
);
assert.match(
  globalsCss,
  /\.dark \.task-toolbar\s*\{[\s\S]*background: rgba\(30, 41, 59, var\(--card-opacity\)\) !important;/,
  'Dark task toolbar should use --card-opacity.'
);
assert.match(
  globalsCss,
  /\.titlebar\s*\{[\s\S]*background: rgba\(250, 250, 249, var\(--top-opacity\)\);/,
  'Titlebar should use --top-opacity.'
);
assert.match(
  globalsCss,
  /\.priority-popover\s*\{[\s\S]*background: rgba\(255, 255, 255, var\(--menu-opacity\)\);/,
  'Light priority/menu popovers should use --menu-opacity.'
);
assert.match(
  globalsCss,
  /\.completion-dialog\s*\{[\s\S]*background: rgba\(255, 255, 255, var\(--dialog-opacity\)\) !important;/,
  'Light dialogs should use --dialog-opacity.'
);

console.log('verify-frosted-glass-opacity-controls passed');
```

- [ ] **Step 2: Add the npm script**

In `app/package.json`, add this script near the other `verify:*` entries:

```json
"verify:frosted-glass-opacity": "tsx scripts/verify-frosted-glass-opacity-controls.ts",
```

A valid surrounding block after the change is:

```json
"verify:settings-v2-ai-account": "tsx scripts/verify-settings-v2-ai-account.ts",
"verify:settings-v2-window-mode": "tsx scripts/verify-settings-v2-window-mode.ts",
"verify:task-list-interactions": "tsx scripts/verify-task-list-interactions.ts",
"verify:frosted-glass-opacity": "tsx scripts/verify-frosted-glass-opacity-controls.ts"
```

If the new line is not last in the object, include a trailing comma according to JSON rules.

- [ ] **Step 3: Run the verification to confirm it fails**

Run:

```bash
cd app && npm run verify:frosted-glass-opacity
```

Expected: FAIL with an assertion like `SettingsPanel should define a deterministic recommended opacity range helper.`

- [ ] **Step 4: Commit the failing verification**

Run:

```bash
git add app/scripts/verify-frosted-glass-opacity-controls.ts app/package.json
git commit -m "test: cover frosted glass opacity controls"
```

Expected: commit succeeds. If the repository has unrelated uncommitted files, only stage the two files listed above.

---

### Task 2: Add slider reset support and recommended opacity ranges in SettingsPanel

**Files:**
- Modify: `app/src/components/SettingsPanel.tsx:50-138`
- Modify: `app/src/components/SettingsPanel.tsx:828-902`

- [ ] **Step 1: Replace `RangeControl` with reset-aware version**

In `app/src/components/SettingsPanel.tsx`, replace the existing `RangeControl` function at the top of the file with this version:

```tsx
function RangeControl({
  label,
  hint,
  value,
  min,
  max,
  unit = '',
  onChange,
  defaultValue,
  resetTitle,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (value: number) => void;
  defaultValue?: number;
  resetTitle?: string;
}) {
  const handleReset = () => {
    if (typeof defaultValue === 'number') onChange(defaultValue);
  };
  const title = typeof defaultValue === 'number' ? resetTitle : undefined;

  return (
    <label className="settings-control" onDoubleClick={handleReset} title={title}>
      <span>
        <strong>{label}</strong>
        {hint && <small>{hint}</small>}
      </span>
      <div className="settings-range-row">
        <input
          className="settings-range-input"
          type="range"
          min={min}
          max={max}
          value={value}
          onDoubleClick={handleReset}
          onChange={(event) => onChange(Number(event.target.value))}
          title={title}
        />
        <b>{value}{unit}</b>
      </div>
    </label>
  );
}
```

- [ ] **Step 2: Add opacity range constants and helper**

Below `opacityValue(...)`, add this code:

```tsx
const OPACITY_SLIDER_MIN = 20;
const OPACITY_SLIDER_MAX = 100;
const OPACITY_RECOMMENDATION_SPREAD = 8;

function getRecommendedOpacityRange(recommended: number, min = OPACITY_SLIDER_MIN, max = OPACITY_SLIDER_MAX) {
  const clamped = Math.min(max, Math.max(min, recommended));
  return {
    start: Math.max(min, clamped - OPACITY_RECOMMENDATION_SPREAD),
    end: Math.min(max, clamped + OPACITY_RECOMMENDATION_SPREAD),
  };
}
```

- [ ] **Step 3: Replace `OpacityAreaControl` with range-aware version**

Replace the existing `OpacityAreaControl` function with this version:

```tsx
function OpacityAreaControl({
  label,
  hint,
  value,
  recommended,
  resetTitle,
  onChange,
  onReset,
}: {
  label: string;
  hint: string;
  value: number;
  recommended: number;
  resetTitle: string;
  onChange: (value: number) => void;
  onReset: () => void;
}) {
  const range = getRecommendedOpacityRange(recommended);
  const rangeStyle = {
    '--recommended-start': `${((range.start - OPACITY_SLIDER_MIN) / (OPACITY_SLIDER_MAX - OPACITY_SLIDER_MIN)) * 100}%`,
    '--recommended-end': `${((range.end - OPACITY_SLIDER_MIN) / (OPACITY_SLIDER_MAX - OPACITY_SLIDER_MIN)) * 100}%`,
  } as CSSProperties;

  return (
    <label className="settings-control settings-opacity-area-control" onDoubleClick={onReset} title={resetTitle}>
      <span>
        <strong>{label}</strong>
        <small>{hint}</small>
      </span>
      <div className="settings-range-row">
        <input
          className="settings-range-input settings-opacity-range-input"
          type="range"
          min={OPACITY_SLIDER_MIN}
          max={OPACITY_SLIDER_MAX}
          value={value}
          style={rangeStyle}
          onDoubleClick={onReset}
          onChange={(event) => onChange(Number(event.target.value))}
          title={resetTitle}
        />
        <b>{value}%</b>
        <button type="button" className="settings-mini-reset" title={resetTitle} onClick={onReset}>
          {recommended}%
        </button>
      </div>
    </label>
  );
}
```

- [ ] **Step 4: Remove the old separate opacity recommendations section**

Delete this whole block from the Appearance page:

```tsx
<section className="settings-section">
  <h3>{text.opacityRecommendations}</h3>
  <div className="settings-preview-list">
    <p>{text.opacityRecommendationsHint}</p>
    <ul className="settings-opacity-reco-list">
      {OPACITY_AREAS.map((area) => {
        const reco = opacityValue(recommendation, area.settingKey as OpacityKey);
        return (
          <li key={area.key}>
            <span>{appSettings.language === 'zh-CN' ? area.labelZh : area.labelEn}</span>
            <b>{reco}%</b>
          </li>
        );
      })}
    </ul>
  </div>
</section>
```

- [ ] **Step 5: Add double-click reset metadata to global font and radius sliders**

In the two `RangeControl` calls in the Global Appearance section, use this exact shape:

```tsx
<RangeControl
  label={appSettings.language === 'zh-CN' ? '全局字体' : 'Global Font'}
  hint={appSettings.language === 'zh-CN' ? '整体放大或缩小文字；双击恢复当前主题默认值' : 'Scale all text; double-click to reset to the current theme default'}
  value={settings.fontScale ?? 100}
  min={80}
  max={130}
  unit="%"
  defaultValue={recommendation.fontScale ?? 100}
  resetTitle={appSettings.language === 'zh-CN' ? '双击恢复当前主题默认值' : 'Double-click to reset to the current theme default'}
  onChange={(value) => updatePersonalization('fontScale', value)}
/>
<RangeControl
  label={text.radius}
  hint={appSettings.language === 'zh-CN' ? '双击恢复当前主题默认值' : 'Double-click to reset to the current theme default'}
  value={settings.radius}
  min={4}
  max={36}
  unit="px"
  defaultValue={recommendation.radius}
  resetTitle={appSettings.language === 'zh-CN' ? '双击恢复当前主题默认值' : 'Double-click to reset to the current theme default'}
  onChange={(value) => updatePersonalization('radius', value)}
/>
```

- [ ] **Step 6: Run the verification and confirm the expected remaining failures**

Run:

```bash
cd app && npm run verify:frosted-glass-opacity
```

Expected: the SettingsPanel assertions now pass, but CSS assertions still fail, likely on recommended slider track CSS or surface variable usage.

- [ ] **Step 7: Run typecheck**

Run:

```bash
cd app && npm run typecheck
```

Expected: PASS. If TypeScript complains about `CSSProperties`, confirm the file still imports `CSSProperties` from React at the top.

- [ ] **Step 8: Commit SettingsPanel changes**

Run:

```bash
git add app/src/components/SettingsPanel.tsx
git commit -m "feat(settings): show opacity recommendations on sliders"
```

Expected: commit succeeds with only `SettingsPanel.tsx` staged.

---

### Task 3: Add slider-track styling and align glass surfaces with opacity variables

**Files:**
- Modify: `app/src/styles/globals.css`

- [ ] **Step 1: Add recommended range slider styling**

In `app/src/styles/globals.css`, after the existing `.settings-control input[type='range']` rule around line 870, add this block:

```css
.settings-range-input {
  min-width: 0;
  flex: 1;
  accent-color: var(--personal-accent);
}

.settings-opacity-range-input {
  --recommended-start: 0%;
  --recommended-end: 100%;
}

.settings-opacity-range-input::-webkit-slider-runnable-track {
  height: 0.42rem;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(39, 39, 42, 0.12) 0%,
    rgba(39, 39, 42, 0.12) var(--recommended-start),
    color-mix(in srgb, var(--personal-accent) 48%, rgba(255, 255, 255, 0.28)) var(--recommended-start),
    color-mix(in srgb, var(--personal-accent) 48%, rgba(255, 255, 255, 0.28)) var(--recommended-end),
    rgba(39, 39, 42, 0.12) var(--recommended-end),
    rgba(39, 39, 42, 0.12) 100%
  );
}

.dark .settings-opacity-range-input::-webkit-slider-runnable-track {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.14) 0%,
    rgba(255, 255, 255, 0.14) var(--recommended-start),
    color-mix(in srgb, var(--personal-secondary) 55%, rgba(255, 255, 255, 0.16)) var(--recommended-start),
    color-mix(in srgb, var(--personal-secondary) 55%, rgba(255, 255, 255, 0.16)) var(--recommended-end),
    rgba(255, 255, 255, 0.14) var(--recommended-end),
    rgba(255, 255, 255, 0.14) 100%
  );
}
```

Keep the existing `.settings-control input[type='range']` rule or simplify it to avoid duplicate `accent-color`; either is acceptable as long as `settings-range-input` and `settings-opacity-range-input` exist.

- [ ] **Step 2: Make shell/top/title surfaces consume opacity variables**

Update these CSS rules in `app/src/styles/globals.css`:

```css
.dark .app-shell {
  background: rgba(15, 23, 42, var(--window-opacity));
  border-color: rgba(71, 85, 105, 0.3);
  box-shadow:
    inset 0 1px 0 rgba(148, 163, 184, 0.1),
    0 20px 50px rgba(0, 0, 0, 0.6);
}

.titlebar {
  background: rgba(250, 250, 249, var(--top-opacity));
  border-bottom: 1px solid rgba(39, 39, 42, 0.08);
  backdrop-filter: blur(calc(var(--blur-strength) * 0.75)) saturate(var(--glass-saturation));
  -webkit-backdrop-filter: blur(calc(var(--blur-strength) * 0.75)) saturate(var(--glass-saturation));
}

.dark .titlebar {
  background: rgba(30, 41, 59, var(--top-opacity));
  border-bottom-color: rgba(148, 163, 184, 0.2);
}
```

If there are duplicate `.dark .app-shell`, `.titlebar`, or `.dark .titlebar` blocks, update all surface-background declarations so later rules do not override these variables with fixed opacity.

- [ ] **Step 3: Make task cards and toolbar consume card opacity**

Update the later task toolbar/card rules to this exact background behavior:

```css
.task-toolbar {
  border-color: rgba(39, 39, 42, 0.1) !important;
  background: rgba(255, 255, 255, var(--card-opacity)) !important;
  box-shadow: none;
  backdrop-filter: blur(calc(var(--blur-strength) * 0.75)) saturate(var(--glass-saturation));
  -webkit-backdrop-filter: blur(calc(var(--blur-strength) * 0.75)) saturate(var(--glass-saturation));
}

.dark .task-toolbar {
  border-color: rgba(148, 163, 184, 0.2) !important;
  background: rgba(30, 41, 59, var(--card-opacity)) !important;
}

.task-card {
  border-color: rgba(39, 39, 42, 0.1) !important;
  background: rgba(255, 255, 255, var(--card-opacity)) !important;
  box-shadow: none;
}

.task-card:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--personal-accent) 28%, rgba(39, 39, 42, 0.1)) !important;
  background: rgba(255, 255, 255, min(calc(var(--card-opacity) + 0.1), 1)) !important;
  box-shadow: 0 6px 16px rgba(31, 41, 55, 0.08);
}

.dark .task-card {
  border-color: rgba(255, 255, 255, 0.12) !important;
  background: rgba(32, 34, 37, var(--card-opacity)) !important;
}

.dark .task-card:hover {
  border-color: color-mix(in srgb, var(--personal-secondary) 26%, rgba(255, 255, 255, 0.12)) !important;
  background: rgba(38, 40, 43, min(calc(var(--card-opacity) + 0.08), 1)) !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}
```

If CSS `min()` inside `rgba()` is not accepted by the build, replace hover backgrounds with `var(--card-opacity)` instead of the `min(calc(...), 1)` expression.

- [ ] **Step 4: Make inputs, menus, and dialogs consume their area opacity variables**

Update these representative rules in `app/src/styles/globals.css`:

```css
.priority-popover {
  position: fixed;
  z-index: 9999;
  display: grid;
  width: 8.875rem;
  gap: 0.35rem;
  border: 1px solid rgba(39, 39, 42, 0.12);
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, var(--menu-opacity));
  padding: 0.45rem;
  box-shadow: 0 12px 30px rgba(31, 41, 55, 0.14);
  backdrop-filter: blur(var(--blur-strength)) saturate(var(--glass-saturation));
  -webkit-backdrop-filter: blur(var(--blur-strength)) saturate(var(--glass-saturation));
}

.dark .priority-popover {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(18, 20, 19, var(--menu-opacity));
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.36);
}

.completion-dialog {
  border-color: rgba(39, 39, 42, 0.12) !important;
  background: rgba(255, 255, 255, var(--dialog-opacity)) !important;
  box-shadow: 0 16px 48px rgba(31, 41, 55, 0.18) !important;
  backdrop-filter: blur(var(--blur-strength)) saturate(var(--glass-saturation));
  -webkit-backdrop-filter: blur(var(--blur-strength)) saturate(var(--glass-saturation));
}

.dark .completion-dialog {
  border-color: rgba(255, 255, 255, 0.12) !important;
  background: rgba(18, 20, 19, var(--dialog-opacity)) !important;
  box-shadow: 0 18px 52px rgba(0, 0, 0, 0.38) !important;
}

.daily-work-panel textarea {
  max-height: 9rem;
  border-color: rgba(39, 39, 42, 0.1) !important;
  background: rgba(255, 255, 255, var(--input-opacity)) !important;
  box-shadow: none;
}

.dark .daily-work-panel textarea {
  border-color: rgba(255, 255, 255, 0.12) !important;
  background: rgba(255, 255, 255, calc(var(--input-opacity) * 0.55)) !important;
}
```

Also inspect nearby menu/context-menu rules such as `.titlebar-menu`, `.tm-popup`, and `.task-menu-popup`. If they have fixed surface backgrounds, change them to use `--menu-opacity` while preserving borders and shadows.

- [ ] **Step 5: Run the new verification**

Run:

```bash
cd app && npm run verify:frosted-glass-opacity
```

Expected: PASS with `verify-frosted-glass-opacity-controls passed`.

- [ ] **Step 6: Run existing UX verification**

Run:

```bash
cd app && npm run verify:ux-polish
```

Expected: PASS with `UX polish verification passed`. If it fails because it expects `text.opacityRecommendations`, update that assertion to check `settings-opacity-range-input` instead, because the approved spec removes the separate recommendation list.

- [ ] **Step 7: Run typecheck**

Run:

```bash
cd app && npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit CSS changes**

Run:

```bash
git add app/src/styles/globals.css app/scripts/verify-ux-polish.ts
git commit -m "style: make app surfaces use glass opacity variables"
```

If `verify-ux-polish.ts` did not need changes, omit it from `git add`.

---

### Task 4: Full verification and final cleanup

**Files:**
- Modify if needed: `app/src/components/SettingsPanel.tsx`
- Modify if needed: `app/src/styles/globals.css`
- Modify if needed: `app/scripts/verify-frosted-glass-opacity-controls.ts`

- [ ] **Step 1: Run focused verification commands**

Run:

```bash
cd app && npm run verify:frosted-glass-opacity && npm run verify:ux-polish && npm run verify:settings-v2-window-mode
```

Expected:

```text
verify-frosted-glass-opacity-controls passed
UX polish verification passed
verify-settings-v2-window-mode passed
```

- [ ] **Step 2: Run typecheck**

Run:

```bash
cd app && npm run typecheck
```

Expected: PASS with no TypeScript errors.

- [ ] **Step 3: Build the app**

Run:

```bash
cd app && npm run build
```

Expected: PASS. If CSS parsing fails on `min(calc(...), 1)` inside `rgba()`, replace hover backgrounds with the same base opacity variable and rerun:

```css
background: rgba(255, 255, 255, var(--card-opacity)) !important;
background: rgba(38, 40, 43, var(--card-opacity)) !important;
```

- [ ] **Step 4: Manual visual verification**

Run the app:

```bash
cd app && npm run dev
```

In the app:

1. Open Settings → Appearance.
2. Confirm the old separate opacity recommendation list is not shown.
3. Expand area fine tuning.
4. Confirm each opacity slider has a highlighted recommended range on the track.
5. Switch between Minimal, Neumorphism, Watercolor, and Invisible; confirm recommended slider ranges move.
6. Drag Home background, Task card, Input, Dialog, Menu, and Settings panel sliders; confirm the matching surface changes while text/icons remain crisp.
7. Double-click Global Font; confirm it resets to the current theme default or 100.
8. Double-click Radius; confirm it resets to the current theme default radius.
9. Toggle dark mode and repeat one task-card and one dialog opacity adjustment.

Expected: all checks pass. If a surface does not change, find the later CSS rule overriding it and replace its fixed alpha with the matching opacity variable.

- [ ] **Step 5: Stop the dev server**

Stop `npm run dev` with `Ctrl+C` in its terminal.

- [ ] **Step 6: Review git diff**

Run:

```bash
git diff -- app/src/components/SettingsPanel.tsx app/src/styles/globals.css app/scripts/verify-frosted-glass-opacity-controls.ts app/package.json app/scripts/verify-ux-polish.ts
```

Expected: diff only contains the approved appearance changes, verification script, package script, and any necessary verification update.

- [ ] **Step 7: Final commit if Task 4 changed anything**

If Task 4 required fixes after the prior commits, run:

```bash
git add app/src/components/SettingsPanel.tsx app/src/styles/globals.css app/scripts/verify-frosted-glass-opacity-controls.ts app/package.json app/scripts/verify-ux-polish.ts
git commit -m "fix: finalize frosted glass appearance controls"
```

Expected: commit succeeds. If Task 4 did not change files, skip this commit.

---

## Self-Review Notes

- Spec coverage: Task 2 removes the old recommendation list, adds recommended slider ranges, and implements double-click reset. Task 3 makes glass surfaces use the existing opacity variables and frosted blur/saturation. Task 4 covers manual dark/light verification and persistence-relevant reset behavior.
- Placeholder scan: no `TBD`, `TODO`, or undefined future functions are used. The only conditional instruction is the explicit CSS fallback if the build rejects `min(calc(...), 1)` inside `rgba()`.
- Type consistency: `getRecommendedOpacityRange`, `OPACITY_SLIDER_MIN`, `OPACITY_SLIDER_MAX`, `settings-range-input`, and `settings-opacity-range-input` are introduced before later tasks verify or style them.
