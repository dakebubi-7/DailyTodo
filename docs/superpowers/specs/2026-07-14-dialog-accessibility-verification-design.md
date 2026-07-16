# Dialog Accessibility Verification Design

## Goal

Complete the accessibility verification chain for the task completion and task review dialogs: isolate application background content while either dialog is open, add real DOM-level regression coverage, perform a manual Electron keyboard pass, and run a fresh lint and release check.

## Scope

This change applies only when `TaskCompletionDialog` or `TaskReviewDialog` is open. It does not change the behavior of Settings, AI onboarding, template editing, or Obsidian Companion overlays. Existing dialog callbacks, visual treatment, Escape behavior, and focus lifecycle remain unchanged.

## Background Isolation

`AppOverlayStack` already owns the rendering decision for both target dialogs. It will expose whether either task dialog is open to the App shell composition layer. The ordinary application content region will receive `inert` and `aria-hidden="true"` only while a target dialog is rendered. This prevents pointer, keyboard, and assistive-technology interaction with background content without applying hidden state to the overlay stack that contains the dialog.

The state is derived from existing `completionDialogProps.task` and `reviewDialogProps.task`; it creates no new modal state and does not change overlay render order.

## DOM-Level Regression Tests

Add `jsdom` and `@testing-library/react` as development dependencies. Configure a dedicated Vitest environment for dialog DOM tests rather than changing the global Node environment used by the existing pure tests.

The tests will render each dialog with minimal task fixtures and assert:

1. The dialog has `role="dialog"`, `aria-modal="true"`, and a title relationship.
2. Initial focus is placed on the first enabled dialog control.
3. Tab from the final control wraps to the first, and Shift+Tab from the first wraps to the final.
4. Escape invokes the existing close callback.
5. Unmount restores focus to the connected trigger element.

Pure helper tests remain in place; DOM tests validate the React integration and actual browser focus semantics.

## Runtime Acceptance

Start the existing Electron development command and perform a manual keyboard pass for both task dialogs. Record the outcome in `progress.md`: open from a focused task action, verify initial focus, Tab/Shift+Tab boundaries, Escape close, and focus return. If the development environment cannot be launched, explicitly record the blocker and do not claim manual acceptance.

## Validation

Run the focused DOM and pure dialog tests, task UI verification, `npm.cmd run lint`, TypeScript checking, aggregate cleanup verification, production build, and `git -C .. diff --check`. Existing worktree changes remain uncommitted.

## Deliberate Limits

This pass does not make every existing overlay modal, does not introduce global overlay stacking or scroll-lock infrastructure, and does not add end-to-end automation tooling. It creates a narrow, testable standard for the two task dialogs before broader UI work begins.
