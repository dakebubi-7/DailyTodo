# Daily Review Detail Interaction Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the generated daily review detail panel close with `Escape` and scroll its result list within the viewport.

**Architecture:** Keep the existing `DailyReviewPanel` state and close callback. Add a component-scoped keyboard effect that listens only while the detail view is open, then fix the detail panel's CSS grid sizing so the list is the shrinkable, scrollable row. Extend the existing DOM test suite with an `Escape` regression test.

**Tech Stack:** React, TypeScript, CSS, Vitest, Testing Library, Vite/Electron renderer.

---

## File Map

- Modify `src/components/taskList/DailyReviewPanel.tsx`: add the open-detail `Escape` listener without changing generation or adoption behavior.
- Modify `src/styles/globals.css`: make `.daily-review-detail` a viewport-bounded two-row grid and make `.daily-review-items` a contained scroll region.
- Modify `tests/dailyReviewPanel.dom.test.tsx`: add a failing-then-passing DOM regression test for keyboard close behavior.

### Task 1: Add the failing Escape regression test

**Files:**
- Modify: `tests/dailyReviewPanel.dom.test.tsx` near the existing detail/adoption test

- [ ] **Step 1: Add a test that opens the detail panel and dispatches Escape**

Add this test inside `describe('DailyReviewPanel', () => { ... })`:

```tsx
  it('closes the detail panel when Escape is pressed', async () => {
    setAiReviewApi({ enabled: true, dailyBatch: batch() });
    render(
      <DailyReviewPanel
        currentDate={currentDate}
        text={getShellText('en-US').app}
        onAdoptDailyReviewSuggestion={vi.fn()}
      />,
    );

    await waitFor(() => expect(screen.getByRole('button', { name: /view/i })).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /view/i }));
    expect(screen.getByRole('dialog', { name: /yesterday's review/i })).toBeTruthy();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog', { name: /yesterday's review/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /view/i })).toBeNull();
  });
```

The second assertion is intentional: closing marks the prompt handled, so the component should not immediately show the prompt again during the same mount.

- [ ] **Step 2: Run the focused test and verify it fails for the expected reason**

Run:

```powershell
npm.cmd test -- tests/dailyReviewPanel.dom.test.tsx --run
```

Expected: the new test fails because pressing `Escape` does not currently invoke `closeDetails`; the existing tests remain passing.

### Task 2: Implement component-scoped Escape handling

**Files:**
- Modify: `src/components/taskList/DailyReviewPanel.tsx` after the existing state/effect declarations and before the callbacks

- [ ] **Step 1: Add an effect that listens only while detail is open**

Add this effect after the existing `closeDetails` callback:

```tsx
  useEffect(() => {
    if (!isDetailOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDetails();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeDetails, isDetailOpen]);
```

The existing `closeDetails` callback must remain the single close path:

```tsx
  const closeDetails = useCallback(() => {
    setIsDetailOpen(false);
    setAdoptionItem(undefined);
    setFocusAction('');
  }, []);
```

If the current callback is declared below another callback, keep React hook order stable and place the new effect immediately after `closeDetails` rather than moving unrelated state or callbacks.

- [ ] **Step 2: Run the focused test and verify it passes**

Run:

```powershell
npm.cmd test -- tests/dailyReviewPanel.dom.test.tsx --run
```

Expected: all `dailyReviewPanel.dom.test.tsx` tests pass, including `closes the detail panel when Escape is pressed`.

### Task 3: Fix the detail panel's scroll layout

**Files:**
- Modify: `src/styles/globals.css` at `.daily-review-detail` and `.daily-review-items`

- [ ] **Step 1: Give the dialog explicit header/content grid rows**

Update `.daily-review-detail` to include:

```css
  grid-template-rows: auto minmax(0, 1fr);
```

Keep the existing `display: grid`, width, `max-height`, transform, border, background, shadow, and padding declarations unchanged.

- [ ] **Step 2: Make the list the contained scroll region**

Update `.daily-review-items` to include:

```css
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
```

Keep its existing `display: grid`, `gap`, and existing `overflow-y: auto` behavior; do not introduce a second nested scroll container.

- [ ] **Step 3: Run the focused tests and typecheck**

Run:

```powershell
npm.cmd test -- tests/dailyReviewPanel.dom.test.tsx --run
npm run typecheck
```

Expected: the focused tests pass and typecheck exits successfully without new diagnostics.

### Task 4: Verify the renderer build and inspect the final diff

**Files:**
- Inspect: `src/components/taskList/DailyReviewPanel.tsx`
- Inspect: `src/styles/globals.css`
- Inspect: `tests/dailyReviewPanel.dom.test.tsx`

- [ ] **Step 1: Run the production build**

Run:

```powershell
npm run build
```

Expected: the renderer and Electron build complete successfully.

- [ ] **Step 2: Review the diff for scope and regressions**

Run:

```powershell
git diff -- src/components/taskList/DailyReviewPanel.tsx src/styles/globals.css tests/dailyReviewPanel.dom.test.tsx docs/superpowers/specs/2026-08-20-daily-review-detail-interaction-design.md docs/superpowers/plans/2026-08-20-daily-review-detail-interaction.md
```

Confirm that the change only adds the requested `Escape` close behavior, the scroll-layout constraints, and their regression coverage; no click-outside dismissal or AI data-flow changes should appear.
