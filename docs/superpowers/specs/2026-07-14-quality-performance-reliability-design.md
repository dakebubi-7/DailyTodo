# DailyTodo Quality, Performance, and Reliability Optimization Design

Date: 2026-07-14

## Goal

Improve DailyTodo's measurable startup footprint, regression confidence, text integrity, keyboard accessibility, and Windows-native resilience without changing established product workflows or performing line-count-driven refactors.

## Scope and Delivery Order

The work is delivered in six independently verifiable phases:

1. Establish a production build baseline, identify remaining main-chunk and CSS contributors, remove only demonstrated dead weight, and introduce domain-focused verification aggregates. `verify:cleanup-core` remains the full release gate.
2. Add behavior-level tests for high-risk domain outcomes: Obsidian sync preparation and writes, AI daily-review failure/success diagnostics, and task completion/review transitions.
3. Audit source files as UTF-8 data and correct only confirmed mojibake or inconsistent user-visible text. Terminal rendering artifacts are not sufficient evidence for a source change.
4. Add regression coverage for keyboard and accessibility behavior, prioritizing dialog focus/escape behavior, task expansion, and accessible names.
5. Make Windows-native calls explicitly degrade when a native dependency or capability is unavailable, while recording actionable diagnostics and retaining the normal Windows path.
6. Re-run production builds and the relevant domain aggregates, compare generated asset sizes with the baseline, and run the complete cleanup/type/build gates.

## Architecture and Boundaries

### Build and verification

Build analysis is observational before it becomes corrective. The existing lazy boundaries are retained unless analysis identifies a main-chunk dependency that is both non-critical at startup and safely isolated. CSS changes require a source-to-output connection and must not remove state, theme, or responsive selectors solely because they appear uncommon.

Domain verification aggregates are thin `package.json` command groups that compose existing focused scripts and new behavioral tests. They shorten local feedback for Obsidian, AI review, task UI, and app-shell work. The existing broad `verify:cleanup-core` suite remains the authoritative integration gate.

### Behavioral tests

Tests should assert inputs, observable outputs, writes, callback calls, and error/diagnostic values. Structural verifier scripts remain useful for ownership boundaries, but they do not replace outcome tests. Test seams should use existing dependency injection and pure helpers where possible; no broad test-framework migration is part of this work.

### Text integrity

The audit scans actual source bytes and decoded UTF-8 text, then cross-checks user-visible values through existing i18n/runtime accessors. Confirmed issues receive narrow literal fixes with localized verifier coverage. Historical files that decode correctly are not rewritten merely to normalize formatting or terminal display.

### Accessibility

Accessibility coverage targets existing behavior and semantic contracts rather than a visual redesign. Keyboard tests exercise real key paths; focus tests verify the active element or documented callback results; semantic tests verify accessible names and relevant ARIA state. New UI controls must preserve the project's established interaction patterns.

### Windows native resilience

`electron/win32Native.ts` and its callers remain the platform boundary. Capability checks and exception handling produce typed or structured unavailable results rather than propagating platform-specific failures into unrelated app startup or window-mode code. Diagnostics identify the attempted operation and reason, without exposing secrets or altering supported Windows behavior.

## Error Handling

- Build analysis failures are reported separately from application failures and do not trigger speculative code splitting.
- Sync and AI test fixtures use temporary inputs and assert that failed preconditions do not write application files.
- Text-audit decoding errors are recorded as findings and fixed only after confirming the intended localized value.
- Native capability failures leave the app in its existing non-native fallback mode and emit a concise diagnostic record.

## Verification

Each phase runs its focused command group plus TypeScript checking. Runtime or UI-affecting changes also run production build output checks. The final phase runs:

- focused domain aggregates;
- `npm.cmd run typecheck`;
- `npm.cmd run verify:cleanup-core`;
- `npm.cmd run build`;
- `git diff --check` from the repository root.

Success is defined by passing gates, no unintended user-visible behavior changes, documented baseline-versus-final build metrics, and no unsupported native failure path reaching renderer workflows.

## Explicit Non-Goals

- Rewriting established modules solely to reduce file length.
- Removing existing structural verifiers or weakening the release gate.
- Broad language or copy redesign.
- Replacing the application test framework.
- Changing supported Windows-native behavior while adding fallbacks.
