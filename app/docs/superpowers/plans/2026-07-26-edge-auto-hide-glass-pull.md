# Edge Auto-Hide Glass Pull Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every supported auto-hide strip with the selected A2 balanced glass pull while preserving immediate restoration and the existing state machine.

**Architecture:** The geometry module replaces the shared 8-pixel visible-strip thickness with a shared 28-pixel transparent hit thickness for left, right, and top edges. The activation-strip owner continues to reuse one transparent Electron window, applies the current edge to the page before showing it, and its inline CSS mirrors or rotates one glass-pull component for that edge. The controller stays unchanged.

**Tech Stack:** Electron `BrowserWindow`, TypeScript, inline HTML/CSS data URL, Vitest.

---

## File Structure

- Modify: `electron/edgeAutoHideGeometry.ts`
  - Define shared `28 px` activation-hit thickness and return wider left, right, and top bounds.
- Modify: `electron/edgeAutoHideActivationStrip.ts`
  - Size the initially hidden companion window for the largest hit rectangle.
  - Apply an edge data attribute before showing and render left, right, and top A2 variants from one page.
- Modify: `tests/edgeAutoHideGeometry.test.ts`
  - Lock down all three hit regions, containment, centering, and negative-coordinate placement.
- Modify: `tests/edgeAutoHideActivationStrip.test.ts`
  - Lock down edge-specific A2 markup/CSS and existing pointer notification bindings.

### Task 1: Shared Activation-Hit Geometry

**Files:**
- Modify: `tests/edgeAutoHideGeometry.test.ts:1-141`
- Modify: `electron/edgeAutoHideGeometry.ts:15-68`

- [ ] **Step 1: Write failing assertions for all three A2 hit regions.**

  Import the new `EDGE_AUTO_HIDE_ACTIVATION_HIT_THICKNESS_PX` constant and replace the current side/top expectations with:

  ```ts
  expect(EDGE_AUTO_HIDE_ACTIVATION_HIT_THICKNESS_PX).toBe(28);
  expect(getActivationStripBounds('left', bounds, workArea)).toEqual({
    x: 0,
    y: 312,
    width: 28,
    height: 96,
  });
  expect(getActivationStripBounds('right', { ...bounds, x: 1680 }, workArea)).toEqual({
    x: 1892,
    y: 312,
    width: 28,
    height: 96,
  });
  expect(getActivationStripBounds('top', { ...bounds, x: 600, y: 0 }, workArea)).toEqual({
    x: 672,
    y: 0,
    width: 96,
    height: 28,
  });
  ```

  Update the containment test so it proves each transparent A2 hit region is active and its immediately exterior point is inactive:

  ```ts
  expect(isPointInActivationStrip({ x: 0, y: 350 }, 'left', bounds, workArea)).toBe(true);
  expect(isPointInActivationStrip({ x: 27, y: 350 }, 'left', bounds, workArea)).toBe(true);
  expect(isPointInActivationStrip({ x: 28, y: 350 }, 'left', bounds, workArea)).toBe(false);

  const rightBounds = { ...bounds, x: 1680 };
  expect(isPointInActivationStrip({ x: 1892, y: 350 }, 'right', rightBounds, workArea)).toBe(true);
  expect(isPointInActivationStrip({ x: 1919, y: 350 }, 'right', rightBounds, workArea)).toBe(true);
  expect(isPointInActivationStrip({ x: 1891, y: 350 }, 'right', rightBounds, workArea)).toBe(false);

  const topBounds = { ...bounds, x: 600, y: 0 };
  expect(isPointInActivationStrip({ x: 700, y: 0 }, 'top', topBounds, workArea)).toBe(true);
  expect(isPointInActivationStrip({ x: 700, y: 27 }, 'top', topBounds, workArea)).toBe(true);
  expect(isPointInActivationStrip({ x: 700, y: 28 }, 'top', topBounds, workArea)).toBe(false);
  ```

