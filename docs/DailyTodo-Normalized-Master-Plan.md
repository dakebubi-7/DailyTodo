# DailyTodo Normalized Master Plan

Date: 2026-07-07
Status: Phase 2 baseline plan

## 1. North Star

DailyTodo is a local-first AI daily execution coach for independent builders.

The product should help a user do five things every day:

1. Choose the 1-3 tasks that matter today.
2. Understand why those tasks matter.
3. Break each important task into a concrete next step.
4. Execute and record what actually moved.
5. Turn the day into useful review material for tomorrow, weekly reports, monthly reports, and Obsidian archives.

DailyTodo is not trying to become a team calendar, meeting scheduler, enterprise project manager, general AI chat workspace, or Notion replacement.

## 2. Current Product Reality

DailyTodo is already beyond the original simple todo specification. The current app includes:

- Electron desktop shell with tray behavior, compact mode, always-on-top mode, desktop/window mode, custom title bar, and Windows-specific window handling.
- React task workflow with nested tasks, drag ordering, scheduled dates, tags, task completion reviews, deleted-review retention, carry-forward, and selected-date state.
- Daily work and inspiration notes.
- Obsidian daily-note sync through managed Markdown blocks.
- Obsidian Companion preview/write/import flow.
- AI Review settings, profiles, daily/weekly/monthly/external report generation, timers, source selection, diagnostics, and progress UI.
- Rich personalization: themes, glass opacity, blur, radius, color overrides, font scale, dark mode, and invisible theme behavior.
- A large verification surface using focused `verify:*` scripts plus `verify:cleanup-core`, `verify:rc`, `typecheck`, and `build`.

The codebase has already received substantial modularization. The remaining plan should protect this work rather than restart it.

## 3. Planning Principles

- Preserve existing behavior unless a phase explicitly declares a product change.
- Add focused verification before risky extraction or behavior changes.
- Keep local-first guarantees: local storage, BYOK-friendly AI, Markdown/Obsidian ownership, and no forced cloud dependency.
- Keep the home screen centered on daily execution, not settings, reports, dashboards, or AI chatter.
- Treat AI as a low-interruption assistant. AI can suggest, draft, and compress, but user intent remains the source of truth.
- Avoid monetization work until the manual daily-focus loop is coherent and useful.
- Do not rename storage keys, managed Obsidian markers, or AI settings fields without migration and regression coverage.

## 4. System Boundaries

### Renderer

- `src/App.tsx` remains the top-level wiring layer for state, hooks, effects, and major UI composition.
- `src/app/*` owns App-level pure helpers and workflow factories.
- `src/hooks/useTasks.ts` owns task state orchestration, persistence, rollover, carryover, mutation delegation, and Obsidian sync triggers.
- `src/hooks/task*.ts` owns task selectors, transforms, mutations, ordering, persistence, carryover, and sync helpers.
- `src/components/*` owns visible UI surfaces.
- `src/components/settings/*` owns settings sections and shared controls.
- `src/components/taskItem/*` owns task-card presentation, subtask rows, context-menu payloads, editing helpers, stack rendering, and virtualization.
- `src/styles/index.css` is the global renderer style entry.
- `src/i18n.ts` is the central UI text surface and needs a dedicated encoding cleanup pass.

### Electron

- `electron/main.ts` remains the high-risk shell orchestrator for lifecycle, window/tray behavior, Obsidian sync IPC, AI IPC/timers, and Windows integration.
- `electron/windowIpc.ts`, `settingsIpc.ts`, `taskContextMenuIpc.ts`, and `companionIpc.ts` are the preferred pattern for future IPC extraction: explicit dependency injection, no hidden state ownership.
- `electron/aiReview/*` owns AI report generation and writing.
- `electron/obsidianCompanion.ts` owns Companion sync planning/writing.
- `electron/preload.ts` is the only renderer bridge surface.

### Shared

