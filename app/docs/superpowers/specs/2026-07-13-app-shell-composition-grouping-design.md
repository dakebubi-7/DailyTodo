# App Shell Composition Grouping Design

## Goal

Make App Shell composition inputs easier to scan and maintain without changing the public `createAppShellComposition` call site, component props, state ownership, or rendered output.

## Architecture

`appShellCompositionTypes.ts` will replace the flat `AppShellCompositionOptions` contract with three semantic input groups: title-bar inputs, main-content inputs, and overlay inputs. `AppShellCompositionOptions` will compose those groups, retaining its existing export name.

`appShellCompositionInputs.ts` will build those groups directly from local and task state. `appShellComposition.tsx` will consume the groups and delegate them to the existing main-content and overlay composition factories; it will remain the owner of final TitleBar prop assembly.

## Data Flow

`useAppShellComposition` continues to call `createAppShellComposition(createAppShellCompositionInputs(...))`. The inputs factory returns an equivalent value with nested groups. The shell composition factory reads each group, forwards the main-content and overlay groups unchanged to their existing factories, and returns the same `titleBarProps`, `mainContentProps`, and `overlayStackProps` object shape.

## Error Handling And Compatibility

This is a type-and-object-shape refactor only. It introduces no new runtime validation, fallbacks, state, or asynchronous work. `AppShellCompositionOptions` remains exported from `appShellComposition.tsx` so existing type-only imports remain valid.

## Verification

A focused structural verifier will require grouped contracts, grouped input assembly, and grouped delegation. It will also assert that the public options export and final output shape remain stable. Existing shell, main-content, and overlay verifiers, TypeScript checking, and the production build will guard integration behavior.

