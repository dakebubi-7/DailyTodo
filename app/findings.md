# DailyTodo Cleanup Findings

## Requirements
- 用户希望“可以整理的都整理”，目标是一个完整、分模块、以后方便更改的代码库。
- 保持软件现有行为，不做无关视觉或产品变更。
- 尽量一次推进到可验证状态，但大风险拆分要分阶段落地。

## Research Findings
- `src/hooks/useTasks.ts` 已经在前一阶段拆出多个任务核心模块：`taskTransforms`、`taskSelectors`、`taskCarryover`、`taskPersistence`、`taskObsidianSync`、`taskMutations`、`taskReviewMutations`、`taskOrderingState`、`taskHookState`。
- `package.json` 已有多个专项验证命令，但还缺少把任务核心和清理回归串起来的一键脚本。
- `src/main.tsx` 已导入 `./styles/globals.css` 和 `./styles/context-menu.css`。
- `src/App.tsx` 也导入了 `./styles/context-menu.css`，与 `src/main.tsx` 重复。
- `src/styles/globals.css` 内部导入了 `./watercolor-theme.css`。
- `src/components/SettingsPanel.tsx` 文件较大，里面包含可抽出的通用控件：`RangeControl`、`Field`、`AutoStartToggle`、`ToggleRow` 等。
- `electron/main.ts` 文件较大，包含 store、窗口、图标、Win32、IPC、AI、Obsidian 等逻辑，适合后续按低耦合边界拆分。

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| 新增组合验证脚本 | 以后重构前后可快速跑核心回归。 |
| 先清理重复 CSS import | 影响面小，结构收益明确。 |
| 设置面板先抽 `settings` 子目录 | 保留组件邻近性，同时避免一个文件继续膨胀。 |
| Electron main 先抽 icon/store 等纯模块 | 降低 IPC 和运行时生命周期被误改的概率。 |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| 工作区已有大量修改和未跟踪文件 | 只在当前目标范围内追加/修改，不回退用户或前序改动。 |
| 中文输出存在疑似 mojibake | 本轮先不批量改运行时中文文案，只记录并谨慎处理。 |

## Resources
- `src/hooks/useTasks.ts`
- `src/components/SettingsPanel.tsx`
- `src/App.tsx`
- `src/main.tsx`
- `electron/main.ts`
- `package.json`

## Visual/Browser Findings
- 本轮尚未进行视觉或浏览器检查。

## TaskItem Context Menu Helper Findings - 2026-07-06
- `src/components/TaskItem.tsx` contained inline context-menu theme construction, including CSS numeric parsing, `theme-*` class detection, CSS variable fallback values, and IPC payload construction.
- This logic was low-risk to extract because React event ownership, DOM queries, and `window.electronAPI?.openTaskContextMenu` remain in `TaskItem.tsx`.
- `scripts/verify-context-menu.ts` needed to follow the new boundary by checking theme CSS variable capture in `src/components/taskItem/taskItemContextMenu.ts` instead of requiring those strings inline in `TaskItem.tsx`.

## TaskItem Virtual Subtasks Hook Findings - 2026-07-06
- `src/components/TaskItem.tsx` kept subtask virtualization constants and hook logic inline after the context-menu helper split.
- The virtualization logic was safe to extract because it depends only on the subtask list, expansion state, React scroll state, and fixed layout constants; rendering and task mutations remain in `TaskItem.tsx`.
- Focused structural verification now protects the extracted hook boundary and ensures the old row-height, overscan, threshold, passive scroll listener, and top-positioning math remain visible in the helper module.



## TaskItem SubtaskCard Module Findings - 2026-07-06
- `src/components/TaskItem.tsx` still contained the full child-task row component after context-menu and virtualization extraction.
- The subtask row is a safe component boundary because it depends on a single `Task` plus explicit callbacks for toggle, edit, priority change, review, and delete; virtual-list positioning and animation remain in `TaskItem.tsx`.
- Shared icons, review detection, and priority labels are used by both the parent task card and subtask rows, so they now live in `src/components/taskItem/taskItemPresentation.tsx` instead of being duplicated or retained inline.
- During extraction, an over-broad text-slice removed part of `TaskItemProps`; TypeScript caught the issue at `TaskItem.tsx(36)`, and the fix restored the callback signatures while keeping the extracted modules.


## TaskItem Stack Helper Findings - 2026-07-06
- `src/components/TaskItem.tsx` still owned pure collapsed-stack presentation constants after the subtask row extraction.
- These constants are safe to extract because they do not depend on React state or DOM access; `TaskItem.tsx` continues to render the segment markup and apply animation props.
- Focused verification now protects the segment class names, spring values, reduced-motion fallback, per-segment delay, subtask stagger timing, and stack-count cap.


## App Task View Helper Findings - 2026-07-06
- `src/App.tsx` still owned pure view derivation for visible tasks, drag-disabled state, and selected-date command task aliasing.
- This logic is safe to extract because it depends only on task arrays and current filter/search/tab values; App keeps state ownership, persistence effects, handlers, and rendering.
- Focused verification now protects open-only filtering, priority filtering, trimmed case-insensitive search, `isTaskDragDisabled` delegation, and the `selectedDateTaskCommands` passthrough.


## App Personalization Helper Findings - 2026-07-06
- `src/App.tsx` still owned pure personalization calculations after task-view extraction: store key constants, font-scale clamping, loaded-settings normalization, removed theme fallback, startup theme override seeding/merging, preset application, reset calculation, and per-theme opacity memory.
- These calculations are safe to extract because they depend only on settings values, theme presets, and override records; `App.tsx` continues to own Electron store calls, React state setters, DOM class/font-size effects, and SettingsPanel event wiring.
- Focused verification now protects the previous behavior: `personalizationSettings` and `themeOpacityOverrides` keys, 80..130 font-scale clamp with 100 fallback, default merge, `matchThemePreset` fallback for old settings, unknown theme id removal, seeded override precedence below stored overrides, remembered override application on preset switch, reset override deletion with minimal fallback, and opacity override memory on personalization changes.

## App Completion Flow Helper Findings - 2026-07-07
- `src/App.tsx` still owned pure completion/review-routing decisions after personalization extraction: whether a main task or subtask should toggle directly, complete without review, or open the completion-review dialog.
- These decisions are safe to extract because they depend only on the current task/subtask, app review settings, the optional completion target, and task review fields; `App.tsx` continues to own React state setters, task mutation calls, dialog cleanup, and rendering.
- Focused verification now protects the previous behavior: missing/completed main task direct toggle, main review setting branching, missing/completed subtask direct toggle, no-review subtask completion mutation, task/subtask review-request targets, fallback target resolution, existing review detection, subtask-vs-task review target detection, and completed-without-review edit routing.
- `verify:app-task-tree-module` needed a boundary update because `isSubtask` is still exported by `src/utils/taskTree.ts` but is now consumed by `src/app/appCompletionFlow.ts` rather than directly by `App.tsx`.

## App Template Editor Helper Findings - 2026-07-07
- `src/App.tsx` still contained pure template-editor kind mapping after completion-flow extraction: nested selection of initial templates, per-kind default fallbacks, and save-time mapping from kind to Obsidian template settings field.
- This logic is safe to extract because it depends only on `editingTemplateKind`, `obsidianTemplates`, and the saved template value; `App.tsx` continues to own modal state, async settings persistence, and UI event wiring.
- Focused verification now protects the five existing template fields and fallback defaults: `dailyTemplate`, `weeklyTemplate`, `monthlyTemplate`, `externalWeeklyTemplate`, `externalMonthlyTemplate`, `createDefaultDailyTemplate()`, and `createDefaultReportTemplate(...)` for each report kind.


## App Keyboard Shortcuts Helper Findings - 2026-07-07
- `src/App.tsx` still contained pure keyboard shortcut decision logic after template-editor extraction: Ctrl+K, Ctrl+O, bracket date navigation, and typing-target guards.
- This logic is safe to extract because it depends only on the DOM `KeyboardEvent`; `App.tsx` continues to own event registration, `preventDefault`, React state updates, date shifting, and side effects.
- Focused verification now protects the previous behavior: Ctrl+K and Ctrl+O are handled before typing guards, `[` and `]` are ignored while typing in INPUT/TEXTAREA, and the shortcut module stays included in `verify:cleanup-core`.
- `verify:app-task-tree-module` needed another boundary update after keyboard shortcut extraction: `shiftDateKey` remains used by `App.tsx`, but the previous/next day deltas now live in `src/app/appKeyboardShortcuts.ts`.


## App Companion Status Helper Findings - 2026-07-07
- `src/App.tsx` still contained pure Obsidian Companion status message mapping after keyboard shortcut extraction: preview success, sync success, mobile import success, and error joining.
- This logic is safe to extract because it depends only on Companion result objects; `App.tsx` continues to own async store calls, sync-plan state, mobile capture item updates, and panel props.
- Focused verification now protects the previous behavior: preview success uses `plan.changes.length`, sync success remains `Synced to Obsidian.`, mobile import success uses `result.items.length`, and failures join errors with a single space.


## App Scheduled Reports Helper Findings - 2026-07-07
- `src/App.tsx` still contained pure scheduled AI report date calculations and error diagnostic handling after Companion status extraction.
- This logic is safe to extract because date-key calculation depends only on the current date and result handling depends only on the report result plus the existing `window.__dailytodoLastScheduledError` diagnostic boundary; `App.tsx` continues to own listener registration, Electron IPC calls, and task inputs.
- Focused verification now protects the previous behavior: weekly scheduled generation targets today minus seven days, monthly scheduled generation targets the previous month end, date keys stay `YYYY-MM-DD`, failures still warn with `[scheduled report]`, and the fallback no-source-materials message is still used when no explicit error exists.



## App Theme State Helper Findings - 2026-07-07
- `src/App.tsx` still contained pure theme-state derivation after scheduled-report extraction: active theme id fallback, theme CSS class construction, and invisible-theme detection.
- This logic is safe to extract because it depends only on `personalization` and `matchThemePreset`; `App.tsx` continues to own viewport style calls, DOM class/data attributes, SettingsPanel actions, and React state updates.
- Focused verification now protects the previous behavior: explicit `personalization.themeId` still wins, old/custom settings still fall back through `matchThemePreset(personalization)`, `theme-${activeThemeId}` remains the CSS class format, and invisible-theme detection remains `activeThemeId === 'invisible'`.


## App Review Dialog State Helper Findings - 2026-07-07
- `src/App.tsx` still contained a small pure review-dialog state lookup after theme-state extraction: resolving the latest task tree node for `reviewTask` before passing it to `TaskReviewDialog`.
- This logic is safe to extract because it depends only on `allTasks`, `completionTask`, and `reviewTask`; `App.tsx` continues to own completion target state, dialog open/close handlers, and review/task mutations.
- Focused verification now protects the previous behavior: completion dialog receives the stored `completionTask`, and review dialog receives `reviewTask ? findTaskInTree(allTasks, reviewTask.id) : null` so it reflects the latest task tree state.


## App Companion Capture Helper Findings - 2026-07-07
- `src/App.tsx` still contained pure Companion capture composition after review-dialog extraction: desktop capture items from tasks/daily notes plus imported mobile inbox items.
- This logic is safe to extract because it depends only on current task/note/mobile item inputs; `App.tsx` continues to own lazy preview/sync invocation, Companion settings, async store/IPC calls, mobile inbox import state, and status updates.
- Focused verification now protects the previous behavior: desktop items are still created with `buildCaptureItems(allTasks, selectedDate, dailyWork, dailyInspiration)`, and `mobileCaptureItems` are appended after the desktop-derived items.


## App Companion Mobile Helper Findings - 2026-07-07
- `src/App.tsx` still contained a small pure Companion mobile inbox merge after capture composition extraction: append imported mobile capture items when present.
- This logic is safe to extract because it depends only on existing and imported `CaptureItem[]` arrays; `App.tsx` continues to own import IPC, state setter invocation, and status updates.
- Focused verification now protects the previous behavior: no imported items return the existing array unchanged, while imported items are appended after existing mobile capture items.


## App Task Menu Action Routing Findings - 2026-07-07
- `src/App.tsx` still contained inline popup task-menu dispatch after payload parsing: add subtask, delete task, create edit request, or update task.
- This logic is safe to extract because it depends only on a parsed action plus explicit handler callbacks; `App.tsx` continues to own the Electron listener effect, task mutation functions, and React edit-request state.
- Focused verification now protects the previous behavior: add-subtask actions still pass coerced text to `addSubtask`, delete actions call `deleteTask`, edit actions create a nonce through `createEditRequest`, and update actions call `updateTask` with the parsed updates.


## Electron Companion IPC Findings - 2026-07-07
- `electron/main.ts` still contained the full Obsidian Companion IPC registration block after prior window/settings/task-context-menu IPC extraction.
- This boundary is safe to extract because the handlers depend only on Companion settings accessors plus `buildSyncPlan`, `writeSyncPlan`, and `importMobileInbox`; settings storage and default vault resolution remain in `main.ts`.
- Focused verification now protects the previous behavior: `companion:getSettings`, `companion:setSettings`, `companion:previewSync`, `companion:writeSync`, and `companion:importMobileInbox` stay registered, sync item arrays still fall back to `[]`, and settings writes still return `{ ok: true }`.


## SettingsPanel Sync Section Findings - 2026-07-07
- `src/components/SettingsPanel.tsx` still contained the full Obsidian sync tab after templates, schedule, and general section extraction.
- This boundary is safe to extract because it depends only on explicit props: template settings, vault path, sync preview, and callbacks for vault selection, path setting updates, preview, and toggle changes.
- Focused verification now protects the previous behavior: path fields retain their default fallback values, path edits merge into `obsidianTemplates`, preview still displays file/task counts, and deleted-review sync/confirm-delete toggles still update the same settings keys.

## SettingsPanel Appearance Section Findings - 2026-07-07
- `src/components/SettingsPanel.tsx` still contained the full appearance tab after appearance pure-helper extraction: theme preset card rendering, global appearance sliders, unified glass opacity updates, and color inputs.
- This boundary is safe to extract because it depends only on explicit props: personalization settings, app language, shell text, theme apply/reset callbacks, and the parent `onChange` callback.
- Focused verification now protects the previous behavior: only the four intended theme presets render in the appearance tab, preset application still calls `onApplyTheme(preset)`, reset still uses `onResetTheme`, unified glass opacity still updates all opacity keys through `withUnifiedGlassOpacity`, and color inputs still write `accentColor` / `secondaryColor`.

## SettingsPanel AI Review Timer Section Findings - 2026-07-07
- `src/components/SettingsPanel.tsx` still contained two low-coupling AI Review timer zones after appearance/sync extraction: personal auto-generation and external auto-generation.
- This boundary is safe to extract because it depends only on explicit props: AI review settings, localized settings text, language flag, weekday options, and the typed `updateAiReview` callback.
- Focused verification now protects the previous behavior: weekly and monthly timer toggles still update the same keys, weekday selects still coerce with `Number(event.target.value)`, monthly day inputs still fall back to `1`, external timer controls keep their existing settings keys, and `anonymizeExternalReports` remains part of the external timer section.



## SettingsPanel AI Review Report Routing Section Findings - 2026-07-07
- `src/components/SettingsPanel.tsx` still contained a low-coupling AI Review report-account routing block after timer extraction: daily, personal weekly, and personal monthly account selectors.
- This boundary is safe to extract because it depends only on explicit props: language flag, AI review settings, and the typed `updateAiReview` callback.
- Focused verification now protects the previous behavior: the follow-current-account option remains first, missing profile ids still render a fallback option and warning hint, configured profiles still render from `aiReviewSettings.profiles`, and changes still write the same report profile keys.


## SettingsPanel AI Review Source Settings Section Findings - 2026-07-07
- `src/components/SettingsPanel.tsx` still contained a low-coupling AI Review source/base settings block after report-routing extraction: weekly/monthly source selectors, request timeout, timer time, startup backfill, backfill days, and daily timer toggle.
- This boundary is safe to extract because it depends only on explicit props: localized settings text, language flag, AI review settings, source option arrays, and the typed `updateAiReview` callback.
- Focused verification now protects the previous behavior: personal/external weekly/monthly source selectors keep their original setting keys and casts, option hints still come from the provided source option arrays, timeout still falls back to `90`, backfill days still fall back to `7`, and the startup-backfill/daily-timer toggles still update the same keys.


## SettingsPanel AI Review Manual Generation Section Findings - 2026-07-07
- `src/components/SettingsPanel.tsx` still contained a medium-sized AI Review manual-generation rendering block after source/base extraction: action buttons, generation status/progress, and diagnostic card display.
- This boundary is safe to extract because the new section is presentational: it receives current state and callbacks, while `SettingsPanel.tsx` continues to own `runGeneration`, Electron IPC calls, progress timers/refs, and diagnostic state updates.
- Focused verification now protects the previous behavior: all five actions remain present, buttons still disable while a generation is active, active buttons still use `progressDisplay`, generation status still renders with `GenerationProgress`, and diagnostics still close through the parent callback.


## App UI State Persistence Helper Findings - 2026-07-07
- `src/App.tsx` still contained a startup/persistence block for UI shell state after prior helper extractions: compact mode, daily panel visibility, search state, priority filter, personalization, theme opacity overrides, and dark mode.
- This boundary is safe to extract because the persistence logic depends only on explicit state setters/options and existing Electron Store wrapper calls; `App.tsx` continues to own React hook placement, Companion settings loading, Obsidian template settings loading, and feature-level effects.
- Focused verification now protects the previous behavior: compact/search/panel keys stay stable, priority filter values are still validated as `all|high|medium|low`, loaded personalization still passes through `normalizeLoadedPersonalization`, theme overrides are still seeded and merged through `appPersonalization` helpers, dark mode still loads from `isDark`, and personalization/theme/dark persistence remains guarded by `personalizationReady`.


## App Shell Effects Helper Findings - 2026-07-07
- `src/App.tsx` still contained small shell/UI side effects after UI-state persistence extraction: settings-mode IPC updates, document `dark`/`texture-disabled` class toggles, rem base font-size synchronization, and always-on-top preference application.
- This boundary is safe to extract because each effect depends only on explicit primitive inputs and existing globals; `App.tsx` continues to own hook placement and dependency arrays.
- Focused verification now protects the previous behavior: settings mode still uses the optional `setSettingsMode` IPC call, dark mode and texture toggles still update `document.documentElement.classList`, font scaling still uses `clampFontScale` and the `(14 * scale) / 100` px formula, and always-on-top still only toggles when the loaded preference is truthy.


## App Companion Actions Helper Findings - 2026-07-07
- `src/App.tsx` still contained Companion action workflows after status, capture, and mobile merge helpers were extracted: vault selection, preview sync, write sync, and mobile inbox import.
- This boundary is safe to extract because the helper receives explicit dependencies for settings, IPC/store functions, lazy capture lookup, status setters, plan setter, and mobile state setter; `App.tsx` continues to own React state and current capture item composition.
- Focused verification now protects the previous behavior: cancelled vault selection still returns early, selected vault paths still merge into existing Companion settings, preview/sync/import status text still routes through `appCompanionStatus`, capture items are still read lazily at action time, and imported mobile inbox items still merge through `mergeImportedMobileCaptureItems`.
- Existing companion status/mobile verifiers were refreshed after extraction because their helpers are now consumed by `appCompanionActions.ts` instead of directly by `App.tsx`.


## App Obsidian Template Actions Helper Findings - 2026-07-07
- `src/App.tsx` still contained Obsidian template/settings sync workflows after template-editor helper extraction: template settings persistence, reset-to-defaults, and settings sync preview generation.
- This boundary is safe to extract because the helper receives explicit dependencies for current task/note inputs, template state setter, preview state setter, and store wrappers; `App.tsx` continues to own React state, modal state, and current input composition.
- Focused verification now protects the previous behavior: template updates still update local state before persistence and clear the preview, reset still only updates state when a reset result exists, settings preview still uses `obsidianSyncTasks`, `selectedDate`, `dailyWork`, `dailyInspiration`, and `allTasks`, and empty preview results still become `null`.


## App AI Review Lifecycle Helper Findings - 2026-07-07
- `src/App.tsx` still contained AI review lifecycle wiring after scheduled report date helpers were extracted: startup backfill, daily AI review ticks, weekly/monthly scheduled report generation, and first-run onboarding checks.
- This boundary is safe to extract because the helper receives explicit dependencies for the Electron AI review API, lazy current-task lookup, and onboarding state setter; `App.tsx` continues to own React hook placement, refs, and UI state.
- Focused verification now protects the previous behavior: startup backfill still checks `startupBackfillEnabled`, scheduled callbacks still read tasks lazily, daily ticks still run `backfill`, weekly/monthly ticks still use scheduled date helpers and `handleScheduledReportResult`, tick cleanup still unsubscribes all listeners, and onboarding still uses `shouldShowOnboarding` with an async active guard.
- The scheduled report verifier was refreshed after extraction because scheduled report helpers are now consumed by `appAiReviewLifecycle.ts` instead of directly by `App.tsx`.


## App Startup Settings Helper Findings - 2026-07-07
- `src/App.tsx` still contained startup Companion settings and Obsidian template settings loading inside the same mount effect as UI-state loading.
- This boundary is safe to extract because the helper depends only on explicit store wrappers and React state setters; `App.tsx` continues to own the mount effect, state initialization, and feature wiring.
- Focused verification now protects the previous behavior: Companion settings still set the loaded settings directly on success and fall back to `createDefaultCompanionSettings()` only on catch, while Obsidian template settings still update only when a settings object exists and fall back to `createDefaultObsidianTemplateSettings()` on catch.
- The first green attempt changed the Companion success path by adding a nullish default fallback; the verifier caught this, and the helper was corrected to preserve original behavior.


## App UI Actions Helper Findings - 2026-07-07
- `src/App.tsx` still contained several inline UI-only closures after startup settings extraction: daily-work panel toggle, inspiration panel toggle, panel close callbacks, task search toggle, and open-only filter toggle.
- This boundary is safe to extract because the helper depends only on explicit React boolean setters; `App.tsx` continues to own state, persistence, visible text, layout, and TaskList filtering inputs.
- Focused verification now protects the previous behavior: toggling daily work still closes inspiration, toggling inspiration still closes daily work, panel close callbacks still force only their own panel closed, and TaskList search/open-only controls still invert their current boolean state.


## App Completion Actions Helper Findings - 2026-07-07
- `src/App.tsx` still contained task/subtask completion workflows after the pure completion decision helper was extracted: main task toggles, subtask toggles, completion dialog save/no-review handlers, review viewing, and subtask priority updates.
- This boundary is safe to extract because the helper receives explicit dependencies for task arrays, current completion target, review settings, task mutation functions, and React setters; `App.tsx` continues to own state, dialog rendering, and data/mutation wiring.
- Focused verification now protects the previous behavior: main task review gating still uses `getMainTaskToggleDecision`, subtask routing still uses recursive `findTaskInTree`, subtask no-review completion still calls `markSubtaskDoneWithoutReview`, completion target fallback still uses `resolveCompletionTarget`, dialog cleanup still clears completion/review state, review viewing still uses `getViewCompletionDecision`, and subtask priority changes still write through tree-aware `updateTask`.
- Existing task-list, task-tree, and completion-flow verifiers were refreshed after extraction because those behaviors are now consumed through `appCompletionActions.ts` instead of directly in `App.tsx`.



## App Modal Actions Helper Findings - 2026-07-07
- `src/App.tsx` still contained several shell/modal inline closures after UI and completion actions were extracted: TitleBar toggles, SettingsPanel close/Companion opener, AI onboarding completion, template editor save/cancel, and Companion panel close.
- This boundary is safe to extract because the helper receives explicit dependencies for current app settings, template settings, Electron AI review API, action wrappers, and React setters; `App.tsx` continues to own state, JSX layout, and current data selection.
- Focused verification now protects the previous behavior: compact/settings toggles still invert state, lock-position still writes `{ ...appSettings, lockWindowPosition: !appSettings.lockWindowPosition }`, opening Companion settings still closes SettingsPanel, AI onboarding still calls `aiReview?.setSettings(next)` and clears onboarding, template save is guarded when the kind is null and applies `applyTemplateUpdate`, and modal close actions still clear their own state.
- During verification, `typecheck` caught an extraction-only type drift where the helper dependency made `setSettings` optional; the runtime behavior stayed aligned with the original optional `aiReview` chain after narrowing the type.
- The template-editor verifier was refreshed after extraction because `applyTemplateUpdate` is now consumed by `appModalActions.ts` rather than directly by `App.tsx`.



## App Dialog State Actions Extension Findings - 2026-07-07
- After the modal actions split, `src/App.tsx` still owned three inline dialog-only callbacks for completion/review modal state: `setCompletionTask(null)`, `setReviewTask(null)`, and `setCompletionTask(task)`.
- These callbacks are safe to fold into `appModalActions.ts` because they only mutate dialog state through explicit React setters and do not participate in completion save/no-review business decisions.
- Focused verification now protects the boundary: completion dialog cancel, review dialog close, and review add-record all use the modal actions helper, while completion save/no-review continues to route through `appCompletionActions.ts`.


## App Template Edit Action Findings - 2026-07-07
- After dialog-state callbacks moved into `appModalActions.ts`, `src/App.tsx` still had a remaining inline SettingsPanel template-editor opener: `onEditTemplate={(kind) => setEditingTemplateKind(kind)}`.
- This callback is safe to fold into the modal actions helper because it only writes the selected `AppTemplateKind` through the existing React setter; `App.tsx` continues to own the selected kind, modal rendering, and template save/cancel workflows.
- Focused verification now protects the boundary: SettingsPanel template editing uses `appModalActions.editTemplate`, while save/cancel continue to route through the same helper actions.


## App Keyboard Shortcut Action Findings - 2026-07-07
- `src/App.tsx` still contained the shortcut action application switch after shortcut decision extraction: Ctrl+K toggled compact mode, Ctrl+O opened the selected daily note, and `[` / `]` shifted the selected date.
- This boundary is safe to extract because the helper receives explicit dependencies and `App.tsx` continues to own the DOM `keydown` listener, React state, and daily-note action function.
- Focused verification now protects the boundary: shortcut decision and shortcut action application both live in `appKeyboardShortcuts.ts`, keyboard date shifting still uses shared `shiftDateKey`, and `App.tsx` no longer inlines the compact/open/shift action switch.

## App Task Menu Listener Registrar Findings - 2026-07-07
- `src/App.tsx` still contained direct Electron task-menu popup subscription setup after task-menu payload parsing/routing helpers were extracted.
- This boundary is safe to extract because the registrar depends only on the optional Electron API subscription function and explicit task-menu handlers; `App.tsx` continues to own React effect placement, dependency tracking, and cleanup timing.
- Focused verification now protects the boundary: Electron popup payloads are still parsed by `parseTaskMenuAction`, applied by `applyParsedTaskMenuAction`, and routed to `addSubtask`, `deleteTask`, `setEditRequest`, or `updateTask`; `App.tsx` now wires `registerTaskMenuActionListener` instead of inlining the subscription.
- The context-menu verifier was refreshed after extraction because the renderer `onTaskMenuAction` subscription is now owned by `taskMenuActions.ts` while `App.tsx` owns only the React effect wiring.

## App AddTaskInput Direct Handler Findings - 2026-07-07
- `src/App.tsx` still contained one pure JSX callback wrapper for adding tasks: it forwarded `text`, `taskPriority`, `taskSource`, and `taskDate` directly to `addTask` without adding behavior.
- This wrapper is safe to remove because `AddTaskInputProps.onAdd` expects `(text: string, priority: Task['priority'], source: TaskSource, taskDate?: string) => void`, while `useTasks.addTask` accepts the same argument order with defaults for omitted priority/source/date.
- Focused verification now protects the boundary: `AddTaskInput` receives `addTask` directly and `App.tsx` no longer carries the pure pass-through wrapper.

## App Personalization Actions Helper Findings - 2026-07-07
- `src/App.tsx` still contained four theme/personality action callbacks after earlier personalization helper extraction: theme preset application, current theme default reset, personalization change with opacity override memory, and dark-mode toggle forwarding.
- This boundary is safe to extract because the actions depend only on explicit state setters, current `personalization`, derived `activeThemeId`, `themeOverrides`, and the existing `toggleDarkMode` function; `App.tsx` continues to own React state, derived theme state, persistence effects, and JSX layout.
- Focused verification now protects the boundary: applying presets still uses `createPersonalizationForThemePreset`, reset still uses `getThemeDefaultsReset` and no-ops when no reset exists, personalization changes still call `rememberThemeOverride`, dark mode still forwards to `toggleDarkMode`, and `SettingsPanel`/`Header` now receive `appPersonalizationActions` instead of inline handlers.
- A brittle exact-string replacement failed during implementation because the live `App.tsx` handler block did not exactly match the script's target. The fix was to use a targeted structural regex and to update stale verifier assertions so low-level helper consumption is checked in `appPersonalization.ts` after the extraction.



## App Companion Settings Updater Findings - 2026-07-07
- `src/App.tsx` still contained an inline Companion settings updater after Companion action workflows were extracted: it updated local `companionSettings` state, then awaited store persistence.
- This boundary is safe to extract because it depends only on explicit React state and store persistence setters; `App.tsx` continues to own Companion state, panel rendering, and action dependency wiring.
- The helper dependency should accept `Promise<unknown>` for persistence because the current store wrapper returns the Electron result object, while the updater intentionally discards that result to preserve the previous `Promise<void>`-style callback behavior.
- Focused verification now protects both helper implementation details and App wiring for the Companion settings updater.


## App Companion Capture Getter Findings - 2026-07-07
- `src/App.tsx` still contained the lazy `getCurrentCaptureItems` callback after raw Companion capture item composition moved into `appCompanionCapture.ts`.
- This boundary is safe to extract because the callback depends only on explicit current inputs and still delegates to `createAppCompanionCaptureItems`; `App.tsx` continues to own the state values and Companion action dependency wiring.
- `App.tsx` should import only `createAppCompanionCaptureGetter`; importing `createAppCompanionCaptureItems` directly is unnecessary once the lazy callback construction is owned by the helper module.
- Focused verification now protects both raw capture item composition and the lazy getter wiring.

## App Keyboard Shortcut Listener Registrar Findings - 2026-07-07
- `src/App.tsx` still contained inline DOM `keydown` listener registration after keyboard shortcut decision and action application had already moved into `appKeyboardShortcuts.ts`.
- This boundary is safe to extract because the registrar depends only on a `window`-like add/remove event target and explicit shortcut action dependencies; `App.tsx` continues to own React `useEffect` placement and dependency tracking.
- Focused verification now protects the boundary: shortcut decision, action application, listener registration, and cleanup live in `appKeyboardShortcuts.ts`, while `App.tsx` only wires the registrar from the React effect.

## App Startup State Orchestrator Findings - 2026-07-07
- `src/App.tsx` still directly orchestrated startup UI-state loading alongside Companion/template settings loading after both lower-level loaders had already been extracted.
- This boundary is safe to extract because the orchestrator receives explicit `uiState` and `startupSettings` option objects and preserves the previous call order; `App.tsx` continues to own the React `useEffect`, state setters, and store wrapper dependencies.
- Focused verification now protects the boundary: `loadAppStartupState` owns startup load orchestration, `loadAppStartupSettings` still owns Companion/template settings fallbacks, and `appUiStatePersistence.ts` still owns UI-state Store key loading and persistence.



## SettingsPanel AI Review Root Section Findings - 2026-07-07
- `SettingsPanel.tsx` still directly composed the AI Review tab root wrapper after its child sections had already been extracted, leaving one remaining high-density JSX block in the panel.
- The safe boundary is a presentational `AiReviewSettingsSection` that receives explicit props for text, locale, AI Review settings, source/timer option lists, generation display state, update callbacks, and manual-generation callbacks.
- State ownership and side effects should remain in `SettingsPanel.tsx`: AI Review settings persistence, Electron generation IPC calls, progress fallback timers, diagnostics, and selected-date/task inputs are still panel-level concerns.
- Existing child-section verifier expectations needed recalibration after parent extraction: child sections are now imported/rendered by `AiReviewSettingsSection`, not directly by `SettingsPanel.tsx`.
- The shared settings controls verifier likewise should verify exports plus consumption by settings section modules; requiring direct `SettingsPanel.tsx` imports becomes stale once the panel delegates to section components.

## TaskItem Stack Segment Style Helper Findings - 2026-07-07
- `src/components/TaskItem.tsx` still owned a pure `getStackSegmentStyle` helper after the collapsed stack constants, transitions, and segment-count helper had moved into `src/components/taskItem/taskItemStack.ts`.
- This was a safe boundary because the helper only maps a segment count to the existing `--task-stack-segment-count` CSS custom property; stack rendering, expansion state, and event handling remain in `TaskItem.tsx`.
- Focused verification now protects the stack helper boundary: stack constants, transition timing, count behavior, CSS custom-property style helper, and `TaskItem.tsx` imports are checked together.

## TaskItem Interaction Propagation Helper Findings - 2026-07-07
- `src/components/TaskItem.tsx` still owned a tiny `stopClusterToggle` helper after other TaskItem context-menu, virtual-subtask, subtask row, presentation, and stack helpers had been extracted.
- This helper is safe to extract because it only requires an object with `stopPropagation()` and has no dependency on React state, task data, DOM lookup, hooks, IPC, or animation values.
- Focused verification now protects the interaction boundary: `TaskItem.tsx` imports the helper, action layers and expanded subtask viewport still stop click/pointer propagation, double-click text editing still stops propagation before editing, and the helper module remains hook-free and task-type-free.
- A verifier-generation bug appeared before the intended RED: an actual newline inside a regex literal produced an unterminated regular expression. The corrected verifier uses an escaped `\r?\n` sequence before asserting the double-click edit ordering.


## TaskItem Editing Decision Helper Findings - 2026-07-07
- `src/components/TaskItem.tsx` still owned small pure edit decision logic after context-menu, virtualization, subtask row, presentation, stack, and propagation helpers had already been extracted.
- This boundary is safe to extract because submitted-text normalization depends only on the current edit string, and key-action mapping depends only on `event.key`; both helpers are hook-free and do not depend on task data, DOM lookup, IPC, animation values, or React state setters.
- `TaskItem.tsx` remains responsible for editing state transitions: calling `onEdit` only when a submitted string exists, leaving edit mode after submit, and resetting text plus leaving edit mode on cancel.
- Focused verification now protects Enter-to-submit, Escape-to-cancel, empty trimmed text returning `null`, hook-free/task-type-free helper boundaries, and the absence of inline trimming/key comparisons in `TaskItem.tsx`.
- A verifier-generation bug appeared before the intended RED: literal newlines inside regex literals produced an unterminated regular expression. The corrected verifier uses raw Python output with escaped `
?
` sequences for multiline assertions.


## TaskItem Cluster Keyboard Toggle Helper Findings - 2026-07-07
- `src/components/TaskItem.tsx` still owned a small pure keyboard decision inside `handleClusterKeyDown`: only Enter and Space should toggle a parent-task cluster.
- This boundary is safe to extract because it depends only on `event.key`; `TaskItem.tsx` continues to own the child-existence guard, event default prevention, task id, and collapse callback wiring.
- Focused verification now protects that `taskItemInteractions.ts` owns both propagation stopping and cluster-toggle key decisions, while `TaskItem.tsx` no longer inlines `event.key !== 'Enter' && event.key !== ' '`.



## TaskItem Parent Text Title Helper Findings - 2026-07-07
- `src/components/TaskItem.tsx` still owned the parent task tooltip string after shared priority titles and other presentation helpers had moved into `src/components/taskItem/taskItemPresentation.tsx`.
- This boundary is safe to extract because the helper depends only on task text and priority; `TaskItem.tsx` continues to own rendering, editing, keyboard/mouse events, and task callbacks.
- Use `\u00b7` in the helper/verifier source for the middle-dot separator to avoid PowerShell/Python encoding issues while preserving the runtime tooltip text.
- Focused verification now protects that `TaskItem.tsx` calls `getTaskTextTitle(task)` and no longer inlines `priorityTitles[task.priority]` for the parent text title.


## TaskItem Parent Card ClassName Helper Findings - 2026-07-07
- `src/components/TaskItem.tsx` still owned the full parent task-card className template after other presentation helpers had been extracted.
- This boundary is safe to extract because class composition is pure and depends only on already-derived booleans: child presence, tag presence, review-action availability, and completion state.
- `TaskItem.tsx` should continue to own DOM/event behavior: context-menu handling, `aria-expanded`, click/key toggles, edit state, and review action rendering all remain local.
- `verify:task-list-interactions` contained stale implementation-location checks after the move. The correct regression boundary is split: `taskItemPresentation.tsx` preserves the concrete classes and review-action layout reservation, while `TaskItem.tsx` proves it passes `canOpenReviewAction` and still owns the accessible cluster toggle surface.

## TaskItem Parent Cluster ClassName Helper Findings - 2026-07-07
- `src/components/TaskItem.tsx` still owned the outer `task-cluster` wrapper className template after parent-card class composition and other presentation helpers had moved into `src/components/taskItem/taskItemPresentation.tsx`.
- This boundary is safe to extract because class composition is pure and depends only on already-derived booleans: child presence and expanded state.
- `TaskItem.tsx` should continue to own DOM/event behavior: click toggling, Enter/Space keyboard handling, `aria-expanded`, stack shell rendering, and subtask viewport rendering remain local.
- `verify:context-menu` contained a stale implementation-location check after the move. The correct regression boundary is split: `taskItemPresentation.tsx` preserves the concrete cluster wrapper classes, while `TaskItem.tsx` proves it still calls the helper and owns `onToggleCollapse` wiring.

## TaskItem Parent Metadata Preview Helpers Findings - 2026-07-07
- `src/components/TaskItem.tsx` still owned pure parent metadata preview decisions after className/title helpers had moved into `src/components/taskItem/taskItemPresentation.tsx`.
- This boundary is safe to extract because tag preview and scheduled-date preview calculations depend only on optional string arrays; `TaskItem.tsx` continues to own JSX structure, copy, CSS classes, and task-card interactions.
- The preserved behavior is: show up to two tags with `+N` overflow, show up to three scheduled dates joined by the existing separator with `+N` overflow, and render nothing when the corresponding array is empty or undefined.
- Be careful editing scheduled-date display source through PowerShell/Python snippets because terminal encoding can display the emoji and middle dot as mojibake; prefer exact UTF-8 reads or index-based replacements rather than copying mojibake text.



## TaskItem Completion Action Presentation Helpers Findings - 2026-07-07
- `src/components/TaskItem.tsx` still owned a pure parent completion action className template and duplicated completed/uncompleted accessible copy for `aria-label` and `title`.
- This boundary is safe to extract because it depends only on `task.completed`; `TaskItem.tsx` continues to own event propagation, click handling, and the `onToggle` callback.
- `getTaskCompleteActionLabel` returns the same Chinese UI copy via Unicode escapes in source to avoid PowerShell/terminal encoding damage while preserving runtime strings.
- The focused verifier now protects that completion action classes and accessible copy live in `taskItemPresentation.tsx`, while `TaskItem.tsx` reuses one derived label for both `aria-label` and `title`.
- Initial RED verifier attempt exposed a verifier-generation issue: Chinese text inside a regex was rendered as `?` in the terminal and created an invalid regex. The corrected verifier avoids Chinese regex literals and checks structure instead.


## TaskItem Review Action Label Helper Findings - 2026-07-07
- `src/components/TaskItem.tsx` still owned the pure parent review-action accessible-copy decision: existing reviews use ???????? and completed tasks without a review use ????????.
- This boundary is safe to extract because it depends only on the already-derived `hasReview` boolean; `TaskItem.tsx` continues to own whether the action renders (`canOpenReviewAction`) and the `onViewReview` callback.
- `getTaskReviewActionLabel` stores the concrete Chinese strings with Unicode escapes to avoid terminal/PowerShell encoding damage while preserving runtime copy.
- `verify:task-list-interactions` had a stale implementation-location assertion after the extraction. The correct boundary is split: `taskItemPresentation.tsx` protects the concrete copy decision and `TaskItem.tsx` proves it derives and passes `reviewActionLabel` into `ReviewActionButton`.

## TaskItem Accessible Copy Constants Findings - 2026-07-07
- `src/components/TaskItem.tsx` still owned a few static parent accessibility labels after the other parent presentation helpers had moved into `taskItemPresentation.tsx`.
- This boundary is safe to extract because the labels are static copy only; `TaskItem.tsx` continues to own drag handle wiring, edit input state, delete action callback, and expanded-subtask rendering.
- Store the Chinese strings as Unicode escapes in `taskItemPresentation.tsx` so the runtime copy stays intact even when PowerShell displays source text with mojibake.

## TaskItem Delete Action Component Findings - 2026-07-07
- `src/components/TaskItem.tsx` still owned the parent delete action JSX after review action rendering and shared icons had moved into `taskItemPresentation.tsx`.
- This boundary is safe to extract because the delete button depends only on the `onDelete` callback and static presentation details; `TaskItem.tsx` continues to own whether the action slot renders and how event propagation is stopped at the action layer.
- The focused verifier should check delete-label usage in `DeleteActionButton`, not in `TaskItem.tsx`, once the button component owns its own accessible copy.

## TaskItem Complete Action Component Findings - 2026-07-07
- `src/components/TaskItem.tsx` still owned the parent completion button JSX after its className and accessible-copy helpers had moved into `taskItemPresentation.tsx`.
- This boundary is safe to extract because the button depends only on `completed`, the derived label, and the `onToggle` callback; `TaskItem.tsx` continues to own completion state derivation and where the action appears in the parent row.
- The extracted component must own the old event isolation as well as the markup: click should stop propagation before toggling completion, pointer-down should stop propagation, and the completed checkmark SVG should remain with the completion button presentation.
- `verify:task-list-interactions` needed a stale boundary refresh because the completion icon now belongs to `taskItemPresentation.tsx` rather than `TaskItem.tsx`.

## TaskItem Drag Handle Button Component Findings - 2026-07-07
- `src/components/TaskItem.tsx` still owned the parent drag-handle button JSX after its static label and shared icon had already moved into `taskItemPresentation.tsx`.
- This boundary is safe to extract because the button depends only on optional sortable drag-handle props; `TaskItem.tsx` continues to own receiving those props and deciding where the handle appears in the parent row.
- The extracted component must preserve the old disabled fallback when drag props are absent, pass through activator refs plus DnD attributes/listeners, keep `aria-disabled`, and continue blocking click/pointer propagation.
- `TaskDragHandleProps` remains re-exported from `TaskItem.tsx` so upstream consumers do not need to know about the new presentation-module location yet.

## TaskItem Edit Input Component Findings - 2026-07-07
- `src/components/TaskItem.tsx` still owned the parent edit input JSX after edit decision helpers and static accessibility labels had already moved into task-item helper modules.
- This boundary is safe to extract because the input component depends only on explicit value/change/blur/keydown props; `TaskItem.tsx` continues to own editing state, submitted-text normalization, Enter/Escape decisions, and `onEdit` callback routing.
- The extracted component must preserve the old event isolation: input clicks and pointer-down events should not toggle the parent cluster while the user is editing.
- Keeping `TaskEditInput` in `taskItemPresentation.tsx` makes the parent action/input row more consistent: fixed markup lives in the presentation module, while stateful task behavior stays in `TaskItem.tsx`.

## TaskItem Action Layer Component Findings - 2026-07-07
- `src/components/TaskItem.tsx` still owned the parent review/delete action-layer wrapper after the individual review, delete, completion, drag-handle, and edit-input presentation controls had moved into `taskItemPresentation.tsx`.
- This boundary is safe to extract because the wrapper depends only on explicit booleans, labels, and callbacks; `TaskItem.tsx` continues to own whether review actions are available, which review target opens, delete behavior, and where the layer appears in the parent card.
- The extracted component must preserve action-layer event isolation: both click and pointer-down events stop propagation before they can toggle the parent cluster.
- Structural verifiers should now check concrete action-layer, review-zone, delete-zone, and review/delete button ownership in `taskItemPresentation.tsx`, while `TaskItem.tsx` remains responsible for passing `canOpenReviewAction`, `hasReview`, `reviewActionLabel`, `onViewReview`, and `onDelete` into `TaskActionLayer`.

## TaskItem Stack Segments Component Findings - 2026-07-07
- `src/components/TaskItem.tsx` still owned the collapsed stack segment JSX after the segment constants, transitions, and style/count helpers had moved into `taskItemStack.ts`.
- This boundary is safe to extract because the segment component depends only on a segment count and the reduced-motion flag; `TaskItem.tsx` continues to own whether a stack is shown, the stack shell style, parent card animation, and expanded subtask rendering.
- The extracted component should own only fixed presentation markup: `task-stack-segments`, `task-stack-segment ${segmentClass}`, decorative `aria-hidden`, opacity-only initial/animate/exit values, and transition selection from the shared stack helper module.
- `verify:task-cluster-stack` had multiple stale implementation-location assertions after earlier TaskItem splits. The correct boundary is split across `taskItemStack.ts` for constants/helpers, `TaskStackSegments.tsx` for segment JSX, `TaskItem.tsx` for display decisions, and `SubtaskCard.tsx` for expanded subtask controls.

## TaskItem Context Menu Open Payload Helper Findings - 2026-07-07
- `src/components/TaskItem.tsx` still directly composed the task context-menu theme and popup payload after the lower-level theme/payload helpers had already moved into `src/components/taskItem/taskItemContextMenu.ts`.
- This boundary is safe to extract because payload composition depends only on explicit task data, tag history, screen coordinates, dark-mode state, shell class list, and computed-style readers; `TaskItem.tsx` continues to own right-click event handling, DOM lookup, and IPC invocation.
- Keeping `createTaskContextMenuTheme` and `createTaskContextMenuPayload` as lower-level helpers remains useful because structural verification can protect token parsing separately while `createTaskContextMenuOpenPayload` gives `TaskItem.tsx` a single clean call site.
- `verify:context-menu` and `verify:theme-no-blue` needed stale boundary refreshes after this move: `TaskItem.tsx` should prove it reads the relevant DOM styles and delegates to `createTaskContextMenuOpenPayload`, while `taskItemContextMenu.ts` should prove CSS token mapping and fallback values are preserved.

## TaskItem Main Content Component Findings - 2026-07-07
- `src/components/TaskItem.tsx` still owned the parent edit/text/tag/scheduled-date JSX after the edit input, title helper, and metadata preview helpers had moved into `src/components/taskItem/taskItemPresentation.tsx`.
- This boundary is safe to extract because the fixed markup depends only on explicit props: task, edit mode/text, visible metadata preview data, and edit callbacks. `TaskItem.tsx` continues to own React state, submit/cancel behavior, completed-task edit gating, task callbacks, context menu, priority picker, and action-layer placement.
- The correct verifier boundary after extraction is split: `TaskItem.tsx` proves it renders `<TaskMainContent ... />` with derived preview data and handlers, while `taskItemPresentation.tsx` protects `task-text-wrap`, `task-text-row`, `task-text`, `task-tags task-inline-tags`, `scheduled-dates`, `TaskEditInput`, and `getTaskTextTitle(task)` usage.
- `verify:task-layout-unified-glass` also needed calibration because task title class ownership moved from `TaskItem.tsx` to `TaskMainContent`.

## TaskItem Subtasks View Component Findings - 2026-07-07
- `src/components/TaskItem.tsx` still owned expanded-subtask viewport/list/spacer JSX after subtask row rendering, virtualization calculations, stack segments, and parent presentation controls had already moved into smaller task-item modules.
- This boundary is safe to extract because the viewport component depends only on explicit props: task id, the virtual-subtask ref/results, reduced-motion state, and subtask action callbacks. `TaskItem.tsx` continues to own expansion state, collapse toggling, `useVirtualSubtasks`, parent task actions, context menu, and priority/edit state.
- The extracted `TaskSubtasksViewport` should own the fixed presentation details: `task-subtasks task-subtasks-scroll-viewport`, `TASK_SUBTASKS_LABEL`, `TASK_SUBTASK_VIEWPORT_HEIGHT`, virtual-list classes, virtual spacer positioning, Framer Motion transitions, stagger timing, propagation blocking, and `SubtaskCard` callback pass-through.
- The correct verifier boundary after extraction is split: `TaskItem.tsx` proves it calls `useVirtualSubtasks` and renders `<TaskSubtasksViewport ... />`, `TaskSubtasksViewport.tsx` proves viewport/list/spacer behavior and `SubtaskCard` rendering, `SubtaskCard.tsx` proves row-level actions, and `useVirtualSubtasks.ts` proves scroll-window math.
- Several existing structural checks were intentionally recalibrated after this move. They should avoid requiring implementation details such as `SubtaskCard`, `TASK_SUBTASK_VIEWPORT_HEIGHT`, or `TASK_SUBTASK_STAGGER_MS` to remain directly in `TaskItem.tsx` once the viewport owns that markup.

## TaskItem SVG Icons Module Findings - 2026-07-07
- `src/components/taskItem/taskItemPresentation.tsx` still owned three pure SVG icon components after the parent action buttons, subtask row, main content, stack segments, and subtasks viewport had already moved into smaller task-item modules.
- This boundary is safe to extract because `ReviewIcon`, `DragDotsIcon`, and `TrashIcon` depend only on explicit props or no props; they do not depend on task state, hooks, DOM lookup, IPC, animation decisions, or callback routing.
- Keeping icons in `taskItemIcons.tsx` leaves `taskItemPresentation.tsx` focused on task presentation composition and controls, while `SubtaskCard.tsx` can reuse the same icon module without importing unrelated presentation helpers.
- Focused verification now protects the icon module boundary and the existing SVG paths for the review eye, empty review document, drag dots, and trash icon.

## SubtaskCard Editing Helper Reuse Findings - 2026-07-07
- `src/components/taskItem/SubtaskCard.tsx` still duplicated the parent task edit-decision rules after `TaskItem.tsx` had already moved trimming and Enter/Escape decisions into `src/components/taskItem/taskItemEditing.ts`.
- This cleanup is safe because the helper functions are pure and preserve the existing behavior: trim once, ignore empty submitted text, submit on Enter, cancel/reset on Escape, and ignore other keys.
- `SubtaskCard.tsx` should continue to own React state, `useEffect` text synchronization, subtask callback routing, and visible input markup; only the duplicated pure decision logic belongs in `taskItemEditing.ts`.
- Focused verification now protects both parent-task and subtask consumers of the shared editing helper and forbids reintroducing inline `editText.trim()` / direct Enter/Escape comparisons in those components.

## SubtaskCard Presentation Copy Helper Findings - 2026-07-07
- `src/components/taskItem/SubtaskCard.tsx` still owned multiple subtask-specific presentation strings after its icons and editing decisions had moved into helper modules.
- This boundary is safe because the extracted helpers are pure label/title derivations and constants; `SubtaskCard.tsx` continues to own state, callbacks, JSX structure, class names, and whether actions render.
- Centralizing subtask copy in `subtaskCardPresentation.ts` makes future label, tooltip, or title-format changes easier and keeps the subtask row component focused on behavior wiring.
- Use Unicode escapes for Chinese copy in this helper, matching the existing TaskItem presentation constants, so PowerShell/terminal mojibake does not damage runtime strings.

## SubtaskCard Controls Component Module Findings - 2026-07-07
- `src/components/taskItem/SubtaskCard.tsx` still owned all fixed subtask control JSX after copy, icon, and edit-decision helpers had moved into smaller modules.
- This boundary is safe because the extracted controls depend only on explicit props: completed state, priority value, edit text handlers, review availability, labels, and callbacks. `SubtaskCard.tsx` continues to own React state, `useEffect` text synchronization, submitted-text normalization, Enter/Escape behavior, and id/task callback routing.
- Keeping `SubtaskCompleteButton`, `SubtaskPriorityPicker`, `SubtaskEditInput`, `SubtaskReviewButton`, `SubtaskDeleteButton`, and `SubtaskActionLayer` in `subtaskCardControls.tsx` makes future subtask row UI changes local while leaving row behavior easy to inspect in `SubtaskCard.tsx`.
- The correct verifier boundary after extraction is split: `subtaskCardControls.tsx` protects fixed classes, icons, accessible labels, priority picker title, and checkmark path, while `SubtaskCard.tsx` proves stateful wiring into those controls.
- `verify:task-action-alignment` needed calibration because it was still checking subtask action classes in `SubtaskCard.tsx`; after the controls extraction, concrete alignment classes belong in `subtaskCardControls.tsx`.

## SubtaskCard Row And Text Presentation Helpers Findings - 2026-07-07
- `src/components/taskItem/SubtaskCard.tsx` still owned row class composition and non-editing text markup after the control extraction.
- This boundary is safe because row classes depend only on completion state, and the text span depends only on a task-shaped text/priority object plus an explicit double-click callback. `SubtaskCard.tsx` continues to decide whether editing is allowed for completed subtasks and continues to own all edit state transitions.
- Moving `getSubtaskRowClassName` into `subtaskCardPresentation.ts` keeps class composition next to subtask copy/title helpers, while `SubtaskText` keeps fixed text markup next to the other subtask controls.
- Focused verification now protects that row classes, text title formatting, and `task-subtask-text` markup do not drift back into `SubtaskCard.tsx`.

## TaskItem Parent Controls Module Findings - 2026-07-07
- `src/components/taskItem/taskItemPresentation.tsx` still mixed pure helpers/constants with parent task control components after the TaskItem and SubtaskCard splits.
- This boundary is safe because the fixed controls depend only on explicit props: labels, booleans, edit values, metadata preview arrays, drag-handle props, and callbacks. `TaskItem.tsx` continues to own state, context-menu DOM/IPC behavior, collapse semantics, priority changes, and task mutation routing.
- Moving `ReviewActionButton`, `TaskActionLayer`, `CompleteActionButton`, `DeleteActionButton`, `TaskEditInput`, `TaskMainContent`, and `DragHandleButton` into `taskItemControls.tsx` leaves `taskItemPresentation.tsx` focused on pure presentation helpers: priority titles, review detection, class-name derivation, accessible labels, and metadata preview derivation.
- The correct verifier boundary after extraction is split: `taskItemControls.tsx` protects concrete fixed JSX/classes/icons/event isolation, `taskItemPresentation.tsx` protects pure helper decisions and copy, and `TaskItem.tsx` proves stateful wiring into the extracted controls.

## TaskList DnD Helper And Source Grouping Findings - 2026-07-07
- `src/components/TaskList.tsx` now delegates source-group DnD helper behavior to `src/components/taskList/taskListDnd.ts` while keeping the visible source-section rendering and sortable item composition in the component file.
- The intended source UX is grouped source headers/sections, not a per-row `.task-source-badge`; verifiers should protect against accidentally reintroducing row badges or badge CSS.
- Missing task source fallback belongs in the DnD/helper layer as `task.source || 'personal'`, so grouping and reorder behavior stay stable for older task data.
- Future TaskList cleanup should preserve the current split: DnD calculations in `taskListDnd.ts`, task-item rendering through `TaskItem`, and source-section presentation as the next likely low-risk extraction.

## UX Polish Verifier Boundary Findings - 2026-07-07
- `scripts/verify-ux-polish.ts` had drifted behind the current modularization and was still checking obsolete implementation locations and old source-badge UI.
- The current appearance settings boundary is unified global glass opacity in `src/components/settings/AppearanceSettingsSection.tsx` backed by `glassOpacityValue(settings)` and `withUnifiedGlassOpacity(settings, value)` in `appearanceSettings.ts`; old per-area opacity UI assertions are stale.
- The current review-action behavior intentionally allows completed tasks/subtasks without an existing review to open a backfill review action; this should not be treated as a regression.
- Structural verifier checks that touch Chinese UI copy should prefer ASCII anchors, module-boundary checks, or Unicode escape string literals to avoid terminal encoding damage.

## TaskList Sortable Source Section Findings - 2026-07-07
- `src/components/TaskList.tsx` still owned the sortable source-section shell after DnD helper extraction, even though the source-group presentation is independent from task filtering and reorder callbacks.
- This boundary is safe because the extracted source-section component depends only on `source`, `dragDisabled`, `isDragActive`, and `children`; `TaskList.tsx` continues to own grouping, bucket rendering, drag lifecycle, and persistence callbacks.
- `src/components/taskList/SortableSourceSection.tsx` now owns source sortable registration, source group shell/title classes, the title-row drag activator, `source-drag-handle`, source labels, source-group Framer Motion springs, and jump-to-rest behavior after drag completion.
- The correct verifier boundary is split: `TaskList.tsx` should prove it renders `<SortableSourceSection ... />`, `taskListDnd.ts` should protect IDs/collision/motion constants, and `SortableSourceSection.tsx` should protect source-section JSX and source-specific spring wiring.
- Source-section labels are stored with Unicode escapes in the component to preserve runtime Chinese copy while avoiding PowerShell terminal encoding damage.

## TaskList Sortable Task Item Findings - 2026-07-07
- `src/components/TaskList.tsx` still owned the task-level sortable shell after the DnD helper and source-section extractions, even though the task sortable presentation is independent from grouping, bucket derivation, and reorder persistence.
- This boundary is safe because the extracted task item component depends only on one `Task`, its rendered index, drag-disabled state, shared drag lifecycle flag, explicit callbacks, tags, and edit trigger; `TaskList.tsx` continues to own source grouping, open/done buckets, filter/search toolbar state, DnD lifecycle handlers, and persistence callbacks.
- `src/components/taskList/SortableTaskItem.tsx` now owns task sortable registration, `TASK_SORTABLE_MOTION` / `REDUCED_SORTABLE_MOTION` spring selection, Framer Motion displacement springs, jump-to-rest behavior after drag completion, `TaskDragHandleProps` construction, `task-sortable-shell` classes, and rendering `TaskItem` with unchanged callback wiring.
- The correct verifier boundary is split: `TaskList.tsx` should prove it renders `<SortableTaskItem ... />` and passes `isDragActive`, `taskListDnd.ts` should protect task sortable ids and motion constants, and `SortableTaskItem.tsx` should protect task sortable registration/shell/spring/drag-handle behavior.
- `verify:task-list-interactions` had stale implementation-location assertions after this extraction. Task sortable shell, direct active-drag x/y style, spring displacement, jump-to-rest, and task motion preset checks now belong in `SortableTaskItem.tsx`, while source-section equivalents remain in `SortableSourceSection.tsx`.

## TaskList Filter Toolbar Findings - 2026-07-07
- `src/components/TaskList.tsx` still owned fixed search/filter toolbar JSX after source-section and task-item sortable presentation had moved into task-list submodules.
- This boundary is safe because the toolbar depends only on explicit search/filter props and callbacks; `TaskList.tsx` continues to own `filtersActive`, clear-filter behavior, source grouping, bucket rendering, DnD lifecycle, and task callback wiring.
- `src/components/taskList/TaskListToolbar.tsx` now owns `PriorityFilter`, priority labels, search toggle button, open-only filter button, priority select, clear filter button, and search input markup.
- The correct verifier boundary is split: `TaskList.tsx` should prove it imports/renders `<TaskListToolbar ... />` with explicit props, while `TaskListToolbar.tsx` protects concrete toolbar classes and label/select behavior.
- Toolbar Chinese copy is stored with Unicode escapes in the component so future terminal output encoding issues do not corrupt runtime labels.

## TaskList Empty State Findings - 2026-07-07
- `src/components/TaskList.tsx` still owned fixed empty-list presentation after the toolbar, source-section, and sortable task item presentation moved into task-list submodules.
- This boundary is safe because the empty state has no task callbacks or state dependencies; `TaskList.tsx` continues to own the `tasks.length === 0` branch and the grouped/flat list branch that follows it.
- `src/components/taskList/TaskListEmptyState.tsx` now owns the empty-state `motion.div`, clipboard icon, `empty-state` class, and the two empty-list copy lines.
- The correct verifier boundary is split: `TaskList.tsx` should prove it renders `<TaskListEmptyState />` for empty task arrays, while `TaskListEmptyState.tsx` protects the actual markup and animation.
- Empty-state Chinese copy is stored with Unicode escapes to preserve runtime text while avoiding terminal encoding damage.

## TaskList Derived Data Helper Candidate Findings - 2026-07-07
- After the TaskList presentation extractions, `src/components/TaskList.tsx` still owns pure derivations for tag history, source grouping, source ordering, external-source detection, and grouped-list display decisions.
- This boundary is a safe next extraction because those calculations depend only on `tasks`, `sourceOrder`, and the existing `getTaskSource` helper; `TaskList.tsx` should continue to own `useMemo` timing, DnD lifecycle, bucket rendering, and callback wiring.
- A focused helper module can make the data contract explicit: derive all tags by frequency, build ordered source groups with saved source order first, and determine whether source grouping should be visible when external tasks exist.

## TaskList Derived Data Helper Findings - 2026-07-07
- `src/components/taskList/taskListDerivations.ts` now owns the pure task-list data derivations: `getTaskTagHistory`, `getTaskSourceGroups`, `shouldShowSourceGroups`, and the `TaskSourceGroup` interface.
- `TaskList.tsx` still owns the React memoization timing and render/control flow, so the helper module remains pure and easy to verify with direct data examples.
- Tag history behavior is preserved as unique tags sorted by descending task frequency; JavaScript stable sorting preserves first-seen order for equal frequencies in the current runtime target.
- Source grouping behavior is preserved by using `getTaskSource(task)` for missing-source fallback, saved `sourceOrder` precedence, and original source-local task order.
- `verify:ux-polish` needed a stale-boundary refresh after this extraction: the product rule is still that source sections show only when external tasks exist, but the checked implementation now lives in `shouldShowSourceGroups()` rather than inline `externalTasks.length > 0` in `TaskList.tsx`.

## TaskList Content Component Findings - 2026-07-07
- `src/components/TaskList.tsx` still owned local `renderTask`, `renderTaskBucket`, and `renderSourceGroup` helpers after the toolbar, empty state, derivation, source-section, and sortable-item extractions.
- This boundary is safe to extract because the helpers depend only on explicit inputs: visible tasks, source groups, grouping flag, drag-disabled state, shared drag-active state, tag history, task/subtask callbacks, and the optional edit request. `TaskList.tsx` can continue to own DnD lifecycle, scroll refs, toolbar filter clearing, and memoization timing.
- `src/components/taskList/TaskListContent.tsx` now owns the animated sortable list composition: `AnimatePresence`, empty-state branch, grouped-vs-flat branch, source `SortableContext`, bucket `SortableContext`, open-before-done buckets, `SortableSourceSection`, and `SortableTaskItem` callback binding.
- The extraction preserves source-group indexing by summing prior group task counts, preserves source drag disabling with `dragDisabled || sourceGroups.length < 2`, and preserves edit routing with `editRequest && editRequest.id === task.id ? editRequest.nonce : undefined`.
- Structural verifiers should now treat `TaskList.tsx` as the DnD shell and `TaskListContent.tsx` as the sortable content renderer. Checks for `TaskListEmptyState`, `SortableSourceSection`, `SortableTaskItem`, `SortableContext`, and `verticalListSortingStrategy` belong in the content component boundary.

## SettingsPanel Shell And Navigation Findings - 2026-07-07
- `src/components/SettingsPanel.tsx` still owned the motion shell, grouped sidebar navigation, floating close button, and page title wrapper after the earlier section-level modularization.
- This boundary is safe to extract because the shell depends only on explicit props: sidebar strings, grouped navigation metadata, the active section, title/description strings, close behavior, and section children. `SettingsPanel.tsx` can keep the coupled AI Review state/effects, generation flow, and section-content composition.
- `src/components/settings/settingsPanelNavigation.ts` is the right home for the section metadata because it centralizes the section keys, primary-section flags, and grouped navigation derivation without pulling UI state into the helper.
- `src/components/settings/SettingsPanelShell.tsx` should own `motion.aside`, `settings-v2-sidebar`, `settings-nav-section-title`, `settings-floating-close`, and `settings-page-title`, while `SettingsPanel.tsx` should only prove delegation through `<SettingsPanelShell ... />`.
- Touched Chinese strings in the new navigation module and the rewritten `SettingsPanel.tsx` should use Unicode escapes, because PowerShell output for this repo is still vulnerable to mojibake when copying literals directly.

## Verification Boundary Refresh Findings - 2026-07-07
- The remaining late-stage failures were verifier drift, not product regressions: behavior still existed, but several focused checks were still hard-coded to pre-extraction file locations.
- The drift clustered around exactly the areas that had been modularized for maintainability:
  - Electron window/settings behavior moved from `electron/main.ts` into `electron/windowIpc.ts` and `electron/windowState.ts`.
  - AI review IPC and scheduled-report orchestration moved into `electron/aiReviewIpc.ts`, `src/app/appAiReviewLifecycle.ts`, and `src/app/appScheduledReports.ts`.
  - Settings behavior moved from `src/components/SettingsPanel.tsx` into section modules such as `AppearanceSettingsSection.tsx`, `GeneralSettingsSection.tsx`, `AiReviewManualGenerationSection.tsx`, and `TemplatesSettingsSection.tsx`.
- The right fix pattern was to make each verifier assert both sides of the boundary:
  - the parent module still imports/renders/delegates correctly
  - the extracted child/helper module owns the concrete implementation details
- Refreshing verifiers this way preserves the maintainability win from modularization; moving logic back into older files just to satisfy stale checks would have undone the cleanup the user asked for.
- Some verifier literals were also fragile because of terminal mojibake. Where that mattered, matching stable English strings or delegation structure was more robust than depending on garbled copied text from PowerShell output.
- After the verifier refresh, the full safety net was green again: `verify:rc`, `typecheck`, `verify:cleanup-core`, and `build` all passed on the current modularized codebase.


## App Daily Panel Presentation Helper Findings - 2026-07-07
- `src/App.tsx` still duplicated pure daily-panel tab presentation logic for both Daily Work and Inspiration: trimmed-content detection, tab className composition, tooltip/title copy, and content-dot visibility.
- This boundary is safe to extract because it depends only on panel text content, the base edit label, and the panel open state; `App.tsx` continues to own click handlers, aria attributes, layout, and panel component wiring.
- The chosen helper boundary stays smaller and safer than extracting a new component: `appDailyPanelPresentation.ts` centralizes pure decisions while leaving JSX structure in place.
- The first GREEN attempt exposed a verifier-generation bug: Python string escaping converted `` in regex patterns into a backspace character. Fixing the verifier restored the intended boundary checks without changing production behavior.


## App Shell Presentation Helper Findings - 2026-07-07
- `src/App.tsx` still owned a long pure `app-shell` className template and a small low-opacity attribute decision after earlier App helper extractions.
- This boundary is safe to extract because it depends only on explicit presentational inputs: `themeClass`, `layoutDensity`, `texture`, `animations`, `compactMode`, `isInvisibleTheme`, and `windowOpacity`.
- The helper boundary stays intentionally narrow: `appShellPresentation.ts` owns class/attribute composition, while `App.tsx` still owns viewport style wiring, `data-theme`, layout structure, and all shell children.
- A dedicated helper is safer than overloading `appThemeState.ts`; theme-state derivation and shell presentation are related but distinct responsibilities.


## App Frame Presentation Helper Extension Findings - 2026-07-07
- After the shell className extraction, `src/App.tsx` still owned two nearby pure frame-presentation decisions: the viewport loaded/opacity class and the shell `data-theme` fallback (`activeThemeId || 'custom'`).
- Extending `appShellPresentation.ts` was cleaner than introducing a second tiny outer-frame helper module, because these decisions belong to the same outer presentation surface as the shell className and low-opacity flag.
- This boundary is still safe because it depends only on `isLoaded` and `activeThemeId`; `App.tsx` continues to own viewport style wiring, theme-state derivation, layout, and child component composition.
- The focused verifier already covered the right parent/child boundary, so extending it was lower risk than creating a second overlapping verifier for the same outer frame surface.

## App Overlay Stack Findings - 2026-07-07
- `src/App.tsx` still owned a large inline overlay composition block after the outer-frame presentation extractions: `SettingsPanel`, `AiOnboarding`, `TemplateEditorModal`, `ObsidianCompanionPanel`, `TaskCompletionDialog`, and `TaskReviewDialog`.
- This boundary was safe to extract because it was almost entirely JSX composition plus explicit prop forwarding. `App.tsx` still owns state, hook placement, helper/action factories, and the remaining cross-feature derivations such as `editingTemplateInitialTemplate`.
- `src/components/AppOverlayStack.tsx` is the right composition boundary for these overlays because it keeps the shell layout in `App.tsx` while removing six fixed top-level overlays from the main render tree.
- The lowest-coupling interface was explicit prop bags plus a few named props (`aiOnboardingText`, `editingTemplateKind`, `editingTemplateInitialTemplate`, and modal action callbacks). That keeps the overlay component from depending on App-only helper factory internals.
- Three focused verifiers drifted after this extraction for the same reason:
  - `verify:app-modal-actions-module` still expected direct overlay JSX props in `App.tsx`.
  - `verify:app-personalization-module` still expected `SettingsPanel` personalization callbacks directly on JSX in `App.tsx`.
  - `verify:app-completion-actions-module` still expected `TaskCompletionDialog` callbacks directly on JSX in `App.tsx`.
- The correct fix was verifier calibration, not moving logic back: `App.tsx` now proves helper/action wiring into prop bags and `<AppOverlayStack ... />`, while `AppOverlayStack.tsx` proves forwarding into the concrete overlay components.

## App Main Content Findings - 2026-07-07
- After the overlay and top-content extractions, `src/App.tsx` still owned the fixed main motion shell, `app-main-scroll` wrapper, completed-review vs task-list branch, and direct `AddTaskInput` composition.
- This boundary is safe to extract because it is almost entirely JSX composition plus explicit prop forwarding. `App.tsx` continues to own state, effects, helper/action factories, and task/review data derivation.
- `src/components/AppMainContent.tsx` is the right boundary for the main body because it keeps the render tree symmetric with `AppTopContent.tsx` and `AppOverlayStack.tsx`: one focused component for the fixed shell, one prop bag for each child surface.
- The lowest-coupling interface was explicit prop bags plus a delegated `topContent` node, so `AppMainContent` can stay a presentation/composition boundary instead of depending on App-only helper factory internals.
- The expected verifier drift after extraction was at the parent boundary, not runtime behavior: task-list UI actions, completion-action wiring, and review/add-task assertions had to move from direct `App.tsx` JSX checks to `taskListProps` / `addTaskInputProps` checks in `App.tsx` plus concrete forwarding checks in `AppMainContent.tsx`.

## App Shell Composition Findings - 2026-07-07
- After the overlay, top-content, and main-content extractions, `src/App.tsx` still carried a long prop-bag assembly zone even though most of the JSX shells had already been split out.
- A dedicated composition helper was the safest next step because the remaining work was still orchestration, not domain logic: derive shell text, derive template-editor initial content, gather shell prop bags, and hand them to already-extracted child boundaries.
- `src/app/appShellComposition.tsx` is the right home for this layer because it sits between App-owned state/action factories and the shell presentation components without changing who owns the underlying business logic.
- Once prop-bag assembly moved into the helper, the correct verifier pattern became three-part:
  1. `App.tsx` proves helper creation and spread-based delegation.
  2. `appShellComposition.tsx` proves prop-bag assembly and shell-local derived values.
  3. `AppTopContent.tsx`, `AppMainContent.tsx`, and `AppOverlayStack.tsx` prove concrete forwarding.
- This pattern is more stable than forcing every focused verifier to keep asserting direct `App.tsx` prop bags after each composition extraction, and it preserves the cleanup goal instead of incentivizing regressions toward a larger App component.

## Electron Obsidian IPC Findings - 2026-07-07
- `electron/main.ts` still contained one coherent inline IPC island after the earlier Electron extractions: template recognition, template file picking, vault path choosing, task sync/preview, and open-daily-note routing for Obsidian.
- This boundary was a good low-risk extraction because the handlers already communicated through explicit helpers (`getAiReviewSettings`, `getLlmCaller`, `syncTasksToObsidian`, `previewTasksToObsidian`, `getDailyFilePath`, `buildDailyTemplate`, `triggerOverviewUpdate`) rather than reaching widely into mutable `main.ts` state.
- `electron/obsidianIpc.ts` is the right home for this slice because it matches the established Electron pattern in the repo: `main.ts` keeps lifetime/state ownership, while per-feature modules own `ipcMain.handle(...)` registration through dependency injection.
- The correct verifier pattern here is the same one that worked for the App shell refactors:
  1. `main.ts` proves import + delegation + dependency passing.
  2. `obsidianIpc.ts` proves concrete channel registration and behavior ownership.
  3. feature-facing wiring verifiers like `verify-obsidian-template-ui` prove the renderer-facing contract still points at the same channels.
- When moving Electron dialog/title strings into newly created files, Unicode escapes are safer than copy-pasting terminal-rendered Chinese text; this pass reproduced the same mojibake risk and only surfaced it at build time.

## Electron Task Menu Window Findings - 2026-07-07
- `electron/main.ts` still owned the task-menu popup BrowserWindow creation after the earlier `taskContextMenuIpc` extraction, even though the popup surface already had a clear feature boundary.
- This boundary is safe to extract because popup creation depends only on `TaskMenuPayload`, screen work-area placement, the shared `loadRenderer(...)` callback, and close/cleanup hooks; `main.ts` can keep mutable `taskMenuWindow` state ownership and open/close flow.
- `electron/taskMenuWindow.ts` is the right home for this slice because it groups popup width/height constants, screen clamping, BrowserWindow options, preload wiring, renderer-route loading, ready-to-show behavior, and blur/closed lifecycle hooks in one focused helper.
- The verifier pattern here now mirrors the newer Electron/App cleanup style: `main.ts` proves import + delegation + state ownership, while `taskMenuWindow.ts` proves concrete popup placement and BrowserWindow configuration.

## Electron Tray Menu Findings - 2026-07-07
- `electron/main.ts` still owned the tray context-menu template and `new Tray(...)` creation after the earlier Electron IPC and popup-window extractions.
- This boundary is safe to extract because tray behavior depends only on explicit callbacks and getters: current main window access, current window mode, `setWindowMode(...)`, show/hide actions, quit action, and localized labels. `main.ts` can keep mutable `tray` state ownership and quit-state mutation.
- `electron/trayMenu.ts` is the right home for this slice because it groups `Menu.buildFromTemplate(...)`, the desktop-pin toggle action, localized tray labels, tooltip setup, and click wiring in one focused feature module.
- The verifier pattern here now matches the newer Electron cleanup style: `main.ts` proves helper import + delegation + state ownership, while `trayMenu.ts` proves concrete tray menu content and Tray construction.

## Electron Main Window Events Findings - 2026-07-07
- After the IPC, popup-window, and tray-menu extractions, `electron/main.ts` still owned one coherent BrowserWindow event-registration island: ready/show/load diagnostics, visibility state transitions, desktop-guard hooks, persisted bounds updates, and close/quit behavior.
- This boundary is safe to extract because the event handlers already communicate through explicit callbacks and getters: current app settings, quit state, user-hidden state, window mode, settings-mode flag, persist-window-state, hide-main-window, and desktop-guard start/stop helpers. `main.ts` can keep mutable state ownership while the helper only wires events.
- `electron/mainWindowEvents.ts` is the right home for this slice because it groups the event registration surface in one feature module without taking ownership of `mainWindow`, tray/task-menu state, or the underlying helper implementations.
- The verifier pattern follows the same stabilized Electron cleanup style: `main.ts` proves import + dependency injection + state ownership, while `mainWindowEvents.ts` proves concrete ownership of the BrowserWindow event hooks and related safety behavior.

## Electron Main Window Factory Findings - 2026-07-07
- After the event, tray, popup-window, and IPC extractions, `electron/main.ts` still owned one large but mostly mechanical `createWindow()` block: BrowserWindow construction plus a fixed bootstrap order for timers, tray setup, renderer loading, and feature registration.
- This boundary is safe to extract because it is orchestration-heavy rather than behavior-owning. `main.ts` can keep ownership of `mainWindow`, mutable settings/window/tray state, and all getter/callback closures, while a helper module owns the stable creation/bootstrap sequence.
- `electron/mainWindowFactory.ts` is the right home for this slice because it groups two closely related responsibilities:
  1. `createMainBrowserWindow(...)` owns the concrete BrowserWindow options and immediate per-window styling.
  2. `setupMainBrowserWindow(...)` owns the fixed bootstrap order while remaining agnostic about app state by consuming explicit callbacks.
- The verifier boundary here is intentionally callback-oriented: `main.ts` proves dependency injection and state ownership, while `mainWindowFactory.ts` proves creation details and orchestration order. Treating callback closures in `main.ts` as a failure would be too strict for this extraction stage and would push the code toward awkward premature abstractions.

## Electron App Lifecycle Findings - 2026-07-07
- After the main-window factory extraction, `electron/main.ts` still owned one coherent lifecycle/bootstrap island at the bottom of the file: `whenReady`, child-process diagnostics, quit-state transitions, desktop-owner cleanup on quit, `window-all-closed`, and macOS-style `activate` reopen behavior.
- This boundary is safe to extract because it is registration-oriented rather than state-owning. `main.ts` can keep ownership of `mainWindow`, `isQuitting`, `windowMode`, and `clearDesktopOwner(...)`, while a helper module wires Electron app events through explicit callbacks/getters.
- `electron/appLifecycle.ts` is the right home for this slice because it groups the Electron app-level event surface in one focused module, analogous to how `mainWindowEvents.ts` now groups the BrowserWindow event surface.
- The correct verifier boundary here is:
  1. `main.ts` proves import + delegation + state ownership.
  2. `appLifecycle.ts` proves ownership of `whenReady`, quit lifecycle events, child-process diagnostics, and activate reopen behavior.
  3. The helper should remain callback-based instead of pulling shared mutable state into another module; that keeps the extraction low-risk while still shrinking `main.ts`.

## Electron Desktop Window Mode Findings - 2026-07-07
- After the lifecycle extraction, the most coupled remaining Electron island in `electron/main.ts` was the desktop-mode state machine: desktop foreground detection, owner attachment to `Progman`, topmost/sink transitions, guard polling, and `applyWindowMode(...)` / `reapplyWindowZOrder(...)`.
- This boundary is riskier than the earlier IPC/event/bootstrap slices because it mixes Win32 effects with mutable polling state. The safe extraction pattern was to move the *internal* desktop-mode machine state into a controller module while keeping the *external* truth sources (`windowMode` and `userHidden`) in `main.ts`.
- `electron/desktopWindowMode.ts` is the right home for this slice because it keeps all of these tightly related mechanisms together:
  1. desktop foreground classification
  2. widget-state transitions
  3. owner apply/clear behavior
  4. guard polling lifecycle
  5. mode/z-order application
- A controller factory was safer than a bag of stateless helpers here. The controller can own ephemeral internals like polling timers, last foreground snapshots, owner-applied state, and current desktop widget state without forcing `main.ts` to expose or manually synchronize every implementation detail.
- The verifier boundary needed one related refresh: `verify-main-window-structure` and `windowMode.verify.ts` now prove that `main.ts` delegates through the controller and that `desktopWindowMode.ts` owns the risky desktop-mode implementation details. Treating those details as still belonging in `main.ts` would have blocked a maintainability win without protecting behavior any better.

## Electron Obsidian Daily Note Content Findings - 2026-07-07
- After the IPC/window/lifecycle extractions, `electron/main.ts` still had one medium-sized Obsidian content island that was lower-risk than sync orchestration: task/work/inspiration block builders, daily-note bootstrap generation, legacy section migration, managed-block wrappers, and blog-draft assembly.
- This boundary is safe to extract because it is content-oriented and dependency-light: the logic depends on template settings, `getDateKey`, `getTaskDate`, localization text, and shared Obsidian template helpers, but it does not need to own vault validation, file writes, preview calculation, overview refresh, or AI review scheduling.
- `electron/obsidianDailyNoteContent.ts` is the right home for this slice because it groups the whole daily-note content surface in one place:
  1. task/work/inspiration block construction
  2. daily note bootstrap generation from templates
  3. legacy work/inspiration section migration
  4. managed-block read/replace wrappers
  5. blog-draft assembly
- A small helper factory was safer than exporting many partially-wired free functions from `main.ts`: `createObsidianDailyNoteContentHelpers(...)` lets `main.ts` keep ownership of `getObsidianTemplateSettings`, `getDateKey`, `getTaskDate`, and `zh`, while the new module owns the content rules.
- Keeping `syncOneDailyNote(...)`, `syncTasksToObsidian(...)`, and `previewTasksToObsidian(...)` in `main.ts` was the right scope boundary for this pass. That preserves file I/O and orchestration behavior while still shrinking the content-heavy section of `main.ts`.
- The existing `electron/obsidianIpc.ts` contract did not need a boundary refresh because `main.ts` still passes `buildDailyTemplate` through the same dependency-injection shape; the only new focused verifier needed was for the content module itself.

## Electron Obsidian Sync Findings - 2026-07-07
- After the daily-note content extraction, the remaining Obsidian island in `electron/main.ts` was the sync/orchestration layer: daily-note path resolution, overview refresh triggering, single-note write orchestration, affected-date collection, full sync flow, and sync preview assembly.
- This boundary is still low-risk compared with AI/timer work because it is feature-local and already communicates through explicit helpers: vault path/status accessors, template settings access, the extracted daily-note content helper functions, and the existing AI-review trigger callback.
- `electron/obsidianSync.ts` is the right home for this slice because it groups the whole write/preview path together:
  1. `getDailyFilePath(...)`
  2. `triggerOverviewUpdate(...)`
  3. `syncOneDailyNote(...)`
  4. `getDatesAffectedBySync(...)`
  5. `syncTasksToObsidian(...)`
  6. `previewTasksToObsidian(...)`
- A helper factory again kept the risk low: `createObsidianSyncHelpers(...)` lets `main.ts` remain the owner of app-level state and callbacks (`getVaultStatus`, `getObsidianTemplateSettings`, `runReviewForDate`, `LOCAL_BLOG_DRAFT_DIR`) while the new module owns the Obsidian feature flow.
- Keeping the renderer-facing contracts stable mattered more than where the logic lived. `electron/obsidianIpc.ts` and `electron/aiReviewIpc.ts` still receive `getDailyFilePath`, `triggerOverviewUpdate`, `syncTasksToObsidian`, and `previewTasksToObsidian` through the same `main.ts` injection points, so no renderer/API boundary refresh was needed beyond the new focused verifier.
- After Phase 103, `electron/main.ts` dropped to 1003 lines. The remaining largest islands are now mostly AI diagnostics/timers plus a few smaller utilities such as the apparently-unused `getTaskExportFilePath(...)` and `isDesktopForeground(...)` candidates.

## Electron AI Review Runtime Findings - 2026-07-07
- After the Obsidian sync extraction, the next meaningful shared AI surface in `electron/main.ts` was not the daily review runner itself but the reusable runtime helpers around it: report-profile availability checks, staged progress IPC, diagnostic assembly, and DOCX extraction.
- This was a good next boundary because the same helpers are consumed in two places:
  1. the daily `runReviewForDate(...)` flow in `main.ts`
  2. the weekly/monthly/external AI report flows in `electron/aiReviewIpc.ts`
- `electron/aiReviewRuntime.ts` is the right home for this slice because it groups the reusable AI runtime mechanics without taking ownership of higher-level orchestration:
  1. report-kind LLM resolution and availability validation
  2. `stage(...)`
  3. `emitAiReviewProgress(...)`
  4. `createDiagnostic(...)`
  5. `extractDocxText(...)`
- Keeping `runReviewForDate(...)` in `main.ts` for now was the right cut. That preserves the daily-review orchestration boundary and avoids simultaneously moving inspection, source preparation, runner invocation, and write-result mapping in one pass.
- `verify-ai-run-diagnostics` needed a boundary refresh because it previously treated `main.ts` as the owner of progress IPC and diagnostic construction internals. The better invariant is:
  - `main.ts` proves helper creation and daily-flow usage
  - `aiReviewRuntime.ts` proves ownership of progress emission and diagnostic assembly
- After Phase 104, `electron/main.ts` dropped to 905 lines. The most obvious remaining heavyweight area is now the daily-review runner plus timer scheduling, with smaller cleanup candidates still including `getTaskExportFilePath(...)` and `isDesktopForeground(...)`.

## Electron AI Daily Review Runner Findings - 2026-07-07
- After the runtime-helper extraction, the remaining daily AI island in `electron/main.ts` was the pair `inspectDailyAiContent(...)` and `runReviewForDate(...)`: one coherent feature boundary covering inspection, source preparation, runner invocation, and daily diagnostic staging.
- `electron/aiReviewDailyRunner.ts` is the right home for this slice because it groups the whole daily review execution surface together:
  1. daily note AI-content inspection
  2. structured read-failure handling
  3. prompt/build/request/write/confirm stage diagnostics
  4. `runReviewForFile(...)` invocation with force-regeneration support
- The only coupling wrinkle was the existing `obsidianSync.ts -> runReviewForDate(...)` callback while the daily runner itself still depends on `getDailyFilePath(...)` from `obsidianSync.ts`. The low-risk fix was a narrow initialization wrapper in `main.ts`: create `obsidianSyncHelpers` first with a deferred `runReviewForDate` callback, then create the daily runner with the resolved `getDailyFilePath(...)`, and finally bind the deferred callback.
- The verifier boundary is now cleaner:
  - `main.ts` proves helper creation, dependency injection, and preserved IPC/sync wiring
  - `aiReviewDailyRunner.ts` proves inspection fallback behavior and daily orchestration details
  - `verify-ai-regenerate-detection`, `verify-ai-regenerate-force`, and `verify-ai-run-diagnostics` follow the new boundary instead of forcing those details to stay inline in `main.ts`
- After Phase 105, `electron/main.ts` is 908 lines. The next most natural Electron cleanup target is the timer scheduling cluster; the smaller pure-utility candidates `getTaskExportFilePath(...)` and `isDesktopForeground(...)` still remain available if we want an even lower-risk micro-pass first.

## Electron AI Timer Scheduling Findings - 2026-07-07
- After the daily-runner extraction, the next coherent AI island in `electron/main.ts` was the timer scheduling cluster: five per-report timer functions plus the shared `scheduleAiTimers()` wrapper.
- `electron/aiReviewTimers.ts` is the right home for this slice because it groups one feature-local responsibility:
  1. daily timer scheduling
  2. weekly timer scheduling
  3. monthly timer scheduling
  4. external weekly timer scheduling
  5. external monthly timer scheduling
  6. shared reschedule entrypoint for bootstrap and settings changes
- A controller/factory shape was safer than moving only the five inner functions. `createAiReviewTimerScheduler(...)` can own the timeout refs internally while `main.ts` keeps ownership of the current main-window reference and AI Review settings source through injected getters.
- The verifier boundary is now simpler:
  - `main.ts` proves helper creation plus continued callback injection into `mainWindowFactory.ts` and `aiReviewIpc.ts`
  - `aiReviewTimers.ts` proves the five timer schedulers, event names, and delay helper ownership
  - `verify-electron-ai-review-ipc-module` no longer forces the scheduler internals to remain inline in `main.ts`
- After Phase 106, `electron/main.ts` is 822 lines. The next natural low-risk candidates are the smaller pure helpers still sitting in `main.ts` such as `getTaskExportFilePath(...)`, or a larger-but-riskier Win32/native binding boundary if we want to keep shrinking the file aggressively.

## Electron Win32 / Native Helper Findings - 2026-07-07
- After the AI timer extraction, `electron/main.ts` still owned one coherent platform-specific island: Win32 `koffi` binding setup, desktop foreground detection, a retained tool-window-style no-op, and the native background-material helper.
- This boundary was safe to extract because it is platform-local and dependency-light: the behavior depends only on diagnostics plus `BrowserWindow`, while the mutable desktop/window-mode state remains in `main.ts` and `desktopWindowMode.ts`.
- `electron/win32Native.ts` is the right home for this slice because it groups the whole native surface together:
  1. Win32 bridge type + binding creation
  2. HWND buffer creation and z-order constants
  3. desktop foreground detection helper
  4. retained tool-window-style helper boundary
  5. native background-material disable wiring
- A helper factory kept the extraction low-risk: `createWin32NativeHelpers(...)` lets `main.ts` keep ownership of diagnostics consumption, `desktopWindowMode` injection, and the main-window factory contract while moving the native implementation details out of the orchestration file.
- The related verifier boundary stayed stable without extra churn:
  - `verify-main-window-structure` still proves the main-window factory / event / tray composition boundary
  - `windowMode.verify.ts` still proves `desktopWindowMode` wiring through `getWin32: () => win32`
  - the new focused verifier owns the Win32/native-specific assertions
- After Phase 107, `electron/main.ts` is 669 lines. The next natural low-risk Electron cleanup candidate is the smaller leftover pure helper `getTaskExportFilePath(...)`, unless we want to switch away from Electron for the next pass.

## Legacy Task Export Path Cleanup Findings - 2026-07-08
- After Phase 107, the remembered next candidate `getTaskExportFilePath(...)` turned out not to be a worthwhile extraction target at all: current-state search showed it was unused, and `taskExportPath` only remained as dead baggage in `electron/main.ts`, `shared/obsidianTemplates.ts`, and `src/i18n.ts`.
- Removing the legacy concept was more aligned than extracting it. An extracted unused helper would have preserved obsolete surface area; deleting it reduced maintenance cost and shrank the mental model.
- The focused verifier boundary for this cleanup is intentionally narrow:
  1. `electron/main.ts` must not keep `getTaskExportFilePath(...)` or its `resolveTemplatePath` dependency.
  2. `shared/obsidianTemplates.ts` must not preserve a dead `taskExportPath` compatibility field.
  3. `src/i18n.ts` must not expose labels for a setting that no longer exists in the product.
- After Phase 108, `electron/main.ts` is 661 lines. The next natural low-risk Electron cleanup candidate is the settings/state accessor island around vault/app/template/AI review getters and setters, which is still cohesive enough to split behind a dedicated verifier.

## Electron App State Accessors Module Findings - 2026-07-08
- After Phase 108, `electron/main.ts` still owned one cohesive store-backed accessor island: vault-path/default-path resolution, vault validation, Companion settings access, app/template/AI-review normalization, review-section storage, daily source-rule derivation, and shared LLM caller construction.
- This boundary was safe to extract because it is dependency-injected data access and derived-reader logic rather than lifecycle orchestration. The feature modules already consume these behaviors through function injection, so `main.ts` could keep state ownership and consumer wiring while moving the implementation details behind a single factory.
- `electron/appStateAccessors.ts` is the right home for this slice because it groups the whole state-access surface together:
  1. vault default/path/status helpers
  2. Companion settings get/set behavior
  3. app and Obsidian template settings normalization
  4. AI Review settings and section normalization
  5. daily source-rule derivation
  6. shared LLM caller construction from the active AI profile
- A factory shape kept the cut low-risk: `createAppStateAccessors(...)` lets `main.ts` keep `store`, development-path policy, and `zh(...)` ownership while the new module owns the concrete normalization/defaulting rules.
- The verifier boundary for this pass mirrors the stabilized Electron refactor pattern:
  - `main.ts` proves helper import, factory creation, destructuring, and preserved injection into existing IPC/runtime consumers.
  - `electron/appStateAccessors.ts` proves ownership of the extracted accessor functions and the shared helper imports (`createDefaultCompanionSettings`, normalization helpers, `resolveActiveProfile`, `callChatCompletion`).
- After Phase 109, `electron/main.ts` is 578 lines, down from 661 before this pass.

## Electron Shared Types Module Findings - 2026-07-08
- After Phase 109, the next clean duplication cluster was no longer behavior but shape definitions: `electron/main.ts`, `electron/aiReviewIpc.ts`, `electron/aiReviewDailyRunner.ts`, `electron/obsidianDailyNoteContent.ts`, and `electron/obsidianSync.ts` each kept their own near-identical recursive task type; several Electron modules also repeated `VaultStatus`, `InspectDailyResult`, or a small store interface.
- This was a good optimization target because it improves maintainability without touching runtime logic. The modules were already behaviorally separated; only their shared structural vocabulary was still duplicated.
- `electron/sharedTypes.ts` is the right home for this slice because it centralizes the Electron-only shape contracts that multiple feature modules depend on:
  1. `ElectronTask`
  2. `TaskCompletionReview`
  3. `InspectDailyResult`
  4. `VaultStatus`
  5. `ElectronStoreLike`
- The important scope decision was to keep this module **type-only**. No helpers or runtime code moved here; that kept the cut low-risk and made fresh verification mostly about structural boundaries plus TypeScript integrity.
- The verifier boundary for this pass is:
  - `electron/sharedTypes.ts` proves ownership of the shared type exports.
  - the affected Electron modules prove they now import those types instead of redefining them inline.
- After Phase 110, `electron/main.ts` is 549 lines, down from 578 before this pass.

## Electron Main Shell Controller Findings - 2026-07-08
- After Phase 110, `electron/main.ts` still owned one coherent shell/UI-control island: main-window show/hide, tray-menu refresh/creation, and task-menu popup open/close orchestration.
- This boundary was safe to extract because it coordinates already-extracted helpers (`trayMenu.ts`, `taskMenuWindow.ts`, `desktopWindowMode.ts`) without owning the underlying tray, popup, or window-mode implementation details.
- `electron/mainShellController.ts` is the right home for this slice because it groups one orchestration layer:
  1. explicit show/hide `userHidden` transitions
  2. tray refresh with quit + desktop-mode toggle wiring
  3. tray creation using injected icon sourcing
  4. popup lifecycle open/close orchestration around `createTaskMenuWindow(...)`
- Keeping `tray`, `taskMenuWindow`, `userHidden`, and quit-state ownership in `main.ts` was the key low-risk decision. Getter/setter injection preserved the existing truth sources while removing the shell behavior block from `main.ts`.
- The related verifier boundary needed a small cascade refresh: tray, task-menu, desktop-mode, context-menu, and main-window structure checks now prove that `main.ts` owns state/injection while `mainShellController.ts` owns the shell orchestration details.
- After Phase 111, `electron/main.ts` is 515 lines, down from 549 before this pass.

## Electron Main Window Persistence Findings - 2026-07-08
- After Phase 111, `electron/main.ts` still owned one cohesive store-backed window-runtime island: startup bounds calculation, debounced bounds persistence, and legacy window-mode restoration.
- This boundary was safe to extract because it is state-access + normalization logic, not lifecycle orchestration. It also complements the existing pure `electron/windowState.ts` module without changing any renderer-facing behavior.
- `electron/mainWindowPersistence.ts` is the right home for this slice because it groups:
  1. initial bounds calculation from normalized saved state
  2. debounced persisted window-state writes
  3. stored window-mode restoration through legacy boolean migration
- A factory shape kept the cut low-risk: `createMainWindowPersistence(...)` owns the internal debounce timer while `main.ts` keeps store ownership and injects the storage keys explicitly.
- While checking related verification, `verify-ui-feedback-regressions` turned out to contain an unrelated stale App-shell assumption (`reviewViewProps` still expected inline in `App.tsx`). That is a separate verifier-refresh candidate, not a regression introduced by this window-persistence split.
- After Phase 112, `electron/main.ts` is 495 lines, down from 515 before this pass.

## Electron Main Window Bootstrap Wiring Findings - 2026-07-08
- After Phase 112, `electron/main.ts` still owned one cohesive orchestration island inside `createWindow()`: the callback bundle passed into `setupMainBrowserWindow(...)` for renderer loading plus event and IPC registration.
- This boundary was safe to extract because it is composition-only wiring. The underlying behavior already lived in focused modules (`mainWindowEvents.ts`, `windowIpc.ts`, `settingsIpc.ts`, `taskContextMenuIpc.ts`, `companionIpc.ts`, `aiReviewIpc.ts`, `obsidianIpc.ts`); `main.ts` only needed to keep mutable state truth sources and inject them.
- `electron/mainWindowBootstrap.ts` is the right home for this slice because it groups one fixed bootstrap concern:
  1. main renderer load wiring
  2. tray creation diagnostic wrapper
  3. main-window event registration wiring
  4. window/settings/task-context-menu IPC wiring
  5. Companion / AI Review / Obsidian IPC wiring
- A factory shape kept the cut low-risk: `createMainWindowBootstrap(...)` returns the exact `SetupMainBrowserWindowOptions` shape expected by `mainWindowFactory.ts`, so the bootstrap order stayed unchanged while `main.ts` became thinner.
- The main verifier consequence was boundary refresh, not behavior refresh. A number of scripts previously asserted that `main.ts` directly called `register*Handlers(...)`; after this pass, the better invariant is:
  - `main.ts` proves `createMainWindowBootstrap(...)` delegation and state ownership
  - `mainWindowBootstrap.ts` proves callback assembly and preserved dependency injection into the already-extracted feature modules
- After Phase 113, `electron/main.ts` is 448 lines, down from 495 before this pass. The remaining next-step candidates in `main.ts` are now smaller utility/orchestration leftovers rather than a large callback wall.

## Electron Task Date Helper Findings - 2026-07-08
- After Phase 113, `electron/main.ts` still owned one small pure-helper island: date-key normalization, task-date resolution, review-date resolution, and completion-review fallback selection for the Obsidian / AI helper wiring.
- This boundary was safe to extract because it is pure data shaping with no Electron runtime side effects. The functions already flowed only through dependency injection into other helper modules.
- `electron/taskDateHelpers.ts` is the right home for this slice because it groups one tiny, cohesive vocabulary:
  1. today-date formatting
  2. date-key normalization
  3. task-date fallback resolution
  4. review-date normalization
  5. completion-review array fallback
- While auditing the same region, two leftover helpers in `main.ts` turned out to be dead in the current source tree: `escapeTaskText(...)` and `formatDateTime(...)`. They still exist in `shared/obsidianTemplates.ts`, but the copies in `main.ts` were no longer referenced after earlier Obsidian extractions.
- The unused `DesktopWidgetState` alias in `main.ts` was also safe to remove because the real desktop-mode state machine already lives in `electron/desktopWindowMode.ts`.
- After Phase 114, `electron/main.ts` is 415 lines, down from 448 before this pass. The remaining work in `main.ts` is now mostly orchestration and app boot/runtime state, not obvious pure-helper clutter.

## Electron Main Window Mode Controller Findings - 2026-07-08
- After Phase 114, `electron/main.ts` still owned one compact but behaviorful orchestration island: `setWindowMode(...)` persisted the mode, delegated to desktop-mode application, re-applied z-order after a delay, notified the renderer, and refreshed the tray.
- This boundary was a good next extraction because it is cohesive and already consumed through dependency injection by multiple places (`mainShellController.ts` and `windowIpc.ts`). Moving it out reduces `main.ts` without forcing deeper lifecycle changes.
- `electron/mainWindowModeController.ts` is the right home for this slice because it groups one runtime responsibility:
  1. persist window mode
  2. apply the new mode through the desktop-mode controller
  3. reapply z-order after the existing delay
  4. emit `window:modeChanged`
  5. refresh tray state when present
- The only coupling wrinkle was an initialization cycle: `mainShellController` needs `setWindowMode`, while the new mode controller also wants tray refresh behavior from `mainShellController`. The low-risk solution was a narrow delayed callback bridge (`refreshTrayMenuImpl`) in `main.ts`, preserving ownership and behavior without reordering the broader controller setup.
- The verifier consequence was another boundary refresh, not a behavior rewrite:
  - `main.ts` now proves controller creation and dependency injection
  - `mainWindowModeController.ts` proves mode-persistence and z-order/broadcast behavior
  - `desktopWindowMode` verification now follows the new intermediate controller instead of requiring inline `desktopWindowMode.applyWindowMode(...)` calls in `main.ts`
- After Phase 115, `electron/main.ts` is 421 lines. The file is now mostly startup/runtime orchestration, renderer loading, development-environment setup, and app-instance boot policy rather than stray utility or mode-change logic.


## Electron Renderer Loader Findings - 2026-07-08
- After Phase 115, `electron/main.ts` still owned one small but reusable orchestration helper: `loadRenderer(...)` resolved the dev server URL, built route query params, logged the target, and chose between `loadURL(...)` and `loadFile(...)`.
- This boundary was safe to extract because it is pure renderer-boot routing with no ownership of main-window, tray, popup, or lifecycle state. The consumers already depend on it through a narrow callback contract.
- `electron/rendererLoader.ts` is the right home for this slice because it groups one renderer-loading responsibility:
  1. dev-server URL resolution
  2. shared renderer-route query construction
  3. packaged `dist/index.html` loading
  4. renderer-load diagnostics for both branches
- Keeping the interface as `loadRenderer(win, route)` preserved the existing dependency flow into `mainWindowBootstrap.ts`, `mainShellController.ts`, and `taskMenuWindow.ts`, so the cut stayed structural rather than behavioral.
- After Phase 116, `electron/main.ts` is 405 lines, down from 421 before this pass. The remaining contents are now mostly app boot policy, development-path setup, and top-level composition/lifecycle wiring rather than reusable renderer-loading glue.


## Electron App Environment Findings - 2026-07-08
- After Phase 116, `electron/main.ts` still owned one cohesive startup/helper cluster: development path constants, build-mode detection, development `userData` override, and icon-path option construction.
- This boundary was safe to extract because it is configuration/runtime-environment shaping rather than lifecycle orchestration. The consumers already use these values through narrow dependency injection points.
- `electron/appEnvironment.ts` is the right home for this slice because it groups one startup environment responsibility:
  1. development-vs-packaged detection
  2. development userData override policy
  3. shared icon path option construction
  4. dev-only path constants for the local vault and blog draft output
- The related verifier debt was instructive: `verify-electron-app-state-accessors-module` and `verify-electron-obsidian-sync-module` were both too coupled to the old location of `DEV_OBSIDIAN_PATH` and `LOCAL_BLOG_DRAFT_DIR`. The better invariant is that `main.ts` wires those values into downstream helpers, while `appEnvironment.ts` owns the concrete path constants.
- After Phase 117, `electron/main.ts` is 397 lines, down from 405 before this pass. The remaining content is increasingly concentrated in app boot policy, top-level state ownership, and final composition wiring.


## Electron Single Instance Findings - 2026-07-08
- After Phase 117, `electron/main.ts` still owned one compact startup-policy island: single-instance lock acquisition, duplicate-instance quit handling, and `second-instance` restore/show/focus behavior for the existing window.
- This boundary was safe to extract because it is isolated boot orchestration with only three dependencies: `app`, diagnostics, and access to the current main window reference.
- `electron/singleInstance.ts` is the right home for this slice because it groups one clear policy responsibility:
  1. acquire the single-instance lock
  2. log and quit duplicate instances
  3. reactivate the existing main window when a second instance is launched
- Keeping the dependency as `getMainWindow()` preserved `main.ts` as the truth source for mutable window ownership while letting the helper own the boot policy details.
- After Phase 118, `electron/main.ts` is 390 lines, down from 397 before this pass. The remaining file is now increasingly concentrated in top-level state ownership and final composition wiring rather than boot-policy helpers.

## Electron Main Window Startup Findings - 2026-07-08
- After Phase 118, `electron/main.ts` still owned one small but coherent startup orchestration shell: default vault-path seeding, startup bounds/mode resolution, `createMainBrowserWindow(...)`, injected `mainWindow` assignment, initial mode application, and fixed bootstrap ordering.
- This boundary was safe to extract because it is composition-only startup wiring. The underlying behavior already lived in focused modules (`mainWindowPersistence.ts`, `mainWindowFactory.ts`, `mainWindowBootstrap.ts`, and `desktopWindowMode.ts`); `main.ts` only needed to keep mutable state ownership and dependency assembly.
- `electron/mainWindowStartup.ts` is the right home for this slice because it groups one clear startup responsibility:
  1. seed the default vault path when no explicit path has been stored
  2. resolve initial bounds and stored window mode
  3. create the main `BrowserWindow`
  4. assign the created window back through the injected setter
  5. apply the initial mode
  6. preserve the fixed bootstrap order through `setupMainBrowserWindow(...)`
- The key low-risk decision was to keep `mainWindow` truth-source ownership and bootstrap dependency assembly in `main.ts` while moving only the orchestration shell into `createMainWindowStarter(...)`.
- This pass also required a small verifier-boundary refresh: `verify-electron-main-window-factory-module` and `verify-electron-main-window-bootstrap-module` should now prove the `main.ts -> mainWindowStartup.ts` handoff instead of expecting `createWindow()` to remain inline in `main.ts`.
- After Phase 119, `electron/main.ts` remains 390 lines, but the file is now more purely a top-level composition shell. The next safe Electron candidates are narrower state/composition seams rather than obvious helper islands.

## Electron Settings Mode State Findings - 2026-07-08
- After Phase 119, `electron/main.ts` no longer had a big helper island, but one small state seam still leaked across multiple modules: `settingsModeOpen`, `settingsModeRestoreWidth`, the repeated `SettingsModeState` shape, and a redundant `getSettingsModeOpen()` callback.
- This was a good optimization target because it improved boundary clarity without changing runtime behavior. The settings-mode behavior already lived in `windowIpc.ts` and `mainWindowEvents.ts`; the remaining problem was scattered state ownership and duplicated typing.
- `electron/settingsModeState.ts` is the right home for this slice because it groups one tight responsibility:
  1. settings-mode open-state ownership
  2. settings-mode restore-width ownership
  3. the shared `SettingsModeState` contract used by Electron bootstrap/event/IPC modules
- The key low-risk decision was to keep this module stateful-but-tiny: `createSettingsModeState(...)` owns only the mutable booleans/numbers, while `main.ts` still owns overall boot composition and the downstream modules still own actual window behavior.
- The nicest secondary effect is that `mainWindowEvents.ts` no longer needs a one-off `getSettingsModeOpen()` callback. It now depends directly on the minimal shared read surface: `Pick<SettingsModeState, 'isOpen'>`.
- After Phase 120, `electron/main.ts` is 344 lines, down from 390 before this pass. The file is now even more concentrated on top-level composition, with fewer ad hoc mutable state adapters living inline.

## Electron User Hidden State Findings - 2026-07-08
- After Phase 120, another tiny state seam remained in `electron/main.ts`: the `userHidden` boolean, which represents whether the user explicitly hid the main window. It was written by `mainShellController.ts` and read by `mainWindowEvents.ts` / `desktopWindowMode.ts` through ad hoc callbacks.
- This boundary was safe to extract because it is pure process-local state with no Electron side effects. The behaviorful modules still own showing/hiding, desktop guard recovery, and diagnostics; the new helper only owns the boolean and shared type contract.
- `electron/userHiddenState.ts` is the right home for this slice because it groups one exact responsibility:
  1. user-hidden truth-source ownership
  2. `isHidden()` read contract for desktop guard and window-event diagnostics
  3. `setHidden(...)` write contract for explicit show/hide shell actions
- The key low-risk decision was to pass narrow facets rather than a broad mutable object everywhere: `mainShellController.ts` only needs `Pick<UserHiddenState, 'setHidden'>`, while `mainWindowBootstrap.ts`, `mainWindowEvents.ts`, and `desktopWindowMode.ts` only need `Pick<UserHiddenState, 'isHidden'>`.
- This pass exposed one stale verifier boundary in `verify-main-window-structure`: it still expected diagnostics to call `getUserHidden()` even though the better invariant is now that diagnostics read from `userHidden.isHidden()` through the shared state object.
- After Phase 121, `electron/main.ts` is 343 lines. The remaining Electron main file is almost entirely top-level composition and a few unavoidable truth sources (`mainWindow`, `tray`, `taskMenuWindow`, `isQuitting`, and `windowMode`).

## UI Feedback Regression Verifier Boundary Findings - 2026-07-08
- `verify:ui-feedback-regressions` still contained stale renderer-shell assertions from before the App shell composition extraction. It expected `reviewViewProps` and `addTaskInputProps` to be assembled inline in `src/App.tsx`.
- The current product boundary is now cleaner and still behavior-preserving:
  1. `src/App.tsx` owns hook state and handler sources, then delegates shell prop composition through `createAppShellComposition(...)`.
  2. `src/app/appShellComposition.tsx` owns grouped UI prop objects, including `reviewViewProps` and `addTaskInputProps`.
  3. `src/components/AppMainContent.tsx` remains the rendering boundary that forwards `reviewViewProps` to `ReviewView` and `addTaskInputProps` to `AddTaskInput`.
- The stale verifier failure was not a product-code regression. The correct invariant is to prove the whole chain: `App.tsx` passes `deleteTaskReview` / `addTask` into shell composition, `appShellComposition.tsx` preserves the `onDeleteReview` / `onAdd` mapping, and `AppMainContent.tsx` forwards the composed props to the child components.

## Electron Main Store Keys Findings - 2026-07-08
- After Phase 122, `electron/main.ts` was already mostly top-level composition, but it still owned four raw store-key string constants: `OBSIDIAN_PATH_KEY`, `WINDOW_STATE_KEY`, `COMPACT_MODE_KEY`, and `AUTO_START_KEY`.
- This was a safe optimization target because it is const-only configuration. Moving the keys does not change startup, persistence, IPC, or renderer behavior; it simply gives the storage-key vocabulary a focused home.
- `electron/mainStoreKeys.ts` is the right home for this slice because the keys are shared across several composition boundaries:
  1. Obsidian vault path seeding and bootstrap injection
  2. main-window persisted bounds lookup/write
  3. compact-mode bootstrap/IPC wiring
  4. auto-start bootstrap/IPC wiring
- The verifier boundary for this pass is intentionally small: prove the exact string values live in `mainStoreKeys.ts`, prove `main.ts` imports them instead of defining them inline, and prove `main.ts` still injects the constants into persistence/startup/bootstrap options.

## Electron AI Review Runner Bridge Findings - 2026-07-08
- After Phase 123, `electron/main.ts` still owned one small delayed-wiring seam: `runReviewForDateImpl` started as `null`, Obsidian sync received a proxy callback, and the real AI daily-review runner was assigned later after `createAiReviewDailyRunner(...)` returned.
- This was a safe optimization target because it is not feature logic; it is a bridge required by initialization order. Extracting it clarifies the reason for the nullable state without changing the runner, Obsidian sync, or AI review behavior.
- `electron/aiReviewRunnerBridge.ts` is the right home for this slice because it groups exactly one responsibility:
  1. hold the delayed AI review runner reference
  2. expose a stable `runReviewForDate` callback for earlier composition
  3. preserve the existing `AI daily review runner not initialized` guard
  4. accept the real runner once AI daily-review helpers are created
- Keeping `main.ts` responsible for when the bridge is created and when `setRunner(...)` is called preserves the top-level composition order, while removing a bespoke nullable variable and inline guard from the composition shell.

## Electron App Quit State Findings - 2026-07-08
- After Phase 124, `electron/main.ts` still owned one tiny process-local quit-state boolean: `isQuitting`. It was read by app lifecycle / window-close paths and written by both lifecycle shutdown and tray/menu quit actions.
- This boundary was safe to extract because it is pure process-local state with no Electron side effects. The behaviorful modules still own app shutdown, window-close decisions, and shell actions; the new helper only owns the boolean and shared read/write contract.
- `electron/appQuitState.ts` is the right home for this slice because it groups one exact responsibility:
  1. app quit-state truth-source ownership
  2. `isQuitting()` read contract for lifecycle and window event guards
  3. `markQuitting()` write contract for explicit quit paths
- The key low-risk decision was to keep existing callback injection shapes in `mainWindowBootstrap.ts` and `appLifecycle.ts`. `main.ts` now passes `appQuitState.isQuitting` and `appQuitState.markQuitting` directly, while shell quit still marks quit state before calling `app.quit()`.
- The next similar state seam visible in `electron/main.ts` is `windowMode`, but it is more behaviorful than quit state because desktop-mode and mode-controller modules both participate in reads/writes. It should be handled only with a focused verifier covering stored initial mode, controller state updates, bootstrap reads, lifecycle reads, and shell reads.

## Electron Window Mode State Findings - 2026-07-08
- After Phase 125, `electron/main.ts` still owned one small but behavior-adjacent process-local state seam: `windowMode`, initialized to `'onTop'`, written by `desktopWindowMode` when startup/stored-mode application occurs, and read by shell, bootstrap, and lifecycle boundaries.
- This boundary was safe to extract only with a focused verifier because it is more connected than the quit-state boolean. The new module must not change persisted-mode behavior, desktop-mode application, renderer broadcasts, tray refresh, or lifecycle cleanup.
- `electron/windowModeState.ts` is the right home for this slice because it groups one exact responsibility:
  1. current window-mode truth-source ownership
  2. `getMode()` read contract for shell/bootstrap/lifecycle/desktop mode
  3. `setMode(...)` write contract for desktop-mode startup/application state updates
- The key low-risk decision was to keep all behaviorful mode orchestration where it already lived: `mainWindowModeController.ts` still persists and broadcasts mode changes, while `desktopWindowMode.ts` still applies native window state. The new state helper only replaces the bare mutable variable in `main.ts`.
- This pass exposed one stale verifier boundary in `verify-electron-desktop-window-mode-module`: it still required the old inline setter in `main.ts`. The updated invariant follows the new state seam by checking `windowModeState.setMode` injection instead.

## Electron Main Runtime State Findings - 2026-07-08
- After Phase 126, `electron/main.ts` still owned three bare Electron runtime references: `mainWindow`, `tray`, and `taskMenuWindow`. They were not business logic, but they leaked mutable process state across many composition boundaries through ad hoc getters and setters.
- This boundary was safe to extract because the behaviorful modules already own all actions: startup creates and assigns the main window, shell controller manages tray/task-menu actions, mode controller only checks tray presence, single-instance only reads the main window, timers only target the current main window, and lifecycle only clears the main-window reference.
- `electron/mainRuntimeState.ts` is the right home for this slice because it groups one exact responsibility:
  1. current main-window reference ownership
  2. current tray reference ownership
  3. current task-menu-window reference ownership
  4. narrow get/set/clear methods used by existing composition boundaries
- The key low-risk decision was not to move any behavior into the state object. It only stores references; `main.ts` still composes the app, and downstream modules still control behavior through dependency injection.
- This pass exposed several stale verifier boundaries that still treated bare variables in `main.ts` as the invariant. The stronger invariant is now that `main.ts` injects `runtimeState` methods while behavior remains in the same downstream modules.

## Electron Main Localization Findings - 2026-07-08
- After Phase 127, `electron/main.ts` still owned one tiny helper function: `zh(text: string) { return text; }`. It was not behaviorful, but it was a shared dependency injected into app-state, Obsidian daily-note content, shell, and bootstrap boundaries.
- This boundary was safe to extract because the helper is an identity function and the pass did not change any renderer i18n, user-visible strings, or encoding/mojibake content.
- `electron/mainLocalization.ts` is the right home for this slice because it groups one exact responsibility:
  1. define the main-process localizer contract
  2. preserve the existing identity `zh(...)` behavior
  3. keep localization-related wiring out of the top-level composition shell
- The key low-risk decision was to avoid combining this with any text cleanup. Terminal mojibake and visible copy cleanup remain separate, higher-risk visual/encoding work.

## Electron Tray Refresh Bridge Findings - 2026-07-08
- After Phase 128, `electron/main.ts` still owned one delayed callback bridge: `refreshTrayMenuImpl` started as `null`, the mode controller received an optional-call wrapper, and the real shell `refreshTrayMenu` function was assigned after `createMainShellController(...)` returned.
- This boundary was safe to extract because it is initialization-order plumbing, not tray menu behavior. The shell controller still owns real tray refresh behavior, and the mode controller still decides when a tray refresh is needed after a window-mode change.
- `electron/trayRefreshBridge.ts` is the right home for this slice because it groups exactly one responsibility:
  1. hold the delayed tray-refresh callback reference
  2. expose a stable `refreshTrayMenu()` callback to earlier composition
  3. preserve the existing optional no-op semantics before shell setup
  4. accept the real shell refresh callback once it exists
- This cut mirrors the earlier AI review runner bridge pattern while staying lower-risk: unlike the AI bridge, uninitialized tray refresh remains a no-op rather than an error, matching the previous `refreshTrayMenuImpl?.()` behavior.

## Electron Main Dead Task Alias Cleanup Findings - 2026-07-08
- After Phase 129, `electron/main.ts` still imported `ElectronTask` only to define `type Task = ElectronTask`, but no code in `main.ts` referenced `Task`. This was leftover type-only clutter from earlier shared-type extraction.
- Removing the alias is behavior-free: no runtime code changed, and the real `ElectronTask` definition remains in `electron/sharedTypes.ts` for modules that still consume task-shaped data.
- The stale verifier boundary was in `verify-electron-shared-types-module`: it correctly verifies that shared task typing exists, but it no longer needs to force `main.ts` to be a consumer. The stronger invariant is that actual Electron task-processing modules import `ElectronTask`, while the top-level composition shell avoids dead aliases.

## Electron Native Occlusion Policy Findings - 2026-07-08
- After Phase 130, `electron/main.ts` still owned one top-level startup policy: disabling Chromium native window occlusion with `app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion')`.
- This boundary was safe to extract because it is a single startup policy with a narrow dependency on `app.commandLine.appendSwitch`. Moving it does not change the switch value or timing as long as `main.ts` calls the helper before app-ready work.
- `electron/nativeOcclusionPolicy.ts` is the right home for this slice because it groups one exact responsibility:
  1. define the minimal app command-line contract
  2. preserve the `CalculateNativeWinOcclusion` Chromium feature-disable switch
  3. keep Windows transparency/Win+D occlusion mitigation policy out of the top-level composition shell
- The key verifier invariant is ordering: `disableNativeWindowOcclusion(app)` must remain before app-environment setup and app-ready lifecycle wiring.

## Electron Diagnostics Safe Start Findings - 2026-07-08
- After Phase 131, `electron/main.ts` still owned a small crash-diagnostics startup guard: create a logger, call `startCrashDiagnostics(diag)`, and catch/log startup failures as `crash diagnostics startup failed: ...`.
- This boundary was safe to extract because diagnostics already owns crash reporter startup, process exception handlers, diagnostic log path resolution, and logger creation. The remaining try/catch is diagnostics-specific safety policy rather than top-level app composition.
- `startCrashDiagnosticsSafely(diag)` is the right shape because it preserves both layers:
  1. `startCrashDiagnostics(diag)` remains the low-level crash reporter / process handler registration helper
  2. `startCrashDiagnosticsSafely(diag)` owns the outer startup guard and fallback log
  3. `main.ts` only composes the logger and starts diagnostics through one safe call
- This keeps behavior unchanged while removing another small startup-policy island from `electron/main.ts`.



## Electron Main Diagnostics Bootstrap Findings - 2026-07-08
- After Phase 132, `electron/main.ts` no longer owned the crash-diagnostics try/catch, but it still owned the three-step diagnostics bootstrap sequence: create the logger, start crash diagnostics safely, and emit `=== app starting ===`.
- This boundary was safe to extract because all diagnostics-specific behavior already lived in `electron/diagnostics.ts`; the remaining sequence was startup diagnostics policy rather than top-level app composition.
- `createMainDiagnostics()` is the right home for this slice because it groups one exact responsibility:
  1. create the main-process diagnostics logger through `createDiagLogger()`
  2. start crash diagnostics through the safe wrapper `startCrashDiagnosticsSafely(diag)`
  3. preserve the existing `=== app starting ===` startup log
  4. return the stable `diag` callback for downstream Electron composition
- Keeping `startCrashDiagnostics(diag)` and `startCrashDiagnosticsSafely(diag)` exported preserves the layered diagnostics API: low-level crash reporter setup, safe crash-diagnostics startup, and now the main-process bootstrap facade.
- The safe-start verifier needed a boundary refresh after this pass: the stronger invariant is no longer that `main.ts` calls `startCrashDiagnosticsSafely(diag)` directly, but that `main.ts` calls `createMainDiagnostics()` and that helper delegates to the safe starter.


## Cleanup Core Runner Findings - 2026-07-08
- `package.json` had become a poor home for `verify:cleanup-core`: the script was a single extremely long `&&` chain with 101 package-script calls, making it hard to read, edit, and verify safely.
- Moving cleanup-core orchestration into `scripts/verify-cleanup-core.ts` improves maintainability without changing verification coverage: the command list is structured data, execution remains ordered, output is inherited, and the runner exits on the first failing child status.
- Focused verifier scripts had accumulated a stale assumption that cleanup-core membership must be proven by substring-searching `package.json`. After the runner extraction, the stronger invariant is that a command exists in `cleanupCoreCommands` inside `scripts/verify-cleanup-core.ts`.
- `scripts/verifyCleanupCore.ts` centralizes this membership assertion so future focused verifiers do not duplicate knowledge of the cleanup-core runner format.
- Windows/Node portability note: in this environment, `spawnSync('npm.cmd', ['run', ...], { shell: false })` returns `EINVAL`, while `spawnSync(process.execPath, [process.env.npm_execpath, 'run', ...], { shell: false })` works. The runner now uses the latter to avoid shell quoting risk and `.cmd` spawn issues.
- The cleanup-core runner now includes `verify:cleanup-core-runner-module` as its first command, so future edits to the runner boundary are checked whenever cleanup-core is run.


## Cleanup Core Runner Export Boundary Findings - 2026-07-08
- After Phase 134, `scripts/verifyCleanupCore.ts` still had a brittle coupling to `scripts/verify-cleanup-core.ts`: it read the runner file and regex-parsed the literal command array.
- Exporting `cleanupCoreCommands` from the runner is a better module boundary because all focused verifiers now consume the same typed runtime value that the runner executes, rather than a second textual interpretation of that value.
- The runner needs an entrypoint guard after becoming importable. Without `fileURLToPath(import.meta.url) === process.argv[1]`, importing `cleanupCoreCommands` from verifier helpers would accidentally execute the full cleanup-core suite.
- `runCleanupCore()` keeps the behaviorful execution path explicit and testable, while `cleanupCoreCommands` remains structured data for membership verifiers.
- The cleanup-core runner now verifies both its executable boundary (`verify:cleanup-core-runner-module`) and its exported/importable boundary (`verify:cleanup-core-runner-exports-module`) at the start of every cleanup-core run.


## Electron AI Review IPC Helpers Findings - 2026-07-08
- `electron/aiReviewIpc.ts` still contained three pure helper islands after the larger AI Review IPC extraction: source-character progress message formatting, selected-week date expansion, and month date expansion.
- This was a safe optimization target because the helpers depend only on `shiftDateKey` and `monthRange`; they do not touch Electron IPC, settings mutation, LLM calls, Obsidian file writes, or diagnostics.
- `electron/aiReviewIpcHelpers.ts` is the right home for this slice because it groups exact helper responsibilities used by weekly/monthly/external report handlers:
  1. preserve the `?? N ??` progress message text
  2. preserve Monday-based weekly date expansion
  3. preserve month first/last/date-list expansion through shared monthly/date helpers
- The focused verifier includes both structural assertions and value-level checks for representative source-character, week, and February date outputs, giving this small extraction more than just regex coverage.
- The verifier import needed one calibration: because the helper module intentionally does not exist during RED, runtime value assertions must dynamically import it only after the file-existence assertion passes.


## Electron AI Review IPC Messages Findings - 2026-07-08
- After Phase 136, `electron/aiReviewIpc.ts` still owned a cluster of pure string constants for progress stage labels, source-read/wait/received/write messages, user-facing AI Review errors, and template picker labels.
- This was a safe optimization target because these constants are data-only. Moving them does not alter IPC registration, AI account resolution, LLM invocation, Obsidian writes, diagnostics, or date/source collection.
- `electron/aiReviewIpcMessages.ts` is the right home for this slice because it keeps localized AI Review IPC text in one small module while leaving behaviorful handlers in `aiReviewIpc.ts`.
- The focused verifier checks both module boundaries and exact runtime values for all 17 constants, which helps protect against accidental text drift during future IPC refactors.
- The verifier should not require a specific import ordering. The durable invariant is that `aiReviewIpc.ts` imports every expected constant from `./aiReviewIpcMessages` and no longer defines them inline.


## Electron AI Review IPC Month Range Reuse Findings - 2026-07-08
- After extracting `getMonthDates(month)` in Phase 136, `electron/aiReviewIpc.ts` still used `monthRange(month)` directly for personal monthly report statistics while external monthly generation used the new helper.
- This was a small consistency smell: the month-range/date-list expansion boundary was split between the IPC module and the helper module.
- Reusing `getMonthDates(month)` for the personal monthly `first` / `last` range keeps direct `monthRange` knowledge in `electron/aiReviewIpcHelpers.ts`, making future month-date behavior changes easier to audit in one place.
- The change is behavior-preserving because `getMonthDates(month)` internally calls `monthRange(month)` and returns the same `first` and `last` values plus the already-needed date list.


## Electron AI Review Template Tools IPC Findings - 2026-07-08
- After Phase 138, `electron/aiReviewIpc.ts` still mixed report generation/source testing IPC with four lower-coupling template/tool handlers: template recognition, report-template recognition, model listing, and template-file picking.
- This was a good next extraction because those handlers share a coherent dependency set (`getAiReviewSettings`, `getReviewSections`, `getLlmCaller`, `getVaultPath`, `extractDocxText`, `zh`, and `win`) and do not depend on report-generation source collection or Obsidian report writes.
- `electron/aiReviewTemplateToolsIpc.ts` is the right boundary because it owns user-assisted AI Review tooling rather than scheduled/personal/external report generation:
  1. recognize daily review templates into section config
  2. recognize report template prompts for personal/external weekly/monthly reports
  3. list provider models from a temporary config
  4. pick and parse `.md`, `.txt`, and `.docx` template files
- The parent `electron/aiReviewIpc.ts` remains the AI Review IPC aggregation point, but it now delegates the template/tool sub-domain rather than importing recognition, model-listing, dialog, path, and template-file parser dependencies directly.
- This extraction exposed two stale verifier assumptions. `verify-electron-ai-review-ipc-module` now follows the parent/child registration boundary, and `verify-electron-ai-review-ipc-messages-module` now checks message constants across both AI Review IPC consumers.


## Electron AI Review Source Materials IPC Findings - 2026-07-08
- After Phase 139, `electron/aiReviewIpc.ts` still owned `aiReview:testSourceMaterials`, a read-only inspection handler used to list source files for weekly/monthly AI Review generation.
- This was a safe extraction because the handler does not call LLMs and does not write reports; it only checks vault status, normalizes the date, derives weekly/monthly source candidates, and maps them to `{ label, filePath }`.
- `electron/aiReviewSourceMaterialsIpc.ts` is the right home because it groups source-material inspection separately from report generation and template/tool IPC:
  1. weekly source-file candidate collection from daily source rules
  2. monthly source-file candidate collection from weekly reports and daily rules
  3. shared vault-status failure response shape
  4. source-list response mapping for the renderer diagnostic UI
- The parent `electron/aiReviewIpc.ts` still imports `collectDailySourcesForDates` and `collectMonthlySources` for actual weekly/monthly/external report generation; only the diagnostic/test source-material handler moved.


## Electron AI Review Backfill IPC Findings - 2026-07-08
- After Phase 140, `electron/aiReviewIpc.ts` still owned the `aiReview:backfill` handler, including business-date calculation, backfill-day range derivation, file-existence checks, and the call into `backfillReviews(...)`.
- This was a safe extraction because it is a coherent daily-review backfill concern and does not overlap with weekly/monthly/external report writing. It still needs LLM access, but the behavior boundary is simpler than report generation.
- `electron/aiReviewBackfillIpc.ts` is the right home because it groups exactly the backfill orchestration dependencies:
  1. app rollover time for business-date calculation
  2. AI Review settings and active profile guard
  3. daily note file path resolution and file existence checks
  4. review sections and AI-generated custom blocks
  5. the shared `backfillReviews(...)` runner
- The parent `electron/aiReviewIpc.ts` now focuses more clearly on AI Review settings, daily inspect/run forwarding, and the heavier report generation handlers, while delegating auxiliary backfill/source-material/template-tool IPC domains.


## Electron AI Review External Report IPC Findings - 2026-07-08
- After Phase 141, `electron/aiReviewIpc.ts` still owned `aiReview:generateExternal`, a coherent external weekly/monthly report-generation handler with source collection, anonymized/redacted report writing, prompt fallback, and output-directory routing.
- This was a safe extraction because external reports do not share the personal weekly/monthly progress diagnostics path. The handler needs AI Review settings, vault status, date normalization, source rules, and an LLM caller, but it can be delegated without changing personal report generation.
- `electron/aiReviewExternalReportIpc.ts` is the right home because it groups exactly the external-report orchestration concerns:
  1. enabled/API-key and vault guards for external report generation
  2. weekly `isoWeekKey` / `getWeekDates` period derivation and daily source collection
  3. monthly `monthKey` / `getMonthDates` derivation and monthly source collection
  4. external weekly/monthly output directory and prompt fallback selection
  5. redacted-content message construction and `generateExternalReport(...)` invocation
- This split exposed three stale verifier assumptions rather than product bugs:
  1. `verify-electron-ai-review-ipc-module` still treated external report generation as parent-owned.
  2. `verify-electron-ai-review-ipc-messages-module` did not include `aiReviewExternalReportIpc.ts` as a message-constant consumer for `AI_REVIEW_DISABLED_ERROR`.
  3. `verify-electron-ai-review-ipc-month-range-reuse` still expected external monthly `getMonthDates(month)` and `buildMonthlyMessages` usage to remain in `aiReviewIpc.ts`.
- The stronger invariant after this pass is that `electron/aiReviewIpc.ts` remains the AI Review IPC aggregator and owns personal weekly/monthly generation, while backfill, source-material testing, template/tools, and external report generation each have focused child modules.


## Electron AI Review Weekly Report IPC Findings - 2026-07-08
- After Phase 142, `electron/aiReviewIpc.ts` still owned `aiReview:generateWeekly`, including weekly source collection, progress events, account/vault/no-source diagnostics, stats derivation, and personal weekly report writing.
- This was a safe extraction because weekly report generation is a coherent personal-report path and is smaller than monthly generation after external reports moved out. It shares diagnostic/progress helper contracts with monthly, but can receive those helpers through explicit dependency injection.
- `electron/aiReviewWeeklyReportIpc.ts` is the right home because it groups exactly the personal weekly report orchestration concerns:
  1. weekly report account resolution and account-unavailable diagnostics
  2. vault guard and write-failed diagnostics
  3. selected-date normalization and Monday-based week expansion
  4. weekly source material collection and source-character progress messages
  5. weekly stats/range calculation and `generatePersonalWeekly(...)` invocation
  6. request/write progress events and provider/write/truncated diagnostic statuses
- This split exposed two stale verifier assumptions rather than product bugs:
  1. `verify-electron-ai-review-ipc-helpers-module` assumed the parent IPC module would remain the only consumer of all helper imports.
  2. `verify-electron-ai-review-ipc-messages-module` did not include `aiReviewWeeklyReportIpc.ts` as a message-constant consumer for weekly progress messages.
- The stronger invariant after this pass is that `electron/aiReviewIpc.ts` is now mostly an aggregator plus the remaining monthly report handler; backfill, weekly reports, external reports, source-material testing, and template/tools each have focused child modules.


## Electron AI Review Monthly Report IPC Findings - 2026-07-08
- After Phase 143, `electron/aiReviewIpc.ts` still owned `aiReview:generateMonthly`, including monthly source collection, progress events, account/vault/no-source diagnostics, stats derivation, and personal monthly report writing.
- This was a safe extraction because monthly report generation is a coherent personal-report path and mirrors the newly extracted weekly-report boundary. It shares diagnostic/progress helper contracts with weekly, but can receive those helpers through explicit dependency injection.
- `electron/aiReviewMonthlyReportIpc.ts` is the right home because it groups exactly the personal monthly report orchestration concerns:
  1. monthly report account resolution and account-unavailable diagnostics
  2. vault guard and write-failed diagnostics
  3. selected-date normalization, month-key derivation, and month range expansion through `getMonthDates(month)`
  4. monthly source material collection from weekly reports and daily rules
  5. source-character progress messages and no-source-materials diagnostics
  6. monthly stats/range calculation and `generatePersonalMonthly(...)` invocation
  7. request/write progress events and provider/write/truncated diagnostic statuses
- This split exposed stale verifier assumptions rather than product bugs:
  1. `verify-electron-ai-review-ipc-module` still treated monthly report generation as parent-owned.
  2. `verify-electron-ai-review-ipc-messages-module` assumed the parent IPC module remained a message-constant consumer.
  3. `verify-electron-ai-review-ipc-month-range-reuse` expected personal monthly `getMonthDates(month)` usage to remain in `aiReviewIpc.ts`.
- The stronger invariant after this pass is that `electron/aiReviewIpc.ts` is an AI Review IPC aggregator plus settings/sections/daily runner/inspection handlers, while backfill, weekly reports, monthly reports, external reports, source-material testing, and template/tools each have focused child modules.


## Electron AI Review Settings/Sections IPC Findings - 2026-07-08
- After Phase 144, `electron/aiReviewIpc.ts` still owned four low-coupling configuration handlers: `aiReview:getSettings`, `aiReview:setSettings`, `aiReview:getSections`, and `aiReview:setSections`.
- This was a safe extraction because these handlers only read/write AI Review settings and review-section configuration. They do not call LLMs, inspect Obsidian files, write reports, collect sources, or create diagnostics.
- `electron/aiReviewSettingsSectionsIpc.ts` is the right home because it groups exactly the configuration IPC responsibilities:
  1. return current AI Review settings
  2. normalize/persist AI Review settings updates
  3. reschedule AI timers after settings updates
  4. return current review-section configuration
  5. normalize/persist review-section updates
- This split exposed one stale verifier assumption rather than a product bug: `verify-electron-ai-review-ipc-module` still treated settings/sections channel registrations as parent-owned.
- The new focused verifier also needed one calibration: it should forbid an inline `scheduleAiTimers();` call in the parent, but still allow passing the `scheduleAiTimers` dependency to the extracted module.
- The stronger invariant after this pass is that `electron/aiReviewIpc.ts` now only directly owns the daily run/inspect handlers and delegates settings/sections, backfill, weekly reports, monthly reports, external reports, source-material testing, and template/tools to focused child modules.

## Electron AI Review Daily Run/Inspect IPC Findings - 2026-07-08
- After Phase 145, `electron/aiReviewIpc.ts` only directly owned two daily handlers: `aiReview:runForDate` and `aiReview:inspectDaily`.
- This was a safe extraction because both handlers are thin forwarders. They do not call LLMs directly, collect source materials, write reports, mutate settings, or construct diagnostics.
- `electron/aiReviewDailyRunInspectIpc.ts` is the right home because it groups exactly the daily runner/inspection IPC responsibilities:
  1. normalize the requested date with `getDateKey(date)`
  2. pass tasks through to the daily review runner
  3. preserve `Boolean(force)` coercion for forced daily reruns
  4. normalize the requested date for daily AI-content inspection
- After this split, `electron/aiReviewIpc.ts` no longer imports `ipcMain`; it is now an AI Review IPC aggregator that wires focused child modules through explicit dependency injection.
- The focused verifier protects both ownership and behavior-level forwarding expressions, while the aggregate AI Review IPC verifier now treats daily run/inspect as child-owned channels.

## Electron AI Review Report IPC Shared Types Findings - 2026-07-08
- After extracting weekly/monthly report IPC handlers, the parent aggregator and both personal report modules each carried local copies of very similar report IPC contracts: LLM availability result shape, progress emitter signature, stage factory signature, and diagnostic factory signature.
- This was a safe optimization target because the duplicated code was type-only. Consolidating it does not alter IPC registration, account resolution, source collection, LLM invocation, progress events, diagnostics, or Obsidian writes.
- `electron/aiReviewReportIpcTypes.ts` is the right boundary because these contracts are shared by multiple AI Review report IPC modules but are not general Electron shared types. Keeping them near AI Review IPC avoids polluting `electron/sharedTypes.ts` with report-specific concerns.
- The weekly/monthly modules still narrow the generic progress/diagnostic contracts to `'weekly'` and `'monthly'`, so TypeScript preserves report-kind specificity while removing duplicated structural declarations.

## Electron AI Review IPC Registration Types Findings - 2026-07-08
- After Phase 147, `electron/aiReviewIpc.ts` had become behaviorally thin but still carried a large registration dependency type plus many imports that were used only by that type.
- This was a safe optimization target because the registration contract is type-only. Moving it does not alter child IPC registration order, dependency values, handler behavior, or runtime imports.
- `electron/aiReviewIpcRegistrationTypes.ts` is the right boundary because it describes the dependency surface between `mainWindowBootstrap` and the AI Review IPC aggregator, while `electron/aiReviewIpc.ts` now reads as the actual composition shell.
- This split exposed stale verifier assumptions rather than product failures:
  1. Shared Electron type usage for AI Review registration now belongs to `aiReviewIpcRegistrationTypes.ts`, not the parent aggregator.
  2. Shared report IPC type usage for the parent registration contract now belongs to `aiReviewIpcRegistrationTypes.ts`; weekly/monthly report handler modules still import report IPC types directly.
- The resulting parent AI Review IPC module has no registration-only shared/domain imports, which makes future behaviorful changes easier to audit because imports now mostly map to actual child module wiring.

## Electron AI Review Report IPC Diagnostics Findings - 2026-07-08
- Weekly and monthly personal report IPC handlers carried identical diagnostic final-status logic after report writing: successful writes become `completed`, truncated successful writes become `completedWithWarning`, provider failures become `providerFailed`, and remaining failures become `writeFailed`.
- Both handlers also duplicated the same LLM-result normalization for diagnostics: include `[llmResult]` when present, otherwise `[]`.
- This was a safe optimization target because the logic is pure and independent of IPC registration, source collection, report writing, progress emission, and diagnostic factory construction.
- `electron/aiReviewReportIpcDiagnostics.ts` is the right home because these helpers are AI Review report IPC-specific: they translate report writer / LLM results into the diagnostic vocabulary used by weekly/monthly report IPC handlers.
- The focused verifier includes runtime value checks for all final-status branches and LLM-result array normalization, making the extraction stronger than a text-only boundary check.

## Electron AI Review Report IPC Source Summary Findings - 2026-07-08
- Weekly and monthly personal report IPC handlers both counted source characters with the same inline `reduce((sum, source) => sum + source.content.length, 0)` expression before building progress messages and diagnostics.
- This was a safe optimization target because it is pure data summarization over already-collected source content. Moving it does not alter source collection, no-source-material checks, progress labels, diagnostics, LLM calls, or report writes.
- `electron/aiReviewReportIpcSourceSummary.ts` keeps the minimal source-content shape local to AI Review report IPC and preserves JavaScript `.length` semantics, including empty-source and non-ASCII text behavior.
- The focused verifier includes runtime value checks for empty lists and mixed ASCII/Chinese content, so future changes to counting semantics will be caught explicitly.

## Electron AI Review Report IPC LLM Progress Findings - 2026-07-08
- Weekly and monthly personal report IPC handlers both wrapped the provider call in the same request-AI progress sequence: emit a running state before the call, then emit completed/failed with either a received-message string or the provider error.
- This was a safe optimization target because the logic is independent of source collection, stats, report writing, and final diagnostic construction. It only translates `LlmResult` into the request-AI progress event stream.
- `electron/aiReviewReportIpcLlmProgress.ts` is the right home because it captures one report-IPC-specific concern: how weekly/monthly report handlers talk to the provider while updating the request-AI progress stage.
- The focused verifier includes runtime value checks for both successful and failed provider calls, ensuring the helper preserves event ordering, status mapping, and message selection instead of only preserving imports/text shape.

## Electron AI Review Report IPC Failure Helper Findings - 2026-07-08
- Weekly and monthly personal report IPC handlers still duplicated the same early failure return shape after the diagnostics/source-summary/LLM-progress extractions:
  1. account-unavailable
  2. vault/write-failed
  3. no-source-materials
- The common duplication was no longer the progress emission itself, but the repeated `createDiagnostic(...)` + `{ ok: false, error, diagnostic }` result assembly.
- This was a safe optimization target because it is pure failure-result construction. Moving it does not alter source collection, progress stage selection, report writing, or final success diagnostics.
- `electron/aiReviewReportIpcFailure.ts` is the right boundary because it captures one narrow report-IPC concern: converting known early-failure inputs into the standardized failed return object used by weekly/monthly personal report handlers.
- The helper intentionally defaults `stages` to `[]`, which preserves the existing vault-failure diagnostic shape without forcing weekly/monthly callers to keep an explicit empty array.
- The focused verifier includes runtime checks for both explicit-stage/source-char passthrough and the default-empty-stages behavior, so future refactors cannot silently drift the failure result shape.

## Electron AI Review Report IPC Prepare Progress Helper Findings - 2026-07-08
- After extracting source summary, failure, LLM progress, and completion helpers, weekly/monthly personal report IPC handlers still duplicated one small prepare-materials completion block:
  1. `buildSourceCharsMessage(sourceChars)`
  2. create completed `prepareMaterials` stage with duration
  3. emit completed prepare-materials progress with the same message
- This was a safe optimization target because it is pure stage/progress assembly over already-derived `sourceChars`. Moving it does not alter source collection, no-source-material guards, LLM calls, failure returns, report writes, or final diagnostics.
- `electron/aiReviewReportIpcPrepareProgress.ts` is the right boundary because it captures one narrow report-IPC concern: turning source-character totals into the standardized completed prepare-materials stage/progress pair used by weekly/monthly personal report handlers.
- This extraction also changed the most appropriate owner of `buildSourceCharsMessage(...)`: weekly/monthly modules no longer need to import it directly, while `aiReviewReportIpcPrepareProgress.ts` becomes the direct consumer. That made `verify-electron-ai-review-ipc-helpers-module.ts` stale and required boundary calibration rather than behavior changes.
- The focused verifier freezes the exact timing and payload contract by checking:
  - `Date.now() - prepareStartedAt` duration math
  - returned `sourceCharsMessage`
  - returned completed stage array
  - emitted completed prepare-materials progress event

## Electron AI Review Report IPC Preflight Helper Findings - 2026-07-08
- After extracting failure, prepare-progress, LLM-progress, and completion helpers, weekly/monthly personal report IPC handlers still duplicated one clear preflight block before source collection:
  1. `startedAt = Date.now()`
  2. prepare-materials running progress
  3. `ensureReportLlmAvailable(...)`
  4. account-unavailable failed request-AI progress/result
  5. `getVaultStatus()`
  6. vault/write-failed failed write-Obsidian progress/result
- This was a safe optimization target because it happens before report-specific date expansion, source collection, stats derivation, and provider/report writing. Moving it does not alter weekly/monthly period logic or no-source-material handling.
- `electron/aiReviewReportIpcPreflight.ts` is the right boundary because it captures one narrow report-IPC concern: standardizing the shared personal-report preflight contract into either:
  - a successful `{ startedAt, settings, llm, vaultPath }` bundle
  - or a behavior-preserving failed `{ ok: false, result }` early return
- This extraction also shifted ownership of two `createReportFailureResult(...)` call sites:
  - account-unavailable
  - write-failed / vault unavailable
  Weekly/monthly now retain only the no-source-materials failure branch inline, which required verifier calibration rather than behavior changes.
- The focused verifier includes runtime checks for all three preflight outcomes:
  - success path emits running prepare-materials progress and returns the successful bundle
  - account-unavailable emits failed request-AI progress and preserves the failed request-AI stage diagnostic
  - vault failure emits failed write-Obsidian progress and preserves the empty-stage write-failed diagnostic shape

## Electron AI Review Report IPC No-Source Failure Helper Findings - 2026-07-08
- After preflight extraction, weekly/monthly personal report IPC handlers still duplicated the same no-source-materials failure tail after source collection:
  1. failed prepare-materials progress emission
  2. `noSourceMaterials` diagnostic status
  3. standardized `{ ok: false, error, diagnostic }` failed return
- This was a safe optimization target because it happens after range-specific source collection but before any provider call or report write. Moving it does not alter weekly/monthly date expansion, stats, or output paths.
- `electron/aiReviewReportIpcNoSourceFailure.ts` is the right boundary because it captures one narrow report-IPC concern: converting “sources prepared but empty/blank” into the standardized failed progress/result contract.

## Electron AI Review Report IPC Execution Helper Findings - 2026-07-08
- After no-source/preflight extraction, weekly/monthly personal report IPC handlers still duplicated the same execution tail:
  1. delayed `llmResult` capture
  2. request-AI progress-wrapped provider call
  3. final report-result completion/diagnostic assembly
- This was a safe optimization target because the logic is shared after sources/stats are ready and before returning the final IPC result. Moving it does not alter weekly/monthly date ranges, source collection, or report-writer-specific parameters.
- `electron/aiReviewReportIpcExecution.ts` is the right boundary because it groups exactly the common execution contract between weekly/monthly report handlers: provider invocation + finalize tail.
- This extraction also exposed a stale diagnostics verifier assumption: diagnostics helper ownership still lives under the completion helper, but the direct caller is now `aiReviewReportIpcExecution.ts` rather than weekly/monthly modules.

## Electron AI Review Report IPC Source Preparation Helper Findings - 2026-07-08
- After execution extraction, weekly/monthly personal report IPC handlers still duplicated one medium-sized “sources already collected” block:
  1. `sumReportSourceChars(...)`
  2. completed prepare-materials progress/stage creation
  3. no-source-materials failure return path
- This was a safe optimization target because it is range-agnostic: weekly/monthly still keep their own source collection logic, but once the source array exists the follow-up flow is identical.
- `electron/aiReviewReportIpcSourcePreparation.ts` is the right boundary because it groups the shared post-collection source orchestration without absorbing range-specific concerns like `getWeekDates(...)`, `getMonthDates(...)`, `collectDailySourcesForDates(...)`, or `collectMonthlySources(...)`.
- After this pass, weekly/monthly report IPC modules are mostly reduced to:
  1. preflight
  2. range/date derivation
  3. source collection
  4. stats calculation
  5. report-writer callback wiring
- Current line counts after this pass:
  - `electron/aiReviewWeeklyReportIpc.ts`: 121
  - `electron/aiReviewMonthlyReportIpc.ts`: 120
  - `electron/aiReviewReportIpcSourcePreparation.ts`: 65
- The next natural low-risk target is the remaining range-specific source-collection orchestration, because that is now the largest duplicated block still left between weekly/monthly handlers.


## Electron AI Review Report IPC Source Collection Orchestration Findings - 2026-07-08
- After Phase 157, weekly/monthly personal report IPC handlers still duplicated the remaining range-specific source-collection setup between preflight success and shared source preparation.
- This was a safe optimization target because the shared opportunity was orchestration shape rather than business-rule identity: weekly and monthly still need different range derivation and collectors, but both follow the same prepare/collect/map flow.
- `electron/aiReviewReportIpcSourceCollection.ts` is the right boundary because it now owns one narrow concern: the range-specific source-collection orchestration that happens before `prepareReportSources(...)`.
- The module keeps the abstraction honest by splitting ownership into:
  1. a tiny shared `collectPreparedReportSources(...)` skeleton
  2. `collectWeeklyReportSources(...)` for weekly selected-date normalization, week-date expansion, `manual-files` short-circuiting, daily-source collection, and `{ date, content }` mapping
  3. `collectMonthlyReportSources(...)` for month-key derivation, month-range expansion, monthly-source collection, and `{ label, content }` mapping
- This pass preserved the stronger boundary introduced in Phase 157:
  - `aiReviewReportIpcPreflight.ts` owns preflight
  - `aiReviewReportIpcSourceCollection.ts` owns range-specific collection setup
  - `aiReviewReportIpcSourcePreparation.ts` owns post-collection summarization/progress/no-source handling
  - weekly/monthly IPC modules now mostly read as preflight -> collect -> prepare -> stats -> execute
- This extraction exposed one stale verifier assumption rather than a product bug: `verify-electron-ai-review-ipc-month-range-reuse.ts` still assumed personal monthly `monthKey/getMonthDates(...)` ownership remained in `electron/aiReviewMonthlyReportIpc.ts`; the correct owner is now `electron/aiReviewReportIpcSourceCollection.ts`.
- Current line counts after this pass:
  - `electron/aiReviewWeeklyReportIpc.ts`: 116
  - `electron/aiReviewMonthlyReportIpc.ts`: 116
  - `electron/aiReviewReportIpcSourceCollection.ts`: 118

## AI Review Export Reports Shared LLM-Backed Helper Findings - 2026-07-08
- `electron/aiReview/exportReports.ts` still had one clean, low-risk duplication seam even after the IPC cleanup work: weekly, monthly, and external export paths each repeated the same LLM-call -> error-return -> write-report flow.
- This was a good fast-batch target because the logic is file-local, already covered by `verify:export-reports`, and does not require touching the broader AI Review IPC verifier graph.
- `generateLlmBackedReport(...)` is the right boundary because it captures one narrow concern: turn a message builder + LLM caller + output target into the existing `ReportResult` contract.
- Once that helper existed, file-path and frontmatter creation also became obvious shared seams, so `resolveReportFilePath(...)`, `buildPersonalReportFrontmatter(...)`, and `buildExternalReportFrontmatter(...)` further reduced duplication without widening the behavior surface.
- This fast path improved speed because it delivered multiple code-shape simplifications in one file while only needing focused verification plus TypeScript/build, instead of triggering a large cascade of IPC verifier recalibration.

## App Settings Legacy Path Migration Helper Cleanup Findings - 2026-07-08
- `shared/appSettings.ts` had a good fast-batch seam because path normalization for Obsidian settings was still file-local, already covered by `verify:settings-sync`, and independent of the heavier renderer/Electron verifier graph.
- Focused RED exposed a real legacy migration bug rather than just duplication: `migrateReportDir(...)` always appended the weekly filename template, so `monthlyDir` and `externalMonthlyDir` silently normalized to `{{year}}-W{{week}}.md` instead of `{{year}}-{{month}}.md`.
- `readStringSetting(...)`, `resolveStoredPath(...)`, and `resolveStoredReportPath(...)` are the right-sized helpers here because they reduce repeated string-key fallback patterns without widening the module surface or changing ownership of template normalization.
- This was a strong “speed mode” target because one focused verifier caught both:
  1. a genuine legacy monthly-path bug
  2. a small path-resolution cleanup seam
  while still only requiring `verify:settings-sync`, `typecheck`, and `build`.

## AI Review Section Config Custom-Block Fallback Cleanup Findings - 2026-07-08
- `shared/aiReview/sectionConfig.ts` had another strong fast-batch seam because daily-template and report-template normalization both performed the same `customBlocks` list fallback work, and `verify:section-config` already exercised the surrounding behavior.
- Focused RED exposed a real normalization bug rather than just repetition: `normalizeCustomBlock(...)` always used the first default custom block as fallback, so if the second or later custom block was missing fields like `name`, it silently inherited the wrong default section identity.
- `normalizeTemplateCustomBlocks(...)` is the right-sized helper because it centralizes the repeated “if array present map blocks else use defaults” flow while preserving per-index fallback ownership in the caller.
- Passing an explicit fallback block into `normalizeCustomBlock(...)` keeps the helper narrower and more correct than letting it reach back into a whole defaults object, and it avoids changing the UUID/render-type normalization semantics.

## AI Review Settings Empty/Malformed Profiles Consistency Findings - 2026-07-08
- `shared/aiReview/aiReviewSettings.ts` contained a narrow but important migration discriminator bug: the code needed to distinguish real stored profile arrays from both missing `profiles` and malformed non-array `profiles`.
- The correct normalization rule is:
  1. `profiles` is an array → treat as new-format data, including explicit `[]`
  2. `profiles` is missing or malformed → treat as legacy single-account data and migrate top-level credentials
- This was a good fast-batch target because `verify:ai-settings` already covered the migration surface, so the fix stayed fully inside one normalization branch with focused verification.

## Obsidian Retained Review Archived-Only Merge Findings - 2026-07-08
- `shared/obsidianReviewRetention.ts` had a real archived-only merge bug that only appears when multiple retained reviews restore the same deleted task id while that task is absent from the live task tree.
- The root cause was that `mergeRetainedReviewsForObsidian(...)` only looked up a merge base in `nextTasks`; it ignored the same-id task already accumulated earlier in the current pass inside `archivedOnly`.
- Reusing `archivedOnly.get(archivedTask.id)` as a second merge base is the right-sized fix because it preserves all live-task behavior while closing the archived-only accumulation gap.

## Obsidian Template Absolute Windows Path Rejection Findings - 2026-07-08
- `shared/obsidianTemplates.ts` had a real path-normalization bug in `resolveTemplatePath(...)`: it sanitized invalid filename characters before checking whether the rendered template path was absolute.
- On Windows, that meant `C:/...` lost its colon first and turned into `C-/...`, which bypassed `path.isAbsolute(...)` and got silently rewritten into a misleading relative path under the vault.
- Checking the raw rendered path for absoluteness before sanitization is the right boundary fix because it restores the intended safety invariant without changing the later relative-path sanitization or vault-escape checks.

## Task Rollover Latest Review Ordering Findings - 2026-07-08
- `shared/taskRollover.ts` had a real chronology bug in `getLatestCompletionPercent(...)`: it treated the last `completionReviews` array element as latest instead of the review with the greatest `reviewedAt`.
- That made `shouldCarryTaskForward(...)` sensitive to array ordering rather than actual review recency, which can incorrectly carry forward tasks that were fully completed in a newer review.
- Selecting the latest review by `reviewedAt` is the right-sized fix because it preserves all existing single-review and `completionReview` fallback behavior while removing the implicit ordering assumption from persisted arrays.

## AI Review Section Config Blank Id Findings - 2026-07-08
- `shared/aiReview/sectionConfig.ts` had one more real normalization gap after the earlier fallback fixes: custom-block ids were only checked for string type, not for blank-string validity.
- That meant whitespace-only or empty ids could survive normalization and leak into downstream block-order / marker logic as unstable identifiers.
- Treating blank ids the same way as missing ids—generate a replacement UUID—is the right-sized fix because it preserves explicit ids while aligning invalid blank ids with the existing missing-id behavior.

## Task Review Mutations Legacy Empty-Array Fallback Findings - 2026-07-08
- `src/hooks/taskReviewMutations.ts` had an internal consistency bug around task review lookup fallback: some paths treated `completionReviews: []` as authoritative, while other parts of the codebase already treat only non-empty review arrays as authoritative.
- The affected paths were:
  1. `appendCompletionReviewToTask(...)`
  2. `deleteReviewFromTask(...)`
  3. `findTaskReview(...)`
- The working reference already existed nearby:
  - `updateTaskReview(...)`
  - `normalizeTask(...)`
  - `getCompletionReviews(...)`
  all use length-based fallback semantics rather than raw truthiness.
- This bug only appears on mixed legacy/new-format task data where:
  - `completionReview` still holds a real legacy record
  - `completionReviews` exists but is `[]`
- In that state, append would drop the legacy review, while find/delete would behave as if no review existed at all.
- Centralizing the lookup into `getExistingTaskReviews(...)` is the right-sized fix because it unifies append/find/delete/update behavior without changing the non-empty-array happy path.

## Task Normalization Latest Review Ordering Findings - 2026-07-08
- `src/hooks/taskTransforms.ts` had the same chronology assumption already fixed earlier in `shared/taskRollover.ts`: it treated the last `completionReviews` array element as the canonical `completionReview`.
- This bug matters because `normalizeTask(...)` is the entry point that hydrates incoming persisted tasks for:
  - `normalizeIncomingTasks(...)`
  - carryover flows
  - any downstream UI logic that reads the single `completionReview`
- When persisted arrays are out of order, task hydration can silently expose an older review as the current canonical review even though the full array is present.
- The right-sized fix is to keep the array untouched but derive the single `completionReview` by maximum `reviewedAt`, matching the chronology rule already established elsewhere.

## Task Review Mutations Latest Review Ordering Findings - 2026-07-08
- After fixing legacy empty-array fallback, `src/hooks/taskReviewMutations.ts` still had one more ordering bug: post-mutation `completionReview` selection used remaining array position instead of chronological recency.
- The affected paths were:
  1. `updateTaskReview(...)`
  2. `deleteReviewFromTask(...)`
- This only shows up when `completionReviews` is stored out of order and the user edits or deletes a non-latest older review.
- In that state, the mutation keeps the array content correct but can still repoint `completionReview` at a merely last-position review instead of the newest-by-`reviewedAt` review.
- Reusing a small `getLatestTaskReview(...)` helper is the right fix because it changes only the canonical-single-review projection and leaves stored array order plus legacy fallback behavior untouched.

## Shared Completion Review Ordering Findings - 2026-07-08
- `shared/completionReviews.ts` was still only a fallback-normalization helper, not a chronology-normalization helper.
- That meant any caller that relied on it directly inherited the persisted array order, which is unsafe because multiple earlier fixes already proved `completionReviews` can legitimately be stored out of chronological order.
- Two relevant downstream consumers showed why this matters:
  1. `shared/obsidianTemplates.ts` uses `getCompletionReviews(task)` to render numbered completion-record blocks, so out-of-order arrays produce unstable stage numbering in exported/synced markdown.
  2. `src/components/TaskReviewDialog.tsx` had its own inline fallback logic and also rendered reviews in raw stored order.
- A good in-repo reference already existed: `ReviewView.tsx` does not trust array position for recency and explicitly sorts by timestamp before rendering grouped review history.
- The right-sized fix here is to make `getCompletionReviews(...)` return a sorted copy by ascending `reviewedAt` while preserving fallback semantics and not mutating task state.
- Once that helper becomes chronology-safe, UI/export callers that just need “the review list in stable time order” can reuse it instead of each carrying their own fallback logic.

## Obsidian Sync Preview Cross-Date Review Counting Findings - 2026-07-08
- `shared/obsidianTemplates.ts` had a real semantics split between preview and rendering:
  - `buildTaskLines(...)` already included a task in the selected daily note when one of its completion reviews happened on that date
  - `buildSyncPreview(...).taskCount` only counted flattened tasks whose `taskDate === selectedDate`
- That produced a concrete mismatch: preview could claim “0 tasks” while the generated daily note would actually render one or more review-only carryover tasks from earlier dates.
- The bug is especially visible for tasks completed or reviewed later than their original task date, which is a legitimate data shape in this codebase.
- The right-sized fix is not to special-case preview, but to centralize the inclusion rule into one `taskAppliesToDate(task, date)` helper and reuse it from both preview and real note rendering.
- This keeps the future invariant simple: if a task would appear in the note, preview taskCount must count it too.

## Obsidian Sync Preview Visible Completion Record Counting Findings - 2026-07-08
- `shared/obsidianTemplates.ts` still had one more preview-vs-render mismatch after Phase 173:
  - `buildTaskLines(...)` only renders completion reviews that are visible for the selected date
  - `buildSyncPreview(...).completionRecordCount` counted every completion review in the flattened task tree, even when none of them would render into that day's note
- A concrete repro is a completed task dated `2026-05-26` with a review also on `2026-05-26` while previewing `2026-05-27`:
  - preview reported `completionRecordCount: 1`
  - actual daily-note rendering showed no task and no review
- The root cause was that review visibility rules were duplicated:
  - renderer had inline date-aware selection
  - preview count helper ignored date entirely
- The right-sized fix is to centralize per-date review visibility into a shared `getVisibleCompletionReviews(task, date)` helper and reuse it for both rendering and preview counting.
- This keeps the invariant simple: preview `completionRecordCount` should equal the number of completion-record blocks the selected daily note would actually render.

## Obsidian Sync Preview Visible Deleted Review Detection Findings - 2026-07-08
- `shared/obsidianTemplates.ts` had the same visibility drift one layer deeper in preview diagnostics:
  - `buildSyncPreview(...).deletedReviewWillDisappear` compared before/after review identities across the whole task tree
  - but the selected daily note only cares about reviews visible on that specific date
- A concrete repro is deleting a review from a task dated `2026-05-26` while previewing `2026-05-27`:
  - preview reported `deletedReviewWillDisappear: true`
  - actual before/after daily-note rendering for `2026-05-27` showed no review content either way
- The root cause was that `reviewKeys(...)` never adopted the visibility rules already required by rendering and completion-record counting.
- The right-sized fix is to make review-key collection date-aware and reuse `getVisibleCompletionReviews(task, date)` so all preview review diagnostics are based on the same visible-review set the note renderer uses.
- This keeps the invariant simple: `deletedReviewWillDisappear` should only flip when a review that would actually appear in the selected daily note is removed.

## Obsidian Sync Cross-Date Deleted Review Affected-Date Findings - 2026-07-08
- There was a deeper Electron-side sync bug behind the preview inconsistencies:
  - a task dated on an older day can still write a selected-date completion review into **both** the selected note and the original task-date note
  - but when that selected-date review is deleted later, the old task-date note must still be resynced to remove the stale review content
- `electron/obsidianSync.ts` originally derived affected dates from the **post-change task tree only**. That works for additions/updates, but it fails for deletions that remove the only selected-date linkage.
- Concrete repro:
  1. sync a task dated `2026-05-26` with a completion review on `2026-05-27`
  2. the review appears in both `2026-05-27.md` and `2026-05-26.md`
  3. delete the review and sync again for `2026-05-27`
  4. `2026-05-26.md` is not rewritten, so stale deleted review text remains there
- The same root cause also made preview under-report files:
  - preview only showed the selected daily note file
  - actual correct sync needs to touch the older original task-date note too
- The right-sized fix is to propagate optional `beforeTasks` through the real sync call chain and compute affected dates from the union of:
  - the last successfully synced Obsidian task tree
  - the new task tree being synced now
- This keeps the invariant simple: if a previous sync could have written content into a daily note and the new sync would remove or change that content, that daily note must remain in the affected-date set until it has been rewritten.

## Obsidian Sync Preview Multi-File Count Findings - 2026-07-08
- After fixing real sync affected-date propagation, the Electron preview layer still had one more scope mismatch:
  - `files` correctly expanded to every affected daily note
  - but `taskCount`, `completionRecordCount`, and `deletedReviewWillDisappear` still described only the selected date's preview note
- This produced obviously misleading output in cross-date deletion previews:
  - preview listed 2 files
  - yet `taskCount` could still be `0` even when the older affected file would render 1 remaining task
- The root cause was architectural rather than arithmetic:
  - `buildSyncPreview(...)` is intentionally single-date
  - `electron/obsidianSync.ts` had already lifted file scope to multi-date
  - but it kept reusing the single-date aggregate values without a second aggregation pass
- The right-sized fix is to keep the shared single-date preview helper intact, but have the Electron wrapper:
  1. build one preview per affected date
  2. preserve the selected-date preview as the base UI summary for managed blocks
  3. aggregate files/counts/warnings across all affected previews
- This keeps the invariant simple: once preview claims a sync will touch multiple daily notes, its counts must also describe the full multi-note sync workload rather than only the selected note subset.

## Obsidian Daily Template Disabled Custom Block Findings - 2026-07-08
- The template center uses `CustomBlock.aiGenerate` as the enabled/disabled flag for daily custom modules such as review, tomorrow, and knowledge.
- The `work-review` preset deliberately disables the knowledge module, and `modulesFromDailyTemplate(...)` correctly reports `knowledge.enabled === false`.
- `buildDailyNoteContent(...)` previously interpreted `aiGenerate: false` differently:
  - it removed the AI marker body
  - but still rendered `## <block name>` as an empty heading
- That produced orphan daily-note sections for modules the user had disabled in the template center.
- The focused verifier also exposed one stale test expectation: `verify:obsidian-template-center` still expected legacy monthly paths to migrate to a weekly filename even though Phase 160 fixed monthly migration to `{{year}}-{{month}}.md`.
- The right-sized fix is to treat disabled daily custom blocks as hidden during daily-note generation, not as empty deterministic headings.
- This keeps the invariant simple: if a template-center module is disabled, generated daily notes should not display that module's heading or marker block.


## Template Renderer Disabled Custom Block Findings - 2026-07-08
- Phase 178 fixed `buildDailyNoteContent(...)`, but `shared/templateRenderer.ts` carried an adjacent daily-rendering path with the old semantics.
- `renderDailyTemplate(...)` always pushed `## ${block.name}` before checking `block.aiGenerate`, so disabled custom modules still appeared as empty headings in template-rendered daily content.
- The working reference is now `buildCustomAiBlock(...)` in `shared/obsidianTemplates.ts`: disabled daily custom blocks are hidden entirely, not rendered as deterministic empty sections.
- The right-sized fix is to skip disabled daily custom blocks before heading/marker output in `renderDailyTemplate(...)`.
- `renderReportTemplate(...)` was left unchanged because report templates can use `aiGenerate: false` to render non-AI/manual body content; changing it would require a separate RED proving report semantics should match daily module visibility.


## Legacy Disabled Fixed Daily Module Findings - 2026-07-08
- Current Template Center UI intentionally treats `work`, `inspiration`, and `tasks` as fixed modules: their checkboxes are rendered checked and disabled, so current structured settings do not create disabled fixed modules through the normal UI.
- However, the runtime compatibility layer still supports legacy `modules.work/inspiration/tasks.enabled` flags and `buildSyncPreview(...)` already uses those flags to decide whether a managed block should be listed.
- Before Phase 180, initial daily note generation did not follow the same compatibility rule:
  - `buildDailyNoteContent(...)` rendered every fixed block in `dailyTemplate.blockOrder`
  - `buildDailyNoteFromTemplate(...)` replaced `{{work}}`, `{{inspiration}}`, and `{{tasks}}` tokens unconditionally
  - it also appended missing core managed blocks unconditionally
- That created a preview-vs-output mismatch for legacy settings: preview could report no managed blocks while newly generated notes still contained the disabled blocks.
- The right-sized fix is to keep the current UI model untouched but have daily note generation reuse the existing compat enabled flags for fixed block rendering/token replacement/appending.
- This keeps the invariant simple: if preview says a legacy fixed module is disabled, newly generated daily-note content should not create that module's managed block either.


## Flexible Daily Template Token Findings - 2026-07-08
- Daily-template migration and daily-template rendering had drifted in token semantics.
- The migration path accepts daily core tokens with optional whitespace and case-insensitivity, but runtime rendering previously only replaced exact lowercase no-space placeholders.
- This meant a user/imported template like `{{ work }}` or `{{ TASKS }}` could be recognized for ordering during migration but still leak the raw placeholder when generating a note.
- Because `buildDailyNoteFromTemplate(...)` appends missing enabled core blocks when markers are absent, leaked placeholders also caused a confusing output shape: the raw token remained while the corresponding managed block was appended later.
- The right-sized fix is a local token-replacement helper for daily note generation that mirrors the tolerance already present in migration recognition for date/work/inspiration/inspire/tasks.
- Delegating replacement bodies through `buildFixedBlock(...)` preserves the Phase 180 disabled-fixed-module compatibility rule.


## Custom Daily AI Template Token Findings - 2026-07-08
- Phase 181 fixed whitespace/case-tolerant replacement for date and fixed daily tokens, but custom AI tokens still had the same migration-vs-render drift.
- `migrateDailyMarkdownTemplate(...)` treats `review`, `tomorrow`, and `knowledge` as recognized daily-template tokens, but `buildDailyNoteFromTemplate(...)` did not replace them at runtime.
- The result was worse than a missing section: raw `{{ review }}`-style placeholders stayed in generated notes and no `DAILYTODO:CUSTOM:<id>` marker was created for AI generation/sync to target.
- The right-sized fix is to map the three known custom daily tokens to the first three `dailyTemplate.customBlocks`, matching the existing Template Center module model.
- Delegating through `buildCustomAiBlock(...)` preserves the disabled custom-module behavior introduced in Phases 178-179.


## Daily Path Template Variable Findings - 2026-07-08
- Daily note path resolution had drifted from the shared path-template capability.
- `shared/pathTemplate.ts` supports `date/year/month/week`, but `shared/obsidianTemplates.ts` had a private `renderPath(...)` that replaced only exact `{{date}}`.
- This caused advanced daily paths using year/month folders or spaced date tokens to create literal `{{year}}` / `{{month}}` / `{{ date }}` directories instead of expanding to the selected daily note date.
- The right-sized fix is to reuse `expandPathTemplate(...)` from `resolveTemplatePath(...)` and convert the app's `YYYY-MM-DD` date key into a local Date without timezone drift.
- Absolute-path rejection must remain after variable expansion but before filename-character sanitization, preserving the Phase 166 Windows path safety fix.


## Case-Insensitive Path Template Variable Findings - 2026-07-08
- `expandPathTemplate(...)` had one remaining compatibility gap after Phase 183: supported variables accepted whitespace but not case variants.
- This made daily/report path behavior inconsistent with daily markdown template token handling, where migration/rendering already accepts case-varied tokens.
- The safe invariant is: known path variables `date/year/month/week` should be whitespace-tolerant and case-insensitive; unknown variables should remain untouched so typos are visible.
- The fix is limited to regex flags in `shared/pathTemplate.ts`, so it does not alter date math, ISO week calculation, absolute path safety, or vault escape checks.


## AI Review Source Path Template Findings - 2026-07-08
- AI Review source-material collection had drifted from Obsidian daily path resolution.
- `shared/aiReview/sourceMaterials.ts` used a private exact `{{date}}` replacement, so source rules derived from advanced daily paths could fail to locate notes if the path used `{{year}}`, `{{month}}`, whitespace, or case-varied variables.
- The same helper also sanitized invalid filename characters before checking absoluteness; on Windows, that can mask `C:/...` as `C-/...`, the same safety class fixed for `resolveTemplatePath(...)` in Phase 166.
- The right-sized fix is to reuse `expandPathTemplate(...)` for source rules and keep the path-safety order consistent: expand variables, reject absolute paths, sanitize invalid filename characters, then perform vault-escape checks.
- This keeps AI Review weekly/monthly source collection aligned with the actual daily-note path template system without changing manual-files mode, disabled rules, weekly-report fallback, or unknown-variable visibility.


## AI Review Weekly Source Directory Vault Guard Findings - 2026-07-08
- `collectMonthlySources(...)` is an exported shared helper, so it should enforce its own vault boundary even if current IPC callers sanitize `settings.weeklyDir` before calling it.
- Before Phase 186, `collectWeeklyReports(...)` resolved weekly report candidates with `path.join(vaultPath, weeklyDir, week.md)` and did not perform the same vault-relative checks as daily source rules.
- A `weeklyDir` such as `../outside-weekly` could therefore point monthly source collection at files outside the vault when the helper is called directly.
- The safe invariant is: every AI Review source file path, whether from daily source rules or weekly report directories, must be absolute-path rejected, invalid-character sanitized only after that rejection, and vault-escape checked before reading.
- A shared rendered-path resolver keeps the daily and weekly source-material paths aligned without changing valid weekly report fallback behavior.


## AI Review Report Output Vault Guard Findings - 2026-07-08
- AI Review report writers had the same defense-in-depth gap as source collection: current IPC callers sanitize output dirs, but the writer helpers are callable directly and should enforce the vault boundary themselves.
- Before Phase 187, `resolveReportFilePath(...)` used `path.join(vaultPath, relativeDir || defaultDir, fileName)` without checking whether `relativeDir` was absolute or escaped via `..`.
- This meant a direct call such as `generatePersonalWeekly({ relativeDir: '../outside-export' })` could write reports outside the selected vault.
- The right invariant is: report writers must accept only vault-relative output directories, then resolve under `vaultPath` and reject any path whose relative form escapes the vault.
- The fix is centralized in `resolveReportFilePath(...)`, so weekly, monthly, and external report writers all inherit the same output guard while keeping valid custom output directories intact.


## Companion Target Absolute Path Guard Findings - 2026-07-08
- Companion sync target resolution had the same Windows path-safety class previously found in Obsidian template paths and AI Review source paths.
- `resolveTargetPath(...)` rendered the target and sanitized invalid filename characters before checking whether the path was absolute.
- Because `:` is replaced during sanitization, a Windows absolute target like `C:/secret/{{date}}.md` could be transformed into a relative-looking `C-/secret/2026-05-26.md` path under the vault instead of being rejected.
- The safe invariant is: raw rendered user-configurable paths must be checked for absoluteness before any filename-character sanitization; only then should relative paths be sanitized and passed through the vault-escape check.
- This keeps Companion behavior aligned with the path-safety order now used by Obsidian daily paths, AI Review source paths, and report output paths.


## Companion Template Variable Flexibility Findings - 2026-07-08
- Companion templates and targets are user-configurable, but `renderTemplate(...)` previously accepted only exact no-space lowercase/camel-case tokens.
- This created drift from Obsidian daily templates and shared path templates, which now tolerate whitespace and case variants for known variables.
- The practical failure mode was a Companion rule target such as `logs/daily/{{ DATE }}.md` creating a literal `{{ DATE }}`-style filename after sanitization instead of resolving to the capture date.
- The safe invariant is: known Companion variables should be whitespace-tolerant and case-insensitive, while unknown variables keep the existing empty-string behavior.
- A lowercase replacement map keeps the implementation local and avoids changing tag normalization, content rendering semantics, matching rules, or target path safety.

## Companion Mobile Inbox File-Only Import Findings - 2026-07-08
- `importMobileInbox(...)` should treat the mobile inbox as a flat file drop area; directories inside it are not import candidates.
- Before Phase 190, the importer filtered `fs.readdirSync(...)` results only by extension. Directories with supported-looking names such as `archive.md` therefore entered the import loop.
- Reading such a directory throws `EISDIR`, and the catch block could then move the directory into `_failed`, which is surprising and potentially destructive to user-organized inbox folders.
- The safe invariant is: only real files with `.md`, `.txt`, or `.json` extensions should be imported/moved; directories should be ignored in place.
- `fs.readdirSync(inboxPath, { withFileTypes: true })` provides the right minimal boundary because it preserves the existing import/move behavior for files while excluding directories before any read/rename attempt.

## Companion SyncPlan Direct Write Vault Guard Findings - 2026-07-08
- `buildSyncPlan(...)` correctly validates Companion rule targets, but `writeSyncPlan(...)` is exported and can be called with a manually constructed plan.
- Before Phase 191, `writeSyncPlan(...)` trusted each `SyncPlanChange.filePath` and performed `mkdir/read/write` directly, so a malformed `ok: true` plan could write outside the selected vault.
- The robust invariant is: writers should enforce their own filesystem boundary, not rely only on planner validation.
- Adding `vaultPath` to generated `SyncPlan` objects lets `writeSyncPlan(...)` re-check every change before file operations while preserving the existing preview/write IPC flow.
- Rejecting missing `plan.vaultPath` for ok plans is intentional: an ok plan without a root cannot prove its file paths are safe.

## Companion SyncPlan Preflight No Partial Write Findings - 2026-07-08
- Phase 191 made `writeSyncPlan(...)` reject each vault-escaping change, but the guard still lived inside the write loop.
- That meant direct malformed plans were no longer able to write outside the vault, but they could still cause partial writes: safe changes before the first unsafe change were already committed.
- The safer invariant is batch atomicity for path validation: an ok `SyncPlan` must have every change path proven inside `plan.vaultPath` before any filesystem side effect starts.
- The minimal fix is a preflight pass that collects path errors and returns early when any change escapes, while keeping the existing in-loop check as a defensive backstop.

## Companion Mobile Inbox JSON Content Guard Findings - 2026-07-08
- `importMobileInbox(...)` used `String(parsed.content || raw).trim()` for every supported file type.
- For `.json` captures, that fallback made missing or empty `content` look successful by storing the whole JSON payload as note content.
- The safe invariant is: raw-text fallback is valid for `.md` and `.txt`, but JSON captures must explicitly carry non-empty `content`.
- Throwing before item creation lets the existing error path move invalid JSON files into `_failed` and keeps processed captures meaningful.

## Obsidian Sync Optional Blog Draft Directory Guard Findings - 2026-07-08
- `syncTasksToObsidian(...)` treats local blog draft generation as optional: missing `localBlogDraftDir` is skipped.
- The previous guard used only `fs.existsSync(localBlogDraftDir)`, so a misconfigured path that existed as a file still entered the write path.
- Writing `daily-memo-<date>.md` under a file path throws and can block the primary Obsidian daily-note sync even though the blog draft is a secondary side effect.
- The safe invariant is: optional draft output should run only for an existing directory; file-backed or missing paths should be skipped without changing the main sync result.

## Companion Mobile Inbox Directory Guard Findings - 2026-07-08
- `importMobileInbox(...)` treated any existing `inboxPath` as usable and immediately created `_processed` and `_failed` below it.
- If a user or caller configured the mobile inbox path to a file, the importer threw during folder creation instead of returning a structured failure.
- The safe invariant is: mobile inbox import requires an existing directory; missing paths and non-directory paths should both fail without side effects on the provided path.
- A small `fs.statSync(inboxPath).isDirectory()` guard preserves valid directory behavior while keeping malformed paths from escaping the function as uncaught filesystem errors.

## Companion Mobile Inbox Processing Directory Conflict Guard Findings - 2026-07-08
- Even when the mobile inbox path itself is a directory, its internal processing folders can be occupied by files or other non-directory entries.
- `fs.mkdirSync(path.join(inbox, '_processed'), { recursive: true })` throws when `_processed` already exists as a file, turning a recoverable configuration problem into an uncaught import failure.
- The safe invariant is: `_processed` and `_failed` must be directories before import starts; non-directory conflicts should return structured setup errors and should not move any inbox files.
- A small setup helper keeps directory validation local and ensures file moves only start after both processing destinations are safe.

## Companion Mobile Inbox Blank Text Content Guard Findings - 2026-07-08
- After Phase 193, JSON inbox captures required explicit content, but `.md` and `.txt` captures could still trim to an empty string and be treated as successful items.
- Empty capture items are low-value and misleading: they consume inbox files, move them to `_processed`, and leave downstream sync/planning with a blank content field.
- The safe invariant is: every mobile inbox capture, regardless of source file type, must produce non-empty trimmed content before an item is created.
- Keeping raw-text fallback for non-empty text files preserves the useful text-import behavior while routing blank files through the existing `_failed` path.

## AI Review Source File-Only Collection Guard Findings - 2026-07-09
- AI Review source collection treated any existing rendered source path as readable content.
- Directory-shaped candidates can occur from user-created folders or path/template mistakes, and `fs.readFileSync(directory)` throws `EISDIR`.
- The safe invariant is: automatic source collection should collect only real files with non-empty content; missing paths, directories, and other non-file candidates should be skipped without interrupting valid sources.
- A shared `readSourceFileIfPresent(...)` helper keeps daily and weekly source-material collection aligned while preserving existing vault boundary checks before any filesystem read.

## AI Review Atomic Snapshot Directory Guard Findings - 2026-07-09
- `readWithStamp(...)` is the shared pre-write snapshot helper for AI Review file updates and report exports.
- Before Phase 199, it treated any existing path as a readable file, so directory-backed paths threw `EISDIR` before callers could produce structured write/refusal results.
- The safe invariant is: snapshots should be generated only for real files; missing and non-file paths should return a null stamp and no content.
- This keeps snapshot creation non-throwing for malformed paths while preserving `atomicReplace(...)` refusal behavior for directory-backed write targets.

## Electron Vault Status Directory Guard Findings - 2026-07-09
- `getVaultStatus()` is the main gate used before Obsidian-facing workflows proceed.
- Before Phase 200, it accepted any existing path as a valid vault, including regular files.
- The safe invariant is: an Obsidian vault path must be an existing directory; existing non-directory paths should fail at the status gate with a clear selection/reselection reason.
- Applying the same directory check to the development default vault path prevents a file-backed dev path from silently becoming the active vault fallback.

## Obsidian Sync Daily Note File Guard Findings - 2026-07-09
- Obsidian task sync assumes rendered daily note targets are files, but user-created folders or path/template mistakes can occupy the same `*.md` path as a directory.
- Reading a directory as an existing daily note throws `EISDIR`, which previously escaped `syncTasksToObsidian(...)` and interrupted callers.
- The safe invariant is: daily note targets must be real files before read/write merge logic starts; existing non-file targets should produce structured sync/preview failures.
- A shared `readDailyNoteFileIfPresent(...)` helper keeps sync and preview behavior aligned while preserving missing-file creation behavior for valid paths.

## Obsidian IPC Open Daily Note File Guard Findings - 2026-07-09
- `obsidian:openDailyNote` is a direct user-facing entry point separate from task sync and preview.
- Before Phase 202, it bootstrapped missing files but did not reject existing non-file targets before calling `shell.openPath(...)`.
- The safe invariant is: rendered daily-note targets must be files across sync, preview, and open flows; directory-backed targets should fail structurally before any shell open.
- Keeping the guard in the IPC handler prevents a malformed daily note path from being treated as successfully opened just because the shell can open a folder.

## Electron Icon Path File-Only Guard Findings - 2026-07-09
- App/tray icon resolution is a resource lookup, not just an existence check.
- Before Phase 203, a directory with the expected icon filename could be selected as the icon resource path and passed to `nativeImage.createFromPath(...)`.
- The safe invariant is: icon candidates must be real files; missing paths and directory/non-file candidates should fall through to the embedded fallback icon.
- Checking `fs.statSync(candidate).isFile()` keeps resource selection precise without changing fallback behavior.

## Electron Development UserData Directory Guard Findings - 2026-07-09
- The development `userData` override is a filesystem root for settings, store, and diagnostic output.
- Before Phase 204, `applyDevelopmentUserDataOverride()` treated any existing `DEV_APPDATA_ROOT` path as valid, including regular files.
- The safe invariant is: `userData` roots must be directories; existing non-directory paths should be ignored rather than installed as app storage roots.
- Adding `fs.statSync(...).isDirectory()` keeps the development override precise without changing production behavior or fallback semantics.

## SafeStore Config File-Only Guard Findings - 2026-07-09
- `createSafeStore()` has a recovery path for corrupt Electron Store configs: back up `config.json`, rewrite it to `{}`, then retry `new Store()`.
- Before Phase 205, that fallback treated any existing `configPath` as a file and attempted `copyFileSync(...)` / `writeFileSync(...)` directly.
- The safe invariant is: corrupt-config recovery should run only for real config files; directory/non-file paths should not trigger file backup or overwrite side effects.
- Checking `fs.statSync(configPath).isFile()` keeps the recovery path precise while preserving the intended backup-and-retry behavior for genuinely corrupt file-backed configs.

## Companion SyncPlan Directory Target No Partial Write Guard Findings - 2026-07-09
- `writeSyncPlan(...)` already preflighted vault boundaries after Phase 192, but it still trusted the shape of in-vault target paths.
- Before Phase 206, if a later `change.filePath` existed as a directory, `fs.readFileSync(...)` threw `EISDIR` only after earlier safe changes had already been written.
- The safe invariant is: batch preflight must validate both vault containment and file-target shape before any `mkdir`, read, or write side effect starts.
- Rejecting existing non-file targets during preflight, while keeping the same guard inside the write loop, prevents partial writes from directory-backed targets without changing valid file update behavior.

## AI Review Report Write Directory Conflict Structured Failure Findings - 2026-07-09
- AI Review weekly/monthly/external report generation already has a structured `ReportResult` failure path and IPC completion logic that expects `{ ok: false, error }`.
- Before Phase 207, shared `writeReport(...)` let direct filesystem setup exceptions escape, especially when `path.dirname(filePath)` existed as a file and `fs.mkdirSync(..., { recursive: true })` threw `EEXIST`.
- The safe invariant is: vault-relative path validation may still throw for programmer/configuration boundary violations, but write-time filesystem conflicts inside the selected vault should become structured failed report results rather than uncaught exceptions.
- Catching shared report write/setup exceptions inside `writeReport(...)` fixes weekly, monthly, and external report flows together while preserving existing vault-escape guard behavior.

## Obsidian Optional Blog Draft Target File Guard Findings - 2026-07-09
- Obsidian task sync treats local blog draft generation as an optional secondary side effect, while the selected daily note write is the primary workflow.
- Phase 194 guarded `localBlogDraftDir` itself, but before Phase 208 the computed draft target `daily-memo-<date>.md` could still be occupied by a directory.
- Because draft writing happened after the main sync try/catch, `fs.writeFileSync(directoryTarget, ...)` could throw `EISDIR` and make the whole sync call fail despite the daily note already being written.
- The safe invariant is: optional blog draft output should never interrupt primary Obsidian sync; write it only when the target is missing or a real file, and skip/catch secondary output conflicts.

## Companion SyncPlan Build Directory Target Guard Findings - 2026-07-09
- Companion sync has two safety layers: `buildSyncPlan(...)` for preview/planning and `writeSyncPlan(...)` for actual filesystem effects.
- Phase 206 hardened `writeSyncPlan(...)`, but before Phase 209 the planner still treated any existing target path as an updatable file.
- A directory occupying a resolved target such as `logs/daily/DailyTodo/2026-05-26.md` produced an `ok` plan with `action: 'update-file'`, even though the target could never be read/written as a file.
- The safe invariant is: planner output should not advertise impossible writes; existing non-file targets must be rejected during planning, with write-time guards kept as defense in depth.

## Companion Mobile Inbox Processed Move Atomicity Guard Findings - 2026-07-09
- Mobile inbox import should treat item creation and moving the source file to `_processed` as one success path.
- Before Phase 210, `importMobileInbox(...)` appended the parsed capture item before `fs.renameSync(filePath, processedDestination)`.
- If that processed move failed, the catch block could still move the file to `_failed`, but the item remained in the successful `items` array.
- The safe invariant is: a capture item should be returned only after its source file has successfully moved to `_processed`; failed move attempts belong exclusively to the error/`_failed` path.

## Companion Mobile Inbox Failed Move Structured Error Guard Findings - 2026-07-09
- Mobile inbox import has a structured return shape and should not let per-file filesystem move failures escape to callers.
- Before Phase 211, the fallback `_failed` move happened inside the catch block without its own protection.
- If routing a failed import to `_failed` also failed, the importer threw instead of returning accumulated errors.
- The safe invariant is: both primary processed moves and fallback failed moves should be reported through the `errors` array; failed captures must not enter `items`, and move-failure details should remain visible to callers.

## Companion Mobile Inbox Root Stat Structured Error Guard Findings - 2026-07-09
- Mobile inbox import already had structured return handling for missing paths, file-backed inbox roots, processing-directory conflicts, per-file parse/read errors, and move failures.
- Before Phase 212, the root shape check still used a bare `fs.statSync(inboxPath).isDirectory()` after `existsSync(...)`.
- A race, permission issue, or filesystem anomaly at that point could throw out of `importMobileInbox(...)` before the importer reached its structured `{ ok, items, errors }` failure path.
- The safe invariant is: inbox-root validation must finish before any `_processed` / `_failed` setup or file moves, and validation errors should be reported through the importer's `errors` array.
- Wrapping the root stat call keeps malformed/unstable inbox roots non-destructive while preserving existing behavior for missing paths and regular-file inbox paths.

## Companion Mobile Inbox Destination Race No-Overwrite Guard Findings - 2026-07-09
- `getUniqueDestination(...)` reduced normal duplicate-name collisions, but uniqueness was only advisory because the selected path was later passed to `fs.renameSync(...)` without an exclusive reservation.
- Before Phase 213, a destination that appeared after `existsSync(...)` but before `renameSync(...)` could be overwritten by the mobile inbox import path.
- The safe invariant is: processed and failed capture moves must never overwrite existing files, even under stale existence checks or destination races.
- Reserving the selected target with exclusive `wx` before rename turns the race into an `EEXIST` retry instead of a destructive overwrite.
- Applying the helper to both `_processed` and `_failed` keeps success and failure routing aligned.

## Companion Mobile Inbox Readdir Structured Error Guard Findings - 2026-07-09
- Root validation and processing-directory setup now fail structurally, but inbox file enumeration is a separate filesystem boundary.
- Before Phase 214, a failure from `fs.readdirSync(inboxPath, { withFileTypes: true })` escaped from `importMobileInbox(...)` before any per-file catch block existed.
- The safe invariant is: if the importer cannot enumerate the inbox, it should return `{ ok: false, items: [], errors }` and avoid moving any files.
- Wrapping enumeration keeps root validation, directory-ignore filtering, and per-file import behavior intact while closing another whole-import exception path.

## Companion Mobile Inbox Reservation Cleanup Error Preservation Guard Findings - 2026-07-09
- The no-overwrite move helper reserves a destination before renaming, then removes that placeholder if the rename fails.
- Before Phase 215, a cleanup failure during placeholder removal could mask the original move failure, making the structured importer errors less useful.
- The safe invariant is: secondary cleanup failures should never hide the primary filesystem failure that triggered cleanup.
- Combining the original move error with the cleanup error keeps diagnostics complete while preserving fallback routing to `_failed`.

## Companion Mobile Inbox Reservation Close Cleanup Guard Findings - 2026-07-09
- Exclusive reservation protects processed/failed destinations from overwrite races, but the reservation itself is a filesystem side effect.
- Before Phase 216, `reserveFilePath(...)` created the placeholder with `fs.openSync(..., 'wx')` and then called `fs.closeSync(...)` without cleanup handling.
- If closing the descriptor failed after placeholder creation, the importer returned a structured failure and routed the source file to `_failed`, but could still leave an empty placeholder in `_processed`.
- The safe invariant is: failed reservations should not leave destination placeholders behind; secondary cleanup failures should be reported alongside the primary reservation failure.
- Cleaning up the placeholder inside the close-failure path keeps the no-overwrite reservation strategy non-leaky without changing successful moves or `EEXIST` retry behavior.

## AI Review Daily Runner SourceChars Structured Failure Guard Findings - 2026-07-09
- Daily AI review orchestration has two reads of the daily note: inspection and source character counting.
- Before Phase 217, inspection read errors were structured, but the later `sourceChars` read was a bare `fs.readFileSync(...)` after an `existsSync(...)` check.
- A race or filesystem issue between those reads could throw out of `runReviewForDate(...)`, bypassing the diagnostic/result path used by IPC and UI progress handling.
- The safe invariant is: daily-runner source preparation failures should be represented as failed `prepareMaterials` diagnostics and `{ ok: false }` results, not uncaught exceptions.
- Wrapping source character counting keeps the successful diagnostic payload unchanged while aligning this second read with the existing structured inspection/missing-file handling.

## AI Review Atomic Replace Temp Cleanup Guard Findings - 2026-07-09
- `atomicReplace(...)` already protects against stale stamps and uses same-directory rename for atomic replacement, but writing the tmp file is still a side effect that needs cleanup on replacement failure.
- Before Phase 218, failures after `fs.writeFileSync(tmp, ...)` could return a structured `{ ok: false }` while leaving `<target>.tmp-<pid>` behind.
- The safe invariant is: failed atomic replacements should preserve the target and clean up temporary files best-effort before reporting the original failure.
- Tracking `tmp` outside the write/rename block and removing it in the catch path keeps successful atomic writes unchanged while reducing filesystem litter and future scan ambiguity.
- A runtime monkey-patch of `fs.renameSync` in the verifier did not affect the module-local ESM import binding, so the focused coverage uses a source-level cleanup invariant plus existing runtime behavior checks.

## Obsidian Template Picker File-Only Guard Findings - 2026-07-09
- Electron dialog properties reduce bad selections but should not be the only filesystem boundary guard.
- Before Phase 219, `obsidianTemplate:pickTemplateFile` read the returned path directly and relied on `readFileSync` errors for directories/non-files.
- The safe invariant is: selected template paths must be real files before content reads, matching the file-shape guards already added for daily-note open/sync paths and resource lookups.
- A small `fs.statSync(filePath).isFile()` check inside the existing try/catch produces clearer structured failures without changing cancellation, empty-file, or successful template import behavior.

## AI Review Atomic Replace Cleanup Error Preservation Guard Findings - 2026-07-09
- Cleanup after failed atomic replacement is secondary to the original write/rename failure.
- After Phase 218, tmp cleanup existed, but a cleanup failure could still replace or obscure the primary failure from the caller's perspective.
- The safe invariant is: cleanup failures should be visible, but they should not hide the original atomic replacement error that triggered cleanup.
- Capturing cleanup errors separately and appending `temporary cleanup failed: ...` keeps diagnostics complete while preserving the structured `{ ok: false }` return path.

## Electron Vault Path Store Type Guard Findings - 2026-07-09
- Store reads are an untrusted boundary even when the app normally writes well-shaped values.
- Before Phase 221, `getVaultPath()` trusted `store.get('obsidianVaultPath')` via a TypeScript cast and could return non-string objects as active vault paths.
- Current Node emitted a deprecation warning when that object reached `fs.existsSync(...)`, which is a useful early signal that future runtime behavior may become a hard failure.
- The safe invariant is: path accessors should expose only strings; malformed persisted path values should be ignored and treated like an unset vault path or development default fallback.
- A local `typeof storedPath === 'string'` guard keeps vault-status behavior predictable without changing valid stored paths or file-backed directory rejection.

## Companion Settings Store Normalization Guard Findings - 2026-07-09
- Companion settings are persisted through Electron Store and should be treated as untrusted runtime data when loaded.
- Before Phase 222, any object stored under `obsidianCompanionSettings` was returned as `CompanionSettings`, regardless of field types.
- Malformed persisted settings could leak invalid paths, sync modes, booleans, or non-array rules/templates into UI and sync planning.
- The safe invariant is: store-backed settings accessors should normalize data at the Electron boundary, not rely on renderer state or TypeScript interfaces.
- A local normalizer restores default values for malformed fields while preserving valid stored values and the existing default-vault fallback.

## Companion Settings Setter Normalization Guard Findings - 2026-07-09
- Read-time normalization prevents malformed Companion settings from breaking the current process, but write-time normalization prevents malformed settings from being persisted in the first place.
- Before Phase 223, `setCompanionSettings(...)` wrote caller-provided settings directly to Electron Store despite preload accepting `unknown` and IPC boundaries being runtime data.
- The safe invariant is: settings setters should persist normalized values, not raw caller payloads.
- Reusing the read-side normalizer in the setter keeps persisted Companion settings in a stable shape and avoids repeatedly repairing the same dirty store value on every read.

## Companion Settings Rules/Templates Element Guard Findings - 2026-07-09
- Array-level validation is not enough for store-backed settings that carry executable planning data.
- Before Phase 224, malformed `rules` and `templates` arrays could satisfy `Array.isArray(...)` while containing invalid objects that would fail later in Companion planning.
- The safe invariant is: normalized Companion settings should contain rule/template arrays whose elements are valid enough for `buildSyncPlan(...)` to read without structural exceptions.
- Element-level type guards keep custom valid arrays working while falling back to default rules/templates when persisted array contents are malformed.

## Companion Rule Condition String Array Guard Findings - 2026-07-09
- Rule-level validation must include nested condition arrays, not just top-level rule/write structure.
- Before Phase 225, a persisted rule with `when.tagsAny: [123]` could pass normalization because `when` was an object and `write` had basic shape.
- `matchesRule(...)` assumes tag/keyword condition entries are strings and calls string methods on them.
- The safe invariant is: normalized Companion rules should only expose string arrays for `tagsAny`, `tagsAll`, and `containsAny`; malformed condition arrays should not reach planning/matching.
- Adding nested enum/string-array guards keeps valid custom conditions working while routing malformed persisted rules back to default safe rules.

## Companion BuildSyncPlan Runtime Settings Collection Guard Findings - 2026-07-09
- Store-side normalization is not sufficient for Companion planning because preview/write IPC can still receive runtime settings payloads from the renderer boundary.
- Before Phase 226, `buildSyncPlan(...)` assumed `settings.rules` and `settings.templates` were arrays and threw while mapping/sorting malformed collections.
- The safe invariant is: Companion planner entry points should always return a structured `SyncPlan`, even when runtime settings are malformed.
- A small collection-shape preflight in `buildSyncPlan(...)` keeps valid planning behavior unchanged while preventing malformed IPC payloads from escaping as exceptions.
## Companion BuildSyncPlan Runtime Rule/Template Element Guard Findings - 2026-07-09
- Runtime IPC payload validation needs both collection-shape and element-shape checks.
- Before Phase 227, `buildSyncPlan(...)` rejected non-array `rules/templates`, but accepted arrays containing malformed rule/template elements.
- Rule/template elements are executable planning data: malformed `write`, `templateId`, `body`, or nested condition values can crash matching/rendering even when the outer collections are arrays.
- The safe invariant is: Companion planner entry points should only read rule/template elements after proving their runtime shape, and malformed runtime settings should return a structured failed `SyncPlan` with no changes.
- Reusing the same style of element guards as store normalization keeps valid custom rules/templates working while making direct runtime planner calls safe.
## Companion BuildSyncPlan Runtime Capture Item Guard Findings - 2026-07-09
- Runtime settings guards are not enough when the planner also accepts renderer-provided capture items.
- Before Phase 228, `buildSyncPlan(...)` assumed every entry in `items` was a valid `CaptureItem`, including string tags, content, source, status, and timestamps.
- Malformed capture items could surface as low-level template/matching errors instead of clear structured input-boundary failures.
- The safe invariant is: Companion planner entry points should validate capture item shape before calling `matchesRule(...)`, `resolveTargetPath(...)`, or `renderTemplate(...)`.
- A small runtime `CaptureItem` guard makes malformed IPC/runtime captures fail closed with no emitted changes while preserving valid custom planning behavior.
## Obsidian Sync Runtime Tasks Array Guard Findings - 2026-07-09
- Renderer-facing preload types use `unknown[]`, but Electron IPC payloads are runtime data and can still be malformed.
- Before Phase 229, Obsidian sync/preview checked vault status first, then immediately derived affected dates from `tasks` and `beforeTasks` outside the main try/catch.
- Non-array task payloads therefore escaped as uncaught exceptions instead of structured sync/preview errors.
- The safe invariant is: sync/preview entry points should validate task collection shape before date derivation, file planning, previews, or filesystem writes.
- A small array guard preserves valid sync behavior while making malformed renderer task collections fail closed with no preview file output.
## Obsidian Sync Runtime Task Element Guard Findings - 2026-07-09
- Array-level validation is not enough for renderer-provided sync payloads because the sync planner recursively walks nested task data before filesystem writes.
- Before Phase 230, malformed task entries such as non-array `subtasks` could throw during affected-date derivation outside the main structured failure path.
- Completion review fields are also part of sync routing: review date extraction and preview counts assume valid `reviewedAt`, `status`, and text fields.
- The safe invariant is: Obsidian sync/preview should validate task element shape, nested subtasks, and completion review arrays before deriving affected dates or writing daily notes.
- A recursive runtime task guard makes malformed task payloads fail closed while preserving valid nested task and cross-date review behavior.
## Obsidian Sync Runtime Daily Section Scalar Guard Findings - 2026-07-09
- Renderer-provided scalar fields need explicit validation just like array payloads.
- Before Phase 231, malformed `dailyWork` / `inspiration` values could reach template/block builders that assume strings.
- Preview is part of the safety boundary too: it should not emit file plans for malformed runtime scalar input, even if the eventual write path might fail later.
- The safe invariant is: Obsidian sync/preview should validate daily section scalar fields before preview planning or filesystem side effects.
- A small string guard keeps valid manual daily-work/inspiration sync intact while making malformed IPC inputs fail closed.
## Obsidian Sync Runtime Date Scalar Guard Findings - 2026-07-09
- Date inputs are path-shaping data, so runtime type validation should happen before template expansion.
- Before Phase 232, non-string `date` values could reach `getDateKey(...)` and daily-note path construction from renderer/IPC flows.
- This could produce misleading paths or successful sync/preview output for malformed selected-date input.
- The safe invariant is: Obsidian sync/preview should accept only undefined or string selected dates before deriving affected dates or file paths.
- A small date scalar guard keeps normal selected-date sync unchanged while making malformed runtime dates fail closed.
## Obsidian OpenDailyNote Runtime Date Guard Findings - 2026-07-09
- Any IPC field that shapes filesystem paths should be validated at the IPC edge, even if adjacent helper functions already guard similar inputs.
- Before Phase 233, `obsidian:openDailyNote` accepted runtime selected-date input and derived daily-note paths before checking that the value was actually a string.
- The safe invariant is: daily-note open/create flows should accept only undefined or string selected dates before path derivation or file creation.
- A local IPC guard keeps normal open-daily-note behavior unchanged while preventing malformed renderer payloads from shaping paths.
## Obsidian IPC Daily Section Forwarding Guard Findings - 2026-07-09
- Runtime validators can be bypassed by overly broad IPC defaulting if malformed falsy values are coerced before reaching the validator.
- Before Phase 234, `dailyWork || ''` and `inspiration || ''` treated omitted values and malformed falsy values the same.
- The safe invariant is: IPC should only supply defaults for omitted arguments, not normalize arbitrary malformed runtime values unless it performs explicit validation itself.
- Preserving non-undefined runtime values lets the sync/preview boundary validators from Phase 231 fail closed as intended.
## Companion IPC Items Forwarding Guard Findings - 2026-07-09
- Runtime validators can be bypassed by broad truthiness defaults at IPC forwarding boundaries.
- Before Phase 235, `items || []` treated omitted item arrays and malformed falsy runtime values the same.
- The safe invariant is: Companion IPC should only default omitted `items`, not normalize arbitrary malformed values before `buildSyncPlan(...)` validates them.
- Preserving non-undefined runtime values lets the planner item guard from Phase 228 fail closed as intended.
## Companion Mobile Inbox Runtime Path Guard Findings - 2026-07-09
- IPC path arguments should be type-checked before any filesystem API call, even if later filesystem checks return structured errors.
- Before Phase 236, non-string `inboxPath` values could reach `fs.existsSync(...)` from `importMobileInbox(...)`.
- Current Node warns for invalid argument types, which is a useful compatibility signal that this boundary may become a hard failure in future runtimes.
- The safe invariant is: mobile inbox import should accept only string paths before existence/stat/setup/enumeration checks.
- A local type guard preserves valid string path behavior while making malformed runtime IPC values fail closed with no filesystem side effects.
## Obsidian Template Recognition Input Validation Order Guard Findings - 2026-07-09
- Runtime input validation should happen before environmental/config gating when the user-facing error depends on input shape.
- Before Phase 237, invalid `rawTemplate` values could be masked by AI disabled/missing-key errors because `obsidianTemplate:recognize` checked AI settings first.
- The safe invariant is: template-recognition IPC should validate raw template input before reading AI settings, building prompts, or invoking LLM callers.
- Moving validation first preserves valid recognition behavior while making malformed input fail with the correct structured input error.
## AI Review Template Recognition Input Validation Order Guard Findings - 2026-07-09
- Input validation should precede AI configuration gating for template recognition flows, because malformed user input should return input-specific errors and should not reach LLM prompt construction.
- Before Phase 238, AI Review template recognition handlers checked AI settings/key before verifying `rawTemplate` was a non-empty string.
- This could mask empty/malformed template input as an AI configuration problem.
- The safe invariant is: recognition IPC handlers validate raw template content first, then check AI settings, then build prompts/call LLMs.
- Reordering validation preserves valid recognition behavior while improving failure precision and reducing unnecessary dependency reads.
## AI Review Template File Picker File-Only Guard Findings - 2026-07-09
- Dialog `openFile` constraints are useful UI hints, but filesystem handlers should still verify selected path shape before reading.
- Before Phase 239, AI Review template-file picker read the selected path directly with `fs.readFileSync(filePath)`.
- The safe invariant is: selected template paths must be real files before parsing `.md`, `.txt`, or `.docx` content.
- A local `statSync(...).isFile()` guard aligns AI Review picker behavior with the Obsidian template picker and keeps invalid path errors structured.

## AI Review Model List Runtime Provider Narrowing Findings - 2026-07-09
- Runtime IPC payloads must be treated as untrusted even when TypeScript annotations describe a narrow union.
- Before Phase 240, `aiReview:listModels` forwarded `cfg?.provider ?? 'auto'` to `listModels(...)`, so malformed provider values could bypass the intended `LlmProvider | 'auto'` set.
- The safe invariant is: only recognized provider strings should reach provider-specific model-list logic; unknown runtime values should fall back to `auto`.
- Explicit provider narrowing preserves valid model-list behavior while preventing malformed renderer data from shaping provider selection.

## AI Review Template Recognition Malformed Section Guard Findings - 2026-07-09
- LLM responses are untrusted runtime data even after JSON parsing succeeds.
- Before Phase 241, `parseRecognizedSections(...)` checked only that `sections` was an array; malformed array entries such as `null` could throw during mapping.
- The safe invariant is: template-recognition parsing should fall back for malformed LLM structure instead of throwing, so IPC callers get the same low-confidence/unmatched fallback path used for unparseable output.
- Valid section objects continue through the existing marker/title/type normalization, while malformed section arrays now fail closed.

## AI Review Template Picker Runtime Path Type Guard Findings - 2026-07-09
- Electron dialog output is normally well-shaped, but picker handlers still sit on a runtime boundary and may be exercised by mocks or unexpected IPC states.
- Before Phase 242, `aiReview:pickTemplateFile` derived `path.basename(filePath)` before proving the selected path was a string.
- The safe invariant is: selected file paths must be string-typed before any path utilities or filesystem APIs run.
- A local string guard preserves normal file picking while making malformed runtime path entries fail structurally.

## Obsidian Template Picker Runtime Path Type Guard Findings - 2026-07-09
- Obsidian template picker output is dialog-shaped in normal UI use, but the IPC handler still processes runtime data.
- Before Phase 243, `obsidianTemplate:pickTemplateFile` derived `path.basename(filePath)` before proving the selected path was a string.
- The safe invariant is: selected template paths must be string-typed before any path utilities or filesystem APIs run.
- A local string guard aligns Obsidian picker behavior with the AI Review template picker and keeps malformed runtime path entries structured.

## Obsidian ChoosePath Runtime Path Type Guard Findings - 2026-07-09
- Dialog-selected vault paths are persisted configuration, so runtime type narrowing should happen before any store write.
- Before Phase 244, `obsidian:choosePath` wrote `result.filePaths[0]` directly to Electron Store.
- The safe invariant is: only string selected paths should be persisted or returned as new vault paths.
- A local guard keeps normal directory selection unchanged while preventing malformed runtime values from contaminating store-backed vault path state.

## Obsidian Stored Path Return Normalization Guard Findings - 2026-07-09
- Store-backed paths are untrusted runtime data even if the app usually writes strings.
- Before Phase 245, `obsidian:getPath` and choosePath fallback branches returned `store.get(obsidianPathKey) || getDefaultVaultPath()`, allowing truthy malformed stored values to reach renderer path consumers.
- The safe invariant is: IPC path getters should expose only string stored paths or a string/undefined default fallback.
- A small local accessor keeps valid persisted paths unchanged while preventing malformed store state from leaking through Obsidian path IPC.

## Main Window Startup Stored Vault Path Seeding Guard Findings - 2026-07-09
- Startup seeding decisions should not trust truthiness of store-backed values.
- Before Phase 246, `mainWindowStartup` used `!store.get(obsidianPathKey)` to decide whether to seed the default vault path, so truthy malformed values could block default seeding.
- The safe invariant is: only non-empty string stored vault paths should count as already seeded.
- Treating non-string/blank stored path values as unset keeps normal startup behavior unchanged while repairing malformed persisted path state opportunistically.

## Main Window Persistence Raw Store Normalization Guard Findings - 2026-07-09
- Electron Store reads are runtime `unknown` values; TypeScript casts should not be used to imply persisted shape before validation.
- Before Phase 247, main-window persistence cast stored window state as `WindowState` before calling `normalizeRestoredWindowState(...)`.
- The safe invariant is: persisted window-state values should be passed raw into the normalizer wherever bounds are restored or previous compact dimensions are preserved.
- Removing casts keeps runtime behavior aligned with the existing normalizer while making the boundary clearer for future maintenance.

## Window IPC Boolean Store Strictness Guard Findings - 2026-07-09
- Boolean store reads should not use broad JavaScript truthiness when malformed persisted values are possible.
- Before Phase 248, compact-mode and autostart IPC getters used `Boolean(store.get(...))`, so truthy non-boolean values could be exposed as enabled.
- The safe invariant is: persisted boolean settings should read as enabled only when the stored value is exactly `true`; all malformed values fall back to disabled.
- Strict boolean reads keep valid settings unchanged while preventing malformed store data from silently enabling window behaviors.

## Window IPC Boolean Setter Normalization Guard Findings - 2026-07-09
- Runtime IPC setter inputs should be normalized before persistence or OS API calls, not trusted because preload TypeScript signatures say `boolean`.
- Before Phase 249, compact-mode and autostart setters stored raw IPC values; autostart also forwarded the raw value to Electron login-item settings.
- The safe invariant is: only strict `true` should enable these boolean settings, and all malformed values should persist/return as `false`.
- Normalizing setter inputs complements Phase 248 getter strictness so malformed booleans cannot enter or leave the store boundary as enabled states.

## Window Settings Mode Runtime Boolean Guard Findings - 2026-07-09
- Runtime IPC booleans should not be interpreted with broad truthiness.
- Before Phase 250, `window:setSettingsMode` used `if (open)`, so truthy malformed values could open settings mode.
- The safe invariant is: settings mode opens only for strict `true`; all malformed values should behave like close/false.
- This aligns settings-mode IPC with the strict boolean store getter/setter handling added in Phases 248-249.

## Window Lock Position Runtime Boolean Guard Findings - 2026-07-09
- Runtime IPC booleans should not be normalized with broad `Boolean(...)` when malformed truthy values are possible.
- Before Phase 251, `window:setLockWindowPosition` used `Boolean(locked)`, so malformed truthy runtime values could enable lock-position mode.
- The safe invariant is: lock-position mode enables only for strict `true`; malformed values persist as false.
- This keeps lock-position behavior aligned with the strict window boolean handling from Phases 248-250.

## Window Mode Runtime Input Narrowing Guard Findings - 2026-07-09
- TypeScript union annotations do not protect Electron IPC handlers from malformed runtime values.
- Before Phase 252, `window:setWindowMode` forwarded `mode` directly to `setWindowMode(...)`.
- The safe invariant is: only values accepted by the shared `isWindowMode(...)` guard should reach window-mode mutation logic; malformed values should leave the current mode unchanged.
- Reusing the shared guard keeps renderer/runtime behavior consistent with stored window-mode normalization.

## Task Context Menu Resize Runtime Height Guard Findings - 2026-07-09
- Runtime IPC numeric values should not be accepted through broad `Number(...)` coercion.
- Before Phase 253, task context menu resize used `Number(height) || defaultTaskMenuHeight`, allowing strings/booleans to shape popup height.
- The safe invariant is: resize accepts only finite numbers, then clamps to the existing `80..600` range; malformed values fall back to the default height.
- This preserves valid popup resizing while preventing malformed runtime payloads from affecting window bounds.

## Task Context Menu Open Payload Runtime Guard Findings - 2026-07-09
- Popup-window creation uses IPC payload coordinates as BrowserWindow bounds inputs, so runtime payload shape matters even when renderer helpers normally build valid payloads.
- Before Phase 254, `taskContextMenu:open` forwarded runtime payloads directly to popup creation.
- The safe invariant is: task-menu popup creation should only receive object payloads with finite numeric screen coordinates and string tag arrays.
- A local guard prevents malformed IPC payloads from creating windows with invalid positions while preserving valid renderer-created payloads.

## Task Menu Window Coordinate Defense Guard Findings - 2026-07-09
- Defense-in-depth is useful for window-bound inputs: IPC guards protect the edge, but window creation should still avoid trusting raw coordinates.
- Before Phase 255, `createTaskMenuWindow(...)` clamped raw payload coordinates directly.
- The safe invariant is: popup coordinates should be finite numbers before clamping; malformed values fall back to a safe in-work-area point.
- Center fallback preserves valid placement while preventing invalid coordinate propagation if a future caller bypasses the IPC payload guard.

## Task Context Menu Renderer Payload Coordinate Guard Findings - 2026-07-10
- Renderer helpers should avoid producing malformed IPC payloads, even when Electron-side IPC and popup creation also guard the same fields.
- Before Phase 256, `createTaskContextMenuPayload(...)` forwarded raw `screenX/screenY` into the task-context-menu IPC payload.
- The safe invariant is: renderer-created popup coordinates should be finite numbers before crossing IPC.
- This adds an early defensive layer while preserving Electron-side validation and popup fallback from Phases 254-255.

## Task Context Menu Theme Numeric Clamp Guard Findings - 2026-07-10
- CSS-derived numeric values should be bounded, not merely finite, before becoming renderer-to-Electron popup payload data.
- Before Phase 257, task context-menu theme parsing accepted any finite opacity, blur, or radius value.
- The safe invariant is: menu opacity stays within `0.3..1`, blur strength within `0..40`, and card radius within `0..32`.
- Bounded parsing preserves normal theme customization while preventing malformed CSS variables from generating extreme popup visuals.

## Task Menu Action Runtime Payload Guard Findings - 2026-07-10
- Renderer action listeners consume forwarded Electron IPC data and should validate payload shape before dereferencing.
- Before Phase 258, task-menu action parsing cast unknown payloads and read `updates.__action` directly.
- The safe invariant is: malformed task-menu action payloads become no-op actions, while valid add-subtask/delete/edit/update payloads keep their existing routes.
- A no-op parsed action prevents malformed popup events from crashing or mutating tasks incorrectly.

## Task Context Menu Action Forwarding Payload Guard Findings - 2026-07-10
- Electron IPC forwarding boundaries should validate payload shape before broadcasting runtime data to renderer listeners.
- Before Phase 259, `taskContextMenu:action` forwarded unknown payloads to the main renderer and relied on the renderer parser to absorb malformed values.
- The safe invariant is: only action payloads with a non-empty string `taskId` and object-shaped `updates` cross the Electron-to-renderer boundary; malformed action payloads simply close the popup.
- This complements the Phase 258 renderer no-op parser with an earlier Electron-side guard while preserving valid add-subtask/delete/edit/update action forwarding.

## Task Menu Action Preload Type Contract Narrowing Findings - 2026-07-10
- Ambient preload types are part of the trust boundary: if runtime data is validated as `unknown`, `src/vite-env.d.ts` should not advertise a trusted payload shape to renderer callers.
- Before Phase 260, `dispatchTaskMenuAction` and `onTaskMenuAction` still claimed task-menu action payloads were structured task objects, even though the runtime parser now accepts `unknown`.
- The safe invariant is: task-menu action payloads remain `unknown` at the preload/listener boundary and are narrowed only by the runtime guards in `src/app/taskMenuActions.ts`.
- Narrowing the ambient contract preserves valid task-menu routing while making future renderer code less likely to bypass the no-op parser guard.

## Tasks Changed Preload Type Contract Narrowing Findings - 2026-07-11
- Cross-window task-change broadcasts are runtime data even when they normally originate from this app.
- Before Phase 261, `electron/preload.ts` forwarded `onTasksChanged` payloads as `unknown` and `useTasks` normalized them, but `src/vite-env.d.ts` still told renderer callers the listener receives a trusted `Task[]`.
- The safe invariant is: `onTasksChanged` exposes `unknown` at the ambient preload boundary, and task arrays are trusted only after `normalizeIncomingTasks(...)` applies the renderer-side normalization path.
- Narrowing this type contract preserves valid cross-window task sync while reducing the chance that future renderer code bypasses the normalization guard.

## Obsidian Sync Preload Type Contract Narrowing Findings - 2026-07-11
- Obsidian sync/preview task arrays cross the preload boundary as runtime data, even when they are usually produced by the renderer.
- Before Phase 262, `electron/preload.ts` already forwarded sync and preview task arrays as `unknown[]`, and the sync helpers already returned structured failures for malformed runtime task arrays/entries, but `src/vite-env.d.ts` still advertised trusted `Task[]` inputs.
- The safe invariant is: `syncTasksToObsidian(...)`, `previewTasksToObsidian(...)`, and optional `beforeTasks` expose `unknown[]` at the ambient preload boundary; task objects become trusted only after the Obsidian sync validation path accepts them.
- Narrowing this type contract preserves valid sync/preview behavior while reducing the chance that future renderer code treats preload-provided sync inputs as already trusted task objects.

## Companion Sync Preload Type Contract Narrowing Findings - 2026-07-11
- Companion sync/write settings and capture items cross the preload boundary as runtime data, even when normal renderer callers provide well-shaped objects.
- Before Phase 263, `electron/preload.ts` already forwarded Companion sync/write inputs as `unknown` settings plus `unknown[]` items, and Companion planning had runtime validation for malformed settings/items, but `src/vite-env.d.ts` still advertised trusted `CompanionSettings` and `CaptureItem[]` inputs.
- The safe invariant is: `previewCompanionSync(...)` and `writeCompanionSync(...)` expose `settings: unknown` and `items: unknown[]` at the ambient preload boundary; values become trusted only after the Companion validation/planning path accepts them.
- Narrowing this type contract preserves valid Companion sync behavior while reducing the chance that future renderer code treats preload-provided Companion sync inputs as already trusted structures.

## AI Review Preload Type Contract Narrowing Findings - 2026-07-11
- AI Review task arrays cross the preload boundary as runtime data, even when normal renderer callers pass well-shaped app tasks.
- Before Phase 264, `electron/preload.ts` already forwarded daily run, backfill, weekly report, and monthly report task inputs as `unknown`, but `src/vite-env.d.ts` still advertised trusted `Task[]` inputs for those APIs.
- The safe invariant is: `runForDate(...)`, `backfill(...)`, `generateWeekly(...)`, and `generateMonthly(...)` expose task inputs as `unknown` at the ambient preload boundary; task structures become trusted only after the downstream AI Review validation/normalization path accepts them.
- Calibrating `scripts/verify-ai-regenerate-force.ts` to current split IPC modules keeps the daily regeneration force contract covered while preventing future ambient type drift.

## Settings Preload Type Contract Narrowing Findings - 2026-07-11
- Settings setter payloads cross the preload boundary as runtime data, even when renderer store wrappers pass well-shaped settings objects.
- Before Phase 265, `electron/preload.ts` and `electron/settingsIpc.ts` already treated app settings and Obsidian template settings setter inputs as `unknown`, but `src/vite-env.d.ts` still advertised trusted `AppBehaviorSettings` and `ObsidianTemplateSettings` inputs.
- The safe invariant is: `setAppSettings(...)` and `setObsidianTemplateSettings(...)` expose `unknown` at the ambient preload boundary; values become trusted only after the main-process app-state normalization path accepts or defaults them.
- Keeping typed renderer store wrappers on top of the unknown preload contract preserves existing call-site ergonomics while preventing the global preload API from overstating runtime trust.

## AI Review Settings Preload Type Contract Narrowing Findings - 2026-07-11
- AI Review settings and section arrays cross the preload boundary as runtime data, even when normal renderer callers provide well-shaped configuration objects.
- Before Phase 266, `electron/preload.ts` and `electron/aiReviewSettingsSectionsIpc.ts` already treated `aiReview.setSettings(...)` and `aiReview.setSections(...)` inputs as `unknown`, but `src/vite-env.d.ts` still advertised trusted `AiReviewSettings` and `SectionConfig[]` inputs.
- The safe invariant is: AI Review setter inputs expose `unknown` at the ambient preload boundary; values become trusted only after settings or section normalization accepts/defaults them.
- Returning strongly typed normalized settings/sections remains appropriate because the main-process setters are the trust-establishing boundary.

## Companion Settings Setter Type Contract Narrowing Findings - 2026-07-11
- Companion settings setter payloads cross the preload and IPC boundary as runtime data, even when normal renderer callers provide well-shaped settings objects.
- Before Phase 267, `electron/preload.ts` already forwarded `setCompanionSettings(settings: unknown)`, and app-state persistence normalized the value before storing it, but `src/vite-env.d.ts`, `electron/companionIpc.ts`, and the app-state setter signature still advertised trusted `CompanionSettings` input.
- The safe invariant is: `setCompanionSettings(...)` exposes `unknown` from ambient preload through Electron IPC into the app-state setter; values become trusted only after `normalizeCompanionSettings(...)` accepts or defaults them.
- Returning strongly typed `CompanionSettings` from `getCompanionSettings()` remains appropriate because that getter is backed by the normalization path.

## Task Context Menu Open Type Contract Narrowing Findings - 2026-07-11
- Task context menu open payloads cross the preload boundary as runtime data, even when normal renderer helpers build well-shaped popup payloads.
- Before Phase 268, `electron/preload.ts` forwarded `openTaskContextMenu(payload: unknown)` and `electron/taskContextMenuIpc.ts` guarded runtime shape before popup creation, but `src/vite-env.d.ts` still advertised a trusted structured payload.
- The safe invariant is: `openTaskContextMenu(...)` exposes `unknown` at the ambient preload boundary; payload shape becomes trusted only after the `taskContextMenu:open` IPC guard accepts it.
- Keeping this ambient contract aligned with the existing IPC guard reduces the chance that future renderer code treats popup payloads as trusted before validation.

## Task Context Menu Resize Type Contract Narrowing Findings - 2026-07-11
- Task context menu resize heights cross the preload and IPC boundary as runtime data, even when the popup normally sends a measured numeric height.
- Before Phase 269, the resize path already guarded with `typeof height === 'number' && Number.isFinite(height)` before clamping, but `electron/preload.ts`, `src/vite-env.d.ts`, and `electron/taskContextMenuIpc.ts` still advertised trusted `number` inputs.
- The safe invariant is: `resizeTaskContextMenu(...)` exposes `unknown` from ambient preload through Electron IPC; the value becomes trusted only after finite-number narrowing and the existing `80..600` clamp.
- Keeping the type contract aligned with the runtime guard avoids future callers treating popup resize values as trusted merely because the TypeScript surface says `number`.

## Window Mode Setter Type Contract Narrowing Findings - 2026-07-11
- Window mode setter inputs cross the preload and IPC boundary as runtime data, even when renderer callers normally pass known `WindowMode` values.
- Before Phase 270, `electron/windowIpc.ts` already guarded with `isWindowMode(mode)` before calling the typed window-mode setter, but preload and ambient signatures still advertised trusted `string` / `WindowMode` inputs.
- The safe invariant is: `setWindowMode(...)` exposes `unknown` from ambient preload through Electron IPC; values become trusted only after `isWindowMode(...)` accepts them.
- Returning a strongly typed `WindowMode` remains appropriate because the getter/fallback path returns normalized internal mode state.

## Window Settings Mode Type Contract Narrowing Findings - 2026-07-11
- Settings-mode open/close inputs cross the preload and IPC boundary as runtime data, even when renderer callers normally pass booleans.
- Before Phase 271, `electron/windowIpc.ts` already narrowed settings-mode input with `open === true`, but the IPC handler, preload function, and ambient preload signature still advertised trusted `boolean` inputs.
- The safe invariant is: `setSettingsMode(...)` exposes `unknown` from ambient preload through Electron IPC; values become trusted only after strict `true` comparison decides the open path.
- Returning a structured `{ ok, width }` result remains appropriate because the handler computes it from current window/settings-mode state after normalization.

## Window Lock Position Type Contract Narrowing Findings - 2026-07-11
- Lock-position setter inputs cross the preload and IPC boundary as runtime data, even when renderer callers normally pass booleans.
- Before Phase 272, `electron/windowIpc.ts` already narrowed lock-position input with `locked === true`, but the IPC handler, preload function, and ambient preload signature still advertised trusted `boolean` inputs.
- The safe invariant is: `setLockWindowPosition(...)` exposes `unknown` from ambient preload through Electron IPC; values become trusted only after strict `true` comparison determines the persisted app setting.
- Reapplying window z-order after the normalized setting write remains appropriate because it observes the trusted app settings result.

## Window Compact Mode Type Contract Narrowing Findings - 2026-07-11
- Compact-mode setter inputs cross the preload and IPC boundary as runtime data, even when renderer callers normally pass booleans.
- Before Phase 273, `electron/windowIpc.ts` already narrowed compact-mode input with `compactMode === true`, but the IPC handler, preload function, and ambient preload signature still advertised trusted `boolean` inputs.
- The safe invariant is: `setWindowCompactMode(...)` exposes `unknown` from ambient preload through Electron IPC; values become trusted only after strict `true` comparison determines the persisted compact-mode store value.
- The strict getter remains the paired egress guard: only stored `true` is exposed as enabled.

## Window Auto Start Type Contract Narrowing Findings - 2026-07-11
- Autostart setter inputs cross the preload and IPC boundary as runtime data, even when renderer callers normally pass booleans.
- Before Phase 274, `electron/windowIpc.ts` already narrowed autostart input with `enabled === true`, but the IPC handler, preload function, and ambient preload signature still advertised trusted `boolean` inputs.
- The safe invariant is: `setAutoStart(...)` exposes `unknown` from ambient preload through Electron IPC; values become trusted only after strict `true` comparison determines the persisted autostart store value and Electron login-item setting.
- The strict getter remains the paired egress guard: only stored `true` is exposed as enabled.

## Companion Mobile Inbox Import Type Contract Narrowing Findings - 2026-07-11
- Mobile inbox import paths cross the preload and IPC boundary as runtime data, even when normal renderer callers pass configured strings.
- Before Phase 275, `electron/obsidianCompanion.ts` already rejected non-string runtime inbox paths before filesystem checks, but the importer function, Companion IPC handler, preload function, and ambient preload signature still advertised trusted `string` inputs.
- The safe invariant is: `importMobileInbox(...)` exposes `unknown` from ambient preload through Electron IPC into the importer; values become trusted only after the runtime `typeof inboxPath === 'string'` guard accepts them.
- Keeping the function signature aligned with the existing guard makes future call sites less likely to bypass or misunderstand the structured non-string failure path.

## Obsidian Template Recognize Type Contract Narrowing Findings - 2026-07-11
- Obsidian template recognition raw templates cross the preload and IPC boundary as runtime data, even when normal renderer callers pass text from the template editor.
- Before Phase 276, the runtime path already validated raw input with `validateObsidianTemplateRecognitionInput(rawTemplate)` before AI settings/API-key checks, but the IPC handler, preload function, and ambient preload signature still advertised trusted `string` inputs.
- The safe invariant is: `obsidianTemplate.recognize(...)` exposes `unknown` from ambient preload through Electron IPC; values become trusted only after the Obsidian template recognition validator accepts and returns normalized raw template text.
- Keeping the ambient and IPC contract aligned with the validator reduces the chance that future renderer or preload code treats raw template content as trusted merely because TypeScript says `string`.

## AI Review Template Recognition Type Contract Narrowing Findings - 2026-07-11
- AI Review template and report-template recognition inputs cross the preload and IPC boundary as runtime data, even when normal renderer callers pass strings from settings/template editors.
- Before Phase 277, runtime guards already rejected malformed `rawTemplate` before AI settings/API-key checks, and report-template targets already fell back to `personalWeekly`, but IPC/preload/ambient signatures still advertised trusted `string` inputs.
- The safe invariant is: `aiReview.recognizeTemplate(...)` and `aiReview.recognizeReportTemplate(...)` expose `unknown` from ambient preload through Electron IPC; values become trusted only after raw-template validation and report-target narrowing.
- Keeping this contract aligned with the existing guards reduces the chance that future renderer code treats AI Review recognition payloads as trusted before validation.

## Obsidian Daily Note Open Type Contract Narrowing Findings - 2026-07-11
- Obsidian daily-note open dates cross the preload and IPC boundary as runtime data, even when normal renderer callers pass the selected date string.
- Before Phase 278, `electron/obsidianIpc.ts` already rejected non-string runtime `date` values before daily-note path derivation, but the IPC handler, preload function, and ambient preload signature still advertised trusted `string` inputs.
- The safe invariant is: `openDailyNote(...)` exposes `unknown` from ambient preload through Electron IPC; the date becomes trusted only after the existing `date !== undefined && typeof date !== 'string'` guard accepts it.
- Keeping this contract aligned with the existing guard reduces the chance that future renderer code treats selected-date IPC input as trusted merely because TypeScript says `string`.

## AI Review Model List Config Type Contract Narrowing Findings - 2026-07-11
- AI Review model-list config crosses the preload and IPC boundary as runtime data, even when normal renderer settings widgets pass a small object with base URL, API key, and provider.
- Before Phase 279, `electron/aiReviewTemplateToolsIpc.ts` already narrowed config fields before use, but the IPC handler, preload function, and ambient preload signature still advertised a trusted config object.
- The safe invariant is: `aiReview.listModels(...)` exposes `unknown` from ambient preload through Electron IPC; `baseUrl`, `apiKey`, and `provider` become trusted only after local string checks and provider whitelist narrowing.
- Keeping this contract aligned with the field guards reduces the chance that future renderer code treats model-list configuration as prevalidated merely because TypeScript says it is structured.

## AI Review Date Input Runtime Hardening Findings - 2026-07-11
- Date values crossing AI Review IPC boundaries are runtime data, even when normal renderer paths provide date strings.
- Before Phase 280, `getDateKey(date?: string)` called `.slice()` immediately, allowing malformed non-string IPC input to throw before fallback normalization.
- The safe invariant is: `getDateKey(date?: unknown)` treats only non-empty strings as date candidates; all other runtime values fall back to `getTodayDate()`.
- AI Review daily, weekly, monthly, external, and source-material date signatures expose `unknown` until the shared date helper establishes a usable date key.
- Keeping date helper and IPC/preload/ambient contracts aligned avoids future handlers accidentally trusting a string-only TypeScript declaration at a runtime boundary.

## Obsidian Sync Runtime Payload Type Contract Narrowing Findings - 2026-07-11
- Obsidian sync and preview payloads cross the preload/IPC boundary as runtime data, even though normal renderer store wrappers provide typed task arrays and strings.
- Before Phase 281, both sync helper entry points already validated task array shape, task element structure, daily text fields, and selected dates, while IPC/preload/ambient/injection declarations still advertised those values as trusted.
- The safe invariant is: task lists, selected dates, daily work, inspiration, and before-task lists remain `unknown` until `syncTasksToObsidian(...)` or `previewTasksToObsidian(...)` applies the existing validation.
- Renderer store wrappers can remain strongly typed because they are convenience callers; the exposed preload API accurately represents the trust boundary.

## Companion Sync Runtime Payload Type Contract Narrowing Findings - 2026-07-11
- Companion preview/write settings and capture items cross the Electron IPC boundary as runtime data, even when normal renderer store wrappers provide strongly typed values.
- Before Phase 282, preload and ambient declarations already exposed those inputs as `unknown`, and `buildSyncPlan(...)` already returned structured failures for malformed arrays, entries, rules, templates, and vault paths; the IPC and helper signatures still overstated their trust.
- The safe invariant is: Companion IPC handlers and `buildSyncPlan(...)` accept `unknown`; a local structural guard establishes the minimal trusted planning shape only after validation.
- Strongly typed renderer wrappers remain appropriate as convenience call sites, while the exposed boundary now accurately documents its untrusted payload contract.

## AI Review Daily Runtime Task Payload Hardening Findings - 2026-07-11
- AI Review daily-run task and force values cross the preload and Electron IPC boundary as runtime data, even when normal renderer callers build typed task lists and boolean flags.
- Before Phase 283, `aiReview:runForDate` accepted `ElectronTask[]` directly and passed `Boolean(force)` to the review runner, leaving malformed nested task data unchecked and allowing truthy non-booleans to force regeneration.
- The safe invariant is: date, task payload, and force flag remain `unknown` at the public boundary; every task and recursive subtask becomes trusted only after local structural validation, and only literal `true` enables forced generation.
- The structured malformed-task failure response is preferable to passing an invalid payload deeper into daily review/statistics/write logic, where the failure would be less controlled.

## AI Review Report And Backfill Task Payload Validation Findings - 2026-07-11
- AI Review backfill, weekly report, and monthly report task payloads cross Electron IPC as runtime data, even when normal renderer callers pass the current task store.
- Before Phase 284, those handlers still typed task payloads as trusted arrays and used casts before statistics or backfill logic, so malformed nested task data could travel beyond the IPC boundary.
- The safe invariant is: every AI Review task-consuming IPC entry accepts `unknown` task payloads and uses the shared recursive `ElectronTask[]` guard, including optional carry/completion-review fields, before invoking daily review, range statistics, report generation, or backfill.
- A shared guard is preferable here because daily run, weekly report, monthly report, and backfill all depend on the same task structure; keeping one runtime contract reduces drift as task fields evolve.

## AI Review Report Kind Runtime Narrowing Findings - 2026-07-11
- External report generation and source-material testing report kinds cross Electron IPC as runtime data, even when normal renderer controls only pass `weekly` or `monthly`.
- Before Phase 285, malformed report-kind values were not rejected; any non-`weekly` value flowed into the monthly branch for both external generation and source-material tests.
- The safe invariant is: public preload and IPC surfaces expose report kind as `unknown`; only the shared `isAiReviewReportKind(...)` guard can establish `weekly` or `monthly` before source collection or report generation.
- Rejecting malformed kind values before settings, vault, source, or LLM work avoids surprising monthly report writes/tests caused by bad renderer or IPC payloads.

## Electron Store Key Runtime Narrowing Findings - 2026-07-11
- Generic Electron Store keys cross IPC as runtime data, even when normal renderer wrappers pass stable string constants such as `tasks`, `isDark`, or `taskPriorityFilter`.
- Before Phase 286, `store:get` and `store:set` typed renderer-controlled keys as trusted `string` values through IPC, preload, and ambient declarations.
- The safe invariant is: public preload and IPC store key inputs expose `unknown`; only the `typeof key === 'string'` guard in `electron/settingsIpc.ts` can establish a usable Electron Store key.
- Returning `undefined` for malformed `store:get` keys and ignoring malformed `store:set` keys preserves normal valid-key behavior while preventing non-string payloads from reaching Electron Store accessors.

## Companion Sync Items Type Contract Narrowing Findings - 2026-07-12
- Companion sync items cross the Electron preload boundary as runtime data, even when normal renderer callers pass arrays built from local capture stores.
- Before Phase 287, main-process planning already treated items as `unknown` and validated array-ness locally, but preload and ambient still advertised `items: unknown[]`.
- The safe invariant is: public Companion preview/write APIs expose both settings and items as `unknown`; only planner validation can establish that items are an array of capture-like entries.
- Keeping array trust out of the ambient contract prevents the renderer type surface from claiming validation work that still belongs to the main-process planner.

## Ambient Listener Payload Runtime Narrowing Findings - 2026-07-12
- One-way main-to-renderer listener payloads still cross the preload ambient boundary as runtime data, even when main-process emitters currently send normalized values.
- Before Phase 288, ambient `onWindowModeChanged(...)` claimed trusted `WindowMode` payloads and ambient `aiReview.onProgress(...)` claimed trusted `AiReviewProgressEvent` payloads, while preload already treated progress as `unknown` and mode only as `string`.
- The safe invariant is: ambient listener callback payloads expose `unknown`; renderer consumers that need typed state must establish trust locally before writing React state or driving UI branches.
- For AI progress, a shared `isAiReviewProgressEvent(...)` guard is preferable because the progress event shape is shared across daily/weekly/monthly generation UI, and ignoring malformed events is safer than rendering partial garbage progress.

## Renderer Stored Task Payload Runtime Narrowing Findings - 2026-07-12
- Renderer task state is rebuilt from Electron Store values and cross-window `tasks:changed` broadcasts, both of which are runtime data even when normal writers pass local `Task[]` arrays.
- Before Phase 289, `loadTasks()` and `normalizeIncomingTasks(...)` cast unknown payloads into `Task` objects, so a single malformed entry could crash normalization or poison in-memory task state.
- The safe invariant is: unknown task payloads are parsed with a recursive structural guard first; only valid task-like entries are normalized and admitted into React state.
- Dropping invalid entries is preferable to failing the entire load path, because store recovery and multi-window sync should keep valid tasks usable even if one bad record exists.

## Renderer Task UI Store Value Runtime Narrowing Findings - 2026-07-12
- Task UI hydration depends on multiple Electron Store keys beyond the task array itself: selected date, active tab, daily notes, carryover ledger, retained reviews, and manual task list order.
- Before Phase 290, those keys were cast with `as` or shallow record casts, so malformed values could enter React state and affect rollover, tab restore, note maps, and retained-review sync.
- The safe invariant is: every task-UI store value is parsed with a local structural guard before hydration; invalid dates/tabs become undefined, invalid map entries are dropped, and invalid retained reviews are filtered out.
- Reusing the same carryover ledger parser in both startup hydration and business-date rollover prevents the two read paths from drifting.

## Renderer Personalization And UI Store Runtime Narrowing Findings - 2026-07-12
- Personalization settings, theme opacity overrides, and app UI flags also cross Electron Store as runtime data, even when normal writers pass local typed state.
- Before Phase 291, personalization loading cast unknown objects as partial settings, theme overrides cast as override records, and UI open/search flags used broad truthiness/`as string` coercion.
- The safe invariant is: personalization fields and theme opacity entries are established field-by-field; UI open flags require literal `true`; search query requires a real string.
- Keeping defaults for missing/invalid personalization fields is preferable to rejecting the entire settings object, so a single bad opacity value does not wipe a user's theme choice.

## Task Menu Popup URL Payload Runtime Narrowing Findings - 2026-07-12
- The task-menu popup bootstraps from a URL-encoded JSON payload, which is fully attacker/runtime controllable even when the main window normally builds it.
- Before Phase 292, the popup cast `parsed.task as Task` and coerced dark mode with `Boolean(...)`, so malformed bootstrap data could crash rendering or poison menu state.
- The safe invariant is: popup bootstrap data is parsed with a pure function; only structurally valid tasks are accepted, tags are string-filtered, and dark mode requires a real boolean.
- Returning `null` for malformed payloads is preferable to partial rendering, because the popup has no trustworthy fallback task identity for actions.

## Template Editor Kind Narrowing Without Casts Findings - 2026-07-12
- Template editor updates pass a `DailyTemplate | ReportTemplate` union into a kind-selected field writer.
- Before Phase 293, the helper cast that union into the target field and also cast settings as `Partial<...>` when reading defaults.
- The safe invariant is: settings fields are read directly, and template updates are admitted only when the structural daily/report shape matches the selected kind.
- Ignoring mismatched update payloads preserves the previous template instead of writing the wrong shape into Obsidian template settings.

## AI Review Generation Diagnostic Runtime Narrowing Findings - 2026-07-12
- AI Review generation results cross the preload boundary as runtime objects, and not every generation path advertises or returns a diagnostic.
- Before Phase 294, SettingsPanel trusted daily `result.diagnostic` directly and cast non-daily results to invent a diagnostic field, including external generation results that do not document diagnostics.
- The safe invariant is: diagnostics are optional unknown payload fields; only a structural `AiReviewRunDiagnostic` guard can establish trusted diagnostic UI state.
- Ignoring malformed or absent diagnostics is preferable to rendering partial diagnostic cards or crashing on missing nested profile/stage fields.

## Settings Select Event Value Runtime Narrowing Findings - 2026-07-12
- Settings selects write trusted app/AI configuration from DOM event strings, even though the option lists are controlled by the renderer.
- Before Phase 295, language, weekly/monthly source modes, and AI provider selects cast `event.target.value` directly into enum unions.
- The safe invariant is: select values remain untrusted strings until a local runtime guard or normalizer admits them; invalid language/provider values are ignored, and invalid source modes fall back through shared normalizers.
- Reusing shared `isAppLanguage(...)`, `isAiProvider(...)`, and source-mode normalizers keeps settings UI aligned with store/IPC normalization paths.

## Task Priority Filter Runtime Narrowing Findings - 2026-07-12
- The task priority filter is written from both a DOM select and Electron Store hydration, so both paths can feed untrusted strings into React task-view state.
- Before Phase 296, the toolbar cast select values and the UI-state loader duplicated inline enum checks.
- The safe invariant is: priority filter values remain untrusted until `isPriorityFilter(...)` admits them; invalid select or store values are ignored and leave the current/default filter unchanged.
- Sharing one guard between select handling and store hydration prevents the two write paths from drifting.

## Completion Review Status Runtime Narrowing Findings - 2026-07-12
- Completion-review status values are written from DOM selects into local dialog/edit state that later becomes persisted task review data.
- Before Phase 297, both create and edit UIs cast raw select strings into `TaskCompletionReview['status']`.
- The safe invariant is: status strings remain untrusted until `isTaskCompletionReviewStatus(...)` admits `done | partial | blocked`; invalid values leave the current status unchanged.
- Keeping the guard next to `getCompletionReviews(...)` makes completion-review runtime helpers the shared authority for review list and status trust.

## Companion Write Mode Runtime Narrowing Findings - 2026-07-12
- Companion rule write modes are written from a settings select and later revalidated when settings are normalized or used for sync planning.
- Before Phase 298, the panel cast select strings into `WriteMode`, while Electron validators duplicated the enum checks inline.
- The safe invariant is: write-mode values remain untrusted until `isWriteMode(...)` admits `append | managed-block`; invalid select values leave the current rule mode unchanged.
- Sharing one guard between UI and Electron validation keeps Companion settings trust establishment consistent across the boundary.

## Template Render Type Runtime Narrowing Findings - 2026-07-12
- Template custom-block render types are written from DOM selects into editor/recognition state that later becomes AI review template configuration.
- Before Phase 299, both template modals cast raw select strings into `RenderType`.
- The safe invariant is: render-type values remain untrusted until `isRenderType(...)` admits `text | list | table | callout | dataview`; invalid values leave the current block render type unchanged.
- Keeping the guard next to the `RenderType` union in `sectionConfig` makes template structure and UI selection share one trust authority.

## Ambient Settings Getter Return Runtime Narrowing Findings - 2026-07-12
- Settings getters cross preload as runtime IPC results even when the main process currently normalizes store values before returning them.
- Before Phase 300, ambient declarations claimed trusted app/companion/AI settings return objects, so renderer code could skip local re-validation.
- The safe invariant is: public ambient getters expose `Promise<unknown>`; renderer store wrappers and direct consumers re-establish trust with shared normalizers before React state or side effects.
- Moving Companion settings normalization into shared code lets Electron and renderer use the same authority for malformed rules/templates.

## AI Review Settings Setter Return Runtime Narrowing Findings - 2026-07-12
- AI Review settings/sections setters return main-process runtime IPC values, even when main currently normalizes before returning.
- Before Phase 301, ambient types claimed trusted `AiReviewSettings` / `SectionConfig[]` returns, inviting renderer code to trust IPC output without local revalidation.
- The safe invariant is: ambient setter returns expose `unknown`; if a caller needs typed state from a write, it must normalize locally or keep the local trusted value it already constructed.

## AI Review Generation Result Runtime Narrowing Findings - 2026-07-12
- AI Review generation and daily-inspection results cross preload as runtime IPC objects, even when main currently returns normalized shapes.
- Before Phase 302, ambient types claimed trusted result fields such as `ok`, `filePath`, `truncated`, marker arrays, and diagnostics.
- The safe invariant is: ambient generation/inspection APIs return `Promise<unknown>`; renderer readers establish a minimal trusted result shape before progress, status, and diagnostic side effects.
- Keeping diagnostic reading on the raw unknown payload preserves optional diagnostics without inventing fields on the normalized generation result.

## AI Review ListModels Result Runtime Narrowing Findings - 2026-07-12
- Model-list results cross preload as runtime IPC objects even when main currently returns the shared `ListModelsResult` shape.
- Before Phase 303, ambient types claimed a trusted success/failure union, so the AI account UI could read `ok` / `models` / `error` without local validation.
- The safe invariant is: ambient `listModels` returns `Promise<unknown>`; only `readListModelsResult(...)` can establish a trusted model-list result before UI state updates.

## Companion Preview/Write/Import Result Runtime Narrowing Findings - 2026-07-12
- Companion preview/write/import results cross preload as runtime IPC objects even when main currently returns structured plan/result shapes.
- Before Phase 304, ambient types claimed trusted `SyncPlan`, `{ ok, errors }`, and `{ ok, items, errors }` returns, so renderer actions could write plan/status/item state without local revalidation.
- The safe invariant is: ambient Companion preview/write/import APIs return `Promise<unknown>`; only shared readers establish trusted shapes before React state or status side effects.
- Malformed results must not poison plan state or merge invalid capture items; they surface a structured failure status instead.
- Sharing `isCaptureItem(...)` between Electron planning and renderer import parsing keeps capture-item trust establishment consistent across the boundary.

## Obsidian Sync Preview Result Runtime Narrowing Findings - 2026-07-12
- Settings sync preview results cross preload as runtime IPC objects even when main currently returns structured `SyncPreview` shapes.
- Before Phase 305, ambient types claimed a trusted `SyncPreview` return, so renderer code could write settings preview state without local revalidation.
- The safe invariant is: ambient `previewTasksToObsidian` returns `Promise<unknown>`; only `readSyncPreview(...)` establishes a trusted preview before React state updates.
- Empty or malformed previews collapse to `null` preview state rather than poisoning settings UI with invalid file/block shapes.

## Window Mode Return Runtime Narrowing Findings - 2026-07-12
- Window-mode getter/setter results cross preload as runtime IPC values even when main currently returns trusted modes.
- Before Phase 306, ambient types claimed trusted `WindowMode` returns, so TitleBar could compare pin state without local revalidation.
- The safe invariant is: ambient `getWindowMode` / `setWindowMode` return `Promise<unknown>`; only `readWindowMode(...)` / `isWindowMode(...)` establish a trusted mode before UI side effects.
- Event payloads were already `unknown`; TitleBar now uses the same reader for both event and invoke paths.

## AI Review Backfill Result Runtime Narrowing Findings - 2026-07-12
- Backfill results cross preload as runtime IPC objects even when main currently returns structured processed/filled/errors reports.
- Before Phase 307, ambient types claimed a trusted backfill report return, so renderer lifecycle code could later read report fields without local revalidation.
- The safe invariant is: ambient `aiReview.backfill` returns `Promise<unknown>`; only `readAiReviewBackfillReport(...)` establishes a trusted report shape.
- Even fire-and-forget lifecycle call sites should parse the unknown return so malformed payloads never become an implicit trusted contract.

## AI Review Template Tools Result Runtime Narrowing Findings - 2026-07-12
- Template recognition and source-materials results cross preload as runtime IPC objects even when main currently returns stable structured shapes.
- Before Phase 308, ambient types claimed trusted recognition/source-materials result objects, so future renderer consumers could read fields without local validation.
- The safe invariant is: ambient `recognizeTemplate`, `recognizeReportTemplate`, and `testSourceMaterials` return `Promise<unknown>`; shared readers establish trusted result shapes before any renderer side effects.
- These APIs currently have little or no renderer consumption, so the phase hardens the contract ahead of future UI use instead of waiting for a state write bug.

## Obsidian Sync/Open Result Runtime Narrowing Findings - 2026-07-12
- Obsidian path, sync, preview, and open-daily-note results cross preload as runtime IPC values even when main currently returns stable structured shapes.
- Before Phase 309, ambient declarations still claimed trusted path/action/preview returns, so renderer wrappers and settings actions could read fields without a local trust boundary.
- The safe invariant is: ambient Obsidian path/sync/preview/open APIs return `Promise<unknown>`; browser-safe readers establish path strings, action results, and sync previews before React state or hook exposure.
- Malformed preview results collapse to `undefined`/empty preview state, while malformed sync/open action results stay out of typed task-store wrapper results.

## Obsidian Template Recognition Result Runtime Narrowing Findings - 2026-07-12
- Obsidian template recognition and file-picker results cross preload as runtime IPC objects even when Electron currently returns stable structured shapes.
- Before Phase 310, ambient declarations claimed trusted recognition drafts and picker file payloads, so `ObsidianTemplateCenter` could read `draft`, `text`, and `fileName` directly from untrusted IPC returns.
- The safe invariant is: ambient recognition/picker APIs return `Promise<unknown>`; shared readers establish trusted recognition drafts and picker payloads before renderer state updates.
- Malformed picker results become a failure status, and malformed recognition results never enter `recognizedDraft`, preventing invalid module maps or unmapped sections from poisoning template UI state.

## Window Settings Mode Return Runtime Narrowing Findings - 2026-07-12
- Settings-mode set results cross preload as runtime IPC objects even though the main process currently returns `{ ok: true, width }` shapes for window resizing paths.
- Before Phase 311, ambient declarations claimed a trusted `{ ok: boolean; width?: number }` result for `setSettingsMode(...)`, while renderer code only invoked it fire-and-forget through `syncSettingsMode(settingsOpen)`.
- The safe invariant is: ambient `setSettingsMode(...)` returns `Promise<unknown>`; if a future renderer path needs the returned width, it must add a local reader before using IPC fields.
- Keeping the structured main-process return internal to the IPC boundary avoids turning an ignored implementation detail into a trusted renderer contract.

## Settings Setter Return Runtime Narrowing Findings - 2026-07-12
- App, Obsidian template, and Companion settings setter results cross preload as runtime IPC objects even though the main process currently returns `{ ok: true }` after persistence.
- Before Phase 312, ambient declarations claimed trusted `{ ok: boolean }` returns for `setAppSettings(...)`, `setObsidianTemplateSettings(...)`, and `setCompanionSettings(...)`, while renderer paths either ignore the result or keep the local settings object as the trusted state source.
- The safe invariant is: ambient settings setters return `Promise<unknown>`; if a future renderer path needs write confirmation fields, it must add a reader before checking `ok`.
- The app-state accessor verifier should protect the current shared `normalizeCompanionSettings(...)` trust boundary rather than older direct default-factory implementation details.

## Window/System Boolean Return Runtime Narrowing Findings - 2026-07-12
- Window/system boolean IPC results cross preload as runtime values even when the current main-process handlers return strict booleans.
- Before Phase 313, ambient declarations still claimed trusted `Promise<boolean>` returns for always-on-top, lock-position, compact-mode, and auto-start APIs, which allowed renderer state writes to skip local narrowing.
- The safe invariant is: ambient boolean-result APIs return `Promise<unknown>`; UI code writes state only after `value === true` or a direct `typeof value === 'boolean'` guard.
- AutoStart setter results represent the normalized enabled state, not a generic success flag, so the settings toggle should set local state from the returned strict boolean interpretation rather than `if (ok) setAutoStart(enabled)`.
- Keeping `setWindowCompactMode(...)` as `Promise<void>` remains acceptable because the renderer persists compact mode fire-and-forget and reloads compact state through the separately narrowed getter path.

## Template FileReader Result Runtime Narrowing Findings - 2026-07-12
- File uploads in `TemplateRecognitionModal` read runtime DOM data before it becomes trusted template-recognition text.
- Before Phase 314, the file loader cast `FileReader.result` to `string` and wrote it directly into React state, even though the platform type can also be `ArrayBuffer` or `null`.
- The safe invariant is: textarea state receives only a confirmed string result; malformed or unexpected reader payloads collapse to an empty string instead of entering recognition parsing.

## Speed Mode Findings - 2026-07-12
- The cleanup pass has been correct but too granular for the user's desired speed.
- Low-risk runtime-narrowing work should now be batched by category, with fewer documentation words and checkpoint verification instead of full per-seam ceremony.

## Batched Renderer And Shared Cast Runtime Narrowing Findings - 2026-07-12
- Several remaining casts were local trust-boundary shortcuts rather than behavior changes: report template reset kind, AI source mode normalization, Companion settings object reads, and task-order source keys.
- The safe invariant is: runtime strings/objects/keys are admitted only through small guards (`isReportTemplateKind`, source-mode guards, record guard, `isTaskSource`) before becoming typed app state.
- Batching these small guard fixes cuts verification overhead: use focused scripts for each touched area plus one TypeScript checkpoint; defer build unless shared type changes are broad or UI/runtime behavior changes are larger.

## Template And AI Review Cast Batch Narrowing Findings - 2026-07-12
- Template/AI Review shared code still had several low-risk casts around enum-like runtime data: marker keys, render types, parsed JSON records, fixed-block ids, and `Object.keys` / `Object.entries` iteration.
- The safe invariant is: marker keys come from `REVIEW_MARKER_KEYS`, render types come from `RENDER_TYPES`, and external/parsed values become typed only after small runtime guards (`isReviewMarkerKey`, `isRenderType`, `isFixedBlockId`, record checks, confidence checks).
- UI render-type selects should map the canonical `RENDER_TYPES` list instead of casting `Object.entries(RENDER_TYPE_LABELS)`; this keeps option order explicit and removes renderer-only trust shortcuts.
- Under speed mode, this category is a good batch shape: add RED assertions to existing focused scripts, patch all tiny casts together, then run focused verifiers plus `typecheck`; defer `build` unless the batch changes broader runtime behavior.

## Electron AI Review Runtime Cast Batch Narrowing Findings - 2026-07-12
- The model-list IPC handler already treated `cfg` as runtime data, but a local `cfg as { baseUrl; apiKey; provider }` cast still let object shape trust appear before field-level narrowing.
- The daily runner receives tasks only after the AI Review IPC task-payload guard has accepted them; because `ElectronTask` structurally satisfies the smaller `StatTask` needs, the runner can pass tasks directly without a `tasks as StatTask[]` cast.
- The safe invariant is: unknown IPC config becomes readable only after an object guard, while validated task arrays should preserve their established type instead of being recast at downstream call sites.

## Obsidian Template/App Settings Cast Batch Narrowing Findings - 2026-07-12
- Legacy Obsidian template compatibility still needs old field support (`dailyNotePath`, `modules.*.enabled`, section titles, template strings), but those fields should be read from a runtime record rather than by casting the whole settings object to `any`.
- Fixed/custom daily blocks are already typed through `DailyTemplate`; compat title fallbacks can use typed `find(...)` helpers instead of `(b: any)` scans.
- Template-center module normalization is safer when seeded from `createDefaultModules()` and overwritten after per-module object/string/boolean narrowing, avoiding an empty-object accumulator cast while preserving defaults.
- Under speed mode this is a good batch boundary: template-center/app-settings/daily-template compat all share the same runtime record/string/boolean trust pattern and can be verified with focused template scripts plus `typecheck`.

## Shared Reader Record Guard Cast Narrowing Findings - 2026-07-12
- `readListModelsResult(...)` and `isAiReviewProgressEvent(...)` already rejected non-object payloads, but each still used a local `value as Record<string, unknown>` cast before field reads.
- The safe invariant is: runtime payloads become readable records only through object guards, then existing per-field checks decide whether the value becomes a trusted model-list result or progress event.
- This is a small speed-mode batch: no public result shape changes, focused verifier assertions plus `typecheck` are sufficient; build remains deferred until a broader checkpoint.

## Task Context Menu Record Guard Cast Narrowing Findings - 2026-07-12
- Task context menu open/action payloads cross IPC as runtime values even though the current renderer sends stable popup payload shapes.
- The safe invariant is: menu payloads become readable records only through object guards; `taskId`, coordinates, tag arrays, and nested `updates` are then checked field by field before forwarding or applying actions.
- This is a good speed-mode batch because the behavior surface stays unchanged and existing focused menu IPC/helper verifiers plus `typecheck` cover the touched trust boundary.

## Task Menu Popup Action Cast Narrowing Findings - 2026-07-12
- Popup special actions are an internal renderer-to-IPC convention, but casting them through `unknown` and then `Partial<Task>` hid that convention from TypeScript.
- The safe invariant is: ordinary task updates and popup action commands are both explicit local update variants before they cross `dispatchTaskMenuAction(...)`; the receiver still narrows the IPC payload as runtime data.
- Existing context-menu and task-menu helper verifiers cover this small batch; `typecheck` is enough as the checkpoint.

## Renderer DOM Event Target Guard Narrowing Findings - 2026-07-12
- DOM event targets are runtime `EventTarget | null`; direct casts to `HTMLElement` or `Node` skip platform shape checks before `tagName`, `contains(...)`, or `closest(...)` reads.
- The safe invariant is: keyboard typing detection requires `event.target instanceof HTMLElement`, containment checks require `Node`, and selector traversal requires `Element`.
- This is a low-risk speed-mode batch because behavior is unchanged for real DOM targets and malformed/non-node targets now fall through safely.

## Renderer Element Guard Cast Narrowing Findings - 2026-07-12
- Priority popover outside-click handling and floating-scrollbar header measurement both read DOM runtime values before invoking DOM-specific APIs.
- The safe invariant is: outside-click containment needs `event.target instanceof Node`; selector results need `instanceof HTMLElement` before layout fields such as `offsetHeight`.
- This is a low-risk speed-mode batch because normal DOM behavior is unchanged and unexpected targets/elements fall back to closing or zero header offset safely.

## Shared Membership Guard Cast Narrowing Findings - 2026-07-12
- Literal-array membership guards should not widen tuples with `as string[]` just to call `includes(...)`.
- The safe invariant is: precompute a `Set<unknown>` from the canonical typed list and use `.has(value)` inside the type predicate.
- This preserves runtime behavior for template custom tokens and AI providers while removing the local array-widening casts.

## Local Cast Bridge Narrowing Findings - 2026-07-12
- Some remaining renderer casts are local TypeScript escape hatches rather than runtime parsing boundaries: CSS style property copying, diagnostic window field access, and small tuple lists for rendering settings controls.
- The safe invariant is: typed property lists should index CSS declarations directly, app-owned window diagnostics should be declared on `Window`, and render tuple collections should be typed at declaration instead of cast after construction.
- This batch is low-risk under speed mode because it changes no user-facing behavior and is covered by focused structure scripts plus `typecheck`; production build can remain deferred until a broader checkpoint.

## CSS Custom Property And Error-Code Cast Narrowing Findings - 2026-07-12
- React `CSSProperties` does not directly include app-specific CSS variables, but each component can define a small intersection type for the exact custom properties it owns instead of casting object literals.
- The safe invariant is: `TaskStackSegmentStyle` owns `--task-stack-segment-count`, `ThemePresetPreviewStyle` owns the theme preview CSS variables, and neither helper needs a return-object cast.
- Companion filesystem errors are already runtime values; the existing `isObject(...)` guard is sufficient before checking `error.code === 'EEXIST'`.

## TaskList DnD Activator Cast Narrowing Findings - 2026-07-12
- dnd-kit already exposes the correct activator shapes: `DraggableAttributes` and `DraggableSyntheticListeners`.
- The safe invariant is: `SortableTaskItem` should pass dnd-kit activators through unchanged, and `DragHandleButton` remains the only place that spreads them onto the button.

## Obsidian Template/Sync Any-Cast Narrowing Findings - 2026-07-12
- Template rendering only needs a small task shape: id, text, completion state, priority, dates, optional tags, completion reviews, and recursive subtasks.
- The safe invariant is: Electron task arrays are trusted only after `hasValidObsidianSyncTasks(...)` narrows `unknown` to `ObsidianSyncTask[]`; downstream template helpers then accept that structural task shape without recasting to `any`.
- Legacy template module flags and daily paths still need compatibility reads, but those reads should go through local object/string/boolean guards instead of treating the whole settings object as `any`.

## Personalization Appearance Override Cast Narrowing Findings - 2026-07-12
- Theme appearance override extraction iterates a runtime key list, but each key still maps to a precise `PersonalizationSettings[K]` value type.
- The safe invariant is: dynamic assignment should preserve that key/value relationship through a small generic helper instead of forcing values through `never`.
- This is low-risk because it only changes TypeScript trust expression; runtime behavior remains the same field copy for defined theme appearance values.

## Win32 Native Material Capability Cast Narrowing Findings - 2026-07-12
- Electron's `setBackgroundMaterial(...)` is an optional capability at this project boundary, so the helper should probe for the method before calling it rather than widening every `BrowserWindow` with an intersection cast.
- The safe invariant is: native material disabling runs only after `hasNativeBackgroundMaterial(...)` confirms the method exists; unsupported Electron versions keep the existing unavailable diagnostic path.
- This preserves the existing progressive-enhancement behavior while removing the final meaningful production cast from the current scan.

## Task List Order Parser Reuse Findings - 2026-07-12
- Stored task-list ordering is both persisted runtime data and the basis for display/reorder operations, so its source-key and id-array normalization belongs with `src/utils/taskOrdering.ts`.
- The safe invariant is: invalid sources, non-array order collections, and non-string task ids are discarded before callers receive `TaskListOrderByDate`.
- `taskPersistence` retains its existing exported parser name as a thin wrapper, keeping callers stable while removing duplicated parsing logic.

## Companion Validator Reuse Findings - 2026-07-12
- Companion rule/template validation is shared runtime-domain behavior and already belongs in `shared/obsidianCompanion.ts`.
- The Electron planner should compose its planning-settings guard from the shared `isCompanionRule(...)` and `isCompanionTemplate(...)` validators, while keeping its local object guard for unrelated filesystem/path/error inputs.
- This removes drift risk without changing accepted settings or planner behavior.

## Task Completion-Review Validator Reuse Findings - 2026-07-12
- Stored tasks and retained Obsidian review records both validate the same completion-review payload shape.
- `taskTransforms` is the natural owner because `isTaskLike(...)` already needs the predicate for task payloads; persistence can then reuse it when validating retained records.
- This preserves accepted/rejected persisted data while preventing divergent copies of the review status, finite percent, and required text-field rules.

## Shared Task-Date Resolver Reuse Findings - 2026-07-12
- Task-date selection has one stable precedence rule: explicit `taskDate`, then the date portion of `createdAt`, then a caller-selected fallback.
- The fallback is deliberately owned by the caller: task state uses the business day, navigation and Electron use the local calendar day, and Obsidian templates use an empty value.
- A small structural source type in `shared/taskRollover.ts` removes duplicated precedence chains without introducing renderer-to-Electron type dependencies or changing fallback semantics.

## AI Stats Task-Date Resolver Reuse Findings - 2026-07-12
- AI statistics intentionally treat undated tasks as out of range, so its fallback remains the empty string.
- The private `dateOf(...)` adapter keeps that domain intent visible while delegating the task-date precedence rule to the shared resolver.

## Companion Capture Task-Date Resolver Reuse Findings - 2026-07-12
- Desktop Companion capture uses the same explicit-date then creation-date precedence as task views and exports.
- Its empty fallback is intentional: a malformed task without either date must not be silently captured under the user's currently selected day.

## Shared Date-Key Local-Date Conversion Findings - 2026-07-12
- Path-template consumers need a local-calendar interpretation of date keys; `new Date('YYYY-MM-DD')` alone is unsuitable because its timezone interpretation can shift the rendered day.
- `pathTemplate.ts` is the appropriate owner because both consumers immediately pass the result to `expandPathTemplate(...)`.

## LLM IPC Result-Contract Tightening Findings - 2026-07-12
- Every tightened dependency ultimately delegates to `callChatCompletion(...)`, whose stable result contract is `LlmResult`.
- The IPC handlers already branch on `ok` and read either `content` or `error`, so `Promise<any>` was only suppressing useful compiler checking at an integration boundary.
- Diagnostic aggregation was traced through daily, weekly, and monthly report generation and is consistently populated with `LlmResult[]`; it can safely use the same contract.

## Mobile Inbox JSON Root Validation Findings - 2026-07-12
- JSON parsing produces `unknown` at the mobile file boundary; a successful parse does not mean it is a capture record.
- The inbox importer already owns an object guard, so requiring an object root preserves all existing object-field normalization while giving arrays, primitives, and `null` a clear failure path into `_failed`.

## LLM Non-Streaming JSON Boundary Findings - 2026-07-12
- Non-streaming provider responses are network data. `JSON.parse(...)` must enter the client as `unknown` even while the existing provider-specific compatibility extractors retain their deliberate broad-shape handling.
- This isolates the raw boundary without changing OpenAI, Anthropic, or Gemini content, truncation, and usage behavior; tightening each extractor is a separate compatibility-sensitive follow-up.

## LLM Model-List Response Validation Findings - 2026-07-12
- `/models` is a separate network boundary because it consumes `Response.json()` directly rather than the chat-completion text path.
- The stable parser contract is `unknown -> string[]`: validate the top-level response record and each model entry, then preserve the existing behavior of ignoring malformed entries before de-duplication and sorting.

## LLM SSE Event-Boundary Findings - 2026-07-12
- SSE payload JSON is untrusted network data just like non-streaming response JSON; `parseSse(...)` therefore returns `unknown[]` rather than `any[]`.
- Each provider has a different stream envelope, so record and array narrowing belongs in its own aggregator: Anthropic reads `delta`, Gemini reads `candidates[0].content.parts`, and OpenAI reads `choices[0]` plus top-level compatibility fields.
- This preserves existing accepted stream shapes, including OpenAI-compatible fallback fields and whitespace-preserving chunk concatenation, while malformed event values become inert rather than implicitly trusted.

## OpenAI-Compatible Text Extraction Findings - 2026-07-12
- The compatibility extractor has a narrow responsibility: accept strings plus arrays of string or object segments, and concatenate only explicit `text` or `content` strings.
- Choice, delta, message, and top-level response envelopes require independent record narrowing; malformed values resolve to no text rather than leaking untyped field reads.
- Keeping the existing field order preserves support for OpenAI-compatible relays while the chunk-specific path continues to preserve leading and trailing whitespace before final result trimming.

## Provider Response Parser-Contract Findings - 2026-07-12
- `ProviderRequest.parse(...)` and `truncated(...)` are the actual non-streaming network-response interface; they must accept `unknown`, not merely rely on an earlier local `unknown` declaration.
- Anthropic and Gemini preserve their existing behavior by accepting only array-shaped text parts and extracting only explicit string `text` entries. OpenAI preserves relay compatibility by retaining its existing choice-first then top-level fallback extraction.
- Provider-specific truncation remains an exact string comparison after narrowing the relevant response record and first candidate/choice record.

## LLM Usage-Diagnostics Boundary Findings - 2026-07-12
- Token usage is network data even though it only feeds diagnostics; it must be narrowed before numeric conversion and provider-specific field reads.
- Usage-only SSE detection requires two independent checks: an event with a usage record and empty `choices`, plus the absence of usable OpenAI-compatible text in every event.
- Malformed events and malformed usage records now contribute no diagnostics rather than throwing, while valid OpenAI, Anthropic, and Gemini usage mappings preserve their existing output semantics.

## Task-Menu Multi-Display Placement Findings - 2026-07-12
- Popup trigger coordinates are global screen coordinates, so clamping against `screen.getPrimaryDisplay()` can place a menu opened on a secondary monitor at the primary monitor edge.
- Normalize malformed coordinates using the primary display center, then use `screen.getDisplayNearestPoint(...)` to select the correct work area for clamping.
- The context-menu verifier had a stale assertion for a removed inline scheduled-date expression; current date visibility is correctly owned by `getTaskVisibleDates(...)` and `taskAppliesToDate(...)`.

## Template Recognition Duplicate Heading Findings - 2026-07-12
- A Markdown template can contain repeated H2 names, but `CustomBlock.name` is the user-facing configuration identity and duplicate names produce ambiguous editor and renderer behavior.
- Keep the first matching H2 because document order is deterministic, skip later duplicates, and surface the lossy recognition through `medium` confidence so the user can review the imported blocks.

## Daily AI Review Snapshot Reuse Findings - 2026-07-13
- A single daily AI review needs the same pre-write file content for managed-block inspection, diagnostic source length, and review generation. Reading it separately for each stage creates avoidable synchronous I/O.
- A reusable snapshot must carry both content and the file stamp used by the final atomic replacement. The stamp must be captured before and after the content read and rejected if it changes, otherwise an external edit could pair stale content with a newer stamp.
- `atomicReplace` still verifies the snapshot stamp immediately before replacing the file, preserving protection against edits made after inspection.

## Obsidian Template Task-Line Module Findings - 2026-07-13
- Daily-note template assembly and task-line rendering are separate responsibilities: template assembly owns managed block placement, while task-line rendering owns visible task/review selection, sorting, escaping, and completion-review template expansion.
- `shared/obsidianTemplateTaskLines.ts` is the narrower boundary because it depends only on a small structural task shape and Obsidian template settings, avoiding a renderer `Task` dependency in `shared/obsidianTemplates.ts`.
- Sync preview task/review counts can reuse the same visibility traversal without flattening the task tree repeatedly, while `shared/obsidianTemplates.ts` remains responsible for managed marker/file preview composition.

## Companion Capture Item Builder Extraction Findings - 2026-07-13
- `src/store/taskStore.ts` mixed Electron/window-facing persistence wrappers with pure desktop Companion `CaptureItem` construction.
- `src/store/companionCaptureItems.ts` now owns selected-date task filtering plus daily work/inspiration capture assembly, while reusing the shared task-date resolver.
- `taskStore.ts` retains the prior `buildCaptureItems` public path as a compatibility re-export, so App composition and existing callers stay unchanged.

## App UI-State Load Snapshot Extraction Findings - 2026-07-13
- `appUiStatePersistence.ts` mixed asynchronous Electron/React hydration coordination with pure parsing of a batched unknown Store payload.
- `appUiStateLoadSnapshot.ts` now owns strict boolean/string/filter parsing, loaded personalization normalization, and the exact baseline Store snapshot used before persistence effects become active.
- Theme overrides retain their prior two-stage semantics: the baseline starts from the loaded payload, while the React-state updater still merges that payload over the current override state so existing precedence is unchanged.

## Obsidian No-Op Sync Write Findings - 2026-07-13
- The daily task block embeds a user-visible sync timestamp. Rebuilding it on every sync makes otherwise equal generated content differ and bypasses the existing whole-file equality guard.
- `replaceManagedBlock(...)` also normalizes surrounding whitespace. Calling it for an unchanged block reassembled the whole note and accumulated trailing newlines, creating a second independent reason for a no-op sync to write.
- Comparing the existing and next complete marker blocks inside the sync orchestrator preserves the generic template helper behavior while avoiding needless disk writes. Reusing the previous timestamp only when the substantive task block matches retains a meaningful updated timestamp when task data changes.
- Because follow-up overview refresh and daily AI review are gated by `didWrite`, eliminating the physical no-op write also prevents those downstream jobs from starting.

## Renderer No-Op Obsidian IPC Findings - 2026-07-13
- Avoiding a main-process write is not enough when the renderer still transfers, validates, and traverses the full nested task tree after every UI-only state transition.
- The Markdown task renderer consumes task identity, text, completion, priority, creation/task/completion dates, tags, completion reviews, and nesting. It does not consume renderer-only visibility flags such as `collapsed`, `cleared`, or `isToday`.
- A successful sync can retain its complete daily-note input as an equivalence baseline. The `beforeTasks` snapshot must not participate in this equivalence decision: it is only relevant once a current content change needs cross-date cleanup, and comparing it would prevent benign UI-only changes from being skipped after prior task edits.

## Collapsed Subtask Render Work Findings - 2026-07-13
- `TaskItem` keeps `useVirtualSubtasks(...)` mounted for hook-order stability, but `TaskSubtasksViewport` is conditionally mounted only while the parent is expanded.
- Before the short circuit, every collapsed parent with direct subtasks still allocated a `VirtualSubtaskItem` for each child on relevant parent renders. For ordinary lists this was a full `map`; for virtual lists it still sliced and mapped a viewport window that had no consumer.
- Returning an empty item array while collapsed preserves expand behavior and removes this otherwise invisible per-parent work. Including `isExpanded` in the memo dependencies ensures the original derivation runs immediately when the viewport becomes mountable.

## Floating Scrollbar Header Metric Caching Findings - 2026-07-13
- `useFloatingScrollbar(...)` is used for the app-level scroll container with `.app-top` as its fixed header and for task lists without a header. The header is inside the app scroll container, but observing the container does not reliably report an internal header-height change.
- The scroll handler already coalesces layout to one animation frame, yet each executed app-level layout frame previously called `querySelector('.app-top')` and read `offsetHeight` twice through separate layout and metric helpers.
- Resolving the header once per hook lifetime and caching its height removes those repeated DOM selector/layout reads from the scroll and pointer-drag hot paths. An optional header-specific `ResizeObserver` refreshes the cache and schedules the existing coalesced layout, preserving visual placement when header content changes.

## AI Review Deferred Persistence Findings - 2026-07-13
- Main-process AI Review settings handling already avoids rescheduling timers when normalized settings are equal, but renderer-side delayed input persistence still paid the IPC and payload-serialization cost when an input returned to its persisted value before debounce expiry.
- The delayed persistence helper has no other production caller. Supplying an optional persisted baseline and equality function retains the helper's generic behavior while allowing a settings owner to cancel a reverted update.
- The equality helper remains in renderer code. Importing `electron/storeValueEquality.ts` into `SettingsPanel` would couple the renderer bundle to Electron process code.
- Loaded AI Review settings are asynchronous, so the settings owner keeps an explicit ref in sync with both loaded and immediately saved values. That ref is the baseline supplied when deferred text persistence begins.

## Task Persistence Restored-State IPC Findings - 2026-07-13
- The task-tree Store IPC carries the full nested task structure, so the main-process equality guard cannot avoid renderer-side serialization and cross-process transfer when a local edit returns to the last saved tree before its debounce expires.
- A renderer-local persisted baseline plus `areTaskListsEqual(...)` allows the deferred helper to cancel that no-op write while preserving normal coalescing for genuinely changed trees.
- Incoming task broadcasts invalidate the local baseline. Calling `reset()` rather than only `discard()` is required because the received tree could otherwise happen to equal an old local snapshot and suppress a later legitimate save.

## Completion Review No-Op Mutation Findings - 2026-07-13
- `updateTaskReview(...)` is a task-tree mutation boundary, so allocating a new task for `{}` or an update that reproduces existing review fields propagates farther than the local editor: `mapTaskTree(...)` replaces ancestor references and downstream persistence/sync hooks treat the tree as changed.
- Comparing only the fields explicitly provided by `TaskReviewUpdates` preserves partial-update semantics, including intentional empty strings and zero percentages, while avoiding allocation when all supplied values are unchanged.
- The no-op return is safe for legacy single-review tasks because lookup still occurs through the same normalized review list; actual updates preserve the existing migration path to `completionReviews`.

## Task Metadata Collection No-Op Findings - 2026-07-13
- `TaskMenuPopup` deliberately normalizes scheduled dates and tags into freshly allocated arrays, so reference equality at the generic task-field boundary is insufficient to recognize an unchanged user result.
- Ordered element comparison is appropriate for these two fields: dates are sorted before dispatch, tag order is visible in the UI, and a reordered collection is therefore still a meaningful update.
- Restricting structural comparison to `tags` and `scheduledDates` avoids changing the semantics of arbitrary complex `Partial<Task>` fields while blocking the complete no-op task-tree -> Store IPC -> Obsidian-sync chain for menu resaves.

## Loaded Task UI State Startup IPC Findings - 2026-07-13
- Store-loaded UI state is a valid renderer-side persistence baseline because the renderer has just received the exact values that its effect would otherwise write back through `setStoreMany`.
- The baseline must be established before `setIsLoaded(true)`; priming afterward is too late because the first persistence effect can already schedule its debounce timer.
- `currentDate: initialState.today` and `activeTab: initialState.activeTab || 'today'` match the existing initialization defaults, so the primed snapshot has the same shape as the rendered post-load state.

## Loaded Task And Carryover Startup IPC Findings - 2026-07-13
- Startup task-tree persistence must distinguish a true Store-loaded baseline from carryover output that repaired legacy task fields or generated inherited tasks. Priming only the unchanged result removes the redundant full-tree IPC without suppressing necessary writeback.
- The carryover ledger has the same split: parsed legacy data and newly inherited task ids can make a write necessary, but an unchanged parsed ledger should not be sent back to Store.
- Returning explicit persistence facts from `loadInitialTaskState()` keeps the initialization effect simple and makes the writeback decision depend on data, rather than on incidental React state timing.

## Business-Date Rollover No-Op Findings - 2026-07-13
- A date transition must still run carryover logic because the next business date can introduce inherited tasks, but its result can be structurally identical when no carryover candidate exists and every task is already normalized for the target date.
- Preserving the prior task-array reference prevents the task persistence and Obsidian-sync effects from treating an equal rollover result as a user-visible task change.
- Comparing the parsed ledger before `setStore` removes the associated renderer-to-main IPC while preserving writeback for newly recorded carryover ids.

## TaskMenuPopup Pane Module Findings - 2026-07-13
- `TaskMenuPopup.tsx` had two distinct responsibilities: bootstrapping a small Electron popup route from URL payload/theme/window effects, and implementing the actual menu/date/tag/subtask pane UI.
- The pane UI has a narrow dependency surface: it needs a structural `Task`, date-key helpers, a dispatch callback, and a close callback. Passing those callbacks in keeps IPC and `window.electronAPI` access in the popup shell.
- Re-exporting `getTagSuggestions(...)` from `TaskMenuPopup.tsx` preserves existing callers while moving the filtering behavior next to the tag pane that owns it.
- Combining the entry file and pane module in the context-menu verifier keeps existing behavior assertions intact while adding a large-file boundary check for both modules.

## Retained Review Empty-Write IPC Findings - 2026-07-13
- `syncDeletedReviewsToObsidian` controls whether deleted completion reviews can remain in renderer state. Re-saving settings while the option keeps its clearing behavior must not recreate an empty state array or transfer another empty Store payload.
- A functional state setter can determine this from the authoritative current list: returning `previous` preserves React reference stability, while a non-empty list still performs the existing clear-and-persist operation.
- The main process can reject an equal Store value later, but renderer-side short-circuiting avoids the IPC message and serialization entirely.

## Duplicate App-Settings Submission Findings - 2026-07-13
- Settings controls can construct a fresh `AppBehaviorSettings` object even when the user has not changed a persisted behavior field. Main-process Store equality prevents a physical write but cannot prevent renderer state work, IPC transfer, or normalization.
- The behavior settings contract is nine scalar fields, so an explicit field comparison is clearer and less coupled than sharing the Electron Store's generic unknown-value comparison with renderer code.
- Retained-review cleanup remains before the settings equality guard because it is governed by the submitted sync flag and may still be required for older in-memory data even on an otherwise identical settings submission.

## App UI State Startup Hydration Persistence Findings - 2026-07-13
- App UI state is loaded asynchronously, while the persistence effect runs once with renderer defaults. Without a hydration barrier, that first effect can transfer default panel/filter/personalization values to Store before the saved snapshot is applied.
- A loaded snapshot is a valid persistence baseline, but it must use the same payload construction as normal persistence. Sharing the builder prevents false differences caused by missing personalization fields or differently shaped entries.
- Compact mode is loaded through a separate IPC call, so it establishes its baseline as soon as that response arrives; this prevents a late compact-mode response from being written back as a false local change.

## Companion Settings Duplicate Submission Findings - 2026-07-13
- Companion configuration includes nested rule and template arrays, so reference equality is not sufficient when settings controls construct a new object on submit.
- Main-process Store equality can avoid the disk write only after the IPC transfer; renderer-side structural equality avoids both the React state replacement and the serialized settings IPC payload.
- The equality helper belongs with the normalized shared Companion contract, allowing renderer and future non-Electron consumers to share the same semantics without importing Electron implementation code.

## ReviewView Grouping Module Findings - 2026-07-13
- `ReviewView.tsx` had a clean split between pure data preparation and UI behavior: date-key calculation, grouping, and timestamp formatting do not need React state or form handlers.
- `src/components/reviewView/reviewGrouping.ts` is the narrow boundary because it depends only on `Task`, `TaskCompletionReview`, and `getCompletionReviews(...)`, while `ReviewView.tsx` keeps expansion state, animation, and edit/delete callbacks.
- Keeping the existing bucket-append strategy inside the helper preserves the already-verified no-copy grouping behavior while allowing the component file to drop below the large-file threshold.

## AI Review Profile Module Findings - 2026-07-13
- `shared/aiReview/aiReviewSettings.ts` mixed two separable concerns: the full persisted AI Review settings shape and the account/profile subdomain used by renderer settings, report routing, and Electron runtime checks.
- `shared/aiReview/aiReviewProfiles.ts` is the narrow profile boundary because it can own provider guards, max-token normalization, profile normalization, active-profile fallback, and report-profile routing through a small structural settings interface instead of depending on the entire settings module.
- Re-exporting profile APIs from `aiReviewSettings.ts` preserves existing imports while moving the implementation out of the large settings file, reducing the production large-file count without changing caller behavior.

## Personalization No-Op Update Findings - 2026-07-13
- Personalization controls can submit a new object even when every persisted field is unchanged. Reference inequality alone therefore causes avoidable React state replacement and theme-override allocation.
- The no-op guard must compare the complete `PersonalizationSettings` shape, not only opacity fields: a color, density, theme, window-mode, or font-scale change is still a meaningful state transition.
- Returning before both setters is safe because `rememberThemeOverride(...)` is derived solely from the submitted personalization value. A structurally equal value would recreate the same override payload without changing observable state.

## Theme Preset And Reset No-Op Findings - 2026-07-13
- Theme presets are derived from a preset plus a stored opacity override, so applying the active preset can yield an equivalent personalization object even when its reference differs.
- Reset builds a copied override map before deleting the active theme key. Equality must therefore examine both the target personalization and the target override map; checking only the personalization would still allocate and replace an equal override map.
- The reset guard remains conservative: either a visible personalization difference or an existing override causes the original reset state updates to run.

## Hydrated Theme Override State Consolidation Findings - 2026-07-13
- UI-state hydration previously performed two sequential theme-override updates: first add the personalization-derived opacity entry, then merge Store-loaded entries. The second update always sees the first result, so the intermediate state has no user-facing value.
- A pure helper can compute the same precedence in one pass: loaded personalization seeds the existing map, Store-loaded overrides then take precedence, and structural equality preserves the previous state reference when the result matches it.
- The hydration persistence baseline must use the same merged result as the state updater; otherwise the first persistence effect could incorrectly consider the loaded state dirty.

## TitleBar Pinned-State Refresh Deduplication Findings - 2026-07-13
- Window focus and visibility notifications can occur repeatedly without a window-mode transition. Calling a React boolean setter on every notification still incurs update scheduling work even though the view cannot change.
- A ref is the appropriate local baseline because all pinned-state mutations in `TitleBar` pass through the same helper. It prevents redundant setter calls rather than merely returning the prior value inside a scheduled functional update.
- The guard must remain after `readWindowMode(...)` and the toggle result's boolean check, so untrusted preload values continue to be narrowed before affecting renderer state.

## Startup Settings Equivalent-State Elimination Findings - 2026-07-13
- Startup must still request Companion and template settings from Electron: default-looking settings can differ in future persisted fields or be produced from a changed vault context. The optimization belongs at the renderer state boundary, not by skipping the IPC read.
- Default configuration factories create nested arrays and objects, so reference equality cannot identify equivalent IPC responses. Companion already provides a complete shared equality function; template settings needed an equivalent reusable contract in `shared/appSettings.ts`.
- Functional state setters preserve React's existing reference when a response or fallback computes the same effective settings, avoiding downstream memo/effect work while preserving real loaded values and error fallback behavior.

## Electron Main Obsidian Services Findings - 2026-07-13
- `electron/main.ts` should own process bootstrap and wiring, while Obsidian daily-note helper construction and sync helper construction form a separable service-composition boundary.
- `electron/mainObsidianServices.ts` is a narrow extraction point because it depends only on vault/template accessors, the AI review runner bridge function, the local blog draft directory, localization, and shared task-date helpers.
- Keeping the AI review runner bridge in `main.ts` preserves initialization order: sync helpers can receive the bridge function before the daily runner is created, and the bridge is connected immediately afterward as before.

## Electron Obsidian Sync Daily-Note Boundary Findings - 2026-07-13
- `electron/obsidianSync.ts` had three responsibilities mixed together: untrusted task payload validation, per-file daily-note mutation mechanics, and multi-date sync/preview orchestration.
- `electron/obsidianSyncDailyNote.ts` is the correct owner for path resolution and physical daily-note writes because it already needs template module flags, managed marker helpers, timestamp preservation, directory creation, and optional overview hook execution.
- Keeping affected-date collection, blog draft generation, AI review triggering, and preview aggregation in `electron/obsidianSync.ts` preserves the cross-file workflow while letting the daily-note helper remain a narrow single-note service.

## Auto-Start Renderer State Refresh Deduplication Findings - 2026-07-13
- The main process already avoids redundant persistence and system login-item changes, but its result still crosses IPC and previously scheduled a renderer update even when the visible boolean was unchanged.
- A component-local ref is sufficient because every renderer-side auto-start write path now runs through one helper. It avoids scheduling a React update instead of relying on React to discard a same-boolean update later.
- The ref guard follows strict runtime narrowing, so malformed preload values still resolve only to the existing `false` behavior and cannot become truthy auto-start state.

## Priority Picker No-Op Change Elimination Findings - 2026-07-13
- `PriorityPicker` serves both parent tasks and virtualized subtasks, so its option callback is a high fan-out boundary: an unchanged selection previously still reached task-tree mutation and its downstream persistence/sync observers.
- The no-op decision belongs in the picker because it already has both the current `value` and selected option. This removes needless parent work for all callers without duplicating equality guards at each task and subtask route.
- Closing the popover remains independent from propagating a priority change, preserving the expected interaction when a user clicks the active option.

## SettingsPanel AI Review State Hook Findings - 2026-07-13
- `SettingsPanel.tsx` had already delegated most section UI, but it still mixed panel navigation with AI Review settings loading, progress subscriptions, deferred text persistence, diagnostics, and manual report generation orchestration.
- `src/components/settings/useAiReviewSettingsPanelState.ts` is the narrow state boundary because it can own all AI Review side effects while depending only on the settings text, current selected date, task list, and open/locale flags.
- Keeping `AiReviewSettingsSection.tsx` presentational preserves the existing child-section structure and keeps IPC/runtime validation out of UI markup, while `SettingsPanel.tsx` now composes section state through one hook result.
- The extraction reduced `SettingsPanel.tsx` below the large-file threshold without creating a replacement large file: the component is 161 lines and the hook is 280 lines.

## Obsidian Companion Mobile Inbox Findings - 2026-07-13
- `electron/obsidianCompanion.ts` had two separable responsibilities: sync planning/writing for Companion rules and filesystem import of mobile inbox capture files.
- `electron/obsidianCompanionMobileInbox.ts` is the narrow boundary because the mobile import path owns processed/failed directory creation, unique destination reservation, JSON/text parsing, and fallback moves without needing sync-plan rendering helpers.
- Re-exporting `importMobileInbox` from `electron/obsidianCompanion.ts` preserves existing callers while allowing the planning module to stay below the large-file threshold.
## Large-File Cleanup Completion Findings - 2026-07-13
- The cleanup pass uses a 300-line production-file threshold, excluding generated output, scripts, documentation, and tests.
- The final scan found no production source file at or above that threshold. The largest remaining production file is 284 lines, so further splitting would be a new stricter pass rather than unfinished work from this objective.
- The final aggregate verifier and production build both passed after responsibility-boundary verifier calibration.

## AI Account Manager Presentation Split Findings - 2026-07-13
- The AI account modal cleanly separates into a stateful shell, a profile-navigation list, and a profile-detail form. The model-list IPC state belongs in the shell because it is request lifecycle state rather than field presentation.
- Passing account mutation callbacks through the presentation components preserves existing persistence timing while keeping the components independent of Electron IPC.
- Structural verifiers must follow responsibilities after a split: provider narrowing and token normalization now live in the detail form, while result parsing and model-list IPC remain in the manager.

## Template Editor Block-List Extraction Findings - 2026-07-13
- The template editor's sortable list is a distinct presentation boundary: it owns DnD activation state, sortable identifiers, and daily/report row rendering, while the modal owns template mutation semantics.
- Keeping reordering as an index-based callback preserves the existing daily-template versus report-template update behavior in the state owner, without coupling the list component to template persistence or recognition.
- Existing structural verifiers that inspected the former monolith need to read the extracted list component when checking render-type controls; the behavior remains the same but the responsibility moved.

## Electron Main-Window Composition Findings - 2026-07-13
- Main-window setup has a coherent composition boundary: persistence, runtime window-mode changes, tray and popup shell actions, startup, and bootstrap registration all share the same runtime-state dependencies and should be assembled together rather than in the Electron process entrypoint.
- `electron/main.ts` is now limited to process-level construction and lifecycle ownership, so future window changes can be understood from the composition module without scanning unrelated Obsidian and AI Review service setup.
- Structural verifiers must distinguish dependency construction in `main.ts` from dependency assembly in `mainWindowComposition.ts`; moving the latter preserves the same behavior and strengthens the responsibility boundary rather than removing coverage.

## OpenAI Client Transport Extraction Findings - 2026-07-13
- `shared/llm/openaiClient.ts` currently combines public API validation/retry orchestration with user-facing HTTP and usage-only-stream diagnostics, one-request fetch/timeout handling, and model-list request execution.
- `shared/llm/llmProviderProtocol.ts` already owns request construction, while `shared/llm/llmProviderResponseParsing.ts` owns unknown-safe response parsing. A transport-focused helper can therefore depend on those two modules without changing public provider contracts.
- The lowest-risk boundary is to retain `callChatCompletion`, `listModels`, `readListModelsResult`, and exported types in the current facade while moving per-attempt request execution and diagnostic formatting to a new internal module.
- The completed transport extraction had briefly retained legacy-named copies during concurrent work; the current facade contains neither legacy function, and the focused verifier now explicitly rejects both names so duplicate HTTP execution cannot silently return.
- A transient `AiReviewTokenUsage` missing-import typecheck failure was resolved by the concurrent extraction's restored type import; fresh typecheck, aggregate cleanup verification, and production build all pass.

## TitleBar Window-Mode Hook Extraction Findings - 2026-07-13
- `TitleBar.tsx` mixed visual control rendering with a standalone pinned-window lifecycle: initial IPC read, focus and visibility refresh, mode-change subscription, duplicate-state guard, and always-on-top fallback behavior.
- `src/components/useTitleBarWindowMode.ts` is a narrow renderer-side boundary because it owns only the window-mode state lifecycle and exposes the existing `pinned` value plus the toggle action.
- The TitleBar remains responsible for user-event presentation; moving its click handler's state parsing into the hook preserves the original toggle and fallback semantics while shrinking the component from 264 to 222 lines.
- The focused verifier now checks ownership rather than textual implementation details: subscription code and the no-op guard belong to the hook, while TitleBar composes and awaits the hook action.
- `verify:cleanup-core` returned exit code 0 but its output contained an unrelated failure in `verify-electron-companion-ipc-module`: the verifier still expects `isObject(error)` after Phase 394 renamed the shared predicate to `isObjectRecord(error)`. This is an existing verifier-calibration follow-up, not a TitleBar behavior regression.

## Task Display Ordering Extraction Findings - 2026-07-13
- `src/utils/taskOrdering.ts` mixed pure display sorting with stateful drag-order mutation helpers. The display path has no dependency on drag interactions beyond the persisted order types and source guard.
- `src/utils/taskDisplayOrdering.ts` now owns source normalization, task source bucketing, completion/priority sorting, and manual-order missing-task insertion. It remains pure and can be checked independently of mutation operations.
- `taskOrdering.ts` re-exports the display APIs to preserve existing hook and verifier imports, while its implementation is now limited to saved-order mutation and drag-disable decisions.

## Task Persistence Initialization Extraction Findings - 2026-07-13
- `src/hooks/taskPersistence.ts` mixed a reusable delayed persistence controller with runtime parsing of stored values and startup task-state assembly.
- Startup parsing and carryover application form a coherent initialization boundary; `src/hooks/taskPersistenceInitialization.ts` now owns that boundary while the debounce controller remains in the stable facade alongside compatibility exports used by lifecycle hooks.
- `scripts/verify-task-list-interactions.ts` needed to check the new initialization owner for `TASK_LIST_ORDER_KEY`; the existing `useTasks` state-exposure assertion remains unchanged, so the verifier still protects the behavior rather than the old file layout.

## Task Business-Date Effects Extraction Findings - 2026-07-13
- The lifecycle hook had a distinct business-date concern: schedule the next rollover, update the active business date, preserve a manually selected historical date, read the carryover ledger, and write it only when carryover changed it.
- `src/hooks/useTaskBusinessDateEffects.ts` now owns that timer-driven workflow. Its injected state setters keep it independent from startup loading, UI persistence, broadcast reconciliation, and Obsidian synchronization.
- Two persistence checks were intentionally recalibrated to the new owner: ledger parsing before carryover and the no-op write guards. The startup writeback assertions remain in the lifecycle composition hook because they are still part of initialization.

## Task Tree Persistence And Broadcast Effects Extraction Findings - 2026-07-13
- Delayed task-tree persistence and cross-window task reconciliation share one lifecycle boundary: both need the same structural equality helper and the same persistence baseline controller.
- `src/hooks/useTaskTreePersistenceEffects.ts` owns controller creation, loaded-tree priming, deferred writes, unmount flushing, incoming tree normalization, and stale local-write suppression.
- Startup loading remains responsible for deciding whether a Store-loaded tree is already canonical. It primes the extracted controller only when normalization and carryover made no task changes, preserving the no-redundant-write startup behavior.

## Task Startup Initialization Effects Extraction Findings - 2026-07-13
- Startup hydration is distinct from ongoing lifecycle work: it reads the assembled Store state once, applies the full state snapshot, writes back only a changed carryover ledger, establishes task/UI persistence baselines, then enables the remaining effects.
- `src/hooks/useTaskInitializationEffects.ts` has explicit setter and baseline-primer inputs, preserving hydration order without coupling startup to business-date timing, broadcast subscriptions, or Obsidian synchronization.
- `useTaskLifecycleEffects.ts` is now a narrow composition hook for startup, business-date, task-tree persistence/broadcast, Obsidian synchronization, and post-load UI-state persistence.

## Obsidian Daily Note Rendering Extraction Findings - 2026-07-13
- `shared/obsidianTemplates.ts` previously mixed the daily-note rendering pipeline with reusable path resolution, managed-block reading/replacement, and sync-preview assembly.
- `shared/obsidianDailyNoteRendering.ts` now owns the default and custom daily-note rendering pipeline, including marker blocks, token substitution, and fallback insertion when a custom template omits a managed block.
- The original module remains a stable facade with compatibility re-exports, so Electron sync callers and task-line consumers retain their existing import paths while the renderer has a focused single-note responsibility.

## Large-File Rescan Findings - 2026-07-13
- A Git-tracked production-source scan, excluding scripts and generated output, found no module at or above the established 300-line threshold.
- The largest remaining TypeScript/TSX production files are `electron/main.ts` (235 lines), `src/components/TaskItem.tsx` (230), and `src/hooks/useTasks.ts` (209); their high-coupling concerns are already delegated to focused child modules or hooks.
- Further splits should be evaluated as a separate stricter small-module pass, not counted as remaining large-file cleanup work.

## TaskItem Editing Lifecycle Extraction Findings - 2026-07-13
- `TaskItem.tsx` still combined presentation with a compact but distinct edit lifecycle: external edit triggers, draft-state initialization, submit trimming, keyboard action routing, cancellation, and completed-task protection.
- `useTaskItemEditing` owns that lifecycle and depends only on the current task, optional trigger, and existing `onEdit` callback; it keeps the pre-existing pure key/text helpers as its normalization dependency.
- The card component continues to own propagation control before edit start, so the hook remains independent of card-specific DOM event behavior and presentation components.

## DailyWorkPanel Resize Lifecycle Extraction Findings - 2026-07-13
- `DailyWorkPanel.tsx` mixed markdown/slash-menu composition with an independent pointer-drag resize lifecycle.
- `useDailyWorkPanelResize` now owns the original 64px initial height, 56px/480px bounds, textarea height fallback, and pointer listener cleanup; the panel remains responsible for wiring its textarea ref and rendering the resizer.
- The focused verification checks both ownership and listener cleanup. It is included in `verify:cleanup-core`, so future panel edits cannot silently return the lifecycle to the component.

## DailyWorkPanel Command Menu Hook Extraction Findings - 2026-07-13
- The remaining independent concern in `DailyWorkPanel.tsx` was command-menu state: slash trigger detection, index reset, close behavior, and keyboard routing did not require markdown insertion or textarea selection ownership.
- `useDailyWorkPanelCommands` owns that state machine. Its key handler reports an optional selected index for Enter, allowing the panel to retain the task-to-markdown transformation and `useMarkdownEditor` commit boundary.
- Escape behavior, arrow wrapping, empty-menu fallback selection, IME Enter handling, and the editor fallback for all unhandled keys remain unchanged.
- Two broader UI scripts had stale assumptions from prior shell extractions: selected-date command flow now passes through `useAppShellComposition`/`appTaskView`, and UI-feedback ownership now lives in main-window, generation, and main-content composition modules rather than their former facades.

## TitleBar More-Menu Hook Extraction Findings - 2026-07-13
- `TitleBar.tsx` still mixed titlebar control presentation with a self-contained more-menu lifecycle: open state, document-level outside-click registration, guarded event-target narrowing, and reset-position closure.
- `useTitleBarMoreMenu` now owns that lifecycle while preserving the `.titlebar-more-wrap` boundary, Element guard, pointer listener cleanup, and reset action order.
- `TitleBar` continues to own the icon button and menu JSX, so visual layout and menu interaction remain at the component boundary.
- Existing RC UI and Electron window IPC checks were recalibrated to inspect the current lifecycle owners instead of requiring extracted implementation details to remain inline.

## PriorityPicker Popover Hook Extraction Findings - 2026-07-13
- `PriorityPicker.tsx` mixed priority-option presentation with an independent portal lifecycle: open state, trigger/popover references, viewport placement, outside-click handling, resize/scroll repositioning, and frame cleanup.
- `usePriorityPickerPopover` now owns that lifecycle while retaining guarded `Node` narrowing, capture-phase scroll repositioning, no-op position updates, and animation-frame cancellation.
- `PriorityPicker` retains priority metadata, portal JSX, and the rule that selecting the existing priority closes the popover without issuing an unnecessary `onChange` callback.

## DateNavigator Calendar Lifecycle Hook Extraction Findings - 2026-07-13
- `DateNavigator.tsx` mixed date-navigation presentation with a focused calendar lifecycle: open state, selected-date-to-month synchronization, containment reference, document pointer cleanup, and explicit close/toggle actions.
- `useDateNavigatorCalendar` now owns that lifecycle and preserves the guarded `Node` containment check and listener cleanup.
- The navigator remains responsible for returning to today, which intentionally updates both the selected date and visible month, plus lazy `MonthCalendar` presentation and callback wiring.

## TaskMenuPopup Lifecycle Hook Extraction Findings - 2026-07-13
- `TaskMenuPopup.tsx` mixed URL payload/theme presentation with a self-contained popup viewport lifecycle: pane state, height reporting, ResizeObserver/RAF cleanup, and Escape-key navigation.
- `useTaskMenuPopupLifecycle` now owns the lifecycle and preserves duplicate-height suppression, `resizeTaskContextMenu(h + 32)`, top-level Escape close, and nested-pane Escape return behavior.
- The popup component remains responsible for payload parsing, theme CSS variables, action dispatch, and pane JSX, keeping the hook independent of popup task data and presentation.

## TaskCompletionDialog Form Hook Extraction Findings - 2026-07-13
- `TaskCompletionDialog.tsx` mixed modal presentation and Markdown textareas with a standalone completion-review form lifecycle: resets, status/percent transitions, and normalized save payload construction.
- `useTaskCompletionDialogForm` now owns that form state while preserving task-change resets, done/partial/blocked percent transitions, malformed status rejection, and trimmed text fields before save.
- The dialog keeps the visual form structure and `useMarkdownEditor`-based textarea integration, so the new hook has no DOM/editor-history dependency.

## Header Completion Celebration Hook Extraction Findings - 2026-07-13
- `Header.tsx` mixed summary presentation with an independent completion-transition effect: previous-count tracking, full-completion detection, and lazy `canvas-confetti` loading.
- `useCompletionCelebration` owns that lifecycle and preserves the original trigger guard (`completedCount > 0`, all complete, and a prior count below the total), lazy import, particle configuration, colors, and previous-count update timing.
- The header remains a memoized presentation component for formatted date, task summary, sync controls, and progress. The production build continues to emit `confetti.module` as a separate on-demand chunk.

## TaskItem Parent Action Controls Extraction Findings - 2026-07-13
- `taskItemControls.tsx` combined main-row text/edit/drag presentation with parent task review, completion, and delete controls.
- `taskItemActionControls.tsx` now owns the four action-presentation components while preserving the handlers, class names, accessibility labels, icons, and Framer Motion options.
- `TaskItem.tsx` remains the composition owner, and `taskItemControls.tsx` now focuses on main task content, inline edit input, and drag-handle presentation.

## TitleBar Primary Actions Presentation Extraction Findings - 2026-07-13
- `TitleBar.tsx` combined its outer drag/menu/window-control shell with a self-contained primary action group for pinning, position locking, and settings.
- `TitleBarPrimaryActions` now owns the primary button JSX, icon variants, selected markers, active visual treatment, and localized labels.
- `TitleBar` retains the window-mode hook, optimistic visual state synchronization, event handlers, more-menu lifecycle composition, and desktop window commands, so this remains a presentation-only boundary.

## Obsidian Template Modules Section Extraction Findings - 2026-07-13
- `ObsidianTemplateCenter.tsx` mixed template-center composition with the self-contained daily-template module configuration list.
- `ObsidianTemplateModulesSection` now owns daily-template module derivation, canonical module iteration, localized labels, fixed `work`/`inspiration`/`tasks` enforcement, toggles, and title inputs.
- The center remains the state and workflow owner for presets, AI file/import recognition, advanced custom blocks, preview, and reset commands.

## Obsidian Companion Rules Section Extraction Findings - 2026-07-13
- `ObsidianCompanionPanel.tsx` mixed drawer composition with the complete editable Companion rule list.
- `ObsidianCompanionRulesSection` now owns immutable updates, enabled toggles, write target/section, guarded write mode, priority, and after-match controls.
- The panel remains responsible for panel visibility, vault and mobile-inbox actions, template editing, preview/sync commands, and result presentation.

## Obsidian Companion Templates Section Extraction Findings - 2026-07-13
- `ObsidianCompanionPanel.tsx` mixed drawer composition with the complete editable Companion template list.
- `ObsidianCompanionTemplatesSection` now owns template iteration and immutable body updates while preserving controlled textarea behavior and the `companion-template-editor` styling boundary.
- The panel remains responsible for visibility, vault and mobile-inbox actions, rules/template section composition, preview/sync commands, and result presentation.

## App UI Persistence Equality Allocation Reduction Findings - 2026-07-13
- `appUiStatePersistence.ts` compares snapshots on frequent React UI-state effects. Its former `Object.entries(...)` implementation allocated two arrays at every visited object level, including no-op persistence checks.
- Own-key count and traversal loops retain the original equality semantics: inherited properties are ignored, right-side keys must be own properties, and recursive comparison continues to read right-side values through descriptors.
- An aggregate cleanup run first reported an ordering verifier reference-sharing assertion, but that verifier passed on immediate isolated rerun. A subsequent aggregate run exceeded the command timeout, so only focused checks, typecheck, and build are claimed for this phase.

## Task-Menu Date and Tag Pane Extraction Findings - 2026-07-13
- `TaskMenuPopupPanes.tsx` mixed four independent pane implementations. Date selection and tag editing have distinct local state and task-update workflows, so they are natural focused module boundaries.
- `TaskMenuPopupDatePane` retains quick-date calculation, sorted scheduled-date chips, date input behavior, dispatch payloads, and close behavior. `TaskMenuPopupTagPane` retains parsing, deduplicated merges, suggestion filtering, keyboard handling, and save/close behavior.
- The entry component now composes the three pane modules. `getTagSuggestions` continues to be re-exported from `TaskMenuPopup`, preserving its existing verifier and caller contract.

## App Shell Input Assembly Extraction Findings - 2026-07-13
- `useAppShellComposition.ts` combined React-derived values and memoized action factories with a 73-field final `AppShellCompositionOptions` mapping. The mapping is pure and does not require hook ownership.
- `appShellCompositionInputs.ts` now owns that mapping. `useAppShellComposition.ts` remains responsible for all `useMemo` boundaries, task-view derivation, review state, Companion/template actions, and then delegates to the pure factory.
- Existing structural verifiers now inspect the pure factory for each data-flow contract, so extracting the mapping does not weaken completion, modal, personalization, template, or date-navigator wiring coverage.
## Obsidian Template Import Presentation Extraction Findings - 2026-07-13
- `ObsidianTemplateCenter.tsx` mixed template-settings composition with a self-contained AI import and recognized-draft presentation region.
- `ObsidianTemplateImportSection` now owns the import textarea, file/recognize controls, pending state, status text, module preview, suggested path, missing-core fields, unmapped sections, notes, and apply action.
- The center retains ownership of the state hook and passes its existing callbacks and values through unchanged, so picker, recognition, and settings-update behavior remain at the same boundaries.
## Task Tree Mutation Utility Extraction Findings - 2026-07-13
- `taskTransforms.ts` combined persisted-task validation/normalization with recursive immutable tree traversal used only by task mutations.
- `taskTree.ts` now owns `mapTaskTree` and `removeTaskFromTree`, preserving no-change reference reuse, ancestor copying for nested changes, sibling reference reuse, and removal of duplicate matching ids.
- `useTasks.ts` now depends on the focused tree module, while persistence callers continue to use `taskTransforms.ts` without acquiring mutation-only behavior.

## Markdown Editor Indentation Utility Extraction Findings - 2026-07-13
- `markdownEditor.ts` combined two independent pure-editing concerns: multi-line indentation transforms and Markdown list/inline-format commands.
- `markdownEditorIndentation.ts` now owns selected-line calculation plus indent/outdent behavior. The former module re-exports both commands, so `useMarkdownEditor.ts` and existing consumers keep their import contract.
- The focused verifier locks the ownership boundary and preserves multi-line selection offsets, partial-space removal, tab removal, list continuation, and inline wrapper toggling coverage.

## Obsidian Completion-Review Visibility Extraction Findings - 2026-07-13
- `obsidianTemplateTaskLines.ts` combined task-tree visibility/indexing with an independent completion-review visibility policy: legacy review fallback, date filtering, render-order sorting, and allocation-light streaming traversal for statistics.
- `obsidianTemplateCompletionReviewVisibility.ts` now owns that review policy through a minimal task shape, while `obsidianTemplateTaskLines.ts` remains the owner of task recursion, render formatting, and sync-preview counters.
- Rendering still receives chronologically ordered visible reviews; statistics still visit records without constructing sorted review arrays.

## Obsidian Template Settings Equality Extraction Findings - 2026-07-13
- `obsidianTemplateSettings.ts` mixed default configuration and migration logic with a generic recursive equality algorithm.
- `obsidianTemplateSettingsEquality.ts` now owns recursive primitive, array, and object comparison while retaining exact own-property and descriptor-based reads.
- The settings module keeps its public typed equality facade, so callers retain their existing API and normalization behavior remains local.

## Obsidian Daily Template Migration Extraction Findings - 2026-07-13
- `obsidianTemplateSettings.ts` also included a separate legacy Markdown parser that translates old daily placeholder tokens into structured template block order.
- `obsidianTemplateSettingsDailyMigration.ts` now owns token recognition, duplicate suppression, default custom-block mapping, and fallback ordering.
- The settings module remains the orchestration point for persisted configuration, so its typed public API and current/legacy precedence rules stay unchanged.

## Obsidian Template Settings Path Migration Extraction Findings - 2026-07-13
- `obsidianTemplateSettings.ts` combined settings normalization with an independent compatibility policy for current path fields, legacy aliases, and legacy report directory values.
- `obsidianTemplateSettingsPathMigration.ts` now owns stored-string reading, current-versus-legacy precedence, and conversion from legacy weekly/monthly directories to dated Markdown file paths.
- The settings module keeps field selection and typed public normalization, preserving default values and the persistence-facing API.

## Obsidian Template Recognition Result Reader Extraction Findings - 2026-07-13
- `obsidianTemplateRecognition.ts` mixed prompt/draft parsing with runtime validation for two independent IPC response contracts.
- `obsidianTemplateRecognitionResultReaders.ts` now owns recognition-draft result validation and template-picker result parsing, including full nested module validation.
- The original module re-exports the reader functions and types, so renderer and Electron consumers retain their existing import contract.

## Obsidian Template Task-Line Formatting Extraction Findings - 2026-07-13
- `obsidianTemplateTaskLines.ts` combined task-tree visibility and recursive output ownership with pure text formatting and placeholder mechanics.
- `obsidianTemplateTaskLineFormatting.ts` now owns single-line task escaping, multi-line review escaping, tags, timestamps, replacement tokens, and one-time review-template compilation.
- Task-line rendering retains visibility indexes, review selection, sorting, hierarchy, and final indentation so its control flow remains localized.

## Obsidian Template Module Settings Extraction Findings - 2026-07-13
- `obsidianTemplateCenter.ts` mixed static template-module definitions, defaults, presets, and normalization with DailyTemplate-to-module mapping and settings mutation workflows.
- `obsidianTemplateModuleSettings.ts` now owns the static module schema and normalization policy, including the shared object-record guard.
- The center module re-exports the focused module so existing imports remain valid while retaining only mapping, preset application, and update behavior.

## Obsidian Companion Runtime Validation Extraction Findings - 2026-07-13
- `obsidianCompanion.ts` mixed stable shared contracts with nested runtime validation and untrusted IPC-result readers.
- `obsidianCompanionValidation.ts` now owns capture/template/rule/sync-plan narrowing plus sync, write, and mobile-import result readers, reusing `isObjectRecord`.
- The shared Companion module remains a compatibility facade, so existing renderer and Electron imports retain their public API.
- The final Companion-action field mapping belongs to `appShellCompositionInputs.ts`; `useAppShellComposition.ts` remains the owner of memoized action creation.

## LLM Model-List Result Reader Extraction Findings - 2026-07-13
- `openaiClient.ts` correctly remains the public LLM request facade, but its untrusted model-list IPC-result narrowing is independent of request orchestration.
- `llmModelListResultReader.ts` now owns the `{ ok, models/error }` runtime contract, reusing the established unknown object-record guard.
- The facade explicitly re-exports the reader and result type, retaining existing imports for renderer IPC consumers.

## Floating Scrollbar Metrics Extraction Findings - 2026-07-13
- `useFloatingScrollbar.ts` combined DOM observer/listener lifecycle work with pure scroll geometry and pointer-drag conversion.
- `floatingScrollbarMetrics.ts` now owns proportional thumb sizing, available track sizing, and the no-op behavior for zero usable drag space.
- The hook continues to own all DOM effects, preserving scroll visibility scheduling, header measurement, observers, and cleanup behavior.

## Theme Preset Matching Extraction Findings - 2026-07-13
- `themePresets.ts` combined static preset catalog data with a pure field-by-field matching policy used to recover an active theme from persisted settings.
- `themePresetMatching.ts` now owns the generic preset-candidate lookup, including case-insensitive color comparison and exact matching of the existing visual settings.
- `themePresets.ts` retains the public `matchThemePreset` facade, so existing renderer and app-state imports remain unchanged.
- Two broader theme checks are concurrently stale: one reads a deleted `context-menu.css`; the other expects reset behavior without the current no-op equality guard. Neither involves preset matching.

## AI Review Prompt Formatting Extraction Findings - 2026-07-13
- `promptBuilder.ts` mixed message assembly with three independent, pure formatting policies: deterministic daily statistics, block render-type instructions, and the fallback prompt for an unnamed custom instruction.
- `promptFormatting.ts` now owns those policies through narrow typed functions, while the builder retains the system prompt, input contracts, and final `ChatMessage` construction.
- The existing message-builder exports and consumers remain unchanged; only the internal formatting owner moved.

## AI Review Default Prompt Catalog Extraction Findings - 2026-07-13
- `defaultPrompts.ts` contained four independent static report-template catalogs: personal and external variants for weekly and monthly reports.
- `defaultWeeklyPrompts.ts` and `defaultMonthlyPrompts.ts` now own those separate cadence-specific catalogs, making each template group easier to inspect and evolve without scanning unrelated report formats.
- `defaultPrompts.ts` remains the stable import facade, so weekly, monthly, and external report callers retain their current paths and constant names.

## Report Output Formatting Extraction Findings - 2026-07-13
- `reportGenerator.ts` mixed report-block prompt construction with a separate pure policy that normalizes LLM output and determines format fallbacks.
- `reportOutputFormatting.ts` now owns list bullet normalization plus table, Callout, and Dataview validation/downgrade messages.
- `reportGenerator.ts` continues to own source-slice selection and prompt construction, and explicitly re-exports `validateBlockOutput` so existing report callers retain their import path.

## AI Onboarding Step Presentation Extraction Findings - 2026-07-13
- `AiOnboarding.tsx` combined dialog-state/navigation ownership with three independent step bodies: introductory copy, AI connection fields, and timer controls.
- `aiOnboarding/AiOnboardingSteps.tsx` now owns those conditional step bodies and forwards all changes through the parent-owned typed update callback.
- The onboarding component retains draft initialization, open-state behavior, modal animation, step navigation, API-key enablement, dismissal, and completion behavior.

## AI Review Report Message Composition Extraction Findings - 2026-07-13
- `weekly.ts` and `monthly.ts` repeated a deterministic-statistics section and the same source-to-`ChatMessage` envelope while differing only in cadence-specific labels and source policies.
- `reportMessageComposition.ts` now owns that common message assembly through explicit period, streak, and source-heading inputs.
- Weekly keeps ISO-key/date-source handling and its default prompt; monthly keeps month range/source fallback behavior and its month-end streak wording, so public builder APIs remain unchanged.

## Light Anonymization Ownership Extraction Findings - 2026-07-13
- `templateBlockDefaults.ts` was a misleadingly named single-purpose module: it owned light report anonymization rather than template defaults.
- `lightAnonymization.ts` now owns the independent name, contact, and project-code replacement policy.
- `templateBlockDefaults.ts` retains a direct compatibility re-export so existing callers remain valid without an import-path migration.
- The historical template-hub aggregate verifier accepts the facade re-export, then reaches an unrelated stale assertion for `buildDailyNoteFromTemplate`, which has been moved elsewhere by concurrent cleanup.

## Daily Markdown Core-Section Rules Extraction Findings - 2026-07-13
- `dailyMarkdownTemplate.ts` combined rendering orchestration with independent core-token detection and fallback-section formatting rules.
- `dailyMarkdownCoreSections.ts` now owns the three required daily sections, their labels, placeholder matching, and ordered fallback-section assembly.
- The renderer retains parameter normalization, generic token replacement, and final newline behavior, while preserving its existing `missingDailyCoreTokens` export as a facade.

## AI Review Template File Parsing Extraction Findings - 2026-07-13
- `templateFile.ts` combined supported-extension metadata with independent file-content decoding and error normalization.
- `templateFileParsing.ts` now owns UTF-8 text trimming, injected DOCX extraction, and all parse-result error messages.
- `templateFile.ts` retains extension policy and direct parser/type re-exports, keeping Electron template-tool callers on their existing import path.

## AI Review Schedule-Time Parsing Extraction Findings - 2026-07-13
- `timer.ts` combined daily, weekly, and monthly date calculations with strict `HH:mm` parsing.
- `scheduleTimeParsing.ts` now owns the shared parser and caller-provided fallback policy.
- `timer.ts` keeps its intentionally different defaults: daily invalid input resolves to `23:00`, while weekly and monthly invalid input resolve to `09:00`.

## Electron Shared Unknown-Value Guard Consolidation Findings - 2026-07-13
- `shared/unknownValueGuards.ts` and `electron/unknownValueGuards.ts` had identical `isObjectRecord` implementations.
- The shared module is now the sole implementation owner; Electron retains its established local path as a direct compatibility re-export.
- Electron-specific callers do not need import migration, while all shared and Electron runtime narrowing now has one source of truth.
- The broad Companion verifier reaches an unrelated fixed-template allocation assertion after the updated guard check, so it does not contradict this consolidation.

## Shared Schedule-Time Validation Consolidation Findings - 2026-07-13
- `appSettings.ts` and `aiReviewSettingsNormalization.ts` independently implemented the same strict `HH:mm` validation rule already used by AI-review scheduling.
- `scheduleTimeParsing.ts` is now the sole owner of the rule through `isScheduleTime`, and `parseScheduleTime` reuses that predicate before applying its caller-supplied fallback.
- The consumers retain their separate defaults: app rollover normalization continues to use `05:00`, while each AI-review timer field continues to use its existing configured default.

## Task Action Hook Extraction Findings - 2026-07-13
- `useTasks.ts` still mixed React state/lifecycle composition with twenty task, review, note, settings, and ordering action callbacks.
- `useTaskActions.ts` now owns that state-update callback family through explicit state and current-date dependencies, while retaining the pre-existing pure mutation and ordering helpers.
- `useTasks.ts` preserves the exact action names through a spread return, but is now focused on state ownership, lifecycle wiring, task-view selection, theme state, and Obsidian folder/note commands.

## Daily AI Content Inspection Extraction Findings - 2026-07-13
- `aiReviewDailyRunner.ts` mixed snapshot-safe daily file reads with the independent daily LLM and diagnostic orchestration flow.
- `electron/aiReviewDailyContentInspection.ts` now owns existence checks, before/after stat comparison, managed AI-content detection, safe read-error results, and the snapshot supplied to later review execution.
- The runner remains the public `inspectDailyAiContent` facade and retains user-facing error translation, staged diagnostics, and single-snapshot use by `runReviewForFile`.

## App UI-State Persistence Snapshot Extraction Findings - 2026-07-13
- `appUiStatePersistence.ts` mixed pure persistence-snapshot policy with hydration coordination, debouncing, and Electron IPC side effects.
- `appUiStatePersistenceSnapshot.ts` now owns exact store-key construction and the existing allocation-conscious structural equality behavior.
- The persistence module continues to coordinate its existing compact-mode baseline, hydration gate, pending-write cancellation, and delayed `setStoreMany` call using the extracted snapshot helpers.

## LLM Client Error-Message Policy Extraction Findings - 2026-07-13
- `openaiClient.ts` mixed public request precondition and automatic-provider orchestration with independent Chinese diagnostic and error-formatting policy.
- `llmClientErrorMessages.ts` now owns usage-only stream explanations, actionable HTTP diagnostics, automatic-candidate summaries, and chat/model transport error formatters.
- `openaiClient.ts` remains the stable public facade for request coordination and preserves its exports and caller-facing result contracts.

## Obsidian Sync Preview Assembly Extraction Findings - 2026-07-13
- `obsidianSync.ts` combined sync side-effect orchestration with a separate read-only multi-date preview workflow.
- `obsidianSyncPreview.ts` now owns loading existing daily-note content, invoking `buildSyncPreview`, and accumulating files, task counts, completion records, and deletion warnings in one traversal.
- The sync facade retains vault and IPC-input gates, date-impact planning, error shaping, and its existing caller-facing preview result contract.

## Obsidian Blog-Draft Assembly Extraction Findings - 2026-07-13
- `obsidianDailyNoteContent.ts` combined managed daily-note template and migration behavior with a separate blog-draft Markdown document generator.
- `obsidianBlogDraft.ts` now owns localized front matter and body assembly plus single-pass selected-date task statistics.
- The daily-note content helper remains the compatibility composition point, so existing sync callers retain the same `buildBlogDraft` dependency and output contract.

## AI Review Default-Template Catalog Extraction Findings - 2026-07-13
- `sectionConfig.ts` mixed public template types and normalization facades with the independent daily and report default-template catalogs.
- `sectionConfigDefaultTemplates.ts` now owns the fixed/custom daily catalog, four report catalogs, and default daily block-order construction.
- `sectionConfig.ts` retains its established public import path through direct re-exports, plus runtime guards and normalization coordination; every default factory invocation still creates fresh custom-block IDs.

## Obsidian Managed-Block Sync Policy Extraction Findings - 2026-07-13
- `obsidianSyncDailyNote.ts` mixed filesystem orchestration with pure managed-block update policy.
- `obsidianManagedBlockSync.ts` now owns no-op detection for marked blocks and preservation of an existing task-sync timestamp when the task block has no other content change.
- The daily-note synchronizer remains responsible for legacy migrations, module enablement, content assembly, and physical write decisions; it passes its existing block-upsert dependency into the policy helper.

## AI Review Template-Report Execution Extraction Findings - 2026-07-13
- `exportReports.ts` mixed three report-specific facades with the shared legacy/template-aware LLM execution flow.
- `templateReportGeneration.ts` now owns message-source assembly, per-enabled-block LLM calls, output validation, failure/truncation handling, and final report writing.
- Weekly, monthly, and external report facades retain their existing public APIs, message builders, vault paths, frontmatter, and external-report redaction boundary.

## Obsidian Sync Blog-Draft Output Extraction Findings - 2026-07-13
- `obsidianSync.ts` mixed primary vault synchronization with a separate best-effort local blog-draft file-output side effect.
- `obsidianSyncBlogDraftOutput.ts` now owns directory validation, file-path construction, safe existing-file reads, unchanged-content write suppression, and swallowed optional errors.
- The sync facade remains responsible for validated input, selected-date sync results, and deciding when to invoke overview refresh and AI review, preserving the primary sync failure boundary.

## Obsidian Companion Template/Rule Policy Extraction Findings - 2026-07-13
- `obsidianCompanionPlanning.ts` mixed pure capture-template/rule policy with filesystem-aware sync-plan construction.
- `obsidianCompanionTemplateRules.ts` now owns date/time tokens, case-insensitive fixed-token rendering, and rule predicates with optional normalized tags/content inputs.
- The planning module retains validation, vault-bound target resolution, target-file inspection, plan aggregation, and compatibility re-exports, while Companion callers keep their existing public import paths.

## AI Review Generation Presentation Extraction Findings - 2026-07-13
- `AiReviewSettingsWidgets.tsx` mixed pure generation-display policy with the independent stateful account-management entry point.
- `AiReviewGenerationPresentation.tsx` now owns date helpers, generation result copy, real-progress display and percentage policy, the progress/diagnostic components, and action-derived initial/final progress events.
- The account widget remains the stable public import surface through compatibility re-exports, so existing hooks and settings sections need no import migration.

## Task Completion Markdown Field Extraction Findings - 2026-07-13
- `TaskCompletionDialog.tsx` repeated the same Markdown textarea lifecycle three times through an inline field component.
- `TaskCompletionMarkdownField.tsx` now owns textarea references, shared editor integration, task-switch undo/redo reset, selection restoration, composition input, and keyboard handling.
- The dialog remains responsible for completion-review form state composition, validated status selection, labels, and save/cancel actions.

## AI Review Block-Filling Extraction Findings - 2026-07-13
- `electron/aiReview/runner.ts` mixed top-level review-file orchestration with the independent policy for locating, deciding, filling, and normalizing each managed block.
- `reviewBlockFilling.ts` now owns review-block discovery, freeze detection, deterministic carryover text, LLM response cleanup, duplicate-heading removal, and block replacement.
- The runner remains the single owner of file snapshot selection, date statistics, ordered block iteration, and final atomic write behavior.

## LLM Provider Text-Value Extraction Findings - 2026-07-13
- `llmProviderResponseParsing.ts` mixed protocol-specific response envelopes with protocol-neutral normalization of strings and segmented text values.
- `llmProviderTextValues.ts` now owns segmented text assembly, trimmed first-text selection for non-streaming responses, and whitespace-preserving first-text selection for streamed chunks.
- The provider parser retains OpenAI-compatible, Anthropic, and Gemini field paths, response aggregation, and truncation decisions.

## Obsidian Template Task-Visibility Extraction Findings - 2026-07-13
- `obsidianTemplateTaskLines.ts` mixed template-specific line rendering with task-tree visibility indexing and sync-preview statistics traversal.
- `obsidianTemplateTaskVisibility.ts` now owns the two pure traversals: one builds the visible task/review/date index for rendering, and one collects visible task/review counts and identity keys for preview comparisons.
- The task-line module remains the stable template-rendering entry point and re-exports `collectVisibleTaskStats`, so current `obsidianTemplates.ts` consumers preserve their import path.
- `verify:cleanup-core` currently stops in unrelated `verify-context-menu`: it expects `useTasks` to expose `addSubtask` directly, but that responsibility has already moved elsewhere in the current dirty worktree.

## Obsidian Overview-Refresh Extraction Findings - 2026-07-13
- `obsidianSyncDailyNote.ts` mixed its daily-note filesystem update flow with an independent best-effort Python subprocess for refreshing the vault's daily overview.
- `obsidianOverviewUpdate.ts` now owns script-path detection, `python --from-hook` execution, hidden-window options, and the intentional silent-error boundary.
- The daily-note helper retains its established `triggerOverviewUpdate` return surface as a small delegating wrapper, so `obsidianSync.ts` and its callers keep their existing contract.

## Obsidian Vault Accessor Extraction Findings - 2026-07-13
- `appStateAccessors.ts` mixed configuration normalization with independent Obsidian Vault default-path, stored-value, and filesystem validation policy.
- `obsidianVaultAccessors.ts` now owns development default-path eligibility, non-string Store-value fallback, missing-path and file-path rejection, and localized status messages.
- The app-state facade still returns `getDefaultVaultPath`, `getVaultPath`, and `getVaultStatus` unchanged, so its Electron composition and downstream IPC dependencies preserve their interface.

## Personalization Load-Settings Extraction Findings - 2026-07-13
- `personalizationSettings.ts` combined pure theme action/equality helpers with untrusted Store-value parsing and legacy theme-ID normalization.
- `personalizationLoadSettings.ts` now owns strict number/string/boolean readers, layout-density narrowing, opacity-override parsing, default merging, legacy preset matching, and unknown-theme rejection.
- `personalizationSettings.ts` remains the compatibility facade for callers such as `appPersonalization.ts`; its action and override-merging helpers continue to use the re-exported parsing API.

## Markdown Editor History Extraction Findings - 2026-07-13
- `useMarkdownEditor.ts` combined React/textarea integration with a self-contained undo/redo snapshot state machine.
- `markdownEditorHistory.ts` now owns input coalescing, redo truncation after a branch edit, selection-only updates for equivalent values, undo/redo cursor movement, and reset baselines.
- The Hook retains DOM focus/selection restoration and all keyboard command handling, so Daily Work and completion-dialog editor consumers preserve their public API and rendering behavior.

## Daily AI Review Progress Extraction Findings - 2026-07-13
- `aiReviewDailyRunner.ts` mixed daily-stage copy, progress IPC emission, diagnostic-stage collection, and execution orchestration.
- `aiReviewDailyProgress.ts` now owns the fixed stage labels/messages, stage record-and-emit policy, request-result status, and final-status derivation.
- The runner still owns its date-specific inspection, file existence validation, template/section inputs, LLM invocation, and `createDiagnostic(...)` payload composition, preserving the public daily-review result contract.
- `verify:cleanup-core` continues to stop at the unrelated stale `verify-context-menu` assertion requiring `useTasks` to expose `addSubtask` directly.

## Task App-State Action Extraction Findings - 2026-07-13
- `useTaskActions.ts` mixed task-tree mutations and ordering with a separate application-state action family: persisted behavior settings, retained Obsidian-review cleanup, and selected-date daily work/inspiration updates.
- `taskAppStateActions.ts` now owns that app-state action family through injected setters, persistence functions, equality policy, and cleanup policy; this makes the behavior directly runnable without React.
- `useTaskActions.ts` continues to own task tree CRUD/review/ordering actions and composes the extracted action handlers with `useMemo`, preserving stable public action references until their original dependencies change.
- `verify:cleanup-core` still reaches only the pre-existing stale `verify-context-menu` expectation that `useTasks` directly exposes `addSubtask`; the newly registered focused verifier passes before that baseline blocker.

## Task Completion Action Extraction Findings - 2026-07-13
- `useTaskActions.ts` mixed ordinary task-tree CRUD/ordering with a distinct completion-review lifecycle: creating task/subtask reviews, editing reviews, deleting reviews with confirmation and optional retention, and completing subtasks without a review.
- `taskCompletionActions.ts` now owns that lifecycle as an injectable factory, so its state mutations, time/ID generation, confirmation, and retained-review persistence are directly runnable without React.
- The `TaskActions.completeTaskWithReview` contract intentionally still accepts a caller-supplied `id` field while the implementation overwrites it with a generated ID, matching the pre-extraction public type and behavior.
- `useTaskActions.ts` remains the composition layer and preserves stable memoized action references for unchanged dependencies; task CRUD, collapse, priority, and ordering callbacks remain local.
- `verify:cleanup-core` continues to stop only at the pre-existing stale `verify-context-menu` assertion requiring `useTasks` to expose `addSubtask` directly.

## Task Tree Action Extraction Findings - 2026-07-13
- After app-state and completion-review moves, `useTaskActions.ts` still combined ordinary task-tree CRUD with React composition and manual ordering coordination.
- `taskTreeActions.ts` now owns ordinary task creation/editing/updating, task/subtask completion, subtask creation/deletion, collapse, priority changes, and clearing completed selected-day tasks through injected dependencies.
- Base task deletion intentionally remains split: the focused factory removes it from the task tree while `useTaskActions.ts` coordinates the separate manual-order state cleanup.
- Existing `clearCompletedTasks` behavior marks visible completed tasks as `cleared: true`; it does not remove them from the state array. The new runtime verifier records that established behavior.
- `verify:cleanup-core` continues to stop only at the pre-existing stale `verify-context-menu` assertion requiring `useTasks` to expose `addSubtask` directly.

## Task Ordering Action Extraction Findings - 2026-07-13
- The final callbacks in `useTaskActions.ts` had a real shared responsibility: coordinate task-tree deletion with persisted manual-order cleanup, plus update source-group and per-source task ordering.
- `taskOrderingActions.ts` now owns that coordination as an injectable factory. It preserves the established delete order: remove the task tree entry first, then remove its ID from every saved manual-order bucket.
- `useTaskActions.ts` now contains only React-specific persistence/confirmation boundaries and `useMemo` composition for app-state, review, task-tree, and ordering action families.
- The new focused verifier covers deletion cleanup across source buckets and both reorder routes. `verify:task-core`, TypeScript, and production build pass.
- On the current workspace, `verify:cleanup-core` passes context-menu and reaches an unrelated stale `verify:date-key-reuse` assertion: it expects `shared/obsidianTemplateTaskLines.ts` to import `taskRollover` directly, although the active implementation obtains resolved task dates from `obsidianTemplateTaskVisibility`.

## AI Review Diagnostics Extraction Findings - 2026-07-13
- `electron/aiReviewRuntime.ts` combined independent diagnostic-record construction with runtime-only account resolution, progress IPC fanout, and DOCX extraction.
- `electron/aiReviewDiagnostics.ts` now owns stage record creation, deterministic run identity injection, finished-time calculation, profile host sanitization, one-pass LLM usage aggregation, output/truncation accounting, and omitted-request-stage recovery.
- The runtime helper remains the compatibility facade for `stage` and `createDiagnostic`, so its callers in IPC and daily runners retain the same contract.
- The focused verifier runs the diagnostic factory with injected clock and run-ID dependencies, covering the externally observable aggregation rules without needing Electron runtime state.

## Task Persistence Transforms Extraction Findings - 2026-07-13
- `taskTransforms.ts` combined date-query helpers with persisted-value runtime guards, scheduled-date cleanup, legacy review migration, and recursive task-tree normalization.
- `taskPersistenceTransforms.ts` now owns the persistence family; the existing module remains a compatibility facade for `parseStoredTasks`, `normalizeTask`, guards, and task date queries.
- Date-query behavior remains unchanged: visible dates use valid, unique, sorted secondary dates, while direct date matching ignores malformed scheduled dates without allocating the visible-date list.
- Focused and task-domain regression checks, TypeScript, and the production build all pass. Two old structural assertions were updated to inspect the new persistence owner rather than requiring implementation to remain in the facade.

## App Shell Composition Contract Extraction Findings - 2026-07-13
- `appShellComposition.tsx` had already delegated runtime prop assembly, but still carried a large cross-layer compile-time input interface.
- `appShellCompositionTypes.ts` now owns the `AppShellCompositionOptions` contract; the runtime composition module re-exports it, preserving existing type-only import paths for `appShellCompositionInputs.ts` and any future consumer.
- The runtime composition file is now 190 lines and contains only title bar, main-content, and overlay prop composition.
- Focused shell, main-content, overlay, TypeScript, and production-build checks pass.

## Electron Main AI Review Services Composition Findings - 2026-07-13
- `electron/main.ts` still assembled five related service families: AI runtime helpers, an intentionally delayed runner bridge, Obsidian services, the daily AI runner, and timer scheduling.
- `electron/mainAiReviewServices.ts` now owns this integration boundary. The bridge remains necessary because Obsidian sync needs `runReviewForDate` before the daily runner can be created from the Obsidian daily-file accessor.
- The exact safe order is preserved: create bridge, pass its callback to Obsidian services, create daily runner with `getDailyFilePath`, bind the runner, then create the timer scheduler.
- `main.ts` has become an application-level dependency provider and capability consumer. Existing structural verifiers now inspect the true composition owner rather than forcing duplicate wiring into main.

## Desktop Widget State Application Extraction Findings - 2026-07-13
- `desktopWindowMode.ts` mixed desktop foreground-state resolution and guard lifetime with the independent imperative application of `desktop-visible`, `dt-active`, and `app-background` window states.
- `desktopWidgetStateApplier.ts` now owns the imperative effects: desktop owner attachment/cleanup, user-hidden visibility checks, always-on-top transitions, Win32 topmost changes, background sinking, and the original 250ms background-sink throttle.
- `desktopWindowMode.ts` retains the poll loop, `resolveDesktopWidgetState` input construction, diagnostics snapshot, desktop mode orchestration, and its public controller contract.
- The existing `markDesktopInteractive` behavior remains state-only through the applier's explicit `markInteractive` method; it does not begin applying window effects eagerly.
- Focused structural checks, TypeScript, and the production build pass. `verify:window-mode` separately fails at a stale TitleBar `readWindowMode` assertion outside these files.
