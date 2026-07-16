# App Personalization Verifier Calibration Design

## Purpose

Align the personalization structural verifier with the grouped App Shell composition boundary so aggregate cleanup verification can continue without changing runtime behavior.

## Context

The App Shell now receives a grouped `mainContent` input and delegates it unchanged to `createAppShellMainContentComposition`. The dark-mode action is assembled in `appShellCompositionInputs.ts`, belongs to the `mainContent` group, and is mapped to Header's `onToggleDark` prop by `appShellMainContentComposition.tsx`.

`verify-app-personalization-module.ts` still expects `appShellComposition.tsx` to contain a direct flat `toggleDarkModeAction` assignment. That requirement predates the grouped composition extraction and no longer describes the active ownership boundary.

## Chosen Approach

Replace the stale flat-shell assertion with checks that verify the actual three-stage route:

- `appShellCompositionInputs.ts` places `appPersonalizationActions.toggleDarkModeAction` in the `mainContent` composition input.
- `appShellComposition.tsx` delegates `mainContent` to `createAppShellMainContentComposition` unchanged.
- `appShellMainContentComposition.tsx` maps `toggleDarkModeAction` to Header's `onToggleDark` prop.

Existing behavioral assertions and SettingsPanel personalization wiring remain unchanged.

## Scope And Validation

This phase changes only the personalization verifier and planning records. It does not change the renderer, state, App Shell runtime modules, localized text, or Electron behavior.

Validation will run the focused personalization verifier, `verify:cleanup-core`, TypeScript checking, the production build, and `git diff --check`.