- [ ] **Step 2: Run the focused geometry test to verify it fails.**

  Run:

  ```powershell
  npx vitest run tests/edgeAutoHideGeometry.test.ts
  ```

  Expected: the module does not export the new constant and currently returns `8 x 96 px` / `96 x 8 px` bounds.

- [ ] **Step 3: Implement shared hit thickness in the geometry helper.**

  Replace the current `EDGE_AUTO_HIDE_REVEAL_PX` export with:

  ```ts
  // The transparent activation region is deliberately larger than the visible A2 pull.
  export const EDGE_AUTO_HIDE_ACTIVATION_HIT_THICKNESS_PX = 28;
  ```

  Update `getActivationStripBounds` so left/right use the shared hit width and top uses it as height:

  ```ts
  case 'left':
  case 'right': {
    const height = Math.min(EDGE_AUTO_HIDE_SIDE_STRIP_LENGTH_PX, expandedBounds.height);
    const y = expandedBounds.y + Math.round((expandedBounds.height - height) / 2);
    return {
      x: edge === 'left'
        ? workArea.x
        : getRight(workArea) - EDGE_AUTO_HIDE_ACTIVATION_HIT_THICKNESS_PX,
      y,
      width: EDGE_AUTO_HIDE_ACTIVATION_HIT_THICKNESS_PX,
      height,
    };
  }
  case 'top':
    return {
      x: expandedBounds.x + Math.round((expandedBounds.width - Math.min(EDGE_AUTO_HIDE_SIDE_STRIP_LENGTH_PX, expandedBounds.width)) / 2),
      y: workArea.y,
      width: Math.min(EDGE_AUTO_HIDE_SIDE_STRIP_LENGTH_PX, expandedBounds.width),
      height: EDGE_AUTO_HIDE_ACTIVATION_HIT_THICKNESS_PX,
    };
  ```

- [ ] **Step 4: Run the focused geometry test to verify it passes.**

  Run:

  ```powershell
  npx vitest run tests/edgeAutoHideGeometry.test.ts
  ```

  Expected: all geometry assertions pass for left `28 x 96`, right `28 x 96`, and top `96 x 28` hit regions.

- [ ] **Step 5: Commit the shared geometry change.**

  ```powershell
  git add electron/edgeAutoHideGeometry.ts tests/edgeAutoHideGeometry.test.ts
  git commit -m "feat: widen edge auto-hide activation zones"
  ```

### Task 2: Edge-Aware A2 Glass-Pull Page

**Files:**
- Modify: `tests/edgeAutoHideActivationStrip.test.ts:1-56`
- Modify: `electron/edgeAutoHideActivationStrip.ts:1-151`

- [ ] **Step 1: Write failing activation-page and negative-display assertions.**

  Update the negative-coordinate expected bounds:

  ```ts
  expect(getActivationStripBounds('left', bounds, workArea)).toEqual({
    x: -1920,
    y: 312,
    width: 28,
    height: 96,
  });
  expect(getActivationStripBounds('right', { ...bounds, x: -240 }, workArea)).toEqual({
    x: -28,
    y: 312,
    width: 28,
    height: 96,
  });
  expect(getActivationStripBounds('top', { ...bounds, x: -900, y: 0 }, workArea)).toEqual({
    x: -828,
    y: 0,
    width: 96,
    height: 28,
  });
  ```

  Replace the generic strip visual assertion with:

  ```ts
  it('defines A2 glass pulls for every supported edge', () => {
    const page = getActivationStripPageHtml();

    expect(page).toContain('class="glass-pull"');
    expect(page).toContain('html[data-edge="left"] .glass-pull');
    expect(page).toContain('html[data-edge="right"] .glass-pull');
    expect(page).toContain('html[data-edge="top"] .glass-pull');
    expect(page).toContain('width: 15px');
    expect(page).toContain('height: 72px');
    expect(page).toContain('width: 72px');
    expect(page).toContain('height: 15px');
    expect(page).toContain('width 150ms ease');
    expect(page).toContain('height 150ms ease');
    expect(page).toContain('backdrop-filter');
  });
  ```