- `shared/appSettings.ts` owns behavior/template defaults and normalizers.
- `shared/taskRollover.ts` owns business-date logic.
- `shared/obsidianTemplates.ts` owns managed Markdown rendering and block replacement.
- `shared/aiReview/*` owns AI Review settings, prompts, source material collection, diagnostics, template recognition, and report utilities.
- `shared/windowMode.ts` owns the window mode model.

## 5. Product Roadmap

### Phase P0: Stabilize The Current Codebase

Goal: make the current broad feature set safe to change.

Scope:

- Finish documentation/code-map cleanup after ongoing modularization.
- Clean `src/i18n.ts` encoding in a dedicated, visually reviewed pass.
- Continue reducing high-risk files only through narrow, verification-backed slices.
- Keep `verify:cleanup-core`, `verify:rc`, `typecheck`, and `build` healthy.

Acceptance:

- A developer can find the owner module for task, settings, Electron, Obsidian, AI Review, and style behavior from documentation.
- No visible UI copy is damaged by encoding edits.
- Focused structural checks protect each newly extracted boundary.

### Phase P1: Manual Today Focus Loop

Goal: DailyTodo should work as an execution coach even without AI.

Scope:

- Add a first-class today-focus concept for 1-3 promoted tasks.
- Store focus metadata locally: focus rank, why it matters, next step, and execution state.
- Let users promote/demote tasks, reorder today-focus tasks, and carry unfinished focus context forward.
- Adjust the home screen so today focus appears above ordinary task management.
- Keep ordinary task list, search, tags, filters, subtasks, scheduled dates, and completion review usable but visually secondary.

Acceptance:

- Within five seconds of opening the app, the user can see the most important 1-3 tasks for today.
- Each focus task can have a next step and reason.
- The product guides toward 1-3 focus tasks without hard-blocking ordinary task capture.
- Existing task persistence, Obsidian sync, carryover, and completion review still work.

### Phase P2: Low-Interruption AI Assistance

Goal: AI helps at decision points rather than becoming the interface.

Scope:

- Suggest today-focus tasks from existing tasks, notes, and recent review material.
- Draft or improve focus reasons and next steps.
- Detect oversized, vague, or blocked tasks and suggest smaller next steps.
- Generate short evening review drafts and tomorrow suggestions.
- Require explicit user acceptance or editing before AI suggestions mutate user-owned data.

Acceptance:

- No API key still leaves the manual loop fully usable.
- AI outputs are short, editable, and attached to concrete task actions.
- AI suggestions never overwrite user-entered focus metadata without confirmation.
- AI errors surface with actionable diagnostics and do not break local task management.

### Phase P3: Review Assets And Obsidian Value

Goal: daily execution accumulates into reusable records.

Scope:

- Save daily focus, execution state, completion reviews, work notes, and inspiration notes as durable local review material.
- Strengthen Obsidian export for focus/review data while preserving user-owned content outside managed markers.
- Generate weekly/monthly reports from actual daily records instead of generic summaries.
- Make report provenance visible enough that users trust the generated output.

Acceptance:

- A user can review a week of focus tasks, outcomes, and notes.
- Weekly/monthly reports are traceable to real daily records.
- Obsidian sync does not duplicate sections and does not overwrite content outside managed blocks.

### Phase P4: Pro Boundary And Distribution

Goal: define a commercial shape only after the core loop is valuable.

Scope:

- Keep manual focus planning, basic reviews, local storage, and basic export available without Pro.
- Put AI acceleration, advanced review/report generation, advanced Obsidian/export workflows, and premium personalization behind Pro if needed.
- Preserve BYOK as the first commercial-friendly AI model.
- Prepare release documentation, onboarding, and upgrade messaging without making the product feel like a paywall demo.

Acceptance:

- Free/manual mode demonstrates the method.
- Pro mode saves planning/review time rather than unlocking basic task management.
- Distribution docs and verification commands are current for a Windows release candidate.

## 6. Technical Roadmap

### T0: Documentation And Planning Hygiene

