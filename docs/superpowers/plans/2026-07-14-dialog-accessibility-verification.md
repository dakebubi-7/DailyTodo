# Dialog Accessibility Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Isolate the normal application surface while either task dialog is open and verify the two dialogs through real DOM keyboard tests and a manual Electron pass.

**Architecture:** Derive task-dialog visibility from the existing overlay composition and pass it to the ordinary content wrapper in `App`. The wrapper remains a sibling of the overlay stack, so `inert` and `aria-hidden` remove only background content from interaction and the accessibility tree. Keep Vitest's global Node environment and use a file-local jsdom directive for DOM integration tests.

**Tech Stack:** React, TypeScript, Framer Motion, Vitest 3, jsdom, React Testing Library, Electron Vite.

---

### Task 1: Add Dedicated Dialog DOM-Test Support

**Files:**
- Modify: `G:\Personal-AI\DailyTodo\app\package.json`
- Modify: `G:\Personal-AI\DailyTodo\app\package-lock.json`
- Create: `G:\Personal-AI\DailyTodo\app\tests\taskDialogs.dom.test.tsx`

- [ ] **Step 1: Write the failing DOM test file using jsdom**

```tsx
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

afterEach(cleanup);

it('renders the completion dialog as a labelled modal and focuses its first control', async () => {
  render(<TaskCompletionDialog task={task} onCancel={vi.fn()} onSave={vi.fn()} onCompleteWithoutReview={vi.fn()} />);
  const dialog = await screen.findByRole('dialog');
  expect(dialog).toHaveAttribute('aria-modal', 'true');
  expect(dialog).toHaveAttribute('aria-labelledby', 'task-completion-dialog-title');
  expect(document.activeElement).toBe(dialog.querySelector('select'));
});
```

- [ ] **Step 2: Run the DOM test and verify that it fails because the test dependencies are missing**

Run: `npm.cmd test -- --run tests/taskDialogs.dom.test.tsx`

Expected: FAIL with an unresolved `@testing-library/react` or jsdom environment dependency.

- [ ] **Step 3: Install the dedicated development dependencies**

```powershell
npm.cmd install --save-dev jsdom @testing-library/react
```

- [ ] **Step 4: Rerun the focused test and verify that the existing dialog integration passes or exposes the minimal test-environment gap**

Run: `npm.cmd test -- --run tests/taskDialogs.dom.test.tsx`

Expected: test runner starts in jsdom; resolve only required DOM polyfills or test fixture issues.

### Task 2: Cover Real Dialog Keyboard and Focus Lifecycles

**Files:**
- Modify: `G:\Personal-AI\DailyTodo\app\tests\taskDialogs.dom.test.tsx`

- [ ] **Step 1: Add failing integration coverage for both dialogs**

```tsx
it.each([completionHarness, reviewHarness])('$name wraps Tab, closes on Escape, and restores the trigger', async ({ renderDialog }) => {
  const trigger = document.createElement('button');
  document.body.append(trigger);
  trigger.focus();
  const onClose = vi.fn();
  const view = renderDialog(onClose);
  const dialog = await screen.findByRole('dialog');
  const controls = dialog.querySelectorAll<HTMLElement>('button, input, select, textarea');
  controls[controls.length - 1].focus();
  fireEvent.keyDown(dialog, { key: 'Tab' });
  expect(document.activeElement).toBe(controls[0]);
  fireEvent.keyDown(dialog, { key: 'Escape' });
  expect(onClose).toHaveBeenCalledOnce();
  view.unmount();
  expect(document.activeElement).toBe(trigger);
});
```

- [ ] **Step 2: Run the focused DOM tests and confirm failures identify a real lifecycle gap, not a test setup error**

Run: `npm.cmd test -- --run tests/taskDialogs.dom.test.tsx`

Expected: FAIL only if the current React integration does not satisfy the asserted behavior.

- [ ] **Step 3: Apply the smallest production adjustment needed to satisfy real browser semantics**