- [ ] **Step 2: Run the focused activation-strip test to verify it fails.**

  Run:

  ```powershell
  npx vitest run tests/edgeAutoHideActivationStrip.test.ts
  ```

  Expected: the old `8 px` / generic-strip implementation fails the new dimensions and A2 edge-selector expectations.

- [ ] **Step 3: Make the companion window edge-aware before it becomes visible.**

  Import `EDGE_AUTO_HIDE_ACTIVATION_HIT_THICKNESS_PX` and `EDGE_AUTO_HIDE_SIDE_STRIP_LENGTH_PX`; create the initially hidden window with:

  ```ts
  width: EDGE_AUTO_HIDE_SIDE_STRIP_LENGTH_PX,
  height: EDGE_AUTO_HIDE_SIDE_STRIP_LENGTH_PX,
  ```

  The initial size is never shown. It only ensures the first pending show can
  support either `96 x 28` or `28 x 96` bounds.

  Add a revision counter next to `visible`:

  ```ts
  let pageRevision = 0;
  ```

  Increment it at the start of `hardHide`, `dispose`, and every call to
  `applyShow`. In `applyShow`, use the revision to wait for the current edge
  data attribute before exposing the window:

  ```ts
  const revision = ++pageRevision;
  const bounds = getActivationStripBounds(edge, expandedBounds, workArea);
  target.setBounds(bounds);
  target.setIgnoreMouseEvents(true);

  void target.webContents.executeJavaScript(
    `document.documentElement.dataset.edge = ${JSON.stringify(edge)};`,
    true,
  ).catch(() => undefined).then(() => {
    if (disposed || !visible || target !== strip || revision !== pageRevision) return;
    target.setIgnoreMouseEvents(false);
    target.showInactive();
    diag?.(`edge auto-hide: activation strip shown ${edge} ${bounds.x},${bounds.y} ${bounds.width}x${bounds.height}`);
  });
  ```

  Keep `visible = true` in `show()` before a pending page load is recorded;
  retain the existing `notifyActivate` check so no stale page can activate the
  restored main window.

- [ ] **Step 4: Replace the generic strip page with one edge-specific pull.**

  In `getActivationStripPageHtml()`, replace `<div class="strip"></div>` with:

  ```html
  <div class="glass-pull"></div>
  ```

  Set `data-edge="right"` on `<html>` as the harmless invisible-page default.
  Add these common styles:

  ```css
  .glass-pull {
    position: absolute;
    display: block;
    box-sizing: border-box;
    background: linear-gradient(180deg, rgba(255,255,255,0.26), rgba(194,231,210,0.12)), rgba(207,242,221,0.16);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.34), 0 4px 12px rgba(0,8,6,0.27);
    backdrop-filter: blur(14px) saturate(1.2);
    -webkit-backdrop-filter: blur(14px) saturate(1.2);
    transition: width 150ms ease, height 150ms ease, background 150ms ease, box-shadow 150ms ease;
  }

  .glass-pull::before {
    content: "";
    position: absolute;
    width: 6px;
    height: 6px;
    border-left: 1.5px solid rgba(244,255,248,0.94);
    border-bottom: 1.5px solid rgba(244,255,248,0.94);
  }
  ```

  Add edge-specific rules:

  ```css
  html[data-edge="right"] .glass-pull {
    top: 50%; right: 0; width: 15px; height: 72px;
    transform: translateY(-50%);
    border: 1px solid rgba(237,255,244,0.42); border-right: 0;
    border-radius: 9px 0 0 9px;
  }
  html[data-edge="right"] .glass-pull::before {
    top: 50%; left: 50%; transform: translate(-23%, -50%) rotate(45deg);
  }
  html[data-edge="right"] body:hover .glass-pull { width: 19px; }

  html[data-edge="left"] .glass-pull {
    top: 50%; left: 0; width: 15px; height: 72px;
    transform: translateY(-50%);
    border: 1px solid rgba(237,255,244,0.42); border-left: 0;
    border-radius: 0 9px 9px 0;
  }
  html[data-edge="left"] .glass-pull::before {
    top: 50%; left: 50%; transform: translate(-77%, -50%) rotate(-135deg);
  }
  html[data-edge="left"] body:hover .glass-pull { width: 19px; }

  html[data-edge="top"] .glass-pull {
    top: 0; left: 50%; width: 72px; height: 15px;
    transform: translateX(-50%);
    border: 1px solid rgba(237,255,244,0.42); border-top: 0;
    border-radius: 0 0 9px 9px;
  }
  html[data-edge="top"] .glass-pull::before {
    top: 50%; left: 50%; transform: translate(-50%, -77%) rotate(-45deg);
  }
  html[data-edge="top"] body:hover .glass-pull { height: 19px; }
  ```

  Append the shared hover fill and shadow to all edge variants:

  ```css
  body:hover .glass-pull {
    background: linear-gradient(180deg, rgba(255,255,255,0.34), rgba(202,244,220,0.18)), rgba(217,251,230,0.27);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.4), 0 4px 13px rgba(0,8,6,0.3);
  }
  ```

