# App Review Dialog Verifier Calibration Design

## Purpose

Align the review-dialog structural verifier with grouped App Shell overlay composition so cleanup verification can continue without runtime changes.

## Context

`useAppShellComposition.ts` derives the review dialog state. `appShellCompositionInputs.ts` places that value in the `overlay` group. `appShellComposition.tsx` delegates the complete group to `createAppShellOverlayComposition`, which maps the two derived task values to the completion and review dialog props.

The current verifier requires `appShellComposition.tsx` to rebuild an inline overlay object containing `reviewDialogState`. That describes the previous flat composition API and conflicts with the current grouped composition boundary.

## Chosen Approach

Replace the stale flat-facade assertion with three ownership checks:

- shell inputs assign `reviewDialogState` inside the `overlay` group;
- shell composition delegates `overlay` unchanged to `createAppShellOverlayComposition`;
- overlay composition maps `reviewDialogState.completionTask` and `reviewDialogState.currentReviewTask` to their existing dialog props.

Existing state-derivation and App delegation assertions remain in place.

## Scope And Validation

This phase changes only `verify-app-review-dialog-state-module.ts` and planning records. No application behavior, dialog props, component files, localized text, or Electron behavior changes.

Validation will run the focused review-dialog verifier, `verify:cleanup-core`, TypeScript checking, the production build, and `git diff --check`.