```tsx
const { dialogRef, handleKeyDown } = useDialogFocus(Boolean(task), onClose);

<motion.div ref={dialogRef} role="dialog" aria-modal="true" onKeyDown={handleKeyDown} tabIndex={-1}>
```

Keep the established callbacks, labels, and focus lifecycle; do not introduce a second dialog state model.

- [ ] **Step 4: Rerun the focused DOM and pure helper tests**

Run: `npm.cmd test -- --run tests/taskDialogs.dom.test.tsx tests/dialogFocus.test.ts tests/dialogKeyboard.test.ts`

Expected: all dialog tests PASS.

### Task 3: Isolate the Task Dialog Background

**Files:**
- Modify: `G:\Personal-AI\DailyTodo\app\src\components\AppOverlayStack.tsx`
- Modify: `G:\Personal-AI\DailyTodo\app\src\app\appShellComposition.tsx`
- Modify: `G:\Personal-AI\DailyTodo\app\src\App.tsx`
- Modify: `G:\Personal-AI\DailyTodo\app\tests\taskDialogs.dom.test.tsx`

- [x] **Step 1: Add a failing assertion for the background-isolation contract**

```tsx
expect(getTaskDialogIsolation({ completionDialogProps, reviewDialogProps })).toEqual({
  inert: true,
  ariaHidden: true,
});
```

The test must also cover the closed state and prove that Settings-only visibility does not activate task-dialog isolation.

- [x] **Step 2: Run the focused test and verify it fails because no task-dialog isolation contract exists**

Run: `npm.cmd test -- --run tests/taskDialogs.dom.test.tsx`

Expected: FAIL because the composition does not expose task-dialog visibility to `App`.

- [x] **Step 3: Implement a narrow sibling-wrapper isolation contract**

```tsx
const isTaskDialogOpen = Boolean(completionDialogProps.task || reviewDialogProps.task);

<div inert={isTaskDialogOpen ? '' : undefined} aria-hidden={isTaskDialogOpen || undefined}>
  <TitleBar {...shellComposition.titleBarProps} />
  <AppMainContent {...shellComposition.mainContentProps} />
</div>
<AppOverlayStack {...shellComposition.overlayStackProps} />
```

Expose `isTaskDialogOpen` from the overlay/composition boundary. The wrapper must not contain `AppOverlayStack`.

- [x] **Step 4: Rerun dialog tests and structural UI verification**

Run: `npm.cmd test -- --run tests/taskDialogs.dom.test.tsx tests/dialogFocus.test.ts tests/dialogKeyboard.test.ts`

Run: `npm.cmd run verify:task-ui`

Expected: all commands PASS.

### Task 4: Electron Acceptance and Release Verification

**Files:**
- Modify: `G:\Personal-AI\DailyTodo\app\task_plan.md`
- Modify: `G:\Personal-AI\DailyTodo\app\findings.md`
- Modify: `G:\Personal-AI\DailyTodo\app\progress.md`

- [x] **Step 1: Launch the Electron development application**

Run: `npm.cmd run dev`

Expected: Electron Vite starts the renderer and desktop application.

- [ ] **Step 2: Perform the manual task-dialog keyboard checklist**

For each target dialog, open it from a focused task action, verify initial focus, Tab and Shift+Tab wrapping, Escape close, and focus restoration. Record completed checks or an environment blocker in `progress.md`.

- [x] **Step 3: Run the complete release validation set**

Run: `npm.cmd run lint`

Run: `npm.cmd run typecheck`

Run: `npm.cmd run verify:task-ui`

Run: `npm.cmd run verify:cleanup-core`

Run: `npm.cmd run build`

Run: `git -C .. diff --check`

Expected: every command exits successfully.

- [x] **Step 4: Update project records with exact verification evidence and remaining-risk assessment**

Record the dialog-isolation ownership, DOM test coverage, Electron result, command outcomes, and whether any concrete issue blocks UI changes. Do not stage or commit files.