- Keep this master plan as the stable product/technical north-star.
- Keep phase-specific implementation plans in `docs/superpowers/plans/`.
- Keep `docs/DailyTodo-Codebase-Map.md` and `docs/DailyTodo-Developer-Code-Guide.md` current after boundary changes.
- Avoid using `app/task_plan.md` as the long-term product roadmap; it is now mostly a cleanup execution log.

### T1: Encoding And Text Resources

- Audit `README.md`, `SPEC.md`, `src/i18n.ts`, and visible Chinese UI copy for mojibake.
- Prefer UTF-8 source files; use Unicode escapes only where the existing tooling demonstrably corrupts direct Chinese text.
- Add a focused verification script for key visible strings before large text edits.
- Visually verify affected screens after the cleanup.

### T2: Electron Main Decomposition

- Continue extracting IPC/lifecycle modules from `electron/main.ts` by feature.
- Good next candidates: Obsidian sync IPC, AI Review IPC/timer registration, tray/window lifecycle helpers, and native desktop-mode handling.
- Keep mutable window ownership and Windows integration behavior in `main.ts` until focused tests make extraction safe.

### T3: Renderer Orchestration Decomposition

- Keep extracting pure decisions and workflow factories from `App.tsx` only when the call site becomes simpler.
- Avoid moving hook placement and effect dependency ownership unless the verification surface covers behavior.
- Keep `useTasks.ts` as the public task orchestration hook, but continue moving pure helpers out of it.

### T4: Styling Architecture

- Treat `src/styles/globals.css` as a high-risk monolith.
- Split styles by stable surfaces only after adding visual or structural checks for the moved selectors.
- Protect global CSS entry through `src/styles/index.css`.
- Avoid broad palette/theme rewrites during structural cleanup.

### T5: Verification Standard

Every non-trivial slice should define:

- Focused red/green verifier for the new behavior or boundary.
- Related existing regression checks.
- `npm run typecheck`.
- `npm run verify:cleanup-core` for refactors.
- `npm run verify:rc` for release-candidate behavior.
- `npm run build` before declaring a production-ready slice.

## 7. Immediate Next Implementation Candidates

Recommended order:

1. Create an implementation plan for the manual today-focus data model and UI entry points.
2. Clean encoding/text resources enough that product-facing work can safely touch copy.
3. Extract one more `electron/main.ts` boundary only if it directly lowers risk for today-focus or AI Review work.
4. Add today-focus storage and pure selectors/mutations with focused verification.
5. Add the first home-screen today-focus section with manual promote/demote/reorder controls.
6. Extend Obsidian/review export only after the manual focus loop is stable.

## 8. Risk Register

| Risk | Impact | Control |
|------|--------|---------|
| Home screen becomes a dashboard | The daily execution loop loses clarity | Prioritize today focus and keep reports/settings secondary |
| AI becomes noisy | Users stop trusting the assistant | Show AI only at start, stuck moments, review, and report generation |
| Encoding cleanup damages UI copy | Product text regresses invisibly in source review | Add string checks and visual review before/after edits |
| `electron/main.ts` refactor changes window behavior | Desktop widget reliability regresses | Extract through dependency-injected modules and verify window modes |
| Obsidian sync overwrites user content | Severe trust loss | Preserve managed markers and test content outside markers |
| Storage schema changes break existing users | Data loss or confusing migration | Add normalizers/migrations before changing persisted shapes |
| Pro planning distracts from product value | Premature monetization weakens core loop | Ship manual focus loop first |

## 9. Definition Of Done For Future Phases

A phase is complete only when:

- The user-visible behavior or module boundary is documented.
- Focused verification exists for the changed behavior or boundary.
- Relevant regression commands pass.
- High-risk persistence, Obsidian, AI, and window-mode assumptions are explicitly checked or declared unaffected.
- The codebase map and developer guide are updated when ownership boundaries change.
- The next phase can be started from this master plan without rereading every historical plan.