- [ ] **Step 5: Run focused geometry and activation-strip tests to verify they pass.**

  Run:

  ```powershell
  npx vitest run tests/edgeAutoHideGeometry.test.ts tests/edgeAutoHideActivationStrip.test.ts
  ```

  Expected: all new hit-region and edge-specific A2 page assertions pass, and existing pointer notification assertions still pass.

- [ ] **Step 6: Commit the A2 activation page.**

  ```powershell
  git add electron/edgeAutoHideActivationStrip.ts tests/edgeAutoHideActivationStrip.test.ts
  git commit -m "feat: add glass pulls for every auto-hide edge"
  ```

### Task 3: State-Machine Regression And Manual Verification

**Files:**
- Verify only: `electron/edgeAutoHideGeometry.ts`
- Verify only: `electron/edgeAutoHideActivationStrip.ts`
- Verify only: `tests/edgeAutoHideGeometry.test.ts`
- Verify only: `tests/edgeAutoHideActivationStrip.test.ts`
- Verify only: `tests/edgeAutoHideController.test.ts`

- [ ] **Step 1: Run focused behavior tests.**

  ```powershell
  npx vitest run tests/edgeAutoHideGeometry.test.ts tests/edgeAutoHideActivationStrip.test.ts tests/edgeAutoHideController.test.ts
  ```

  Expected: all three suites pass; the controller continues to restore the full main window and hide the companion strip after activation.

- [ ] **Step 2: Run static checks.**

  ```powershell
  npm run typecheck
  npm run lint -- electron/edgeAutoHideGeometry.ts electron/edgeAutoHideActivationStrip.ts tests/edgeAutoHideGeometry.test.ts tests/edgeAutoHideActivationStrip.test.ts
  ```

  Expected: both commands exit with code `0`.

- [ ] **Step 3: Launch the Electron development build and exercise all three edges.**

  ```powershell
  npm run dev
  ```

  Check the running desktop app for each edge:

  1. Dock at the left, right, then top edge. Move to the absolute desktop edge and wait for retraction.
  2. Confirm the main window fully leaves the work area and the centered A2 pull remains: left arrow-right, right arrow-left, top arrow-down.
  3. Enter the invisible `28 x 96 px` side or `96 x 28 px` top hit region, including its interior-side portion outside the visible pull. Confirm immediate restoration.
  4. Confirm the pull expands only toward the desktop interior before disappearing, and no stale transparent window intercepts the restored main window.

- [ ] **Step 4: Review final feature changes without disturbing unrelated work.**

  ```powershell
  git diff --check HEAD
  git diff --stat HEAD
  git status --short
  ```

  Expected: no whitespace errors; only the two feature implementation files and two focused test files are new feature changes. Preserve all unrelated pre-existing working-tree modifications.
