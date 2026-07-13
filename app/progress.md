# DailyTodo Cleanup Progress

## 2026-07-07 - Phase 2 Normalized Master Plan
- User asked to start Phase 2: establish a normalized DailyTodo master plan based on the previous project understanding report.
- Restored existing planning context from `task_plan.md`, `findings.md`, and `progress.md`.
- Re-read current product/code references: `README.md`, `SPEC.md`, `package.json`, `../docs/DailyTodo-Codebase-Map.md`, `../docs/DailyTodo-Developer-Code-Guide.md`, and `../docs/superpowers/specs/2026-07-03-dailytodo-product-optimization-design.zh.md`.
- Confirmed current code reality: DailyTodo is now a local-first Electron execution app with task trees, Obsidian/Companion sync, AI Review, personalization, window modes, and many focused verification scripts; it is no longer represented by the original simple todo spec alone.
- Created the normalized master plan at `../docs/DailyTodo-Normalized-Master-Plan.md` with north star, current reality, system boundaries, product roadmap, technical roadmap, risks, and definition of done.
- Intentionally kept `app/task_plan.md` as the ongoing cleanup execution log rather than rewriting it into the long-term product roadmap.

## 2026-07-06 Final Cleanup Pass
- Calibrated stale verification scripts after modularization:
  - `scripts/verify-settings-v2-window-mode.ts` now verifies settings-mode width in `electron/windowState.ts`.
  - `scripts/verify-frosted-glass-opacity-controls.ts` now verifies unified opacity helpers in `src/components/settings/appearanceSettings.ts`.
  - `scripts/verify-ui-feedback-regressions.ts` now verifies restored-window normalization in `electron/windowState.ts`.
  - `scripts/verify-task-layout-unified-glass.ts` now verifies the current card-level subtask collapse interaction instead of the old `task-tree-toggle` class.
- Removed the duplicate `verify:settings-appearance-module` key from `package.json`.
- Cleaned orphaned helper comments left in `src/components/SettingsPanel.tsx` after extracting Appearance helpers.
- Updated `../docs/DailyTodo-Codebase-Map.md` and `../docs/DailyTodo-Developer-Code-Guide.md` with the final module map and verification commands.
- Rewrote `task_plan.md` into a clean completed-state plan because the previous file displayed mojibake in this terminal.
- Final verification passed:
  - `npm run verify:settings-v2-window-mode`
  - `npm run verify:frosted-glass-opacity`
  - `npm run verify:task-layout-unified-glass`
  - `npm run verify:ui-feedback-regressions`
  - `npm run verify:cleanup-core`
  - `npm run verify:settings-v2-ai-account`
  - `npm run verify:ai-progress-ui`
  - `npm run verify:ai-run-diagnostics`
  - `npm run verify:theme-visual-isolation`
  - `npm run verify:main-window-structure`
  - `npm run verify:window-mode`
  - `npm run verify:rc`
  - `npm run build`
- Remaining intentional caveat: `electron/main.ts` and `src/components/SettingsPanel.tsx` are smaller and better supported by module-boundary checks, but still contain high-coupling sections that should be split later with dedicated tests rather than aggressively in one pass.

## 2026-07-06 Cleanup Addendum
- Added and verified `src/styles/index.css` as the single renderer global style entry.
- Extracted shared settings controls to `src/components/settings/SettingsControls.tsx`.
- Extracted Electron icon helpers to `electron/appIcons.ts`.
- Extracted App viewport style tokens to `src/app/appViewportStyle.ts`.
- Extracted App task tree helpers to `src/utils/taskTree.ts`.
- Reused shared date helpers from `shared/taskRollover.ts` in `App`, `DateNavigator`, and AI stats.
- Updated codebase/developer docs with the new module map and verification commands.
- Added verification scripts: `verify-style-entry`, `verify-settings-panel-modules`, `verify-electron-main-modules`, `verify-app-viewport-style-module`, `verify-app-task-tree-module`, and `verify-date-key-reuse`.
- Latest targeted checks passed: `verify:app-viewport-style-module`, `verify:frosted-glass-opacity`, `verify:app-task-tree-module`, `verify:date-key-reuse`, `verify:task-list-interactions`, `verify:ai-stats`, and `typecheck`.

## Session: 2026-07-06

### Phase 1: Baseline And Verification
- **Status:** in_progress
- **Started:** 2026-07-06 Asia/Shanghai
- Actions taken:
  - 读取技能流程并确认本轮使用文件化计划、TDD/验证优先、完成前验证。
  - 查看 `git status --short`，确认仓库已有较多修改和未跟踪文件。
  - 读取 `package.json`，确认现有验证脚本和缺少组合脚本。
  - 建立本轮 `task_plan.md`、`findings.md`、`progress.md`。
  - 按红灯步骤运行 `npm run verify:task-core`，确认缺少组合脚本。
  - 在 `package.json` 增加 `verify:task-core` 和 `verify:cleanup-core`。
  - 在 `scripts/verify-context-menu.ts` 增加重复 CSS 入口校验。
  - 调查 `verify:context-menu` 旧断言失败：当前 `TaskItem` 已从递归子任务树切换到 `task-cluster`、`SubtaskCard`、`useVirtualSubtasks`。
  - 更新 `scripts/verify-context-menu.ts` 的 TaskItem 结构断言以匹配当前实现。
- Files created/modified:
  - `task_plan.md` created
  - `findings.md` created
  - `progress.md` created
  - `package.json` modified
  - `scripts/verify-context-menu.ts` modified

## Test Results
| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| Missing task core script red check | `npm run verify:task-core` | Fail because script does not exist before adding it | `npm error Missing script: "verify:task-core"` | expected fail |
| Task core suite | `npm run verify:task-core` | Pass after adding script | All task core verification scripts passed | pass |
| Context menu stale assertion | `npm run verify:context-menu` | Reveal next failing cleanup target | Failed on old `task-tree-toggle` assertion before reaching CSS duplicate check | expected fail |
| Context menu duplicate import red check | `npm run verify:context-menu` | Fail while `App.tsx` still imports context-menu CSS | Failed with `App should not duplicate the global context-menu.css import.` | expected fail |
| Context menu stale scheduledDates assertion | `npm run verify:context-menu` | Pass duplicate import fix, then reveal any stale checks | Failed because the script still expected `useTasks.ts` to contain `scheduledDates` directly | expected fail |
| Settings controls module red check | `npm run verify:settings-panel-modules` | Fail before the new module exists | Failed with `Settings controls module should exist.` | expected fail |
| Style entry red check | `npm run verify:style-entry` | Fail before the new style entry exists | Failed with `Style entry file should exist.` | expected fail |
| Electron icon module red check | `npm run verify:electron-main-modules` | Fail before appIcons module exists | Failed with `Electron app icon module should exist.` | expected fail |

## Error Log
| Timestamp | Error | Attempt | Resolution |
|-----------|-------|---------|------------|
| 2026-07-06 | `verify:task-core` missing | 1 | Added the package script as the intended next implementation step. |
| 2026-07-06 | `verify:context-menu` failed on stale `task-tree-toggle` assertion | 1 | Compared current `TaskItem` and related verification scripts, then updated the assertion to current cluster/subtask-card structure. |
| 2026-07-06 | `App.tsx` duplicated global context menu CSS import | 1 | Removed the duplicate import so `src/main.tsx` owns the global style entry. |
| 2026-07-06 | `verify:context-menu` expected scheduled-date logic inside `useTasks.ts` | 1 | Updated the script to verify `taskTransforms.ts` and `taskSelectors.ts`, which now own that logic. |

## 5-Question Reboot Check
| Question | Answer |
|----------|--------|
| Where am I? | Phase 1: Baseline And Verification |
| Where am I going? | 先补验证，再清理 renderer，再拆 SettingsPanel，最后小步拆 Electron main 并更新文档。 |
| What's the goal? | 将 DailyTodo 整理成更清晰的模块边界，保留行为并方便以后修改。 |
| What have I learned? | 见 `findings.md`。 |
| What have I done? | 已建立本轮整理计划并记录初始仓库状态。 |

## 2026-07-06 Continuation Context Restore
- User asked to continue code optimization after switching to thread `019f32b2-d829-7753-b06f-9dc090cb2c9e`.
- Restored planning context from `task_plan.md`, `progress.md`, and `findings.md`; the previous DailyTodo cleanup plan is complete.
- Session catch-up script produced no unsynced-context output.
- Current safe follow-up candidates from the completed plan:
  - Split remaining high-coupling Electron main IPC sections with dedicated verification.
  - Split remaining `SettingsPanel.tsx` sync/templates/schedule/general sections with focused checks.
  - Clean `src/i18n.ts` and mojibake UI text in a dedicated encoding pass with visual review.
- Current large files observed: `electron/main.ts` 2185 lines, `src/components/SettingsPanel.tsx` 840 lines, `src/App.tsx` 748 lines, `src/hooks/useTasks.ts` 471 lines.
- No implementation changes made in this continuation turn yet; awaiting the next optimization target/design approval.

## 2026-07-06 SettingsPanel Optimization Exploration
- User chose option A: continue splitting `src/components/SettingsPanel.tsx`.
- Explored current structure:
  - `SettingsPanel.tsx` is 840 lines.
  - Existing extracted settings modules: `SettingsControls.tsx`, `appearanceSettings.ts`, `AiReviewSettingsWidgets.tsx`.
  - Existing verification scripts cover shared controls, appearance helpers, and AI review widgets.
  - Remaining inline page sections: `appearance`, `sync`, `templates`, `schedule`, `aiReview`, `general`.
- Safe split candidates identified:
  - Low-coupling: `templates`, `schedule`, `general` sections.
  - Medium-coupling: `sync` section because it touches Obsidian template paths and sync preview.
  - Higher-coupling: `aiReview` section because it shares generation state, profile routing, timers, source options, diagnostics, and Electron AI Review IPC.
- No source implementation changes made yet; next step is design approval for a small, test-backed SettingsPanel split.

## 2026-07-06 SettingsPanel Basic Sections Spec And Plan
- Wrote design spec: `../docs/superpowers/specs/2026-07-06-settings-panel-basic-sections-design.md`.
- Wrote implementation plan: `../docs/superpowers/plans/2026-07-06-settings-panel-basic-sections.md`.
- Created branch `codex/settings-basic-sections` to avoid continuing implementation directly on `master`.


## 2026-07-06 SettingsPanel Basic Sections Implementation
- Added `scripts/verify-settings-basic-sections.ts` and `verify:settings-basic-sections` to protect the new SettingsPanel section boundaries.
- Confirmed TDD red states:
  - Missing `TemplatesSettingsSection.tsx` failed as expected.
  - After templates extraction, missing `ScheduleSettingsSection.tsx` failed as expected.
  - After schedule extraction, missing `GeneralSettingsSection.tsx` failed as expected.
- Extracted low-coupling settings tabs:
  - `src/components/settings/TemplatesSettingsSection.tsx`
  - `src/components/settings/ScheduleSettingsSection.tsx`
  - `src/components/settings/GeneralSettingsSection.tsx`
- Replaced the corresponding inline `SettingsPanel.tsx` blocks with component renders.
- Removed now-unused `AppLanguage`, `AutoStartToggle`, and `updateApp` references from `SettingsPanel.tsx` after TypeScript reported them.
- `npm run verify:settings-basic-sections` passed.
- `npm run typecheck` passed after cleanup.

## Error Log Addendum - 2026-07-06
| Error | Attempt | Resolution |
|-------|---------|------------|
| PowerShell rejected `&&` command chaining for focused regression | 1 | Re-running the same commands with PowerShell-compatible sequential execution and exit-code checks. |


## 2026-07-06 SettingsPanel Basic Sections Final Verification
- Focused regression passed using PowerShell-compatible sequential commands:
  - `npm run verify:settings-basic-sections`
  - `npm run verify:settings-panel-modules`
  - `npm run verify:cleanup-core`
- Production build passed: `npm run build`.
- Current line counts after this pass:
  - `src/components/SettingsPanel.tsx`: 747 lines
  - `src/components/settings/TemplatesSettingsSection.tsx`: 40 lines
  - `src/components/settings/ScheduleSettingsSection.tsx`: 66 lines
  - `src/components/settings/GeneralSettingsSection.tsx`: 78 lines
- Updated `task_plan.md` Phase 6 status to complete.

## 2026-07-06 Fresh Final Verification
- `npm run verify:cleanup-core` passed, including `verify:settings-basic-sections` and `typecheck`.
- `npm run build` passed.
- Current branch: `codex/settings-basic-sections`.
- Base merge point with `master`: `64a37f75b6a20ca16b178ee8754beb8c3243371e`.


## 2026-07-06 Electron Window IPC Module Split
- User selected option `1`: continue broad optimization by extracting low-risk Electron IPC modules.
- Created branch `codex/electron-window-ipc` for the new refactor slice.
- Wrote implementation plan: `../docs/superpowers/plans/2026-07-06-electron-window-ipc.md`.
- Added `scripts/verify-electron-window-ipc-module.ts` and `verify:electron-window-ipc-module`.
- Confirmed TDD red state: `npm run verify:electron-window-ipc-module` failed because `electron/windowIpc.ts` did not exist.
- Extracted `electron/windowIpc.ts` with `registerWindowIpcHandlers(options)` for these channels:
  - `window:minimize`, `window:close`
  - `window:getWindowMode`, `window:setWindowMode`
  - `window:getAlwaysOnTop`, `window:toggleAlwaysOnTop`
  - `window:resetPosition`, `window:setSettingsMode`
  - `window:getLockWindowPosition`, `window:setLockWindowPosition`
  - `window:setCompactMode`, `window:getCompactMode`
  - `window:getAutoStart`, `window:setAutoStart`
- `electron/main.ts` still owns mutable state and behavior functions; the new module only registers handlers through injected dependencies.
- Added `verify:electron-window-ipc-module` to `verify:cleanup-core`.
- Fresh verification passed:
  - `npm run verify:electron-window-ipc-module`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-06 Electron Store/Settings IPC Module Split
- Continued the low-risk Electron IPC extraction strategy on branch `codex/electron-window-ipc` without reverting the existing window IPC work.
- Added `scripts/verify-electron-settings-ipc-module.ts` and `verify:electron-settings-ipc-module`.
- Initial verifier run had a syntax error; fixed the verifier, then confirmed the valid TDD red state: `electron/settingsIpc.ts` was missing.
- Extracted `electron/settingsIpc.ts` with `registerSettingsIpcHandlers(options)` for these channels:
  - `store:get`, `store:set`
  - `settings:getApp`, `settings:setApp`
  - `settings:getObsidianTemplates`, `settings:setObsidianTemplates`, `settings:resetObsidianTemplates`
- Preserved `store:set` task-change broadcasting via `BrowserWindow.getAllWindows()` while excluding the sender webContents id.
- Preserved Obsidian template reset behavior using `createDefaultObsidianTemplateSettings()` and `OBSIDIAN_TEMPLATE_SETTINGS_KEY`.
- Added `verify:electron-settings-ipc-module` to `verify:cleanup-core`.
- Fresh verification passed:
  - `npm run verify:electron-settings-ipc-module`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-06 Electron Task Context Menu IPC Module Split
- Continued the low-risk Electron IPC extraction strategy on branch `codex/electron-window-ipc` without reverting existing window/settings IPC work.
- Added `scripts/verify-electron-task-context-menu-ipc-module.ts` and `verify:electron-task-context-menu-ipc-module`.
- Confirmed TDD red state: `npm run verify:electron-task-context-menu-ipc-module` failed because `electron/taskContextMenuIpc.ts` did not exist.
- Extracted `electron/taskContextMenuIpc.ts` with `registerTaskContextMenuIpcHandlers(options)` for these channels:
  - `taskContextMenu:open`
  - `taskContextMenu:close`
  - `taskContextMenu:resize`
  - `taskContextMenu:action`
- Kept popup BrowserWindow creation/closing ownership in `electron/main.ts`, while moving resize/action IPC behavior behind injected `getTaskMenuWindow()` and `getMainWindow()` dependencies.
- Preserved resize behavior: height clamp `80..600`, fallback to `TASK_MENU_HEIGHT`, work-area y clamp with margin `8`, and unchanged x/width.
- Updated stale `scripts/verify-context-menu.ts` assertions to recognize the new IPC module boundary.
- Added `verify:electron-task-context-menu-ipc-module` to `verify:cleanup-core`.
- Fresh verification passed:
  - `npm run verify:electron-task-context-menu-ipc-module`
  - `npm run verify:context-menu`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-06 App Task Menu Action Helper Split
- Continued broad cleanup with a low-risk renderer extraction after the Electron IPC splits.
- Added `scripts/verify-app-task-menu-actions-module.ts` and `verify:app-task-menu-actions-module`.
- Confirmed TDD red state: `npm run verify:app-task-menu-actions-module` failed because `src/app/taskMenuActions.ts` did not exist.
- Extracted `src/app/taskMenuActions.ts` with:
  - `TaskMenuActionPayload`
  - `ParsedTaskMenuAction`
  - `parseTaskMenuAction(payload)`
  - `createEditRequest(prev, taskId)`
- `App.tsx` now delegates popup payload normalization and edit nonce creation to the helper, while still applying mutations through `addSubtask`, `deleteTask`, `updateTask`, and `setEditRequest`.
- Preserved existing behavior for `addSubtask`, `delete`, `edit`, and ordinary update payloads.
- Added `verify:app-task-menu-actions-module` to `verify:cleanup-core`.
- Fresh verification passed:
  - `npm run verify:app-task-menu-actions-module`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-06 TaskItem Context Menu Helper Split
- Continued broad cleanup with a low-risk TaskItem extraction after the App task-menu action helper split.
- Added `scripts/verify-task-item-context-menu-helper.ts` and `verify:task-item-context-menu-helper`.
- Confirmed TDD red state: `npm run verify:task-item-context-menu-helper` failed because `src/components/taskItem/taskItemContextMenu.ts` did not exist.
- Extracted `src/components/taskItem/taskItemContextMenu.ts` with:
  - `TaskContextMenuTheme`
  - `TaskContextMenuPayload`
  - `parseCssNumber(value, fallback)`
  - `getThemeIdFromClassList(classList)`
  - `createTaskContextMenuTheme(options)`
  - `createTaskContextMenuPayload(options)`
- `TaskItem.tsx` now delegates popup theme and payload construction to the helper while still owning the context-menu event, DOM style lookup, and `openTaskContextMenu` IPC call.
- Preserved current popup behavior: task and tag payloads, screen coordinates, dark-mode flag, `theme-*` id detection, `--personal-accent`, `--personal-secondary`, `--menu-opacity`, `--blur-strength`, and `--card-radius` fallbacks.
- `npm run verify:context-menu` initially failed because the existing structural check still expected `TaskItem.tsx` to contain `--personal-accent` inline. Root cause was a stale verifier expectation after the helper extraction; updated the verifier to check `src/components/taskItem/taskItemContextMenu.ts` for theme capture and `TaskItem.tsx` for helper delegation.
- Added `verify:task-item-context-menu-helper` to `verify:cleanup-core`.
- Fresh verification passed:
  - `npm run verify:task-item-context-menu-helper`
  - `npm run verify:context-menu`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-06 TaskItem Virtual Subtasks Hook Split
- Continued broad cleanup with another low-risk TaskItem extraction after the context-menu helper split.
- Added `scripts/verify-task-item-virtual-subtasks-hook.ts` and `verify:task-item-virtual-subtasks-hook`.
- Confirmed TDD red state: `npm run verify:task-item-virtual-subtasks-hook` failed because `src/components/taskItem/useVirtualSubtasks.ts` did not exist.
- Extracted `src/components/taskItem/useVirtualSubtasks.ts` with:
  - `TASK_SUBTASK_VIEWPORT_HEIGHT`
  - `VirtualSubtaskItem`
  - `useVirtualSubtasks(subtasks, isExpanded)`
  - private row-height, overscan, and virtualization-threshold constants.
- `TaskItem.tsx` now imports the hook and viewport-height constant while still owning subtask rendering, animation, edit/delete/toggle/review callbacks, and event propagation.
- Preserved existing virtualization behavior: threshold `30`, row height `46`, overscan `4`, viewport height `400`, passive scroll listener, total-height calculation, visible range math, and item top positioning.
- Added `verify:task-item-virtual-subtasks-hook` to `verify:cleanup-core`.
- Fresh verification passed:
  - `npm run verify:task-item-virtual-subtasks-hook`
  - `npm run verify:context-menu`
  - `npm run verify:cleanup-core`
  - `npm run build`



## 2026-07-06 TaskItem SubtaskCard Module Split
- Continued broad cleanup with a low-risk TaskItem component extraction after the virtual-subtasks hook split.
- Added `scripts/verify-task-item-subtask-card-module.ts` and confirmed the red state with `npm exec -- tsx scripts/verify-task-item-subtask-card-module.ts`, which failed because `src/components/taskItem/SubtaskCard.tsx` did not exist.
- Extracted `src/components/taskItem/SubtaskCard.tsx` with `SubtaskCardProps` and `SubtaskCard` for child-task row UI and actions.
- Extracted `src/components/taskItem/taskItemPresentation.tsx` with shared `priorityTitles`, `hasTaskReview`, `ReviewActionButton`, `ReviewIcon`, `DragDotsIcon`, and `TrashIcon`.
- `TaskItem.tsx` now imports `SubtaskCard` and shared presentation helpers while still owning parent task rendering, virtual-list animation, context-menu DOM lookup, and callback wiring.
- Root-caused and fixed a temporary TypeScript failure introduced by the extraction script: an overly broad removal range clipped `TaskItemProps`; `npm run typecheck` passed after restoring the signatures.
- Added `verify:task-item-subtask-card-module` to `verify:cleanup-core`.
- Fresh verification passed:
  - `npm run verify:task-item-subtask-card-module`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-06 TaskItem Stack Helper Split
- Continued TaskItem modularization with a pure presentation-helper extraction after `SubtaskCard`.
- Added `scripts/verify-task-item-stack-helper.ts` and confirmed the red state with `npm exec -- tsx scripts/verify-task-item-stack-helper.ts`, which failed because `src/components/taskItem/taskItemStack.ts` did not exist.
- Extracted `src/components/taskItem/taskItemStack.ts` with collapsed-stack segment classes, spring/reduced-motion transition constants, subtask stagger timing, segment transitions, and `getStackSegmentCount`.
- `TaskItem.tsx` now imports stack helpers while still rendering stack segment DOM and virtual subtask animations.
- Added `verify:task-item-stack-helper` to `verify:cleanup-core`.
- Fresh verification passed:
  - `npm run verify:task-item-stack-helper`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-06 App Task View Helper Split
- Continued broad cleanup with a pure `App.tsx` helper extraction after TaskItem modularization.
- Added `scripts/verify-app-task-view-module.ts` and confirmed the red state with `npm exec -- tsx scripts/verify-app-task-view-module.ts`, which failed because `src/app/appTaskView.ts` did not exist.
- Extracted `src/app/appTaskView.ts` with `PriorityFilter`, `AppTaskViewOptions`, `AppTaskView`, and `createAppTaskView(options)`.
- `App.tsx` now delegates visible task filtering, drag-disabled derivation, and selected-date command task aliasing to the helper while still owning state, persistence effects, handlers, and rendering.
- Added `verify:app-task-view-module` to `verify:cleanup-core`.
- `npm run verify:cleanup-core` initially failed because `scripts/verify-task-list-interactions.ts` still expected `App.tsx` to inline `isTaskDragDisabled`; root cause was a stale structural assertion after the helper extraction. Updated the verifier to check `App.tsx` for `createAppTaskView` and `src/app/appTaskView.ts` for `isTaskDragDisabled` delegation.
- Fresh verification passed:
  - `npm run verify:app-task-view-module`
  - `npm run verify:task-list-interactions`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-06 App Personalization Helper Split
- Continued broad cleanup with another low-risk `App.tsx` extraction after App task-view modularization.
- Small design: extract pure personalization/theme helper logic only; keep Electron store reads/writes, React state, DOM font-size side effect, and SettingsPanel wiring in `App.tsx`.
- Added `scripts/verify-app-personalization-module.ts` and confirmed TDD red state with `npm run verify:app-personalization-module`, which failed because `src/app/appPersonalization.ts` did not exist.
- Extracted `src/app/appPersonalization.ts` with:
  - `PERSONALIZATION_KEY` and `THEME_OVERRIDES_KEY` store-key exports.
  - `clampFontScale(value)` for the previous 80..130 range with 100 fallback.
  - `normalizeLoadedPersonalization(value)` for default merging, missing-theme matching, and removed/unknown theme fallback.
  - `seedThemeOverridesFromPersonalization(previous, settings)` and `mergeStoredThemeOverrides(previous, stored)` for startup override precedence.
  - `createPersonalizationForThemePreset(preset, themeOverrides)`, `getThemeDefaultsReset(...)`, and `rememberThemeOverride(...)` for preset application/reset and per-theme opacity memory.
- Updated `App.tsx` to delegate these pure calculations while preserving state/effect ownership.
- Encountered one PowerShell command issue: Bash heredoc syntax (`python - <<'PY'`) is invalid in PowerShell. Root cause was shell syntax, not code; switched to PowerShell here-string piped to Python.
- Encountered one stale verifier formatting issue after `package.json` was serialized with spaces/BOM; root cause was a raw-text regex that assumed compact JSON formatting. Updated the verifier to parse JSON and assert script values semantically.
- Focused verification passed:
  - `npm run verify:app-personalization-module`
  - `npm run typecheck`

## 2026-07-07 App Completion Flow Helper Split
- Continued broad `App.tsx` cleanup with a pure completion/review-routing helper extraction.
- Used the existing red verifier `scripts/verify-app-completion-flow-module.ts`; the red state had already failed because `src/app/appCompletionFlow.ts` did not exist.
- Extracted `src/app/appCompletionFlow.ts` with `CompletionTarget`, `ToggleCompletionDecision`, `ViewCompletionDecision`, `getMainTaskToggleDecision`, `getSubtaskToggleDecision`, `resolveCompletionTarget`, and `getViewCompletionDecision`.
- Updated `App.tsx` so task/subtask completion handlers delegate pure branching to the helper while still owning state setters, `toggleTask`, `toggleSubtask`, `markSubtaskDoneWithoutReview`, `completeTaskWithReview`, `updateSubtaskReview`, and dialog cleanup.
- Repaired a verifier typo in `scripts/verify-app-completion-flow-module.ts`: several regex boundaries contained a literal backspace character, so the structural check could not match valid exports.
- `npm run verify:cleanup-core` initially failed at `verify:app-task-tree-module` because the old structural assertion required `App.tsx` to import both `findTaskInTree` and `isSubtask`; after this extraction `isSubtask` correctly lives behind `appCompletionFlow.ts`. Updated the verifier to check the new boundary.
- Fresh verification passed:
  - `npm run verify:app-completion-flow-module`
  - `npm run typecheck`
  - `npm run verify:app-task-tree-module`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 App Template Editor Helper Split
- Continued `App.tsx` cleanup with a small pure helper extraction around template-editor kind mapping.
- Added `scripts/verify-app-template-editor-module.ts` and confirmed the red state with `npm run verify:app-template-editor-module`, which failed because `src/app/appTemplateEditor.ts` did not exist.
- Extracted `src/app/appTemplateEditor.ts` with `AppTemplateKind`, `AppReportTemplateKind`, `TemplateFieldName`, `getTemplateFieldForKind`, `getInitialTemplateForKind`, and `applyTemplateUpdate`.
- Updated `App.tsx` to delegate initial template fallback selection and save-time template merging, while preserving modal state ownership and `updateObsidianTemplates` side effects.
- Repaired a repeated verifier-writing issue where `\b` became a literal backspace in regex source.
- `npm run typecheck` caught an import-fragment syntax error from the automated edit; root cause was an over-specific text replacement that removed only part of the old `sectionConfig` import. Removed the leftover `import {` fragment.
- Fresh verification passed:
  - `npm run verify:app-template-editor-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-07 App Keyboard Shortcuts Helper Split
- Continued `App.tsx` cleanup with a small pure helper extraction around keyboard shortcut decisions.
- Small design: extract only shortcut-to-action mapping; keep event listener registration, `preventDefault`, React state setters, date shifting, and daily-note opening in `App.tsx`.
- Added `scripts/verify-app-keyboard-shortcuts-module.ts` and confirmed red states:
  - `npm run verify:app-keyboard-shortcuts-module` failed before package script registration.
  - `npm exec -- tsx scripts/verify-app-keyboard-shortcuts-module.ts` failed because `src/app/appKeyboardShortcuts.ts` did not exist.
- Extracted `src/app/appKeyboardShortcuts.ts` with `AppKeyboardShortcutAction` and `getAppKeyboardShortcutAction(event)`.
- Updated `App.tsx` to delegate Ctrl+K, Ctrl+O, `[` and `]` shortcut decisions while preserving the previous INPUT/TEXTAREA typing guard for date navigation.
- Focused verification passed:
  - `npm run verify:app-keyboard-shortcuts-module`
- `npm run verify:cleanup-core` initially failed at `verify:app-task-tree-module` because the stale structural assertion still expected `App.tsx` to contain inline `shiftDateKey(prev, -1)` and `shiftDateKey(prev, 1)` calls. Root cause: keyboard date deltas moved into `appKeyboardShortcuts.ts`. Updated the verifier to check `shiftDateKey(prev, action.days)` in `App.tsx` and `days: -1` / `days: 1` in the keyboard helper.
- Full verification for the keyboard shortcut slice passed:
  - `npm run verify:app-keyboard-shortcuts-module`
  - `npm run typecheck`
  - `npm run verify:app-task-tree-module`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-07 App Companion Status Helper Split
- Continued `App.tsx` cleanup with a pure helper extraction around Obsidian Companion status messages.
- Small design: extract only result-to-status-text mapping; keep Companion store calls, sync-plan state, mobile capture item mutation, and panel wiring in `App.tsx`.
- Added `scripts/verify-app-companion-status-module.ts` and confirmed the red state with `npm exec -- tsx scripts/verify-app-companion-status-module.ts`, which failed because `src/app/appCompanionStatus.ts` did not exist.
- Extracted `src/app/appCompanionStatus.ts` with `getCompanionPreviewStatus`, `getCompanionSyncStatus`, and `getCompanionMobileImportStatus`.
- Updated `App.tsx` to delegate preview, sync, and mobile import status copy while preserving existing success strings and `errors.join(' ')` fallback behavior.
- Focused verification passed:
  - `npm run verify:app-companion-status-module`
- Full verification for the companion status slice passed:
  - `npm run verify:app-companion-status-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-07 App Scheduled Reports Helper Split
- Continued `App.tsx` cleanup with a pure helper extraction around scheduled AI report target dates and error diagnostics.
- Small design: extract weekly/monthly target date-key calculation and scheduled report result handling; keep AI review tick listener registration, Electron IPC calls, and task-list inputs in `App.tsx`.
- Added `scripts/verify-app-scheduled-reports-module.ts`; the first run failed because a Chinese fallback-message regex was converted to an invalid `?` regex, so the verifier was repaired to check fallback behavior structurally instead of matching localized text.
- Confirmed the corrected red state with `npm exec -- tsx scripts/verify-app-scheduled-reports-module.ts`, which failed because `src/app/appScheduledReports.ts` did not exist.
- Extracted `src/app/appScheduledReports.ts` with `formatScheduledReportDateKey`, `getScheduledWeeklyReportDateKey`, `getScheduledMonthlyReportDateKey`, and `handleScheduledReportResult`.
- During implementation, an exact text replacement failed because PowerShell displayed `App.tsx` Chinese comments as mojibake while Python read the real UTF-8 text. Root cause was display encoding mismatch; fixed by slicing the UTF-8 source with Python and preserving the existing fallback string via `repr`.
- Focused verification passed:
  - `npm run verify:app-scheduled-reports-module`
- Full verification for the scheduled reports slice passed:
  - `npm run verify:app-scheduled-reports-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-07 App Theme State Helper Split
- Continued `App.tsx` cleanup with a pure helper extraction around theme state derivation.
- Small design: extract only derived theme identity/class/invisible-state calculation; keep DOM class/data attributes, viewport style calls, React state, and settings-panel event wiring in `App.tsx`.
- Used the already-created `scripts/verify-app-theme-state-module.ts` RED verifier. Its red run failed as expected because `src/app/appThemeState.ts` did not exist.
- Extracted `src/app/appThemeState.ts` with `AppThemeState` and `createAppThemeState(personalization)`.
- Updated `App.tsx` to consume `themeState.activeThemeId`, `themeState.themeClass`, and `themeState.isInvisibleTheme` instead of inlining active theme derivation.
- Added `verify:app-theme-state-module` to `package.json` and included it in `verify:cleanup-core`.
- Focused verification passed:
  - `npm run verify:app-theme-state-module`
- TypeScript verification passed:
  - `npm run typecheck`

- Updated `scripts/verify-settings-appearance-module.ts` after root-cause analysis showed its old direct-import assertion was stale; it now verifies `AppearanceSettingsSection` consumes `appearanceSettings` helpers while `SettingsPanel` consumes the section component.
- Full verification for the appearance-section slice passed:
  - `npm run verify:settings-appearance-section`
  - `npm run typecheck`
  - `npm run verify:settings-appearance-module`
  - `npm run verify:cleanup-core`
  - `npm run build`
- `verify:cleanup-core` initially failed at `verify:app-viewport-style-module` because the stale structural assertion still expected `isInvisibleTheme` inline in `App.tsx`. Root cause: invisible-theme state moved behind `themeState.isInvisibleTheme` while the viewport style behavior stayed the same. Calibrated the verifier to check the new call boundary.
- Full verification for the theme-state slice passed:
  - `npm run verify:app-theme-state-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-07 App Review Dialog State Helper Split
- Continued `App.tsx` cleanup with a pure helper extraction around completion/review dialog derived state.
- Small design: extract only dialog-facing derived task state; keep React state ownership, completion/review handlers, task mutations, and dialog rendering in `App.tsx`.
- Added `scripts/verify-app-review-dialog-state-module.ts` and confirmed the red state with `npm exec -- tsx scripts/verify-app-review-dialog-state-module.ts`, which failed because `src/app/appReviewDialogState.ts` did not exist.
- Extracted `src/app/appReviewDialogState.ts` with `AppReviewDialogState` and `createAppReviewDialogState({ allTasks, completionTask, reviewTask })`.
- Updated `App.tsx` to delegate completion dialog task passthrough and current review task lookup through `reviewDialogState`.
- Added `verify:app-review-dialog-state-module` to `package.json` and included it in `verify:cleanup-core`.
- Focused verification passed:
  - `npm run verify:app-review-dialog-state-module`
- `npm run typecheck` initially failed because `findTaskInTree` is still needed by subtask toggle decisions in `App.tsx`; restored that import without changing behavior.
- TypeScript verification passed:
  - `npm run typecheck`

- Updated `scripts/verify-settings-appearance-module.ts` after root-cause analysis showed its old direct-import assertion was stale; it now verifies `AppearanceSettingsSection` consumes `appearanceSettings` helpers while `SettingsPanel` consumes the section component.
- Full verification for the appearance-section slice passed:
  - `npm run verify:settings-appearance-section`
  - `npm run typecheck`
  - `npm run verify:settings-appearance-module`
  - `npm run verify:cleanup-core`
  - `npm run build`
- Full verification for the review-dialog-state slice passed:
  - `npm run verify:app-review-dialog-state-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-07 App Companion Capture Helper Split
- Continued `App.tsx` cleanup with a pure helper extraction around Companion capture item composition.
- Small design: extract only `buildCaptureItems(...)` plus imported mobile item concatenation; keep `getCurrentCaptureItems()` lazy in `App.tsx` so preview/sync still build items at click time, and keep Companion store/IPC calls and status state in `App.tsx`.
- Added `scripts/verify-app-companion-capture-module.ts` and confirmed the red state with `npm exec -- tsx scripts/verify-app-companion-capture-module.ts`, which failed because `src/app/appCompanionCapture.ts` did not exist.
- Extracted `src/app/appCompanionCapture.ts` with `AppCompanionCaptureInput` and `createAppCompanionCaptureItems(...)`.
- Updated `App.tsx` to delegate current capture item construction without importing `buildCaptureItems` directly.
- Added `verify:app-companion-capture-module` to `package.json` and included it in `verify:cleanup-core`.
- Focused verification passed:
  - `npm run verify:app-companion-capture-module`
- TypeScript verification passed:
  - `npm run typecheck`

- Updated `scripts/verify-settings-appearance-module.ts` after root-cause analysis showed its old direct-import assertion was stale; it now verifies `AppearanceSettingsSection` consumes `appearanceSettings` helpers while `SettingsPanel` consumes the section component.
- Full verification for the appearance-section slice passed:
  - `npm run verify:settings-appearance-section`
  - `npm run typecheck`
  - `npm run verify:settings-appearance-module`
  - `npm run verify:cleanup-core`
  - `npm run build`
- Full verification for the companion-capture slice passed:
  - `npm run verify:app-companion-capture-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-07 App Companion Mobile Helper Split
- Continued `App.tsx` cleanup with a pure helper extraction around Companion mobile inbox item merging.
- Small design: extract only existing+imported item merge logic; keep mobile inbox import IPC, React state setter ownership, and Companion status updates in `App.tsx`.
- Added `scripts/verify-app-companion-mobile-module.ts` and confirmed the red state with `npm exec -- tsx scripts/verify-app-companion-mobile-module.ts`, which failed because `src/app/appCompanionMobile.ts` did not exist.
- Extracted `src/app/appCompanionMobile.ts` with `mergeImportedMobileCaptureItems(existing, items)`.
- Updated `App.tsx` to delegate imported mobile item merging while preserving the state setter boundary.
- Added `verify:app-companion-mobile-module` to `package.json` and included it in `verify:cleanup-core`.
- Focused verification passed:
  - `npm run verify:app-companion-mobile-module`
- TypeScript verification passed:
  - `npm run typecheck`

- Updated `scripts/verify-settings-appearance-module.ts` after root-cause analysis showed its old direct-import assertion was stale; it now verifies `AppearanceSettingsSection` consumes `appearanceSettings` helpers while `SettingsPanel` consumes the section component.
- Full verification for the appearance-section slice passed:
  - `npm run verify:settings-appearance-section`
  - `npm run typecheck`
  - `npm run verify:settings-appearance-module`
  - `npm run verify:cleanup-core`
  - `npm run build`
- Full verification for the companion-mobile slice passed:
  - `npm run verify:app-companion-mobile-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-07 App Task Menu Action Routing Helper Split
- Continued `App.tsx` cleanup by moving popup task-menu action routing into the existing task-menu helper module.
- Small design: keep `App.tsx` responsible for Electron listener registration, task mutation callbacks, and React state setter ownership; extract only the parsed-action dispatch branches.
- Expanded `scripts/verify-app-task-menu-actions-module.ts` and confirmed the red state with `npm run verify:app-task-menu-actions-module`, which failed because `applyParsedTaskMenuAction` did not exist.
- Added `applyParsedTaskMenuAction(...)` and `TaskMenuActionHandlers` to `src/app/taskMenuActions.ts`.
- Updated `App.tsx` to call `applyParsedTaskMenuAction(parseTaskMenuAction(payload), { addSubtask, deleteTask, setEditRequest, updateTask })` instead of inlining action-kind branches.
- Focused verification passed:
  - `npm run verify:app-task-menu-actions-module`
- TypeScript verification passed:
  - `npm run typecheck`

- Updated `scripts/verify-settings-appearance-module.ts` after root-cause analysis showed its old direct-import assertion was stale; it now verifies `AppearanceSettingsSection` consumes `appearanceSettings` helpers while `SettingsPanel` consumes the section component.
- Full verification for the appearance-section slice passed:
  - `npm run verify:settings-appearance-section`
  - `npm run typecheck`
  - `npm run verify:settings-appearance-module`
  - `npm run verify:cleanup-core`
  - `npm run build`
- Full verification for the task-menu action routing slice passed:
  - `npm run verify:app-task-menu-actions-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-07 Electron Companion IPC Module Split
- Continued `electron/main.ts` cleanup with a low-risk IPC boundary extraction for Obsidian Companion handlers.
- Small design: move only `companion:*` IPC registration into `electron/companionIpc.ts`; keep Companion settings persistence, vault defaults, and app lifecycle in `electron/main.ts`.
- Added `scripts/verify-electron-companion-ipc-module.ts` and confirmed the red state with `npm exec -- tsx scripts/verify-electron-companion-ipc-module.ts`, which failed because `electron/companionIpc.ts` did not exist.
- Extracted `electron/companionIpc.ts` with `registerCompanionIpcHandlers({ getCompanionSettings, setCompanionSettings })`.
- Updated `electron/main.ts` to delegate Companion IPC registration and removed its direct `buildSyncPlan` / `writeSyncPlan` / `importMobileInbox` import.
- Added `verify:electron-companion-ipc-module` to `package.json` and included it in `verify:cleanup-core`.
- Focused verification passed:
  - `npm run verify:electron-companion-ipc-module`
- TypeScript verification passed:
  - `npm run typecheck`

- Updated `scripts/verify-settings-appearance-module.ts` after root-cause analysis showed its old direct-import assertion was stale; it now verifies `AppearanceSettingsSection` consumes `appearanceSettings` helpers while `SettingsPanel` consumes the section component.
- Full verification for the appearance-section slice passed:
  - `npm run verify:settings-appearance-section`
  - `npm run typecheck`
  - `npm run verify:settings-appearance-module`
  - `npm run verify:cleanup-core`
  - `npm run build`
- Full verification for the Electron Companion IPC slice passed:
  - `npm run verify:electron-companion-ipc-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-07 SettingsPanel Sync Section Split
- Continued `SettingsPanel.tsx` cleanup with a focused UI section extraction for Obsidian sync settings.
- Small design: move only the sync tab content into `SyncSettingsSection`; keep SettingsPanel section navigation, parent props, and cross-section state ownership in `SettingsPanel.tsx`.
- Added `scripts/verify-settings-sync-section.ts` and confirmed the red state with `npm exec -- tsx scripts/verify-settings-sync-section.ts`, which failed because `src/components/settings/SyncSettingsSection.tsx` did not exist.
- Extracted `src/components/settings/SyncSettingsSection.tsx` with typed path fields for daily, personal weekly/monthly, and external weekly/monthly paths.
- Updated `SettingsPanel.tsx` to render `<SyncSettingsSection ... />` instead of keeping the sync tab markup inline.
- Added `verify:settings-sync-section` to `package.json` and included it in `verify:cleanup-core`.
- Focused verification passed:
  - `npm run verify:settings-sync-section`
- `npm run typecheck` initially failed because the copied mojibake preview template string lost one `${...}` interpolation marker; root cause was the extraction copy, not the section boundary. Restored the original Chinese/English preview template syntax from git while preserving visible text.
- TypeScript verification passed:
  - `npm run typecheck`

- Updated `scripts/verify-settings-appearance-module.ts` after root-cause analysis showed its old direct-import assertion was stale; it now verifies `AppearanceSettingsSection` consumes `appearanceSettings` helpers while `SettingsPanel` consumes the section component.
- Full verification for the appearance-section slice passed:
  - `npm run verify:settings-appearance-section`
  - `npm run typecheck`
  - `npm run verify:settings-appearance-module`
  - `npm run verify:cleanup-core`
  - `npm run build`
- Full verification for the SettingsPanel sync section slice passed:
  - `npm run verify:settings-sync-section`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 SettingsPanel Appearance Section Split
- Continued `SettingsPanel.tsx` cleanup with a focused appearance-tab extraction.
- Small design: move only appearance tab rendering into `AppearanceSettingsSection`; keep SettingsPanel section navigation and app-owned theme/settings callbacks in the parent.
- Added `scripts/verify-settings-appearance-section.ts` and confirmed the red state with `npm exec -- tsx scripts/verify-settings-appearance-section.ts`, which failed because `src/components/settings/AppearanceSettingsSection.tsx` did not exist.
- Extracted `src/components/settings/AppearanceSettingsSection.tsx` for theme preset rendering, global font/glass/blur/radius sliders, and primary/secondary color inputs.
- Updated `SettingsPanel.tsx` to render `<AppearanceSettingsSection ... />` instead of keeping the appearance tab markup inline.
- Added `verify:settings-appearance-section` to `package.json` and included it in `verify:cleanup-core`.
- Focused verification passed:
  - `npm run verify:settings-appearance-section`
- `npm run typecheck` initially caught stale inline helper variables left behind in `SettingsPanel.tsx`; removed those parent-only remnants because the extracted section now owns appearance derivation.
- TypeScript verification passed:
  - `npm run typecheck`

- Updated `scripts/verify-settings-appearance-module.ts` after root-cause analysis showed its old direct-import assertion was stale; it now verifies `AppearanceSettingsSection` consumes `appearanceSettings` helpers while `SettingsPanel` consumes the section component.
- Full verification for the appearance-section slice passed:
  - `npm run verify:settings-appearance-section`
  - `npm run typecheck`
  - `npm run verify:settings-appearance-module`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 SettingsPanel AI Review Timer Section Split
- Continued `SettingsPanel.tsx` cleanup with a narrow AI Review sub-section extraction.
- Small design: move only personal/external auto-generation timer controls into `AiReviewTimerSettingsSection`; keep AI settings persistence, account routing, manual generation, diagnostics, source modes, and progress refs in `SettingsPanel.tsx`.
- Added `scripts/verify-settings-ai-review-timer-section.ts` and confirmed the red state with `npm exec -- tsx scripts/verify-settings-ai-review-timer-section.ts`, which failed because `src/components/settings/AiReviewTimerSettingsSection.tsx` did not exist.
- Extracted `src/components/settings/AiReviewTimerSettingsSection.tsx` for weekly/monthly timer toggles, weekday selectors, monthly day fields, timer time fields, external weekly/monthly timers, and external anonymization toggle.
- Updated `SettingsPanel.tsx` to render `<AiReviewTimerSettingsSection ... />` instead of keeping the timer JSX inline.
- Added `verify:settings-ai-review-timer-section` to `package.json` and included it in `verify:cleanup-core`.
- Focused verification passed:
  - `npm run verify:settings-ai-review-timer-section`
- TypeScript verification passed:
  - `npm run typecheck`



## 2026-07-07 SettingsPanel AI Review Report Routing Section Split
- Continued `SettingsPanel.tsx` cleanup with a focused AI Review account-routing extraction.
- Small design: move only report account routing markup into `AiReviewReportRoutingSection`; keep `SettingsPanel.tsx` owning persistence, profile management, generation actions, progress, diagnostics, and source controls.
- Added `scripts/verify-settings-ai-review-report-routing-section.ts` and confirmed the red state with `npm exec -- tsx scripts/verify-settings-ai-review-report-routing-section.ts`, which failed because `src/components/settings/AiReviewReportRoutingSection.tsx` did not exist.
- Extracted `src/components/settings/AiReviewReportRoutingSection.tsx` for daily, personal weekly, and personal monthly report account selectors.
- Updated `SettingsPanel.tsx` to render `<AiReviewReportRoutingSection ... />` instead of keeping report routing markup inline.
- Added `verify:settings-ai-review-report-routing-section` to `package.json` and included it in `verify:cleanup-core`.
- Focused verification passed:
  - `npm run verify:settings-ai-review-report-routing-section`
- TypeScript verification passed:
  - `npm run typecheck`
- Full verification for the AI Review report-routing section slice passed:
  - `npm run verify:settings-ai-review-report-routing-section`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-07 SettingsPanel AI Review Source Settings Section Split
- Continued `SettingsPanel.tsx` cleanup with a focused AI Review source/base settings extraction.
- Small design: move only report source selectors plus timeout/timer/backfill base controls into `AiReviewSourceSettingsSection`; keep `SettingsPanel.tsx` owning persistence, profile management, manual generation, progress, diagnostics, and top-level composition.
- Added `scripts/verify-settings-ai-review-source-section.ts` and confirmed the red state with `npm exec -- tsx scripts/verify-settings-ai-review-source-section.ts`, which failed because `src/components/settings/AiReviewSourceSettingsSection.tsx` did not exist.
- Extracted `src/components/settings/AiReviewSourceSettingsSection.tsx` for personal/external weekly/monthly source selectors and request timeout/timer/backfill controls.
- Updated `SettingsPanel.tsx` to render `<AiReviewSourceSettingsSection ... />` instead of keeping source/base settings markup inline.
- Added `verify:settings-ai-review-source-section` to `package.json` and included it in `verify:cleanup-core`.
- Focused verification passed:
  - `npm run verify:settings-ai-review-source-section`
- TypeScript verification initially caught a stale `Field` import left in `SettingsPanel.tsx`; removed that unused import.
- TypeScript verification passed:
  - `npm run typecheck`
- Full verification for the AI Review source settings section slice passed:
  - `npm run verify:settings-ai-review-source-section`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-07 SettingsPanel AI Review Manual Generation Section Split
- Continued `SettingsPanel.tsx` cleanup with a focused AI Review manual-generation UI extraction.
- Small design: move only the button row, generation status/progress display, and diagnostic card into `AiReviewManualGenerationSection`; keep `SettingsPanel.tsx` owning generation side effects, IPC calls, progress fallback timers, and diagnostic state transitions.
- Added `scripts/verify-settings-ai-review-manual-generation-section.ts` and confirmed the red state with `npm exec -- tsx scripts/verify-settings-ai-review-manual-generation-section.ts`, which failed because `src/components/settings/AiReviewManualGenerationSection.tsx` did not exist.
- Extracted `src/components/settings/AiReviewManualGenerationSection.tsx` for manual personal/external report generation controls and daily regeneration display.
- Updated `SettingsPanel.tsx` to render `<AiReviewManualGenerationSection ... />` instead of keeping manual-generation markup inline.
- Added `verify:settings-ai-review-manual-generation-section` to `package.json` and included it in `verify:cleanup-core`.
- Focused verification passed:
  - `npm run verify:settings-ai-review-manual-generation-section`
- TypeScript verification passed:
  - `npm run typecheck`
- Full verification for the AI Review manual generation section slice passed:
  - `npm run verify:settings-ai-review-manual-generation-section`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-07 App UI State Persistence Helper Split
- Resumed the interrupted App UI persistence slice after confirming the verifier and helper file already existed and the App/package wiring had not been completed.
- Small design: keep React `useEffect` hooks in `App.tsx`, but move Electron Store key details, startup UI-state loading, priority-filter validation, personalization normalization, theme override seeding/merging, dark-mode loading, and guarded persistence into `src/app/appUiStatePersistence.ts`.
- Confirmed the red state had been established previously with `npm exec -- tsx scripts/verify-app-ui-state-persistence-module.ts`, which failed because the helper module was missing.
- Updated `App.tsx` to call `loadAppUiState({...})` during startup and `persistAppUiState({...})` during persistence while preserving Companion settings and Obsidian template settings loading in `App.tsx`.
- Added `verify:app-ui-state-persistence-module` to `package.json` and included it in `verify:cleanup-core`.
- `verify:cleanup-core` initially exposed a stale `verify-app-personalization-module` assertion that still expected personalization load helpers directly in `App.tsx`; root cause was the new helper boundary, not a behavior regression. Refreshed that verifier to accept `appUiStatePersistence.ts` as the startup-state consumer of `appPersonalization` helpers.
- Focused verification passed:
  - `npm run verify:app-ui-state-persistence-module`
  - `npm run verify:app-personalization-module`
- TypeScript verification passed:
  - `npm run typecheck`
- Full verification for the App UI state persistence slice passed:
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-07 App Shell Effects Helper Split
- Continued `App.tsx` cleanup with a narrow shell/UI side-effects extraction.
- Small design: keep React `useEffect` hooks in `App.tsx`, but move settings-mode IPC synchronization, document theme class toggles, font-size synchronization, and always-on-top preference synchronization into plain functions in `src/app/appShellEffects.ts`.
- Added `scripts/verify-app-shell-effects-module.ts` and confirmed the red state with `npm exec -- tsx scripts/verify-app-shell-effects-module.ts`, which failed because `src/app/appShellEffects.ts` did not exist.
- Extracted `src/app/appShellEffects.ts` and updated `App.tsx` to call `syncSettingsMode`, `syncDocumentThemeClasses`, `syncDocumentFontScale`, and `syncAlwaysOnTopPreference` from its existing effects.
- TypeScript caught that `fontScale` and `alwaysOnTop` can be undefined; widened helper inputs to match the original behavior (`clampFontScale` fallback and falsy always-on-top guard).
- `verify:cleanup-core` initially exposed a stale `verify-app-personalization-module` assertion that still expected `clampFontScale(personalization.fontScale)` directly in `App.tsx`; root cause was the new shell-effects boundary, not a behavior regression. Refreshed that verifier to accept the helper as the clamp consumer.
- Focused verification passed:
  - `npm run verify:app-shell-effects-module`
  - `npm run verify:app-personalization-module`
- TypeScript verification passed:
  - `npm run typecheck`
- Full verification for the App shell effects slice passed:
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-07 App Companion Actions Helper Split
- Continued `App.tsx` cleanup with a narrow Companion/Obsidian action-handler extraction.
- Small design: keep React state and dependency wiring in `App.tsx`, but move the async vault chooser, Companion preview/sync, and mobile inbox import workflows into `createAppCompanionActions` with explicit dependencies.
- Confirmed the red state with `npm exec -- tsx scripts/verify-app-companion-actions-module.ts`, which failed because `src/app/appCompanionActions.ts` did not exist.
- Extracted `src/app/appCompanionActions.ts` and updated `App.tsx` to destructure `chooseCompanionVault`, `previewCompanion`, `syncCompanion`, and `importCompanionMobileInbox` from the helper.
- Added `verify:app-companion-actions-module` to `package.json` and included it in `verify:cleanup-core`.
- Focused/type verification passed before the full run:
  - `npm run verify:app-companion-actions-module`
  - `npm run typecheck`
- `verify:cleanup-core` exposed stale status/mobile verifier boundaries that still required `App.tsx` to import those helpers directly. Root cause was the new action-helper consumer boundary, not a behavior regression; refreshed those verifiers to check `appCompanionActions.ts` as the consumer while keeping copy/merge assertions intact.
- Full verification for the App Companion actions slice passed:
  - `npm run verify:app-companion-mobile-module`
  - `npm run verify:app-companion-status-module`
  - `npm run verify:app-companion-actions-module`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-07 App Obsidian Template Actions Helper Split
- Continued `App.tsx` cleanup with a narrow Obsidian template/settings sync action extraction.
- Small design: keep React state, current task/note inputs, and modal wiring in `App.tsx`, but move `updateObsidianTemplates`, `resetObsidianTemplates`, and `previewSettingsSync` workflows into `createAppObsidianTemplateActions` with explicit dependencies.
- Added `scripts/verify-app-obsidian-template-actions-module.ts` and confirmed the red state with `npm exec -- tsx scripts/verify-app-obsidian-template-actions-module.ts`, which failed because `src/app/appObsidianTemplateActions.ts` did not exist.
- Extracted `src/app/appObsidianTemplateActions.ts` and updated `App.tsx` to destructure `updateObsidianTemplates`, `resetObsidianTemplates`, and `previewSettingsSync` from the helper.
- Added `verify:app-obsidian-template-actions-module` to `package.json` and included it in `verify:cleanup-core` after the template-editor verifier.
- Focused/type verification passed:
  - `npm run verify:app-obsidian-template-actions-module`
  - `npm run typecheck`
- Full verification for the App Obsidian template actions slice passed:
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-07 App AI Review Lifecycle Helper Split
- Continued `App.tsx` cleanup with a narrow AI review lifecycle extraction.
- Small design: keep React `useEffect`, `allTasksRef`, and `aiOnboarding` state ownership in `App.tsx`, but move startup backfill, daily/weekly/monthly tick listener registration, scheduled report dispatch, and first-run onboarding visibility checks into plain helpers with explicit dependencies.
- Added `scripts/verify-app-ai-review-lifecycle-module.ts` and confirmed the red state with `npm exec -- tsx scripts/verify-app-ai-review-lifecycle-module.ts`, which failed because `src/app/appAiReviewLifecycle.ts` did not exist.
- Extracted `src/app/appAiReviewLifecycle.ts` and updated `App.tsx` to call `registerAiReviewLifecycle` and `requestAiReviewOnboarding` from existing effects.
- Added `verify:app-ai-review-lifecycle-module` to `package.json` and included it in `verify:cleanup-core` after the scheduled reports verifier.
- `verify:cleanup-core` initially exposed a stale scheduled-reports verifier that still required `App.tsx` to import scheduled report helpers directly; root cause was the new lifecycle helper boundary, not a behavior regression. Refreshed that verifier to accept `appAiReviewLifecycle.ts` as the scheduled-report consumer.
- Focused/type verification passed:
  - `npm run verify:app-ai-review-lifecycle-module`
  - `npm run verify:app-scheduled-reports-module`
  - `npm run typecheck`
- Full verification for the App AI review lifecycle slice passed:
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-07 App Startup Settings Helper Split
- Continued `App.tsx` cleanup with a narrow startup settings extraction.
- Small design: keep React `useEffect` placement and state initialization in `App.tsx`, but move Companion settings loading and Obsidian template settings loading into `loadAppStartupSettings` with explicit dependencies.
- Added `scripts/verify-app-startup-settings-module.ts` and confirmed the red state with `npm exec -- tsx scripts/verify-app-startup-settings-module.ts`, which failed because `src/app/appStartupSettings.ts` did not exist.
- Extracted `src/app/appStartupSettings.ts` and updated the existing startup effect in `App.tsx` to call it after UI-state loading.
- The focused verifier caught an accidental behavior drift where Companion settings success used a nullish default fallback instead of the original direct setter path. Root cause was the extraction implementation, and the helper was corrected to preserve the original success/catch behavior.
- Added `verify:app-startup-settings-module` to `package.json` and included it in `verify:cleanup-core` after the UI-state persistence verifier.
- Verification passed:
  - `npm run verify:app-startup-settings-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-07 App UI Actions Helper Split
- Continued `App.tsx` cleanup with a narrow inline UI action extraction.
- Small design: keep React `useState`, JSX layout, UI-state persistence, and task filtering in `App.tsx`, but move daily-work/inspiration panel toggles and TaskList search/open-only toggles into `createAppUiActions` with explicit setter dependencies.
- Added `scripts/verify-app-ui-actions-module.ts` and confirmed the red state with `npm exec -- tsx scripts/verify-app-ui-actions-module.ts`, which failed because `src/app/appUiActions.ts` did not exist.
- Extracted `src/app/appUiActions.ts` and updated `App.tsx` to use `appUiActions.toggleDailyWorkPanel`, `toggleInspirationPanel`, `closeDailyWorkPanel`, `closeInspirationPanel`, `toggleSearchOpen`, and `toggleShowOpenOnly`.
- Added `verify:app-ui-actions-module` to `package.json` and included it in `verify:cleanup-core` after the startup settings verifier.
- Verification passed:
  - `npm run verify:app-ui-actions-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-07 App Completion Actions Helper Split
- Continued `App.tsx` cleanup with a completion/review action workflow extraction.
- Small design: keep React state, dialog JSX, task arrays, and mutation functions in `App.tsx`, but move main task toggles, subtask toggles, completion dialog save/no-review flows, review-view routing, and subtask priority updates into `createAppCompletionActions` with explicit dependencies.
- Added `scripts/verify-app-completion-actions-module.ts` and confirmed the red state with `npm exec -- tsx scripts/verify-app-completion-actions-module.ts`, which failed because `src/app/appCompletionActions.ts` did not exist.
- Extracted `src/app/appCompletionActions.ts` and updated `App.tsx` to use `completionActions.toggleTask`, `toggleSubtask`, `changeSubtaskPriority`, `completeWithReview`, `completeWithoutReview`, and `viewCompletion`.
- Removed the now-unused `TaskCompletionReview` import from `App.tsx` after `npm run typecheck` identified it as stale.
- Added `verify:app-completion-actions-module` to `package.json` and included it in `verify:cleanup-core` after the completion-flow verifier.
- Refreshed stale boundary checks after extraction:
  - `scripts/verify-task-list-interactions.ts` now verifies tree-aware subtask priority updates in `appCompletionActions.ts`.
  - `scripts/verify-app-task-tree-module.ts` now verifies `findTaskInTree` is consumed by `appCompletionActions.ts`.
  - `scripts/verify-app-completion-flow-module.ts` now verifies completion-flow helpers are consumed by `appCompletionActions.ts`.
- Verification passed:
  - `npm run verify:app-completion-actions-module`
  - `npm run typecheck`
  - `npm run verify:task-list-interactions`
  - `npm run verify:app-task-tree-module`
  - `npm run verify:app-completion-flow-module`
  - `npm run verify:cleanup-core`
  - `npm run build`



## 2026-07-07 App Modal Actions Helper Split
- Continued `App.tsx` cleanup with a narrow modal/shell action extraction.
- Small design: keep React state, JSX layout, and current settings/template values in `App.tsx`, but move TitleBar actions, SettingsPanel close/Companion opener, AI onboarding completion, template editor save/cancel, and Companion panel close into `createAppModalActions` with explicit dependencies.
- Added `scripts/verify-app-modal-actions-module.ts` and confirmed the red state with `npm exec -- tsx scripts/verify-app-modal-actions-module.ts`, which failed because `src/app/appModalActions.ts` did not exist.
- Extracted `src/app/appModalActions.ts` and updated `App.tsx` to use `appModalActions.toggleCompactMode`, `toggleSettings`, `toggleLockWindowPosition`, `closeSettings`, `openCompanionSettings`, `completeAiOnboarding`, `saveTemplate`, `cancelTemplate`, and `closeCompanion`.
- Added `verify:app-modal-actions-module` to `package.json` and included it in `verify:cleanup-core` after the UI actions verifier.
- The first focused verifier run after extraction exposed an assertion-shape issue for typed callback parameters, not a behavior regression; the verifier was updated to allow TypeScript parameter annotations while still checking the preserved side effects.
- Focused verification passed:
  - `npm run verify:app-modal-actions-module`
- Full verification for this slice passed:
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`
- `npm run typecheck` initially failed because the helper dependency type made `aiReview.setSettings` optional even though the original call only optional-chained `aiReview`; narrowed the dependency type and typecheck passed.
- `verify:cleanup-core` initially exposed a stale template-editor verifier that still required `App.tsx` to call `applyTemplateUpdate` directly; refreshed it to accept the new `appModalActions.ts` consumer boundary.
- Full verification for this slice passed:
  - `npm run verify:cleanup-core`
  - `npm run build`



## 2026-07-07 App Dialog State Actions Extension
- Continued `App.tsx` cleanup with a small extension to the existing modal actions helper.
- Small design: keep completion save/no-review workflows in `appCompletionActions.ts`, but move remaining pure dialog state callbacks for TaskCompletionDialog and TaskReviewDialog into `createAppModalActions`.
- Extended `scripts/verify-app-modal-actions-module.ts` first and confirmed the red state with `npm run verify:app-modal-actions-module`, which failed because `cancelCompletion` was missing from `src/app/appModalActions.ts`.
- Added `setCompletionTask` and `setReviewTask` as explicit helper dependencies, exposed `cancelCompletion`, `closeReview`, and `addCompletionRecord`, and updated `App.tsx` to use those actions.
- Focused verification passed:
  - `npm run verify:app-modal-actions-module`
- Full verification for this slice passed:
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-07 App Template Edit Action Extension
- Continued `App.tsx` cleanup with a very small extension to the existing modal actions helper.
- Small design: keep `editingTemplateKind` state and `TemplateEditorModal` rendering in `App.tsx`, but move the SettingsPanel edit-template opener into `createAppModalActions` as `editTemplate(kind)` with the existing `setEditingTemplateKind` dependency.
- Extended `scripts/verify-app-modal-actions-module.ts` first and confirmed the red state with `npm run verify:app-modal-actions-module`, which failed because `editTemplate` was missing from `src/app/appModalActions.ts`.
- Added `editTemplate: (kind: AppTemplateKind) => setEditingTemplateKind(kind)` and rewired `SettingsPanel` to `onEditTemplate={appModalActions.editTemplate}`.
- Verification passed:
  - `npm run verify:app-modal-actions-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-07 App Keyboard Shortcut Action Helper Extension
- Continued `App.tsx` cleanup with a narrow keyboard shortcut action extraction.
- Small design: keep the React `useEffect` and DOM listener ownership in `App.tsx`, but move the action application switch into `applyAppKeyboardShortcutAction` with explicit dependencies for compact-mode state, opening the selected daily note, and selected-date updates.
- Extended `scripts/verify-app-keyboard-shortcuts-module.ts` first and confirmed the red state with `npm run verify:app-keyboard-shortcuts-module`, which failed because `applyAppKeyboardShortcutAction` was missing from `src/app/appKeyboardShortcuts.ts`.
- Implemented `applyAppKeyboardShortcutAction`, moved the `shiftDateKey` import to the helper, and updated `App.tsx` to call the helper from the existing `keydown` effect.
- `verify:cleanup-core` exposed stale `verify-app-task-tree-module` and `verify-date-key-reuse` boundary assumptions that still required `App.tsx` to import/use `shiftDateKey` directly. Root cause was the new keyboard-helper consumer boundary; refreshed those verifiers to check `appKeyboardShortcuts.ts` while retaining shared date-helper assertions.
- Verification passed:
  - `npm run verify:app-keyboard-shortcuts-module`
  - `npm run typecheck`
  - `npm run verify:app-task-tree-module`
  - `npm run verify:date-key-reuse`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 App Task Menu Listener Registrar
- Continued `App.tsx` cleanup with a narrow task-menu listener registration extraction.
- Small design: keep the React `useEffect`, cleanup return, and dependency array in `App.tsx`, but move Electron `onTaskMenuAction` subscription setup into `registerTaskMenuActionListener` with explicit task-menu action handlers.
- Extended `scripts/verify-app-task-menu-actions-module.ts` first and confirmed the red state with `npm run verify:app-task-menu-actions-module`, which failed because `registerTaskMenuActionListener` was missing from `src/app/taskMenuActions.ts`.
- Implemented `registerTaskMenuActionListener` in `src/app/taskMenuActions.ts` so incoming popup payloads still flow through `parseTaskMenuAction` and `applyParsedTaskMenuAction` before reaching the supplied handlers.
- Updated `src/App.tsx` to call `registerTaskMenuActionListener(window.electronAPI, { addSubtask, deleteTask, setEditRequest, updateTask })` from the existing effect.
- `verify:cleanup-core` exposed a stale `verify-context-menu` boundary assumption that still required `App.tsx` to subscribe to `onTaskMenuAction` directly. Root cause was the new registrar-helper consumer boundary; refreshed that verifier to check `taskMenuActions.ts` owns the subscription and `App.tsx` wires the helper.
- Verification passed:
  - `npm run verify:app-task-menu-actions-module`
  - `npm run typecheck`
  - `npm run verify:context-menu`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 App AddTaskInput Direct Handler Cleanup
- Continued `App.tsx` cleanup with a micro JSX wiring simplification.
- Small design: remove only the pure `AddTaskInput` argument-forwarding wrapper and pass the existing `addTask` callback directly, because `AddTaskInputProps.onAdd` and `useTasks.addTask` share the same compatible `(text, priority, source, taskDate?)` shape.
- Extended `scripts/verify-app-ui-actions-module.ts` first and confirmed the red state with `npm run verify:app-ui-actions-module`, which failed because `App.tsx` still rendered `<AddTaskInput onAdd={(text, taskPriority, taskSource, taskDate) => addTask(text, taskPriority, taskSource, taskDate)} />`.
- Updated `src/App.tsx` to render `<AddTaskInput onAdd={addTask} />`.
- Focused verification passed:
  - `npm run verify:app-ui-actions-module`
  - `npm run typecheck`

## 2026-07-07 App Personalization Actions Helper Extension
- Continued `App.tsx` cleanup with a focused theme/personality action extraction.
- Small design: keep React state and derived `themeState` in `App.tsx`, but move the setter-composition callbacks for applying a theme preset, resetting theme defaults, handling personalization changes, and toggling dark mode into `createAppPersonalizationActions`.
- Extended `scripts/verify-app-personalization-module.ts` first and confirmed the red state with `npm run verify:app-personalization-module`, which failed because `createAppPersonalizationActions` was missing from `src/app/appPersonalization.ts`.
- Added `createAppPersonalizationActions` with explicit dependencies for `personalization`, `activeThemeId`, `themeOverrides`, `setPersonalization`, `setThemeOverrides`, and `toggleDarkMode`.
- Updated `src/App.tsx` to pass `appPersonalizationActions.applyThemePreset`, `resetCurrentThemeDefaults`, `changePersonalization`, and `toggleDarkModeAction` to `SettingsPanel`/`Header`.
- During implementation, the first replacement script wrote the helper but failed to rewire `App.tsx` because an exact multiline block match did not account for the current file content. Root cause was a brittle replacement script, not a TypeScript or runtime behavior issue; rewired with a targeted regex and refreshed stale verifier boundary assertions that still expected `App.tsx` to call low-level helper functions directly.
- Focused verification passed:
  - `npm run verify:app-personalization-module`
  - `npm run typecheck`



## 2026-07-07 App Companion Settings Updater Helper
- Continued `App.tsx` cleanup with a focused Companion settings update extraction.
- Small design: keep React state ownership in `App.tsx`, but move the `setCompanionSettingsState(next)` plus awaited `setCompanionSettings(next)` composition into `createCompanionSettingsUpdater` in `src/app/appCompanionActions.ts`.
- Extended `scripts/verify-app-companion-actions-module.ts` first and confirmed the red state with `npm run verify:app-companion-actions-module`, which failed because `App.tsx` still did not import/use `createCompanionSettingsUpdater`.
- Added `createCompanionSettingsUpdater` with explicit `setCompanionSettingsState` and `setCompanionSettings` dependencies, then rewired `App.tsx` to create `updateCompanionSettings` through that helper.
- TypeScript exposed that `taskStore.setCompanionSettings` returns `Promise<{ ok: boolean }>` while the first helper dependency type expected `Promise<void>`. Root cause: the old inline updater awaited but intentionally discarded the store result. Fixed by widening the dependency to `Promise<unknown>` while keeping the returned updater behavior as no-result async composition.
- Focused verification passed:
  - `npm run verify:app-companion-actions-module`
  - `npm run typecheck`


## 2026-07-07 App Companion Capture Getter Helper
- Continued `App.tsx` cleanup with a narrow Companion capture getter extraction.
- Small design: keep `App.tsx` as the owner of the current task/date/note/mobile state inputs, but move the lazy `getCurrentCaptureItems` callback creation into `createAppCompanionCaptureGetter` so Companion capture composition stays in one helper module.
- Extended `scripts/verify-app-companion-capture-module.ts` first and confirmed the red state with `npm run verify:app-companion-capture-module`, which failed because `createAppCompanionCaptureGetter` was missing from `src/app/appCompanionCapture.ts`.
- Added `createAppCompanionCaptureGetter(input)` that returns `() => createAppCompanionCaptureItems(input)` and rewired `App.tsx` to create `getCurrentCaptureItems` through that helper.
- TypeScript exposed an unused direct `createAppCompanionCaptureItems` import in `App.tsx`; root cause was an over-strict verifier import assertion, not a runtime behavior need. Tightened the verifier to require only the getter import while the helper module continues to export and consume `createAppCompanionCaptureItems`.
- Focused verification passed:
  - `npm run verify:app-companion-capture-module`
  - `npm run typecheck`

## 2026-07-07 App Keyboard Shortcut Listener Registrar
- Continued `App.tsx` cleanup with a narrow keyboard shortcut listener-registration extraction.
- Small design: keep React hook placement and dependency ownership in `App.tsx`, but move DOM `keydown` registration/cleanup and handler composition into `registerAppKeyboardShortcutListener` in `src/app/appKeyboardShortcuts.ts`.
- Extended `scripts/verify-app-keyboard-shortcuts-module.ts` first and confirmed the red state with `npm run verify:app-keyboard-shortcuts-module`, which failed because `registerAppKeyboardShortcutListener` was missing from `src/app/appKeyboardShortcuts.ts`.
- Added `registerAppKeyboardShortcutListener(windowLike, deps)` that registers `keydown`, resolves the shortcut action with `getAppKeyboardShortcutAction`, applies it through `applyAppKeyboardShortcutAction`, and returns a cleanup callback.
- Rewired `src/App.tsx` to call `registerAppKeyboardShortcutListener(window, { setCompactMode, openSelectedDailyNote, setSelectedDate })` from the existing `useEffect`.
- Focused verification passed:
  - `npm run verify:app-keyboard-shortcuts-module`
  - `npm run typecheck`
- Full verification for this slice passed:
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 App Startup State Orchestrator
- Continued `App.tsx` cleanup with a narrow startup-loading orchestration extraction.
- Small design: keep React hook placement and dependency ownership in `App.tsx`, but move the startup sequence that calls UI-state loading and Companion/template settings loading into `loadAppStartupState`.
- Extended `scripts/verify-app-startup-settings-module.ts` first and confirmed the red state with `npm run verify:app-startup-settings-module`, which failed because `loadAppStartupState` was missing from `src/app/appStartupSettings.ts`.
- Added `loadAppStartupState({ uiState, startupSettings })` that preserves the previous call order: `loadAppUiState(uiState)` first, then `loadAppStartupSettings(startupSettings)`.
- Rewired `src/App.tsx` to call the orchestrator from the existing startup `useEffect` and removed the direct `loadAppUiState` import.
- Refreshed `scripts/verify-app-ui-state-persistence-module.ts` so it no longer expects `App.tsx` to call `loadAppUiState` directly during startup.
- Focused verification passed:
  - `npm run verify:app-startup-settings-module`
  - `npm run verify:app-ui-state-persistence-module`
  - `npm run typecheck`
- Full verification for this slice passed:
  - `npm run verify:cleanup-core`
  - `npm run build`



## 2026-07-07 - Phase 53 SettingsPanel AI Review Root Section Extraction
- Added `scripts/verify-settings-ai-review-section.ts` and `verify:settings-ai-review-section`; confirmed RED because `src/components/settings/AiReviewSettingsSection.tsx` did not exist.
- Extracted the AI Review root settings wrapper into `src/components/settings/AiReviewSettingsSection.tsx`, including the page content wrapper, highlighted AI settings zone, enable toggle, account zone, report routing, manual generation, source settings, and timer settings composition.
- Rewired `src/components/SettingsPanel.tsx` so the `aiReview` tab delegates section composition to `AiReviewSettingsSection` while retaining local state, Electron persistence, generation side effects, diagnostics, and progress fallback logic.
- Updated `verify:cleanup-core` to include the new focused verifier.
- Refreshed stale verifier boundaries for child AI Review sections and shared settings controls after the new parent section became the direct consumer.
- Verification: `npm run verify:settings-ai-review-section` passed; child AI Review section verifiers passed after boundary refresh; `npm run verify:settings-panel-modules` passed; `npm run typecheck` passed; `npm run verify:cleanup-core` passed; `npm run build` passed.

## 2026-07-07 - Phase 54 TaskItem Stack Segment Style Helper
- Continued `TaskItem.tsx` cleanup with a narrow collapsed-stack style helper extraction.
- Small design: keep the collapsed stack rendering and event handling in `TaskItem.tsx`, but move the pure CSS custom-property style object into `src/components/taskItem/taskItemStack.ts` with the other stack presentation helpers.
- Extended `scripts/verify-task-item-stack-helper.ts` first and confirmed RED with `npm run verify:task-item-stack-helper`, which failed because `taskItemStack.ts` did not import `CSSProperties` or export `getStackSegmentStyle`.
- Added `getStackSegmentStyle(segmentCount)` to `taskItemStack.ts`, rewired `TaskItem.tsx` to import it, and removed the now-unused local `CSSProperties` import and local helper definition.
- Verification passed:
  - `npm run verify:task-item-stack-helper`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 55 TaskItem Interaction Propagation Helper
- Continued `TaskItem.tsx` cleanup with a narrow interaction propagation helper extraction.
- Small design: keep React state, rendering, and event binding locations in `TaskItem.tsx`, but move the pure `event.stopPropagation()` helper into `src/components/taskItem/taskItemInteractions.ts`.
- Added `scripts/verify-task-item-interactions-helper.ts` and `verify:task-item-interactions-helper`; the first attempt exposed a verifier authoring issue because a generated regex contained a literal newline, causing an unterminated regular expression transform error. Root cause was Python string escaping while writing the verifier, and the fix was to use `\r?\n` inside the regex.
- Re-ran the focused verifier and confirmed the intended RED because `src/components/taskItem/taskItemInteractions.ts` did not exist.
- Added the helper module, rewired `TaskItem.tsx` to import `stopClusterToggle`, and removed the local helper plus unused React event type imports.
- Verification passed:
  - `npm run verify:task-item-interactions-helper`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-07 - Phase 56 TaskItem Editing Decision Helper
- Continued `TaskItem.tsx` cleanup with a narrow edit interaction decision extraction.
- Small design: keep React editing state, event handlers, and `onEdit` callback ownership in `TaskItem.tsx`, but move pure submitted-text normalization and edit-key action mapping into `src/components/taskItem/taskItemEditing.ts`.
- Added `scripts/verify-task-item-editing-helper.ts` and `verify:task-item-editing-helper`. The first run exposed a verifier authoring issue because generated regexes contained literal newlines, causing an unterminated regular expression transform error. Root cause was Python string escaping while writing the verifier; rewrote the verifier with raw string output and escaped `
?
` sequences.
- Re-ran the focused verifier and confirmed the intended RED because `src/components/taskItem/taskItemEditing.ts` did not exist.
- Added `getSubmittedTaskText` and `getTaskEditKeyAction`, rewired `TaskItem.tsx` to call them from `handleSubmit` and `handleKeyDown`, and included the focused verifier in `verify:cleanup-core`.
- Verification passed:
  - `npm run verify:task-item-editing-helper`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-07 - Phase 57 TaskItem Cluster Keyboard Toggle Helper
- Continued `TaskItem.tsx` cleanup with a narrow cluster keyboard toggle decision extraction.
- Small design: keep React keyboard event handling, `preventDefault()`, no-children guard, and `onToggleCollapse(task.id)` in `TaskItem.tsx`, but move the pure Enter/Space key decision into `src/components/taskItem/taskItemInteractions.ts`.
- Extended `scripts/verify-task-item-interactions-helper.ts` first and confirmed RED with `npm run verify:task-item-interactions-helper`, which failed because `shouldToggleTaskClusterForKey` was missing.
- Added `shouldToggleTaskClusterForKey(key)` and rewired `TaskItem.tsx` to call it from `handleClusterKeyDown`.
- Verification passed:
  - `npm run verify:task-item-interactions-helper`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`



## 2026-07-07 - Phase 58 TaskItem Parent Text Title Helper
- Continued `TaskItem.tsx` cleanup with a narrow parent task title/tooltip presentation extraction.
- Small design: keep parent task text rendering, editing state, and event ownership in `TaskItem.tsx`, but move the pure tooltip string formatting into `src/components/taskItem/taskItemPresentation.tsx` with `priorityTitles`.
- Extended `scripts/verify-task-item-subtask-card-module.ts` first and confirmed RED with `npm run verify:task-item-subtask-card-module`, which failed because `getTaskTextTitle` was missing.
- Added `getTaskTextTitle(task)` and rewired `TaskItem.tsx` to use `title={getTaskTextTitle(task)}` instead of inlining `priorityTitles[task.priority]`.
- During implementation, a line replacement missed the live source because of template-literal escaping; inspecting the exact line representation showed the remaining inline title expression, and a targeted line-level replacement fixed the root cause.
- Final fresh verification passed:
  - `npm run verify:task-item-subtask-card-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-07 - Phase 59 TaskItem Parent Card ClassName Helper
- Continued `TaskItem.tsx` cleanup with a narrow parent card className presentation extraction.
- Small design: keep task-card rendering, events, accessibility attributes, context-menu IPC, and review action rendering in `TaskItem.tsx`, but move the pure className string composition into `src/components/taskItem/taskItemPresentation.tsx`.
- Extended `scripts/verify-task-item-subtask-card-module.ts` first and confirmed RED with `npm run verify:task-item-subtask-card-module`, which failed because `getTaskCardClassName` was missing.
- Added `TaskCardClassNameOptions` and `getTaskCardClassName`, then rewired `TaskItem.tsx` to pass `hasChildren`, `hasTags`, `canOpenReviewAction`, and `completed: task.completed`.
- `npm run verify:cleanup-core` initially exposed stale assertions in `scripts/verify-task-list-interactions.ts`: it still expected `task-card-has-review-action` and `task-cluster-main-card` inline in `TaskItem.tsx`. Root cause was the boundary move, so the verifier now checks those strings in `taskItemPresentation.tsx` and the helper call in `TaskItem.tsx`.
- Verification passed:
  - `npm run verify:task-item-subtask-card-module`
  - `npm run verify:task-list-interactions`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 60 TaskItem Parent Cluster ClassName Helper
- Continued `TaskItem.tsx` cleanup with a narrow outer cluster-wrapper className presentation extraction.
- Small design: keep expansion state, click/key collapse handlers, accessibility attributes, stack shell rendering, and subtask rendering in `TaskItem.tsx`, but move pure outer cluster class composition into `src/components/taskItem/taskItemPresentation.tsx`.
- Extended `scripts/verify-task-item-subtask-card-module.ts` first and confirmed RED with `npm run verify:task-item-subtask-card-module`, which failed because `getTaskClusterClassName` was missing.
- Added `TaskClusterClassNameOptions` and `getTaskClusterClassName({ hasChildren, isExpanded })`, then rewired `TaskItem.tsx` to call it for the top-level `task-cluster` span.
- `npm run verify:cleanup-core` initially exposed a stale implementation-location assertion in `scripts/verify-context-menu.ts`: it still expected `task-cluster-has-children` inline in `TaskItem.tsx`. Root cause was the boundary move, so the verifier now checks the preserved class string in `taskItemPresentation.tsx` and the collapse wiring/helper call in `TaskItem.tsx`.
- Verification passed:
  - `npm run verify:task-item-subtask-card-module`
  - `npm run verify:context-menu`
  - `npm run verify:task-list-interactions`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 61 TaskItem Parent Metadata Preview Helpers
- Continued `TaskItem.tsx` cleanup with a narrow parent metadata preview extraction.
- Small design: keep JSX rendering, tag/date CSS classes, emoji/copy, and task-card event behavior in `TaskItem.tsx`, but move pure preview slicing/counting for tags and scheduled dates into `src/components/taskItem/taskItemPresentation.tsx`.
- Extended `scripts/verify-task-item-subtask-card-module.ts` first and confirmed RED with `npm run verify:task-item-subtask-card-module`, which failed because `getVisibleTaskTags` was missing.
- Added `getVisibleTaskTags(tags)` and `getVisibleScheduledDates(scheduledDates)`, then rewired `TaskItem.tsx` to use `visibleTags`, `remainingTagCount`, `visibleScheduledDates`, and `remainingScheduledDateCount`.
- During implementation, the scheduled-date block replacement initially missed the live source because the file contains the real emoji and middle-dot characters while terminal output can show mojibake. Root cause was replacement text encoding mismatch; fixed with an index-based replacement against the exact source region.
- Verification passed:
  - `npm run verify:task-item-subtask-card-module`
  - `npm run verify:context-menu`
  - `npm run verify:task-list-interactions`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`



## 2026-07-07 - Phase 62 TaskItem completion action presentation helper
- Re-read active planning files, inspected current `TaskItem.tsx`, `taskItemPresentation.tsx`, package scripts, and focused TaskItem verifier state.
- Extended `scripts/verify-task-item-subtask-card-module.ts` first; confirmed RED once the verifier itself was corrected to avoid terminal-damaged Chinese regex literals.
- Added `getTaskCompleteActionClassName(completed)` and `getTaskCompleteActionLabel(completed)` to `src/components/taskItem/taskItemPresentation.tsx`.
- Updated `src/components/TaskItem.tsx` to derive `completeActionLabel` once and reuse it for both `aria-label` and `title`, while calling `getTaskCompleteActionClassName(task.completed)` for classes.
- Verification completed before documentation update: `npm run verify:task-item-subtask-card-module`, `npm run verify:task-list-interactions`, `npm run typecheck`, `npm run verify:cleanup-core`, and `npm run build` all passed after the implementation.


## 2026-07-07 - Phase 63 TaskItem review action label helper
- Restored the current plan/worktree context and inspected `TaskItem.tsx`, `taskItemPresentation.tsx`, and the focused TaskItem verifier.
- Chose the parent review-action label as the next pure presentation boundary because it depends only on `hasReview` and does not affect hooks, IPC, rendering visibility, or callbacks.
- Extended `scripts/verify-task-item-subtask-card-module.ts` first and confirmed RED on the missing `getTaskReviewActionLabel(hasReview)` export.
- Added `getTaskReviewActionLabel` to `src/components/taskItem/taskItemPresentation.tsx` and updated `src/components/TaskItem.tsx` to pass `reviewActionLabel` into `ReviewActionButton`.
- Investigated `verify:task-list-interactions` failure: the verifier still expected the old inline label ternary in `TaskItem.tsx`. Updated it to protect concrete copy in `taskItemPresentation.tsx` and helper wiring in `TaskItem.tsx`.
- Verification so far: `npm run verify:task-item-subtask-card-module`, `npm run verify:task-list-interactions`, and `npm run typecheck` passed after the implementation and verifier boundary update.
- Fresh final verification passed: `npm run verify:task-item-subtask-card-module`, `npm run verify:task-list-interactions`, `npm run typecheck`, `npm run verify:cleanup-core`, and `npm run build`.

## 2026-07-07 - Phase 64 TaskItem accessible copy constants
- Continued `TaskItem.tsx` cleanup with a small presentation-copy extraction.
- Small design: keep event handling, editing state, drag wiring, delete callback, and virtual-subtask rendering in `TaskItem.tsx`, but move static parent accessibility labels into `taskItemPresentation.tsx` next to the other TaskItem presentation helpers.
- Extended `scripts/verify-task-item-subtask-card-module.ts` first and confirmed RED with `npm run verify:task-item-subtask-card-module`, which failed because `TASK_DRAG_HANDLE_LABEL` was missing.
- Added `TASK_DRAG_HANDLE_LABEL`, `TASK_EDIT_INPUT_LABEL`, `TASK_DELETE_ACTION_LABEL`, and `TASK_SUBTASKS_LABEL` with Unicode escapes to preserve Chinese runtime copy while avoiding terminal encoding damage.
- Updated `src/components/TaskItem.tsx` to use the shared constants for drag-handle `aria-label`, edit input `aria-label`, delete action `aria-label`/`title`, and expanded subtasks `aria-label`.
- Verification so far: `npm run verify:task-item-subtask-card-module`, `npm run verify:task-list-interactions`, and `npm run typecheck` passed after the implementation.

## 2026-07-07 - Phase 65 TaskItem delete action component
- Continued `TaskItem.tsx` cleanup with a small parent action component extraction.
- Small design: keep the delete callback and parent action slot in `TaskItem.tsx`, but move the Framer Motion delete button JSX into `DeleteActionButton` in `taskItemPresentation.tsx`, matching the existing `ReviewActionButton` boundary.
- Extended `scripts/verify-task-item-subtask-card-module.ts` first and confirmed RED with `npm run verify:task-item-subtask-card-module`, which failed because `DeleteActionButton` was missing.
- Added `DeleteActionButton({ onClick })` using the existing delete CSS classes, hover/tap animation, `TrashIcon`, and `TASK_DELETE_ACTION_LABEL` for `aria-label`/`title`.
- Updated `src/components/TaskItem.tsx` to render `<DeleteActionButton onClick={onDelete} />` and removed the no-longer-needed direct `TrashIcon`/delete-label imports.
- Initial post-implementation verifier run exposed a stale boundary assertion: it expected `TaskItem.tsx` to use `TASK_DELETE_ACTION_LABEL` directly, while the cleaner boundary has `DeleteActionButton` own that label. Updated the verifier to check label usage in `taskItemPresentation.tsx` and component wiring in `TaskItem.tsx`.
- Verification so far: `npm run typecheck`, `npm run verify:task-item-subtask-card-module`, and `npm run verify:task-list-interactions` passed after the extraction.

## 2026-07-07 - Phase 66 TaskItem complete action component
- Continued `TaskItem.tsx` cleanup with the next parent action presentation extraction.
- Small design: keep parent task state, callback ownership, and action slot placement in `TaskItem.tsx`, but move the completion button markup and completed-check icon into `CompleteActionButton` in `taskItemPresentation.tsx`.
- Extended `scripts/verify-task-item-subtask-card-module.ts` first and confirmed RED with `npm run verify:task-item-subtask-card-module`, which failed because `CompleteActionButton` was missing.
- Added `CompleteActionButton({ completed, label, onClick })` using the existing class helper, label/title reuse, completed checkmark SVG, and internal event propagation blocking before invoking `onClick`.
- Updated `src/components/TaskItem.tsx` to render `<CompleteActionButton completed={task.completed} label={completeActionLabel} onClick={onToggle} />` and removed the no-longer-needed direct `getTaskCompleteActionClassName` import.
- `npm run verify:task-list-interactions` initially failed on a stale boundary assertion that looked for the completion SVG in `TaskItem.tsx`; refreshed it to check `taskItemPresentation.tsx` because the icon now belongs to the presentation component.
- Fresh verification passed:
  - `npm run verify:task-item-subtask-card-module`
  - `npm run verify:task-list-interactions`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 67 TaskItem drag handle button component
- Continued `TaskItem.tsx` cleanup with the parent drag-handle presentation extraction.
- Small design: keep sortable ownership and drag-handle prop creation in `TaskList.tsx` / `TaskItem.tsx`, but move the button markup, accessible label, default disabled behavior, and drag dots icon into `DragHandleButton` in `taskItemPresentation.tsx`.
- Extended `scripts/verify-task-item-subtask-card-module.ts` first and confirmed RED with `npm run verify:task-item-subtask-card-module`, which failed because `TaskDragHandleProps` was missing from the presentation boundary.
- Added `TaskDragHandleProps` and `DragHandleButton({ dragHandleProps })` to `src/components/taskItem/taskItemPresentation.tsx`.
- Updated `src/components/TaskItem.tsx` to render `<DragHandleButton dragHandleProps={dragHandleProps} />` and re-export `TaskDragHandleProps` from the same module so the existing `TaskList.tsx` import path remains compatible.
- Refreshed stale interaction/layout verifiers after the boundary move: drag-handle classes now live in `taskItemPresentation.tsx`, while `TaskItem.tsx` proves component wiring.
- Fresh verification passed:
  - `npm run verify:task-item-subtask-card-module`
  - `npm run verify:task-list-interactions`
  - `npm run verify:task-layout-unified-glass`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 68 TaskItem edit input component
- Continued `TaskItem.tsx` cleanup with a narrow parent edit-input presentation extraction.
- Small design: keep editing state, submit/cancel behavior, and task mutation callbacks in `TaskItem.tsx`, but move the fixed input markup, class, accessible label, autofocus, and propagation blocking into `TaskEditInput` in `taskItemPresentation.tsx`.
- Extended `scripts/verify-task-item-subtask-card-module.ts` first and confirmed RED with `npm run verify:task-item-subtask-card-module`, which failed because `TaskEditInputProps` was missing.
- Added `TaskEditInputProps` and `TaskEditInput({ value, onChange, onBlur, onKeyDown })` to `src/components/taskItem/taskItemPresentation.tsx`.
- Updated `src/components/TaskItem.tsx` to render `<TaskEditInput value={editText} onChange={setEditText} onBlur={handleSubmit} onKeyDown={handleKeyDown} />` instead of inlining the input element.
- Fresh verification passed:
  - `npm run verify:task-item-subtask-card-module`
  - `npm run verify:task-list-interactions`
  - `npm run verify:task-layout-unified-glass`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 69 TaskItem action layer component
- Continued `TaskItem.tsx` cleanup with the parent action-layer wrapper extraction.
- Small design: keep review visibility decisions, review routing, delete routing, and row placement in `TaskItem.tsx`, but move the fixed review/delete action-layer wrapper and slot markup into `TaskActionLayer` in `taskItemPresentation.tsx`.
- Extended `scripts/verify-task-item-subtask-card-module.ts` first and confirmed RED with `npm run verify:task-item-subtask-card-module`, which failed because `TaskActionLayer` was missing.
- Added `TaskActionLayer({ canOpenReviewAction, hasReview, reviewActionLabel, onViewReview, onDelete })` to `src/components/taskItem/taskItemPresentation.tsx` using the existing `ReviewActionButton` and `DeleteActionButton` components.
- Updated `src/components/TaskItem.tsx` to render `<TaskActionLayer ... />` and removed direct parent imports of `ReviewActionButton` and `DeleteActionButton`.
- Refreshed stale verifier boundaries in `verify-task-list-interactions`, `verify-task-action-alignment`, and `verify-task-layout-unified-glass` so preserved action-layer/review/delete structure is checked in `taskItemPresentation.tsx` while `TaskItem.tsx` proves component wiring.
- Fresh verification passed:
  - `npm run verify:task-item-subtask-card-module`
  - `npm run verify:task-list-interactions`
  - `npm run verify:task-action-alignment`
  - `npm run verify:task-layout-unified-glass`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 70 TaskItem stack segments component
- Continued `TaskItem.tsx` cleanup with a narrow collapsed-stack segment component extraction.
- Small design: keep expanded/collapsed decisions, stack shell style, parent card animation, and subtask rendering in `TaskItem.tsx`, but move the fixed segment container and segment `motion.span` mapping into `TaskStackSegments.tsx`.
- Extended `scripts/verify-task-item-stack-helper.ts` first and confirmed RED with `npm run verify:task-item-stack-helper`, which failed because `src/components/taskItem/TaskStackSegments.tsx` did not exist.
- Added `TaskStackSegments({ segmentCount, shouldReduceMotion })` using `TASK_STACK_SEGMENT_CLASSES`, `TASK_STACK_SEGMENT_TRANSITIONS`, and `TASK_CLUSTER_REDUCED_TRANSITION` from `taskItemStack.ts`.
- Updated `src/components/TaskItem.tsx` to render `<TaskStackSegments segmentCount={stackSegmentCount} shouldReduceMotion={shouldReduceMotion} />` instead of inlining the stack segment JSX.
- Refreshed stale `scripts/verify-task-cluster-stack.ts` after investigation: spring/segment constants are owned by `taskItemStack.ts`, segment JSX is owned by `TaskStackSegments.tsx`, and expanded subtask delete markup is owned by `SubtaskCard.tsx`.
- Fresh verification passed:
  - `npm run verify:task-item-stack-helper`
  - `npm run verify:task-cluster-stack`
  - `npm run verify:task-list-interactions`
  - `npm run verify:task-layout-unified-glass`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 71 TaskItem context menu open payload helper
- Continued `TaskItem.tsx` cleanup with a narrow context-menu payload composition extraction.
- Small design: keep the React right-click event, `preventDefault()`, DOM lookup, style reads, dark-mode check, and Electron IPC invocation in `TaskItem.tsx`, but move the pure theme+payload composition into `src/components/taskItem/taskItemContextMenu.ts`.
- Extended `scripts/verify-task-item-context-menu-helper.ts` first and confirmed RED with `npm run verify:task-item-context-menu-helper`, which failed because `createTaskContextMenuOpenPayload` was missing.
- Added `createTaskContextMenuOpenPayload(options)` to compose `createTaskContextMenuTheme(...)` and `createTaskContextMenuPayload(...)` from explicit task, tag, coordinate, dark-mode, class-list, and style-reader inputs.
- Updated `TaskItem.tsx` to call `createTaskContextMenuOpenPayload(...)` instead of directly invoking both lower-level helper functions.
- `npm run verify:context-menu` and `npm run verify:theme-no-blue` initially failed on stale implementation-location assertions. Root cause: the verifiers still expected direct theme construction/token mapping in `TaskItem.tsx`; updated them to check DOM style capture in `TaskItem.tsx` and CSS token mapping in `taskItemContextMenu.ts`.
- A PowerShell `Select-Object -Index 45..70` attempt failed because the range was passed as a string; no source changes depended on that command.
- Fresh verification passed:
  - `npm run verify:task-item-context-menu-helper`
  - `npm run verify:context-menu`
  - `npm run verify:theme-no-blue`
  - `npm run verify:task-list-interactions`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 72 TaskItem main content component
- Continued `TaskItem.tsx` cleanup with a parent main-content presentation extraction.
- Small design: keep edit state, submit/cancel decisions, task mutation callbacks, and double-click edit gating in `TaskItem.tsx`, but move the fixed parent edit input/text/tags/scheduled-date markup into `TaskMainContent` in `src/components/taskItem/taskItemPresentation.tsx`.
- Extended `scripts/verify-task-item-subtask-card-module.ts` first and confirmed RED because the new `TaskMainContent` boundary was missing.
- Added `TaskMainContentProps` and `TaskMainContent(...)`, reusing `TaskEditInput`, `getTaskTextTitle`, visible tag/date preview props, and the existing parent text/tag/date classes.
- Updated `src/components/TaskItem.tsx` to render `<TaskMainContent ... />` while preserving edit text state, `handleSubmit`, `handleKeyDown`, and the completed-task double-click guard.
- `npm run verify:task-item-subtask-card-module` initially failed after implementation because the verifier still expected `title={getTaskTextTitle(task)}` in `TaskItem.tsx`; root cause was a stale implementation-location assertion, so it now checks `taskItemPresentation.tsx`.
- `npm run verify:task-layout-unified-glass` also needed a stale boundary refresh so it checks `TaskItem.tsx` for `<TaskMainContent` and `taskItemPresentation.tsx` for `className="task-text"`.
- Fresh verification passed:
  - `npm run verify:task-item-subtask-card-module`
  - `npm run verify:task-list-interactions`
  - `npm run verify:context-menu`
  - `npm run verify:task-layout-unified-glass`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 73 TaskItem subtasks viewport component
- Continued `TaskItem.tsx` cleanup with the expanded subtask viewport extraction that had already been started before the context handoff.
- Added `scripts/verify-task-item-subtasks-viewport.ts`, registered `verify:task-item-subtasks-viewport`, and included it in `verify:cleanup-core`.
- Confirmed the initial RED state before implementation because `src/components/taskItem/TaskSubtasksViewport.tsx` was missing.
- Added `TaskSubtasksViewport` to own expanded-subtask viewport/list/spacer markup, Framer Motion transitions, max-height styling, virtual-list classes, virtual spacer positioning, stagger timing, `TASK_SUBTASKS_LABEL`, propagation blocking, and `SubtaskCard` rendering.
- Updated `TaskItem.tsx` to render `<TaskSubtasksViewport ... />` while keeping expansion state, `useVirtualSubtasks(directSubtasks, isExpanded)`, and all parent callback ownership local.
- Adjusted `useVirtualSubtasks.ts` so `viewportRef` is typed as `useRef<HTMLSpanElement>(null)`, matching the extracted viewport component ref boundary.
- Refreshed stale verifier boundaries in:
  - `scripts/verify-task-item-subtask-card-module.ts`
  - `scripts/verify-task-cluster-stack.ts`
  - `scripts/verify-task-list-interactions.ts`
  - `scripts/verify-context-menu.ts`
  - `scripts/verify-task-item-virtual-subtasks-hook.ts`
  - `scripts/verify-task-item-stack-helper.ts`
- `npm run verify:cleanup-core` first failed because `verify-task-item-virtual-subtasks-hook.ts` still expected the old nullable ref and direct `TASK_SUBTASK_VIEWPORT_HEIGHT` usage in `TaskItem.tsx`; root cause was a stale verifier after the viewport extraction. Updated it to check `TaskSubtasksViewport.tsx` for viewport sizing.
- `npm run verify:cleanup-core` then failed because `verify-task-item-stack-helper.ts` expected a multiline `taskItemStack` import even though the source correctly imports and uses `getStackSegmentStyle` on one line; root cause was a format-sensitive verifier assertion. Updated it to check the import semantically.
- Fresh verification passed:
  - `npm run verify:task-item-subtasks-viewport`
  - `npm run verify:task-item-subtask-card-module`
  - `npm run verify:task-cluster-stack`
  - `npm run verify:task-list-interactions`
  - `npm run verify:context-menu`
  - `npm run verify:task-layout-unified-glass`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 74 TaskItem SVG icons module
- Continued TaskItem cleanup with a low-risk pure icon extraction after the subtasks viewport split.
- Small design: keep action buttons, labels, animation wrappers, and task presentation composition in `taskItemPresentation.tsx`, but move the three reusable SVG icon functions into `src/components/taskItem/taskItemIcons.tsx`.
- Extended `scripts/verify-task-item-subtask-card-module.ts` first and confirmed RED with `npm run verify:task-item-subtask-card-module`, which failed because `src/components/taskItem/taskItemIcons.tsx` did not exist.
- Added `taskItemIcons.tsx` with `ReviewIcon`, `DragDotsIcon`, and `TrashIcon`, preserving the existing SVG paths and attributes.
- Updated `taskItemPresentation.tsx` and `SubtaskCard.tsx` to import the icons from `./taskItemIcons`, and updated the verifier so `taskItemPresentation.tsx` no longer owns icon definitions.
- Fresh verification passed:
  - `npm run verify:task-item-subtask-card-module`
  - `npm run verify:task-list-interactions`
  - `npm run verify:task-layout-unified-glass`
  - `npm run verify:task-action-alignment`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 75 SubtaskCard editing helper reuse
- Continued TaskItem cleanup by removing duplicated edit-decision logic from `src/components/taskItem/SubtaskCard.tsx`.
- Small design: keep subtask edit state and callback ownership in `SubtaskCard.tsx`, but reuse the existing pure `taskItemEditing.ts` helpers for submitted-text trimming and Enter/Escape action mapping.
- Extended `scripts/verify-task-item-editing-helper.ts` first and confirmed RED with `npm run verify:task-item-editing-helper`, which failed because `SubtaskCard.tsx` did not import `getSubmittedTaskText` / `getTaskEditKeyAction`.
- Updated `SubtaskCard.tsx` so `submitEdit` calls `getSubmittedTaskText(editText)` and `handleEditKeyDown` calls `getTaskEditKeyAction(event.key)`.
- `npm run verify:task-item-subtask-card-module` then exposed a stale verifier assertion that still required inline `editText.trim()` in `SubtaskCard.tsx`; refreshed it to protect helper-based trimmed submission and forbid the old inline trim.
- Fresh verification passed:
  - `npm run verify:task-item-editing-helper`
  - `npm run verify:task-item-subtask-card-module`
  - `npm run verify:task-list-interactions`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 76 SubtaskCard presentation copy helper
- Continued TaskItem cleanup by centralizing subtask-card labels and title formatting.
- Small design: keep `SubtaskCard.tsx` responsible for edit state, callback routing, JSX layout, and icon placement, but move static/derived subtask presentation copy into `src/components/taskItem/subtaskCardPresentation.ts`.
- Extended `scripts/verify-task-item-subtask-card-module.ts` first and confirmed RED with `npm run verify:task-item-subtask-card-module`, which failed because `subtaskCardPresentation.ts` did not exist.
- Added `subtaskCardPresentation.ts` with `getSubtaskCompleteActionLabel`, `SUBTASK_PRIORITY_PICKER_TITLE`, `SUBTASK_EDIT_INPUT_LABEL`, `getSubtaskTextTitle`, `getSubtaskReviewActionLabel`, and `SUBTASK_DELETE_ACTION_LABEL`.
- Updated `SubtaskCard.tsx` to consume the helper for completion aria-labels, priority picker title, edit input aria-label, subtask text title, review aria-label/title, and delete aria-label/title.
- Used Unicode escapes for Chinese copy in the helper to avoid terminal encoding damage while preserving runtime strings.
- Fresh verification passed:
  - `npm run verify:task-item-subtask-card-module`
  - `npm run verify:task-item-editing-helper`
  - `npm run verify:task-list-interactions`
  - `npm run verify:task-layout-unified-glass`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 77 SubtaskCard controls component module
- Continued TaskItem cleanup by extracting fixed subtask-card controls from `src/components/taskItem/SubtaskCard.tsx`.
- Small design: keep `SubtaskCard.tsx` responsible for edit state, text synchronization, helper-based submit/cancel decisions, and subtask callback routing; move fixed button/input/action-layer JSX into `src/components/taskItem/subtaskCardControls.tsx`.
- Extended `scripts/verify-task-item-subtask-card-module.ts` first and confirmed RED with `npm run verify:task-item-subtask-card-module`, which failed because `subtaskCardControls.tsx` did not exist.
- Added `subtaskCardControls.tsx` with `SubtaskCompleteButton`, `SubtaskPriorityPicker`, `SubtaskEditInput`, `SubtaskReviewButton`, `SubtaskDeleteButton`, and `SubtaskActionLayer`.
- Updated `SubtaskCard.tsx` to render the new controls while preserving completion toggle, priority change, edit input state, review routing, delete routing, row classes, and title/label helpers.
- `npm run verify:task-action-alignment` initially failed because it still expected concrete subtask action classes in `SubtaskCard.tsx`. Root cause was a stale implementation-location assertion after the controls extraction; updated it to check `subtaskCardControls.tsx` for classes and `SubtaskCard.tsx` for `<SubtaskActionLayer />` wiring.
- Fresh verification passed:
  - `npm run verify:task-item-subtask-card-module`
  - `npm run verify:task-item-editing-helper`
  - `npm run verify:task-list-interactions`
  - `npm run verify:task-layout-unified-glass`
  - `npm run verify:task-action-alignment`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 78 SubtaskCard row and text presentation helpers
- Continued SubtaskCard cleanup with a final low-risk row/text presentation extraction.
- Small design: keep `SubtaskCard.tsx` responsible for edit mode state and completed-task edit gating, but move pure row class composition to `subtaskCardPresentation.ts` and the non-editing text span to `subtaskCardControls.tsx`.
- Extended `scripts/verify-task-item-subtask-card-module.ts` first and confirmed RED with `npm run verify:task-item-subtask-card-module`, which failed because `SubtaskCard.tsx` still inlined the row class template.
- Added `getSubtaskRowClassName(completed)` to preserve `task-subtask-row task-subtask-card` and the completed-row class.
- Added `SubtaskText({ subtask, onStartEdit })` to preserve `task-subtask-text`, `getSubtaskTextTitle(subtask)`, and double-click edit routing.
- Updated `SubtaskCard.tsx` to use `getSubtaskRowClassName(subtask.completed)` and `<SubtaskText ... />` while preserving edit-state ownership.
- Fresh verification passed:
  - `npm run verify:task-item-subtask-card-module`
  - `npm run verify:task-item-editing-helper`
  - `npm run verify:task-list-interactions`
  - `npm run verify:task-layout-unified-glass`
  - `npm run verify:task-action-alignment`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 79 TaskItem parent controls module
- Continued TaskItem cleanup by separating parent task fixed controls from pure presentation helpers.
- Small design: keep `TaskItem.tsx` responsible for edit state, submit/cancel behavior, context-menu DOM/IPC routing, priority picker placement, collapse behavior, and task callbacks; move fixed parent control JSX into `src/components/taskItem/taskItemControls.tsx`.
- Extended `scripts/verify-task-item-subtask-card-module.ts` first and confirmed RED with `npm run verify:task-item-subtask-card-module`, which failed because `taskItemControls.tsx` did not exist.
- Added `taskItemControls.tsx` with `ReviewActionButton`, `TaskActionLayer`, `CompleteActionButton`, `DeleteActionButton`, `TaskEditInput`, `TaskMainContent`, `DragHandleButton`, and `TaskDragHandleProps`.
- Updated `TaskItem.tsx` to import parent controls and re-export `TaskDragHandleProps` from `taskItemControls.tsx`, preserving the upstream `TaskList.tsx` import path.
- Reduced `taskItemPresentation.tsx` to pure helpers/constants; current line counts are `taskItemPresentation.tsx` 61 lines and `taskItemControls.tsx` 232 lines.
- Refreshed stale verifier boundaries in `verify-task-list-interactions`, `verify-task-layout-unified-glass`, and `verify-task-action-alignment` so concrete parent control markup is checked in `taskItemControls.tsx`.
- Fresh verification passed:
  - `npm run verify:task-item-subtask-card-module`
  - `npm run verify:task-list-interactions`
  - `npm run verify:task-layout-unified-glass`
  - `npm run verify:task-action-alignment`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 80 TaskList DnD helper and UX verifier calibration
- Continued cleanup after the TaskItem/SubtaskCard module splits by validating the current TaskList DnD/source-grouping boundary and refreshing stale structural verifiers.
- Confirmed `npm run verify:task-cluster-stack` passed after the prior stale boundary refresh for subtask delete/control markup in `src/components/taskItem/subtaskCardControls.tsx`.
- Reproduced `npm run verify:ux-polish` failing on the obsolete expectation that `TaskItem` should render a per-row `task-source-badge`.
- Root cause: current source visibility is grouped headers in `TaskList` / `SortableSourceSection`, missing-source fallback is centralized in `src/components/taskList/taskListDnd.ts`, unified opacity settings live in `AppearanceSettingsSection.tsx` and `appearanceSettings.ts`, and completed tasks/subtasks intentionally show review/backfill actions even without an existing review.
- Rebuilt `scripts/verify-ux-polish.ts` to check the current module boundaries and product behavior:
  - Task source grouping and no reintroduced `.task-source-badge`.
  - Unified glass opacity helper usage through `glassOpacityValue(settings)` and `withUnifiedGlassOpacity(settings, value)`.
  - Parent/subtask review action backfill behavior for completed items without reviews.
  - Current extracted parent/subtask controls, presentation helpers, and viewport style boundary.
- Avoided copying mojibake Chinese from terminal output into source by using structural checks and Unicode escape string literals where copy needed to be verified.
- Fresh verification passed:
  - `npm run verify:ux-polish`
  - `npm run verify:task-cluster-stack`
  - `npm run verify:task-layout-unified-glass`
  - `npm run verify:task-list-dnd-module`
  - `npm run verify:task-list-interactions`
  - `npm run verify:task-action-alignment`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 81 TaskList presentation boundary slice
- Continued TaskList cleanup by extracting the sortable source-section presentation boundary from `src/components/TaskList.tsx`.
- Small design: keep `TaskList.tsx` responsible for task grouping, source-group ordering, task buckets, DnD lifecycle handlers, and callbacks, but move the fixed source group shell/title/drag-handle/spring presentation into `src/components/taskList/SortableSourceSection.tsx`.
- Extended `scripts/verify-task-list-dnd-module.ts` first and confirmed RED with `npm run verify:task-list-dnd-module`, which failed because `src/components/taskList/SortableSourceSection.tsx` did not exist.
- Added `SortableSourceSection.tsx`, preserving source sortable registration, source group shell/title classes, title-row drag activator behavior, source drag handle, source labels, source-group motion presets, and jump-to-rest behavior.
- Reused the shared `DragDotsIcon` from `src/components/taskItem/taskItemIcons.tsx` and removed the duplicate inline TaskList icon.
- `npm run verify:task-list-interactions` and `npm run verify:ux-polish` initially failed after extraction because they still expected source-group markup directly in `TaskList.tsx`; refreshed them to check `SortableSourceSection.tsx` for concrete source-section markup and `TaskList.tsx` for `<SortableSourceSection />` wiring.
- Fresh verification passed:
  - `npm run verify:task-list-dnd-module`
  - `npm run verify:task-list-interactions`
  - `npm run verify:ux-polish`
  - `npm run verify:task-layout-unified-glass`
  - `npm run verify:task-cluster-stack`
  - `npm run verify:task-action-alignment`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 82 TaskList sortable task item boundary slice
- Continued TaskList cleanup by extracting the task-level sortable presentation boundary from `src/components/TaskList.tsx`.
- Small design: keep `TaskList.tsx` responsible for grouping, buckets, DnD lifecycle, filter/search toolbar state, and callback wiring; move task sortable registration, displacement springs, jump-to-rest behavior, drag-handle prop construction, shell classes, and `TaskItem` rendering into `src/components/taskList/SortableTaskItem.tsx`.
- Extended `scripts/verify-task-list-dnd-module.ts` first and confirmed RED with `npm run verify:task-list-dnd-module`, which failed because `src/components/taskList/SortableTaskItem.tsx` did not exist.
- Added `SortableTaskItem.tsx`, preserving `useSortable({ id: getTaskSortableId(task), disabled: dragDisabled, transition: null })`, `TASK_SORTABLE_MOTION`, `REDUCED_SORTABLE_MOTION`, Framer Motion spring displacement, `springX.jump(0)` / `springY.jump(0)`, `TaskDragHandleProps`, `task-sortable-shell`, dragging opacity, and `TaskItem` callback wiring.
- Removed the dangling old inline `SortableTaskItem` tail left in `TaskList.tsx` during the extraction.
- Refreshed stale `scripts/verify-task-list-dnd-module.ts` and `scripts/verify-task-list-interactions.ts` assertions so task sortable implementation details are checked in `SortableTaskItem.tsx`, while `TaskList.tsx` proves `<SortableTaskItem ... />` wiring and shared `isDragActive` propagation.
- Fresh verification passed:
  - `npm run verify:task-list-dnd-module`
  - `npm run verify:task-list-interactions`
  - `npm run verify:ux-polish`
  - `npm run verify:task-layout-unified-glass`
  - `npm run verify:task-cluster-stack`
  - `npm run verify:task-action-alignment`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 83 TaskList filter toolbar boundary slice
- Continued TaskList cleanup by extracting the fixed search/filter toolbar from `src/components/TaskList.tsx`.
- Small design: keep `TaskList.tsx` responsible for filter state derivation, clear-filter behavior, grouping, DnD lifecycle, and callback wiring; move toolbar buttons/select/input markup and priority labels into `src/components/taskList/TaskListToolbar.tsx`.
- Extended `scripts/verify-task-list-interactions.ts` first and confirmed RED with `npm run verify:task-list-interactions`, which failed because `TaskListToolbar.tsx` did not exist.
- Added `TaskListToolbar.tsx` with `PriorityFilter`, explicit props, search toggle, open-only toggle, priority select, clear filter button, search input, and Unicode-escaped Chinese labels/titles.
- Updated `TaskList.tsx` to import/render `<TaskListToolbar ... />`, reuse the exported `PriorityFilter` type, and remove inline toolbar JSX plus `priorityFilterLabel`.
- Fresh verification passed:
  - `npm run verify:task-list-interactions`
  - `npm run verify:task-list-dnd-module`
  - `npm run verify:ux-polish`
  - `npm run verify:task-layout-unified-glass`
  - `npm run verify:task-cluster-stack`
  - `npm run verify:task-action-alignment`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 84 TaskList empty-state boundary slice
- Continued TaskList cleanup by extracting the fixed empty-list presentation from `src/components/TaskList.tsx`.
- Small design: keep `TaskList.tsx` responsible for deciding when the list is empty and whether to render grouped or flat task buckets; move the empty-state fade-in, icon, classes, and copy into `src/components/taskList/TaskListEmptyState.tsx`.
- Extended `scripts/verify-task-list-interactions.ts` first and confirmed RED with `npm run verify:task-list-interactions`, which failed because `TaskListEmptyState.tsx` did not exist.
- Added `TaskListEmptyState.tsx`, preserving the `motion.div` fade-in, `empty-state` class, clipboard icon, and empty-list copy with Unicode escapes.
- Updated `TaskList.tsx` to import/render `<TaskListEmptyState />` and remove its direct `motion` import.
- Fresh verification passed:
  - `npm run verify:task-list-interactions`
  - `npm run verify:task-list-dnd-module`
  - `npm run verify:ux-polish`
  - `npm run verify:task-layout-unified-glass`
  - `npm run verify:task-cluster-stack`
  - `npm run verify:task-action-alignment`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 85 TaskList derived data helper module
- Continued TaskList cleanup by extracting pure data derivations from `src/components/TaskList.tsx`.
- Small design: keep React `useMemo` timing, DnD lifecycle, bucket rendering, and callback wiring in `TaskList.tsx`; move tag-history ordering, source grouping, and source-group visibility decisions into `src/components/taskList/taskListDerivations.ts`.
- Extended `scripts/verify-task-list-dnd-module.ts` and `scripts/verify-task-list-interactions.ts` first, then confirmed RED with `npm run verify:task-list-dnd-module`, which failed because `taskListDerivations.ts` did not exist.
- Added `taskListDerivations.ts` with `TaskSourceGroup`, `getTaskTagHistory`, `getTaskSourceGroups`, and `shouldShowSourceGroups`.
- Updated `TaskList.tsx` to call the new helpers via `useMemo` and removed inline tag/source derivation logic.
- `npm run verify:ux-polish` initially failed because it still expected the external-source split condition inline in `TaskList.tsx`; refreshed it to verify `shouldShowSourceGroups(tasks)` wiring and the helper's `getTaskSource(task) === 'external'` logic.
- Fresh verification passed:
  - `npm run verify:task-list-dnd-module`
  - `npm run verify:task-list-interactions`
  - `npm run verify:ux-polish`
  - `npm run verify:task-layout-unified-glass`
  - `npm run verify:task-cluster-stack`
  - `npm run verify:task-action-alignment`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 86 TaskList render helper boundary review
- Continued TaskList cleanup by extracting the final local list-rendering helper boundary from `src/components/TaskList.tsx`.
- Small design: keep `TaskList.tsx` responsible for the toolbar, scroll ref/floating scrollbar, DnD sensors and lifecycle handlers, active source drag state, shared drag-active flag, and memoized derivations; move animated list composition into `src/components/taskList/TaskListContent.tsx`.
- Confirmed the already-extended focused RED with `npm run verify:task-list-interactions`, which failed because `TaskListContent.tsx` did not exist.
- Added `TaskListContent.tsx`, preserving `AnimatePresence`, empty-state rendering, source-group vs flat-list branch, `SortableContext` usage, open-before-done buckets, source-group start-index calculation, source drag-disabled fallback, `SortableTaskItem` callback binding, and per-task edit-trigger routing.
- Updated `TaskList.tsx` to render `<TaskListContent ... />` and removed local `renderTask`, `renderTaskBucket`, and `renderSourceGroup` helpers plus now-unneeded sortable/animation imports.
- `npm run verify:task-list-interactions` initially failed on stale implementation-location assertions requiring `SortableContext` and `TaskListEmptyState` in `TaskList.tsx`; refreshed those checks to the new `TaskListContent.tsx` boundary.
- `npm run verify:task-list-dnd-module` and `npm run verify:ux-polish` then failed on stale assertions expecting `SortableSourceSection`/`SortableTaskItem` wiring in `TaskList.tsx`; refreshed those checks to verify `TaskList.tsx` delegates to `TaskListContent` and `TaskListContent` owns the concrete source/task sortable composition.
- Fresh verification passed:
  - `npm run verify:task-list-interactions`
  - `npm run verify:task-list-dnd-module`
  - `npm run verify:ux-polish`
  - `npm run verify:task-layout-unified-glass`
  - `npm run verify:task-cluster-stack`
  - `npm run verify:task-action-alignment`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`
- Current line counts after this pass: `src/components/TaskList.tsx` 170 lines, `src/components/taskList/TaskListContent.tsx` 110 lines.

## 2026-07-07 - Phase 87 SettingsPanel shell and navigation boundary
- Continued SettingsPanel cleanup by extracting the remaining shell/layout and navigation metadata from `src/components/SettingsPanel.tsx`.
- Small design: keep AI Review state/effects, generation flow, source-option arrays, and section-content branching in `SettingsPanel.tsx`; move the motion shell/sidebar/page-title/close button into `src/components/settings/SettingsPanelShell.tsx` and move section/group metadata into `src/components/settings/settingsPanelNavigation.ts`.
- Reconfirmed TDD RED with:
  - `npm run verify:settings-panel-modules`
  - `npm run verify:ux-polish`
- Added `SettingsPanelShell.tsx` and `settingsPanelNavigation.ts`, and updated `SettingsPanel.tsx` to render `<SettingsPanelShell ... />`.
- Rewrote the touched Chinese literals in `SettingsPanel.tsx` and the new navigation module with Unicode escapes so the new code does not inherit terminal mojibake.
- Fresh verification passed:
  - `npm run verify:settings-panel-modules`
  - `npm run verify:ux-polish`
  - `npm run verify:settings-basic-sections`
  - `npm run verify:settings-sync-section`
  - `npm run verify:settings-appearance-section`
  - `npm run verify:settings-ai-review-section`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 88 verifier boundary refresh after modularization
- Continued the final cleanup pass by treating the remaining `verify:rc` failures as verification drift and checking whether behavior still existed behind newer module boundaries before touching runtime code.
- Refreshed `scripts/verify-ai-regenerate-detection.ts` to follow `electron/aiReviewIpc.ts` for `inspectDaily` registration and to match the current `shouldRegenerate` daily flow in `SettingsPanel.tsx`.
- Refreshed `scripts/verify-ai-regenerate-force.ts` to follow `electron/aiReviewIpc.ts` for `runForDate` registration and Boolean force forwarding, again matching the current `shouldRegenerate` UI flow.
- Rewrote `scripts/verify-completion-review-settings.ts` so `SettingsPanel.tsx` proves delegation to `GeneralSettingsSection.tsx`, while the section module owns the completion-review toggle markup and copy.
- Updated `electron/windowMode.verify.ts` so lock-position verification follows the extracted `windowIpc.ts` handler and `reapplyWindowZOrder(mainWindow)` callback path instead of requiring the old inline logic in `main.ts`.
- Updated `scripts/verify-theme-visual-isolation.ts` so reset-theme behavior is verified across `SettingsPanel.tsx`, `AppearanceSettingsSection.tsx`, and `src/app/appPersonalization.ts` rather than assuming all reset-related strings and helper logic still live in the panel or `App.tsx`.
- Updated `scripts/verify-ui-feedback-regressions.ts` to follow `electron/windowIpc.ts` for settings-width persistence and `AiReviewManualGenerationSection.tsx` for progress-button rendering, and to accept the simplified `<AddTaskInput onAdd={addTask} />` wiring.
- Updated `scripts/verify-ai-timer.ts` to follow `src/app/appAiReviewLifecycle.ts` and `src/app/appScheduledReports.ts` for scheduled weekly/monthly generation and shared result handling.
- Updated `scripts/verify-obsidian-template-ui.ts` so `SettingsPanel.tsx` proves delegation into `TemplatesSettingsSection.tsx`, while the section module owns the concrete `onEditTemplate?.(kind)` action.
- Fresh verification passed:
  - `npm run verify:theme-visual-isolation`
  - `npm run verify:ui-feedback-regressions`
  - `npm run verify:ai-timer`
  - `npm run verify:obsidian-template-ui`
  - `npm run verify:rc`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-07 - Phase 64 App daily panel presentation helper
- Inspected `src/App.tsx` and selected the duplicated Daily Work / Inspiration tab presentation logic as a higher-value App-level cleanup slice than another tiny `TaskItem` extraction.
- Compared three options (leave inline, helper module, or new component) and chose a pure helper module to keep the JSX structure stable while removing repeated presentation decisions.
- Added `scripts/verify-app-daily-panel-presentation-module.ts` and wired `verify:app-daily-panel-presentation-module` into `package.json` and `verify:cleanup-core`; confirmed RED on the missing helper module.
- Added `src/app/appDailyPanelPresentation.ts` with `hasDailyPanelContent`, `getDailyPanelTabClassName`, and `getDailyPanelTabTitle`.
- Updated `src/App.tsx` to derive `hasDailyWorkContent` / `hasDailyInspirationContent` and reuse helper-driven className/title logic plus content-dot flags.
- Fixed a verifier-generation issue where `` became a backspace character in regex literals after Python generation; this was a test-script bug, not a production-code bug.
- Fresh verification passed: `npm run verify:app-daily-panel-presentation-module`, `npm run verify:app-ui-actions-module`, `npm run typecheck`, `npm run verify:cleanup-core`, and `npm run build`.


## 2026-07-07 - Phase 89 App shell presentation helper
- Re-read current planning files and inspected the remaining `App.tsx` presentation-heavy surface after the daily panel extraction.
- Chose the outer shell class/attribute logic as the next pure helper boundary because it removes a long template string while leaving all behavior and structure in place.
- Added `scripts/verify-app-shell-presentation-module.ts` and wired `verify:app-shell-presentation-module` into `package.json` and `verify:cleanup-core`; confirmed RED because `src/app/appShellPresentation.ts` did not yet exist.
- Added `src/app/appShellPresentation.ts` with `getAppShellClassName` and `getAppShellLowOpacityFlag`.
- Updated `src/App.tsx` to delegate the `app-shell` className template and `data-low-opacity` ternary into the helper.
- Fresh verification passed: `npm run verify:app-shell-presentation-module`, `npm run verify:app-theme-state-module`, `npm run typecheck`, `npm run verify:cleanup-core`, and `npm run build`.


## 2026-07-07 - Phase 90 App frame presentation helper extension
- Re-read the top-level `App.tsx` render shell after Phase 89 and identified two remaining nearby pure frame decisions still left inline: viewport loaded/opacity classes and the shell `data-theme` fallback.
- Chose to extend the existing `appShellPresentation.ts` helper instead of creating another tiny module, so the whole outer frame presentation surface stays together.
- Extended `scripts/verify-app-shell-presentation-module.ts` first and confirmed RED because `getAppViewportClassName` and `getAppShellThemeValue` were not yet exported.
- Added `getAppViewportClassName(isLoaded)` and `getAppShellThemeValue(activeThemeId)` to `src/app/appShellPresentation.ts`.
- Updated `src/App.tsx` to delegate the outer `app-viewport` className and shell `data-theme` fallback into the helper.
- Fresh verification passed: `npm run verify:app-shell-presentation-module`, `npm run verify:app-viewport-style-module`, `npm run verify:app-theme-state-module`, `npm run typecheck`, `npm run verify:cleanup-core`, and `npm run build`.

## 2026-07-07 - Phase 91 App overlay stack boundary
- Continued the App cleanup with a low-risk composition-only extraction after the outer-frame presentation helpers.
- Confirmed the existing focused RED with `npm run verify:app-overlay-stack-module`, which failed because `src/components/AppOverlayStack.tsx` did not exist.
- Added `src/components/AppOverlayStack.tsx` to own the top-level overlay composition for `SettingsPanel`, `AiOnboarding`, `TemplateEditorModal`, `ObsidianCompanionPanel`, `TaskCompletionDialog`, and `TaskReviewDialog`.
- Updated `src/App.tsx` to import `AppOverlayStack`, derive `aiOnboardingText` and `editingTemplateInitialTemplate`, gather `settingsPanelProps`, `companionPanelProps`, `completionDialogProps`, and `reviewDialogProps`, and delegate overlay rendering into `<AppOverlayStack ... />`.
- Kept `getInitialTemplateForKind(editingTemplateKind, obsidianTemplates)` in `App.tsx` so the template-editor boundary stays explicit and the existing template verifier can continue to prove the fallback derivation at the App layer.
- `npm run verify:app-overlay-stack-module` passed immediately after the extraction.
- During related regression:
  - `npm run verify:app-modal-actions-module` failed because it still expected direct overlay JSX props in `App.tsx`; refreshed it to verify prop-bag wiring in `App.tsx` plus concrete forwarding in `AppOverlayStack.tsx`.
  - `npm run verify:app-personalization-module` failed during `verify:cleanup-core` because it still expected direct `SettingsPanel` personalization props in `App.tsx`; refreshed it to verify `settingsPanelProps`.
  - `npm run verify:app-completion-actions-module` failed during `verify:cleanup-core` because it still expected direct `TaskCompletionDialog` props in `App.tsx`; refreshed it to verify `completionDialogProps`.
- Fresh verification passed:
  - `npm run verify:app-overlay-stack-module`
  - `npm run verify:app-modal-actions-module`
  - `npm run verify:app-template-editor-module`
  - `npm run verify:app-personalization-module`
  - `npm run verify:app-completion-actions-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 93 App main content boundary
- Continued the App cleanup with another low-risk composition-only extraction after the top-content and overlay boundaries.
- Added `scripts/verify-app-main-content-module.ts` and wired `verify:app-main-content-module` into `package.json` plus `verify:cleanup-core`.
- Confirmed TDD RED with `npm run verify:app-main-content-module`, which failed because `src/components/AppMainContent.tsx` did not exist.
- Added `src/components/AppMainContent.tsx` to own the main motion shell, `app-main-scroll` container, completed-review vs task-list branch, and `AddTaskInput` forwarding.
- Updated `src/App.tsx` to build `reviewViewProps`, `taskListProps`, `addTaskInputProps`, and `mainContentProps`, then delegate the main body into `<AppMainContent ... />` while leaving state/effects/helper ownership in `App.tsx`.
- `npm run typecheck` initially failed on the forwarded scroll-ref prop type; narrowed the component prop to the host div `ref` type and re-ran until green.
- `npm run verify:app-ui-actions-module`, `npm run verify:app-completion-actions-module`, and `npm run verify:task-list-interactions` then failed because they still expected direct `TaskList` / `ReviewView` / `AddTaskInput` wiring in `App.tsx`; refreshed them to follow the new prop-bag/component boundary.
- Fresh verification passed:
  - `npm run verify:app-main-content-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 94 App shell composition boundary
- Continued the same low-risk App cleanup by collapsing the remaining shell prop-bag assembly into a single composition helper instead of pushing logic back into `App.tsx`.
- Added `src/app/appShellComposition.tsx` and `scripts/verify-app-shell-composition-module.ts`, wired the new verifier into `package.json` and `verify:cleanup-core`, and confirmed RED before the helper existed.
- Updated `src/App.tsx` to call `createAppShellComposition(...)` and render `<TitleBar {...shellComposition.titleBarProps} />`, `<AppOverlayStack {...shellComposition.overlayStackProps} />`, and `<AppMainContent {...shellComposition.mainContentProps} />`.
- Refreshed stale verifier boundaries so `App.tsx` proves delegation, `appShellComposition.tsx` proves prop-bag assembly/derived values, and child components prove forwarding:
  - `verify:app-top-content-module`
  - `verify:app-main-content-module`
  - `verify:app-overlay-stack-module`
  - `verify:app-ui-actions-module`
  - `verify:app-completion-actions-module`
  - `verify:app-modal-actions-module`
  - `verify:app-personalization-module`
  - `verify:task-list-interactions`
  - `verify:app-review-dialog-state-module`
  - `verify:app-template-editor-module`
- Fresh verification passed:
  - `npm run verify:app-shell-composition-module`
  - `npm run verify:app-top-content-module`
  - `npm run verify:app-main-content-module`
  - `npm run verify:app-overlay-stack-module`
  - `npm run verify:app-ui-actions-module`
  - `npm run verify:app-completion-actions-module`
  - `npm run verify:app-modal-actions-module`
  - `npm run verify:app-personalization-module`
  - `npm run verify:task-list-interactions`
  - `npm run verify:app-review-dialog-state-module`
  - `npm run verify:app-template-editor-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 95 Electron Obsidian IPC module split
- Continued the low-risk Electron modularization line by extracting the remaining inline Obsidian IPC registration block from `electron/main.ts`.
- Added `scripts/verify-electron-obsidian-ipc-module.ts`, wired `verify:electron-obsidian-ipc-module` into `package.json` and `verify:cleanup-core`, and confirmed RED because `electron/obsidianIpc.ts` did not exist.
- Added `electron/obsidianIpc.ts` with `registerObsidianIpcHandlers(...)` for:
  - `obsidianTemplate:recognize`
  - `obsidianTemplate:pickTemplateFile`
  - `obsidian:getPath`
  - `obsidian:choosePath`
  - `obsidian:syncTasks`
  - `obsidian:previewTasks`
  - `obsidian:openDailyNote`
- Updated `electron/main.ts` to delegate those handlers through dependency injection instead of registering them inline.
- Refreshed `scripts/verify-obsidian-template-ui.ts` so it verifies `main.ts` delegation plus concrete handler ownership in `electron/obsidianIpc.ts`.
- `npm run build` initially failed because one copied Chinese dialog string in `electron/obsidianIpc.ts` became an unterminated mojibake literal; fixed it by rewriting the touched strings with Unicode escapes.
- Fresh verification passed:
  - `npm run verify:electron-obsidian-ipc-module`
  - `npm run verify:obsidian-template-ui`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 96 Electron task-menu window module split
- Continued the low-risk Electron modularization line by extracting the task-menu popup BrowserWindow creation boundary from `electron/main.ts`.
- Added `scripts/verify-electron-task-menu-window-module.ts`, wired `verify:electron-task-menu-window-module` into `package.json` and `verify:cleanup-core`, and confirmed RED because `electron/taskMenuWindow.ts` did not exist.
- Added `electron/taskMenuWindow.ts` with `TASK_MENU_WIDTH`, `TASK_MENU_HEIGHT`, and `createTaskMenuWindow(...)` so the module now owns popup placement, BrowserWindow options, preload wiring, renderer loading, and popup blur/closed lifecycle hooks.
- Updated `electron/main.ts` to keep `taskMenuWindow` state ownership and `closeTaskMenuWindow()` locally while delegating popup creation through `createTaskMenuWindow(...)`.
- Refreshed `scripts/verify-context-menu.ts` so it verifies `main.ts` delegation plus concrete popup ownership in `electron/taskMenuWindow.ts`.
- Fresh verification passed:
  - `npm run verify:electron-task-menu-window-module`
  - `npm run verify:context-menu`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 97 Electron tray menu module split
- Continued the low-risk Electron modularization line by extracting the tray/menu wiring boundary from `electron/main.ts`.
- Added `scripts/verify-electron-tray-menu-module.ts`, wired `verify:electron-tray-menu-module` into `package.json` and `verify:cleanup-core`, and confirmed RED because `electron/trayMenu.ts` did not exist.
- Added `electron/trayMenu.ts` with `refreshMainTrayMenu(...)` and `createMainTray(...)` so the module now owns tray menu template construction, desktop-mode toggle wiring, localized labels, tooltip setup, and tray click wiring.
- Updated `electron/main.ts` to keep `tray` state ownership, `isQuitting` mutation, and `showMainWindow` / `hideMainWindow` ownership while delegating tray creation and menu refresh through the new helper.
- Refreshed `scripts/verify-main-window-structure.ts` so it verifies `main.ts` delegation plus concrete tray/menu ownership in `electron/trayMenu.ts`.
- Fresh verification passed:
  - `npm run verify:electron-tray-menu-module`
  - `npm run verify:main-window-structure`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 98 Electron main window events module split
- Continued the low-risk Electron modularization line by extracting the remaining BrowserWindow event-registration block from `electron/main.ts`.
- Added `scripts/verify-electron-main-window-events-module.ts`, wired `verify:electron-main-window-events-module` into `package.json` and `verify:cleanup-core`, and confirmed RED because `electron/mainWindowEvents.ts` did not exist.
- Added `electron/mainWindowEvents.ts` with `registerMainWindowEventHandlers(...)` so the module now owns the main-window event wiring for:
  - `ready-to-show`
  - `did-finish-load`
  - `did-fail-load`
  - `preload-error`
  - `show`
  - `closed`
  - `hide`
  - `minimize`
  - `restore`
  - `blur`
  - `focus`
  - `render-process-gone`
  - `unresponsive`
  - `move`
  - `resize`
  - `close`
- Updated `electron/main.ts` to keep `mainWindow`, quit/user-hidden/window-mode/settings-mode state ownership and behavior helpers local while delegating the event binding through the new helper.
- Refreshed `scripts/verify-main-window-structure.ts` so it verifies `main.ts` delegation plus concrete event ownership in `electron/mainWindowEvents.ts`.
- Fresh verification passed:
  - `npm run verify:electron-main-window-events-module`
  - `npm run verify:main-window-structure`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 99 Electron main-window factory module split
- Continued the low-risk Electron modularization line by extracting the `createWindow()` BrowserWindow creation + fixed bootstrap order boundary from `electron/main.ts`.
- Added `scripts/verify-electron-main-window-factory-module.ts` and first confirmed TDD RED with `npm exec -- tsx scripts/verify-electron-main-window-factory-module.ts`, which failed because `electron/mainWindowFactory.ts` did not exist.
- Added `electron/mainWindowFactory.ts` with:
  - `createMainBrowserWindow(...)` for main `BrowserWindow` construction, preload/webPreferences wiring, background material application, and tool-window style application.
  - `setupMainBrowserWindow(...)` for the fixed bootstrap order: AI timers, tray creation, main renderer load, main-window event registration, and feature IPC registration callbacks.
- Updated `electron/main.ts` to keep `mainWindow`, tray/task-menu ownership, and all mutable state/getter/callback ownership local while delegating creation and bootstrap sequencing to the new helper.
- The first GREEN run exposed an over-strict verifier expectation: closure-based callback delegation inside `createWindow()` was being treated as “still inline.” Refreshed the verifier to assert the real boundary (`main.ts` passes explicit callbacks into `setupMainBrowserWindow(...)`, while `mainWindowFactory.ts` owns bootstrap ordering).
- Fresh verification passed:
  - `npm exec -- tsx scripts/verify-electron-main-window-factory-module.ts`
  - `npm run verify:main-window-structure`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 100 Electron app lifecycle module split
- Continued the low-risk Electron modularization line by extracting the remaining lifecycle/bootstrap registration block from the bottom of `electron/main.ts`.
- Added `scripts/verify-electron-app-lifecycle-module.ts` and confirmed TDD RED with `npm exec -- tsx scripts/verify-electron-app-lifecycle-module.ts`, which failed because `electron/appLifecycle.ts` did not exist.
- Added `electron/appLifecycle.ts` with `registerAppLifecycleHandlers(...)` so the module now owns:
  - `app.whenReady().then(...)`
  - `app.on('child-process-gone', ...)`
  - `app.on('before-quit', ...)`
  - `app.on('will-quit', ...)`
  - `app.on('quit', ...)`
  - `app.on('window-all-closed', ...)`
  - `app.on('activate', ...)`
- Updated `electron/main.ts` to keep `mainWindow`, `isQuitting`, `windowMode`, and `clearDesktopOwner(...)` ownership local while delegating lifecycle registration through explicit callbacks/getters into the new helper.
- Fresh verification passed:
  - `npm exec -- tsx scripts/verify-electron-app-lifecycle-module.ts`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 101 Electron desktop window mode module split
- Continued the Electron modularization line by extracting the higher-risk desktop guard / owner / window-mode state machine from `electron/main.ts`.
- Added `scripts/verify-electron-desktop-window-mode-module.ts` and confirmed TDD RED with `npm exec -- tsx scripts/verify-electron-desktop-window-mode-module.ts`, which failed because `electron/desktopWindowMode.ts` did not exist.
- Added `electron/desktopWindowMode.ts` with `createDesktopWindowModeController(...)` so the module now owns:
  - desktop foreground class tracking
  - desktop widget state transitions (`desktop-visible` / `app-background` / `dt-active`)
  - desktop owner apply/clear
  - desktop guard polling start/stop
  - `applyWindowMode(...)`
  - `reapplyWindowZOrder(...)`
  - desktop-active promotion for explicit user focus
- Updated `electron/main.ts` to keep `windowMode` and `userHidden` as the state truth sources while injecting them into the controller through getters/setters.
- Refreshed stale structural checks so they follow the new boundary:
  - `scripts/verify-main-window-structure.ts`
  - `electron/windowMode.verify.ts`
- The first GREEN attempt exposed a verifier mistake, not a code bug: the new focused verifier checked `stopDesktopGuard` delegation against `mainWindowEvents.ts` instead of `main.ts`. Fixed the verifier to assert the actual delegation site, then re-ran.
- Fresh verification passed:
  - `npm exec -- tsx scripts/verify-electron-desktop-window-mode-module.ts`
  - `npm run verify:main-window-structure`
  - `npm run verify:window-mode`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 102 Electron Obsidian daily-note content module split
- Continued the Electron modularization line by extracting the lower-risk Obsidian daily-note content helpers from `electron/main.ts` without touching sync orchestration.
- Added `scripts/verify-electron-obsidian-daily-note-content-module.ts` and confirmed TDD RED with `npm exec -- tsx scripts/verify-electron-obsidian-daily-note-content-module.ts`, which failed because `electron/obsidianDailyNoteContent.ts` did not exist.
- Added `electron/obsidianDailyNoteContent.ts` with `createObsidianDailyNoteContentHelpers(...)` so the module now owns:
  - `buildTaskLines`
  - `buildTaskBlock`
  - `buildWorkBlock`
  - `buildInspirationBlock`
  - `buildDailyTemplate`
  - `migrateLegacyInspirationSection`
  - `upsertMarkedBlock`
  - `readMarkedBlockBody`
  - internal unmarked-work cleanup for legacy migration
  - `migrateLegacyWorkSection`
  - `buildBlogDraft`
- Updated `electron/main.ts` to create the helper set through the new factory and keep:
  - `syncOneDailyNote(...)`
  - `getDatesAffectedBySync(...)`
  - `syncTasksToObsidian(...)`
  - `previewTasksToObsidian(...)`
  - vault/file I/O, overview refresh, and AI review triggering
- Preserved the existing `electron/obsidianIpc.ts` dependency-injection contract by continuing to pass `buildDailyTemplate` from `main.ts`.
- Registered `verify:electron-obsidian-daily-note-content-module` in `package.json` and added it to `verify:cleanup-core`.
- Current `electron/main.ts` line count after this pass: 1099.
- Fresh verification passed:
  - `npm exec -- tsx scripts/verify-electron-obsidian-daily-note-content-module.ts`
  - `npm run verify:electron-obsidian-daily-note-content-module`
  - `npm run verify:electron-obsidian-ipc-module`
  - `npm run verify:obsidian-template-ui`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 103 Electron Obsidian sync module split
- Continued the Electron modularization line by extracting the remaining Obsidian sync/orchestration layer from `electron/main.ts`.
- Added `scripts/verify-electron-obsidian-sync-module.ts` and confirmed TDD RED with `npm exec -- tsx scripts/verify-electron-obsidian-sync-module.ts`, which failed because `electron/obsidianSync.ts` did not exist.
- Added `electron/obsidianSync.ts` with `createObsidianSyncHelpers(...)` so the module now owns:
  - `getDailyFilePath(...)`
  - `triggerOverviewUpdate(...)`
  - `syncOneDailyNote(...)`
  - `getDatesAffectedBySync(...)`
  - `syncTasksToObsidian(...)`
  - `previewTasksToObsidian(...)`
- Updated `electron/main.ts` to keep state/helper ownership while delegating the Obsidian sync flow through the new helper factory.
- Preserved existing contracts for:
  - `electron/obsidianIpc.ts`
  - `electron/aiReviewIpc.ts`
  by continuing to pass `getDailyFilePath`, `triggerOverviewUpdate`, `syncTasksToObsidian`, and `previewTasksToObsidian` from `main.ts`.
- Registered `verify:electron-obsidian-sync-module` in `package.json` and added it to `verify:cleanup-core`.
- Current `electron/main.ts` line count after this pass: 1003.
- Fresh verification passed:
  - `npm exec -- tsx scripts/verify-electron-obsidian-sync-module.ts`
  - `npm run verify:electron-obsidian-sync-module`
  - `npm run verify:electron-obsidian-ipc-module`
  - `npm run verify:obsidian-template-ui`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 104 Electron AI review runtime module split
- Continued the Electron modularization line by extracting the shared AI review runtime helpers from `electron/main.ts` while intentionally leaving the daily review runner orchestration in place for a later pass.
- Added `scripts/verify-electron-ai-review-runtime-module.ts` and confirmed TDD RED with `npm exec -- tsx scripts/verify-electron-ai-review-runtime-module.ts`, which failed because `electron/aiReviewRuntime.ts` did not exist.
- Added `electron/aiReviewRuntime.ts` with `createAiReviewRuntimeHelpers(...)` so the module now owns:
  - report-kind LLM availability checks
  - stage helper creation
  - staged progress IPC emission
  - AI run diagnostic assembly
  - DOCX text extraction
- Updated `electron/main.ts` to create the runtime helper set through the new factory and keep `runReviewForDate(...)` focused on daily-review orchestration.
- Refreshed `scripts/verify-ai-run-diagnostics.ts` so it now verifies:
  - `main.ts` creates the runtime helper boundary
  - `electron/aiReviewRuntime.ts` owns progress emission and diagnostic assembly
- Registered `verify:electron-ai-review-runtime-module` in `package.json` and added it to `verify:cleanup-core`.
- Current `electron/main.ts` line count after this pass: 905.
- Fresh verification passed:
  - `npm exec -- tsx scripts/verify-electron-ai-review-runtime-module.ts`
  - `npm run verify:electron-ai-review-runtime-module`
  - `npm run verify:ai-run-diagnostics`
  - `npm run verify:electron-ai-review-ipc-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 105 Electron AI daily review runner module split
- Continued the Electron modularization line by extracting the remaining daily AI review runner boundary from `electron/main.ts`.
- Added `scripts/verify-electron-ai-review-daily-runner-module.ts`, registered `verify:electron-ai-review-daily-runner-module`, and confirmed TDD RED with `npm run verify:electron-ai-review-daily-runner-module`, which failed because `electron/aiReviewDailyRunner.ts` did not exist.
- Added `electron/aiReviewDailyRunner.ts` with `createAiReviewDailyRunner(...)` so the module now owns:
  - `inspectDailyAiContent(...)`
  - `runReviewForDate(...)`
  - daily inspection read-failure handling
  - daily build/request/write/confirm diagnostic staging
  - `runReviewForFile(...)` orchestration with the force flag
- Updated `electron/main.ts` to:
  - create `obsidianSyncHelpers` first
  - bridge the existing `obsidianSync -> runReviewForDate(...)` contract through a narrow deferred callback
  - create the daily runner through `createAiReviewDailyRunner(...)`
  - continue passing `runReviewForDate` and `inspectDailyAiContent` into `registerAiReviewIpcHandlers(...)`
- Refreshed related verifier boundaries so they now follow `main.ts -> aiReviewDailyRunner.ts`:
  - `scripts/verify-ai-regenerate-detection.ts`
  - `scripts/verify-ai-regenerate-force.ts`
  - `scripts/verify-ai-run-diagnostics.ts`
- Current `electron/main.ts` line count after this pass: 908.
- Fresh verification passed:
  - `npm run verify:electron-ai-review-daily-runner-module`
  - `npm run verify:ai-regenerate-detection`
  - `npm exec -- tsx scripts/verify-ai-regenerate-force.ts`
  - `npm run verify:ai-run-diagnostics`
  - `npm run verify:electron-ai-review-ipc-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 106 Electron AI timer scheduling module split
- Continued the Electron modularization line by extracting the remaining AI timer scheduling cluster from `electron/main.ts`.
- Added `scripts/verify-electron-ai-review-timer-module.ts`, registered `verify:electron-ai-review-timer-module`, and confirmed TDD RED with `npm run verify:electron-ai-review-timer-module`, which failed because `electron/aiReviewTimers.ts` did not exist.
- Added `electron/aiReviewTimers.ts` with `createAiReviewTimerScheduler(...)` so the module now owns:
  - `scheduleAiTimer()`
  - `scheduleWeeklyTimer()`
  - `scheduleMonthlyTimer()`
  - `scheduleExternalWeeklyTimer()`
  - `scheduleExternalMonthlyTimer()`
  - shared `scheduleAiTimers()`
- Updated `electron/main.ts` to create the scheduler through `createAiReviewTimerScheduler(...)` and continue injecting the shared `scheduleAiTimers` callback into:
  - `setupMainBrowserWindow(...)`
  - `registerAiReviewIpcHandlers(...)`
- Refreshed `scripts/verify-electron-ai-review-ipc-module.ts` so it now verifies timer-scheduler delegation through `aiReviewTimers.ts` instead of requiring inline scheduler functions in `main.ts`.
- Current `electron/main.ts` line count after this pass: 822.
- Fresh verification passed:
  - `npm run verify:electron-ai-review-timer-module`
  - `npm run verify:electron-ai-review-ipc-module`
  - `npm run verify:ai-timer`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-07 - Phase 107 Electron Win32 / Native helper module split
- Continued the Electron modularization line by extracting the remaining Win32/native helper island from `electron/main.ts`.
- Added `scripts/verify-electron-win32-native-module.ts`, registered `verify:electron-win32-native-module`, and confirmed TDD RED with `npm run verify:electron-win32-native-module`, which failed because `electron/win32Native.ts` did not exist.
- Added `electron/win32Native.ts` with `createWin32NativeHelpers(...)` so the module now owns:
  - Win32 `koffi` / `user32.dll` binding creation
  - `createHwndBuffer(...)`
  - desktop foreground detection
  - retained tool-window style no-op helper
  - native background-material disable wiring
- Updated `electron/main.ts` to create the helper set through `createWin32NativeHelpers(...)` and keep the existing contracts by continuing to pass:
  - `getWin32: () => win32` into `createDesktopWindowModeController(...)`
  - `applyNativeBackgroundMaterial`
  - `applyToolWindowStyle`
  into `createMainBrowserWindow(...)`
- Registered `verify:electron-win32-native-module` in `package.json` and added it to `verify:cleanup-core`.
- Current `electron/main.ts` line count after this pass: 669.
- Fresh verification passed:
  - `npm run verify:electron-win32-native-module`
  - `npm run verify:main-window-structure`
  - `npm run verify:window-mode`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-08 - Phase 108 Legacy task-export-path cleanup
- Switched the next low-risk cleanup from ?extract another helper? to removing a dead legacy concept after confirming `getTaskExportFilePath(...)` was unused and `taskExportPath` only survived in stale compatibility/i18n surfaces.
- Added `scripts/verify-legacy-task-export-path-cleanup.ts`, registered `verify:legacy-task-export-path-cleanup`, and confirmed TDD RED with `npm run verify:legacy-task-export-path-cleanup`, which failed because `electron/main.ts` still contained `getTaskExportFilePath(...)`.
- Removed the dead legacy task-export-path surface from:
  - `electron/main.ts`
  - `shared/obsidianTemplates.ts`
  - `src/i18n.ts`
- `electron/main.ts` no longer imports `resolveTemplatePath` just to support the dead helper.
- Current `electron/main.ts` line count after this pass: 661.
- Fresh verification passed:
  - `npm run verify:legacy-task-export-path-cleanup`
  - `npm run verify:electron-main-modules`
  - `npm run verify:obsidian-template-ui`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-08 - Phase 109 Electron app state accessors module split
- Continued the low-risk Electron modularization line by extracting the remaining settings/state accessor island from `electron/main.ts`.
- Added `scripts/verify-electron-app-state-accessors-module.ts`, registered `verify:electron-app-state-accessors-module`, added it to `verify:cleanup-core`, and confirmed TDD RED with `npm run verify:electron-app-state-accessors-module`, which failed because `electron/appStateAccessors.ts` did not exist.
- Added `electron/appStateAccessors.ts` with `createAppStateAccessors(...)` so the module now owns:
  - `getDefaultVaultPath()`
  - `getVaultPath()`
  - `getVaultStatus()`
  - `getCompanionSettings()` / `setCompanionSettings()`
  - `getAppSettings()` / `setAppSettings()`
  - `getObsidianTemplateSettings()` / `setObsidianTemplateSettings()`
  - `getAiReviewSettings()` / `setAiReviewSettings()`
  - `getReviewSections()` / `setReviewSections()`
  - `buildDailySourceRules()` / `getDailySourceRules()`
  - `getLlmCaller()`
- Updated `electron/main.ts` to create and destructure the accessor set through `createAppStateAccessors(...)` while continuing to inject the same function contracts into:
  - `registerWindowIpcHandlers(...)`
  - `registerSettingsIpcHandlers(...)`
  - `registerCompanionIpcHandlers(...)`
  - `registerAiReviewIpcHandlers(...)`
  - `registerObsidianIpcHandlers(...)`
  - the existing AI Review / Obsidian helper factories
- Removed direct accessor-related imports from `electron/main.ts`, including the Companion defaults, app/template/AI Review normalization helpers, review-section normalization, and shared LLM caller plumbing.
- Current `electron/main.ts` line count after this pass: 578.
- Fresh verification passed:
  - `npm run verify:electron-app-state-accessors-module`
  - `npm run verify:electron-companion-ipc-module`
  - `npm run verify:electron-obsidian-ipc-module`
  - `npm run verify:electron-ai-review-ipc-module`
  - `npm run verify:electron-main-modules`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-08 - Phase 110 Electron shared types module split
- Continued the low-risk Electron cleanup line by consolidating repeated Electron-only type definitions rather than introducing another behavior-owning helper.
- Added `scripts/verify-electron-shared-types-module.ts`, registered `verify:electron-shared-types-module`, added it to `verify:cleanup-core`, and confirmed TDD RED with `npm run verify:electron-shared-types-module`, which failed because `electron/sharedTypes.ts` did not exist.
- Added `electron/sharedTypes.ts` with these shared type exports:
  - `ElectronTask`
  - `TaskCompletionReview`
  - `InspectDailyResult`
  - `VaultStatus`
  - `ElectronStoreLike`
- Updated the affected Electron modules to import the shared types instead of keeping duplicated inline definitions:
  - `electron/main.ts`
  - `electron/aiReviewIpc.ts`
  - `electron/aiReviewDailyRunner.ts`
  - `electron/obsidianDailyNoteContent.ts`
  - `electron/obsidianSync.ts`
  - `electron/obsidianIpc.ts`
  - `electron/settingsIpc.ts`
  - `electron/windowIpc.ts`
  - `electron/appStateAccessors.ts`
- This pass intentionally changed structure only: runtime behavior and injection contracts stayed the same.
- Current `electron/main.ts` line count after this pass: 549.
- Fresh verification passed:
  - `npm run verify:electron-shared-types-module`
  - `npm run verify:electron-app-state-accessors-module`
  - `npm run verify:electron-window-ipc-module`
  - `npm run verify:electron-settings-ipc-module`
  - `npm run verify:electron-obsidian-ipc-module`
  - `npm run verify:electron-obsidian-sync-module`
  - `npm run verify:electron-ai-review-ipc-module`
  - `npm run verify:electron-ai-review-daily-runner-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-08 - Phase 111 Electron main shell / tray / task menu controller split
- Continued the low-risk Electron cleanup line by extracting the remaining UI shell / tray / popup-control island from `electron/main.ts`.
- Added `scripts/verify-electron-main-shell-controller-module.ts`, registered `verify:electron-main-shell-controller-module`, added it to `verify:cleanup-core`, and confirmed TDD RED with `npm run verify:electron-main-shell-controller-module`, which failed because `electron/mainShellController.ts` did not exist.
- Added `electron/mainShellController.ts` with `createMainShellController(...)` so the module now owns:
  - `showMainWindow()`
  - `hideMainWindow()`
  - `refreshTrayMenu()`
  - `createTray()`
  - `closeTaskMenuWindow()`
  - `openTaskMenuWindow()`
- Updated `electron/main.ts` to keep `tray`, `taskMenuWindow`, `userHidden`, and quit ownership local while injecting getters/setters/callbacks into the new controller.
- Refreshed related verifier boundaries so they now follow `main.ts -> mainShellController.ts`:
  - `scripts/verify-main-window-structure.ts`
  - `scripts/verify-context-menu.ts`
  - `scripts/verify-electron-task-menu-window-module.ts`
  - `scripts/verify-electron-tray-menu-module.ts`
  - `scripts/verify-electron-desktop-window-mode-module.ts`
- The first broad regression run exposed one stale verifier expectation in `scripts/verify-electron-desktop-window-mode-module.ts`: it still required `desktopWindowMode.markDesktopInteractive()` inline in `main.ts`. Updated the verifier to follow the new shell-controller boundary, then re-ran the suite green.
- Current `electron/main.ts` line count after this pass: 515.
- Fresh verification passed:
  - `npm run verify:electron-main-shell-controller-module`
  - `npm run verify:electron-main-modules`
  - `npm run verify:electron-window-ipc-module`
  - `npm run verify:electron-main-window-events-module`
  - `npm run verify:electron-task-menu-window-module`
  - `npm run verify:electron-tray-menu-module`
  - `npm run verify:context-menu`
  - `npm run verify:main-window-structure`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-08 - Phase 112 Electron main window persistence module split
- Continued the low-risk Electron cleanup line by extracting the remaining startup-bounds / debounced-window-persistence island from `electron/main.ts`.
- Added `scripts/verify-electron-main-window-persistence-module.ts`, registered `verify:electron-main-window-persistence-module`, added it to `verify:cleanup-core`, and confirmed TDD RED with `npm run verify:electron-main-window-persistence-module`, which failed because `electron/mainWindowPersistence.ts` did not exist.
- Added `electron/mainWindowPersistence.ts` with `createMainWindowPersistence(...)` so the module now owns:
  - `getInitialBounds()`
  - `persistWindowState()`
  - `getStoredWindowMode()`
- Updated `electron/main.ts` to remove inline `screen` / `normalizeRestoredWindowState` / `resolveWindowMode` usage and instead create the helper set through `createMainWindowPersistence(...)`.
- Refreshed `scripts/verify-ui-feedback-regressions.ts` so its normalized-startup-bounds assertion follows `electron/mainWindowPersistence.ts` instead of requiring that logic inline in `electron/main.ts`.
- During exploratory verification, `npm run verify:ui-feedback-regressions` exposed an unrelated stale App-shell assertion (`reviewViewProps` still expected directly in `App.tsx` after the earlier shell-composition refactor). That verifier was not used as the completion gate for this phase.
- Current `electron/main.ts` line count after this pass: 495.
- Fresh verification passed:
  - `npm run verify:electron-main-window-persistence-module`
  - `npm run verify:electron-window-state-module`
  - `npm run verify:electron-window-ipc-module`
  - `npm run verify:electron-main-window-events-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-08 - Phase 113 Electron main window bootstrap wiring module split
- Continued the low-risk Electron cleanup line by extracting the remaining main-window bootstrap callback composition block from `electron/main.ts`.
- Added `scripts/verify-electron-main-window-bootstrap-module.ts`, registered `verify:electron-main-window-bootstrap-module`, added it to `verify:cleanup-core`, and confirmed TDD RED with `npm run verify:electron-main-window-bootstrap-module`, which failed because `electron/mainWindowBootstrap.ts` did not exist.
- Added `electron/mainWindowBootstrap.ts` with `createMainWindowBootstrap(...)` so the module now owns:
  - `loadMainRenderer()`
  - `registerMainWindowEvents()`
  - `registerWindowIpc()`
  - `registerSettingsIpc()`
  - `registerTaskContextMenuIpc()`
  - `registerCompanionIpc()`
  - `registerAiReviewIpc()`
  - `registerObsidianIpc()`
- Updated `electron/main.ts` to keep `mainWindow`, `taskMenuWindow`, `settingsModeOpen`, `settingsModeRestoreWidth`, `userHidden`, `windowMode`, and quit state ownership local while delegating the callback bundle through `createMainWindowBootstrap(...)`.
- Refreshed the affected verifier boundaries so they now follow `main.ts -> mainWindowBootstrap.ts` instead of requiring inline callback registration in `main.ts`:
  - `scripts/verify-electron-main-window-factory-module.ts`
  - `scripts/verify-main-window-structure.ts`
  - `scripts/verify-electron-main-window-events-module.ts`
  - `scripts/verify-electron-window-ipc-module.ts`
  - `scripts/verify-electron-settings-ipc-module.ts`
  - `scripts/verify-electron-task-context-menu-ipc-module.ts`
  - `scripts/verify-electron-task-menu-window-module.ts`
  - `scripts/verify-electron-companion-ipc-module.ts`
  - `scripts/verify-electron-ai-review-ipc-module.ts`
  - `scripts/verify-electron-obsidian-ipc-module.ts`
  - `scripts/verify-context-menu.ts`
  - `scripts/verify-obsidian-template-ui.ts`
  - `scripts/verify-ai-regenerate-detection.ts`
  - `scripts/verify-ai-regenerate-force.ts`
- Current `electron/main.ts` line count after this pass: 448.
- New `electron/mainWindowBootstrap.ts` line count: 286.
- Fresh verification passed:
  - `npm run verify:electron-main-window-bootstrap-module`
  - `npm run verify:electron-main-window-factory-module`
  - `npm run verify:main-window-structure`
  - `npm run verify:electron-window-ipc-module`
  - `npm run verify:electron-settings-ipc-module`
  - `npm run verify:electron-ai-review-ipc-module`
  - `npm run verify:electron-obsidian-ipc-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-08 - Phase 114 Electron task date helper module split
- Continued the low-risk Electron cleanup line by extracting the remaining pure task-date / review helper island from `electron/main.ts`.
- Added `scripts/verify-electron-task-date-helpers-module.ts`, registered `verify:electron-task-date-helpers-module`, added it to `verify:cleanup-core`, and confirmed TDD RED with `npm run verify:electron-task-date-helpers-module`, which failed because `electron/taskDateHelpers.ts` did not exist.
- Added `electron/taskDateHelpers.ts` with:
  - `getTodayDate()`
  - `getDateKey()`
  - `getTaskDate()`
  - `getReviewDate()`
  - `getCompletionReviews()`
- Updated `electron/main.ts` to import those helpers instead of defining them inline.
- Removed now-dead inline leftovers from `electron/main.ts`:
  - `escapeTaskText()`
  - `formatDateTime()`
  - unused `DesktopWidgetState` alias
- Current `electron/main.ts` line count after this pass: 415.
- New `electron/taskDateHelpers.ts` line count: 28.
- Fresh verification passed:
  - `npm run verify:electron-task-date-helpers-module`
  - `npm run verify:electron-obsidian-daily-note-content-module`
  - `npm run verify:electron-obsidian-sync-module`
  - `npm run verify:electron-main-window-bootstrap-module`
  - `npm run verify:electron-ai-review-ipc-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-08 - Phase 115 Electron main window mode controller split
- Continued the low-risk Electron cleanup line by extracting the remaining `setWindowMode(...)` orchestration helper from `electron/main.ts`.
- Added `scripts/verify-electron-main-window-mode-controller-module.ts`, registered `verify:electron-main-window-mode-controller-module`, added it to `verify:cleanup-core`, and confirmed TDD RED with `npm run verify:electron-main-window-mode-controller-module`, which failed because `electron/mainWindowModeController.ts` did not exist.
- Added `electron/mainWindowModeController.ts` with `createMainWindowModeController(...)` so the module now owns:
  - persisted `WINDOW_MODE_KEY` writes
  - `applyWindowMode(...)` delegation
  - delayed `reapplyWindowZOrder(...)`
  - renderer `window:modeChanged` event emission
  - tray refresh triggering when a tray exists
- Updated `electron/main.ts` to:
  - keep `windowMode` truth-source ownership through `desktopWindowMode.setWindowModeState(...)`
  - keep `tray` ownership local
  - inject `desktopWindowMode.applyWindowMode`, `desktopWindowMode.reapplyWindowZOrder`, and tray refresh back into the new controller
- Resolved one GREEN-stage integration wrinkle: `refreshTrayMenu` is created by `mainShellController`, so the mode controller now receives a tiny delayed wrapper (`refreshTrayMenuImpl`) to avoid an initialization cycle while preserving behavior.
- Refreshed `scripts/verify-electron-desktop-window-mode-module.ts` and `electron/windowMode.verify.ts` so they follow the new `main.ts -> mainWindowModeController.ts -> desktopWindowMode.ts` boundary instead of requiring inline mode-application calls in `main.ts`.
- Current `electron/main.ts` line count after this pass: 421.
- New `electron/mainWindowModeController.ts` line count: 35.
- Fresh verification passed:
  - `npm run verify:electron-main-window-mode-controller-module`
  - `npm run verify:window-mode`
  - `npm run verify:electron-window-ipc-module`
  - `npm run verify:electron-tray-menu-module`
  - `npm run verify:electron-main-shell-controller-module`
  - `npm run verify:main-window-structure`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-08 - Phase 116 Electron renderer loader module split
- Continued the low-risk Electron cleanup line by extracting the shared renderer-loading orchestration helper from `electron/main.ts`.
- Added `scripts/verify-electron-renderer-loader-module.ts`, registered `verify:electron-renderer-loader-module`, added it to `verify:cleanup-core`, and confirmed TDD RED with `npm run verify:electron-renderer-loader-module`, which failed because `electron/rendererLoader.ts` did not exist.
- Added `electron/rendererLoader.ts` with `createRendererLoader(...)` so the module now owns:
  - dev-server URL resolution through `ELECTRON_RENDERER_URL || VITE_DEV_SERVER_URL`
  - `buildDevRendererUrl(...)`
  - `buildRendererQuery(...)`
  - `loadURL(...)` / `loadFile(...)` renderer routing
  - renderer-load diagnostics for both dev and packaged paths
- Updated `electron/main.ts` to replace the inline `loadRenderer(...)` helper with `const loadRenderer = createRendererLoader({ diag })` while keeping the same injected callback contract for `mainWindowBootstrap.ts`, `mainShellController.ts`, and `taskMenuWindow.ts`.
- Current `electron/main.ts` line count after this pass: 405.
- New `electron/rendererLoader.ts` line count: 27.
- Fresh verification passed:
  - `npm run verify:electron-renderer-loader-module`
  - `npm run verify:electron-main-window-bootstrap-module`
  - `npm run verify:electron-main-window-factory-module`
  - `npm run verify:main-window-structure`
  - `npm run verify:electron-task-menu-window-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-08 - Phase 117 Electron app environment module split
- Continued the low-risk Electron cleanup line by extracting the remaining development-environment / icon-path helper cluster from `electron/main.ts`.
- Added `scripts/verify-electron-app-environment-module.ts`, registered `verify:electron-app-environment-module`, added it to `verify:cleanup-core`, and confirmed TDD RED with `npm run verify:electron-app-environment-module`, which failed because `electron/appEnvironment.ts` did not exist.
- Added `electron/appEnvironment.ts` with `createAppEnvironment(...)` so the module now owns:
  - `DEV_APPDATA_ROOT`
  - `DEV_OBSIDIAN_PATH`
  - `LOCAL_BLOG_DRAFT_DIR`
  - `isDevelopmentBuild()`
  - `applyDevelopmentUserDataOverride()`
  - `getIconPathOptions()`
- Updated `electron/main.ts` to create and reuse the shared environment helper for:
  - development `userData` override startup behavior
  - `appStateAccessors` dev vault path injection
  - `obsidianSync` local blog draft directory injection
  - tray and main-window icon path option construction
- Fresh verification exposed two stale structural verifiers that still expected inline constants in `main.ts`:
  - `scripts/verify-electron-app-state-accessors-module.ts`
  - `scripts/verify-electron-obsidian-sync-module.ts`
- Refreshed those verifier boundaries so they now follow `main.ts -> appEnvironment.ts` rather than requiring `DEV_OBSIDIAN_PATH` / `LOCAL_BLOG_DRAFT_DIR` inline in `main.ts`.
- Current `electron/main.ts` line count after this pass: 397.
- New `electron/appEnvironment.ts` line count: 47.
- Fresh verification passed:
  - `npm run verify:electron-app-environment-module`
  - `npm run verify:electron-main-modules`
  - `npm run verify:electron-foundation-modules`
  - `npm run verify:electron-app-state-accessors-module`
  - `npm run verify:electron-obsidian-sync-module`
  - `npm run verify:electron-main-window-factory-module`
  - `npm run verify:electron-main-shell-controller-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-08 - Phase 118 Electron single-instance module split
- Continued the low-risk Electron cleanup line by extracting the remaining single-instance startup policy cluster from `electron/main.ts`.
- Added `scripts/verify-electron-single-instance-module.ts`, registered `verify:electron-single-instance-module`, added it to `verify:cleanup-core`, and confirmed TDD RED with `npm run verify:electron-single-instance-module`, which failed because `electron/singleInstance.ts` did not exist.
- Added `electron/singleInstance.ts` with `registerSingleInstancePolicy(...)` so the module now owns:
  - `requestSingleInstanceLock()`
  - duplicate-instance quit diagnostics and `app.quit()`
  - `second-instance` handling
  - minimized-window restore on second instance
  - show/focus behavior for the existing main window
- Updated `electron/main.ts` to replace the inline single-instance block with `registerSingleInstancePolicy({ app, diag, getMainWindow: () => mainWindow })`.
- Current `electron/main.ts` line count after this pass: 390.
- New `electron/singleInstance.ts` line count: 31.
- Fresh verification passed:
  - `npm run verify:electron-single-instance-module`
  - `npm run verify:electron-app-lifecycle-module`
  - `npm run verify:electron-main-modules`
  - `npm run verify:main-window-structure`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-08 - Phase 119 Electron main window startup module split
- Continued the low-risk Electron cleanup line by extracting the remaining `createWindow()` startup orchestration shell from `electron/main.ts`.
- Added `scripts/verify-electron-main-window-startup-module.ts`, registered `verify:electron-main-window-startup-module`, added it to `verify:cleanup-core`, and confirmed TDD RED with `npm run verify:electron-main-window-startup-module`, which failed because `electron/mainWindowStartup.ts` did not exist.
- Added `electron/mainWindowStartup.ts` with `createMainWindowStarter(...)` so the module now owns:
  - default vault-path seeding for `obsidianVaultPath`
  - startup bounds lookup through `getInitialBounds()`
  - stored initial mode lookup through `getStoredWindowMode()`
  - `createMainBrowserWindow(...)` orchestration
  - injected `setMainWindow(win)` state assignment
  - `diag('BrowserWindow created')`
  - initial `applyWindowMode(win, initialMode)`
  - fixed `setupMainBrowserWindow(win, createBootstrap(win))` ordering
- Updated `electron/main.ts` to replace the inline `createWindow()` body with `const createWindow = createMainWindowStarter({...})` while preserving `mainWindow` truth-source ownership and the existing bootstrap dependency assembly.
- Refreshed stale structural verifiers so they now follow the new startup boundary:
  - `scripts/verify-electron-main-window-factory-module.ts`
  - `scripts/verify-electron-main-window-bootstrap-module.ts`
- Current `electron/main.ts` line count after this pass: 390.
- New `electron/mainWindowStartup.ts` line count: 59.
- Fresh verification passed:
  - `npm run verify:electron-main-window-startup-module`
  - `npm run verify:electron-main-window-factory-module`
  - `npm run verify:electron-main-window-bootstrap-module`
  - `npm run verify:electron-app-lifecycle-module`
  - `npm run verify:main-window-structure`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-08 - Phase 120 Electron settings-mode state module split
- Continued the low-risk Electron cleanup line by extracting the shared settings-mode state seam that was still duplicated across `electron/main.ts`, `electron/mainWindowBootstrap.ts`, `electron/mainWindowEvents.ts`, and `electron/windowIpc.ts`.
- Added `scripts/verify-electron-settings-mode-state-module.ts`, registered `verify:electron-settings-mode-state-module`, added it to `verify:cleanup-core`, and confirmed TDD RED with `npm run verify:electron-settings-mode-state-module`, which failed because `electron/settingsModeState.ts` did not exist.
- Added `electron/settingsModeState.ts` with:
  - `SettingsModeState`
  - `createSettingsModeState({ initialRestoreWidth })`
- Updated `electron/main.ts` to replace the inline:
  - `settingsModeOpen`
  - `settingsModeRestoreWidth`
  - inline `settingsMode: { ... }` adapter
  with a shared `const settingsMode = createSettingsModeState({ initialRestoreWidth: RESET_WINDOW_WIDTH })`.
- Updated the downstream Electron modules to consume the shared state contract:
  - `electron/mainWindowBootstrap.ts` now imports `SettingsModeState` and forwards `settingsMode` directly.
  - `electron/mainWindowEvents.ts` now reads `settingsMode.isOpen()` instead of depending on a separate `getSettingsModeOpen()` callback.
  - `electron/windowIpc.ts` now imports the shared `SettingsModeState` type instead of redefining it inline.
- Current `electron/main.ts` line count after this pass: 344.
- New `electron/settingsModeState.ts` line count: 25.
- Fresh verification passed:
  - `npm run verify:electron-settings-mode-state-module`
  - `npm run verify:electron-window-ipc-module`
  - `npm run verify:electron-main-window-bootstrap-module`
  - `npm run verify:electron-main-window-events-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-08 - Phase 121 Electron user-hidden state module split
- Continued the low-risk Electron cleanup line by extracting the small user-hidden state seam that was still represented as a bare mutable boolean in `electron/main.ts` and passed around through ad hoc getter/setter callbacks.
- Added `scripts/verify-electron-user-hidden-state-module.ts`, registered `verify:electron-user-hidden-state-module`, added it to `verify:cleanup-core`, and confirmed TDD RED with `npm run verify:electron-user-hidden-state-module`, which failed because `electron/userHiddenState.ts` did not exist.
- Added `electron/userHiddenState.ts` with:
  - `UserHiddenState`
  - `createUserHiddenState()`
- Updated `electron/main.ts` to replace `let userHidden = false` with `const userHidden = createUserHiddenState()` and pass the shared state object into shell, bootstrap, and desktop-mode composition boundaries.
- Updated downstream modules to consume narrow facets of the shared state object:
  - `electron/mainShellController.ts` receives `Pick<UserHiddenState, 'setHidden'>` and calls `userHidden.setHidden(false/true)` when showing/hiding the main window.
  - `electron/mainWindowBootstrap.ts` receives `Pick<UserHiddenState, 'isHidden'>` and forwards it to main-window events.
  - `electron/mainWindowEvents.ts` reads `userHidden.isHidden()` for diagnostics and the desktop-guard skip condition.
  - `electron/desktopWindowMode.ts` reads `userHidden.isHidden()` before `showInactive()` in desktop-visible state.
- Refreshed stale structural verifiers:
  - `scripts/verify-electron-main-shell-controller-module.ts`
  - `scripts/verify-electron-desktop-window-mode-module.ts`
  - `scripts/verify-main-window-structure.ts`
- One related verification run exposed a stale `verify:main-window-structure` assertion that still expected `getUserHidden()` in diagnostics; root cause was verifier boundary drift after the new shared-state object. Updated the assertion to follow `userHidden.isHidden()` and re-ran green.
- Current `electron/main.ts` line count after this pass: 343.
- New `electron/userHiddenState.ts` line count: 13.
- Fresh verification passed:
  - `npm run verify:electron-user-hidden-state-module`
  - `npm run verify:electron-main-shell-controller-module`
  - `npm run verify:electron-desktop-window-mode-module`
  - `npm run verify:electron-main-window-bootstrap-module`
  - `npm run verify:electron-main-window-events-module`
  - `npm run verify:main-window-structure`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-08 - Phase 122 UI feedback regression verifier boundary refresh
- Continued with the previously exposed stale `verify:ui-feedback-regressions` failure instead of starting a new product-code extraction.
- Reproduced the RED state: `npm run verify:ui-feedback-regressions` failed at `AssertionError [ERR_ASSERTION]: App should gather review-view props before delegating main content.` because the verifier still expected `const reviewViewProps = {` directly in `src/App.tsx`.
- Investigated the current data flow and confirmed the behavior boundary had moved rather than regressed:
  - `src/App.tsx` calls `createAppShellComposition({...})`, passes `deleteTaskReview` and `addTask`, and renders `<AppMainContent {...shellComposition.mainContentProps} />`.
  - `src/app/appShellComposition.tsx` now owns `reviewViewProps` with `onDeleteReview: deleteTaskReview` and `addTaskInputProps` with `onAdd: addTask`.
  - `src/components/AppMainContent.tsx` still forwards those props to `<ReviewView {...reviewViewProps} />` and `<AddTaskInput {...addTaskInputProps} />`.
- Updated `scripts/verify-ui-feedback-regressions.ts` to read `src/app/appShellComposition.tsx` and assert the current `App.tsx -> appShellComposition.tsx -> AppMainContent.tsx` boundary.
- Focused GREEN verification passed: `npm run verify:ui-feedback-regressions`.
- Fresh verification passed:
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-08 - Phase 123 Electron main store keys module split
- Continued the low-risk Electron cleanup line by extracting the remaining store-key string constants from `electron/main.ts`.
- Added `scripts/verify-electron-main-store-keys-module.ts` and confirmed RED with `npm exec -- tsx scripts/verify-electron-main-store-keys-module.ts`, which failed because `electron/mainStoreKeys.ts` did not exist.
- Added `electron/mainStoreKeys.ts` with:
  - `OBSIDIAN_PATH_KEY = 'obsidianVaultPath'`
  - `WINDOW_STATE_KEY = 'windowState'`
  - `COMPACT_MODE_KEY = 'compactMode'`
  - `AUTO_START_KEY = 'autoStart'`
- Updated `electron/main.ts` to import those constants instead of defining them inline, while preserving all existing composition injection points.
- Registered `verify:electron-main-store-keys-module` in `package.json` and added it to `verify:cleanup-core` immediately after `verify:electron-main-modules`.
- Fresh verification passed:
  - `npm run verify:electron-main-store-keys-module`
  - `npm run verify:electron-main-window-persistence-module`
  - `npm run verify:electron-main-window-startup-module`
  - `npm run verify:electron-main-window-bootstrap-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-08 - Phase 124 Electron AI review runner bridge module split
- Continued the low-risk Electron cleanup line by extracting a narrow delayed-runner bridge from `electron/main.ts`.
- Added `scripts/verify-electron-ai-review-runner-bridge-module.ts` and confirmed RED with `npm exec -- tsx scripts/verify-electron-ai-review-runner-bridge-module.ts`, which failed because `electron/aiReviewRunnerBridge.ts` did not exist.
- Added `electron/aiReviewRunnerBridge.ts` with:
  - `AiReviewRunnerBridgeTask`
  - `AiReviewRunner`
  - `createAiReviewRunnerBridge()`
- Moved the nullable `runReviewForDateImpl` state and the existing `AI daily review runner not initialized` guard out of `electron/main.ts` and into the bridge module.
- Updated `electron/main.ts` so Obsidian sync receives `aiReviewRunnerBridge.runReviewForDate`, then `aiReviewRunnerBridge.setRunner(runReviewForDate)` is called after `createAiReviewDailyRunner(...)` returns.
- Registered `verify:electron-ai-review-runner-bridge-module` in `package.json` and added it to `verify:cleanup-core` after `verify:electron-ai-review-daily-runner-module`.
- During GREEN, the new verifier needed two calibration fixes: word-boundary regexes had been written as control characters, and the setter/callback assertions needed to accept TypeScript parameter annotations.
- Fresh verification passed:
  - `npm run verify:electron-ai-review-runner-bridge-module`
  - `npm run verify:electron-ai-review-daily-runner-module`
  - `npm run verify:electron-obsidian-sync-module`
  - `npm run verify:electron-main-modules`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-08 - Phase 125 Electron app quit-state module split
- Continued the low-risk Electron cleanup line by extracting the remaining app quit-state boolean from `electron/main.ts`.
- Added `scripts/verify-electron-app-quit-state-module.ts` and confirmed RED with `npm exec -- tsx scripts/verify-electron-app-quit-state-module.ts`, which failed because `electron/appQuitState.ts` did not exist.
- Added `electron/appQuitState.ts` with:
  - `AppQuitState`
  - `createAppQuitState()`
- Updated `electron/main.ts` to replace inline `let isQuitting = false` and direct `isQuitting = true` writes with `appQuitState.isQuitting` / `appQuitState.markQuitting`.
- Preserved existing behavior by continuing to pass quit-state reader/writer callbacks into main-window bootstrap and app lifecycle, and by marking quit state before the shell-controller `app.quit()` path.
- Registered `verify:electron-app-quit-state-module` in `package.json` and added it to `verify:cleanup-core` after `verify:electron-app-lifecycle-module`.
- During GREEN, the new verifier needed one calibration fix because `mainWindowBootstrap.ts` / `appLifecycle.ts` use method-style callback signatures (`isQuitting(): boolean`) rather than property arrow signatures.
- Fresh verification passed:
  - `npm run verify:electron-app-quit-state-module`
  - `npm run verify:electron-app-lifecycle-module`
  - `npm run verify:electron-main-window-bootstrap-module`
  - `npm run verify:electron-main-shell-controller-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-08 - Phase 126 Electron window-mode state module split
- Continued the low-risk Electron cleanup line by extracting the remaining process-local `windowMode` truth source from `electron/main.ts`.
- Added `scripts/verify-electron-window-mode-state-module.ts`, registered `verify:electron-window-mode-state-module`, added it to `verify:cleanup-core`, and confirmed TDD RED with `npm exec -- tsx scripts/verify-electron-window-mode-state-module.ts`, which failed because `electron/windowModeState.ts` did not exist.
- Added `electron/windowModeState.ts` with:
  - `WindowModeState`
  - `createWindowModeState(initialMode)`
- Updated `electron/main.ts` to replace the bare `let windowMode: WindowMode = 'onTop'` and ad hoc getter/setter callbacks with:
  - `const windowModeState = createWindowModeState('onTop')`
  - `getWindowMode: windowModeState.getMode`
  - `setWindowModeState: windowModeState.setMode`
- Preserved existing behavior by leaving persisted mode updates, desktop-mode application, shell reads, bootstrap reads, and lifecycle reads in their current downstream boundaries.
- Refreshed `scripts/verify-electron-desktop-window-mode-module.ts` because it still expected the old inline `windowMode = mode` setter in `main.ts`; the better invariant is now that `main.ts` injects `windowModeState.setMode` into `desktopWindowMode`.
- Fresh verification passed:
  - `npm run verify:electron-window-mode-state-module`
  - `npm run verify:electron-main-window-mode-controller-module`
  - `npm run verify:electron-desktop-window-mode-module`
  - `npm run verify:electron-main-shell-controller-module`
  - `npm run verify:electron-main-window-bootstrap-module`
  - `npm run verify:electron-app-lifecycle-module`
  - `npm run verify:window-mode`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-08 - Phase 127 Electron main runtime-state module split
- Continued the low-risk Electron cleanup line by extracting the remaining top-level runtime references from `electron/main.ts`.
- Added `scripts/verify-electron-main-runtime-state-module.ts`, registered `verify:electron-main-runtime-state-module`, added it to `verify:cleanup-core`, and confirmed TDD RED with `npm exec -- tsx scripts/verify-electron-main-runtime-state-module.ts`, which failed because `electron/mainRuntimeState.ts` did not exist.
- Added `electron/mainRuntimeState.ts` with:
  - `MainRuntimeState`
  - `createMainRuntimeState()`
- Updated `electron/main.ts` to replace bare runtime references with `runtimeState` helpers:
  - `mainWindow` -> `runtimeState.getMainWindow` / `runtimeState.setMainWindow` / `runtimeState.clearMainWindow`
  - `tray` -> `runtimeState.getTray` / `runtimeState.setTray`
  - `taskMenuWindow` -> `runtimeState.getTaskMenuWindow` / `runtimeState.setTaskMenuWindow`
- Preserved behavior by keeping the actual window/tray/task-menu behavior in existing downstream modules: single-instance policy, AI timers, mode controller, shell controller, startup, bootstrap, and lifecycle.
- Refreshed stale verifier boundaries that still expected bare `mainWindow`, `tray`, or `taskMenuWindow` ownership in `main.ts`:
  - `scripts/verify-electron-main-shell-controller-module.ts`
  - `scripts/verify-electron-main-window-startup-module.ts`
  - `scripts/verify-electron-main-window-mode-controller-module.ts`
  - `scripts/verify-electron-single-instance-module.ts`
  - `scripts/verify-electron-ai-review-timer-module.ts`
  - `scripts/verify-electron-main-window-factory-module.ts`
  - `scripts/verify-electron-task-menu-window-module.ts`
  - `scripts/verify-electron-tray-menu-module.ts`
- Fresh verification passed:
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-08 - Phase 128 Electron main localization helper split
- Continued the Electron main composition cleanup line by extracting the tiny identity localizer from `electron/main.ts`.
- Added `scripts/verify-electron-main-localization-module.ts`, registered `verify:electron-main-localization-module`, added it to `verify:cleanup-core`, and confirmed TDD RED with `npm exec -- tsx scripts/verify-electron-main-localization-module.ts`, which failed because `electron/mainLocalization.ts` did not exist.
- Added `electron/mainLocalization.ts` with:
  - `MainLocalizer`
  - `zh(text: string): string`
- Updated `electron/main.ts` to import `zh` from the new helper module and keep passing it into the same app-state, Obsidian daily-note content, shell-controller, and bootstrap boundaries.
- Kept the cut intentionally structural: no renderer i18n changes, no user-visible copy edits, and no broad encoding/mojibake cleanup.
- Fresh verification passed:
  - `npm run verify:electron-main-localization-module`
  - `npm run verify:electron-app-state-accessors-module`
  - `npm run verify:electron-obsidian-daily-note-content-module`
  - `npm run verify:electron-main-shell-controller-module`
  - `npm run verify:electron-main-window-bootstrap-module`
  - `npm run verify:electron-main-modules`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-08 - Phase 129 Electron tray refresh bridge module split
- Continued the Electron main composition cleanup line by extracting the remaining delayed tray-refresh callback bridge from `electron/main.ts`.
- Added `scripts/verify-electron-tray-refresh-bridge-module.ts` and confirmed TDD RED with `npm exec -- tsx scripts/verify-electron-tray-refresh-bridge-module.ts`, which failed because `electron/trayRefreshBridge.ts` did not exist.
- Added `electron/trayRefreshBridge.ts` with:
  - `TrayRefreshBridge`
  - `createTrayRefreshBridge()`
- Updated `electron/main.ts` to replace the inline nullable `refreshTrayMenuImpl` state with:
  - `const trayRefreshBridge = createTrayRefreshBridge()`
  - `refreshTrayMenu: trayRefreshBridge.refreshTrayMenu` in `createMainWindowModeController(...)`
  - `trayRefreshBridge.setRefreshTrayMenu(refreshTrayMenu)` after `createMainShellController(...)` returns the real shell callback
- Registered `verify:electron-tray-refresh-bridge-module` in `package.json` and added it to `verify:cleanup-core` after `verify:electron-main-window-mode-controller-module`.
- One package-script insertion attempt failed safely because the text insertion point was too exact; no file damage occurred, and the registration was then applied through JSON parsing.
- Fresh verification passed:
  - `npm run verify:electron-tray-refresh-bridge-module`
  - `npm run verify:electron-main-window-mode-controller-module`
  - `npm run verify:electron-main-shell-controller-module`
  - `npm run verify:electron-tray-menu-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-08 - Phase 130 Electron main dead Task alias cleanup
- Continued the Electron main cleanup line with a tiny type-only dead-code removal.
- Inspected `electron/main.ts` and found the leftover `import type { ElectronTask } from './sharedTypes'` plus `type Task = ElectronTask`; no remaining code referenced the local `Task` alias.
- Added `scripts/verify-electron-main-dead-task-alias-cleanup.ts` and confirmed TDD RED with `npm exec -- tsx scripts/verify-electron-main-dead-task-alias-cleanup.ts`, which failed because `main.ts` still imported `ElectronTask` and defined the alias.
- Removed the unused `ElectronTask` import and `type Task = ElectronTask` alias from `electron/main.ts`.
- Registered `verify:electron-main-dead-task-alias-cleanup` in `package.json` and added it to `verify:cleanup-core` after `verify:electron-shared-types-module`.
- Refreshed `scripts/verify-electron-shared-types-module.ts` because it still treated `electron/main.ts` as a required `ElectronTask` consumer; the stronger invariant is now that real downstream consumers keep importing `ElectronTask`, while `main.ts` stays free of the dead local alias.
- Fresh verification passed:
  - `npm run verify:electron-main-dead-task-alias-cleanup`
  - `npm run verify:electron-shared-types-module`
  - `npm run verify:electron-main-modules`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-08 - Phase 131 Electron native occlusion policy module split
- Continued the Electron main composition cleanup line by extracting the top-level Chromium native window occlusion startup policy from `electron/main.ts`.
- Added `scripts/verify-electron-native-occlusion-policy-module.ts` and confirmed TDD RED with `npm exec -- tsx scripts/verify-electron-native-occlusion-policy-module.ts`, which failed because `electron/nativeOcclusionPolicy.ts` did not exist.
- Added `electron/nativeOcclusionPolicy.ts` with:
  - `NativeOcclusionPolicyApp`
  - `disableNativeWindowOcclusion(app)`
- Updated `electron/main.ts` to import and call `disableNativeWindowOcclusion(app)` before `createAppEnvironment(...)`, preserving the required before-ready timing while removing the inline `app.commandLine.appendSwitch(...)` startup policy from the composition shell.
- Registered `verify:electron-native-occlusion-policy-module` in `package.json` and added it to `verify:cleanup-core` after `verify:electron-app-environment-module`.
- Fresh verification passed:
  - `npm run verify:electron-native-occlusion-policy-module`
  - `npm run verify:electron-app-environment-module`
  - `npm run verify:electron-main-modules`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-08 - Phase 132 Electron diagnostics safe-start module split
- Continued the Electron main startup cleanup line by moving the crash-diagnostics startup guard from `electron/main.ts` into `electron/diagnostics.ts`.
- Added `scripts/verify-electron-diagnostics-safe-start-module.ts` and confirmed TDD RED with `npm exec -- tsx scripts/verify-electron-diagnostics-safe-start-module.ts`, which failed because `diagnostics.ts` did not export `startCrashDiagnosticsSafely`.
- Added `startCrashDiagnosticsSafely(diag)` to `electron/diagnostics.ts`, preserving the existing failure log: `crash diagnostics startup failed: ...`.
- Updated `electron/main.ts` to import `startCrashDiagnosticsSafely` and call it immediately after `const diag = createDiagLogger()`.
- Removed the inline crash diagnostics try/catch from `electron/main.ts`; the low-level `startCrashDiagnostics(diag)` remains in `diagnostics.ts` for the actual crash reporter and process exception handlers.
- Registered `verify:electron-diagnostics-safe-start-module` in `package.json` and added it to `verify:cleanup-core` after `verify:electron-foundation-modules`.
- Fresh verification passed:
  - `npm run verify:electron-diagnostics-safe-start-module`
  - `npm run verify:electron-foundation-modules`
  - `npm run verify:electron-main-modules`
  - `npm run verify:electron-native-occlusion-policy-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`



## 2026-07-08 - Phase 133 Electron main diagnostics bootstrap module split
- Continued the Electron main startup cleanup line by extracting the remaining diagnostics bootstrap sequence from `electron/main.ts`.
- Added `scripts/verify-electron-main-diagnostics-bootstrap-module.ts` and confirmed TDD RED with `npm exec -- tsx scripts/verify-electron-main-diagnostics-bootstrap-module.ts`, which failed because `electron/diagnostics.ts` did not export `createMainDiagnostics`.
- Added `createMainDiagnostics()` to `electron/diagnostics.ts` with the existing sequence:
  - `const diag = createDiagLogger()`
  - `startCrashDiagnosticsSafely(diag)`
  - `diag('=== app starting ===')`
  - `return diag`
- Updated `electron/main.ts` to import `createMainDiagnostics` and initialize `const diag = createMainDiagnostics()` while leaving all downstream diagnostic injection unchanged.
- Refreshed `scripts/verify-electron-diagnostics-safe-start-module.ts` so the old safe-start verifier follows the new `main.ts -> createMainDiagnostics() -> startCrashDiagnosticsSafely(diag)` boundary instead of requiring safe-start to be called inline in `main.ts`.
- Registered `verify:electron-main-diagnostics-bootstrap-module` in `package.json` and added it to `verify:cleanup-core` after `verify:electron-diagnostics-safe-start-module`.
- Current line counts after this pass:
  - `electron/main.ts`: 311 lines
  - `electron/diagnostics.ts`: 43 lines
- Fresh verification passed:
  - `npm run verify:electron-main-diagnostics-bootstrap-module`
  - `npm run verify:electron-diagnostics-safe-start-module`
  - `npm run verify:electron-foundation-modules`
  - `npm run verify:electron-main-modules`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-08 - Phase 134 cleanup-core runner module split
- Continued broad maintainability work by addressing verification-tooling debt: `package.json` had accumulated a very long inline `verify:cleanup-core` command chain with 101 `npm run ...` entries.
- Added `scripts/verify-cleanup-core-runner-module.ts` and confirmed RED with `npm exec -- tsx scripts/verify-cleanup-core-runner-module.ts`; it failed because `verify:cleanup-core` still owned the huge inline command string.
- Generated `scripts/verify-cleanup-core.ts` from the existing inline command order, then changed `package.json` so `verify:cleanup-core` delegates to `tsx scripts/verify-cleanup-core.ts`.
- Added `verify:cleanup-core-runner-module` to `package.json` and made the cleanup-core runner include its own structural verifier as the first command.
- Added `scripts/verifyCleanupCore.ts` with:
  - `readCleanupCoreCommands()`
  - `assertCleanupCoreIncludes(command, message)`
- Migrated 63 stale focused verifier membership checks from `scripts['verify:cleanup-core']?.includes('npm run ...')` to `assertCleanupCoreIncludes(...)`, because the cleanup-core source of truth is now the runner file rather than the package script string.
- Debugged two failures after the first extraction:
  - `verify:cleanup-core-runner-module` expected single-quoted command strings, while the generated runner used JSON double quotes; fixed the structural verifier to accept either quote style.
  - `npm run verify:cleanup-core` exited before child output because `spawnSync('npm.cmd', ..., shell:false)` returned `EINVAL` on this Windows/Node environment; verified with a probe and replaced the runner invocation with `spawnSync(process.execPath, [process.env.npm_execpath, 'run', command], ...)`.
- Fresh verification passed:
  - `npm run verify:cleanup-core-runner-module`
  - `npm run verify:electron-main-diagnostics-bootstrap-module`
  - `npm run verify:app-ai-review-lifecycle-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-08 - Phase 135 cleanup-core runner export boundary split
- Continued verification-tooling cleanup by hardening the new cleanup-core runner boundary after Phase 134.
- Added `scripts/verify-cleanup-core-runner-exports-module.ts` and confirmed RED with `npm exec -- tsx scripts/verify-cleanup-core-runner-exports-module.ts`; it failed because `scripts/verify-cleanup-core.ts` still declared `const cleanupCoreCommands` without exporting it.
- Updated `scripts/verify-cleanup-core.ts` to:
  - export `cleanupCoreCommands`
  - export `runCleanupCore()`
  - run only when `fileURLToPath(import.meta.url) === process.argv[1]`
  - include `verify:cleanup-core-runner-exports-module` immediately after `verify:cleanup-core-runner-module`
- Updated `scripts/verifyCleanupCore.ts` to import `cleanupCoreCommands` directly instead of reading and regex-parsing the runner source file.
- Registered `verify:cleanup-core-runner-exports-module` in `package.json`.
- Fresh verification passed:
  - `npm run verify:cleanup-core-runner-exports-module`
  - `npm run verify:cleanup-core-runner-module`
  - `npm run verify:electron-main-diagnostics-bootstrap-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-08 - Phase 136 Electron AI Review IPC helpers module split
- Continued the low-risk Electron cleanup line by extracting pure helper logic from `electron/aiReviewIpc.ts`, currently one of the larger Electron feature modules.
- Added `scripts/verify-electron-ai-review-ipc-helpers-module.ts`; the first RED attempt failed too early at static ESM import because the helper module did not exist, so the verifier was calibrated to assert file existence before dynamically importing helper exports.
- Confirmed valid TDD RED with `npm exec -- tsx scripts/verify-electron-ai-review-ipc-helpers-module.ts`, which failed because `electron/aiReviewIpcHelpers.ts` did not exist.
- Added `electron/aiReviewIpcHelpers.ts` with:
  - `buildSourceCharsMessage(sourceChars)`
  - `getWeekDates(selected)`
  - `getMonthDates(month)`
- Updated `electron/aiReviewIpc.ts` to import these helpers and removed their inline definitions; no IPC channel names, report-generation handlers, AI calls, Obsidian writes, or visible behavior were changed.
- Registered `verify:electron-ai-review-ipc-helpers-module` in `package.json` and added it to `verify:cleanup-core` immediately after `verify:electron-ai-review-ipc-module`.
- Current line counts after this pass:
  - `electron/aiReviewIpc.ts`: 569 lines
  - `electron/aiReviewIpcHelpers.ts`: 25 lines
- Fresh verification passed:
  - `npm run verify:electron-ai-review-ipc-helpers-module`
  - `npm run verify:electron-ai-review-ipc-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-08 - Phase 137 Electron AI Review IPC messages module split
- Continued the `electron/aiReviewIpc.ts` cleanup with a const-only extraction for labels/messages/errors after Phase 136's helper split.
- Added `scripts/verify-electron-ai-review-ipc-messages-module.ts` and confirmed TDD RED with `npm exec -- tsx scripts/verify-electron-ai-review-ipc-messages-module.ts`, which failed because `electron/aiReviewIpcMessages.ts` did not exist.
- Added `electron/aiReviewIpcMessages.ts` with 17 exported constants covering progress labels, weekly/monthly progress messages, common AI Review errors, report-template recognition error text, and template-file picker text.
- Updated `electron/aiReviewIpc.ts` to import the constants and removed the inline constant block; all IPC handlers and channel registrations remain in `aiReviewIpc.ts`.
- Registered `verify:electron-ai-review-ipc-messages-module` in `package.json` and added it to `verify:cleanup-core` after `verify:electron-ai-review-ipc-helpers-module`.
- During GREEN, the verifier needed one calibration because it assumed `PREPARE_MATERIALS_LABEL` appeared before `PICK_TEMPLATE_FILE_FILTER` in the import list; the corrected invariant is order-independent and checks every expected imported name.
- Current line counts after this pass:
  - `electron/aiReviewIpc.ts`: 570 lines
  - `electron/aiReviewIpcMessages.ts`: 17 lines
- Fresh verification passed:
  - `npm run verify:electron-ai-review-ipc-messages-module`
  - `npm run verify:electron-ai-review-ipc-module`
  - `npm run verify:electron-ai-review-ipc-helpers-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-08 - Phase 138 Electron AI Review IPC month-range reuse
- Continued the AI Review IPC helper consolidation by removing the last direct `monthRange` dependency from `electron/aiReviewIpc.ts`.
- Added `scripts/verify-electron-ai-review-ipc-month-range-reuse.ts` and confirmed TDD RED with `npm exec -- tsx scripts/verify-electron-ai-review-ipc-month-range-reuse.ts`; it failed because `aiReviewIpc.ts` still imported `monthRange` from `../shared/aiReview/monthly`.
- Updated the monthly report handler from `const { first, last } = monthRange(month)` to `const { first, last } = getMonthDates(month)`.
- Simplified the shared monthly import in `electron/aiReviewIpc.ts` to `buildMonthlyMessages` and `monthKey`; direct month-range expansion now belongs only to `electron/aiReviewIpcHelpers.ts`.
- Registered `verify:electron-ai-review-ipc-month-range-reuse` in `package.json` and added it to `verify:cleanup-core` after `verify:electron-ai-review-ipc-messages-module`.
- Current evidence in `electron/aiReviewIpc.ts`:
  - import line: `import { buildMonthlyMessages, monthKey } from '../shared/aiReview/monthly';`
  - monthly stats range: `const { first, last } = getMonthDates(month);`
  - external monthly date list still uses `const monthDates = getMonthDates(month);`
- Fresh verification passed:
  - `npm run verify:electron-ai-review-ipc-month-range-reuse`
  - `npm run verify:electron-ai-review-ipc-helpers-module`
  - `npm run verify:electron-ai-review-ipc-module`
  - `npm run typecheck`
  - `npm run build`
  - `npm run verify:cleanup-core`


## 2026-07-08 - Phase 139 Electron AI Review template/tools IPC module split
- Continued the `electron/aiReviewIpc.ts` cleanup by extracting the four lower-coupling template/tool handlers:
  - `aiReview:recognizeTemplate`
  - `aiReview:recognizeReportTemplate`
  - `aiReview:listModels`
  - `aiReview:pickTemplateFile`
- Added `scripts/verify-electron-ai-review-template-tools-ipc-module.ts` and confirmed TDD RED with `npm exec -- tsx scripts/verify-electron-ai-review-template-tools-ipc-module.ts`, which failed because `electron/aiReviewTemplateToolsIpc.ts` did not exist.
- Added `electron/aiReviewTemplateToolsIpc.ts` with:
  - `RegisterAiReviewTemplateToolsIpcHandlersOptions`
  - `registerAiReviewTemplateToolsIpcHandlers(...)`
- Moved template recognition, report-template recognition, model listing, and template-file picker wiring into the new module while preserving active-profile guards, raw-template validation, report target narrowing, model-list `auto` provider fallback, 20-second model-list timeout, `.md/.txt/.docx` picker extensions, documents fallback path, and DOCX parsing.
- Updated `electron/aiReviewIpc.ts` to import and call `registerAiReviewTemplateToolsIpcHandlers({ win, getAiReviewSettings, getReviewSections, getLlmCaller, getVaultPath, extractDocxText, zh })`.
- Refreshed `scripts/verify-electron-ai-review-ipc-module.ts` because it still expected template/tool internals to live in the parent AI Review IPC module; the stronger invariant is now that parent delegates and the child owns those four registrations.
- Refreshed `scripts/verify-electron-ai-review-ipc-messages-module.ts` because AI Review IPC message constants now have two consumers: `aiReviewIpc.ts` and `aiReviewTemplateToolsIpc.ts`.
- Registered `verify:electron-ai-review-template-tools-ipc-module` in `package.json` and added it to `verify:cleanup-core` after `verify:electron-ai-review-ipc-month-range-reuse`.
- Current line counts after this pass:
  - `electron/aiReviewIpc.ts`: 494 lines
  - `electron/aiReviewTemplateToolsIpc.ts`: 121 lines
- Fresh verification passed:
  - `npm run verify:electron-ai-review-template-tools-ipc-module`
  - `npm run verify:electron-ai-review-ipc-module`
  - `npm run verify:electron-ai-review-ipc-messages-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-08 - Phase 140 Electron AI Review source-materials IPC module split
- Continued the `electron/aiReviewIpc.ts` cleanup by extracting the read-only source-material test handler `aiReview:testSourceMaterials`.
- Added `scripts/verify-electron-ai-review-source-materials-ipc-module.ts` and confirmed TDD RED with `npm exec -- tsx scripts/verify-electron-ai-review-source-materials-ipc-module.ts`, which failed because `electron/aiReviewSourceMaterialsIpc.ts` did not exist.
- Added `electron/aiReviewSourceMaterialsIpc.ts` with:
  - `RegisterAiReviewSourceMaterialsIpcHandlersOptions`
  - `registerAiReviewSourceMaterialsIpcHandlers(...)`
- Moved the source-material test handler into the new module while preserving vault status failure shape, weekly `getWeekDates(selected)` expansion, `buildDailySourceRules(templateSettings.dailyPath)`, monthly `monthKey(selected)`, weekly-dir sanitization, monthly source mode, and `{ label, filePath }` response mapping.
- Updated `electron/aiReviewIpc.ts` to call `registerAiReviewSourceMaterialsIpcHandlers({ getVaultStatus, getAiReviewSettings, getObsidianTemplateSettings, getDateKey, buildDailySourceRules })` before registering template/tools IPC handlers.
- Refreshed `scripts/verify-electron-ai-review-ipc-module.ts` so `aiReview:testSourceMaterials` is owned by `electron/aiReviewSourceMaterialsIpc.ts` instead of inline in the parent.
- Registered `verify:electron-ai-review-source-materials-ipc-module` in `package.json` and added it to `verify:cleanup-core` after `verify:electron-ai-review-template-tools-ipc-module`.
- Current line counts after this pass:
  - `electron/aiReviewIpc.ts`: 473 lines
  - `electron/aiReviewSourceMaterialsIpc.ts`: 61 lines
- Fresh verification passed:
  - `npm run verify:electron-ai-review-source-materials-ipc-module`
  - `npm run verify:electron-ai-review-ipc-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-08 - Phase 141 Electron AI Review backfill IPC module split
- Continued the AI Review IPC modularization by extracting the `aiReview:backfill` handler from `electron/aiReviewIpc.ts`.
- Added `scripts/verify-electron-ai-review-backfill-ipc-module.ts` and confirmed TDD RED with `npm exec -- tsx scripts/verify-electron-ai-review-backfill-ipc-module.ts`, which failed because `electron/aiReviewBackfillIpc.ts` did not exist.
- Added `electron/aiReviewBackfillIpc.ts` with:
  - `RegisterAiReviewBackfillIpcHandlersOptions`
  - `registerAiReviewBackfillIpcHandlers(...)`
- Moved the backfill handler while preserving enabled/API-key guard behavior, empty disabled result shape, business-date calculation with rollover time, `settings.backfillDays` date derivation, daily file path resolution, `StatTask[]` cast, review section injection, AI-generated custom block filtering, LLM caller injection, and `fs.existsSync` file-existence checks.
- Updated `electron/aiReviewIpc.ts` to call `registerAiReviewBackfillIpcHandlers({ getAppSettings, getAiReviewSettings, getDailyFilePath, getReviewSections, getObsidianTemplateSettings, getLlmCaller })` before report-generation handlers.
- Refreshed `scripts/verify-electron-ai-review-ipc-module.ts` so `aiReview:backfill` is owned by `electron/aiReviewBackfillIpc.ts` instead of inline in the parent.
- Registered `verify:electron-ai-review-backfill-ipc-module` in `package.json` and added it to `verify:cleanup-core` after `verify:electron-ai-review-source-materials-ipc-module`.
- Current line counts after this pass:
  - `electron/aiReviewIpc.ts`: 461 lines
  - `electron/aiReviewBackfillIpc.ts`: 49 lines
- Fresh verification passed:
  - `npm run verify:electron-ai-review-backfill-ipc-module`
  - `npm run verify:electron-ai-review-ipc-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-08 - Phase 142 Electron AI Review external report IPC module split
- Continued the AI Review IPC modularization by extracting `aiReview:generateExternal` from `electron/aiReviewIpc.ts` into a focused external-report module.
- Added `scripts/verify-electron-ai-review-external-report-ipc-module.ts` and confirmed TDD RED with `npm exec -- tsx scripts/verify-electron-ai-review-external-report-ipc-module.ts`, which failed because `electron/aiReviewExternalReportIpc.ts` did not exist.
- Added `electron/aiReviewExternalReportIpc.ts` with:
  - `RegisterAiReviewExternalReportIpcHandlersOptions`
  - `registerAiReviewExternalReportIpcHandlers(...)`
- Moved the external report handler while preserving enabled/API-key guard behavior, vault guard behavior, weekly `getWeekDates(selected)` and `isoWeekKey(selected)`, monthly `monthKey(selected)` and `getMonthDates(month)`, manual-files source behavior, daily/monthly source collection, `NO_SOURCE_MATERIALS_ERROR.zh`, external output directory fallbacks, external prompt fallbacks, redacted `buildMonthlyMessages(...)` composition, zeroed external stats, and `generateExternalReport(...)` invocation.
- Updated `electron/aiReviewIpc.ts` to call `registerAiReviewExternalReportIpcHandlers({ getAiReviewSettings, getVaultStatus, getDateKey, getDailySourceRules, getLlmCaller })` before source-material and template/tool handlers.
- Registered `verify:electron-ai-review-external-report-ipc-module` in `package.json` and added it to `verify:cleanup-core` after `verify:electron-ai-review-backfill-ipc-module`.
- Refreshed `scripts/verify-electron-ai-review-ipc-module.ts` so `aiReview:generateExternal` is owned by `electron/aiReviewExternalReportIpc.ts` instead of inline in the parent.
- Refreshed `scripts/verify-electron-ai-review-ipc-messages-module.ts` so the message-constant consumer set includes `electron/aiReviewExternalReportIpc.ts` for `AI_REVIEW_DISABLED_ERROR`.
- Refreshed `scripts/verify-electron-ai-review-ipc-month-range-reuse.ts` so external monthly message/date-list wiring is checked in `electron/aiReviewExternalReportIpc.ts`, while the parent now imports only `monthKey` from the shared monthly helper.
- Current line counts after this pass:
  - `electron/aiReviewIpc.ts`: 389 lines
  - `electron/aiReviewExternalReportIpc.ts`: 116 lines
- Fresh verification passed:
  - `npm run verify:electron-ai-review-external-report-ipc-module`
  - `npm run verify:electron-ai-review-ipc-module`
  - `npm run verify:electron-ai-review-ipc-messages-module`
  - `npm run verify:electron-ai-review-ipc-month-range-reuse`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-08 - Phase 143 Electron AI Review weekly report IPC module split
- Continued the AI Review IPC modularization by extracting `aiReview:generateWeekly` from `electron/aiReviewIpc.ts` into a focused personal weekly-report module.
- Added `scripts/verify-electron-ai-review-weekly-report-ipc-module.ts` and confirmed TDD RED with `npm exec -- tsx scripts/verify-electron-ai-review-weekly-report-ipc-module.ts`, which failed because `electron/aiReviewWeeklyReportIpc.ts` did not exist.
- Added `electron/aiReviewWeeklyReportIpc.ts` with:
  - `RegisterAiReviewWeeklyReportIpcHandlersOptions`
  - `registerAiReviewWeeklyReportIpcHandlers(...)`
- Moved the weekly report handler while preserving prepare/request/write progress events, account-unavailable diagnostic shape, vault write-failed diagnostic shape, `getDateKey(date)`, `getWeekDates(selected)`, `settings.weeklySourceMode === 'manual-files'`, daily source collection through injected `getDailySourceRules()`, source-character progress messages, no-source-materials diagnostics, `computeRangeStats(tasks as StatTask[], monday, weekDates[6])`, `isoWeekKey(selected)`, weekly output directory fallback, weekly custom prompt selection, LLM invocation, provider/write diagnostic status, and truncated warning status.
- Updated `electron/aiReviewIpc.ts` to call `registerAiReviewWeeklyReportIpcHandlers({ getAiReviewSettings, getVaultStatus, getDateKey, getDailySourceRules, ensureReportLlmAvailable, emitAiReviewProgress, stage, createDiagnostic })` before the remaining monthly handler.
- Registered `verify:electron-ai-review-weekly-report-ipc-module` in `package.json` and added it to `verify:cleanup-core` after `verify:electron-ai-review-external-report-ipc-module`.
- Refreshed `scripts/verify-electron-ai-review-ipc-module.ts` so `aiReview:generateWeekly` is owned by `electron/aiReviewWeeklyReportIpc.ts` instead of inline in the parent.
- Refreshed `scripts/verify-electron-ai-review-ipc-helpers-module.ts` so AI Review helper consumption is checked across parent, external-report, and weekly-report IPC modules instead of requiring all helpers in one parent import.
- Refreshed `scripts/verify-electron-ai-review-ipc-messages-module.ts` so weekly progress message consumers include `electron/aiReviewWeeklyReportIpc.ts`.
- Current line counts after this pass:
  - `electron/aiReviewIpc.ts`: 290 lines
  - `electron/aiReviewWeeklyReportIpc.ts`: 195 lines
- Fresh verification passed:
  - `npm run verify:electron-ai-review-weekly-report-ipc-module`
  - `npm run verify:electron-ai-review-ipc-module`
  - `npm run verify:electron-ai-review-ipc-helpers-module`
  - `npm run verify:electron-ai-review-ipc-messages-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-08 - Phase 144 Electron AI Review monthly report IPC module split
- Continued the AI Review IPC modularization by extracting `aiReview:generateMonthly` from `electron/aiReviewIpc.ts` into a focused personal monthly-report module.
- Added `scripts/verify-electron-ai-review-monthly-report-ipc-module.ts` and confirmed TDD RED with `npm exec -- tsx scripts/verify-electron-ai-review-monthly-report-ipc-module.ts`, which failed because `electron/aiReviewMonthlyReportIpc.ts` did not exist.
- Added `electron/aiReviewMonthlyReportIpc.ts` with:
  - `RegisterAiReviewMonthlyReportIpcHandlersOptions`
  - `registerAiReviewMonthlyReportIpcHandlers(...)`
- Moved the monthly report handler while preserving prepare/request/write progress events, account-unavailable diagnostic shape, vault write-failed diagnostic shape, `monthKey(getDateKey(date))`, `getMonthDates(month)`, monthly source collection through injected `getDailySourceRules()`, source-character progress messages, no-source-materials diagnostics, `computeRangeStats(tasks as StatTask[], first, last)`, monthly output directory fallback, monthly custom prompt selection, LLM invocation, provider/write diagnostic status, and truncated warning status.
- Updated `electron/aiReviewIpc.ts` to call `registerAiReviewMonthlyReportIpcHandlers({ getAiReviewSettings, getVaultStatus, getDateKey, getDailySourceRules, ensureReportLlmAvailable, emitAiReviewProgress, stage, createDiagnostic })` after the weekly-report handler and before external-report registration.
- Registered `verify:electron-ai-review-monthly-report-ipc-module` in `package.json` and added it to `verify:cleanup-core` after the weekly-report verifier.
- Refreshed `scripts/verify-electron-ai-review-ipc-module.ts` so `aiReview:generateMonthly` is owned by `electron/aiReviewMonthlyReportIpc.ts` instead of inline in the parent.
- Refreshed `scripts/verify-electron-ai-review-ipc-helpers-module.ts` so helper consumption is checked across parent, external-report, weekly-report, and monthly-report IPC modules.
- Refreshed `scripts/verify-electron-ai-review-ipc-messages-module.ts` so monthly progress message consumers include `electron/aiReviewMonthlyReportIpc.ts` and the parent no longer has to import message constants.
- Refreshed `scripts/verify-electron-ai-review-ipc-month-range-reuse.ts` so the parent has no direct shared monthly import, while monthly-report and external-report modules both reuse `getMonthDates(month)` and avoid direct `monthRange`.
- Current line counts after this pass:
  - `electron/aiReviewIpc.ts`: 174 lines
  - `electron/aiReviewMonthlyReportIpc.ts`: 185 lines
- Fresh verification passed:
  - `npm run verify:electron-ai-review-monthly-report-ipc-module`
  - `npm run verify:electron-ai-review-ipc-module`
  - `npm run verify:electron-ai-review-ipc-helpers-module`
  - `npm run verify:electron-ai-review-ipc-messages-module`
  - `npm run verify:electron-ai-review-ipc-month-range-reuse`
  - `npm run verify:electron-ai-review-weekly-report-ipc-module`
  - `npm run verify:electron-ai-review-external-report-ipc-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`


## 2026-07-08 - Phase 145 Electron AI Review settings/sections IPC module split
- Continued the AI Review IPC modularization by extracting the low-risk settings and review-section handlers from `electron/aiReviewIpc.ts`.
- Added `scripts/verify-electron-ai-review-settings-sections-ipc-module.ts` and confirmed TDD RED with `npm exec -- tsx scripts/verify-electron-ai-review-settings-sections-ipc-module.ts`, which failed because `electron/aiReviewSettingsSectionsIpc.ts` did not exist.
- Added `electron/aiReviewSettingsSectionsIpc.ts` with:
  - `RegisterAiReviewSettingsSectionsIpcHandlersOptions`
  - `registerAiReviewSettingsSectionsIpcHandlers(...)`
- Moved these four handlers into the new module:
  - `aiReview:getSettings`
  - `aiReview:setSettings`
  - `aiReview:getSections`
  - `aiReview:setSections`
- Preserved behavior: settings getter returns `getAiReviewSettings()`, settings setter returns normalized `setAiReviewSettings(value)`, settings updates still call `scheduleAiTimers()`, sections getter returns `getReviewSections()`, and sections setter returns normalized `setReviewSections(value)`.
- Updated `electron/aiReviewIpc.ts` to delegate through `registerAiReviewSettingsSectionsIpcHandlers({ getAiReviewSettings, setAiReviewSettings, getReviewSections, setReviewSections, scheduleAiTimers })` while keeping `aiReview:runForDate` and `aiReview:inspectDaily` in the parent aggregator.
- Registered `verify:electron-ai-review-settings-sections-ipc-module` in `package.json` and added it to `verify:cleanup-core` after the monthly-report verifier.
- Refreshed `scripts/verify-electron-ai-review-ipc-module.ts` so settings/sections channel ownership points at `electron/aiReviewSettingsSectionsIpc.ts` instead of the parent.
- Calibrated the new verifier once because it initially treated delegated `scheduleAiTimers,` dependency passing as an inline `scheduleAiTimers()` call; the corrected invariant forbids only `scheduleAiTimers();` in the parent.
- Current line counts after this pass:
  - `electron/aiReviewIpc.ts`: 172 lines
  - `electron/aiReviewSettingsSectionsIpc.ts`: 28 lines
- Fresh verification passed:
  - `npm run verify:electron-ai-review-settings-sections-ipc-module`
  - `npm run verify:electron-ai-review-ipc-module`
  - `npm run verify:electron-ai-review-monthly-report-ipc-module`
  - `npm run verify:electron-ai-review-weekly-report-ipc-module`
  - `npm run verify:electron-ai-review-backfill-ipc-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-08 - Phase 146 Electron AI Review daily run/inspect IPC module split
- Continued the AI Review IPC modularization by extracting the final inline daily handlers from `electron/aiReviewIpc.ts`.
- Added `scripts/verify-electron-ai-review-daily-run-inspect-ipc-module.ts` and confirmed TDD RED with `npm exec -- tsx scripts/verify-electron-ai-review-daily-run-inspect-ipc-module.ts`, which failed because `electron/aiReviewDailyRunInspectIpc.ts` did not exist.
- Added `electron/aiReviewDailyRunInspectIpc.ts` with:
  - `RegisterAiReviewDailyRunInspectIpcHandlersOptions`
  - `registerAiReviewDailyRunInspectIpcHandlers(...)`
- Moved these two handlers into the new module:
  - `aiReview:runForDate`
  - `aiReview:inspectDaily`
- Preserved behavior: daily run uses `runReviewForDate(getDateKey(date), tasks, Boolean(force))`; daily inspection uses `inspectDailyAiContent(getDateKey(date))`.
- Updated `electron/aiReviewIpc.ts` to delegate through `registerAiReviewDailyRunInspectIpcHandlers({ getDateKey, runReviewForDate, inspectDailyAiContent })` and removed the final direct `ipcMain` import from the parent aggregator.
- Registered `verify:electron-ai-review-daily-run-inspect-ipc-module` in `package.json` and added it to `verify:cleanup-core` after `verify:electron-ai-review-settings-sections-ipc-module`.
- Refreshed `scripts/verify-electron-ai-review-ipc-module.ts` so daily run/inspect channel ownership points at `electron/aiReviewDailyRunInspectIpc.ts` instead of the parent.
- Current line counts after this pass:
  - `electron/aiReviewIpc.ts`: 176 lines
  - `electron/aiReviewDailyRunInspectIpc.ts`: 21 lines
- Fresh verification passed:
  - `npm run verify:electron-ai-review-daily-run-inspect-ipc-module`
  - `npm run verify:electron-ai-review-ipc-module`
  - `npm run verify:electron-ai-review-settings-sections-ipc-module`
  - `npm run verify:electron-ai-review-backfill-ipc-module`
  - `npm run verify:electron-ai-review-monthly-report-ipc-module`
  - `npm run verify:electron-ai-review-weekly-report-ipc-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-08 - Phase 147 Electron AI Review report IPC shared types module
- Continued AI Review IPC cleanup with a pure type-boundary pass for duplicated report IPC contracts.
- Added `scripts/verify-electron-ai-review-report-ipc-types-module.ts` and confirmed TDD RED with `npm exec -- tsx scripts/verify-electron-ai-review-report-ipc-types-module.ts`, which failed because `electron/aiReviewReportIpcTypes.ts` did not exist.
- Added `electron/aiReviewReportIpcTypes.ts` with shared exports:
  - `AiReviewReportLlmAvailableResult`
  - `AiReviewReportProgressEmitter`
  - `AiReviewReportStageFactory`
  - `AiReviewReportDiagnosticFactory`
- Replaced local duplicated LLM availability result/progress/stage/diagnostic type declarations in:
  - `electron/aiReviewIpc.ts`
  - `electron/aiReviewWeeklyReportIpc.ts`
  - `electron/aiReviewMonthlyReportIpc.ts`
- Registered `verify:electron-ai-review-report-ipc-types-module` in `package.json` and added it to `verify:cleanup-core` after `verify:electron-ai-review-daily-run-inspect-ipc-module`.
- Preserved runtime behavior by changing type declarations/imports only; report handler expressions, diagnostic construction, progress events, LLM calls, and report writing were unchanged.
- Fresh verification passed:
  - `npm run verify:electron-ai-review-report-ipc-types-module`
  - `npm run verify:electron-ai-review-ipc-module`
  - `npm run verify:electron-ai-review-weekly-report-ipc-module`
  - `npm run verify:electron-ai-review-monthly-report-ipc-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-08 - Phase 148 Electron AI Review IPC registration types module
- Continued AI Review IPC cleanup by extracting the large `RegisterAiReviewIpcHandlersOptions` dependency contract from the parent aggregator.
- Added `scripts/verify-electron-ai-review-ipc-registration-types-module.ts` and confirmed TDD RED with `npm exec -- tsx scripts/verify-electron-ai-review-ipc-registration-types-module.ts`, which failed because `electron/aiReviewIpcRegistrationTypes.ts` did not exist.
- Added `electron/aiReviewIpcRegistrationTypes.ts` with the full type-only registration surface for `registerAiReviewIpcHandlers(...)`, including window, settings, sections, daily run/inspect, vault/source, LLM, report diagnostics/progress, DOCX extraction, and localization dependencies.
- Updated `electron/aiReviewIpc.ts` so it imports only child registration functions plus `RegisterAiReviewIpcHandlersOptions`, making the file a thinner AI Review IPC composition shell.
- Registered `verify:electron-ai-review-ipc-registration-types-module` in `package.json` and added it to `verify:cleanup-core` after `verify:electron-ai-review-report-ipc-types-module`.
- Refreshed `scripts/verify-electron-ai-review-ipc-module.ts` so the aggregate IPC verifier checks the new registration type module rather than requiring the options type inline in the parent.
- `npm run verify:cleanup-core` initially failed at stale `verify-electron-shared-types-module.ts`, because it still expected `aiReviewIpc.ts` to import `sharedTypes`; refreshed it to check `aiReviewIpcRegistrationTypes.ts` for the registration-only `ElectronTask`, `InspectDailyResult`, and `VaultStatus` references.
- `npm run verify:cleanup-core` then failed at stale `verify-electron-ai-review-report-ipc-types-module.ts`, because it still expected `aiReviewIpc.ts` to import report IPC types; refreshed it to check `aiReviewIpcRegistrationTypes.ts` for the parent registration contract while keeping weekly/monthly direct checks.
- Fresh verification passed:
  - `npm run verify:electron-ai-review-ipc-registration-types-module`
  - `npm run verify:electron-ai-review-ipc-module`
  - `npm run typecheck`
  - `npm run verify:electron-shared-types-module`
  - `npm run verify:electron-ai-review-report-ipc-types-module`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-08 - Phase 149 Electron AI Review report IPC diagnostics helper
- Continued AI Review IPC cleanup by extracting duplicated report diagnostic decision logic from weekly/monthly report IPC modules.
- Added `scripts/verify-electron-ai-review-report-ipc-diagnostics-module.ts` and confirmed TDD RED with `npm exec -- tsx scripts/verify-electron-ai-review-report-ipc-diagnostics-module.ts`, which failed because `electron/aiReviewReportIpcDiagnostics.ts` did not exist.
- Added `electron/aiReviewReportIpcDiagnostics.ts` with:
  - `getReportFinalStatus(result, llmResult)` preserving the existing `completed` / `completedWithWarning` / `providerFailed` / `writeFailed` decision tree.
  - `getReportLlmResults(llmResult)` preserving the existing `llmResult ? [llmResult] : []` diagnostic array normalization.
- Updated `electron/aiReviewWeeklyReportIpc.ts` and `electron/aiReviewMonthlyReportIpc.ts` to call the shared diagnostics helpers when constructing final diagnostics.
- Registered `verify:electron-ai-review-report-ipc-diagnostics-module` in `package.json` and added it to `verify:cleanup-core` after `verify:electron-ai-review-ipc-registration-types-module`.
- Refreshed `scripts/verify-electron-ai-review-weekly-report-ipc-module.ts` and `scripts/verify-electron-ai-review-monthly-report-ipc-module.ts` so they require helper usage instead of duplicated final-status strings inline.
- Fresh verification passed:
  - `npm run verify:electron-ai-review-report-ipc-diagnostics-module`
  - `npm run verify:electron-ai-review-weekly-report-ipc-module`
  - `npm run verify:electron-ai-review-monthly-report-ipc-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-08 - Phase 150 Electron AI Review report IPC source summary helper
- Continued AI Review IPC cleanup by extracting duplicated source-character counting from weekly/monthly report IPC modules.
- Added `scripts/verify-electron-ai-review-report-ipc-source-summary-module.ts` and confirmed TDD RED with `npm exec -- tsx scripts/verify-electron-ai-review-report-ipc-source-summary-module.ts`, which failed because `electron/aiReviewReportIpcSourceSummary.ts` did not exist.
- Added `electron/aiReviewReportIpcSourceSummary.ts` with:
  - `AiReviewReportSourceContent`
  - `sumReportSourceChars(sources)` preserving the existing `sources.reduce((sum, source) => sum + source.content.length, 0)` behavior.
- Updated `electron/aiReviewWeeklyReportIpc.ts` and `electron/aiReviewMonthlyReportIpc.ts` to use `sumReportSourceChars(...)` for source-character totals before building progress messages and diagnostics.
- Registered `verify:electron-ai-review-report-ipc-source-summary-module` in `package.json` and added it to `verify:cleanup-core` after `verify:electron-ai-review-report-ipc-diagnostics-module`.
- Fresh verification passed:
  - `npm run verify:electron-ai-review-report-ipc-source-summary-module`
  - `npm run verify:electron-ai-review-weekly-report-ipc-module`
  - `npm run verify:electron-ai-review-monthly-report-ipc-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-08 - Phase 151 Electron AI Review report IPC LLM progress helper
- Continued AI Review IPC cleanup by extracting duplicated request-AI progress emission around weekly/monthly report provider calls.
- Added `scripts/verify-electron-ai-review-report-ipc-llm-progress-module.ts` and confirmed TDD RED with `npm exec -- tsx scripts/verify-electron-ai-review-report-ipc-llm-progress-module.ts`, which failed because `electron/aiReviewReportIpcLlmProgress.ts` did not exist.
- Added `electron/aiReviewReportIpcLlmProgress.ts` with:
  - `CallReportLlmWithProgressOptions`
  - `callReportLlmWithProgress(...)`
- Updated `electron/aiReviewWeeklyReportIpc.ts` and `electron/aiReviewMonthlyReportIpc.ts` so weekly/monthly request-AI progress and provider calls flow through the shared helper.
- Registered `verify:electron-ai-review-report-ipc-llm-progress-module` in `package.json` and added it to `verify:cleanup-core` after `verify:electron-ai-review-report-ipc-source-summary-module`.
- `npm run verify:electron-ai-review-weekly-report-ipc-module` initially failed at a stale expectation that request-AI running progress remain inline in the weekly module; refreshed both weekly and monthly report IPC verifiers to require helper usage plus report-specific message arguments instead.
- Restored `REQUEST_AI_LABEL` imports in weekly/monthly report IPC modules because those files still use the label in account-unavailable diagnostics even after provider-call progress moved to the helper.
- Current line counts after this pass:
  - `electron/aiReviewWeeklyReportIpc.ts`: 167 lines
  - `electron/aiReviewMonthlyReportIpc.ts`: 166 lines
  - `electron/aiReviewReportIpcLlmProgress.ts`: 33 lines
- Fresh verification passed:
  - `npm run verify:electron-ai-review-report-ipc-llm-progress-module`
  - `npm run verify:electron-ai-review-weekly-report-ipc-module`
  - `npm run verify:electron-ai-review-monthly-report-ipc-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-08 - Phase 152 Electron AI Review report IPC failure helper
- Continued AI Review IPC cleanup by extracting duplicated failed-result/diagnostic construction from weekly/monthly personal report IPC modules.
- Added `scripts/verify-electron-ai-review-report-ipc-failure-module.ts` plus fresh helper-usage assertions in:
  - `scripts/verify-electron-ai-review-weekly-report-ipc-module.ts`
  - `scripts/verify-electron-ai-review-monthly-report-ipc-module.ts`
- Confirmed TDD RED with:
  - `npm run verify:electron-ai-review-report-ipc-failure-module` failing because `electron/aiReviewReportIpcFailure.ts` did not exist.
  - `npm run verify:electron-ai-review-weekly-report-ipc-module` failing because the weekly report IPC module did not yet import/use the shared failure helper.
  - `npm run verify:electron-ai-review-monthly-report-ipc-module` failing because the monthly report IPC module did not yet import/use the shared failure helper.
- Added `electron/aiReviewReportIpcFailure.ts` with:
  - `AiReviewReportFailureFinalStatus`
  - `CreateReportFailureResultOptions`
  - `createReportFailureResult(...)`
- Updated `electron/aiReviewWeeklyReportIpc.ts` and `electron/aiReviewMonthlyReportIpc.ts` so these three early failure branches now use the shared helper:
  - account unavailable
  - vault/write failure
  - no source materials
- Preserved behavior:
  - failed return shape remains `{ ok: false, error, diagnostic }`
  - vault failures still normalize missing stages to `[]`
  - account-unavailable still carries the failed request-AI stage diagnostic
  - no-source-materials still preserves `sourceChars`
- Registered `verify:electron-ai-review-report-ipc-failure-module` in `package.json` and added it to `scripts/verify-cleanup-core.ts`.
- Current line counts after this pass:
  - `electron/aiReviewWeeklyReportIpc.ts`: 167 lines
  - `electron/aiReviewMonthlyReportIpc.ts`: 166 lines
  - `electron/aiReviewReportIpcFailure.ts`: 46 lines
- Fresh verification passed:
  - `npm run verify:electron-ai-review-report-ipc-failure-module`
  - `npm run verify:electron-ai-review-weekly-report-ipc-module`
  - `npm run verify:electron-ai-review-monthly-report-ipc-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-08 - Phase 153 Electron AI Review report IPC prepare-progress helper
- Continued AI Review IPC cleanup by extracting duplicated completed prepare-materials stage/progress construction from weekly/monthly personal report IPC modules.
- Added `scripts/verify-electron-ai-review-report-ipc-prepare-progress-module.ts` plus fresh helper-usage assertions in:
  - `scripts/verify-electron-ai-review-weekly-report-ipc-module.ts`
  - `scripts/verify-electron-ai-review-monthly-report-ipc-module.ts`
- Confirmed TDD RED with:
  - `npm run verify:electron-ai-review-report-ipc-prepare-progress-module` failing because `electron/aiReviewReportIpcPrepareProgress.ts` did not exist.
  - `npm run verify:electron-ai-review-weekly-report-ipc-module` failing because the weekly report IPC module did not yet import/use the shared prepare-progress helper.
  - `npm run verify:electron-ai-review-monthly-report-ipc-module` failing because the monthly report IPC module did not yet import/use the shared prepare-progress helper.
- Added `electron/aiReviewReportIpcPrepareProgress.ts` with:
  - `CompleteReportPrepareMaterialsOptions`
  - `completeReportPrepareMaterials(...)`
- Updated `electron/aiReviewWeeklyReportIpc.ts` and `electron/aiReviewMonthlyReportIpc.ts` so these duplicated prepare-materials completion steps now use the shared helper:
  - source-character message derivation
  - completed prepare-materials stage construction
  - completed prepare-materials progress emission
- Preserved behavior:
  - `buildSourceCharsMessage(sourceChars)` text remains unchanged
  - completed stage duration still uses `Date.now() - prepareStartedAt`
  - returned stage array shape remains unchanged
- Registered `verify:electron-ai-review-report-ipc-prepare-progress-module` in `package.json` and added it to `scripts/verify-cleanup-core.ts`.
- `npm run verify:electron-ai-review-ipc-helpers-module` initially failed because it still expected weekly/monthly to import `buildSourceCharsMessage` directly from `aiReviewIpcHelpers.ts`; refreshed that verifier so the direct consumer is now `electron/aiReviewReportIpcPrepareProgress.ts` while weekly/monthly keep date-helper imports only.
- Current line counts after this pass:
  - `electron/aiReviewWeeklyReportIpc.ts`: 166 lines
  - `electron/aiReviewMonthlyReportIpc.ts`: 165 lines
  - `electron/aiReviewReportIpcFailure.ts`: 46 lines
  - `electron/aiReviewReportIpcCompletion.ts`: 59 lines
  - `electron/aiReviewReportIpcPrepareProgress.ts`: 33 lines
- Fresh verification passed:
  - `npm run verify:electron-ai-review-ipc-helpers-module`
  - `npm run verify:electron-ai-review-report-ipc-prepare-progress-module`
  - `npm run verify:electron-ai-review-weekly-report-ipc-module`
  - `npm run verify:electron-ai-review-monthly-report-ipc-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-08 - Phase 154 Electron AI Review report IPC preflight helper
- Continued AI Review IPC cleanup by extracting duplicated weekly/monthly report preflight logic from personal report IPC modules.
- Added `scripts/verify-electron-ai-review-report-ipc-preflight-module.ts` plus fresh preflight-boundary assertions in:
  - `scripts/verify-electron-ai-review-weekly-report-ipc-module.ts`
  - `scripts/verify-electron-ai-review-monthly-report-ipc-module.ts`
- Confirmed TDD RED with:
  - `npm run verify:electron-ai-review-report-ipc-preflight-module` failing because `electron/aiReviewReportIpcPreflight.ts` did not exist.
  - `npm run verify:electron-ai-review-weekly-report-ipc-module` failing because the weekly report IPC module did not yet import/use the shared preflight helper.
  - `npm run verify:electron-ai-review-monthly-report-ipc-module` failing because the monthly report IPC module did not yet import/use the shared preflight helper.
- Added `electron/aiReviewReportIpcPreflight.ts` with:
  - `StartReportPreflightOptions`
  - `startReportPreflight(...)`
- Updated `electron/aiReviewWeeklyReportIpc.ts` and `electron/aiReviewMonthlyReportIpc.ts` so these duplicated preflight steps now use the shared helper:
  - `startedAt = Date.now()`
  - prepare-materials running progress
  - `ensureReportLlmAvailable(...)`
  - account-unavailable failed request-AI progress/result
  - `getVaultStatus()`
  - vault/write-failed failed write-Obsidian progress/result
- Preserved behavior:
  - successful preflight still returns `{ startedAt, settings, llm, vaultPath }`
  - account-unavailable still carries the failed request-AI stage diagnostic
  - vault failures still normalize stages to `[]`
  - weekly/monthly still keep their no-source-materials failure branch inline
- Registered `verify:electron-ai-review-report-ipc-preflight-module` in `package.json` and added it to `scripts/verify-cleanup-core.ts`.
- `npm run verify:electron-ai-review-weekly-report-ipc-module` and `npm run verify:electron-ai-review-monthly-report-ipc-module` initially failed because they still expected all three early failure branches to remain inline after the preflight extraction; refreshed both verifiers to require one inline `createReportFailureResult(...)` call (no-source-materials only) while shifting the account/vault early-failure ownership to the preflight helper.
- Refreshed `scripts/verify-electron-ai-review-report-ipc-failure-module.ts` so it now checks:
  - preflight helper owns 2 early failure-helper calls (account unavailable + write failed)
  - weekly/monthly each keep 1 early failure-helper call (no source materials)
- Current line counts after this pass:
  - `electron/aiReviewWeeklyReportIpc.ts`: 152 lines
  - `electron/aiReviewMonthlyReportIpc.ts`: 151 lines
  - `electron/aiReviewReportIpcPreflight.ts`: 87 lines
- Fresh verification passed:
  - `npm run verify:electron-ai-review-report-ipc-preflight-module`
  - `npm run verify:electron-ai-review-report-ipc-failure-module`
  - `npm run verify:electron-ai-review-weekly-report-ipc-module`
  - `npm run verify:electron-ai-review-monthly-report-ipc-module`
  - `npm run typecheck`
  - `npm run verify:cleanup-core`
  - `npm run build`

## 2026-07-08 - Phase 155 Electron AI Review report IPC no-source failure helper
- Continued AI Review IPC cleanup by extracting the shared no-source-materials failure path from weekly/monthly personal report IPC modules.
- Added `scripts/verify-electron-ai-review-report-ipc-no-source-failure-module.ts` and registered `verify:electron-ai-review-report-ipc-no-source-failure-module`.
- Added `electron/aiReviewReportIpcNoSourceFailure.ts` with:
  - `FailReportForNoSourceMaterialsOptions`
  - `failReportForNoSourceMaterials(...)`
- Updated `electron/aiReviewWeeklyReportIpc.ts` and `electron/aiReviewMonthlyReportIpc.ts` so no-source-materials failures now share:
  - failed prepare-materials progress emission
  - `noSourceMaterials` failure-result construction
- Refreshed stale verifiers so ownership moved from weekly/monthly to the new helper:
  - `scripts/verify-electron-ai-review-weekly-report-ipc-module.ts`
  - `scripts/verify-electron-ai-review-monthly-report-ipc-module.ts`
  - `scripts/verify-electron-ai-review-report-ipc-failure-module.ts`
  - `scripts/verify-electron-ai-review-ipc-messages-module.ts`
- Fresh verification passed:
  - `npm run verify:electron-ai-review-report-ipc-no-source-failure-module`
  - `npm run verify:electron-ai-review-weekly-report-ipc-module`
  - `npm run verify:electron-ai-review-monthly-report-ipc-module`
  - `npm run verify:electron-ai-review-report-ipc-failure-module`
  - `npm run verify:electron-ai-review-ipc-messages-module`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-08 - Phase 156 Electron AI Review report IPC execution helper
- Continued AI Review IPC cleanup by extracting the shared weekly/monthly execution tail from personal report IPC modules.
- Added `scripts/verify-electron-ai-review-report-ipc-execution-module.ts` and registered `verify:electron-ai-review-report-ipc-execution-module`.
- Added `electron/aiReviewReportIpcExecution.ts` with:
  - `ExecuteReportGenerationOptions`
  - `executeReportGeneration(...)`
- Updated `electron/aiReviewWeeklyReportIpc.ts` and `electron/aiReviewMonthlyReportIpc.ts` so shared execution now owns:
  - delayed `llmResult` capture
  - `callReportLlmWithProgress(...)`
  - `finalizeReportResult(...)`
- `npm run verify:cleanup-core` later exposed one stale diagnostics verifier that still expected weekly/monthly to import the completion helper directly; calibrated it to the new `execution -> completion -> diagnostics` boundary in `scripts/verify-electron-ai-review-report-ipc-diagnostics-module.ts`.
- Fresh verification passed:
  - `npm run verify:electron-ai-review-report-ipc-execution-module`
  - `npm run verify:electron-ai-review-weekly-report-ipc-module`
  - `npm run verify:electron-ai-review-monthly-report-ipc-module`
  - `npm run verify:electron-ai-review-report-ipc-completion-module`
  - `npm run verify:electron-ai-review-report-ipc-llm-progress-module`
  - `npm run verify:electron-ai-review-report-ipc-diagnostics-module`
  - `npm run verify:cleanup-core`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-08 - Phase 157 Electron AI Review report IPC source preparation helper
- Continued AI Review IPC cleanup by extracting the shared source-preparation orchestration from weekly/monthly personal report IPC modules.
- Added `scripts/verify-electron-ai-review-report-ipc-source-preparation-module.ts` and registered `verify:electron-ai-review-report-ipc-source-preparation-module`.
- Added `electron/aiReviewReportIpcSourcePreparation.ts` with:
  - `PrepareReportSourcesOptions`
  - `prepareReportSources(...)`
- Updated `electron/aiReviewWeeklyReportIpc.ts` and `electron/aiReviewMonthlyReportIpc.ts` so shared source preparation now owns:
  - source-character summarization
  - completed prepare-materials progress/stage assembly
  - no-source-materials failure return path
- Refreshed stale verifiers so the old direct helper ownership moved from weekly/monthly into the new source-preparation helper:
  - `scripts/verify-electron-ai-review-weekly-report-ipc-module.ts`
  - `scripts/verify-electron-ai-review-monthly-report-ipc-module.ts`
  - `scripts/verify-electron-ai-review-report-ipc-source-summary-module.ts`
  - `scripts/verify-electron-ai-review-report-ipc-prepare-progress-module.ts`
  - `scripts/verify-electron-ai-review-report-ipc-no-source-failure-module.ts`
- Current line counts after this pass:
  - `electron/aiReviewWeeklyReportIpc.ts`: 121 lines
  - `electron/aiReviewMonthlyReportIpc.ts`: 120 lines
  - `electron/aiReviewReportIpcSourcePreparation.ts`: 65 lines
- Fresh verification passed:
  - `npm run verify:electron-ai-review-report-ipc-source-preparation-module`
  - `npm run verify:electron-ai-review-weekly-report-ipc-module`
  - `npm run verify:electron-ai-review-monthly-report-ipc-module`
  - `npm run verify:electron-ai-review-report-ipc-source-summary-module`
  - `npm run verify:electron-ai-review-report-ipc-prepare-progress-module`
  - `npm run verify:electron-ai-review-report-ipc-no-source-failure-module`
  - `npm run verify:electron-ai-review-report-ipc-failure-module`
  - `npm run verify:electron-ai-review-ipc-helpers-module`
  - `npm run verify:electron-ai-review-ipc-messages-module`
  - `npm run verify:cleanup-core`
  - `npm run typecheck`
  - `npm run build`


## 2026-07-08 - Phase 158 Electron AI Review report IPC source collection orchestration
- Continued AI Review IPC cleanup by extracting the remaining weekly/monthly source-collection orchestration from personal report IPC modules.
- Added `scripts/verify-electron-ai-review-report-ipc-source-collection-module.ts` and registered `verify:electron-ai-review-report-ipc-source-collection-module`.
- Added `electron/aiReviewReportIpcSourceCollection.ts` with:
  - `collectPreparedReportSources(...)`
  - `collectWeeklyReportSources(...)`
  - `collectMonthlyReportSources(...)`
- Updated `electron/aiReviewWeeklyReportIpc.ts` and `electron/aiReviewMonthlyReportIpc.ts` so the new helper now owns:
  - `prepareStartedAt` timing for source collection
  - weekly selected-date normalization and week-date expansion
  - monthly month-key normalization and month-range expansion
  - range-specific source collector invocation and source-shape mapping
- Preserved behavior:
  - weekly `manual-files` still short-circuits to `[]`
  - weekly still returns `selected`, `monday`, and `weekDates`
  - monthly still returns `month`, `first`, and `last`
  - source preparation / stats / execution boundaries remain unchanged
- `npm run verify:electron-ai-review-ipc-month-range-reuse` initially failed because it still expected personal monthly `monthKey/getMonthDates(...)` ownership inside `electron/aiReviewMonthlyReportIpc.ts`; refreshed that verifier so it now checks the new `monthly report IPC -> source-collection helper -> aiReviewIpcHelpers/shared monthly helpers` boundary.
- Current line counts after this pass:
  - `electron/aiReviewWeeklyReportIpc.ts`: 116 lines
  - `electron/aiReviewMonthlyReportIpc.ts`: 116 lines
  - `electron/aiReviewReportIpcSourceCollection.ts`: 118 lines
- Fresh verification passed:
  - `npm run verify:electron-ai-review-report-ipc-source-collection-module`
  - `npm run verify:electron-ai-review-weekly-report-ipc-module`
  - `npm run verify:electron-ai-review-monthly-report-ipc-module`
  - `npm run verify:electron-ai-review-report-ipc-source-preparation-module`
  - `npm run verify:electron-ai-review-ipc-month-range-reuse`
  - `npm run verify:cleanup-core`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-08 - Phase 159 AI Review export reports shared LLM-backed helper
- Switched to a faster batch mode and took a low-risk refactor inside `electron/aiReview/exportReports.ts` instead of pausing on a heavier IPC-boundary extraction.
- Updated `scripts/verify-export-reports.ts` so it now requires a shared `generateLlmBackedReport(...)` orchestration helper and shared delegation from weekly/monthly/external export paths.
- Confirmed RED with `npm run verify:export-reports` failing because the shared helper did not yet exist.
- Added these shared helpers in `electron/aiReview/exportReports.ts`:
  - `generateLlmBackedReport(...)`
  - `resolveReportFilePath(...)`
  - `buildPersonalReportFrontmatter(...)`
  - `buildExternalReportFrontmatter(...)`
- Updated `generatePersonalWeekly(...)`, `generatePersonalMonthly(...)`, and `generateExternalReport(...)` so they now share the common LLM-call + write-report flow instead of duplicating it.
- Preserved behavior:
  - weekly still writes to `logs/weekly-review` by default
  - monthly still writes to `logs/monthly-review` by default
  - external still writes to `exports/weekly-reports` / `exports/monthly-reports` by default
  - `relativeDir` overrides still work
  - LLM failures still return `{ ok: false }` without writing output files
  - redact-before-LLM for external reports remains unchanged
- Fresh verification passed:
  - `npm run verify:export-reports`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-08 - Phase 160 appSettings legacy monthly path migration helper cleanup
- Continued the faster batch mode with a single-file refactor in `shared/appSettings.ts`.
- Added focused runtime assertions to `scripts/verify-settings-sync.ts` for legacy monthly path migration:
  - `monthlyDir -> monthlyPath`
  - `externalMonthlyDir -> externalMonthlyPath`
- Confirmed RED with `npm run verify:settings-sync` failing because legacy monthly directory migration incorrectly produced `{{year}}-W{{week}}.md`.
- Updated `shared/appSettings.ts`:
  - added `readStringSetting(...)`
  - added `resolveStoredPath(...)`
  - added `resolveStoredReportPath(...)`
  - fixed `migrateReportDir(...)` so `monthly` now appends `{{year}}-{{month}}.md` while `weekly` still appends `{{year}}-W{{week}}.md`
- Preserved behavior:
  - explicit modern path keys still override legacy keys
  - `dailyNotePath` legacy fallback still works
  - weekly and external weekly migration behavior remains unchanged
- Fresh verification passed:
  - `npm run verify:settings-sync`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-08 - Phase 161 AI Review sectionConfig custom-block fallback cleanup
- Continued the faster batch mode with another single-file refactor in `shared/aiReview/sectionConfig.ts`.
- Added focused runtime assertions to `scripts/verify-section-config.ts` for later custom-block fallback behavior in both:
  - `normalizeDailyTemplate(...)`
  - `normalizeReportTemplate(...)`
- Confirmed RED with `npm run verify:section-config` failing because later custom blocks incorrectly reused the first default block for fallback fields like `name`.
- Updated `shared/aiReview/sectionConfig.ts`:
  - added `normalizeTemplateCustomBlocks(...)`
  - changed `normalizeCustomBlock(...)` to accept an explicit fallback block instead of always reading the first default custom block
  - reused the same custom-block list normalization path for both daily and report templates
- Preserved behavior:
  - missing/empty custom-block arrays still fall back to defaults
  - explicit block ids still win
  - invalid render types still fall back to `'text'`
  - missing ids still generate new UUIDs
- Fresh verification passed:
  - `npm run verify:section-config`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-08 - Phase 162 AI Review settings empty-profile normalization consistency
- Continued the faster batch mode with a single-file consistency fix in `shared/aiReview/aiReviewSettings.ts`.
- Added focused runtime assertions to `scripts/verify-ai-settings.ts` to ensure `normalizeAiReviewSettings(createDefaultAiReviewSettings())` preserves the new-format empty `profiles` state.
- Confirmed RED with `npm run verify:ai-settings` failing because fresh default AI Review settings were incorrectly normalized into one generated profile.
- Root cause: `normalizeAiReviewSettings(...)` treated any empty `profiles` array the same as legacy data with no `profiles` field, so it always ran the old single-account migration path.
- Updated `shared/aiReview/aiReviewSettings.ts`:
  - added `hasStoredProfiles` ownership detection
  - preserved explicit `profiles: []` as the new-format empty state
  - kept legacy no-`profiles` payloads migrating into one generated default profile
- Preserved behavior:
  - legacy single-account settings still migrate automatically
  - explicit populated `profiles` arrays still normalize each profile and repair invalid `activeProfileId`
  - explicit empty `profiles` now stay empty and keep `activeProfileId` blank
- Fresh verification passed:
  - `npm run verify:ai-settings`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-08 - Phase 163 AI Review sectionConfig blank custom-block name fallback
- Continued the faster batch mode with a tiny follow-up fix in `shared/aiReview/sectionConfig.ts`.
- Tightened the existing `scripts/verify-section-config.ts` fallback assertion so it now checks that blank stored custom-block names also fall back to the same-position default block name.
- Confirmed RED with `npm run verify:section-config` failing because `'   '` was treated as a valid custom-block name instead of falling back to the default label.
- Updated `normalizeCustomBlock(...)` so `name` now falls back when the stored string is blank after trimming, while leaving `prompt` empty-string behavior unchanged.
- Preserved behavior:
  - explicit non-blank custom names still win
  - per-index fallback semantics from Phase 161 remain intact
  - UUID generation and render-type normalization remain unchanged
- Fresh verification passed:
  - `npm run verify:section-config`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-08 - Phase 164 AI Review settings malformed profiles fallback consistency
- Continued the faster batch mode with a narrow follow-up fix in `shared/aiReview/aiReviewSettings.ts`.
- Added focused runtime assertions to `scripts/verify-ai-settings.ts` for malformed non-array `profiles` payloads mixed with legacy top-level provider credentials.
- Confirmed RED with `npm run verify:ai-settings` failing because malformed `profiles` values were treated like explicit new-format empty data, which discarded legacy top-level credentials instead of migrating them into a generated default profile.
- Updated `shared/aiReview/aiReviewSettings.ts`:
  - refined the branch condition so only real profile arrays use the new-format normalization path
  - preserved malformed or missing `profiles` values for the legacy single-account migration path
  - tightened the local type narrowing while repairing the temporary TypeScript regression introduced during the fix
- Preserved behavior:
  - explicit `profiles: []` still stays empty
  - valid profile arrays still normalize in place
  - malformed `profiles` values now fall back to legacy migration instead of losing credentials
- Fresh verification passed:
  - `npm run verify:ai-settings`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-08 - Phase 165 Obsidian retained review archived-only merge consistency
- Continued the faster batch mode with a small correctness fix in `shared/obsidianReviewRetention.ts`.
- Tightened `scripts/verify-settings-sync.ts` with a focused retained-review scenario where:
  - the task no longer exists in the local task tree
  - two different retained reviews exist for the same archived task id
  - each retained entry carries a different archived task snapshot
- Confirmed RED with `npm run verify:settings-sync` failing because archived-only merge collapsed the result to only the later review.
- Root cause: `mergeRetainedReviewsForObsidian(...)` only merged against the live task tree and ignored any same-id task already accumulated in the local `archivedOnly` map during the current merge pass.
- Updated `shared/obsidianReviewRetention.ts` so the merge base now prefers:
  - current live task from `nextTasks`
  - then already-accumulated archived-only task from `archivedOnly`
  - then the incoming archived snapshot
- Preserved behavior:
  - live tasks still update in place
  - retained review identity dedupe still works
  - sorted review order still determines the final `completionReview`
- Fresh verification passed:
  - `npm run verify:settings-sync`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-08 - Phase 166 Obsidian template absolute Windows path rejection
- Continued the faster batch mode with a narrow path-safety fix in `shared/obsidianTemplates.ts`.
- Added focused runtime assertions to `scripts/verify-settings-sync.ts` so absolute Windows template paths like `C:/secret/report.md` must be rejected instead of being rewritten into a misleading relative vault path.
- Confirmed RED with `npm run verify:settings-sync` failing because `resolveTemplatePath(...)` sanitized the `:` first, which masked the path as relative.
- Updated `shared/obsidianTemplates.ts` so `resolveTemplatePath(...)` now:
  - checks the raw rendered template path for absoluteness first
  - then applies invalid filename character sanitization only for still-relative paths
- Preserved behavior:
  - relative paths still sanitize invalid filename characters
  - vault-escape checks after `path.resolve(...)` remain unchanged
- Fresh verification passed:
  - `npm run verify:settings-sync`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-08 - Phase 167 task rollover latest review ordering robustness
- Continued the faster batch mode with a small correctness fix in `shared/taskRollover.ts`.
- Added focused runtime assertions to `scripts/verify-settings-sync.ts` for completed tasks whose `completionReviews` array is out of chronological order.
- Confirmed RED with `npm run verify:settings-sync` failing because `getLatestCompletionPercent(...)` used the last array element instead of the review with the latest `reviewedAt`, which made rollover carry forward a task that the newest review had already completed.
- Updated `shared/taskRollover.ts` so latest completion percent is now selected from the review with the greatest `reviewedAt` value.
- Preserved behavior:
  - incomplete tasks still carry forward
  - single-review tasks behave the same
  - `completionReview` fallback still works when no review array exists
- Fresh verification passed:
  - `npm run verify:settings-sync`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-08 - Phase 168 AI Review sectionConfig blank custom-block id fallback
- Continued the faster batch mode with another tiny correctness fix in `shared/aiReview/sectionConfig.ts`.
- Added focused runtime assertions to `scripts/verify-section-config.ts` for whitespace-only and empty custom-block ids in both daily and report template normalization.
- Confirmed RED with `npm run verify:section-config` failing because blank string ids were preserved instead of being replaced with generated ids.
- Updated `normalizeCustomBlock(...)` so `id` now falls back to a generated UUID when the stored string is blank after trimming.
- Preserved behavior:
  - explicit non-blank ids still win
  - name fallback semantics remain unchanged
  - render-type normalization stays the same
- Fresh verification passed:
  - `npm run verify:section-config`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-08 - Phase 169 task review mutations legacy empty-array fallback consistency
- Continued the faster batch mode with a small correctness fix in `src/hooks/taskReviewMutations.ts`.
- Added focused runtime assertions to `scripts/verify-task-mutations.ts` for tasks that still have:
  - a legacy single `completionReview`
  - an explicit empty `completionReviews: []`
- Confirmed RED with `npm run verify:task-mutations` failing because task review mutation helpers treated the empty array as authoritative and ignored the legacy review fallback.
- Root cause: `appendCompletionReviewToTask(...)`, `deleteReviewFromTask(...)`, and `findTaskReview(...)` used `task.completionReviews || ...`, while the rest of the codebase already treats only non-empty review arrays as authoritative.
- Updated `src/hooks/taskReviewMutations.ts`:
  - added `getExistingTaskReviews(...)`
  - reused that helper for append / delete / update / find flows so they now share one length-based fallback rule
- Preserved behavior:
  - explicit non-empty `completionReviews` arrays still win
  - legacy single-review tasks still work
  - append now preserves the legacy review before adding a new one
  - delete/find no longer lose the legacy review when an empty array is present
- Fresh verification passed:
  - `npm run verify:task-mutations`
  - `npm run verify:delete-review`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-08 - Phase 170 task normalization latest review ordering consistency
- Continued the faster batch mode with another small correctness fix in `src/hooks/taskTransforms.ts`.
- Added focused runtime assertions to `scripts/verify-task-hook-state.ts` for incoming tasks whose `completionReviews` array is out of order by `reviewedAt`.
- Confirmed RED with `npm run verify:task-hook-state` failing because `normalizeIncomingTasks(...)` preserved the array but incorrectly chose the last element as `completionReview`.
- Root cause: `normalizeTask(...)` already used length-based fallback to choose between `completionReviews` and legacy `completionReview`, but it still derived the canonical single `completionReview` with `completionReviews[completionReviews.length - 1]`.
- Updated `src/hooks/taskTransforms.ts`:
  - added `getLatestCompletionReview(...)`
  - reused that helper when normalizing the single canonical `completionReview`
- Preserved behavior:
  - task date fallback still works
  - explicit non-empty `completionReviews` arrays still win over legacy fallback
  - array order stays untouched
  - normalized tasks now expose the true latest review by `reviewedAt`
- Fresh verification passed:
  - `npm run verify:task-hook-state`
  - `npm run verify:task-carryover`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-08 - Phase 171 task review mutations latest review ordering consistency
- Continued the faster batch mode with a follow-up correctness fix in `src/hooks/taskReviewMutations.ts`.
- Added focused runtime assertions to `scripts/verify-task-mutations.ts` for out-of-order review arrays where:
  - editing an older review should not change which review is considered latest
  - deleting an older non-latest review should still preserve the newest review as `completionReview`
- Confirmed RED with `npm run verify:task-mutations` failing because mutation helpers still reset `completionReview` to the last array element after update/delete.
- Root cause: after the Phase 169 fallback cleanup, post-mutation latest-review selection still used positional array semantics instead of chronological `reviewedAt` semantics.
- Updated `src/hooks/taskReviewMutations.ts`:
  - added `getLatestTaskReview(...)`
  - reused it in `deleteReviewFromTask(...)` and `updateTaskReview(...)`
- Preserved behavior:
  - explicit review-array order is still preserved
  - legacy single-review fallback still works
  - deletion of the final review still clears review state as before
  - update/delete now keep `completionReview` aligned with the newest review by `reviewedAt`
- Fresh verification passed:
  - `npm run verify:task-mutations`
  - `npm run verify:delete-review`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-08 - Phase 172 shared completion review chronological ordering consistency
- Continued the faster batch mode with a small shared-helper consistency fix in `shared/completionReviews.ts`.
- Started from `scripts/verify-review-empty-fields.ts`, but first had to calibrate stale expectations because the focused verifier still asserted an older completion-review template copy (`今天情况` / full-width punctuation) instead of the current output (`完成情况`, `卡点/未知`, ASCII colon).
- After verifier calibration, added focused runtime assertions for:
  - out-of-order `completionReviews` arrays
  - chronological ordering in `buildTaskLines(...)`
  - `TaskReviewDialog.tsx` reusing the shared completion-review helper instead of duplicating unsorted fallback logic
- Confirmed RED with `npm run verify:review-fields` failing because `getCompletionReviews(...)` returned the persisted array order unchanged.
- Root cause: the shared helper unified array-vs-legacy fallback, but it never imposed a chronology rule, so downstream consumers inherited whichever order happened to be persisted.
- Updated `shared/completionReviews.ts` so it now returns a sorted copy by ascending `reviewedAt`.
- Updated `src/components/TaskReviewDialog.tsx` to import and use `getCompletionReviews(task)` after the existing null-task guard.
- Preserved behavior:
  - non-empty `completionReviews` arrays still win over legacy fallback
  - legacy single-review tasks still return one review
  - stored array order is not mutated in task state
  - downstream render/export callers now see a stable chronological review order
- Fresh verification passed:
  - `npm run verify:review-fields`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-08 - Phase 173 Obsidian sync preview cross-date review task counting
- Continued the faster batch mode with a selected-date preview correctness fix in `shared/obsidianTemplates.ts`.
- Reproduced the bug with a real runtime check before patching:
  - `buildSyncPreview(...)` returned `taskCount: 0`
  - but `buildDailyNoteContent(...)` for the same input rendered one task into the selected daily note because that task had a completion review on the selected date.
- Added focused runtime assertions to `scripts/verify-settings-sync.ts` for this cross-date review scenario.
- Confirmed RED with `npm run verify:settings-sync` failing because preview counting only looked at `taskDate === selectedDate`.
- Root cause: `buildTaskLines(...)` and `buildSyncPreview(...)` had diverged visibility rules:
  - note rendering already included tasks whose reviews land on the selected date
  - preview counting only considered taskDate
- Updated `shared/obsidianTemplates.ts`:
  - added shared `taskAppliesToDate(task, date)`
  - reused it in `buildTaskLines(...)`
  - reused it in `buildSyncPreview(...).taskCount`
- Preserved behavior:
  - task sorting/rendering is unchanged
  - preview task count now matches actual note inclusion semantics
  - subtasks still follow the same flattened counting behavior as before, but now with the same visibility rule as the note renderer
- Fresh verification passed:
  - `npm run verify:settings-sync`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-08 - Phase 174 Obsidian sync preview visible completion record counting
- Continued the faster batch mode with another narrow preview-vs-render consistency fix in `shared/obsidianTemplates.ts`.
- Reproduced the bug with a real runtime check before patching:
  - `buildSyncPreview(...)` returned `completionRecordCount: 1`
  - but `buildDailyNoteContent(...)` for the same input rendered neither the task nor its review because both belonged only to the previous date
- Added focused runtime assertions to `scripts/verify-settings-sync.ts` for this hidden old-review scenario.
- Confirmed RED with `npm run verify:settings-sync` failing because preview completion-record counting summed all stored reviews without applying the selected-date visibility rules already used by the note renderer.
- Root cause: `buildTaskLines(...)` already had per-date review visibility logic, but `countCompletionRecords(...)` ignored date entirely and counted every flattened review in the task tree.
- Updated `shared/obsidianTemplates.ts`:
  - added shared `getVisibleCompletionReviews(task, date)`
  - reused it in `buildTaskLines(...)`
  - reused it in `countCompletionRecords(tasks, date)`
- Preserved behavior:
  - same-day tasks still count all of their reviews
  - cross-date review-only tasks still count only reviews that land on the selected date
  - off-date reviews that would not render into the note no longer inflate preview counts
- Fresh verification passed:
  - `npm run verify:settings-sync`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-08 - Phase 175 Obsidian sync preview visible deleted review detection
- Continued the faster batch mode with a second adjacent preview-vs-render consistency fix in `shared/obsidianTemplates.ts`.
- Reproduced the bug with a real runtime check before patching:
  - `buildSyncPreview(...)` returned `deletedReviewWillDisappear: true`
  - but both the before/after `buildDailyNoteContent(...)` outputs for the selected date rendered no review at all because the deleted review belonged only to a previous date
- Added focused runtime assertions to `scripts/verify-settings-sync.ts` for this hidden deleted-review scenario.
- Confirmed RED with `npm run verify:settings-sync` failing because preview review disappearance compared all review keys in the task tree instead of only the reviews visible in the selected daily note.
- Root cause: `reviewKeys(...)` ignored selected-date visibility even after Phases 173-174 had already centralized date-aware task/review visibility for task counts and completion-record counts.
- Updated `shared/obsidianTemplates.ts`:
  - changed `reviewKeys(tasks, date)` to collect only visible review keys for the selected date
  - reused `getVisibleCompletionReviews(task, date)` so disappearance detection now matches rendering semantics
- Preserved behavior:
  - deleting a same-day visible review still reports disappearance
  - deleting a hidden off-date review no longer produces a false positive warning in preview
- Fresh verification passed:
  - `npm run verify:settings-sync`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-08 - Phase 176 Obsidian sync cross-date deleted review affected-date propagation
- Continued the faster batch mode, but this time moved one layer deeper from preview-only consistency into the real Electron sync path.
- Reproduced two linked bugs with a temp-vault runtime harness built around `createObsidianSyncHelpers(...)`:
  - `previewTasksToObsidian(...)` reported only the selected daily note file even when deleting a selected-date review from an older task also changes the original task-date note
  - `syncTasksToObsidian(...)` left the deleted review text stale in that original task-date note because it never rewrote the older affected date after deletion
- Added focused runtime assertions to `scripts/verify-settings-sync.ts` for this cross-date deletion scenario, covering both preview file reporting and actual file content after sync.
- Confirmed RED with `npm run verify:settings-sync` failing because affected-date collection only inspected the post-delete task tree.
- Root cause:
  - `electron/obsidianSync.ts` derived affected dates from the new task tree only
  - once the selected-date review was deleted, the old `taskDate` no longer had any remaining selected-date linkage
  - preview and real sync therefore both dropped that older daily note from their update set even though the previous sync had already written the review there
- Updated `electron/obsidianSync.ts`:
  - split affected-date collection into a reusable before/after union flow
  - let `previewTasksToObsidian(...)` list every affected daily note file using real filesystem existence to mark `create` vs `update`
  - let `syncTasksToObsidian(...)` rewrite all dates affected by either the previous or current sync task tree
- Propagated optional `beforeTasks` through:
  - `src/hooks/useTasks.ts`
  - `src/hooks/taskObsidianSync.ts`
  - `src/store/taskStore.ts`
  - `src/vite-env.d.ts`
  - `electron/preload.ts`
  - `electron/obsidianIpc.ts`
  - `electron/mainWindowBootstrap.ts`
- Renderer-side sync now remembers the last successfully synced Obsidian task tree and passes it back on the next sync, so deletion-only diffs can still clear stale older notes.
- Preserved behavior:
  - normal same-day syncs still touch one daily note
  - selected-note managed-block preview remains unchanged
  - cross-date deleted reviews now disappear from both the selected note and the older original task-date note
- Fresh verification passed:
  - `npm run verify:settings-sync`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-08 - Phase 177 Obsidian sync preview multi-file task counting consistency
- Continued along the same Obsidian sync seam after Phase 176 and checked whether multi-file preview statistics still matched the now-correct multi-file sync scope.
- Reproduced the mismatch by previewing a cross-date deleted-review sync through `createObsidianSyncHelpers(...)`:
  - preview correctly listed 2 affected daily note files
  - but `taskCount` was still `0`, even though the older affected note would still render 1 task block after the deletion
- Added a focused runtime assertion to `scripts/verify-settings-sync.ts` for this exact multi-file preview-count scenario.
- Confirmed RED with `npm run verify:settings-sync` failing because the Electron preview layer had only expanded `files`; it still reused the single-date `buildSyncPreview(...)` aggregate for:
  - `taskCount`
  - `completionRecordCount`
  - `deletedReviewWillDisappear`
- Root cause: `electron/obsidianSync.ts` was mixing two scopes:
  - file scope = union of affected dates
  - count scope = selected-date-only shared preview
- Updated `electron/obsidianSync.ts` so preview now:
  - builds one shared preview per affected date
  - keeps the selected-date preview as the base for managed-block summary
  - aggregates `files`, `taskCount`, `completionRecordCount`, and `deletedReviewWillDisappear` across all affected dates
- Preserved behavior:
  - single-file selected-date previews still behave exactly the same
  - per-date file actions still reflect real create/update status
  - multi-file preview counts now match the total rendered task/review work that the real sync will process
- Fresh verification passed:
  - `npm run verify:settings-sync`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-08 - Phase 178 Obsidian daily template disabled custom block visibility
- Continued in fast mode but moved from sync preview semantics to the adjacent daily-template rendering path.
- Reproduced a real template-center visibility bug:
  - `applyObsidianTemplatePreset(defaults, 'work-review')` correctly sets the knowledge module to disabled (`aiGenerate: false`)
  - `buildDailyNoteContent(...)` still rendered the disabled knowledge block heading into the daily note, only omitting the AI marker body
- First verifier run hit a stale `verify:obsidian-template-center` assertion expecting legacy `monthlyDir` migration to use a weekly filename. Calibrated that assertion to the current Phase 160 behavior: `{{year}}-{{month}}.md`.
- Added a focused runtime assertion to `scripts/verify-obsidian-template-center.ts` that disabled daily-template custom modules should not render their hidden block headings.
- Confirmed RED with `npm run verify:obsidian-template-center` failing because the disabled knowledge block title remained in the generated note.
- Root cause: `shared/obsidianTemplates.ts` treated `aiGenerate: false` as "render an empty deterministic section" rather than "module hidden", while the template center's module switch semantics use `aiGenerate` as the module enabled flag for custom blocks.
- Updated `shared/obsidianTemplates.ts`:
  - `buildCustomAiBlock(...)` now returns an empty string for disabled custom blocks
  - `buildDailyNoteContent(...)` skips pushing empty custom block output
- Preserved behavior:
  - default enabled AI custom blocks still render headings and markers
  - daily task/work/inspiration managed blocks are unchanged
  - hidden custom modules no longer leave orphan headings in generated notes
- Fresh verification passed:
  - `npm run verify:obsidian-template-center`
  - `npm run verify:daily-review-blocks`
  - `npm run typecheck`
  - `npm run build`


## 2026-07-08 - Phase 179 template renderer disabled custom block visibility
- Continued in fast mode after the report-only Codex speed check showed this long thread/local state is heavy; no Codex local maintenance was applied.
- Investigated the adjacent `renderDailyTemplate(...)` path after Phase 178 fixed `buildDailyNoteContent(...)`.
- Reproduced the bug with a runtime check: the `work-review` preset disables the knowledge custom block, but `renderDailyTemplate(...)` still included `## ?????`.
- Added a focused RED assertion to `scripts/verify-obsidian-template-center.ts` covering the template-renderer path.
- Confirmed RED with `npm run verify:obsidian-template-center` failing on `renderDailyTemplate should hide disabled daily custom block headings too.`
- Updated `shared/templateRenderer.ts` so disabled daily custom blocks are skipped before heading/marker rendering.
- Intentionally did not change `renderReportTemplate(...)`, where `aiGenerate: false` can still mean render existing/manual body content.
- Fresh verification passed:
  - `npm run verify:obsidian-template-center`
  - `npm run verify:daily-markdown-template`
  - `npm run verify:daily-template-markers`
  - `npm run typecheck`
  - `npm run build`


## 2026-07-08 - Phase 180 legacy disabled fixed daily module visibility
- Continued in fast mode along the daily-template/Obsidian rendering seam.
- Checked a suspected fixed-module persistence issue first and found the current Template Center UI intentionally keeps `work`, `inspiration`, and `tasks` checked/disabled, so that path was not changed.
- Reproduced a real legacy compatibility mismatch instead:
  - runtime `modules.work/inspiration/tasks.enabled=false` produced `buildSyncPreview(...).managedBlocks === []`
  - but `buildDailyNoteContent(...)` and custom `buildDailyNoteFromTemplate(...)` output still included `DAILYTODO:WORK`, `DAILYTODO:INSPIRATION`, and `DAILYTODO:TASKS` markers
- Added focused RED assertions to `scripts/verify-daily-template-markers.ts` to pin both fallback daily generation and custom daily-token replacement/appending.
- Confirmed RED with `npm run verify:daily-template-markers` failing on `disabled legacy work module should not render in fallback daily content`.
- Updated `shared/obsidianTemplates.ts`:
  - added `isFixedBlockEnabled(...)` backed by the existing `compat(...)` enabled flags
  - made `buildFixedBlock(...)` return empty content when the fixed module is disabled
  - made `buildDailyNoteContent(...)` skip empty fixed block output
  - made `buildDailyNoteFromTemplate(...)` replace disabled fixed tokens with empty output and only append missing fixed managed blocks when enabled
- Fresh verification passed:
  - `npm run verify:daily-template-markers`
  - `npm run verify:settings-sync`
  - `npm run verify:obsidian-template-center`
  - `npm run verify:daily-markdown-template`
  - `npm run typecheck`
  - `npm run build`


## 2026-07-08 - Phase 181 flexible daily template token replacement
- Continued in fast mode on the Obsidian daily-template generation seam.
- Reproduced a real mismatch between migration recognition and runtime rendering:
  - `migrateDailyMarkdownTemplate(...)` recognizes core tokens with optional whitespace and case-insensitivity via `/{{\s*(work|inspire|inspiration|tasks|review|tomorrow|knowledge)\s*}}/gi`
  - `buildDailyNoteFromTemplate(...)` only replaced exact `{{date}}`, `{{work}}`, `{{inspiration}}`, and `{{tasks}}`
  - custom templates containing `{{ DATE }}`, `{{ work }}`, `{{ Inspiration }}`, or `{{ TASKS }}` leaked raw placeholders into generated notes and then appended duplicate managed blocks
- Added focused RED coverage to `scripts/verify-daily-template-markers.ts` for spaced/case-varied date/work/inspiration/tasks tokens.
- Confirmed RED with `npm run verify:daily-template-markers` failing because `# spaced {{ DATE }}` did not become `# spaced 2026-06-12`.
- Updated `shared/obsidianTemplates.ts`:
  - added `replaceDailyTemplateToken(...)`
  - replaced date/work/inspiration/inspire/tasks tokens with whitespace-tolerant, case-insensitive matching
  - preserved Phase 180 behavior because replacement still delegates fixed module body generation to `buildFixedBlock(...)`
- Fresh verification passed:
  - `npm run verify:daily-template-markers`
  - `npm run verify:daily-markdown-template`
  - `npm run verify:obsidian-template-center`
  - `npm run verify:settings-sync`
  - `npm run typecheck`
  - `npm run build`


## 2026-07-08 - Phase 182 custom daily AI template token replacement
- Continued in fast mode on the same daily-template migration/rendering seam.
- Reproduced the custom-token half of the Phase 181 mismatch:
  - `migrateDailyMarkdownTemplate(...)` recognizes `review`, `tomorrow`, and `knowledge` tokens with whitespace/case tolerance
  - `buildDailyNoteFromTemplate(...)` still only replaced fixed/date tokens
  - templates containing `{{ review }}`, `{{ TOMORROW }}`, or `{{ Knowledge }}` leaked raw placeholders and produced no custom AI marker blocks
- Added focused RED coverage to `scripts/verify-daily-template-markers.ts` for custom AI token replacement.
- Confirmed RED with `npm run verify:daily-template-markers` failing because the review custom marker was missing.
- Updated `shared/obsidianTemplates.ts`:
  - added `buildCustomTokenBlock(...)` mapping review/tomorrow/knowledge to the first three daily custom blocks
  - reused `replaceDailyTemplateToken(...)` for `review`, `tomorrow`, and `knowledge`
  - preserved disabled custom behavior because `buildCustomTokenBlock(...)` delegates to `buildCustomAiBlock(...)`
- Fresh verification passed:
  - `npm run verify:daily-template-markers`
  - `npm run verify:daily-markdown-template`
  - `npm run verify:obsidian-template-center`
  - `npm run verify:obsidian-template-recognition`
  - `npm run verify:settings-sync`
  - `npm run typecheck`
  - `npm run build`


## 2026-07-08 - Phase 183 daily path template variable expansion
- Continued in fast mode along the Obsidian template path seam.
- Reproduced a real path-variable mismatch:
  - `shared/pathTemplate.ts` already supports `{{date}}`, `{{year}}`, `{{month}}`, and `{{week}}` with whitespace-tolerant variables
  - report defaults and migrated report paths already rely on year/month/week variables
  - `resolveTemplatePath(...)` used a local `renderPath(...)` that only replaced exact `{{date}}`, leaving daily paths like `logs/daily/{{year}}/{{month}}/{{ date }}.md` unresolved
- Added focused RED coverage to `scripts/verify-settings-sync.ts` for `resolveTemplatePath('G:/vault', 'logs/daily/{{year}}/{{month}}/{{ date }}.md', '2026-05-27')`.
- Confirmed RED with `npm run verify:settings-sync` returning the raw placeholders instead of `logs/daily/2026/05/2026-05-27.md`.
- Updated `shared/obsidianTemplates.ts`:
  - imported `expandPathTemplate(...)`
  - replaced the local exact-date renderer with `dateKeyToLocalDate(...)` + `expandPathTemplate(...)`
  - kept absolute-path and vault-escape checks in the same order after expansion
- Fresh verification passed:
  - `npm run verify:settings-sync`
  - `npm run verify:daily-markdown-template`
  - `npm run verify:obsidian-template-center`
  - `npm run verify:template-source-settings`
  - `npm run verify:daily-template-markers`
  - `npm run typecheck`
  - `npm run build`


## 2026-07-08 - Phase 184 case-insensitive path template variables
- Switched to faster batching style for small, low-risk optimizer phases.
- Reproduced the remaining path-template mismatch:
  - `expandPathTemplate(...)` was whitespace-tolerant for supported variables
  - it was still lowercase-only for `date/year/month/week`
  - a daily path like `logs/daily/{{YEAR}}/{{Month}}/{{ DATE }}.md` stayed partially raw
- Added focused RED coverage to `scripts/verify-settings-sync.ts` for uppercase/mixed-case path variables.
- Confirmed RED with `npm run verify:settings-sync` failing on raw `{{YEAR}}/{{Month}}/{{ DATE }}` placeholders.
- Updated `shared/pathTemplate.ts`:
  - made the supported token regexes case-insensitive
  - kept unknown variables untouched
- Fresh verification passed:
  - `npm run verify:settings-sync`
  - `npm run verify:template-source-settings`
  - `npm run typecheck`
  - `npm run build`


## 2026-07-08 - Phase 185 AI Review source path template parity
- Continued fast mode on the path-template seam, this time checking AI Review source-material collection.
- Reproduced a real mismatch:
  - Obsidian daily paths now use shared `expandPathTemplate(...)`
  - AI Review daily source rules still used a private `templatePath.replace(/\{\{date\}\}/g, date)` renderer
  - source paths like `logs/daily/{{YEAR}}/{{Month}}/{{ DATE }}.md` were not found
  - absolute Windows source paths could also be sanitized before being rejected, mirroring the old Phase 166 safety bug
- Added focused RED coverage to `scripts/verify-source-materials.ts`:
  - nested daily source note discovery through mixed-case/spaced variables
  - `C:/secret/{{date}}.md` must throw as an absolute source path
- Confirmed RED with `npm run verify:source-materials` failing because the nested note was not collected.
- Updated `shared/aiReview/sourceMaterials.ts`:
  - imported `expandPathTemplate(...)`
  - added local `dateKeyToLocalDate(...)`
  - changed source rule rendering to use the shared path-template semantics
  - moved absolute-path rejection before invalid-character sanitization
- Fresh verification passed:
  - `npm run verify:source-materials`
  - `npm run verify:electron-ai-review-source-materials-ipc-module`
  - `npm run verify:electron-ai-review-report-ipc-source-collection-module`
  - `npm run verify:electron-ai-review-weekly-report-ipc-module`
  - `npm run verify:electron-ai-review-monthly-report-ipc-module`
  - `npm run typecheck`
  - `npm run build`


## 2026-07-08 - Phase 186 AI Review weekly source directory vault guard
- Continued the path-safety seam in fast mode.
- Found a direct shared-layer gap in `collectMonthlySources(...)`:
  - app-level callers usually sanitize `settings.weeklyDir`
  - but the exported shared function passed `weeklyDir` directly into `path.join(vaultPath, weeklyDir, week.md)`
  - a direct caller could pass `../outside-weekly` and read a weekly report file outside the vault
- Added focused RED coverage to `scripts/verify-source-materials.ts`:
  - creates `outside-weekly/2026-W24.md` next to the vault
  - asserts `collectMonthlySources({ weeklyDir: '../outside-weekly', mode: 'weekly-reports' })` throws instead of reading it
- Confirmed RED with `npm run verify:source-materials` failing with "Missing expected exception."
- Updated `shared/aiReview/sourceMaterials.ts`:
  - extracted `resolveRenderedVaultRelativePath(...)`
  - reused it from `resolveVaultRelativePath(...)`
  - routed weekly report source file resolution through the same absolute-path/sanitization/vault-escape guard
- Fresh verification passed:
  - `npm run verify:source-materials`
  - `npm run verify:electron-ai-review-report-ipc-source-collection-module`
  - `npm run verify:electron-ai-review-source-materials-ipc-module`
  - `npm run verify:electron-ai-review-monthly-report-ipc-module`
  - `npm run typecheck`
  - `npm run build`


## 2026-07-08 - Phase 187 AI Review report output vault guard
- Continued the path-boundary hardening pass in fast mode.
- Found a writer-layer defense gap in `electron/aiReview/exportReports.ts`:
  - IPC callers sanitize report output directories before passing them in
  - but `generatePersonalWeekly(...)`, `generatePersonalMonthly(...)`, and `generateExternalReport(...)` share `resolveReportFilePath(...)`
  - that helper directly used `path.join(vaultPath, relativeDir || defaultDir, fileName)`
  - a direct caller could pass `relativeDir: '../outside-export'` and write outside the selected vault
- Added focused RED coverage to `scripts/verify-export-reports.ts` with `await assert.rejects(...)` around `generatePersonalWeekly({ relativeDir: '../outside-export' })`.
- Confirmed RED with `npm run verify:export-reports` failing because the expected rejection was missing.
- Updated `electron/aiReview/exportReports.ts`:
  - `resolveReportFilePath(...)` now rejects absolute output dirs
  - resolves output path under the vault root
  - rejects `..` / absolute relative paths before any report write
- Fresh verification passed:
  - `npm run verify:export-reports`
  - `npm run verify:electron-ai-review-weekly-report-ipc-module`
  - `npm run verify:electron-ai-review-monthly-report-ipc-module`
  - `npm run verify:electron-ai-review-external-report-ipc-module`
  - `npm run typecheck`
  - `npm run build`


## 2026-07-08 - Phase 188 Companion target absolute path guard
- Continued the configurable-path boundary hardening pass in fast mode, this time on Obsidian Companion sync targets.
- Found the same sanitization-before-absolute-check pattern in `electron/obsidianCompanion.ts`:
  - `resolveTargetPath(...)` rendered the target path
  - immediately replaced invalid filename characters, including `:`
  - only then checked `path.isAbsolute(...)`
  - on Windows, `C:/secret/{{date}}.md` could be rewritten as `C-/secret/2026-05-26.md` and treated as a relative vault path
- Added focused RED coverage to `electron/obsidianCompanion.verify.ts` so Companion rules with `target: 'C:/secret/{{date}}.md'` must produce an explicit "relative to the vault" error.
- Confirmed RED with `npm run verify:companion` failing because the absolute target was accepted.
- Updated `electron/obsidianCompanion.ts`:
  - checks the raw rendered target for absoluteness first
  - then applies invalid-character sanitization for still-relative targets
  - preserves the existing vault escape check after resolution
- Fresh verification passed:
  - `npm run verify:companion`
  - `npm run verify:electron-companion-ipc-module`
  - `npm run verify:app-companion-actions-module`
  - `npm run typecheck`
  - `npm run build`


## 2026-07-08 - Phase 189 Companion template variable flexibility
- Continued the Companion consistency pass in fast mode.
- Found a template-variable mismatch in `electron/obsidianCompanion.ts`:
  - default Companion templates use exact `{{date}}`, `{{content}}`, `{{tags}}`
  - recent Obsidian/AI Review path and daily-template work accepts whitespace and case variants
  - Companion `renderTemplate(...)` still used `/{{(\w+)}}/g`, so `{{ DATE }}` and `{{ Content }}` stayed raw/empty instead of rendering
- Added focused RED coverage to `electron/obsidianCompanion.verify.ts`:
  - direct render coverage for spaced/case-varied date/content/tags/priority/createdAt
  - buildSyncPlan coverage for a target path using `logs/daily/{{ DATE }}.md`
  - content rendering coverage for a body using `{{ Content }} {{ TAGS }}`
- Confirmed RED with `npm run verify:companion` failing on the spaced uppercase date token.
- Updated `electron/obsidianCompanion.ts`:
  - builds a lowercase replacement map
  - replaces `/{{\s*(\w+)\s*}}/g`
  - resolves known variables case-insensitively while keeping unknown variables as empty strings
- Fresh verification passed:
  - `npm run verify:companion`
  - `npm run verify:electron-companion-ipc-module`
  - `npm run verify:app-companion-actions-module`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-08 - Phase 190 Companion mobile inbox file-only import
- Continued after the user selected?? A+B: keep current thread in fast batch mode and create a handoff file for a future lightweight thread.
- Finished the Companion mobile inbox bugfix that had already completed RED/GREEN verification before the interruption.
- Root cause:
  - `importMobileInbox(...)` used `fs.readdirSync(inboxPath)` and filtered entries by extension only
  - a directory named `archive.md` matched `.md`
  - `fs.readFileSync(directory)` threw `EISDIR`
  - the catch block then moved the directory into `_failed`
- Added RED coverage to `electron/obsidianCompanion.verify.ts`:
  - creates a real `note.txt`
  - creates a directory named `archive.md`
  - asserts import succeeds, imports only the real file, and leaves the directory untouched
- Confirmed RED with `npm run verify:companion` failing with `EISDIR`.
- Updated `electron/obsidianCompanion.ts`:
  - changed inbox listing to `fs.readdirSync(inboxPath, { withFileTypes: true })`
  - filters `entry.isFile()` before extension checks
  - maps accepted entries back to names for the existing import loop
- Fresh verification before handoff passed:
  - `npm run verify:companion`
  - `npm run verify:electron-companion-ipc-module`
  - `npm run verify:app-companion-actions-module`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-08 - Phase 191 Companion SyncPlan direct write vault guard
- Continued fast batch mode after generating `codex_handoff.md`.
- Found a defense-in-depth gap in `writeSyncPlan(...)`:
  - `buildSyncPlan(...)` validates Companion rule targets under the selected vault
  - but `writeSyncPlan(...)` accepts any `SyncPlan` object and trusted each `change.filePath`
  - a malformed direct plan could set `ok: true` and write outside the vault
- Added focused RED coverage to `electron/obsidianCompanion.verify.ts`:
  - builds `unsafeDirectWritePath = path.resolve(vaultPath, '..', 'outside-companion-direct.md')`
  - calls `writeSyncPlan({ ok: true, vaultPath, changes: [...] })`
  - asserts the write is rejected and no outside file is created
- Confirmed RED with `npm run verify:companion` failing because the direct write was accepted.
- Updated implementation:
  - `shared/obsidianCompanion.ts`: `SyncPlan` now includes optional `vaultPath`
  - `buildSyncPlan(...)`: attaches `settings.vaultPath` to generated plans
  - `writeSyncPlan(...)`: rejects missing `plan.vaultPath` and rejects every change path that escapes that root before file operations
- Verification passed:
  - `npm run verify:companion`
  - `npm run verify:electron-companion-ipc-module`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-08 - Phase 192 Companion SyncPlan preflight no partial write
- Continued fast batch mode from Phase 191.
- Found an atomicity gap in `writeSyncPlan(...)`:
  - Phase 191 rejected each vault-escaping change during the write loop
  - a malformed direct plan with a safe first change and unsafe second change could still write the safe file before returning an error
- Added focused RED coverage to `electron/obsidianCompanion.verify.ts`:
  - builds `safeDirectWritePath` inside the vault and `mixedUnsafeDirectWritePath` outside the vault
  - calls `writeSyncPlan({ ok: true, vaultPath, changes: [safe, unsafe] })`
  - asserts the result is rejected and neither file exists
- Confirmed RED with `npm run verify:companion` failing on the partial safe-file write assertion.
- Updated `electron/obsidianCompanion.ts`:
  - collects all vault-escape path errors before any filesystem operation
  - returns early if any change escapes the vault
  - keeps the in-loop guard as defense in depth
- Fresh verification passed:
  - `npm run verify:companion`
  - `npm run verify:electron-companion-ipc-module`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; Phase 191 just ran both and this phase only changed local Companion runtime/test logic.

## 2026-07-08 - Phase 193 Companion mobile inbox JSON content guard
- Continued fast batch mode after Phase 192.
- Found a mobile-inbox JSON validation gap:
  - `.json` files were parsed, but missing `content` fell back to the raw JSON text
  - the importer then created a misleading capture item and moved the file to `_processed`
- Added focused RED coverage to `electron/obsidianCompanion.verify.ts`:
  - creates `empty.json` with metadata but no content
  - expects `importMobileInbox(...)` to return `ok: false`, create no item, mention content in errors, move the file to `_failed`, and not move it to `_processed`
- Confirmed RED with `npm run verify:companion` failing because the JSON file was accepted.
- Updated `electron/obsidianCompanion.ts`:
  - computes content with raw fallback only for non-JSON files
  - throws `Mobile inbox JSON capture is missing content: <file>` when JSON content is empty
  - reuses the existing catch path to move invalid JSON files to `_failed`
- Fresh verification passed:
  - `npm run verify:companion`
  - `npm run verify:electron-companion-ipc-module`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; this phase only changed local Companion runtime/test logic.

## 2026-07-08 - Phase 194 Obsidian sync optional blog draft directory guard
- Continued fast batch mode after Phase 193 and scanned path-join seams for a clear, testable safety issue.
- Found an optional-side-effect failure in `syncTasksToObsidian(...)`:
  - `localBlogDraftDir` was checked only with `fs.existsSync(...)`
  - if the configured path existed as a file, writing `daily-memo-<date>.md` under it threw `ENOENT`
  - that optional blog-draft failure interrupted the main Obsidian daily-note sync
- Added focused RED coverage to `scripts/verify-settings-sync.ts`:
  - creates a real file and injects it as `localBlogDraftDir`
  - asserts sync does not throw, still reports ok, still writes the selected daily note, and does not overwrite the configured file
- Confirmed RED with `npm run verify:settings-sync` failing on the unwanted exception.
- Updated `electron/obsidianSync.ts`:
  - blog draft output now runs only when `localBlogDraftDir` exists and `fs.statSync(localBlogDraftDir).isDirectory()` is true
  - valid draft directories keep existing behavior
  - missing or file-backed paths are skipped as optional output
- Fresh verification passed:
  - `npm run verify:settings-sync`
  - `npm run verify:electron-obsidian-sync-module`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-08 - Phase 195 Companion mobile inbox directory guard
- Continued fast batch mode from Phase 194.
- Found an input-shape gap in `importMobileInbox(...)`:
  - it checked only `fs.existsSync(inboxPath)`
  - when `inboxPath` was a file, `fs.mkdirSync(path.join(inboxPath, '_processed'))` threw
  - that could break the caller instead of returning a normal failed import result
- Added focused RED coverage to `electron/obsidianCompanion.verify.ts`:
  - creates a real file and passes it as the mobile inbox path
  - asserts import does not throw, returns `ok: false`, mentions a directory requirement, and leaves the file unchanged
- Confirmed RED with `npm run verify:companion` failing because the file-backed inbox path threw.
- Updated `electron/obsidianCompanion.ts`:
  - after the existing missing-path guard, `importMobileInbox(...)` now checks `fs.statSync(inboxPath).isDirectory()`
  - non-directory inbox paths return `{ ok: false, items: [], errors: ['Mobile inbox path must be a directory.'] }`
  - valid directory import behavior is unchanged
- Fresh verification passed:
  - `npm run verify:companion`
  - `npm run verify:app-companion-mobile-module`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; Phase 194 just ran both and this phase only changed local Companion runtime/test logic.

## 2026-07-08 - Phase 196 Companion mobile inbox processing directory conflict guard
- Continued fast batch mode after Phase 195.
- Found another mobile-inbox setup gap:
  - valid inbox directories create `_processed` and `_failed` before processing files
  - if `_processed` already existed as a file, `fs.mkdirSync(..., { recursive: true })` threw
  - that left the caller with an uncaught filesystem error instead of a structured import failure
- Added focused RED coverage to `electron/obsidianCompanion.verify.ts`:
  - creates a valid inbox directory
  - creates a file named `_processed`
  - adds a pending `note.txt`
  - asserts import does not throw, returns `ok: false`, mentions `_processed` and directory, leaves the note in place, and does not overwrite `_processed`
- Confirmed RED with `npm run verify:companion` failing because `_processed` file conflicts threw.
- Updated `electron/obsidianCompanion.ts`:
  - added `ensureMobileInboxDirectory(...)`
  - `_processed` and `_failed` setup now creates missing directories, accepts existing directories, and returns setup errors for non-directory conflicts
  - setup errors return before any inbox file is moved
- Fresh verification passed:
  - `npm run verify:companion`
  - `npm run verify:app-companion-mobile-module`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; this phase only changed local Companion runtime/test logic.

## 2026-07-08 - Phase 197 Companion mobile inbox blank text content guard
- Continued fast batch mode after Phase 196.
- Found a content-validation gap in `importMobileInbox(...)`:
  - Phase 193 required JSON captures to provide content
  - `.md` / `.txt` files still used raw-text fallback and could create empty capture items after trimming whitespace
  - whitespace-only files were moved to `_processed` as successful imports
- Added focused RED coverage to `electron/obsidianCompanion.verify.ts`:
  - creates whitespace-only `blank.txt`
  - expects import to return `ok: false`, create no item, mention content, move the file to `_failed`, and not move it to `_processed`
- First verifier attempt surfaced a test-edit syntax error (`Unterminated string literal`) because the whitespace fixture used an actual newline in a TypeScript string; corrected the fixture to escaped `\n` / `\t` and reran RED.
- Confirmed intended RED with `npm run verify:companion` failing because blank text was imported successfully.
- Updated `electron/obsidianCompanion.ts`:
  - replaced the JSON-only content check with a file-type-neutral `if (!content)` guard
  - all mobile inbox capture types now require non-empty trimmed content
  - non-empty `.md` / `.txt` raw-text behavior remains unchanged
- Fresh verification passed:
  - `npm run verify:companion`
  - `npm run verify:app-companion-mobile-module`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-09 - Phase 198 AI Review source file-only collection guard
- Continued fast batch mode from Phase 197 using the current worktree as authority.
- Found a file-shape gap in `shared/aiReview/sourceMaterials.ts`:
  - `collectDailySourcesForDates(...)` checked only `fs.existsSync(filePath)`
  - if a rendered source path existed as a directory, `fs.readFileSync(directory)` threw `EISDIR`
  - one directory-shaped candidate could interrupt the whole source collection instead of being skipped like a missing/empty source
- Added focused RED coverage to `scripts/verify-source-materials.ts`:
  - creates a directory named `logs/daily/DailyTodo/2026-06-09.md`
  - collects sources for 2026-06-08 and 2026-06-09
  - asserts collection does not throw and still returns only the valid 2026-06-08 file
- Confirmed RED with `npm run verify:source-materials` failing on `EISDIR`.
- Updated `shared/aiReview/sourceMaterials.ts`:
  - added `readSourceFileIfPresent(...)`
  - source candidates are read only when they exist, are real files, and have non-empty content
  - reused the same helper for weekly report candidates as a consistency hardening
- Fresh verification passed:
  - `npm run verify:source-materials`
  - `npm run verify:electron-ai-review-source-materials-ipc-module`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; Phase 197 just ran both and this phase changed local shared source-material runtime/test logic.

## 2026-07-09 - Phase 199 AI Review atomic snapshot directory guard
- Continued fast batch mode after Phase 198 and scanned remaining file-read seams.
- Found a file-shape gap in `electron/aiReview/atomicWrite.ts`:
  - `readWithStamp(...)` checked `fs.existsSync(filePath)` and then read the path directly
  - if the target path existed as a directory, snapshot creation threw `EISDIR`
  - callers such as report writers and daily AI review rely on this helper as a safe pre-write snapshot boundary
- Added focused RED coverage to `scripts/verify-atomic-write.ts`:
  - creates a directory path named like a markdown file
  - asserts `readWithStamp(directoryPath)` does not throw
  - asserts no file stamp or content is produced for the directory-backed path
- Confirmed RED with `npm run verify:atomic-write` failing on `EISDIR`.
- Updated `electron/aiReview/atomicWrite.ts`:
  - after `statSync`, `readWithStamp(...)` now checks `stat.isFile()`
  - non-file paths return `{ content: '', stamp: null }`, the same safe shape as missing files
  - existing `atomicReplace(...)` conflict behavior continues to prevent overwriting directory-backed targets
- Fresh verification passed:
  - `npm run verify:atomic-write`
  - `npm run verify:export-reports`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; this phase changed only local atomic-write runtime/test logic.

## 2026-07-09 - Phase 200 Electron vault status directory guard
- Continued fast batch mode after Phase 199.
- Tried two AI daily-runner diagnostic hypotheses first; both were already covered by current runtime behavior, so those temporary test edits were reverted and not counted as phase work.
- Found a real vault-status validation gap in `electron/appStateAccessors.ts`:
  - `getVaultStatus()` checked only whether the configured path existed
  - a regular file stored under `obsidianVaultPath` returned `ok: true`
  - downstream Obsidian sync/source/report features expect a directory vault and would fail later with less clear filesystem errors
- Added focused RED coverage to `scripts/verify-electron-app-state-accessors-module.ts`:
  - creates a real file and returns it from the fake store as `obsidianVaultPath`
  - asserts `getVaultStatus().ok === false`
  - asserts the reason explains that a directory/folder is required
- First RED edit had an invalid regex because Chinese regex alternatives were transformed into `???`; changed the `zh` stub to prefix `directory required:` and asserted against English `directory|folder`.
- Confirmed intended RED with `npm run verify:electron-app-state-accessors-module` failing because file-backed vault paths were accepted.
- Updated `electron/appStateAccessors.ts`:
  - added `isExistingDirectory(...)` with `existsSync + statSync(...).isDirectory()` inside a safe try/catch
  - `getDefaultVaultPath()` now returns the development default only when it is a real directory
  - `getVaultStatus()` now rejects existing non-directory paths with a structured reason
- Fresh verification passed:
  - `npm run verify:electron-app-state-accessors-module`
  - `npm run verify:electron-main-modules`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-09 - Phase 201 Obsidian sync daily note file guard
- Continued fast batch mode from Phase 200.
- Found a daily-note target shape gap in `electron/obsidianSync.ts`:
  - `syncOneDailyNote(...)` used `fs.existsSync(filePath) ? fs.readFileSync(filePath)`
  - if the daily note path existed as a directory, sync threw `EISDIR`
  - that escaped `syncTasksToObsidian(...)` instead of returning a structured failure
- Added focused RED coverage to `scripts/verify-settings-sync.ts`:
  - creates `logs/daily/DailyTodo/2026-05-28.md` as a directory inside the temp vault
  - calls `syncHelpers.syncTasksToObsidian([], '2026-05-28')`
  - asserts sync does not throw, returns `ok: false`, and explains that the daily note target must be a file
- Confirmed RED with `npm run verify:settings-sync` failing because the sync call threw.
- Updated `electron/obsidianSync.ts`:
  - added `readDailyNoteFileIfPresent(...)`
  - existing daily note paths are read only when they are real files
  - non-file daily note targets throw a clear `Daily note target must be a file: ...` error
  - `syncTasksToObsidian(...)` catches daily-note read/write setup errors and returns `{ ok: false, reason }`
  - `previewTasksToObsidian(...)` now returns an error preview shape for the same non-file condition
- Fresh verification passed:
  - `npm run verify:settings-sync`
  - `npm run verify:electron-obsidian-sync-module`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; Phase 200 just ran both and this phase changed local Obsidian sync runtime/test logic.

## 2026-07-09 - Phase 202 Obsidian IPC open daily note file guard
- Continued fast batch mode after Phase 201.
- Followed the handoff seam for `obsidian:openDailyNote`:
  - sync/preview now reject directory-backed daily note paths
  - the IPC open path still created/opened the rendered path without checking whether an existing target was a file
  - a directory-backed daily note target could reach `shell.openPath(...)` instead of returning a clear failure
- Added focused RED coverage to `scripts/verify-electron-obsidian-ipc-module.ts`:
  - requires the Obsidian IPC helper source to check `fs.statSync(filePath).isFile()` before opening the daily note
  - this static verifier is used because the handler is registered through Electron `ipcMain`
- Confirmed RED with `npm run verify:electron-obsidian-ipc-module` failing because the guard was absent.
- Updated `electron/obsidianIpc.ts`:
  - `openDailyNote` now creates parent directories inside a try/catch
  - if the target exists, it must satisfy `fs.statSync(filePath).isFile()`
  - existing non-file targets return `{ ok: false, reason: zh('Daily note target must be a file.') }`
  - missing targets are still bootstrapped with `buildDailyTemplate(...)`
- Fresh verification passed:
  - `npm run verify:electron-obsidian-ipc-module`
  - `npm run verify:electron-main-window-bootstrap-module`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; Phase 200 just ran both and this phase changed local IPC runtime/test logic.

## 2026-07-09 - Phase 203 Electron icon path file-only guard
- Continued fast batch mode after Phase 202.
- Scanned non-Obsidian path/resource seams and found a resource-shape gap in `electron/appIcons.ts`:
  - `resolveIconPath(...)` returned a candidate as soon as `fs.existsSync(candidate)` was true
  - a directory named `icon.png` or `tray.png` could be returned as an icon file path
  - downstream `nativeImage.createFromPath(...)` would receive a directory instead of falling back immediately
- Added focused RED coverage to `scripts/verify-electron-main-modules.ts`:
  - requires the app icon helper source to check `fs.statSync(candidate).isFile()` before returning a path
  - static verification fits this helper because existing verifier already validates app icon module extraction and wiring
- Confirmed RED with `npm run verify:electron-main-modules` failing because the file-shape guard was absent.
- Updated `electron/appIcons.ts`:
  - `resolveIconPath(...)` now returns only candidates that both exist and are real files
  - missing paths and directory candidates continue to fall through to the embedded fallback icon
- Fresh verification passed:
  - `npm run verify:electron-main-modules`
  - `npm run verify:electron-app-environment-module`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-09 - Phase 204 Electron development userData directory guard
- Continued fast batch mode after Phase 203.
- Found a development-environment path-shape gap in `electron/appEnvironment.ts`:
  - `applyDevelopmentUserDataOverride()` checked only `fs.existsSync(DEV_APPDATA_ROOT)`
  - if the development app-data path existed as a file, Electron `userData` could be pointed at a non-directory path
  - that would make later settings/store/log writes fail in less obvious places
- Added focused RED coverage to `scripts/verify-electron-app-environment-module.ts`:
  - requires the helper source to check `fs.statSync(DEV_APPDATA_ROOT).isDirectory()` before applying `app.setPath('userData', DEV_APPDATA_ROOT)`
- Confirmed RED with `npm run verify:electron-app-environment-module` failing because the directory guard was absent.
- Updated `electron/appEnvironment.ts`:
  - dev override now requires development mode, path existence, and `fs.statSync(DEV_APPDATA_ROOT).isDirectory()`
  - packaged builds and missing dev app-data paths remain no-op
- Fresh verification passed:
  - `npm run verify:electron-app-environment-module`
  - `npm run verify:electron-main-modules`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; Phase 203 just ran both and this phase changed local environment wiring only.

## 2026-07-09 - Phase 205 SafeStore config file-only guard
- Continued fast batch mode after Phase 204.
- Found a corrupt-config recovery path-shape gap in `electron/safeStore.ts`:
  - `createSafeStore()` retried `new Store()` after backing up and rewriting `configPath`
  - the guard used only `configPath && fs.existsSync(configPath)`
  - if `configPath` existed as a directory, the recovery path would try to `copyFileSync` / `writeFileSync` against a non-file target
  - that could turn a recoverable config parse/startup failure into a different filesystem exception during fallback recovery
- Added focused RED coverage to `scripts/verify-electron-foundation-modules.ts`:
  - requires the safe-store helper source to check `fs.statSync(configPath).isFile()` before the corrupt-config backup/reset flow
  - static verification fits this seam because `createSafeStore()` is exercised during Electron bootstrap and the existing foundation verifier already owns the module boundary
- Confirmed RED with `npm run verify:electron-foundation-modules` failing because the file-only guard was absent.
- Updated `electron/safeStore.ts`:
  - the corrupt-config recovery branch now requires `configPath` to exist and be a real file
  - valid file-backed configs still get backed up to `config.corrupt-*.json` and rewritten to `{}`
  - non-file paths now skip backup/reset and fall through to the existing retry behavior
- Fresh verification passed:
  - `npm run verify:electron-foundation-modules`
  - `npm run verify:electron-main-modules`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; Phase 203 just ran both and Phases 204-205 touched only local Electron runtime/test wiring.

## 2026-07-09 - Phase 206 Companion SyncPlan directory target no partial write guard
- Continued fast batch mode after Phase 205.
- Investigated the next Companion write seam in `electron/obsidianCompanion.ts` and reproduced the root cause with a direct inline `npm exec -- tsx` probe:
  - a mixed direct `writeSyncPlan(...)` with one safe file target followed by one vault-internal directory-backed target returned `ok: false`
  - but the safe file had already been written before the later target threw `EISDIR`
  - root cause: preflight validated only vault escapes, not whether existing targets were real files
- Added focused RED coverage to `electron/obsidianCompanion.verify.ts`:
  - creates a safe file target plus a later `occupied-directory-target.md` directory inside the vault
  - asserts `writeSyncPlan(...)` rejects the plan
  - asserts the safe file is not created and the directory target is left intact
- Confirmed intended RED with `npm run verify:companion` failing because the safe change was partially written.
- Updated `electron/obsidianCompanion.ts`:
  - sync-plan preflight now rejects existing non-file targets with `Sync plan target must be a file: ...`
  - the same file-only guard remains inside the write loop as defense in depth
  - valid file targets keep existing append/managed-block behavior
- Fresh verification passed:
  - `npm run verify:companion`
  - `npm run verify:electron-companion-ipc-module`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-09 - Phase 207 AI Review report write directory conflict structured failure
- Continued fast batch mode after Phase 206 and scanned remaining direct filesystem side effects around AI Review report output.
- Reproduced the root cause with a direct inline `npm exec -- tsx` probe:
  - created a temp vault where `logs/weekly-review` was occupied by a file
  - called `generatePersonalWeekly(...)`
  - confirmed it threw `EEXIST` from `mkdirSync(...)` instead of returning a structured failed report result
- Traced the failure to `electron/aiReview/exportReports.ts`:
  - `resolveReportFilePath(...)` correctly guards vault-relative output paths
  - but shared `writeReport(...)` let filesystem setup/write exceptions escape
  - that means a blocked output directory path could interrupt weekly/monthly/external report IPC flows instead of feeding the normal `{ ok: false, error }` failure pipeline
- Added focused RED coverage to `scripts/verify-export-reports.ts`:
  - builds a vault with file-backed `logs/weekly-review`
  - asserts personal weekly report generation does not throw
  - asserts it returns `ok: false`, surfaces the blocked path error, does not overwrite the conflicting file, and does not create a nested report file
- First RED edit produced an `Unterminated string literal` because the inserted test string contained a raw newline inside single quotes; rewrote it with an escaped `\\n` and reran.
- Confirmed intended RED with `npm run verify:export-reports` failing because report generation threw instead of returning a structured failure.
- Updated `electron/aiReview/exportReports.ts`:
  - wrapped shared `writeReport(...)` filesystem setup/write path in try/catch
  - filesystem setup failures now return `{ ok: false, error }`
  - existing vault-escape validation still throws before write-time handling, preserving current explicit path-safety behavior
- Fresh verification passed:
  - `npm run verify:export-reports`
  - `npm run verify:electron-ai-review-weekly-report-ipc-module`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; Phase 206 just ran both and Phase 207 changed only local AI Review report runtime/test logic.

## 2026-07-09 - Phase 208 Obsidian optional blog draft target file guard
- Continued fast batch mode after Phase 207.
- Inspected `electron/obsidianSync.ts` and found a remaining optional-side-effect seam:
  - Phase 194 already skipped blog draft output unless `localBlogDraftDir` itself is a real directory
  - but the target file `daily-memo-<date>.md` inside that directory was still trusted
  - if the target path existed as a directory, `fs.writeFileSync(...)` threw `EISDIR`
  - this happened after the primary daily note write and outside the main sync try/catch, so an optional blog draft conflict could still make `syncTasksToObsidian(...)` throw
- Added focused RED coverage to `scripts/verify-settings-sync.ts`:
  - creates a valid blog draft directory
  - creates `daily-memo-2026-05-27.md` as a directory inside it
  - asserts sync does not throw, returns `ok: true`, still writes the selected daily note, and does not replace the directory-backed optional target
- Confirmed intended RED with `npm run verify:settings-sync` failing on `EISDIR`.
- Updated `electron/obsidianSync.ts`:
  - optional blog draft output is now enclosed in its own try/catch
  - it writes only when the computed target path is missing or already a real file
  - directory/non-file target conflicts are skipped because blog draft output is secondary to the main Obsidian sync
- Fresh verification passed:
  - `npm run verify:settings-sync`
  - `npm run verify:electron-obsidian-sync-module`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; Phase 206 just ran both and Phase 208 changed only local Obsidian sync runtime/test logic.

## 2026-07-09 - Phase 209 Companion SyncPlan build directory target guard
- Continued fast batch mode after Phase 208 and returned to the Companion sync-plan seam.
- Root cause:
  - Phase 206 made `writeSyncPlan(...)` reject existing directory/non-file targets during write preflight
  - but `buildSyncPlan(...)` still used `fs.existsSync(filePath) ? 'update-file' : 'create-file'`
  - if a resolved Companion target already existed as a directory, preview/planning could still produce an `ok` plan with an `update-file` change
  - the actual write would later fail, but the planner was misleading and allowed bad target shape to escape into UI/IPC preview state
- Added focused RED coverage to `electron/obsidianCompanion.verify.ts`:
  - creates a fresh vault
  - creates the default daily target `logs/daily/DailyTodo/2026-05-26.md` as a directory
  - asserts `buildSyncPlan(...)` returns `ok: false`, reports a file/directory target error, and emits no changes
- Confirmed intended RED with `npm run verify:companion` failing because `buildSyncPlan(...)` accepted the directory target.
- Updated `electron/obsidianCompanion.ts`:
  - after resolving the target path, `buildSyncPlan(...)` now rejects existing non-file paths with `Sync target must be a file: ...`
  - existing write-side preflight and in-loop guards remain as defense in depth
- First GREEN verifier run hit `TypeError: assert.equal is not a function` because the verifier file uses a local boolean-only `assert(...)`; changed that assertion to the existing local style.
- Fresh verification passed:
  - `npm run verify:companion`
  - `npm run verify:electron-companion-ipc-module`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-09 - Phase 210 Companion mobile inbox processed move atomicity guard
- Continued fast batch mode after Phase 209 and stayed on Companion mobile inbox filesystem integrity.
- Root cause:
  - `importMobileInbox(...)` parsed the inbox file and immediately pushed the created capture item into `items`
  - only after that did it move the source file into `_processed`
  - if the `_processed` move failed, the catch block reported an error and moved the file to `_failed`, but the already-pushed item remained in the successful return list
  - this made a failed import look partially successful and could let downstream sync act on a capture whose source file was actually routed to `_failed`
- Added focused RED coverage to `electron/obsidianCompanion.verify.ts`:
  - creates a real mobile inbox file
  - temporarily patches `fs.renameSync` to throw only for `_processed` destinations while allowing `_failed` destinations
  - asserts import fails, returns zero items, reports the move error, and moves the file to `_failed`
- Confirmed RED with `npm run verify:companion` failing because the failed processed move still returned one item.
- Updated `electron/obsidianCompanion.ts`:
  - builds the `CaptureItem` as a local object
  - moves the source file to `_processed`
  - appends the item to `items` only after the move succeeds
  - existing catch behavior continues to report errors and route failed files to `_failed`
- Fresh verification passed:
  - `npm run verify:companion`
  - `npm run verify:electron-companion-ipc-module`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; Phase 209 just ran both and Phase 210 changed only local Companion runtime/test logic.

## 2026-07-09 - Phase 211 Companion mobile inbox failed move structured error guard
- Continued fast batch mode after Phase 210.
- Root cause:
  - `importMobileInbox(...)` already caught parse/content/processed-move failures and attempted to route the file to `_failed`
  - but the `_failed` fallback move itself was not protected
  - if both `_processed` and `_failed` moves failed, `fs.renameSync(...)` inside the catch block threw and escaped the import API
  - this violated the importer contract used by UI/IPC callers: import should return `{ ok, items, errors }`, not throw for per-file move failures
- Added focused RED coverage to `electron/obsidianCompanion.verify.ts`:
  - creates a real inbox file
  - temporarily patches `fs.renameSync` to throw for both `_processed` and `_failed` destinations
  - asserts import does not throw, returns `ok: false`, returns no items, and reports both move errors
- Confirmed RED with `npm run verify:companion` failing because the fallback `_failed` move escaped.
- Updated `electron/obsidianCompanion.ts`:
  - wrapped the fallback `_failed` move in its own try/catch
  - appends fallback move errors to the structured `errors` array
  - preserves Phase 210 behavior: failed captures are not appended to successful `items`
- Fresh verification passed:
  - `npm run verify:companion`
  - `npm run verify:electron-companion-ipc-module`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; Phase 209 just ran both and Phase 211 changed only local Companion error handling/test logic.

## 2026-07-09 - Phase 212 Companion mobile inbox root stat structured error guard
- Continued fast batch mode after Phase 211.
- Initially inspected the suggested AI Review daily-runner sourceChars seam, but current runtime already returns a structured inspection failure before the later sourceChars read when the daily note path is directory-backed; no code change was made there.
- Found a remaining Companion mobile inbox root-validation gap:
  - `importMobileInbox(...)` returned structured failures for missing and file-backed inbox paths
  - but after `fs.existsSync(inboxPath)`, it called `fs.statSync(inboxPath).isDirectory()` without protection
  - if the inbox root disappeared between checks, was blocked, or stat failed, the importer could throw before returning `{ ok, items, errors }`
- Added focused RED coverage to `electron/obsidianCompanion.verify.ts`:
  - creates a temp inbox with a pending file
  - temporarily patches `fs.statSync` to throw only for the inbox root
  - asserts import does not throw, returns `ok: false`, reports the stat failure, and leaves the pending file in place
- Confirmed RED with `npm run verify:companion` failing because the stat error escaped.
- Updated `electron/obsidianCompanion.ts`:
  - wrapped the root `fs.statSync(inboxPath).isDirectory()` check in try/catch
  - stat failures now return `{ ok: false, items: [], errors: [message] }`
  - `_processed` / `_failed` setup and file moves do not start after a root validation failure
- Fresh verification passed:
  - `npm run verify:companion`
  - `npm run verify:electron-companion-ipc-module`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-09 - Phase 213 Companion mobile inbox destination race no-overwrite guard
- Continued fast batch mode after Phase 212.
- Investigated the recommended `getUniqueDestination(...)` seam in `electron/obsidianCompanion.ts`.
- Root cause:
  - `getUniqueDestination(...)` checked `fs.existsSync(candidate)` and returned the first currently-free path
  - `importMobileInbox(...)` then passed that path to `fs.renameSync(...)`
  - if another process or stale filesystem result made the destination appear between those two operations, `renameSync(...)` could overwrite an existing processed/failed capture destination
- Added focused RED coverage to `electron/obsidianCompanion.verify.ts`:
  - pre-creates `_processed/note.txt` with existing content
  - temporarily makes `fs.existsSync(...)` return false for that collision path to simulate stale uniqueness checking
  - freezes `Date.now()` for deterministic retry naming
  - asserts import succeeds, preserves the existing processed file, and moves the new note to `note-424242-1.txt`
- Confirmed RED with `npm run verify:companion` failing because the existing processed destination was overwritten.
- Updated `electron/obsidianCompanion.ts`:
  - `getUniqueDestination(...)` now accepts a local reserved-destination set
  - added `moveToUniqueDestination(...)` which reserves a target with `fs.openSync(destination, 'wx')` before moving
  - if reservation fails with `EEXIST`, it records the raced destination and retries with the next unique name
  - both `_processed` and `_failed` moves now use the no-overwrite helper
- Fresh verification passed:
  - `npm run verify:companion`
  - `npm run verify:electron-companion-ipc-module`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; both passed in Phase 212 and Phase 213 changed only local Companion runtime/test logic.

## 2026-07-09 - Phase 214 Companion mobile inbox readdir structured error guard
- Continued fast batch mode after Phase 213.
- Root cause:
  - `importMobileInbox(...)` now validates the inbox root and processing directories structurally
  - but it still called `fs.readdirSync(inboxPath, { withFileTypes: true })` directly before entering per-file error handling
  - if enumeration failed due to a race, permission issue, or filesystem error, the importer threw instead of returning its structured `{ ok, items, errors }` shape
- Added focused RED coverage to `electron/obsidianCompanion.verify.ts`:
  - creates a temp inbox with a pending file
  - temporarily patches `fs.readdirSync` to throw only for the inbox root
  - asserts import does not throw, returns `ok: false`, reports the enumeration failure, and leaves the pending file in place
- Confirmed RED with `npm run verify:companion` failing because the readdir error escaped.
- Updated `electron/obsidianCompanion.ts`:
  - wraps the inbox `fs.readdirSync(...)` file enumeration in try/catch
  - enumeration failures now return `{ ok: false, items: [], errors: [message] }`
  - file read/parse/move work starts only after enumeration succeeds
- Fresh verification passed:
  - `npm run verify:companion`
  - `npm run verify:electron-companion-ipc-module`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; both passed in Phase 212 and Phase 214 changed only local Companion runtime/test logic.

## 2026-07-09 - Phase 215 Companion mobile inbox reservation cleanup error preservation guard
- Continued fast batch mode after Phase 214.
- Root cause:
  - Phase 213 added no-overwrite destination reservation before `fs.renameSync(...)`
  - if the move failed, `moveToUniqueDestination(...)` tried to remove the reserved placeholder
  - if that cleanup also failed, the cleanup exception replaced the original move failure in the caller's structured `errors` array
  - this made diagnosis worse because callers could lose the primary `_processed` move failure that caused the fallback path
- Added focused RED coverage to `electron/obsidianCompanion.verify.ts`:
  - creates a real inbox file
  - patches `fs.renameSync` to fail for `_processed` destinations
  - patches `fs.rmSync` to fail for `_processed` reservation cleanup
  - asserts import returns structured failure, returns no items, reports both the original move failure and cleanup failure, and still routes the source file to `_failed`
- Confirmed RED with `npm run verify:companion` failing because the original processed move failure was hidden.
- Updated `electron/obsidianCompanion.ts`:
  - the reservation cleanup path now catches cleanup failures
  - it throws a combined error containing both the original move failure and `reservation cleanup failed: ...`
  - ordinary move failures without cleanup errors still behave as before
- Fresh verification passed:
  - `npm run verify:companion`
  - `npm run verify:electron-companion-ipc-module`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-09 - Phase 216 Companion mobile inbox reservation close cleanup guard
- Continued fast batch mode after Phase 215.
- Root cause:
  - Phase 213 added exclusive destination reservation with `fs.openSync(destination, 'wx')` before moving inbox files.
  - `reserveFilePath(...)` then called `fs.closeSync(descriptor)` directly.
  - If `closeSync(...)` failed after the placeholder was created, the error propagated, but the placeholder file could remain in `_processed`.
  - The importer then routed the original source file to `_failed`, leaving a misleading empty/reserved processed destination behind.
- Added focused RED coverage to `electron/obsidianCompanion.verify.ts`:
  - creates a real inbox file
  - patches `fs.openSync` to track reserved paths
  - patches `fs.closeSync` to close the descriptor and then throw for `_processed` reservations
  - asserts import returns a structured failure, returns no items, reports the close failure, routes the source to `_failed`, and removes the processed placeholder
- Confirmed RED with `npm run verify:companion` failing because the reserved `_processed/note.txt` placeholder remained.
- Updated `electron/obsidianCompanion.ts`:
  - `reserveFilePath(...)` now wraps `fs.closeSync(...)`
  - on close failure it removes the just-created placeholder with `fs.rmSync(filePath, { force: true })`
  - if cleanup also fails, the thrown error includes both the close failure and `reservation cleanup failed: ...`
- Fresh verification passed:
  - `npm run verify:companion`
  - `npm run verify:electron-companion-ipc-module`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; both passed in Phase 215 and Phase 216 changed only local Companion runtime/test logic.

## 2026-07-09 - Phase 217 AI Review daily runner sourceChars structured failure guard
- Continued fast batch mode after Phase 216 and deliberately switched away from Companion to avoid overfitting one module.
- Root cause:
  - `inspectDailyAiContent(...)` already catches daily-note read failures and converts them into a structured inspection failure.
  - After inspection, `runReviewForDate(...)` checked `fs.existsSync(filePath)` and then called `fs.readFileSync(filePath, 'utf-8').length` directly to compute `sourceChars`.
  - If the file disappeared, became unreadable, or otherwise failed between inspection and source character counting, the daily runner threw instead of returning its diagnostic result shape.
- Added focused RED runtime coverage to `scripts/verify-electron-ai-review-daily-runner-module.ts`:
  - creates a temp daily note
  - patches `fs.readFileSync` so the inspection read succeeds but the second daily-note read throws `simulated sourceChars read failure`
  - asserts `runReviewForDate(...)` does not throw, returns `ok: false`, reports the error, marks `prepareMaterials` failed, and produces a `noSourceMaterials` diagnostic
- Confirmed RED with `npm run verify:electron-ai-review-daily-runner-module` failing because the error escaped.
- Updated `electron/aiReviewDailyRunner.ts`:
  - wraps the source character counting read in try/catch
  - on failure, emits failed `prepareMaterials` progress, appends a failed diagnostic stage, and returns a structured no-source-materials result
  - successful runs still compute and pass `sourceChars` as before
- Fresh verification passed:
  - `npm run verify:electron-ai-review-daily-runner-module`
  - `npm run verify:electron-ai-review-daily-run-inspect-ipc-module`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; both passed in Phase 215 and Phase 217 changed local AI Review runner/test code only.

## 2026-07-09 - Phase 218 AI Review atomic replace temp cleanup guard
- Continued fast batch mode after Phase 217 and targeted the shared AI Review atomic-write helper.
- Root cause:
  - `atomicReplace(...)` writes next content to a same-directory temp file named `<target>.tmp-<pid>`.
  - It then calls `fs.renameSync(tmp, filePath)` for atomic replacement.
  - If replacement fails after the tmp write, the function returns `{ ok: false }`, but the tmp file can remain in the report/daily-note directory.
  - Leftover tmp files are clutter at best and can confuse future filesystem scans or manual user inspection.
- Added focused RED coverage to `scripts/verify-atomic-write.ts`:
  - requires the `atomicReplace(...)` failure path to remove the temporary file when replacement fails
  - initial monkey-patch attempt did not trigger the module-local `fs.renameSync` binding, so I switched to a focused source-level guard for this helper's cleanup invariant
- Confirmed RED with `npm run verify:atomic-write` failing because the cleanup path was absent.
- Updated `electron/aiReview/atomicWrite.ts`:
  - tracks `tmp` outside the try block
  - assigns it before writing the temp file
  - removes it with `fs.rmSync(tmp, { force: true })` in the catch path before returning the structured error
- Fresh verification passed:
  - `npm run verify:atomic-write`
  - `npm run verify:export-reports`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-09 - Phase 219 Obsidian template picker file-only guard
- Continued fast batch mode after Phase 218.
- Root cause:
  - `obsidianTemplate:pickTemplateFile` opens an Electron file picker, but still receives a raw filesystem path from the OS/dialog boundary.
  - The handler computed `fileName` and immediately called `fs.readFileSync(filePath, 'utf-8').trim()`.
  - If the selected path is a directory/non-file due to OS quirks, symlink/path changes, or a malformed caller boundary, the handler returns a low-level read error instead of a clear file-shape refusal.
- Added focused RED coverage to `scripts/verify-electron-obsidian-ipc-module.ts` requiring `fs.statSync(filePath).isFile()` before template file reads.
- Confirmed RED with `npm run verify:electron-obsidian-ipc-module` failing because the guard was absent.
- Updated `electron/obsidianIpc.ts`:
  - template picker now checks `fs.statSync(filePath).isFile()` inside the existing try/catch
  - non-file selected template paths return `{ ok: false, error: zh('Template path must be a file.') }`
  - empty-file and successful text return behavior are unchanged
- Fresh verification passed:
  - `npm run verify:electron-obsidian-ipc-module`
  - `npm run verify:electron-main-window-bootstrap-module`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; both passed in Phase 218 and this phase changed local Obsidian IPC/test logic only.

## 2026-07-09 - Phase 220 AI Review atomic replace cleanup error preservation guard
- Continued fast batch mode after Phase 219 and stayed on the atomic-write helper for one adjacent cleanup edge.
- Root cause:
  - Phase 218 made `atomicReplace(...)` remove tmp files in the catch path.
  - But a cleanup failure from `fs.rmSync(tmp, { force: true })` would itself throw inside the catch path.
  - That could mask the original write/rename failure, making the structured returned error less useful or potentially escaping the intended failure shape.
- Added focused RED coverage to `scripts/verify-atomic-write.ts` requiring source-level preservation of the original replacement error when temporary cleanup also fails.
- Confirmed RED with `npm run verify:atomic-write` failing because `temporary cleanup failed` preservation was absent.
- Updated `electron/aiReview/atomicWrite.ts`:
  - wraps tmp cleanup in its own try/catch
  - stores cleanup failure text separately
  - returns the original error plus `temporary cleanup failed: ...` when cleanup also fails
  - returns the original error unchanged when cleanup succeeds or no tmp exists
- Fresh verification passed:
  - `npm run verify:atomic-write`
  - `npm run verify:export-reports`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; both passed in Phase 218 and this phase changed local atomic-write/test logic only.

## 2026-07-09 - Phase 221 Electron vault path store type guard
- Continued fast batch mode after Phase 220 and targeted the high-frequency vault-status entry point.
- Root cause:
  - `getVaultPath()` cast `store.get('obsidianVaultPath')` directly to `string | undefined`.
  - If the persisted store value was malformed/non-string, that value could become the active vault path.
  - In current Node this produced a deprecation warning when passed to `fs.existsSync(...)`; future Node versions may throw, and the active vault path API should not expose objects as paths.
- Added focused RED coverage to `scripts/verify-electron-app-state-accessors-module.ts`:
  - simulates `store.get('obsidianVaultPath')` returning an object
  - asserts `getVaultStatus()` does not throw
  - asserts `getVaultPath()` does not return the malformed object as the active vault path
- First verifier run did not fail because current `fs.existsSync(object)` only warned; tightened RED to assert `getVaultPath()` returns `''` for malformed stored values.
- Confirmed RED with `npm run verify:electron-app-state-accessors-module` failing because the object was returned.
- Updated `electron/appStateAccessors.ts`:
  - `getVaultPath()` now reads the raw stored value
  - only `typeof storedPath === 'string'` is accepted
  - malformed values fall back to `getDefaultVaultPath()` / empty string
- Fresh verification passed:
  - `npm run verify:electron-app-state-accessors-module`
  - `npm run verify:electron-main-modules`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; both passed in Phase 218 and this phase changed local app-state accessor/test logic only.

## 2026-07-09 - Phase 222 Companion settings store normalization guard
- Continued fast batch mode after Phase 221 and stayed on store-boundary hardening.
- Root cause:
  - `getCompanionSettings()` only checked `existing && typeof existing === 'object'` and then returned it as `CompanionSettings`.
  - A malformed persisted value such as `{ vaultPath: 123, rules: 'not-rules' }` could therefore reach renderer state, Companion IPC, preview, and write planning.
  - TypeScript casts did not protect the runtime store boundary.
- Added focused RED coverage to `scripts/verify-electron-app-state-accessors-module.ts`:
  - simulates malformed `obsidianCompanionSettings` fields for paths, preset id, sync mode, preview flag, rules, and templates
  - asserts returned Companion settings are normalized back to valid string/boolean/array/default values
- Confirmed RED with `npm run verify:electron-app-state-accessors-module` failing because malformed values were returned unchanged.
- Updated `electron/appStateAccessors.ts`:
  - added local `normalizeCompanionSettings(value, vaultPath)`
  - non-object or array values fall back to `createDefaultCompanionSettings(vaultPath)`
  - string fields accept strings only
  - `syncMode` accepts only `manual`, `on-change`, or `interval`
  - `previewBeforeWrite` accepts booleans only
  - `rules` and `templates` must be arrays, otherwise default arrays are restored
- Fresh verification passed:
  - `npm run verify:electron-app-state-accessors-module`
  - `npm run verify:electron-companion-ipc-module`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-09 - Phase 223 Companion settings setter normalization guard
- Continued fast batch mode after Phase 222 and closed the matching write-side Companion settings boundary.
- Root cause:
  - Phase 222 normalized `getCompanionSettings()` reads, but `setCompanionSettings(value)` still wrote whatever it received directly to Electron Store.
  - Because the renderer-facing preload accepts `unknown`, malformed IPC/caller input could persist bad path/rule/template shapes and force every later read to repair the same dirty value again.
- Added focused RED coverage to `scripts/verify-electron-app-state-accessors-module.ts`:
  - calls `setCompanionSettings(...)` with malformed path, sync mode, preview flag, rules, and templates values
  - captures the value passed to `store.set('obsidianCompanionSettings', value)`
  - asserts the persisted value has normalized strings, default manual sync mode, boolean preview flag, and rules/templates arrays
- Confirmed RED with `npm run verify:electron-app-state-accessors-module` failing because the malformed number vaultPath was persisted unchanged.
- Updated `electron/appStateAccessors.ts`:
  - `setCompanionSettings(...)` now writes `normalizeCompanionSettings(value, getVaultPath())`
  - read-side and write-side Companion settings normalization now share one local normalizer
- Fresh verification passed:
  - `npm run verify:electron-app-state-accessors-module`
  - `npm run verify:electron-companion-ipc-module`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; both passed in Phase 222 and this phase changed local app-state accessor/test logic only.

## 2026-07-09 - Phase 224 Companion settings rules/templates element guard
- Continued fast batch mode after Phase 223 and tightened the Companion settings normalizer one layer deeper.
- Root cause:
  - Phase 222/223 required `rules` and `templates` to be arrays, but did not validate the elements inside those arrays.
  - Malformed elements such as `{ id: 123, write: null }` or `{ id: 456, body: null }` could still pass through as arrays and later break Companion planning when code reads `rule.write.templateId` or `template.body`.
- Added focused RED coverage to `scripts/verify-electron-app-state-accessors-module.ts`:
  - simulates store-loaded Companion settings with array-shaped but malformed rule/template elements
  - asserts returned rules/templates contain valid default-shaped objects with string IDs/names/bodies and valid rule write targets/template IDs
- Confirmed RED with `npm run verify:electron-app-state-accessors-module` failing because malformed rule elements were accepted.
- Updated `electron/appStateAccessors.ts`:
  - imports `CompanionRule` and `CompanionTemplate` types
  - adds `isObject(...)`, `isCompanionTemplate(...)`, and `isCompanionRule(...)`
  - `normalizeCompanionSettings(...)` now accepts rule/template arrays only when every element has the expected runtime shape; otherwise defaults are restored
- Fresh verification passed:
  - `npm run verify:electron-app-state-accessors-module`
  - `npm run verify:electron-companion-ipc-module`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-09 - Phase 225 Companion rule condition string array guard
- Continued fast batch mode after Phase 224 and tightened Companion rule validation inside the settings normalizer.
- Root cause:
  - Phase 224 validated that rule elements had top-level shape and `write` shape.
  - But `when.tagsAny`, `when.tagsAll`, and `when.containsAny` could still be arrays containing non-string values.
  - `matchesRule(...)` later calls string methods such as `.replace(...)` / `.toLowerCase()` on those condition entries, so malformed persisted rule conditions could still crash planning/matching.
- Added focused RED coverage to `scripts/verify-electron-app-state-accessors-module.ts`:
  - simulates store-loaded Companion settings with a valid-looking rule object whose `when.tagsAny` contains a number
  - asserts normalized rules do not expose non-string tag entries to `matchesRule(...)`
- Confirmed RED with `npm run verify:electron-app-state-accessors-module` failing because the malformed condition array was accepted.
- Updated `electron/appStateAccessors.ts`:
  - added `isOptionalStringArray(...)`
  - `isCompanionRule(...)` now validates optional `when.type`, `when.priority`, `when.source`, `tagsAny`, `tagsAll`, and `containsAny`
  - malformed condition arrays now cause the rules array to fall back to defaults
- Fresh verification passed:
  - `npm run verify:electron-app-state-accessors-module`
  - `npm run verify:electron-companion-ipc-module`
  - `npm run typecheck`
- Deferred `npm run build` per fast batch mode; build passed in Phase 224 and this phase changed local app-state accessor/test logic only.

## 2026-07-09 - Phase 226 Companion buildSyncPlan runtime settings collection guard
- Continued fast batch mode after Phase 225 and moved from persisted store normalization to the runtime Companion planner/IPC boundary.
- Root cause:
  - Store reads/writes now normalize Companion settings, but `companion:previewSync` and `companion:writeSync` still pass renderer-provided runtime settings into `buildSyncPlan(...)`.
  - `buildSyncPlan(...)` immediately constructed `new Map(settings.templates.map(...))` and sorted `settings.rules`.
  - If runtime settings had malformed `rules` or `templates` collections, the planner threw before returning its structured `SyncPlan` shape.
- Added focused RED coverage to `electron/obsidianCompanion.verify.ts`:
  - calls `buildSyncPlan(...)` directly with `rules: 'not-rules'` and `templates: null`
  - asserts the planner does not throw
  - asserts the result is `ok: false`, has no changes, and reports a rules/templates/settings error
- Confirmed RED with `npm run verify:companion` failing because the planner threw.
- Updated `electron/obsidianCompanion.ts`:
  - `buildSyncPlan(...)` now checks runtime settings object and collection shape before constructing template maps or sorted rules
  - malformed `rules/templates` collections return `{ ok: false, changes: [], unmatchedItems, errors }`
  - valid settings continue through the existing planning path
- Fresh verification passed:
  - `npm run verify:companion`
  - `npm run verify:electron-companion-ipc-module`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; typecheck passed in Phase 225 and build passed in Phase 224.
## 2026-07-09 - Phase 227 Companion buildSyncPlan runtime rule/template element guard
- Finished the Phase 227 handoff item and closed the deeper runtime Companion planner boundary.
- Root cause:
  - Phase 226 verified `settings.rules` and `settings.templates` were arrays, but array-shaped runtime payloads could still contain malformed elements.
  - `buildSyncPlan(...)` would then sort/read those elements and could throw when fields such as `rule.write.templateId` or template metadata were missing or malformed.
- Focused RED coverage in `electron/obsidianCompanion.verify.ts` now passes malformed runtime rule/template elements into `buildSyncPlan(...)` and asserts no throw, no changes, and a structured settings/rule/template error.
- Updated `electron/obsidianCompanion.ts`:
  - added runtime guards for Companion rule/template elements at the planner entry point
  - malformed rule/template arrays now return a structured failed `SyncPlan` with no changes instead of escaping as exceptions
- Fresh verification passed:
  - `npm run verify:companion`
  - `npm run verify:electron-companion-ipc-module`
  - `npm run typecheck`
  - `npm run build`
## 2026-07-09 - Phase 228 Companion buildSyncPlan runtime capture item guard
- Continued fast batch mode after Phase 227 and closed the next Companion runtime planner input boundary.
- Root cause:
  - `buildSyncPlan(settings, items)` was reachable from preview/write flows with renderer-provided runtime items.
  - The planner assumed every item had `content`, `tags`, `source`, `status`, and date fields in the `CaptureItem` shape.
  - A malformed item such as `{ tags: [123] }` could lead to unclear downstream string-method/template errors rather than a structured input-boundary failure.
- Added focused RED coverage to `electron/obsidianCompanion.verify.ts`:
  - calls `buildSyncPlan(...)` with a capture item whose `tags` array contains a number
  - asserts the planner does not throw, returns `ok: false`, emits no changes, and reports a capture/item error
- Confirmed RED with `npm run verify:companion` failing because the returned error did not identify malformed capture/items.
- Updated `electron/obsidianCompanion.ts`:
  - added `isCaptureItem(...)` and `isOptionalStringRecord(...)`
  - `buildSyncPlan(...)` now rejects non-array or malformed runtime items before matching/rendering
  - malformed runtime captures return a structured failed `SyncPlan` with no changes
- Fresh verification passed:
  - `npm run verify:companion`
  - `npm run verify:electron-companion-ipc-module`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; both passed in Phase 227 and this phase changed local Companion planner/test logic only.
## 2026-07-09 - Phase 229 Obsidian sync runtime tasks array guard
- Continued fast batch mode after Phase 228 and moved from Companion runtime boundaries to Obsidian sync/preview IPC-facing input.
- Root cause:
  - `syncTasksToObsidian(...)` and `previewTasksToObsidian(...)` accept renderer-provided task arrays through `obsidian:syncTasks` / `obsidian:previewTasks`.
  - Both functions called `getDatesAffectedBySync(tasks, selected, beforeTasks)` before their main try/catch blocks.
  - If runtime `tasks` or `beforeTasks` was not an array, `collectAffectedSyncDates(...).forEach(...)` could throw before returning the structured failure shape expected by IPC/UI.
- Added focused RED coverage to `scripts/verify-settings-sync.ts`:
  - calls `syncTasksToObsidian({ not: 'tasks' } as never, ...)`
  - calls `previewTasksToObsidian('not-tasks' as never, ...)`
  - asserts neither throws and both report task/array errors without emitting preview files/counts
- Confirmed RED with `npm run verify:settings-sync` failing because sync threw for non-array tasks.
- Updated `electron/obsidianSync.ts`:
  - `syncTasksToObsidian(...)` now rejects non-array `tasks` / `beforeTasks` with `{ ok: false, reason }`
  - `previewTasksToObsidian(...)` now rejects non-array task inputs with an empty preview and clear error
- Fresh verification passed:
  - `npm run verify:settings-sync`
  - `npm run verify:electron-obsidian-sync-module`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; both passed in Phase 227 and this phase changed a local runtime guard plus focused verifier.
## 2026-07-09 - Phase 230 Obsidian sync runtime task element guard
- Continued fast batch mode after Phase 229 and tightened the Obsidian sync/preview task boundary from collection shape to element shape.
- Root cause:
  - Phase 229 guarded non-array `tasks` / `beforeTasks`, but array-shaped runtime payloads could still contain malformed entries.
  - A task entry with `subtasks: 'not-subtasks'` reached `collectAffectedSyncDates(...)`, which used `(task.subtasks || []).forEach(...)` before structured sync/preview failure handling.
  - Similar malformed completion review arrays could also break affected-date derivation or preview counting.
- Added focused RED coverage to `scripts/verify-settings-sync.ts`:
  - calls `syncTasksToObsidian([{ ...baseTask, subtasks: 'not-subtasks' }] as never, ...)`
  - calls `previewTasksToObsidian(...)` with the same malformed task entry
  - asserts neither throws, sync returns `{ ok: false }`, preview emits no files/counts, and errors mention malformed tasks
- Confirmed RED with `npm run verify:settings-sync` failing because sync threw for malformed task entries.
- Updated `electron/obsidianSync.ts`:
  - added recursive `isObsidianSyncTask(...)` validation
  - validates core task fields, optional string fields, completion review shape, completion review arrays, and nested subtasks
  - sync/preview now reject malformed task arrays before date derivation, preview building, filesystem writes, or AI review triggering
- Fresh verification passed:
  - `npm run verify:settings-sync`
  - `npm run verify:electron-obsidian-sync-module`
  - `npm run typecheck`
  - `npm run build`
## 2026-07-09 - Phase 231 Obsidian sync runtime daily section scalar guard
- Continued fast batch mode after Phase 230 and tightened scalar renderer inputs for Obsidian sync/preview.
- Root cause:
  - Task collection and element shape were now guarded, but `dailyWork` and `inspiration` still accepted runtime values from IPC without type checks.
  - These values are later passed into daily-note template/block builders that assume strings and call string methods such as `.trim()`.
  - Preview could accept a malformed `inspiration` array and still emit a file preview, which is not a fail-closed runtime boundary.
- Added focused RED coverage to `scripts/verify-settings-sync.ts`:
  - calls `syncTasksToObsidian([], date, { text: 'not daily work' } as never, '')`
  - calls `previewTasksToObsidian([], date, '', ['not inspiration'] as never)`
  - asserts neither throws, sync returns a structured failure, no daily note file is written, preview emits no files, and errors mention string dailyWork/inspiration input
- Confirmed RED with `npm run verify:settings-sync` failing because malformed preview `inspiration` still emitted a preview file.
- Updated `electron/obsidianSync.ts`:
  - sync now rejects non-string `dailyWork` / `inspiration` with `{ ok: false, reason }`
  - preview now rejects the same malformed scalar inputs with an empty preview and clear error
- Fresh verification passed:
  - `npm run verify:settings-sync`
  - `npm run verify:electron-obsidian-sync-module`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; both passed in Phase 230 and this phase changed local runtime guards plus focused verifier.
## 2026-07-09 - Phase 232 Obsidian sync runtime date scalar guard
- Continued fast batch mode after Phase 231 and tightened the selected-date runtime boundary for Obsidian sync/preview.
- Root cause:
  - `syncTasksToObsidian(...)` and `previewTasksToObsidian(...)` accepted `date?: string` at the TypeScript level, but IPC/runtime input can still be non-string.
  - A non-string selected date could be passed to `getDateKey(...)` and then path/template expansion, producing misleading paths or even successful sync output for malformed input.
- Added focused RED coverage to `scripts/verify-settings-sync.ts`:
  - calls `syncTasksToObsidian([], { date: '2026-05-31' } as never)`
  - calls `previewTasksToObsidian([], ['2026-05-31'] as never)`
  - asserts neither throws, sync returns a structured failure, preview emits no files, no malformed daily note is written, and errors mention date/string input
- Confirmed RED with `npm run verify:settings-sync` failing because malformed sync `date` returned `ok: true`.
- Updated `electron/obsidianSync.ts`:
  - sync now rejects non-string `date` with `{ ok: false, reason }`
  - preview now rejects non-string `date` with an empty preview and clear error
- Fresh verification passed:
  - `npm run verify:settings-sync`
  - `npm run verify:electron-obsidian-sync-module`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; both passed in Phase 230 and this phase changed local runtime guards plus focused verifier.
## 2026-07-09 - Phase 233 Obsidian openDailyNote runtime date guard
- Continued fast batch mode after Phase 232 and applied the same selected-date runtime boundary to `obsidian:openDailyNote`.
- Root cause:
  - Phase 232 guarded selected-date input inside Obsidian sync/preview helpers.
  - `obsidian:openDailyNote` still accepted runtime `date?: string` directly from IPC and called `getDateKey(date)` / `getDailyFilePath(selected)` before validating the runtime type.
  - Because the selected date shapes the daily-note path and file creation, this boundary should fail closed for malformed IPC values.
- Added focused RED coverage to `scripts/verify-electron-obsidian-ipc-module.ts`:
  - structurally requires a `date !== undefined && typeof date !== 'string'` guard in the `obsidian:openDailyNote` handler before `getDateKey(date)`
- Confirmed RED with `npm run verify:electron-obsidian-ipc-module` failing because no guard existed.
- Updated `electron/obsidianIpc.ts`:
  - `obsidian:openDailyNote` now returns `{ ok: false, reason: zh('Selected date input must be a string.') }` for non-string runtime dates
  - valid string/undefined dates continue through the existing vault-status, file-only, bootstrap, overview, and shell-open path
- Fresh verification passed:
  - `npm run verify:electron-obsidian-ipc-module`
  - `npm run verify:electron-main-window-bootstrap-module`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; both passed in Phase 230 and this phase changed local IPC guard plus focused verifier.
## 2026-07-09 - Phase 234 Obsidian IPC daily section forwarding guard
- Continued fast batch mode after Phase 233 and closed a small IPC forwarding bypass created by JavaScript truthiness defaults.
- Root cause:
  - Phase 231 added runtime validators inside Obsidian sync/preview helpers for non-string `dailyWork` / `inspiration`.
  - But `obsidian:syncTasks` and `obsidian:previewTasks` forwarded `dailyWork || ''` and `inspiration || ''`.
  - This meant falsy malformed runtime values such as `false`, `0`, or `null` could be converted to `''` before validators saw them.
- Added focused RED coverage to `scripts/verify-electron-obsidian-ipc-module.ts`:
  - asserts IPC no longer forwards `dailyWork || ''` / `inspiration || ''`
  - asserts forwarding defaults only `undefined` values and preserves other runtime values for downstream validation
- Confirmed RED with `npm run verify:electron-obsidian-ipc-module` failing because the truthiness fallback was still present.
- Updated `electron/obsidianIpc.ts`:
  - sync forwarding now uses `dailyWork === undefined ? '' : dailyWork`
  - preview forwarding now uses the same explicit undefined-only default
- Fresh verification passed:
  - `npm run verify:electron-obsidian-ipc-module`
  - `npm run verify:electron-main-window-bootstrap-module`
  - `npm run typecheck`
  - `npm run build`
## 2026-07-09 - Phase 235 Companion IPC items forwarding guard
- Continued fast batch mode after Phase 234 and closed the same truthiness-default bypass on Companion preview/write IPC.
- Root cause:
  - Phase 228 added runtime `CaptureItem[]` validation inside `buildSyncPlan(...)`.
  - But `companion:previewSync` and `companion:writeSync` forwarded `items || []`.
  - Falsy malformed runtime values such as `null`, `false`, or `0` could therefore become `[]` before the planner validator saw them, silently producing an empty plan instead of a malformed-items failure.
- Added focused RED coverage to `scripts/verify-electron-companion-ipc-module.ts`:
  - asserts Companion IPC no longer calls `buildSyncPlan(settings, items || [])`
  - asserts preview/write forwarding defaults only `undefined` items and preserves other runtime values for planner validation
- Confirmed RED with `npm run verify:electron-companion-ipc-module` failing because `items || []` was still present.
- Updated `electron/companionIpc.ts`:
  - preview forwarding now uses `items === undefined ? [] : items`
  - write forwarding now uses the same explicit undefined-only default before `writeSyncPlan(...)`
- Fresh verification passed:
  - `npm run verify:electron-companion-ipc-module`
  - `npm run verify:companion`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; both passed in Phase 234 and this phase changed a local IPC forwarding guard plus focused verifier.
## 2026-07-09 - Phase 236 Companion mobile inbox runtime path guard
- Continued fast batch mode after Phase 235 and tightened the Companion mobile inbox path boundary.
- Root cause:
  - `companion:importMobileInbox` accepts runtime IPC input and forwards it to `importMobileInbox(inboxPath)`.
  - `importMobileInbox(...)` typed `inboxPath` as string but immediately evaluated `!inboxPath || !fs.existsSync(inboxPath)`.
  - A non-string runtime value could therefore reach filesystem APIs; Node 25 emits a deprecation warning for invalid `fs.existsSync(...)` arguments, and future runtimes may hard-fail.
- Added focused RED coverage to `electron/obsidianCompanion.verify.ts`:
  - monkey-patches `fs.existsSync` to throw if it receives the malformed runtime object
  - calls `importMobileInbox({ path: 'not-a-string' } as never)`
  - asserts no throw, no items, and a path/string structured error
- Confirmed RED with `npm run verify:companion` failing because the malformed path reached `fs.existsSync(...)`.
- Updated `electron/obsidianCompanion.ts`:
  - `importMobileInbox(...)` now rejects non-string `inboxPath` values before any filesystem call
  - valid string paths continue through existing missing path, directory, setup, enumeration, and per-file handling
- Fresh verification passed:
  - `npm run verify:companion`
  - `npm run verify:electron-companion-ipc-module`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; both passed in Phase 234 and this phase changed local runtime guard plus focused verifier.
## 2026-07-09 - Phase 237 Obsidian template recognition input validation order guard
- Continued fast batch mode after Phase 236 and tightened the Obsidian template-recognition IPC boundary.
- Root cause:
  - `obsidianTemplate:recognize` accepted runtime `rawTemplate` input but checked `getAiReviewSettings()` and active API key before validating the input.
  - Empty or malformed template input could therefore return an AI configuration error instead of the precise template-input validation error.
  - Input validation should be the first boundary so malformed renderer data never reaches AI gating, LLM prompt construction, or model calls.
- Added focused RED coverage to `scripts/verify-electron-obsidian-ipc-module.ts`:
  - structurally requires `validateObsidianTemplateRecognitionInput(rawTemplate)` to appear before `getAiReviewSettings()` inside `obsidianTemplate:recognize`
- Confirmed RED with `npm run verify:electron-obsidian-ipc-module` failing because the current order was AI settings first.
- Updated `electron/obsidianIpc.ts`:
  - moved `const input = validateObsidianTemplateRecognitionInput(rawTemplate)` to the start of the handler
  - malformed/empty input now returns `{ ok: false, error, draft: null }` before AI settings/key checks
  - valid input continues through existing AI gating, LLM call, and draft parsing
- Fresh verification passed:
  - `npm run verify:electron-obsidian-ipc-module`
  - `npm run verify:obsidian-template-recognition`
  - `npm run typecheck`
  - `npm run build`
## 2026-07-09 - Phase 238 AI Review template recognition input validation order guard
- Continued fast batch mode after Phase 237 and applied the same input-first rule to AI Review template/tools recognition IPC.
- Root cause:
  - `aiReview:recognizeTemplate` and `aiReview:recognizeReportTemplate` accepted runtime `rawTemplate` input but checked AI settings and active API key before validating that input.
  - Empty or malformed template input could therefore return `AI_REVIEW_DISABLED_ERROR` instead of the precise template-required error.
  - Invalid renderer input should fail before AI settings reads, prompt building, or model calls.
- Added focused RED coverage to `scripts/verify-electron-ai-review-template-tools-ipc-module.ts`:
  - structurally requires the raw-template type/trim check to appear before `getAiReviewSettings()` in both recognition handlers
- Confirmed RED with `npm run verify:electron-ai-review-template-tools-ipc-module` failing because the report-template recognition handler still checked AI settings first.
- Updated `electron/aiReviewTemplateToolsIpc.ts`:
  - moved review-template `rawTemplate` validation before `getAiReviewSettings()`
  - moved report-template `rawTemplate` validation before `getAiReviewSettings()`
  - valid input continues through existing AI gating, LLM call, and parse paths
- Fresh verification passed:
  - `npm run verify:electron-ai-review-template-tools-ipc-module`
  - `npm run verify:electron-ai-review-ipc-module`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; both passed in Phase 237 and this phase changed local IPC ordering plus focused verifier.
## 2026-07-09 - Phase 239 AI Review template file picker file-only guard
- Continued fast batch mode after Phase 238 and tightened the AI Review template-file picker filesystem boundary.
- Root cause:
  - `aiReview:pickTemplateFile` uses an Electron open-file dialog, but runtime path selections should still be verified before filesystem reads.
  - The handler called `fs.readFileSync(filePath)` directly after reading the selected path.
  - Directory/special-path selections could therefore reach a file read and rely on low-level filesystem errors instead of a clear structured file-shape failure.
- Added focused RED coverage to `scripts/verify-electron-ai-review-template-tools-ipc-module.ts`:
  - requires `fs.statSync(filePath).isFile()` before `fs.readFileSync(filePath)` in the template-file picker path.
- Confirmed RED with `npm run verify:electron-ai-review-template-tools-ipc-module` failing because no file-only guard existed.
- Updated `electron/aiReviewTemplateToolsIpc.ts`:
  - selected template paths now return `{ ok: false, error: 'Template path must be a file.' }` if `statSync(...).isFile()` is false
  - valid files continue through existing `parseTemplateFile(...)` and docx extraction flow
- Fresh verification passed:
  - `npm run verify:electron-ai-review-template-tools-ipc-module`
  - `npm run verify:electron-ai-review-ipc-module`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; both passed in Phase 237 and this phase changed local filesystem guard plus focused verifier.

## 2026-07-09 - Phase 240 AI Review model-list runtime provider narrowing
- Continued fast batch mode after Phase 239 and tightened the AI Review model-list IPC provider boundary.
- Root cause:
  - `aiReview:listModels` accepted runtime IPC `cfg.provider` input but used `cfg?.provider ?? 'auto'`.
  - The TypeScript annotation said `LlmProvider | 'auto'`, but malformed renderer/runtime values could still pass through to `listModels(...)`.
  - Provider selection is control-flow data for provider-specific request behavior, so it should be narrowed at the IPC edge.
- Focused RED coverage in `scripts/verify-electron-ai-review-template-tools-ipc-module.ts` required removing the broad fallback and explicitly allowing only `openai`, `anthropic`, `gemini`, or `auto`.
- Confirmed RED with `npm run verify:electron-ai-review-template-tools-ipc-module` failing because `cfg?.provider ?? 'auto'` was still present.
- Updated `electron/aiReviewTemplateToolsIpc.ts`:
  - malformed runtime provider values now fall back to `auto`
  - valid provider values continue to reach `listModels(...)` unchanged
- Fresh verification passed:
  - `npm run verify:electron-ai-review-template-tools-ipc-module`
  - `npm run verify:electron-ai-review-ipc-module`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; both passed in Phase 237 and this phase changed a local IPC guard plus focused verifier.

## 2026-07-09 - Phase 241 AI Review template recognition malformed section guard
- Continued fast batch mode after Phase 240 and tightened the shared AI Review template-recognition parser boundary.
- Initial non-string `content` probe passed because the existing try/catch already turned non-string `.replace(...)` failures into fallback output; that probe remains as regression coverage but was not the actual RED.
- Root cause:
  - `parseRecognizedSections(...)` validated that parsed `sections` was an array, but not that every entry was object-shaped.
  - A model/runtime response like `{ "sections": [null], "confidence": "medium" }` reached `.map(...)` and threw while reading `raw.markerKey`.
  - LLM output is runtime data and malformed section entries should fall back to defaults rather than escaping as parser exceptions.
- Added focused RED coverage to `scripts/verify-recognize-template.ts` for malformed section entries.
- Confirmed RED with `npm run verify:recognize-template` failing on `Cannot read properties of null (reading 'markerKey')`.
- Updated `shared/aiReview/recognizeTemplate.ts`:
  - parsed section entries must now be non-array objects before mapping
  - malformed entry arrays return fallback sections with low confidence and `unmatched: true`
- Fresh verification passed:
  - `npm run verify:recognize-template`
  - `npm run verify:electron-ai-review-template-tools-ipc-module`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-09 - Phase 242 AI Review template picker runtime path type guard
- Continued fast batch mode after Phase 241 and tightened the AI Review template-file picker path boundary.
- Root cause:
  - `aiReview:pickTemplateFile` normally receives string paths from Electron's dialog, but runtime/mocked IPC boundaries can still provide malformed entries.
  - The handler derived `path.basename(filePath)` before entering the filesystem try/catch and before any runtime type check.
  - Non-string paths should produce a structured picker failure instead of escaping through path utilities.
- Added focused RED coverage to `scripts/verify-electron-ai-review-template-tools-ipc-module.ts` requiring a `typeof filePath !== 'string'` guard before `path.basename(filePath)`.
- Confirmed RED with `npm run verify:electron-ai-review-template-tools-ipc-module` failing because the guard was missing.
- Updated `electron/aiReviewTemplateToolsIpc.ts`:
  - selected paths must be strings before basename/stat/read handling
  - malformed selected paths now return `{ ok: false, error: 'Template path must be a string.' }`
- Fresh verification passed:
  - `npm run verify:electron-ai-review-template-tools-ipc-module`
  - `npm run verify:electron-ai-review-ipc-module`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; both passed in Phase 241 and this phase changed a local IPC guard plus focused verifier.

## 2026-07-09 - Phase 243 Obsidian template picker runtime path type guard
- Continued fast batch mode after Phase 242 and applied the same selected-path boundary to the Obsidian template picker.
- Root cause:
  - `obsidianTemplate:pickTemplateFile` normally receives string paths from Electron's dialog, but runtime/mocked IPC boundaries can still provide malformed entries.
  - The handler derived `path.basename(filePath)` before entering the filesystem try/catch and before any runtime type check.
  - Non-string paths should produce a structured picker failure instead of escaping through path utilities.
- Added focused RED coverage to `scripts/verify-electron-obsidian-ipc-module.ts` requiring a `typeof filePath !== 'string'` guard before `path.basename(filePath)`.
- Confirmed RED with `npm run verify:electron-obsidian-ipc-module` failing because the guard was missing.
- Updated `electron/obsidianIpc.ts`:
  - selected template paths must be strings before basename/stat/read handling
  - malformed selected paths now return `{ ok: false, error: zh('Template path must be a string.') }`
- Fresh verification passed:
  - `npm run verify:electron-obsidian-ipc-module`
  - `npm run verify:electron-main-window-bootstrap-module`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; both passed in Phase 241 and this phase changed a local IPC guard plus focused verifier.

## 2026-07-09 - Phase 244 Obsidian choosePath runtime path type guard
- Continued fast batch mode after Phase 243 and tightened the Obsidian vault-directory picker persistence boundary.
- Root cause:
  - `obsidian:choosePath` normally receives string paths from Electron's dialog, but runtime/mocked IPC boundaries can still provide malformed entries.
  - The handler wrote `result.filePaths[0]` directly to Electron Store and returned it to the renderer.
  - Store-backed path values should be string-only so malformed runtime path entries are not persisted.
- Added focused RED coverage to `scripts/verify-electron-obsidian-ipc-module.ts` requiring no raw `result.filePaths[0]` store write and explicit narrowing before `store.set(...)`.
- Confirmed RED with `npm run verify:electron-obsidian-ipc-module` failing because `store.set(obsidianPathKey, result.filePaths[0])` was still present.
- Updated `electron/obsidianIpc.ts`:
  - selected choose-path values must be strings before persistence
  - malformed selected paths now return the current/default vault path without writing to store
- Fresh verification passed:
  - `npm run verify:electron-obsidian-ipc-module`
  - `npm run verify:electron-main-window-bootstrap-module`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; both passed in Phase 241 and this phase changed a local IPC guard plus focused verifier.

## 2026-07-09 - Phase 245 Obsidian stored path return normalization guard
- Continued fast batch mode after Phase 244 and tightened stored Obsidian path reads exposed through IPC.
- Root cause:
  - `obsidian:getPath` and choosePath fallback branches returned `store.get(obsidianPathKey) || getDefaultVaultPath()`.
  - A truthy malformed stored value, such as an object, could be returned directly to renderer path consumers instead of falling back.
  - Store reads are runtime data and should be string-normalized at the IPC boundary.
- Added focused RED coverage to `scripts/verify-electron-obsidian-ipc-module.ts` requiring no raw `store.get(...) || default` returns and a local normalized stored path accessor.
- Confirmed RED with `npm run verify:electron-obsidian-ipc-module` failing because raw stored-path fallback was still present.
- Updated `electron/obsidianIpc.ts`:
  - added `getStoredObsidianPath()`
  - `obsidian:getPath`, choosePath cancellation, and malformed selected-path fallback now return only string stored paths or the default vault path
- Fresh verification passed:
  - `npm run verify:electron-obsidian-ipc-module`
  - `npm run verify:electron-main-window-bootstrap-module`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-09 - Phase 246 main-window startup stored vault path seeding guard
- Continued fast batch mode after Phase 245. The initially inspected Obsidian template-recognition parser already had object/array-element guards, so this phase moved to the next real store/path boundary instead of forcing a fake parser change.
- Root cause:
  - `mainWindowStartup` seeded the default Obsidian vault only when `!store.get(obsidianPathKey)`.
  - A truthy malformed persisted value, such as an object, would be treated as an already-seeded path and prevent the safe default from being written.
  - Startup seeding should treat non-string or blank stored vault path values as unset.
- Added focused RED coverage to `scripts/verify-electron-main-window-startup-module.ts` requiring explicit stored/default path reads and non-string stored-value handling before `store.set(...)`.
- Confirmed RED with `npm run verify:electron-main-window-startup-module` failing because the raw truthy check was still present.
- Updated `electron/mainWindowStartup.ts`:
  - reads `storedVaultPath` and `defaultVaultPath` once
  - seeds the default path when stored value is not a non-empty string
- Fresh verification passed:
  - `npm run verify:electron-main-window-startup-module`
  - `npm run verify:electron-main-window-bootstrap-module`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; both passed in Phase 245 and this phase changed a local startup guard plus focused verifier.

## 2026-07-09 - Phase 247 main-window persistence raw store normalization guard
- Continued fast batch mode after Phase 246 and tightened main-window persistence store-read boundaries.
- Root cause:
  - `mainWindowPersistence` read persisted window-state values from Electron Store and immediately cast them as `WindowState`.
  - Runtime store values are `unknown`; the existing `normalizeRestoredWindowState(...)` is the actual safety boundary and should receive raw values directly.
  - Casts do not change runtime behavior, but they obscure unsafe assumptions and make future changes easier to get wrong.
- Added focused RED coverage to `scripts/verify-electron-main-window-persistence-module.ts` requiring no `store.get(windowStateKey) as WindowState` casts and requiring raw values to go through the normalizer.
- Confirmed RED with `npm run verify:electron-main-window-persistence-module` failing because the casts were still present.
- Updated `electron/mainWindowPersistence.ts`:
  - `getInitialBounds()` now normalizes `store.get(windowStateKey)` directly
  - compact-size preservation now normalizes `store.get(windowStateKey)` directly
- Fresh verification passed:
  - `npm run verify:electron-main-window-persistence-module`
  - `npm run verify:electron-main-window-startup-module`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; both passed in Phase 245 and this phase changed a local persistence guard plus focused verifier.

## 2026-07-09 - Phase 248 window IPC boolean store strictness guard
- Continued fast batch mode after Phase 247 and tightened persisted boolean reads exposed through window IPC.
- Root cause:
  - `window:getCompactMode` and `window:getAutoStart` used `Boolean(store.get(key, false))`.
  - Truthy malformed persisted values such as `'false'`, `'yes'`, or objects would be reported as enabled.
  - Store-backed boolean settings should only report enabled when the persisted value is exactly `true`.
- Added focused RED coverage to `scripts/verify-electron-window-ipc-module.ts` requiring no `Boolean(store.get(...))` coercion and strict `=== true` checks.
- Confirmed RED with `npm run verify:electron-window-ipc-module` failing because the coercions were still present.
- Updated `electron/windowIpc.ts`:
  - compact-mode getter now returns `store.get(compactModeKey, false) === true`
  - autostart getter now returns `store.get(autoStartKey, false) === true`
- Fresh verification passed:
  - `npm run verify:electron-window-ipc-module`
  - `npm run verify:electron-main-window-bootstrap-module`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; both passed in Phase 245 and this phase changed a local IPC boolean guard plus focused verifier.

## 2026-07-09 - Phase 249 window IPC boolean setter normalization guard
- Continued fast batch mode after Phase 248 and tightened boolean values entering window IPC setters.
- Root cause:
  - `window:setCompactMode` persisted raw `compactMode` runtime IPC input.
  - `window:setAutoStart` persisted raw `enabled`, passed it to `app.setLoginItemSettings({ openAtLogin })`, and returned it.
  - Runtime IPC input can be malformed; boolean settings should persist and expose only real booleans.
- Added focused RED coverage to `scripts/verify-electron-window-ipc-module.ts` requiring `compactMode === true` / `enabled === true` normalization before persistence, login-item updates, and return.
- Confirmed RED with `npm run verify:electron-window-ipc-module` failing because raw setter values were still used.
- Updated `electron/windowIpc.ts`:
  - `window:setCompactMode` now persists `nextCompactMode = compactMode === true`
  - `window:setAutoStart` now persists/uses/returns `nextAutoStart = enabled === true`
- Fresh verification passed:
  - `npm run verify:electron-window-ipc-module`
  - `npm run verify:electron-main-window-bootstrap-module`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-09 - Phase 250 window settings-mode runtime boolean guard
- Continued fast batch mode after Phase 249 and tightened the settings-mode open/close IPC branch.
- Root cause:
  - `window:setSettingsMode` accepted runtime IPC input typed as boolean but branched with `if (open)`.
  - Truthy malformed values such as strings or objects could open settings mode.
  - IPC booleans should be interpreted strictly at the boundary.
- Added focused RED coverage to `scripts/verify-electron-window-ipc-module.ts` requiring no broad `if (open)` and a strict `open === true` derived branch.
- Confirmed RED with `npm run verify:electron-window-ipc-module` failing because `if (open)` was still present.
- Updated `electron/windowIpc.ts`:
  - added `const shouldOpenSettings = open === true`
  - settings mode opens only when `shouldOpenSettings` is true; all other runtime values follow the close/no-op branch
- Fresh verification passed:
  - `npm run verify:electron-window-ipc-module`
  - `npm run verify:electron-main-window-bootstrap-module`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; both passed in Phase 249 and this phase changed a local IPC branch guard plus focused verifier.

## 2026-07-09 - Phase 251 window lock-position runtime boolean guard
- Continued fast batch mode after Phase 250 and tightened the lock-position IPC setter.
- Root cause:
  - `window:setLockWindowPosition` accepted runtime IPC input typed as boolean but normalized it with `Boolean(locked)`.
  - Truthy malformed values such as strings or objects could enable lock-position mode.
  - IPC booleans should be interpreted strictly at the boundary before settings persistence.
- Added focused RED coverage to `scripts/verify-electron-window-ipc-module.ts` requiring no `Boolean(locked)` and a strict `locked === true` derived value.
- Confirmed RED with `npm run verify:electron-window-ipc-module` failing because `Boolean(locked)` was still present.
- Updated `electron/windowIpc.ts`:
  - derives `nextLockWindowPosition = locked === true`
  - persists that normalized value through `setAppSettings(...)`
- Fresh verification passed:
  - `npm run verify:electron-window-ipc-module`
  - `npm run verify:electron-main-window-bootstrap-module`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; both passed in Phase 249 and this phase changed a local IPC branch guard plus focused verifier.

## 2026-07-09 - Phase 252 window-mode runtime input narrowing guard
- Continued fast batch mode after Phase 251 and tightened the `window:setWindowMode` IPC input boundary.
- Root cause:
  - `window:setWindowMode` accepted runtime IPC input typed as `WindowMode` but passed it directly to the injected `setWindowMode(...)`.
  - Malformed runtime strings could reach mode persistence/application paths.
  - The shared `isWindowMode(...)` guard already exists and should be used at the IPC edge.
- Added focused RED coverage to `scripts/verify-electron-window-ipc-module.ts` requiring import/use of `isWindowMode(...)` before calling `setWindowMode(...)`.
- Confirmed RED with `npm run verify:electron-window-ipc-module` failing because `isWindowMode` was not imported/used.
- Updated `electron/windowIpc.ts`:
  - imports `isWindowMode`
  - invalid runtime mode values return `getWindowMode()` without calling `setWindowMode(...)`
- First GREEN attempt found a too-broad verifier negative regex that matched the guarded setter path; calibrated the verifier to rely on the positive guard-order invariant.
- Fresh verification passed:
  - `npm run verify:electron-window-ipc-module`
  - `npm run verify:electron-main-window-bootstrap-module`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; both passed in Phase 249 and this phase changed a local IPC input guard plus focused verifier.

## 2026-07-09 - Phase 253 task context menu resize runtime height guard
- Continued fast batch mode after Phase 252 and tightened task context menu resize IPC input.
- Root cause:
  - `taskContextMenu:resize` accepted runtime IPC input typed as number but normalized it with `Number(height) || defaultTaskMenuHeight`.
  - Malformed values such as numeric strings or booleans could be coerced into heights before clamping.
  - Resize IPC should accept only finite numbers; malformed values should fall back to the default popup height.
- Added focused RED coverage to `scripts/verify-electron-task-context-menu-ipc-module.ts` requiring no `Number(height)` coercion and a finite-number guard before clamping.
- Confirmed RED with `npm run verify:electron-task-context-menu-ipc-module` failing because the coercion was still present.
- Updated `electron/taskContextMenuIpc.ts`:
  - added `rawHeight = typeof height === 'number' && Number.isFinite(height) ? height : defaultTaskMenuHeight`
  - existing `80..600` clamp and y work-area clamp remain unchanged
- Fresh verification passed:
  - `npm run verify:electron-task-context-menu-ipc-module`
  - `npm run verify:context-menu`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; both passed in Phase 249 and this phase changed a local IPC guard plus focused verifier.

## 2026-07-09 - Phase 254 task context menu open payload runtime guard
- Continued fast batch mode after Phase 253 and tightened task-context-menu open IPC payload shape.
- Root cause:
  - `taskContextMenu:open` accepted runtime IPC input typed as `TaskMenuPayload` but passed it directly to `openTaskMenuWindow(...)`.
  - Popup creation uses `payload.screenX` / `payload.screenY` for BrowserWindow coordinates; malformed payloads could produce `NaN` or invalid bounds.
  - The IPC edge should reject malformed open payloads before popup creation.
- Added focused RED coverage to `scripts/verify-electron-task-context-menu-ipc-module.ts` requiring an `isTaskMenuPayload(...)` runtime guard before `openTaskMenuWindow(...)`.
- Confirmed RED with `npm run verify:electron-task-context-menu-ipc-module` failing because no guard existed.
- Updated `electron/taskContextMenuIpc.ts`:
  - added `isTaskMenuPayload(value)`
  - requires object payload, `task` field, string `allTags` array, and finite numeric `screenX/screenY`
  - malformed open payloads are ignored without creating a popup window
- First GREEN attempt found a verifier implementation-name mismatch (`value.screenX` vs `record.screenX`); calibrated the verifier to the type-safe local record pattern.
- Fresh verification passed:
  - `npm run verify:electron-task-context-menu-ipc-module`
  - `npm run verify:context-menu`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; both passed in Phase 249 and this phase changed a local IPC payload guard plus focused verifier.

## 2026-07-09 - Phase 255 task menu window coordinate defense guard
- Continued fast batch mode after Phase 254 and added defense-in-depth inside task-menu popup creation.
- Root cause:
  - Phase 254 guarded `taskContextMenu:open` payloads at the IPC edge.
  - `createTaskMenuWindow(payload, ...)` still clamped raw `payload.screenX` / `payload.screenY` directly.
  - If a future caller bypassed or weakened the IPC guard, malformed coordinates could still produce invalid BrowserWindow bounds.
- Added focused RED coverage to `scripts/verify-context-menu.ts` requiring coordinate finite-number normalization before popup placement clamping.
- Confirmed RED with `npm run verify:context-menu` failing because raw payload coordinates were still used.
- Updated `electron/taskMenuWindow.ts`:
  - derives `screenX` / `screenY` only when payload coordinates are finite numbers
  - malformed coordinates fall back to the primary work-area center before the existing clamp
- Fresh verification passed:
  - `npm run verify:context-menu`
  - `npm run verify:electron-task-context-menu-ipc-module`
  - `npm run typecheck`
  - `npm run build`

## 2026-07-10 - Phase 256 task context menu renderer payload coordinate guard
- Continued fast batch mode after Phase 255 and added renderer-side defense for task-context-menu popup coordinates.
- Root cause:
  - TaskItem normally passes event `screenX/screenY`, but the extracted payload helper could be reused or called with malformed/non-finite coordinates.
  - The helper forwarded raw coordinates into the IPC payload.
  - Renderer payload builders should avoid generating invalid coordinate payloads even though Electron IPC and popup creation now also guard them.
- Added focused RED coverage to `scripts/verify-task-item-context-menu-helper.ts` requiring a `normalizeScreenCoordinate(...)` helper and normalized `screenX/screenY` payload fields.
- Confirmed RED with `npm run verify:task-item-context-menu-helper` failing because no coordinate normalizer existed.
- Updated `src/components/taskItem/taskItemContextMenu.ts`:
  - added `normalizeScreenCoordinate(value)`
  - `createTaskContextMenuPayload(...)` now normalizes `screenX` and `screenY`; non-finite values fall back to `0`
- Fresh verification passed:
  - `npm run verify:task-item-context-menu-helper`
  - `npm run verify:context-menu`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; both passed in Phase 255 and this phase changed a local renderer payload guard plus focused verifier.

## 2026-07-10 - Phase 257 task context menu theme numeric clamp guard
- Continued fast batch mode after Phase 256 and tightened renderer-side task-context-menu theme numeric payload values.
- Root cause:
  - `parseCssNumber(...)` accepted any finite CSS numeric value.
  - Extreme values such as very large opacity, negative blur, or huge border radius could enter the popup payload and produce unstable visual output.
  - CSS-derived numeric payload fields should be finite and bounded to safe visual ranges.
- Added focused RED coverage to `scripts/verify-task-item-context-menu-helper.ts` requiring parsed CSS numbers to clamp with min/max bounds and requiring safe ranges for menu opacity, blur strength, and card radius.
- Confirmed RED with `npm run verify:task-item-context-menu-helper` failing because parsed values were not clamped.
- Updated `src/components/taskItem/taskItemContextMenu.ts`:
  - `parseCssNumber(value, fallback, min, max)` now clamps finite values
  - menu opacity clamps to `0.3..1`
  - blur strength clamps to `0..40`
  - card radius clamps to `0..32`
- Fresh verification passed:
  - `npm run verify:task-item-context-menu-helper`
  - `npm run verify:context-menu`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; both passed in Phase 255 and this phase changed a local renderer helper plus focused verifier.

## 2026-07-10 - Phase 258 task menu action runtime payload guard
- Continued fast batch mode after Phase 257 and tightened renderer task-menu action parsing.
- Root cause:
  - `parseTaskMenuAction(payload)` cast runtime payloads to `TaskMenuActionPayload` and immediately dereferenced `updates.__action`.
  - Malformed IPC-forwarded action payloads could throw in the renderer listener or route invalid task updates.
  - Action payload parsing should validate shape and turn malformed payloads into a no-op.
- Added focused RED coverage to `scripts/verify-app-task-menu-actions-module.ts` requiring a runtime `isTaskMenuActionPayload(...)` guard and `kind: 'noop'` parsed action.
- Confirmed RED with `npm run verify:app-task-menu-actions-module` failing because no no-op/guard existed.
- Updated `src/app/taskMenuActions.ts`:
  - added `isTaskMenuActionPayload(payload)` requiring non-empty string `taskId` and object-shaped `updates`
  - malformed payloads parse to `{ kind: 'noop' }`
  - `applyParsedTaskMenuAction(...)` returns immediately for no-op actions
- Fresh verification passed:
  - `npm run verify:app-task-menu-actions-module`
  - `npm run verify:context-menu`
- Deferred `npm run typecheck` and `npm run build` per fast batch mode; both passed in Phase 255 and this phase changed a local renderer action parser plus focused verifier.

## 2026-07-10 - Phase 259 task context menu action forwarding payload guard
- Recovered the unsynced Phase 259 state after the interrupted thread: product code and focused verifier already contained the Electron-side action forwarding guard.
- Root cause:
  - Phase 258 made malformed renderer action payloads parse to no-op, but `taskContextMenu:action` still accepted unknown runtime payloads at the Electron IPC edge.
  - A malformed payload could still be broadcast with `webContents.send('taskContextMenu:action', payload)`.
  - Electron should reject malformed action payloads before forwarding them to the renderer, while still closing the popup.
- Added focused coverage in `scripts/verify-electron-task-context-menu-ipc-module.ts` requiring `isTaskMenuActionPayload(...)` and a guard before `webContents.send(...)`.
- Updated `electron/taskContextMenuIpc.ts`:
  - added `TaskMenuActionPayload` and `isTaskMenuActionPayload(value)`
  - requires non-empty string `taskId` and object-shaped, non-array `updates`
  - malformed action payloads close the popup and return without renderer broadcast
- Fresh verification passed:
  - `npm.cmd run verify:electron-task-context-menu-ipc-module`
  - `npm run verify:context-menu`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`

## 2026-07-10 - Phase 260 task menu action preload type contract narrowing
- Continued fast batch mode after Phase 259 and narrowed the renderer preload type surface to match the runtime task-menu guard boundary.
- Root cause:
  - `src/vite-env.d.ts` still described `dispatchTaskMenuAction` and `onTaskMenuAction` as if they handled trusted task objects.
  - Runtime code already treats task-menu action payloads as `unknown` at the preload boundary and validates them before acting.
  - The ambient type contract should not promise more shape than the runtime boundary guarantees.
- Added focused RED coverage in `scripts/verify-app-task-menu-actions-module.ts` requiring the preload task-menu APIs to expose `unknown` payload types.
- Updated `src/vite-env.d.ts`:
  - `dispatchTaskMenuAction(payload: unknown)`
  - `onTaskMenuAction(callback: (payload: unknown) => void)`
- Fresh verification passed:
  - `npm.cmd run verify:app-task-menu-actions-module`
  - `npm run verify:context-menu`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`

## 2026-07-11 - Phase 261 context restore
- Resumed from thread `019f3783-e0d2-75c0-9174-0ac85c1c2abb` and restored `task_plan.md`, `progress.md`, `findings.md`, and `codex_handoff.md`.
- `session-catchup.py` only reported this turn's restore/tooling messages as unsynced; no older implementation context was missing from the planning files.
- `git diff --stat` confirmed the worktree remains broadly dirty from the long-running cleanup series; unrelated changes were left untouched.
- Selected the next narrow seam: `onTasksChanged` is forwarded as runtime `unknown` by preload and normalized by `useTasks`, but `src/vite-env.d.ts` still advertises a trusted `Task[]` callback payload.

## 2026-07-11 - Phase 261 tasks changed preload type contract narrowing
- Continued fast batch mode after Phase 260 and narrowed the cross-window task-change listener type surface to match the runtime guard boundary.
- Root cause:
  - `electron/preload.ts` already forwards `tasks: unknown` for `onTasksChanged`.
  - `src/hooks/useTasks.ts` already sends the incoming value through `normalizeIncomingTasks(incoming, today)`.
  - `src/vite-env.d.ts` still advertised `onTasksChanged(callback: (tasks: Task[]) => void)`, which made renderer code look safer than the runtime boundary actually is.
- Added focused RED coverage in `scripts/verify-task-hook-state.ts` requiring `onTasksChanged` to expose an `unknown` payload in `src/vite-env.d.ts` and to avoid the trusted `Task[]` listener contract.
- Confirmed RED with `npm.cmd run verify:task-hook-state` failing because the ambient listener type still used `Task[]`.
- Updated `src/vite-env.d.ts`:
  - `onTasksChanged(callback: (tasks: unknown) => void)`
- Fresh verification passed:
  - `npm.cmd run verify:task-hook-state`
  - `npm.cmd run verify:task-mutations`
  - `npm.cmd run typecheck`
- Deferred `npm.cmd run build` per fast batch mode; production build last passed in Phase 260 and this phase changed only ambient renderer types plus a focused verifier.

## 2026-07-11 - Phase 262 Obsidian sync preload type contract narrowing
- Resumed from thread `019f3783-e0d2-75c0-9174-0ac85c1c2abb` and found implementation files newer than the Phase 261 memory files.
- Confirmed the unrecorded Phase 262 seam:
  - `electron/preload.ts` already forwards Obsidian sync and preview task inputs as `unknown[]`.
  - Runtime sync helpers already validate malformed task arrays and entries before writing or previewing.
  - `src/vite-env.d.ts` still advertised trusted `Task[]` inputs for `syncTasksToObsidian(...)`, `previewTasksToObsidian(...)`, and optional `beforeTasks`.
- Added focused coverage in `scripts/verify-settings-sync.ts` requiring the ambient preload contract to expose `unknown[]` task arrays and checking preload still forwards `unknown[]`.
- Updated `src/vite-env.d.ts` so:
  - `syncTasksToObsidian(tasks: unknown[], ..., beforeTasks?: unknown[])`
  - `previewTasksToObsidian(tasks: unknown[], ..., beforeTasks?: unknown[])`
- Fresh verification passed:
  - `npm.cmd run verify:settings-sync`
  - `npm.cmd run typecheck`
- Deferred `npm.cmd run build` per fast batch mode; production build last passed in Phase 260 and this phase changed only ambient renderer types plus focused verifier coverage.

## 2026-07-11 - Phase 262 documentation sync verification
- Synchronized `task_plan.md`, `progress.md`, `findings.md`, and `codex_handoff.md` for Phase 262 without changing implementation files in this pass.
- Verified the current Phase 262 state after documentation sync:
  - `npm.cmd run verify:settings-sync`
  - `npm.cmd run typecheck`
  - `rg -n "Phase 262|Phase 263|Last completed phase" task_plan.md progress.md findings.md codex_handoff.md`
- Ran `session-catchup.py`; it only reported this turn's just-run verification/catchup messages as unsynced after the prior documentation write.
- Ran `git -c safe.directory=G:/Personal-AI/DailyTodo diff --stat`; confirmed the worktree remains broadly dirty from the long-running cleanup series and unrelated changes were left untouched.

## 2026-07-11 - Phase 263 Companion sync preload type contract narrowing
- Continued fast batch mode after Phase 262 and narrowed the Companion sync/write preload type surface to match the runtime boundary.
- Root cause:
  - `electron/preload.ts` already forwards `previewCompanionSync(settings: unknown, items: unknown[])` and `writeCompanionSync(settings: unknown, items: unknown[])`.
  - Companion planner/runtime code already validates malformed settings and capture items before planning/writing.
  - `src/vite-env.d.ts` still advertised trusted `CompanionSettings` and `CaptureItem[]` inputs, making renderer callers look safer than the preload boundary actually is.
- Added focused RED coverage in `scripts/verify-electron-companion-ipc-module.ts` requiring the ambient Companion sync/write APIs to expose `unknown` settings and `unknown[]` items, plus checks that preload still forwards unknown runtime data.
- Confirmed RED with `npm.cmd run verify:electron-companion-ipc-module` failing because `previewCompanionSync(...)` still used trusted `CompanionSettings` / `CaptureItem[]`.
- Updated `src/vite-env.d.ts`:
  - `previewCompanionSync(settings: unknown, items: unknown[])`
  - `writeCompanionSync(settings: unknown, items: unknown[])`
- Fresh verification passed:
  - `npm.cmd run verify:electron-companion-ipc-module`
  - `npm.cmd run verify:companion`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`

## 2026-07-11 - Phase 264 AI Review preload type contract narrowing
- Continued fast batch mode after Phase 263 and narrowed the AI Review preload task-input type surface to match the runtime boundary.
- Root cause:
  - `electron/preload.ts` already forwards `runForDate(date, tasks, force)`, `backfill(tasks)`, `generateWeekly(date, tasks)`, and `generateMonthly(date, tasks)` with `tasks: unknown`.
  - `src/vite-env.d.ts` still advertised trusted `Task[]` inputs for those four APIs.
  - `scripts/verify-ai-regenerate-force.ts` was stale: it expected old trusted `Task[]` ambient types and old inline AI Review IPC handler shape.
- Updated `scripts/verify-ai-regenerate-force.ts`:
  - requires the four AI Review ambient task inputs to expose `unknown`
  - checks preload still forwards unknown runtime data
  - checks current split IPC owner modules for daily run, backfill, weekly report, and monthly report registration
  - keeps the existing daily regeneration force checks
- `npm.cmd run verify:ai-regenerate-force` failed because no package script exists, so focused verification used the direct tsx script.
- Confirmed RED with `npm.cmd exec -- tsx scripts/verify-ai-regenerate-force.ts` failing because `runForDate(...)` still used trusted `Task[]` in `src/vite-env.d.ts`.
- Updated `src/vite-env.d.ts`:
  - `runForDate(date: string, tasks: unknown, force?: boolean)`
  - `backfill(tasks: unknown)`
  - `generateWeekly(date: string, tasks: unknown)`
  - `generateMonthly(date: string, tasks: unknown)`
- Fresh verification passed:
  - `npm.cmd exec -- tsx scripts/verify-ai-regenerate-force.ts`
  - `npm.cmd run verify:electron-ai-review-daily-run-inspect-ipc-module`
  - `npm.cmd run typecheck`
- Deferred `npm.cmd run build` per fast batch mode; production build last passed in Phase 263 and this phase changed ambient renderer types plus a focused verifier.

## 2026-07-11 - Phase 271 window settings mode type contract narrowing
- Continued fast batch mode after Phase 270 and narrowed the settings-mode open/close setter type surface to match the existing runtime strict-boolean boundary.
- Root cause:
  - `electron/windowIpc.ts` already normalizes the runtime input with `const shouldOpenSettings = open === true`.
  - `electron/windowIpc.ts`, `electron/preload.ts`, and `src/vite-env.d.ts` still advertised trusted `boolean` inputs.
- Added focused RED coverage in `scripts/verify-electron-window-ipc-module.ts` requiring `setSettingsMode` to expose `unknown` through preload, ambient types, and the IPC handler before strict boolean narrowing.
- Confirmed RED with `npm.cmd run verify:electron-window-ipc-module` failing because the IPC handler still typed `open` as `boolean`.
- Updated:
  - `electron/windowIpc.ts`: `window:setSettingsMode` handler uses `open: unknown`
  - `electron/preload.ts`: `setSettingsMode(open: unknown)`
  - `src/vite-env.d.ts`: `setSettingsMode(open: unknown)`
- Fresh verification passed:
  - `npm.cmd run verify:electron-window-ipc-module`
  - `npm.cmd run verify:electron-settings-mode-state-module`
  - `npm.cmd run verify:electron-main-window-bootstrap-module`
  - `npm.cmd run typecheck`
- Deferred `npm.cmd run build` per fast batch mode; production build last passed in Phase 268.

## 2026-07-11 - Phase 272 window lock position type contract narrowing
- Continued fast batch mode after Phase 271 and narrowed the lock-position setter type surface to match the existing runtime strict-boolean boundary.
- Root cause:
  - `electron/windowIpc.ts` already normalizes the runtime input with `const nextLockWindowPosition = locked === true`.
  - `electron/windowIpc.ts`, `electron/preload.ts`, and `src/vite-env.d.ts` still advertised trusted `boolean` inputs.
- Added focused RED coverage in `scripts/verify-electron-window-ipc-module.ts` requiring `setLockWindowPosition` to expose `unknown` through preload, ambient types, and the IPC handler before strict boolean narrowing.
- Confirmed RED with `npm.cmd run verify:electron-window-ipc-module` failing because the IPC handler still typed `locked` as `boolean`.
- Updated:
  - `electron/windowIpc.ts`: `window:setLockWindowPosition` handler uses `locked: unknown`
  - `electron/preload.ts`: `setLockWindowPosition(locked: unknown)`
  - `src/vite-env.d.ts`: `setLockWindowPosition(locked: unknown)`
- Fresh verification passed:
  - `npm.cmd run verify:electron-window-ipc-module`
  - `npm.cmd run verify:electron-app-state-accessors-module`
  - `npm.cmd run verify:electron-main-window-bootstrap-module`
  - `npm.cmd run typecheck`
- Deferred `npm.cmd run build` per fast batch mode; production build last passed in Phase 268.

## 2026-07-11 - Phase 273 window compact mode type contract narrowing
- Continued fast batch mode after Phase 272 and narrowed the compact-mode setter type surface to match the existing runtime strict-boolean boundary.
- Root cause:
  - `electron/windowIpc.ts` already normalizes the runtime input with `const nextCompactMode = compactMode === true`.
  - `electron/windowIpc.ts`, `electron/preload.ts`, and `src/vite-env.d.ts` still advertised trusted `boolean` inputs.
- Added focused RED coverage in `scripts/verify-electron-window-ipc-module.ts` requiring `setWindowCompactMode` to expose `unknown` through preload, ambient types, and the IPC handler before strict boolean narrowing.
- Confirmed RED with `npm.cmd run verify:electron-window-ipc-module` failing because the IPC handler still typed `compactMode` as `boolean`.
- Updated:
  - `electron/windowIpc.ts`: `window:setCompactMode` handler uses `compactMode: unknown`
  - `electron/preload.ts`: `setWindowCompactMode(compactMode: unknown)`
  - `src/vite-env.d.ts`: `setWindowCompactMode(compactMode: unknown)`
- Fresh verification passed:
  - `npm.cmd run verify:electron-window-ipc-module`
  - `npm.cmd run verify:electron-main-window-bootstrap-module`
  - `npm.cmd run typecheck`
  - `npm run build`

## 2026-07-11 - Phase 267 Companion settings setter type contract narrowing
- Continued fast batch mode after Phase 266 and narrowed the Companion settings setter type surface to match the runtime preload/IPC boundary.
- Ran `session-catchup.py`; it reported the handoff/current turn as unsynced context, then `git -c safe.directory=G:/Personal-AI/DailyTodo diff --stat` confirmed the worktree is still broadly dirty from the long-running cleanup series.
- Root cause:
  - `electron/preload.ts` already forwards `setCompanionSettings(settings: unknown)`.
  - `src/vite-env.d.ts` still advertised trusted `CompanionSettings` input for `setCompanionSettings(...)`.
  - `electron/companionIpc.ts` still typed the Companion settings setter option and `companion:setSettings` handler payload as `CompanionSettings`.
  - `electron/appStateAccessors.ts` already normalizes unknown-shaped Companion settings internally, but its setter signature still claimed `CompanionSettings`.
- Added focused RED coverage in `scripts/verify-electron-companion-ipc-module.ts` requiring the Companion settings setter ambient/preload/IPC/app-state inputs to expose `unknown`.
- Confirmed RED with `npm.cmd run verify:electron-companion-ipc-module` failing because `setCompanionSettings(...)` still used trusted `CompanionSettings` in `src/vite-env.d.ts`.
- Updated:
  - `src/vite-env.d.ts`: `setCompanionSettings(settings: unknown)`
  - `electron/companionIpc.ts`: setter option and `companion:setSettings` handler payload use `unknown`
  - `electron/appStateAccessors.ts`: `setCompanionSettings(value: unknown)`
- Fresh verification passed:
  - `npm.cmd run verify:electron-companion-ipc-module`
  - `npm.cmd run verify:electron-app-state-accessors-module`
  - `npm.cmd run typecheck`
- Deferred `npm.cmd run build` per fast batch mode; production build last passed in Phase 263 and this phase changed preload/IPC type contracts plus a focused verifier.

## 2026-07-11 - Phase 268 task context menu open type contract narrowing
- Continued fast batch mode after Phase 267 and narrowed the task context menu open ambient type surface to match the runtime preload/IPC boundary.
- Restored context from thread `019f3783-e0d2-75c0-9174-0ac85c1c2abb`, read the planning files, ran `session-catchup.py`, and confirmed `git diff --stat` / `git status --short` still show the expected broad dirty worktree.
- Root cause:
  - `electron/preload.ts` already forwards `openTaskContextMenu(payload: unknown)`.
  - `electron/taskContextMenuIpc.ts` already validates `taskContextMenu:open` payload shape before popup creation.
  - `src/vite-env.d.ts` still advertised a trusted structured payload with `Task`, tags, coordinates, and theme fields.
- Added focused RED coverage in `scripts/verify-electron-task-context-menu-ipc-module.ts` requiring `openTaskContextMenu` to expose `unknown` in `src/vite-env.d.ts`.
- Confirmed RED with `npm.cmd run verify:electron-task-context-menu-ipc-module` failing because the ambient type still used a structured payload.
- Updated `src/vite-env.d.ts`:
  - `openTaskContextMenu(payload: unknown)`
- Fresh verification passed:
  - `npm.cmd run verify:electron-task-context-menu-ipc-module`
  - `npm.cmd run verify:context-menu`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`

## 2026-07-11 - Phase 269 task context menu resize type contract narrowing
- Continued fast batch mode after Phase 268 and narrowed the task context menu resize type surface to match the existing runtime guard boundary.
- Root cause:
  - `electron/taskContextMenuIpc.ts` already narrows resize heights with `typeof height === 'number' && Number.isFinite(height)` before clamping.
  - `electron/preload.ts`, `src/vite-env.d.ts`, and the IPC handler still advertised trusted `number` inputs.
- Added focused RED coverage in `scripts/verify-electron-task-context-menu-ipc-module.ts` requiring resize heights to expose `unknown` through preload, ambient types, and IPC handler before finite-number narrowing.
- Confirmed RED with `npm.cmd run verify:electron-task-context-menu-ipc-module` failing because the IPC handler still typed `height` as `number`.
- Updated:
  - `electron/taskContextMenuIpc.ts`: `taskContextMenu:resize` handler uses `height: unknown`
  - `electron/preload.ts`: `resizeTaskContextMenu(height: unknown)`
  - `src/vite-env.d.ts`: `resizeTaskContextMenu(height: unknown)`
- Fresh verification passed:
  - `npm.cmd run verify:electron-task-context-menu-ipc-module`
  - `npm.cmd run verify:context-menu`
  - `npm.cmd run typecheck`
- Deferred `npm.cmd run build` per fast batch mode; production build last passed in Phase 268.

## 2026-07-11 - Phase 270 window mode setter type contract narrowing
- Continued fast batch mode after Phase 269 and narrowed the window-mode setter type surface to match the existing runtime guard boundary.
- Root cause:
  - `electron/windowIpc.ts` already rejects malformed runtime modes with `isWindowMode(mode)` and returns the current mode.
  - `electron/windowIpc.ts`, `electron/preload.ts`, and `src/vite-env.d.ts` still advertised trusted `WindowMode` / `string` setter inputs.
- Added focused RED coverage in `scripts/verify-electron-window-ipc-module.ts` requiring `setWindowMode` to expose `unknown` through preload, ambient types, and the IPC handler before runtime narrowing.
- Confirmed RED with `npm.cmd run verify:electron-window-ipc-module` failing because the IPC handler still typed `mode` as `WindowMode`.
- Updated:
  - `electron/windowIpc.ts`: `window:setWindowMode` handler uses `mode: unknown`
  - `electron/preload.ts`: `setWindowMode(mode: unknown)`
  - `src/vite-env.d.ts`: `setWindowMode(mode: unknown)`
- Fresh verification passed:
  - `npm.cmd run verify:electron-window-ipc-module`
  - `npm.cmd run verify:electron-main-window-mode-controller-module`
  - `npm.cmd run typecheck`
- Deferred `npm.cmd run build` per fast batch mode; production build last passed in Phase 268.

## 2026-07-11 - Phase 265 settings preload type contract narrowing
- Continued fast batch mode after Phase 264 and narrowed the app/Obsidian settings setter preload type surface to match the runtime boundary.
- Root cause:
  - `electron/preload.ts` already forwards `setAppSettings(settings: unknown)` and `setObsidianTemplateSettings(settings: unknown)`.
  - `electron/settingsIpc.ts` already receives both `settings:setApp` and `settings:setObsidianTemplates` payloads as `unknown`.
  - `src/vite-env.d.ts` still advertised trusted `AppBehaviorSettings` and `ObsidianTemplateSettings` setter inputs, making renderer callers look safer than the preload boundary actually is.
- Added focused RED coverage in `scripts/verify-electron-settings-ipc-module.ts` requiring both ambient settings setters to expose `unknown`, while also checking preload still forwards unknown runtime data.
- Confirmed RED with `npm.cmd run verify:electron-settings-ipc-module` failing because `setAppSettings(...)` still used trusted `AppBehaviorSettings` in `src/vite-env.d.ts`.
- Updated `src/vite-env.d.ts`:
  - `setAppSettings(settings: unknown)`
  - `setObsidianTemplateSettings(settings: unknown)`
- Fresh verification passed:
  - `npm.cmd run verify:electron-settings-ipc-module`
  - `npm.cmd run verify:electron-app-state-accessors-module`
  - `npm.cmd run typecheck`
- Deferred `npm.cmd run build` per fast batch mode; production build last passed in Phase 263 and this phase changed ambient renderer types plus a focused verifier.

## 2026-07-11 - Phase 266 AI Review settings preload type contract narrowing
- Continued fast batch mode after Phase 265 and narrowed the AI Review settings/sections setter preload type surface to match the runtime boundary.
- Root cause:
  - `electron/preload.ts` already forwards `aiReview.setSettings(v: unknown)` and `aiReview.setSections(v: unknown)`.
  - `electron/aiReviewSettingsSectionsIpc.ts` already receives both `aiReview:setSettings` and `aiReview:setSections` payloads as `unknown`.
  - `src/vite-env.d.ts` still advertised trusted `AiReviewSettings` and `SectionConfig[]` setter inputs.
- Added focused RED coverage in `scripts/verify-electron-ai-review-settings-sections-ipc-module.ts` requiring both ambient AI Review setters to expose `unknown`, while also checking preload still forwards unknown runtime data.
- Confirmed RED with `npm.cmd run verify:electron-ai-review-settings-sections-ipc-module` failing because `aiReview.setSettings(...)` still used trusted `AiReviewSettings` in `src/vite-env.d.ts`.
- Updated `src/vite-env.d.ts`:
  - `aiReview.setSettings(settings: unknown)`
  - `aiReview.setSections(sections: unknown)`
- Fresh verification passed:
  - `npm.cmd run verify:electron-ai-review-settings-sections-ipc-module`
  - `npm.cmd run verify:ai-settings`
  - `npm.cmd run verify:section-config`
  - `npm.cmd run typecheck`
- Deferred `npm.cmd run build` per fast batch mode; production build last passed in Phase 263 and this phase changed ambient renderer types plus a focused verifier.

## 2026-07-11 - Phase 274 window autostart type contract narrowing
- Continued fast batch mode after Phase 273 and narrowed the autostart setter type surface to match the existing runtime strict-boolean boundary.
- Root cause:
  - `electron/windowIpc.ts` already normalizes the runtime input with `const nextAutoStart = enabled === true`.
  - `electron/windowIpc.ts`, `electron/preload.ts`, and `src/vite-env.d.ts` still advertised trusted `boolean` inputs.
- Added focused RED coverage in `scripts/verify-electron-window-ipc-module.ts` requiring `setAutoStart` to expose `unknown` through preload, ambient types, and the IPC handler before strict boolean narrowing.
- Confirmed RED with `npm.cmd run verify:electron-window-ipc-module` failing because the IPC handler still typed `enabled` as `boolean`.
- Updated:
  - `electron/windowIpc.ts`: `window:setAutoStart` handler uses `enabled: unknown`
  - `electron/preload.ts`: `setAutoStart(enabled: unknown)`
  - `src/vite-env.d.ts`: `setAutoStart(enabled: unknown)`
- Fresh verification passed before documentation sync:
  - `npm.cmd run verify:electron-window-ipc-module`
  - `npm.cmd run verify:electron-main-window-bootstrap-module`
  - `npm.cmd run typecheck`
- Deferred `npm.cmd run build` per fast batch mode; production build passed in Phase 273.

## 2026-07-11 - Phase 275 companion mobile inbox import type contract narrowing
- Continued fast batch mode after Phase 274 and narrowed the mobile inbox import path type surface to match the existing runtime non-string guard.
- Root cause:
  - `electron/obsidianCompanion.ts` already rejects malformed runtime inbox paths with `typeof inboxPath !== 'string'`.
  - `electron/companionIpc.ts`, `electron/preload.ts`, and `src/vite-env.d.ts` still advertised trusted `string` inputs.
  - The importer function signature itself was still `string`, making its runtime guard impossible to see from TypeScript.
- Added focused RED coverage in `scripts/verify-electron-companion-ipc-module.ts` requiring `importMobileInbox` to expose `unknown` through preload, ambient types, and IPC handler before runtime narrowing.
- Confirmed RED with `npm.cmd run verify:electron-companion-ipc-module` failing because the IPC handler still typed `inboxPath` as `string`.
- Updated:
  - `electron/companionIpc.ts`: `companion:importMobileInbox` handler uses `inboxPath: unknown`
  - `electron/preload.ts`: `importMobileInbox(inboxPath: unknown)`
  - `src/vite-env.d.ts`: `importMobileInbox(inboxPath: unknown)`
  - `electron/obsidianCompanion.ts`: `importMobileInbox(inboxPath: unknown)`
- Fresh verification passed:
  - `npm.cmd run verify:electron-companion-ipc-module`
  - `npm.cmd run verify:companion`
  - `npm.cmd run typecheck`
- Deferred `npm.cmd run build` per fast batch mode; production build last passed in Phase 273.

## 2026-07-11 - Phase 276 Obsidian template recognize type contract narrowing
- Continued fast batch mode after Phase 275 and narrowed the Obsidian template recognition raw-template type surface to match the existing runtime validator boundary.
- Restored context from thread `019f3783-e0d2-75c0-9174-0ac85c1c2abb`, read `task_plan.md`, `progress.md`, `findings.md`, and `codex_handoff.md`, ran `session-catchup.py`, and confirmed the worktree is still broadly dirty from the long-running cleanup series.
- Root cause:
  - `shared/obsidianTemplateRecognition.ts` already validates raw template input as runtime data.
  - `electron/obsidianIpc.ts` already calls `validateObsidianTemplateRecognitionInput(rawTemplate)` before AI settings/API-key checks.
  - `electron/obsidianIpc.ts`, `electron/preload.ts`, and `src/vite-env.d.ts` still advertised trusted `string` inputs for `obsidianTemplate.recognize(...)`.
- Added focused RED coverage in `scripts/verify-electron-obsidian-ipc-module.ts` requiring the IPC handler, preload function, and ambient preload type to expose `rawTemplate: unknown`.
- Confirmed RED with `npm.cmd run verify:electron-obsidian-ipc-module` failing because `electron/obsidianIpc.ts` still typed `rawTemplate` as `string`.
- Updated:
  - `electron/obsidianIpc.ts`: `obsidianTemplate:recognize` handler uses `rawTemplate: unknown`
  - `electron/preload.ts`: `obsidianTemplate.recognize(rawTemplate: unknown)`
  - `src/vite-env.d.ts`: `obsidianTemplate.recognize(rawTemplate: unknown)`
- Fresh verification passed:
  - `npm.cmd run verify:electron-obsidian-ipc-module`
  - `npm.cmd run verify:obsidian-template-recognition`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
- Documentation synchronized in `task_plan.md`, `progress.md`, `findings.md`, and `codex_handoff.md` before continuing to Phase 277.

## 2026-07-11 - Phase 277 AI Review template recognition type contract narrowing
- Continued fast batch mode from Phase 276 and used the inherited RED verifier for AI Review template/report recognition preload and IPC type contracts.
- Root cause:
  - `electron/aiReviewTemplateToolsIpc.ts` already validates `rawTemplate` at runtime before AI settings/API-key checks.
  - `recognizeReportTemplate(...)` already narrows malformed report targets to `personalWeekly`.
  - `electron/aiReviewTemplateToolsIpc.ts`, `electron/preload.ts`, and `src/vite-env.d.ts` still advertised trusted `string` inputs for review/report template recognition.
- Updated:
  - `electron/aiReviewTemplateToolsIpc.ts`: `aiReview:recognizeTemplate` handler uses `rawTemplate: unknown`.
  - `electron/aiReviewTemplateToolsIpc.ts`: `aiReview:recognizeReportTemplate` handler uses `target: unknown, rawTemplate: unknown`.
  - `electron/preload.ts`: `aiReview.recognizeTemplate(...)` and `aiReview.recognizeReportTemplate(...)` forward unknown runtime inputs.
  - `src/vite-env.d.ts`: ambient AI Review recognition inputs expose `unknown`.
- Fresh verification passed:
  - `npm.cmd run verify:electron-ai-review-template-tools-ipc-module`
  - `npm.cmd run verify:recognize-template`
  - `npm.cmd run verify:recognize-report`
  - `npm.cmd run verify:electron-ai-review-ipc-module`
  - `npm.cmd run typecheck`
- Deferred `npm.cmd run build` per fast batch mode; production build last passed in Phase 276.

## 2026-07-11 - Phase 278 Obsidian daily-note open type contract narrowing
- Continued fast batch mode after Phase 277 and narrowed the Obsidian daily-note open date type surface to match the existing runtime guard.
- Ran `session-catchup.py`; it reported only the current restore/setup messages as unsynced context. `git status --short` and `git diff --stat` confirmed the expected broad dirty worktree from the long-running cleanup series.
- Root cause:
  - `electron/obsidianIpc.ts` already rejects malformed runtime `date` values with `date !== undefined && typeof date !== 'string'` before `getDateKey(date)`.
  - `electron/obsidianIpc.ts`, `electron/preload.ts`, and `src/vite-env.d.ts` still advertised trusted `string` inputs for `openDailyNote(...)`.
- Added focused RED coverage in `scripts/verify-electron-obsidian-ipc-module.ts` requiring `openDailyNote(...)` to expose `unknown` through preload, ambient types, and IPC handler before runtime narrowing.
- Confirmed RED with `npm.cmd run verify:electron-obsidian-ipc-module` failing because the IPC handler still typed `date` as `string`.
- Updated:
  - `electron/obsidianIpc.ts`: `obsidian:openDailyNote` handler uses `date?: unknown`.
  - `electron/preload.ts`: `openDailyNote(date?: unknown)`.
  - `src/vite-env.d.ts`: ambient `openDailyNote(date?: unknown)`.
- Fresh verification passed:
  - `npm.cmd run verify:electron-obsidian-ipc-module`
  - `npm.cmd run verify:electron-main-window-bootstrap-module`
  - `npm.cmd run typecheck`
- Deferred `npm.cmd run build` per fast batch mode; production build last passed in Phase 276.

## 2026-07-11 - Phase 279 AI Review model-list config type contract narrowing
- Continued fast batch mode after Phase 278 and narrowed the AI Review model-list config type surface to match the existing runtime field guards.
- Root cause:
  - `electron/aiReviewTemplateToolsIpc.ts` already treats model-list config fields as runtime data, accepting only string `baseUrl` / `apiKey` and whitelisted provider values before calling `listModels(...)`.
  - `electron/aiReviewTemplateToolsIpc.ts`, `electron/preload.ts`, and `src/vite-env.d.ts` still advertised a trusted `{ baseUrl?: string; apiKey?: string; provider?: string }` config object.
- Added focused RED coverage in `scripts/verify-electron-ai-review-template-tools-ipc-module.ts` requiring `listModels(...)` to expose `unknown` through IPC, preload, and ambient types before field-level narrowing.
- Confirmed RED with `npm.cmd run verify:electron-ai-review-template-tools-ipc-module` failing because the IPC handler still typed `cfg` as a structured config object.
- Updated:
  - `electron/aiReviewTemplateToolsIpc.ts`: `aiReview:listModels` handler uses `cfg: unknown`, then narrows `baseUrl`, `apiKey`, and `provider` locally.
  - `electron/preload.ts`: `aiReview.listModels(cfg: unknown)`.
  - `src/vite-env.d.ts`: ambient `aiReview.listModels(cfg: unknown)`.
  - `scripts/verify-electron-ai-review-template-tools-ipc-module.ts`: RED contract assertions plus provider whitelist assertion updated for the local `rawProvider` guard.
- Fresh verification passed:
  - `npm.cmd run verify:electron-ai-review-template-tools-ipc-module`
  - `npm.cmd run verify:electron-ai-review-ipc-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`

## 2026-07-11 - Phase 280 AI Review date input runtime hardening
- Continued the preload/IPC boundary pass after Phase 279 and hardened AI Review report dates before shared date-key derivation.
- Root cause:
  - `getDateKey(date?: string)` called `.slice()` directly, so malformed non-string IPC input could throw before its fallback logic.
  - AI Review daily, weekly, monthly, external, and source-material IPC signatures still advertised trusted date strings even though the boundary receives runtime data.
- Added focused RED coverage in `scripts/verify-electron-task-date-helpers-module.ts` and `scripts/verify-electron-ai-review-daily-run-inspect-ipc-module.ts`.
- Updated:
  - `electron/taskDateHelpers.ts`: `getDateKey(date?: unknown)` now accepts only non-empty strings; all other values use `getTodayDate()`.
  - `electron/aiReviewDailyRunInspectIpc.ts`, `electron/aiReviewWeeklyReportIpc.ts`, `electron/aiReviewMonthlyReportIpc.ts`, `electron/aiReviewExternalReportIpc.ts`, and `electron/aiReviewSourceMaterialsIpc.ts`: date inputs use `unknown`.
  - `electron/aiReviewReportIpcSourceCollection.ts`, `electron/aiReviewIpcRegistrationTypes.ts`, and `electron/mainWindowBootstrap.ts`: injection and registration types match the runtime boundary.
  - `electron/preload.ts` and `src/vite-env.d.ts`: AI Review date API inputs expose `unknown`.
  - Related verifiers: synchronized source-collection injection types and current split daily IPC module checks.
- Fresh verification passed:
  - `npm.cmd run verify:electron-task-date-helpers-module`
  - `npm.cmd run verify:electron-ai-review-daily-run-inspect-ipc-module`
  - `npm.cmd run verify:electron-ai-review-weekly-report-ipc-module`
  - `npm.cmd run verify:electron-ai-review-monthly-report-ipc-module`
  - `npm.cmd run verify:electron-ai-review-external-report-ipc-module`
  - `npm.cmd run verify:electron-ai-review-source-materials-ipc-module`
  - `npm.cmd run verify:electron-ai-review-report-ipc-source-collection-module`
  - `npm.cmd run verify:electron-ai-review-ipc-module`
  - `npm.cmd run verify:ai-regenerate-detection`
  - `npm.cmd exec -- tsx scripts/verify-ai-regenerate-force.ts`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`

## 2026-07-11 - Phase 281 Obsidian sync runtime payload type contract narrowing
- Continued the preload/IPC boundary pass after Phase 280 and narrowed Obsidian sync/preview payload types to match their existing runtime validation boundary.
- Root cause:
  - `electron/obsidianSync.ts` already rejects non-array task inputs, malformed task entries, non-string daily text, and non-string dates before preview generation or daily-note writes.
  - `electron/obsidianIpc.ts`, `electron/mainWindowBootstrap.ts`, `electron/preload.ts`, and `src/vite-env.d.ts` still advertised trusted task arrays and strings for the same runtime payloads.
- Added focused RED coverage in `scripts/verify-electron-obsidian-ipc-module.ts` requiring all five sync/preview payloads to remain `unknown` through the IPC, preload, ambient, dependency-injection, and helper-entry boundaries.
- Updated:
  - `electron/obsidianIpc.ts`: sync/preview handler and injected dependency input signatures use `unknown`.
  - `electron/obsidianSync.ts`: sync/preview helper entry points use `unknown`; the existing validation establishes trusted values before use.
  - `electron/mainWindowBootstrap.ts`: injected sync/preview contracts use `unknown`.
  - `electron/preload.ts` and `src/vite-env.d.ts`: sync/preview preload inputs expose `unknown`.
- Fresh verification passed:
  - `npm.cmd run verify:electron-obsidian-ipc-module`
  - `npm.cmd run verify:electron-obsidian-sync-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`

## 2026-07-11 - Phase 282 Companion sync runtime payload type contract narrowing
- Continued the preload/IPC boundary pass after Phase 281 and aligned Companion planning entry points with their existing runtime validation.
- Root cause:
  - `electron/preload.ts` and `src/vite-env.d.ts` already expose Companion sync input as runtime `unknown` values.
  - `electron/obsidianCompanion.ts` already validates capture-item arrays, settings array fields, rule/template entries, and vault availability before planning any change.
  - `electron/companionIpc.ts` nevertheless still advertised `CompanionSettings` payloads, and `buildSyncPlan(...)` still advertised trusted arguments.
- Added focused RED assertions in `scripts/verify-electron-companion-ipc-module.ts` for the two sync handlers and the bootstrap setter dependency.
- Confirmed RED with `npm.cmd run verify:electron-companion-ipc-module`, failing because `companion:previewSync` still typed `settings` as `CompanionSettings`.
- Updated:
  - `electron/companionIpc.ts`: preview/write handlers receive `settings: unknown, items: unknown`.
  - `electron/mainWindowBootstrap.ts`: injected Companion settings setter accepts `unknown`.
  - `electron/obsidianCompanion.ts`: `buildSyncPlan(settings: unknown, items: unknown)` preserves structured failure responses and introduces a private narrowed planning-settings guard after structural validation.
- Fresh verification passed:
  - `npm.cmd run verify:electron-companion-ipc-module`
  - `npm.cmd run verify:companion`
  - `npm.cmd run verify:electron-main-window-bootstrap-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`

## 2026-07-11 - Phase 283 AI Review daily runtime task payload hardening
- Continued the preload/IPC boundary pass after Phase 282 and hardened the daily AI Review runner against malformed task payloads and truthy force values.
- Root cause:
  - `aiReview:runForDate` accepted a renderer-controlled `tasks: ElectronTask[]` declaration without establishing that structure at runtime before daily review, statistics, and write paths consumed it.
  - The handler used `Boolean(force)`, so values such as the string `"false"` incorrectly enabled forced regeneration.
- Added focused RED coverage in `scripts/verify-electron-ai-review-daily-run-inspect-ipc-module.ts` requiring recursive task validation, malformed-payload rejection, `unknown` runtime task/force inputs, and strict force narrowing.
- Confirmed RED with `npm.cmd run verify:electron-ai-review-daily-run-inspect-ipc-module`, failing because the task runtime guard was missing.
- Updated:
  - `electron/aiReviewDailyRunInspectIpc.ts`: validates all task fields and nested subtasks before invoking `runReviewForDate(...)`; malformed payloads return the existing structured failure result; `force` is enabled only by `force === true`.
  - `electron/preload.ts` and `src/vite-env.d.ts`: `aiReview.runForDate(...)` now exposes all renderer-provided inputs as `unknown`.
  - `scripts/verify-electron-ai-review-ipc-module.ts`: tracks the strict force contract instead of stale `Boolean(force)` coercion.
- Fresh verification passed:
  - `npm.cmd run verify:electron-ai-review-ipc-module`
  - `npm.cmd run verify:electron-ai-review-daily-run-inspect-ipc-module`
  - `npm.cmd exec -- tsx scripts/verify-ai-regenerate-force.ts`
  - `npm.cmd run typecheck`
- `npm.cmd run build` passed after the implementation change; the only later edit was a verifier assertion synchronization.

## 2026-07-11 - Phase 284 AI Review report/backfill task payload validation
- Continued the AI Review IPC boundary pass after Phase 283 and closed the same task-payload trust gap in report generation and backfill paths.
- Root cause:
  - `aiReview:generateWeekly`, `aiReview:generateMonthly`, and `aiReview:backfill` still declared renderer-controlled task payloads as `ElectronTask[]`.
  - Weekly/monthly handlers cast those payloads to stats tasks before `computeRangeStats(...)`, and backfill cast them before the backfill runner consumed them.
- Added focused RED coverage in:
  - `scripts/verify-electron-ai-review-daily-run-inspect-ipc-module.ts`
  - `scripts/verify-electron-ai-review-weekly-report-ipc-module.ts`
  - `scripts/verify-electron-ai-review-monthly-report-ipc-module.ts`
  - `scripts/verify-electron-ai-review-backfill-ipc-module.ts`
- Confirmed RED with all four focused verifiers failing because `electron/aiReviewTaskPayload.ts` did not exist.
- Updated:
  - `electron/aiReviewTaskPayload.ts`: shared recursive `ElectronTask[]` guard for AI Review task payloads, including optional carried-task fields and completion-review entries.
  - `electron/aiReviewDailyRunInspectIpc.ts`: daily run now imports the shared guard.
  - `electron/aiReviewWeeklyReportIpc.ts` and `electron/aiReviewMonthlyReportIpc.ts`: task payloads are `unknown`, malformed payloads return `{ ok: false, error }`, and validated tasks flow directly into `computeRangeStats(...)`.
  - `electron/aiReviewBackfillIpc.ts`: task payload is `unknown`, malformed payloads return processed/filled/errors arrays, and validated tasks flow directly to the backfill runner.
- Fresh verification passed:
  - `npm.cmd run verify:electron-ai-review-daily-run-inspect-ipc-module`
  - `npm.cmd run verify:electron-ai-review-weekly-report-ipc-module`
  - `npm.cmd run verify:electron-ai-review-monthly-report-ipc-module`
  - `npm.cmd run verify:electron-ai-review-backfill-ipc-module`
  - `npm.cmd run verify:electron-ai-review-ipc-module`
  - `npm.cmd exec -- tsx scripts/verify-ai-regenerate-force.ts`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`

## 2026-07-11 - Phase 285 AI Review report-kind runtime narrowing
- Continued the Electron/preload boundary pass after Phase 284 and narrowed the remaining AI Review `weekly`/`monthly` report-kind inputs.
- Root cause:
  - `aiReview:generateExternal` and `aiReview:testSourceMaterials` declared renderer-controlled `kind` values as `'weekly' | 'monthly'`.
  - Both handlers branched with `if (kind === 'weekly') ... else ...`, so malformed runtime values silently used the monthly path.
- Added focused RED coverage in:
  - `scripts/verify-electron-ai-review-external-report-ipc-module.ts`
  - `scripts/verify-electron-ai-review-source-materials-ipc-module.ts`
- Confirmed RED with both focused verifiers failing because `electron/aiReviewReportKind.ts` did not exist.
- Updated:
  - `electron/aiReviewReportKind.ts`: shared `weekly`/`monthly` guard and malformed-kind error text.
  - `electron/aiReviewExternalReportIpc.ts`: handler receives `kind: unknown` and rejects malformed kinds before settings/vault/source/report work.
  - `electron/aiReviewSourceMaterialsIpc.ts`: handler receives `kind: unknown` and rejects malformed kinds before vault/source work while preserving the `{ sources: [] }` failure shape.
  - `electron/preload.ts` and `src/vite-env.d.ts`: `generateExternal(...)` and `testSourceMaterials(...)` expose `kind` as `unknown`.
- Fresh verification passed:
  - `npm.cmd run verify:electron-ai-review-external-report-ipc-module`
  - `npm.cmd run verify:electron-ai-review-source-materials-ipc-module`
  - `npm.cmd run verify:electron-ai-review-ipc-module`
  - `npm.cmd run verify:electron-main-window-bootstrap-module`
  - `npm.cmd exec -- tsx scripts/verify-ai-regenerate-force.ts`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`

## 2026-07-11 - Phase 286 Electron Store key runtime narrowing
- Continued the Electron/preload boundary pass after Phase 285 and narrowed the generic Electron Store key contract.
- Root cause:
  - `store:get` and `store:set` receive renderer-controlled IPC payloads.
  - `electron/settingsIpc.ts`, `electron/preload.ts`, and `src/vite-env.d.ts` still advertised trusted `string` keys, so malformed runtime values could reach `store.get(...)` / `store.set(...)`.
- Added focused RED coverage in `scripts/verify-electron-settings-ipc-module.ts` requiring:
  - `store:get` handler key input to be `unknown` and guarded with `typeof key !== 'string'`.
  - `store:set` handler key input to be `unknown` and guarded before Electron Store writes.
  - preload and ambient `getStore(...)` / `setStore(...)` key inputs to expose `unknown`.
- Confirmed RED with `npm.cmd run verify:electron-settings-ipc-module`, failing because `store:get` still typed `key` as `string`.
- Updated:
  - `electron/settingsIpc.ts`: `store:get` returns `undefined` for non-string keys and reads only after string narrowing.
  - `electron/settingsIpc.ts`: `store:set` returns early for non-string keys and writes only after string narrowing.
  - `electron/preload.ts`: `getStore(key: unknown)` and `setStore(key: unknown, value: unknown)`.
  - `src/vite-env.d.ts`: ambient store key inputs expose `unknown`.
- Fresh verification passed:
  - `npm.cmd run verify:electron-settings-ipc-module`
  - `npm.cmd run verify:electron-main-window-bootstrap-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`

## 2026-07-12 - Phase 287 Companion sync items type contract narrowing
- Continued the Electron/preload boundary pass after Phase 286 and narrowed Companion sync item inputs.
- Root cause:
  - Companion preview/write already validated items at the planner boundary as `unknown`.
  - `electron/preload.ts` and `src/vite-env.d.ts` still advertised `items: unknown[]`, overstating array trust before validation.
- Added focused RED coverage in `scripts/verify-electron-companion-ipc-module.ts` requiring:
  - preload `previewCompanionSync(...)` / `writeCompanionSync(...)` item inputs to expose `unknown`.
  - ambient API declarations to expose `items: unknown` and reject `items: unknown[]`.
- Confirmed RED with ambient still claiming array-ness for Companion sync items.
- Updated:
  - `electron/preload.ts`: `previewCompanionSync(settings: unknown, items: unknown)` and `writeCompanionSync(settings: unknown, items: unknown)`.
  - `src/vite-env.d.ts`: ambient Companion sync item inputs expose `unknown`.
- Fresh verification passed:
  - `npm.cmd run verify:electron-companion-ipc-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `npm.cmd run verify:companion`

## 2026-07-12 - Phase 288 Ambient listener payload runtime narrowing
- Continued the Electron/preload boundary pass after Phase 287 and narrowed one-way listener payload contracts.
- Root cause:
  - Main process already emits normalized window-mode and AI progress values.
  - Ambient types still advertised trusted `WindowMode` / `AiReviewProgressEvent` callback payloads, while preload already forwarded progress as `unknown` and mode as loosely typed `string`.
  - `SettingsPanel` stored progress payloads directly into typed state without a runtime guard.
- Added focused RED coverage in:
  - `scripts/verify-electron-window-ipc-module.ts`
  - `scripts/verify-ai-run-diagnostics.ts`
- Confirmed RED:
  - window verifier failed because preload still typed mode as `string`.
  - diagnostics verifier failed because ambient still claimed trusted progress events and `isAiReviewProgressEvent(...)` did not exist.
- Updated:
  - `electron/preload.ts`: `onWindowModeChanged` callback/listener mode payloads are `unknown`.
  - `src/vite-env.d.ts`: ambient `onWindowModeChanged` and `aiReview.onProgress` expose `unknown` payloads.
  - `shared/aiReview/runDiagnostics.ts`: added `isAiReviewProgressEvent(...)`.
  - `src/components/SettingsPanel.tsx`: ignore malformed progress payloads before `setCurrentProgress(...)`.
  - calibrated `scripts/verify-ai-run-diagnostics.ts` and `scripts/verify-ai-progress-ui.ts` to the extracted weekly/monthly/daily AI modules.
- Fresh verification passed:
  - `npm.cmd run verify:electron-window-ipc-module`
  - `npm.cmd run verify:ai-run-diagnostics`
  - `npm.cmd run verify:ai-progress-ui`
  - `npm.cmd run verify:electron-main-window-bootstrap-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`

## 2026-07-12 - Phase 289 Renderer stored task payload runtime narrowing
- Continued boundary hardening after Phase 288, this time on renderer-side task store and broadcast consumption.
- Root cause:
  - `loadTasks()` cast Electron Store values with `(tasks as Task[]) || []`.
  - `normalizeIncomingTasks(...)` cast every array entry with `task as Task` before `normalizeTask(...)`.
  - Malformed entries such as `null` could crash normalization, and non-task objects could enter React task state.
- Added focused RED coverage in `scripts/verify-task-hook-state.ts` requiring:
  - malformed entries to be dropped
  - shared `parseStoredTasks(...)` ownership for store load and broadcast normalization
- Confirmed RED with `null` entries crashing inside `normalizeTask(...)`.
- Updated:
  - `src/hooks/taskTransforms.ts`: added recursive `isTaskLike(...)` and `parseStoredTasks(...)`.
  - `src/hooks/taskHookState.ts`: `normalizeIncomingTasks` parses first, then normalizes.
  - `src/store/taskStore.ts`: `loadTasks()` returns `parseStoredTasks(tasks)`.
- Fresh verification passed:
  - `npm.cmd run verify:task-hook-state`
  - `npm.cmd run verify:task-mutations`
  - `npm.cmd run verify:task-carryover`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`

## 2026-07-12 - Phase 290 Renderer task UI store value runtime narrowing
- Continued renderer-side store hardening after Phase 289 and narrowed remaining task UI hydration casts.
- Root cause:
  - `loadInitialTaskState()` cast selected date, last active day, active tab, carryover ledger, and retained reviews with `as`.
  - daily note maps and task list order only shallow-cast records, so non-string values and malformed order entries could enter React state.
  - `useTasks` business-date rollover also cast the carryover ledger store value.
- Added focused RED coverage in `scripts/verify-task-persistence.ts` requiring exported parsers and parser ownership in both `taskPersistence` and `useTasks`.
- Confirmed RED because the parsers were missing and casts remained.
- Updated:
  - `src/hooks/taskPersistence.ts`: added `parseStoredDateKey`, `parseStoredActiveTab`, `parseStoredStringRecord`, `parseStoredCarryoverLedger`, `parseStoredTaskListOrder`, and `parseStoredRetainedObsidianReviews`; `loadInitialTaskState()` now uses them.
  - `src/hooks/useTasks.ts`: rollover uses `parseStoredCarryoverLedger(value)`.
  - `package.json`: added `verify:task-persistence` and included it in `verify:task-core`.
- Fresh verification passed:
  - `npm.cmd run verify:task-persistence`
  - `npm.cmd run verify:task-carryover`
  - `npm.cmd run verify:task-list-interactions`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`

## 2026-07-12 - Phase 291 Renderer personalization and UI store runtime narrowing
- Continued renderer store hardening after Phase 290 and narrowed personalization / UI-state hydration.
- Root cause:
  - `normalizeLoadedPersonalization(...)` cast unknown store objects as `Partial<PersonalizationSettings>`.
  - `mergeStoredThemeOverrides(...)` cast unknown store values as theme override records.
  - `loadAppUiState(...)` used `Boolean(value)` for panel/search flags and `as string` for search query.
- Extended focused RED coverage in:
  - `scripts/verify-app-personalization-module.ts`
  - `scripts/verify-app-ui-state-persistence-module.ts`
- Confirmed RED because casts and Boolean coercion remained.
- Updated:
  - `src/app/appPersonalization.ts`: field-level personalization parsing and `parseStoredThemeOpacityOverrides(...)`.
  - `src/app/appUiStatePersistence.ts`: strict true for open flags and string-only search query hydration.
- Fresh verification passed:
  - `npm.cmd run verify:app-personalization-module`
  - `npm.cmd run verify:app-ui-state-persistence-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`

## 2026-07-12 - Phase 292 Task menu popup URL payload runtime narrowing
- Continued renderer boundary hardening after Phase 291 and narrowed the task-menu popup bootstrap path.
- Root cause:
  - popup URL payload JSON was cast with `parsed.task as Task`
  - `isDark` used `Boolean(...)`, so truthy non-booleans became dark mode
  - non-string tags could enter suggestion/state arrays
- Extended focused RED coverage in `scripts/verify-context-menu.ts`.
- Updated `src/components/TaskMenuPopup.tsx`:
  - exported `parseTaskMenuPopupPayload(...)`
  - validated tasks with `isTaskLike(...)`
  - kept only string tags and real boolean dark-mode values
- Fresh verification passed:
  - `npm.cmd run verify:context-menu`
  - `npm.cmd run verify:app-task-menu-actions-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`

## 2026-07-12 - Phase 293 Template editor kind narrowing without casts
- Continued after Phase 292 and removed remaining template-editor union casts.
- Root cause:
  - `getInitialTemplateForKind` cast settings as `Partial<ObsidianTemplateSettings>`
  - `applyTemplateUpdate` cast `DailyTemplate | ReportTemplate` into concrete fields
- Extended focused RED coverage in `scripts/verify-app-template-editor-module.ts`.
- Updated `src/app/appTemplateEditor.ts` to use direct field reads and structural daily/report narrowing.
- Fresh verification passed:
  - `npm.cmd run verify:app-template-editor-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`

## 2026-07-12 - Phase 294 AI Review generation diagnostic runtime narrowing
- Continued renderer boundary hardening after Phase 293 and narrowed AI Review generation diagnostic consumption.
- Root cause:
  - daily generation stored `result.diagnostic` without validation
  - weekly/monthly/external results used `(result as { diagnostic?: AiReviewRunDiagnostic }).diagnostic`
  - external generation ambient return types do not even advertise diagnostics, so the cast overstated trust
- Extended focused RED coverage in `scripts/verify-ai-run-diagnostics.ts`.
- Updated:
  - `shared/aiReview/runDiagnostics.ts`: `isAiReviewRunDiagnostic(...)` and `readAiReviewRunDiagnostic(...)`
  - `src/components/SettingsPanel.tsx`: all generation paths use the guarded reader before `setLastDiagnostic(...)`
- Fresh verification passed:
  - `npm.cmd run verify:ai-run-diagnostics`
  - `npm.cmd run verify:ai-progress-ui`
  - `npm.cmd run verify:settings-ai-review-manual-generation-section`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`

## 2026-07-12 - Phase 295 Settings select event value runtime narrowing
- Continued renderer boundary hardening after Phase 294 and removed settings select/event enum casts.
- Root cause:
  - language select used `event.target.value as AppLanguage`
  - weekly/monthly source selects used `as WeeklySourceMode` / `as MonthlySourceMode`
  - AI provider select used `event.target.value as AiProfile['provider']`
- Extended focused RED coverage in:
  - `scripts/verify-settings-basic-sections.ts`
  - `scripts/verify-settings-ai-review-source-section.ts`
  - `scripts/verify-settings-ai-review-module.ts`
- Updated:
  - `shared/appSettings.ts`: exported `isAppLanguage(...)`
  - `shared/aiReview/aiReviewSettings.ts`: exported `isAiProvider(...)`
  - `src/components/settings/GeneralSettingsSection.tsx`
  - `src/components/settings/AiReviewSourceSettingsSection.tsx`
  - `src/components/settings/AiReviewSettingsWidgets.tsx`
- Fresh verification passed:
  - `npm.cmd run verify:settings-basic-sections`
  - `npm.cmd run verify:settings-ai-review-source-section`
  - `npm.cmd run verify:settings-ai-review-module`
  - `npm.cmd run verify:ai-settings`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`

## 2026-07-12 - Phase 296 Task priority filter runtime narrowing
- Continued renderer boundary hardening after Phase 295 and removed the task priority filter select cast.
- Root cause:
  - `TaskListToolbar` used `event.target.value as PriorityFilter`
  - `loadAppUiState` inlined the same enum checks for store hydration
- Extended focused RED coverage in:
  - `scripts/verify-task-list-interactions.ts`
  - `scripts/verify-app-task-view-module.ts`
  - `scripts/verify-app-ui-state-persistence-module.ts`
- Updated:
  - `src/app/appTaskView.ts`: `isPriorityFilter(...)`
  - `src/components/taskList/TaskListToolbar.tsx`
  - `src/app/appUiStatePersistence.ts`
- Fresh verification passed:
  - `npm.cmd run verify:task-list-interactions`
  - `npm.cmd run verify:app-task-view-module`
  - `npm.cmd run verify:app-ui-state-persistence-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`

## 2026-07-12 - Phase 297 Completion review status runtime narrowing
- Continued renderer boundary hardening after Phase 296 and removed completion-review status select casts.
- Root cause:
  - `TaskCompletionDialog` used `event.target.value as TaskCompletionReview['status']`
  - `ReviewView` edit form used the same cast for status edits
- Extended focused RED coverage in `scripts/verify-review-empty-fields.ts`.
- Updated:
  - `shared/completionReviews.ts`: `isTaskCompletionReviewStatus(...)`
  - `src/components/TaskCompletionDialog.tsx`
  - `src/components/ReviewView.tsx`
- Fresh verification passed:
  - `npm.cmd run verify:review-fields`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`

## 2026-07-12 - Phase 298 Companion write mode runtime narrowing
- Continued renderer boundary hardening after Phase 297 and removed Companion write-mode select casts.
- Root cause:
  - `ObsidianCompanionPanel` used `event.target.value as WriteMode`
  - Electron companion/app-state rule validators inlined the same append/managed-block checks
- Extended focused RED coverage in `electron/obsidianCompanion.verify.ts`.
- Updated:
  - `shared/obsidianCompanion.ts`: `isWriteMode(...)`
  - `src/components/ObsidianCompanionPanel.tsx`
  - `electron/obsidianCompanion.ts`
  - `electron/appStateAccessors.ts`
- Fresh verification passed:
  - `npm.cmd run verify:companion`
  - `npm.cmd run verify:electron-app-state-accessors-module`
  - `npm.cmd run verify:electron-companion-ipc-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`

## 2026-07-12 - Phase 299 Template render type runtime narrowing
- Continued renderer boundary hardening after Phase 298 and removed template render-type select casts.
- Root cause:
  - `TemplateEditorModal` used `e.target.value as RenderType`
  - `TemplateRecognitionModal` used the same cast when editing recognized blocks
- Extended focused RED coverage in `scripts/verify-section-config.ts`.
- Updated:
  - `shared/aiReview/sectionConfig.ts`: `isRenderType(...)`
  - `src/components/TemplateEditorModal.tsx`
  - `src/components/TemplateRecognitionModal.tsx`
- Fresh verification passed:
  - `npm.cmd run verify:section-config`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`

## 2026-07-12 - Phase 300 Ambient settings getter return runtime narrowing
- Continued boundary hardening after Phase 299 and removed ambient overtrust on settings getter return types.
- Root cause:
  - preload ambient types claimed trusted returns for app/companion/AI settings getters
  - renderer consumers wrote those returns into state without local re-normalization
- Extended focused RED coverage in settings/companion/AI Review IPC and startup/lifecycle verifiers.
- Updated:
  - `shared/obsidianCompanion.ts`: `isCompanionRule` / `isCompanionTemplate`
  - `shared/obsidianCompanionDefaults.ts`: `normalizeCompanionSettings`
  - `electron/appStateAccessors.ts`: reuse shared companion normalizer
  - `src/vite-env.d.ts`: getter returns as `Promise<unknown>`
  - `src/store/taskStore.ts`, `src/components/SettingsPanel.tsx`, `src/app/appAiReviewLifecycle.ts`, startup/template action helpers
- Fresh verification passed:
  - focused IPC/renderer verifiers
  - TypeScript
  - production build

## 2026-07-12 - Phase 301 AI Review settings setter return runtime narrowing
- Continued ambient boundary hardening after Phase 300.
- Root cause: `aiReview.setSettings` / `setSections` ambient returns claimed trusted settings/sections objects.
- Updated ambient contracts to `Promise<unknown>`; renderer callers already ignore returns and keep local trusted state.
- Fresh verification passed for settings/sections IPC, AI settings, TypeScript, and build.

## 2026-07-12 - Phase 302 AI Review generation result runtime narrowing
- Continued ambient return-type hardening after Phase 301.
- Root cause: generation/inspection APIs claimed trusted structured returns, including diagnostics, at the preload ambient boundary.
- Added shared readers for generation results and daily inspections; SettingsPanel and scheduled-report handling now parse unknown IPC returns before UI/side effects.
- Fresh verification passed for diagnostics/progress/manual-generation/lifecycle, TypeScript, and build.

## 2026-07-12 - Phase 303 AI Review listModels result runtime narrowing
- Continued ambient return-type hardening after Phase 302.
- Root cause: `aiReview.listModels` ambient return claimed a trusted success/failure union while preload only forwards IPC runtime data.
- Added `readListModelsResult(...)` and updated AI account model-fetch UI to parse unknown returns before reading model lists.
- Fresh verification passed for template-tools IPC, settings AI review module, openai-client, TypeScript, and build.

## 2026-07-12 - Phase 304 Companion preview/write/import result runtime narrowing
- Continued ambient return-type hardening after Phase 303.
- Root cause: Companion `previewCompanionSync` / `writeCompanionSync` / `importMobileInbox` ambient returns claimed trusted plan/write/import objects while preload only forwards IPC runtime data.
- Added shared CaptureItem/SyncPlan/write/import readers; Companion actions now revalidate unknown IPC returns before writing plan/status/item state.
- Electron Companion planning now reuses shared `isCaptureItem(...)`.
- Fresh verification passed for Companion IPC/actions/status/mobile/companion, TypeScript, and build.

## 2026-07-12 - Phase 305 Obsidian sync preview result runtime narrowing
- Continued ambient return-type hardening after Phase 304.
- Root cause: `previewTasksToObsidian` ambient return claimed trusted `SyncPreview` while preload only forwards IPC runtime data.
- Added shared `readSyncPreview(...)`; store wrapper and template actions now revalidate unknown returns before writing settings preview state.
- Fresh verification passed for Obsidian IPC/template-actions/settings-sync, TypeScript, and build.

## 2026-07-12 - Phase 306 Window mode return runtime narrowing
- Continued ambient return-type hardening after Phase 305.
- Root cause: `getWindowMode` / `setWindowMode` ambient returns claimed trusted `WindowMode` while preload only forwards IPC runtime data.
- Added `readWindowMode(...)`; TitleBar now revalidates window-mode returns/events before pin-state updates.
- Fresh verification passed for window IPC/window-mode, TypeScript, and build.

## 2026-07-12 - Phase 307 AI Review backfill result runtime narrowing
- Continued ambient return-type hardening after Phase 306.
- Root cause: `aiReview.backfill` ambient return claimed trusted processed/filled/errors objects while preload only forwards IPC runtime data.
- Added `readAiReviewBackfillReport(...)`; lifecycle paths now revalidate unknown backfill returns before any future side effects.
- Fresh verification passed for backfill IPC/lifecycle/run-diagnostics, TypeScript, and build.

## 2026-07-12 - Phase 308 AI Review template tools result runtime narrowing
- Continued ambient return-type hardening after Phase 307.
- Root cause: `recognizeTemplate`, `recognizeReportTemplate`, and `testSourceMaterials` ambient returns claimed trusted structured objects while preload only forwards IPC runtime data.
- Added shared readers for template recognition, report-template recognition, and source-materials results.
- Updated ambient contracts to `Promise<unknown>` and verifier coverage for the new boundary.
- Fresh verification passed for template/tools IPC, source-materials IPC, recognize-template, recognize-report, source-materials, TypeScript, and build.

## 2026-07-12 - Phase 309 Obsidian sync/open result runtime narrowing
- Continued ambient return-type hardening after Phase 308.
- Root cause: Obsidian path, sync, preview, and open-daily-note APIs still claimed trusted renderer-visible returns while preload only forwards IPC runtime data.
- Added browser-safe Obsidian result readers in `shared/obsidianIpcResults.ts` for action results, path strings, and sync previews.
- Updated task-store and Obsidian template action consumers to parse unknown IPC returns before hook exposure or settings preview state writes.
- Updated ambient Obsidian path/sync/preview/open contracts to `Promise<unknown>`.
- Fresh verification passed for Obsidian IPC, settings sync, template actions, TypeScript, and build.

## 2026-07-12 - Phase 310 Obsidian template recognition result runtime narrowing
- Continued ambient return-type hardening after Phase 309.
- Root cause: `obsidianTemplate.recognize`, Obsidian template picker, and AI Review template picker ambient returns still claimed trusted structured objects while preload only forwards IPC runtime data.
- Added `readObsidianTemplateRecognitionResult(...)` and `readTemplatePickerResult(...)` in `shared/obsidianTemplateRecognition.ts`.
- Updated `ObsidianTemplateCenter` to parse unknown recognition/picker returns before writing recognized drafts, draft text, file names, or failure status.
- Updated ambient recognition/picker contracts to `Promise<unknown>` and refreshed the focused UI/recognition verifiers.
- Fresh verification passed for Obsidian IPC, AI Review template-tools IPC, Obsidian template recognition/UI, TypeScript, and build.

## 2026-07-12 - Phase 310 documentation and final verification
- Updated `task_plan.md`, `findings.md`, `progress.md`, and `codex_handoff.md` with Phase 310 scope, findings, verification, and next candidates.
- Rechecked Phase 310 references with `rg` for the shared readers, ambient `Promise<unknown>` contracts, and template-center parser usage.
- Fresh final verification passed:
  - `npm.cmd run verify:electron-obsidian-ipc-module`
  - `npm.cmd run verify:electron-ai-review-template-tools-ipc-module`
  - `npm.cmd run verify:obsidian-template-recognition`
  - `npm.cmd run verify:obsidian-template-ui`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`

## 2026-07-12 - Phase 311 Window settings-mode return runtime narrowing
- Continued ambient return-type hardening after Phase 310.
- Root cause: `setSettingsMode(...)` already accepted runtime `unknown` input, and the renderer only calls it fire-and-forget through `syncSettingsMode(settingsOpen)`, but the ambient declaration still claimed a trusted `{ ok: boolean; width?: number }` return from preload IPC.
- Added focused RED coverage in `scripts/verify-electron-window-ipc-module.ts` requiring `setSettingsMode(...)` to return `Promise<unknown>` and to avoid advertising trusted settings-mode result objects.
- RED observed: `npm.cmd run verify:electron-window-ipc-module` failed before the ambient fix because `src/vite-env.d.ts` still exposed `Promise<{ ok: boolean; width?: number }>`.
- Updated `src/vite-env.d.ts`: `setSettingsMode: (open: unknown) => Promise<unknown>`.
- Calibrated `scripts/verify-settings-v2-window-mode.ts` to the current moduleized implementation:
  - `main.ts` creates `createSettingsModeState(...)` and no longer owns inline handler state.
  - `mainWindowBootstrap.ts` passes `settingsMode` into `registerWindowIpcHandlers(...)`.
  - `electron/windowIpc.ts` owns `window:setSettingsMode`, strict `open === true`, width/min-size behavior, and no-op close behavior.
  - `src/App.tsx` syncs through `syncSettingsMode(settingsOpen)`.
- Fresh verification passed:
  - `npm.cmd run verify:settings-v2-window-mode`
  - `npm.cmd run verify:electron-window-ipc-module`
  - `npm.cmd run verify:app-shell-effects-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`

## 2026-07-12 - Phase 311 documentation update
- Updated `task_plan.md`, `findings.md`, `progress.md`, and `codex_handoff.md` with Phase 311 scope, findings, verification, and next seam candidates.

## 2026-07-12 - Phase 312 Settings setter return runtime narrowing
- Continued ambient return-type hardening after Phase 311.
- Root cause: `setAppSettings(...)`, `setObsidianTemplateSettings(...)`, and `setCompanionSettings(...)` already accepted runtime `unknown` inputs, and renderer action paths keep local trusted state or ignore setter returns, but ambient declarations still claimed trusted `{ ok: boolean }` write-result objects from preload IPC.
- Added focused RED coverage:
  - `scripts/verify-electron-settings-ipc-module.ts`: app/Obsidian template settings setters must return `Promise<unknown>` and must not claim trusted write-result objects.
  - `scripts/verify-electron-companion-ipc-module.ts`: Companion settings setter must return `Promise<unknown>` and must not claim trusted write-result objects.
- RED observed:
  - `npm.cmd run verify:electron-settings-ipc-module` failed because `src/vite-env.d.ts` still exposed `setAppSettings(...)` and `setObsidianTemplateSettings(...)` as `Promise<{ ok: boolean }>`.
  - `npm.cmd run verify:electron-companion-ipc-module` failed because `setCompanionSettings(...)` still exposed `Promise<{ ok: boolean }>`.
- Updated `src/vite-env.d.ts`:
  - `setAppSettings: (settings: unknown) => Promise<unknown>`
  - `setObsidianTemplateSettings: (settings: unknown) => Promise<unknown>`
  - `setCompanionSettings: (settings: unknown) => Promise<unknown>`
- Calibrated `scripts/verify-electron-app-state-accessors-module.ts` from stale `createDefaultCompanionSettings` text wiring to current shared `normalizeCompanionSettings(...)` wiring.
- Verification notes:
  - `npm.cmd run verify:electron-app-state-accessors-module` failed once in the restricted sandbox with `EPERM` when creating a temporary directory under Windows Temp; reran with approved escalation and it passed.
- Fresh verification passed:
  - `npm.cmd run verify:electron-settings-ipc-module`
  - `npm.cmd run verify:electron-companion-ipc-module`
  - `npm.cmd run verify:app-companion-actions-module`
  - `npm.cmd run verify:app-obsidian-template-actions-module`
  - `npm.cmd run verify:electron-app-state-accessors-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`

## 2026-07-12 - Phase 312 documentation update
- Updated `task_plan.md`, `findings.md`, `progress.md`, and `codex_handoff.md` with Phase 312 scope, findings, verification, sandbox note, and next seam candidates.

## 2026-07-12 - Phase 313 Window/system boolean return runtime narrowing
- Continued ambient return-type hardening after Phase 312.
- Root cause: window/system boolean APIs still claimed trusted `Promise<boolean>` returns in `src/vite-env.d.ts`, even though preload only forwards runtime IPC values from `getAlwaysOnTop`, `toggleAlwaysOnTop`, lock-position, compact-mode, and auto-start channels.
- Added focused RED coverage in `scripts/verify-electron-window-ipc-module.ts` requiring those ambient returns to be `Promise<unknown>` and requiring renderer consumers to narrow before state writes.
- RED observed: `npm.cmd run verify:electron-window-ipc-module` failed before the ambient fix because `getAlwaysOnTop(...)` still exposed `Promise<boolean>`.
- Updated `src/vite-env.d.ts`:
  - `getAlwaysOnTop`, `toggleAlwaysOnTop`, `getLockWindowPosition`, `setLockWindowPosition`, `getWindowCompactMode`, `getAutoStart`, and `setAutoStart` now return `Promise<unknown>`.
- Updated `src/components/settings/SettingsControls.tsx` so AutoStart initial load and setter response update state from `value === true`, instead of trusting a boolean or treating the setter result as an `{ ok }`/success flag.
- Confirmed existing consumers already had local narrowing where needed:
  - `TitleBar` checks `typeof isOnTop === 'boolean'` and falls back to `readWindowMode(await getWindowMode())`.
  - `appUiStatePersistence` loads compact mode with `value === true`.
- Fresh verification passed:
  - `npm.cmd run verify:electron-window-ipc-module`
  - `npm.cmd run verify:settings-panel-modules`
  - `npm.cmd run verify:app-ui-state-persistence-module`
  - `npm.cmd run verify:app-shell-effects-module`
  - `npm.cmd run verify:window-mode`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`

## 2026-07-12 - Phase 314 Template FileReader result runtime narrowing
- Continued renderer runtime-value hardening after Phase 313.
- Root cause: `TemplateRecognitionModal` used `ev.target?.result as string` when loading `.md` / `.txt` files, even though `FileReader.result` is runtime `string | ArrayBuffer | null`.
- Added focused RED coverage in `scripts/verify-section-config.ts`; RED failed because the cast was still present.
- Updated `src/components/TemplateRecognitionModal.tsx` to set textarea state only when the loaded result is a string, falling back to `''` otherwise.
- Fresh verification passed:
  - `npm.cmd run verify:section-config`
  - `npm.cmd run verify:recognize-template`
  - `npm.cmd run verify:recognize-report`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`

## 2026-07-12 - Speed-mode adjustment
- User noted the optimization pass has become too slow after many hours.
- Going forward, prefer faster batches: group similar renderer casts/boundaries, patch multiple low-risk seams together, run focused verifiers, and reserve `typecheck` / `build` for batch checkpoints or type-sensitive edits.

## 2026-07-12 - Phase 315 batched renderer/shared cast narrowing
- Batched four low-risk runtime narrowing seams instead of one micro-phase per cast.
- RED coverage added for template reset kind narrowing, AI source-mode guards, Companion settings record narrowing, and task-source key filtering.
- Updated:
  - `src/components/TemplateEditorModal.tsx`
  - `shared/aiReview/aiReviewSettings.ts`
  - `shared/obsidianCompanionDefaults.ts`
  - `src/utils/taskOrdering.ts`
  - related focused verifiers
- Verification passed:
  - `npm.cmd run verify:app-template-editor-module`
  - `npm.cmd run verify:ai-settings`
  - `npm.cmd run verify:task-ordering-state`
  - `npm.cmd run verify:companion` with approved escalation for Windows Temp access
  - `npm.cmd run typecheck`
- `npm.cmd run build` deferred under speed mode; last build passed in Phase 314.

## 2026-07-12 - Phase 327 TaskList DnD activator cast narrowing
- RED observed:
  - `npm.cmd run verify:task-list-dnd-module` failed because `SortableTaskItem` still imported `ButtonHTMLAttributes` only to cast dnd-kit `attributes` and `listeners`.
- Updated:
  - `src/components/taskItem/taskItemControls.tsx`: `TaskDragHandleProps` now uses `DraggableAttributes` and `DraggableSyntheticListeners` from `@dnd-kit/core`.
  - `src/components/taskList/SortableTaskItem.tsx`: passes `attributes` and `listeners` directly without casts.
  - `scripts/verify-task-list-dnd-module.ts`: rejects the old casts and checks the dnd-kit activator prop types.
- Verification passed:
  - `npm.cmd run verify:task-list-dnd-module`
  - `npm.cmd run typecheck`
- `npm.cmd run build` deferred under speed mode; last build passed in Phase 314.

## 2026-07-12 - Phase 326 CSS custom property and error-code cast narrowing
- Continued speed-first batching; kept this pass to three local casts.
- RED observed:
  - `npm.cmd run verify:task-item-stack-helper` failed because `taskItemStack` still returned a custom-property style object via `as CSSProperties`.
  - `npm.cmd run verify:settings-appearance-section` failed because `AppearanceSettingsSection` still cast theme preset preview style objects with `as CSSProperties`.
  - `npm.cmd run verify:electron-companion-ipc-module` failed because `obsidianCompanion` still read EEXIST through `error as { code?: unknown }`.
- Updated:
  - `src/components/taskItem/taskItemStack.ts`: added `TaskStackSegmentStyle` for `--task-stack-segment-count` and returned it without a cast.
  - `src/components/settings/AppearanceSettingsSection.tsx`: added `ThemePresetPreviewStyle` and `getThemePresetPreviewStyle(...)` for typed theme preview custom properties.
  - `electron/obsidianCompanion.ts`: changed `isAlreadyExistsError(...)` to reuse `isObject(error)` before checking `error.code`.
  - Focused verifiers now reject the old casts.
- Verification passed:
  - `npm.cmd run verify:task-item-stack-helper`
  - `npm.cmd run verify:settings-appearance-section`
  - `npm.cmd run verify:electron-companion-ipc-module`
  - `npm.cmd run typecheck`
- `npm.cmd run build` deferred under speed mode; last build passed in Phase 314.

## 2026-07-12 - Phase 319 shared reader record guard cast narrowing
- Continued speed-first batching after the user asked to make the long optimization pass faster.
- Session catchup reported only this turn's unsynced context; `git diff --stat` confirmed the existing long-running dirty worktree and no unrelated rollback was attempted.
- RED coverage added:
  - `scripts/verify-openai-client.ts` rejects `readListModelsResult(...)` casting `value as Record<string, unknown>`.
  - `scripts/verify-ai-run-diagnostics.ts` rejects `isAiReviewProgressEvent(...)` casting `value as Record<string, unknown>`.
- Updated:
  - `shared/llm/openaiClient.ts`: `readListModelsResult(...)` now uses a local object-record guard before reading `ok`, `models`, or `error`.
  - `shared/aiReview/runDiagnostics.ts`: `isAiReviewProgressEvent(...)` now uses the shared `isObject(...)` guard before reading progress-event fields.
- Verification passed:
  - `npm.cmd run verify:openai-client`
  - `npm.cmd run verify:ai-run-diagnostics`
  - `npm.cmd run typecheck`
- `npm.cmd run build` deferred under speed mode; last build passed in Phase 314.

## 2026-07-12 - Phase 317 Electron AI Review runtime cast batch narrowing
- Continued faster batch mode after Phase 316 and removed two adjacent Electron AI Review casts.
- RED coverage added:
  - `scripts/verify-electron-ai-review-template-tools-ipc-module.ts` rejects model-list `cfg as { ... }` config reads.
  - `scripts/verify-electron-ai-review-daily-runner-module.ts` rejects daily-runner `tasks as StatTask[]` forwarding.
- Updated:
  - `electron/aiReviewTemplateToolsIpc.ts`: model-list config now goes through `isRecord(...)` before reading `baseUrl`, `apiKey`, and `provider`.
  - `electron/aiReviewDailyRunner.ts`: already validated `ElectronTask[]` tasks flow directly into `runReviewForFile(...)`.
- Verification passed:
  - `npm.cmd run verify:electron-ai-review-template-tools-ipc-module`
  - `npm.cmd run verify:electron-ai-review-daily-runner-module` with approved escalation for Windows Temp access
  - `npm.cmd run typecheck`
- `npm.cmd run build` deferred under speed mode; last build passed in Phase 314.

## 2026-07-12 - Phase 316 template/AI Review cast batch narrowing
- Continued speed-mode batching after Phase 315.
- Added RED coverage to existing focused verifiers for shared marker/render-type key lists, recognized-template JSON parsing, fuzzy marker iteration, template renderer marker iteration, and render-label option iteration.
- RED observed:
  - `npm.cmd run verify:section-config` failed before fix because `RENDER_TYPES` / marker-key guards were missing.
  - `npm.cmd run verify:recognize-template` failed before fix because parsed JSON was still cast to records/arrays.
  - `npm.cmd run verify:fuzzy-match` failed before fix because fuzzy matching cast `Object.keys(SYNONYMS)`.
  - `npm.cmd run verify:daily-template-markers` failed before fix because template rendering cast `Object.entries(BLOCK_KEYWORDS)`.
- Updated:
  - `shared/aiReview/markers.ts`
  - `shared/aiReview/sectionConfig.ts`
  - `shared/aiReview/recognizeTemplate.ts`
  - `shared/aiReview/fuzzyMatch.ts`
  - `shared/templateRenderer.ts`
  - `src/components/TemplateEditorModal.tsx`
  - `src/components/TemplateRecognitionModal.tsx`
  - related focused verifiers
- Fixed one TypeScript checkpoint issue by adding `isFixedBlockId(...)` before using daily block-order ids as `FixedBlockId`.
- Verification passed:
  - `npm.cmd run verify:section-config`
  - `npm.cmd run verify:recognize-template`
  - `npm.cmd run verify:fuzzy-match`
  - `npm.cmd run verify:daily-template-markers`
  - `npm.cmd run verify:app-template-editor-module`
  - `npm.cmd run verify:recognize-report`
  - `npm.cmd run verify:obsidian-template-center`
  - `npm.cmd run typecheck`
- `npm.cmd run build` deferred under speed mode; last build passed in Phase 314.

## 2026-07-12 - Phase 318 Obsidian template/app settings cast batch narrowing
- Finished the in-flight shared Obsidian template/settings cast batch after the speed-mode adjustment.
- RED coverage had already been added and confirmed:
  - `scripts/verify-obsidian-template-center.ts` rejects broad template-center/app-settings casts.
  - `scripts/verify-daily-template-markers.ts` rejects `obsidianTemplates` compat `any` casts.
- Updated:
  - `shared/appSettings.ts`: app/template settings helpers read indexed values after string/object guards.
  - `shared/obsidianTemplateCenter.ts`: module normalization starts from defaults instead of an accumulator cast.
  - `shared/obsidianTemplates.ts`: legacy compat reads now use record/string/boolean helpers and typed block title lookups.
- Verification passed:
  - `npm.cmd run verify:obsidian-template-center`
  - `npm.cmd run verify:daily-template-markers`
- `npm.cmd run verify:template-source-settings`
- `npm.cmd run typecheck`
- `npm.cmd run build` deferred under speed mode; last build passed in Phase 314.

## 2026-07-12 - Phase 320 task context menu record guard cast narrowing
- Continued speed-first batching after the user asked to make the long optimization pass faster.
- RED observed:
  - `npm.cmd run verify:electron-task-context-menu-ipc-module` failed because `electron/taskContextMenuIpc.ts` still cast open/action payload values to `Record<string, unknown>`.
  - `npm.cmd run verify:app-task-menu-actions-module` failed because `src/app/taskMenuActions.ts` still cast forwarded action payloads to `Record<string, unknown>`.
- Updated:
  - `electron/taskContextMenuIpc.ts`: added `isObjectRecord(...)` and used it for task-menu open/action payloads and nested `updates` narrowing.
  - `src/app/taskMenuActions.ts`: added `isObjectRecord(...)` and used it before reading `taskId` / `updates` from forwarded runtime payloads.
  - Focused verifiers now assert the new record-guard narrowing rather than the old inline object-check text.
- Verification passed:
  - `npm.cmd run verify:electron-task-context-menu-ipc-module`
- `npm.cmd run verify:app-task-menu-actions-module`
- `npm.cmd run typecheck`
- `npm.cmd run build` deferred under speed mode; last build passed in Phase 314.

## 2026-07-12 - Phase 321 task menu popup action cast narrowing
- RED observed: `npm.cmd run verify:context-menu` failed because `TaskMenuPopup` still used `as unknown as Partial<Task>` for edit/delete/add-subtask action dispatch.
- Updated:
  - `src/components/TaskMenuPopup.tsx`: added `TaskMenuPopupActionUpdate` and widened local `dispatch(...)` to accept either normal task updates or special action updates.
  - `scripts/verify-context-menu.ts`: rejects popup double casts and requires the typed action-update shape.
- Verification passed:
  - `npm.cmd run verify:context-menu`
- `npm.cmd run verify:app-task-menu-actions-module`
- `npm.cmd run typecheck`
- `npm.cmd run build` deferred under speed mode; last build passed in Phase 314.

## 2026-07-12 - Phase 322 renderer DOM event target guard narrowing
- RED observed:
  - `npm.cmd run verify:app-keyboard-shortcuts-module` failed on `event.target as HTMLElement`.
  - `npm.cmd run verify:date-navigator-module` failed on `event.target as Node`.
  - `npm.cmd run verify:electron-window-ipc-module` failed on TitleBar `event.target as HTMLElement`.
- Updated:
  - `src/app/appKeyboardShortcuts.ts`: keyboard target is narrowed with `instanceof HTMLElement` before reading `tagName`.
  - `src/components/DateNavigator.tsx`: outside-click target is narrowed with `instanceof Node` before `contains(...)`.
  - `src/components/TitleBar.tsx`: more-menu outside-click target is narrowed with `instanceof Element` before `closest(...)`.
- Verification passed:
  - `npm.cmd run verify:app-keyboard-shortcuts-module`
  - `npm.cmd run verify:date-navigator-module`
  - `npm.cmd run verify:electron-window-ipc-module`
- `npm.cmd run typecheck`
- `npm.cmd run build` deferred under speed mode; last build passed in Phase 314.

## 2026-07-12 - Phase 323 renderer element guard cast narrowing
- RED observed:
  - `npm.cmd run verify:task-item-subtask-card-module` failed because `PriorityPicker` still cast outside-click targets with `event.target as Node`.
  - `npm.cmd run verify:app-main-content-module` failed because `useFloatingScrollbar` still cast `querySelector(...)` results to `HTMLElement`.
- Updated:
  - `src/components/PriorityPicker.tsx`: outside-click target is narrowed with `instanceof Node` before `contains(...)`.
  - `src/hooks/useFloatingScrollbar.ts`: optional header query results are narrowed with `instanceof HTMLElement` before `offsetHeight`.
  - `scripts/verify-task-item-subtask-card-module.ts` and `scripts/verify-app-main-content-module.ts`: added focused guards against the old casts.
- Verification passed:
  - `npm.cmd run verify:task-item-subtask-card-module`
  - `npm.cmd run verify:app-main-content-module`
  - `npm.cmd run typecheck`
- `npm.cmd run build` deferred under speed mode; last build passed in Phase 314.

## 2026-07-12 - Phase 324 shared membership guard cast narrowing
- RED observed:
  - `npm.cmd run verify:template-source-settings` failed because `isTemplateCustomToken(...)` still cast `TEMPLATE_CUSTOM_TOKENS` to `readonly string[]`.
- Updated:
  - `shared/appSettings.ts`: added `TEMPLATE_CUSTOM_TOKEN_SET` and used it for template custom-token narrowing.
  - `shared/aiReview/aiReviewSettings.ts`: added `AI_PROVIDER_SET` and used it for AI provider narrowing.
  - `scripts/verify-template-source-settings.ts`: rejects the old tuple/list casts and requires set-based membership guards.
- Verification passed:
  - `npm.cmd run verify:template-source-settings`
  - `npm.cmd run verify:ai-settings`
- `npm.cmd run typecheck`
- `npm.cmd run build` deferred under speed mode; last build passed in Phase 314.

## 2026-07-12 - Phase 325 local cast bridge narrowing
- Continued speed-first batching after Phase 324; kept the batch to four local, low-risk casts.
- RED observed:
  - `npm.cmd run verify:markdown-editor` failed because `useMarkdownEditor` still used `mirror.style[prop as any] = style[prop as any]`.
  - `npm.cmd run verify:app-scheduled-reports-module` failed because scheduled-report diagnostics still used `(window as unknown as { __dailytodoLastScheduledError?: string })`.
  - `npm.cmd run verify:settings-ai-review-manual-generation-section` failed because the manual-generation action list still used `as Array<[GenerationAction, string]>`.
  - `npm.cmd run verify:settings-ai-review-report-routing-section` failed because the report-routing key list still used `as Array<[ReportProfileKey, string]>`.
- Updated:
  - `src/hooks/useMarkdownEditor.ts`: mirror style copying now uses the typed `MIRROR_STYLE_PROPS` keys directly.
  - `src/app/appScheduledReports.ts`: added a local `Window` augmentation for `__dailytodoLastScheduledError` and removed the double cast.
  - `src/components/settings/AiReviewManualGenerationSection.tsx`: action tuples now live in a typed readonly array.
  - `src/components/settings/AiReviewReportRoutingSection.tsx`: report profile route tuples now live in a typed readonly array.
  - Focused verifiers now reject the old casts; `verify-app-scheduled-reports-module` was also calibrated from stale `result.error` text to current `parsed.error` parsing.
- Verification passed:
  - `npm.cmd run verify:markdown-editor`
  - `npm.cmd run verify:app-scheduled-reports-module`
  - `npm.cmd run verify:settings-ai-review-manual-generation-section`
  - `npm.cmd run verify:settings-ai-review-report-routing-section`
  - `npm.cmd run typecheck`
- `npm.cmd run build` deferred under speed mode; last build passed in Phase 314.

## 2026-07-12 - Phase 328 Obsidian template/sync any-cast narrowing
- Continued speed-first batching; kept scope to already-RED Obsidian template/sync casts.
- RED observed before implementation:
  - `npm.cmd run verify:electron-obsidian-daily-note-content-module` failed on `tasks as any` in `electron/obsidianDailyNoteContent.ts`.
  - `npm.cmd run verify:electron-obsidian-sync-module` failed because sync validation was not a type predicate and `electron/obsidianSync.ts` still used `as any`.
  - `npm.cmd run verify:daily-template-markers` failed because `shared/obsidianTemplates.ts` did not expose `ObsidianTemplateTask`.
- Updated:
  - `shared/obsidianTemplates.ts`: added `ObsidianTemplateTask` / `ObsidianTemplateCompletionReview` and changed template rendering/preview helpers to accept the smaller task shape.
  - `shared/completionReviews.ts`: changed `getCompletionReviews(...)` to accept a small completion-review task shape instead of the full renderer `Task`.
  - `electron/obsidianDailyNoteContent.ts`: removed `tasks as any` when delegating to template task helpers.
  - `electron/obsidianSync.ts`: made `hasValidObsidianSyncTasks(...)` a type predicate, added `readTemplateModuleEnabled(...)`, guarded legacy daily path/vault path reads, and removed preview task `any` casts.
- Verification passed:
  - `npm.cmd run verify:electron-obsidian-daily-note-content-module`
  - `npm run verify:electron-obsidian-sync-module`
  - `npm.cmd run verify:daily-template-markers`
  - `npm run typecheck`
- `npm.cmd run build` deferred under speed mode; last build passed in Phase 314.

## 2026-07-12 - Phase 329 personalization appearance override cast narrowing
- Continued speed-first mode and kept this phase to the one remaining low-risk personalization cast.
- RED observed before implementation:
  - `npm.cmd run verify:app-personalization-module` failed because `extractThemeAppearanceOverride(...)` still assigned dynamic values through `value as never`.
- Updated:
  - `src/types/personalization.ts`: added `setThemeAppearanceOverride<K extends ThemeAppearanceKey>(...)` so each appearance key keeps its matching `PersonalizationSettings[K]` value type during dynamic assignment.
  - `scripts/verify-app-personalization-module.ts`: rejects the old `value as never` cast and requires the typed helper.
- Verification passed before this documentation update:
  - `npm.cmd run verify:app-personalization-module`
  - `npm run typecheck`
- `npm.cmd run build` deferred under speed mode; last build passed in Phase 314.

## 2026-07-12 - Phase 330 Win32 native material capability cast narrowing
- Took the one remaining meaningful production cast from the fast scan: `electron/win32Native.ts` BrowserWindow optional native-material access.
- RED observed before implementation:
  - `npm.cmd run verify:electron-win32-native-module` failed because the optional native material capability shape/guard was missing and `win as BrowserWindow & ...` remained.
- Updated:
  - `electron/win32Native.ts`: added `NativeBackgroundMaterialWindow` and `hasNativeBackgroundMaterial(...)`, then calls `win.setBackgroundMaterial('none')` only after the guard narrows support.
  - `scripts/verify-electron-win32-native-module.ts`: rejects the old BrowserWindow intersection cast and requires the guard.
- Verification passed:
  - `npm.cmd run verify:electron-win32-native-module`
  - `npm run typecheck`
- `npm.cmd run build` deferred under speed mode; last build passed in Phase 314.
- Final fast scan after Phase 330 found no obvious low-risk production casts left; remaining `rg " as "` hits are import aliases, English text, and deliberate verify/test fixture casts.

## 2026-07-12 - Phase 331 task-list order parser reuse
- Switched from exhausted cast cleanup to a small maintainability optimization: the persisted task-list order parser had duplicated source/order normalization already owned by task ordering.
- RED observed:
  - `npm.cmd run verify:task-ordering-state` failed because `parseTaskListOrderByDate(...)` was not exported from `src/utils/taskOrdering.ts`.
- Updated:
  - `src/utils/taskOrdering.ts`: added the shared runtime parser for stored date/source/task order state.
  - `src/hooks/taskPersistence.ts`: replaced duplicate date-order parsing helpers with the compatibility wrapper `parseStoredTaskListOrder(...) => parseTaskListOrderByDate(...)`.
  - `scripts/verify-task-ordering-state.ts`: covers malformed stored order filtering through the shared parser.
  - `scripts/verify-task-persistence.ts`: requires persistence to delegate and rejects the removed duplicate helper.
- Verification passed:
  - `npm.cmd run verify:task-ordering-state`
  - `npm.cmd run verify:task-persistence`
  - `npm run typecheck`
- `npm.cmd run build` deferred under speed mode; last recorded build passed in Phase 314.

## 2026-07-12 - Phase 332 Companion validator reuse
- Kept the batch limited to duplicated runtime validation in the Electron Obsidian companion planner.
- RED observed:
  - `npm.cmd run verify:companion` failed because `electron/obsidianCompanion.ts` did not yet import the shared rule/template validators.
- Updated:
  - `electron/obsidianCompanion.ts`: deleted local `isCompanionTemplate(...)`, `isCompanionRule(...)`, and their helper, then reused `isCompanionTemplate` / `isCompanionRule` from `shared/obsidianCompanion.ts`.
  - `electron/obsidianCompanion.verify.ts`: rejects local duplicate validators and requires shared validator reuse.
- Verification passed:
  - `npm.cmd run verify:companion`
  - `npm.cmd run typecheck`
- `npm.cmd run build` deferred under speed mode; last recorded build passed in Phase 314.

## 2026-07-12 - Phase 333 Task completion-review validator reuse
- Kept the batch to one duplicated task-domain validation rule shared by stored tasks and retained Obsidian reviews.
- RED observed:
  - `npm.cmd run verify:task-persistence` failed because `isTaskCompletionReview(...)` was not exported from `taskTransforms` and persistence still held a local copy.
- Updated:
  - `src/hooks/taskTransforms.ts`: exported the existing completion-review runtime type predicate.
  - `src/hooks/taskPersistence.ts`: reused that predicate for retained review parsing and removed the duplicated completion-review/string helper logic.
  - `scripts/verify-task-persistence.ts`: requires the shared predicate and rejects a persistence-local duplicate.
- Verification passed:
  - `npm.cmd run verify:task-persistence`
  - `npm.cmd run verify:task-hook-state`
  - `npm.cmd run typecheck`
- `npm.cmd run build` deferred under speed mode; last recorded build passed in Phase 314.

## 2026-07-12 - Phase 334 Shared task-date resolver reuse
- Kept the batch to the repeated task-date fallback chain while preserving each layer's distinct fallback policy.
- RED observed:
  - `npm.cmd run verify:date-key-reuse` failed because `shared/taskRollover.ts` did not yet export `getTaskDate(...)`.
- Updated:
  - `shared/taskRollover.ts`: added the dependency-free `TaskDateSource` shape and `getTaskDate(task, fallbackDate)` resolver.
  - `src/hooks/taskTransforms.ts`: retains its business-date default and delegates to the shared resolver.
  - `src/components/dateNavigator/dateNavigatorUtils.ts`: retains its local-calendar fallback and delegates to the shared resolver.
  - `shared/obsidianTemplates.ts`: retains its empty-string fallback and delegates to the shared resolver.
  - `electron/taskDateHelpers.ts`: retains its local-calendar fallback and delegates to the shared resolver.
  - Focused verifiers now assert the shared resolver behavior and Electron's wrapper behavior instead of requiring duplicated source text.
- Verification passed:
  - `npm.cmd run verify:date-key-reuse`
  - `npm.cmd run verify:date-navigator-module`
  - `npm.cmd run verify:electron-task-date-helpers-module`
  - `npm.cmd run verify:daily-template-markers`
  - `npm.cmd run verify:task-hook-state`
  - `npm.cmd run typecheck`
- `npm.cmd run build` deferred under speed mode; last recorded build passed in Phase 314.

## 2026-07-12 - Phase 335 AI stats task-date resolver reuse
- Replaced the remaining AI statistics-local task-date fallback chain with the Phase 334 shared resolver.
- RED observed:
  - `npm.cmd run verify:ai-stats` failed because `shared/aiReview/stats.ts` did not yet import and use `getTaskDate(...)`.
- Updated:
  - `shared/aiReview/stats.ts`: its private `dateOf(...)` adapter now delegates to `getTaskDate(task, '')`, preserving exclusion of tasks without a date.
  - `scripts/verify-ai-stats.ts` and `scripts/verify-date-key-reuse.ts`: assert shared resolver reuse and reject the duplicated fallback chain.
- Verification passed:
  - `npm.cmd run verify:ai-stats`
  - `npm.cmd run verify:date-key-reuse`
  - `npm.cmd run typecheck`
- `npm.cmd run build` deferred under speed mode; last recorded build passed in Phase 314.

## 2026-07-12 - Phase 336 Companion capture task-date resolver reuse
- Replaced the desktop Companion capture filter's remaining local task-date precedence chain.
- RED observed:
  - `npm.cmd run verify:app-companion-capture-module` failed because `src/store/taskStore.ts` did not import the shared task-date resolver.
- Updated:
  - `src/store/taskStore.ts`: `buildCaptureItems(...)` now filters with `getTaskDate(task, '')`, preserving legacy `createdAt` fallback while excluding undated malformed records.
  - `scripts/verify-app-companion-capture-module.ts`: exercises legacy task capture output and requires shared resolver reuse.
- Verification passed:
  - `npm.cmd run verify:app-companion-capture-module`
  - `npm.cmd run verify:date-key-reuse`
  - `npm.cmd run typecheck`
- `npm.cmd run build` deferred under speed mode; last recorded build passed in Phase 314.

## 2026-07-12 - Phase 337 Shared date-key local-date conversion
- Consolidated duplicated `YYYY-MM-DD` local-calendar conversion used before expanding Obsidian and AI Review path templates.
- RED observed:
  - `npm.cmd run verify:source-materials` failed because `shared/pathTemplate.ts` did not yet export `dateKeyToLocalDate(...)`.
- Updated:
  - `shared/pathTemplate.ts`: now owns the date-key-to-local-`Date` conversion alongside template expansion.
  - `shared/obsidianTemplates.ts` and `shared/aiReview/sourceMaterials.ts`: import the shared conversion and removed local copies.
  - Focused verifiers assert local calendar fields and reject the template-local duplicate.
- Verification passed:
  - `npm.cmd run verify:source-materials`
  - `npm.cmd run verify:daily-template-markers`
  - `npm.cmd run typecheck`
- `npm.cmd run build` deferred under speed mode; last recorded build passed in Phase 314.

## 2026-07-12 - Phase 338 LLM IPC result-contract tightening
- Replaced the LLM IPC dependency signatures that erased the shared provider result union with `Promise<LlmResult>`.
- RED observed in the six focused IPC verifiers: each failed specifically because its declaration still exposed `Promise<any>`.
- Updated:
  - `electron/aiReviewIpcRegistrationTypes.ts`
  - `electron/aiReviewReportIpcTypes.ts`
  - `electron/aiReviewTemplateToolsIpc.ts`
  - `electron/aiReviewBackfillIpc.ts`
  - `electron/aiReviewExternalReportIpc.ts`
  - `electron/obsidianIpc.ts`
  - `electron/mainWindowBootstrap.ts`
  - focused verifiers for these dependency contracts.
- Verification passed:
  - `npm.cmd run verify:electron-ai-review-ipc-registration-types-module`
  - `npm.cmd run verify:electron-ai-review-report-ipc-types-module`
  - `npm.cmd run verify:electron-ai-review-template-tools-ipc-module`
  - `npm.cmd run verify:electron-ai-review-backfill-ipc-module`
  - `npm.cmd run verify:electron-ai-review-external-report-ipc-module`
  - `npm.cmd run verify:electron-obsidian-ipc-module`
  - `npm.cmd run verify:electron-main-window-bootstrap-module`
  - `npm.cmd run typecheck`
- `npm.cmd run build` deferred under speed mode; last recorded build passed in Phase 314.

## 2026-07-12 - Phase 339 LLM diagnostic aggregation tightening
- Confirmed that daily, weekly, and monthly report paths all pass `LlmResult[]` into the diagnostic factory, matching `aiReviewRuntime.ts`.
- RED observed:
  - report IPC type and main-window bootstrap verifiers failed because their diagnostic signatures still used `llmResults?: any[]`.
- Updated:
  - `electron/aiReviewReportIpcTypes.ts`
  - `electron/mainWindowBootstrap.ts`
  - focused verifiers now require `llmResults?: LlmResult[]`.
- Verification passed:
  - `npm.cmd run verify:electron-ai-review-report-ipc-types-module`
  - `npm.cmd run verify:electron-main-window-bootstrap-module`
  - `npm.cmd run verify:electron-ai-review-runtime-module`
  - `npm.cmd run verify:electron-ai-review-daily-runner-module`
  - `npm.cmd run typecheck`
  - targeted production scan found no remaining `Promise<any>` or `llmResults?: any[]` entries in `electron`, `shared`, or `src`.
- `npm.cmd run build` deferred under speed mode; last recorded build passed in Phase 314.

## 2026-07-12 - Phase 340 Mobile inbox JSON root validation
- Tightened the mobile-inbox JSON file boundary so successfully parsed JSON must still have an object root before its capture fields are read.
- RED observed:
  - `npm.cmd run verify:companion` failed because an array-root JSON file was only reported as missing `content`, not rejected as an invalid capture shape.
- Updated:
  - `electron/obsidianCompanion.ts`: parses JSON as `unknown` and reuses the existing object guard before accepting capture fields.
  - `electron/obsidianCompanion.verify.ts`: covers array-root JSON moving to `_failed` with a clear object-shape error.
- Verification passed:
  - `npm.cmd run verify:companion`
  - `npm.cmd run verify:electron-companion-ipc-module`
  - `npm.cmd run typecheck`
- `npm.cmd run build` deferred under speed mode; last recorded build passed in Phase 314.

## 2026-07-12 - Phase 341 LLM non-streaming JSON boundary tightening
- Stopped the non-streaming LLM response parser from introducing `any` immediately after `JSON.parse(...)`.
- RED observed:
  - `npm.cmd run verify:openai-client` failed because the response path still declared `let data: any`.
- Updated:
  - `shared/llm/openaiClient.ts`: parsed response JSON now enters the provider request parsers as `unknown`, preserving their existing compatible field extraction behavior.
  - `scripts/verify-openai-client.ts`: rejects the network-boundary `any` declaration.
- Verification passed:
  - `npm.cmd run verify:openai-client`
  - `npm.cmd run verify:ai-run-diagnostics`
  - `npm.cmd run typecheck`
- `npm.cmd run build` deferred under speed mode; last recorded build passed in Phase 314.

## 2026-07-12 - Phase 342 LLM model-list response validation
- Tightened the separate `/models` network response boundary and removed model-list parser `any` declarations.
- RED observed:
  - `npm.cmd run verify:openai-client` failed because the models request contract and `parseModelList(...)` still accepted `any`.
- Updated:
  - `shared/llm/openaiClient.ts`: `/models` JSON enters as `unknown`; the parser validates the response record and each candidate model record before reading `id` or Gemini `name`.
  - `scripts/verify-openai-client.ts`: requires `unknown` at the model-list request/parser boundary.
- Verification passed:
  - `npm.cmd run verify:openai-client`
  - `npm.cmd run verify:ai-run-diagnostics`
  - `npm.cmd run typecheck`
- `npm.cmd run build` deferred under speed mode; last recorded build passed in Phase 314.

## 2026-07-12 - Phase 343 LLM SSE event-boundary tightening
- Tightened the SSE JSON boundary so parsed event payloads enter provider aggregation as `unknown[]`.
- RED observed:
  - `npm.cmd run verify:openai-client` failed because `ProviderRequest.aggregate(...)` and `parseSse(...)` still exposed `any[]`.
- Updated:
  - `shared/llm/openaiClient.ts`: Anthropic, Gemini, and OpenAI stream aggregators now narrow records and arrays before accessing provider-specific event fields.
  - `scripts/verify-openai-client.ts`: requires the `unknown[]` SSE event contract.
- Verification passed:
  - `npm.cmd run verify:openai-client`
  - `npm.cmd run verify:ai-run-diagnostics`
  - `npm.cmd run typecheck`
  - `git diff --check -- shared/llm/openaiClient.ts scripts/verify-openai-client.ts`
- `npm.cmd run build` deferred under speed mode; last recorded build passed in Phase 314.

## 2026-07-12 - Phase 344 OpenAI-compatible text extraction tightening
- Removed the broad `any` input contract from the OpenAI-compatible text extraction helpers.
- RED observed:
  - `npm.cmd run verify:openai-client` failed because compatibility text extraction still accepted `any` values.
- Updated:
  - `shared/llm/openaiClient.ts`: text helpers now accept `unknown`, narrow choices, top-level response records, messages, deltas, and segmented text/content entries before field access.
  - `scripts/verify-openai-client.ts`: requires the `unknown` helper contracts.
- Existing compatibility behavior retained:
  - string and segmented text/content extraction
  - OpenAI choice and top-level fallback field precedence
  - whitespace-preserving streaming chunk concatenation
- Verification passed:
  - `npm.cmd run verify:openai-client`
  - `npm.cmd run verify:ai-run-diagnostics`
  - `npm.cmd run typecheck`
  - `git diff --check -- shared/llm/openaiClient.ts scripts/verify-openai-client.ts`
- `npm.cmd run build` deferred under speed mode; last recorded build passed in Phase 314.

## 2026-07-12 - Phase 345 Provider response parser-contract tightening
- Removed the remaining `any` contract that passed non-streaming provider response JSON into provider-specific content and truncation parsers.
- RED observed:
  - `npm.cmd run verify:openai-client` failed because `ProviderRequest.parse(...)` and `truncated(...)` still accepted `any`.
- Updated:
  - `shared/llm/openaiClient.ts`: all provider non-streaming parsers now receive `unknown`; Anthropic and Gemini narrow their response envelopes and text parts, while OpenAI narrows choices before reusing compatible text extraction.
  - `scripts/verify-openai-client.ts`: requires the `unknown` parser and truncation contracts.
- Existing behavior retained:
  - Anthropic/Gemini text-part concatenation and trimming
  - OpenAI-compatible fallback text fields
  - provider-specific max-token truncation signals
- Verification passed:
  - `npm.cmd run verify:openai-client`
  - `npm.cmd run verify:ai-run-diagnostics`
  - `npm.cmd run typecheck`
  - `git diff --check -- shared/llm/openaiClient.ts scripts/verify-openai-client.ts`
- Remaining `any` scan result in this module is limited to token-usage and usage-only SSE diagnostics.
- `npm.cmd run build` deferred under speed mode; last recorded build passed in Phase 314.

## 2026-07-12 - Phase 346 LLM usage-diagnostics boundary tightening
- Removed the final production `any` inputs from the LLM client's token-usage and usage-only SSE diagnostic helpers.
- RED observed:
  - `npm.cmd run verify:openai-client` failed because usage helpers still accepted `any` values and event arrays.
- Updated:
  - `shared/llm/openaiClient.ts`: usage extraction and SSE usage-only detection now accept `unknown` / `unknown[]`, then narrow provider response/event and usage records before reading fields.
  - `scripts/verify-openai-client.ts`: requires the unknown usage-diagnostic contracts.
- Existing behavior retained:
  - OpenAI `prompt_tokens` / `completion_tokens` / `total_tokens`
  - Anthropic `input_tokens` / `output_tokens` and derived total
  - Gemini `usageMetadata` counters
  - usage-only SSE explanation including the prompt-token count
- Verification passed:
  - `npm.cmd run verify:openai-client`
  - `npm.cmd run verify:ai-run-diagnostics`
  - `npm.cmd run typecheck`
  - `git diff --check -- shared/llm/openaiClient.ts scripts/verify-openai-client.ts`
  - production scan: no `any` usages remain in `shared/llm/openaiClient.ts`
- `npm.cmd run build` deferred under speed mode; last recorded build passed in Phase 314.

## 2026-07-12 - Phase 347 task-menu multi-display placement
- Replaced primary-display-only popup clamping with nearest-display selection based on the normalized trigger point.
- RED observed:
  - `npm.cmd run verify:electron-task-menu-window-module` and `npm.cmd run verify:context-menu` failed because the task-menu window still used the primary display work area directly.
- Updated:
  - `electron/taskMenuWindow.ts`: preserves the primary-display center fallback for malformed coordinates, then obtains the work area through `screen.getDisplayNearestPoint({ x: screenX, y: screenY })`.
  - Context-menu verifiers: require nearest-display selection; calibrated the stale scheduled-date assertion to the shared visible-date helper.
- Verification passed:
  - `npm.cmd run verify:context-menu`
  - `npm.cmd run verify:electron-task-menu-window-module`
  - `npm.cmd run typecheck`
  - `git diff --check -- electron/taskMenuWindow.ts scripts/verify-context-menu.ts scripts/verify-electron-task-menu-window-module.ts`
- `npm.cmd run build` deferred under speed mode; last recorded build passed in Phase 314.

## 2026-07-12 - Phase 348 template recognition duplicate headings
- Added a focused parser regression test for repeated Markdown H2 headings.
- RED observed:
  - `npx.cmd tsx scripts/verify-recognize-template-blocks.ts` failed because two `## 复盘` headings produced two custom blocks.
- Updated:
  - `shared/recognizeTemplateBlocks.ts`: retains the first custom heading, skips later duplicate headings, and reports `medium` confidence when any heading is skipped.
  - `scripts/verify-recognize-template-blocks.ts`: verifies the duplicate-heading behavior directly.
- Verification passed:
  - `npx.cmd tsx scripts/verify-recognize-template-blocks.ts`
  - `npm.cmd run verify:recognize-template`
  - `npm.cmd run verify:section-config`
  - `npm.cmd run typecheck`
  - `git diff --check -- shared/recognizeTemplateBlocks.ts scripts/verify-recognize-template-blocks.ts scripts/verify-template-hub-rewrite.ts`
- Historical `scripts/verify-template-hub-rewrite.ts` remains blocked earlier by its stale `FixedBlock.id` source assertion, so it was not used as the focused executable verifier.
- `npm.cmd run build` deferred under speed mode; last recorded build passed in Phase 314.

## 2026-07-13 - Daily AI review snapshot reuse
- Found and removed redundant daily-note reads during each AI review run. The orchestration previously read once to inspect managed AI content, again to count source characters, and the review runner read once more before execution.
- Updated:
  - `electron/aiReviewDailyRunner.ts`: builds a stable `ReadResult` snapshot while inspecting the daily note, reuses it for source-character diagnostics and `runReviewForFile`, and rejects snapshots whose file stamp changes during the read.
  - `electron/aiReview/runner.ts`: accepts an optional caller-provided initial snapshot; direct callers retain the existing `readWithStamp` behavior.
  - Focused verifiers now prove snapshot reuse and no executor reread, while retaining atomic-write coverage.
- Verification passed:
  - `npx.cmd tsx scripts/verify-ai-runner.ts`
  - `npx.cmd tsx scripts/verify-electron-ai-review-daily-runner-module.ts`
  - `npx.cmd tsx scripts/verify-atomic-write.ts`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- electron/aiReviewDailyRunner.ts electron/aiReview/runner.ts scripts/verify-electron-ai-review-daily-runner-module.ts scripts/verify-ai-runner.ts`

## 2026-07-13 - Phase 349 Obsidian template task-line module extraction
- Recorded the completed Obsidian template task-line extraction in the persistent plan after context handoff.
- Current code state:
  - `shared/obsidianTemplates.ts` imports task-line rendering and visible stats from `shared/obsidianTemplateTaskLines.ts`.
  - `shared/obsidianTemplates.ts` re-exports `buildTaskLines`, `ObsidianTemplateTask`, `ObsidianTemplateCompletionReview`, and `getCompletionReviews` for stable callers.
  - `shared/obsidianTemplates.ts` is now below 300 lines; the current production large-file scan shows 14 files at 300+ lines and 6 at 400+ lines.
- Verification previously observed for this phase:
  - RED: `npm.cmd run verify:daily-template-markers` failed because the focused task-line module did not exist.
  - GREEN: `npm.cmd run verify:daily-template-markers`, `npm.cmd run verify:daily-markdown-template`, `npm.cmd run verify:obsidian-template-center`, `npm.cmd run typecheck`, `npx.cmd tsx scripts/verify-subtask-obsidian-sync.ts`, `npx.cmd tsx scripts/verify-review-empty-fields.ts`, `npm.cmd run verify:task-obsidian-sync`, `npm.cmd run verify:review-fields`.
  - `git diff --check -- shared/obsidianTemplates.ts shared/obsidianTemplateTaskLines.ts scripts/verify-daily-template-markers.ts` reported only LF-to-CRLF working-copy warnings.

## 2026-07-13 - Phase 350 Obsidian no-op sync write elimination
- Root cause confirmed with a real temporary-vault sync test: an unchanged second sync still wrote the selected daily note.
- Updated `electron/obsidianSync.ts`:
  - preserves the existing task-block sync timestamp when the rest of the generated task block is unchanged;
  - compares complete managed blocks before upserting, avoiding content reconstruction and trailing-newline growth when work, inspiration, and task blocks are already identical.
- Updated `scripts/verify-settings-sync.ts` with a write-count regression test for a second unchanged sync.
- RED observed: the new test counted one daily-note write before the fix.
- Verification passed:
  - `npm.cmd run verify:settings-sync`
  - `npm.cmd run verify:electron-obsidian-sync-module`
  - `npm.cmd run verify:task-obsidian-sync`
  - `npm.cmd run verify:daily-template-markers`
  - `npm.cmd run verify:companion`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- electron/obsidianSync.ts scripts/verify-settings-sync.ts`

## 2026-07-13 - Phase 351 renderer no-op Obsidian IPC elimination
- Found a second no-op path after disk-write elimination: UI-only task fields such as `collapsed`, `cleared`, and `isToday` create a new task-tree reference, causing the renderer sync effect to serialize the entire task tree through IPC even though they cannot affect Obsidian Markdown.
- Updated:
  - `src/hooks/taskObsidianSync.ts`: adds a recursive equivalence check over only Markdown-relevant task fields, including task text/status/date/tags/completion reviews and subtasks.
  - `src/hooks/useTasks.ts`: retains the last successful daily-note input and skips the debounced IPC call when the next input is equivalent. Previous-task snapshots are intentionally excluded from this comparison because they only help clean up old affected dates when current rendered content changes.
  - `scripts/verify-task-obsidian-sync.ts`: verifies renderer-only state is ignored while task-text and completion-review changes remain sync-relevant.
- RED observed:
  - `npm.cmd run verify:task-obsidian-sync` failed before the effect referenced the new equivalence gate.
- Verification passed:
  - `npm.cmd run verify:task-obsidian-sync`
  - `npm.cmd run verify:settings-sync`
  - `npm.cmd run verify:task-core`
  - `npm.cmd run verify:electron-obsidian-sync-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
- `git diff --check -- src/hooks/taskObsidianSync.ts src/hooks/useTasks.ts scripts/verify-task-obsidian-sync.ts`

## 2026-07-13 - Phase 352 collapsed subtask render work elimination
- Root cause confirmed in `useVirtualSubtasks`: a collapsed parent does not render `TaskSubtasksViewport`, but the hook still mapped every direct subtask into render descriptors on each parent re-render.
- Updated `src/components/taskItem/useVirtualSubtasks.ts` to return an empty visible-item list before normal or virtual list derivation when the cluster is collapsed. Expanding still recomputes the original visible items because `isExpanded` is a memo dependency.
- Updated `scripts/verify-task-item-virtual-subtasks-hook.ts` with a focused regression assertion.
- RED observed:
  - `npm.cmd run verify:task-item-virtual-subtasks-hook` failed because the hook had no collapsed-state short circuit.
- Verification passed:
  - `npm.cmd run verify:task-item-virtual-subtasks-hook`
  - `npm.cmd run verify:task-item-subtasks-viewport`
  - `npm.cmd run verify:task-item-subtask-card-module`
  - `npm.cmd run verify:context-menu`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
- `git diff --check -- src/components/taskItem/useVirtualSubtasks.ts scripts/verify-task-item-virtual-subtasks-hook.ts`

## 2026-07-13 - Phase 353 floating scrollbar header metric caching
- Root cause confirmed in `src/hooks/useFloatingScrollbar.ts`: the app-level scrollbar runs its scroll layout through `requestAnimationFrame`, but each executed layout frame queried `.app-top` and read `offsetHeight` twice, once directly and once through `metrics()`.
- Updated the hook to resolve the optional header once at setup, retain its measured height in `headerHeight`, and reuse that value in layout and drag metrics. A dedicated optional `ResizeObserver` updates the cached height and schedules a coalesced layout when the header changes size; cleanup disconnects it.
- Updated `scripts/verify-app-main-content-module.ts` to require setup-time header caching, dedicated header observation, no per-frame header query helper, and observer cleanup.
- RED observed:
  - `npm.cmd run verify:app-main-content-module` failed because the hook still resolved the header through `headerOffset()` during layout.
- Focused verification passed:
  - `npm.cmd run verify:app-main-content-module`
  - `npm.cmd run verify:task-list-interactions`
  - `git diff --check -- src/hooks/useFloatingScrollbar.ts scripts/verify-app-main-content-module.ts`
- Whole-project gates are currently blocked by pre-existing concurrent edits in `src/components/TemplateEditorModal.tsx`: both `npm.cmd run typecheck` and `npm.cmd run build` stop on unterminated string/JSX syntax beginning at line 53, outside this phase's files.

## 2026-07-13 - Phase 354 AI Review restored-input IPC elimination
- Root cause confirmed in `createDeferredPersistence`: text input debouncing retained no persisted-value baseline, so changing an AI Review field and restoring it before the debounce elapsed still sent a full `aiReview:setSettings` IPC payload.
- Added optional equality and initial-value support to the deferred persistence helper. A pending value that returns to the known persisted snapshot cancels its timer without calling `persist`; repeated equivalent pending values retain the existing timer.
- `SettingsPanel` now keeps the loaded/saved AI Review snapshot in a ref, initializes deferred text persistence with it, and uses a renderer-local structural equality helper. Immediate saves flush and discard an old deferred instance so a later text input starts from the new baseline.
- RED observed:
  - `npx.cmd tsx scripts/verify-ai-review-settings-persistence.ts` failed because restoring `original` still persisted `original`.
- Verification passed:
  - `npx.cmd tsx scripts/verify-ai-review-settings-persistence.ts`
  - `npm.cmd run verify:settings-ai-review-section`
  - `npm.cmd run verify:settings-panel-modules`
  - `npm.cmd run verify:electron-ai-review-settings-sections-ipc-module`
  - `npm.cmd run verify:app-main-content-module`
  - `npm.cmd run verify:task-list-interactions`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/components/settings/aiReviewSettingsPersistence.ts src/components/SettingsPanel.tsx scripts/verify-ai-review-settings-persistence.ts src/hooks/useFloatingScrollbar.ts scripts/verify-app-main-content-module.ts`

## 2026-07-13 - Phase 355 Task persistence restored-state IPC elimination
- Root cause confirmed: task-tree persistence coalesced rapid changes, but retained no baseline for the last tree sent to the Store. Editing a task and restoring it within the debounce interval could therefore still serialize and send the full nested task tree over IPC.
- Updated `createTaskTreePersistence(...)` to retain a successful persistence baseline, cancel pending work when a new tree is structurally equal to it, and retain a same-pending timer rather than restarting it.
- `useTasks` supplies `areTaskListsEqual(...)` and resets local pending/baseline state after an incoming cross-window broadcast, so remote state is never mistaken for this renderer's persisted baseline.
- Updated the Obsidian/task structure verifier to require `reset()` for remote broadcasts.
- RED observed before the prior implementation: `scripts/verify-task-persistence.ts` persisted `flush-now` after a changed tree was restored to that saved snapshot. The structure verifier also failed until it was calibrated from the obsolete `discard()` expectation to `reset()`.
- Verification passed:
  - `npm.cmd run verify:task-obsidian-sync`
  - `npm.cmd run verify:task-persistence`
  - `npm.cmd run verify:task-hook-state`
  - `npm.cmd run verify:task-core`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/hooks/taskPersistence.ts src/hooks/useTasks.ts scripts/verify-task-persistence.ts scripts/verify-task-obsidian-sync.ts`

## 2026-07-13 - Phase 356 Completion review no-op task-tree update elimination
- Root cause confirmed: `updateTaskReview(...)` recreated the matching completion-review object, review array, and task even when callers supplied no fields or values identical to the stored review. Through `useTasks.editTaskReview(...)`, that reference change traversed the task tree and could schedule task persistence and Obsidian sync work despite no business-state change.
- Updated `src/hooks/taskReviewMutations.ts` to compare supplied review-update fields before allocating. It returns the original task reference when every supplied value is already present; actual changes keep the established review-array copy and latest-review calculation.
- Updated `scripts/verify-task-mutations.ts` with reference-stability coverage for both empty and value-identical review updates.
- RED observed:
  - `npm.cmd run verify:task-mutations` failed because an empty update returned a newly allocated task object.
- Verification passed:
  - `npm.cmd run verify:task-mutations`
  - `npm.cmd run typecheck`
  - `npm.cmd run verify:task-core`
  - `npm.cmd run build`
  - `git diff --check -- src/hooks/taskReviewMutations.ts scripts/verify-task-mutations.ts`

## 2026-07-13 - Phase 357 Task metadata collection no-op update elimination
- Root cause confirmed: task-menu date and tag save paths rebuild arrays (`sort`, `Set`, and `mergeTags`) even when their ordered contents match the stored task. `updateTaskFields(...)` previously compared only references, so this could replace the task tree and schedule persistence/Obsidian work for an unchanged result.
- Updated `src/hooks/taskMutations.ts` so `updateTaskFields(...)` compares `tags` and `scheduledDates` by ordered string contents before allocating. Other `Task` fields retain their existing reference comparison semantics.
- Updated `scripts/verify-task-mutations.ts` with value-identical tag and scheduled-date arrays that must preserve the original task reference.
- RED observed:
  - `npm.cmd run verify:task-mutations` failed because equivalent recreated arrays produced a new task object.
- Verification passed:
  - `npm.cmd run verify:task-mutations`
  - `npm.cmd run verify:task-list-interactions`
  - `npm.cmd run verify:task-core`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/hooks/taskMutations.ts scripts/verify-task-mutations.ts`

## 2026-07-13 - Phase 358 Loaded task UI state startup IPC elimination
- Root cause confirmed: after `loadInitialTaskState()` restored daily notes, selected date, active tab, and task ordering from Store, `setIsLoaded(true)` enabled the UI persistence effect without a loaded-state baseline. The first effect therefore scheduled a redundant `setStoreMany` IPC containing the same values just read from Store.
- Updated `src/hooks/taskPersistence.ts` to build the complete UI-state snapshot through `createTaskUiStateEntries(...)` and added `primeTaskUiStatePersistence(...)` to establish that snapshot as the persisted baseline.
- Updated `src/hooks/useTasks.ts` to prime the baseline from `initialState` before `setIsLoaded(true)`, preserving the existing default `today` tab and current-date semantics.
- Updated `scripts/verify-task-persistence.ts` with baseline behavior and source-order coverage.
- RED observed:
  - `npm.cmd run verify:task-persistence` failed because `primeTaskUiStatePersistence` was not exported.
- Verification passed:
  - `npm.cmd run verify:task-persistence`
  - `npm.cmd run verify:task-core`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/hooks/taskPersistence.ts src/hooks/useTasks.ts scripts/verify-task-persistence.ts`

## 2026-07-13 - Phase 359 TaskMenuPopup pane module extraction
- Current target: reduce `src/components/TaskMenuPopup.tsx` from the large-file list by separating popup shell/bootstrap responsibilities from pane UI responsibilities.
- Updated `scripts/verify-context-menu.ts` with RED structural checks requiring `src/components/taskMenuPopup/TaskMenuPopupPanes.tsx`, exported pane components, retained compatibility exports, and both popup modules below 300 lines.
- RED observed:
  - `npm.cmd run verify:context-menu` failed because the extracted pane module did not exist.
- Updated code:
  - `src/components/TaskMenuPopup.tsx` now owns URL payload parsing, theme application, height reporting, Escape handling, pane selection, and IPC dispatch/close bridges.
  - `src/components/taskMenuPopup/TaskMenuPopupPanes.tsx` now owns the menu, date, tag, and subtask panes plus `getTagSuggestions(...)`.
  - `TaskMenuPopup.tsx` re-exports `getTagSuggestions(...)` so existing verifier/import callers stay stable.
- Verification passed:
  - `npm.cmd run verify:context-menu`
  - `npm.cmd run typecheck`
  - `git diff --check -- src/components/TaskMenuPopup.tsx scripts/verify-context-menu.ts` passed with only LF-to-CRLF working-copy warnings.
  - `git diff --no-index --check -- <empty-temp-file> src/components/taskMenuPopup/TaskMenuPopupPanes.tsx` reported no whitespace errors; no-index returned 1 only because the compared files differ.
- Current production large-file scan after this phase:
  - 11 files remain at 300+ lines.
  - 5 files remain at 400+ lines.

## 2026-07-13 - Phase 360 Loaded task and carryover startup IPC elimination
- Root cause confirmed: startup loaded the tasks and carryover ledger from Store, then enabled the task persistence effect and unconditionally called `setStore` for the returned ledger. In the common no-change case, this resent the full nested task tree and ledger over IPC even though startup had not changed either one.
- Updated `createTaskTreePersistence(...)` with `prime(...)` so a Store-loaded task snapshot can become its persisted baseline without scheduling a write.
- Updated `loadInitialTaskState()` to return explicit `shouldPersistTasks` and `shouldPersistCarryoverLedger` facts. It compares the loaded task tree and ledger against the carryover/normalization result, so real repairs and automatic carryover still write back.
- Updated `useTasks` to write the carryover ledger only when needed and prime task persistence only for an unchanged loaded task tree.
- Updated `scripts/verify-task-persistence.ts` with a loaded baseline behavior test and source-boundary coverage.
- RED observed:
  - `npm.cmd run verify:task-persistence` failed because `createTaskTreePersistence(...)` did not expose `prime`.
- Verification passed:
  - `npm.cmd run verify:task-persistence`
  - `npm.cmd run verify:task-carryover`
  - `npm.cmd run verify:task-core`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/hooks/taskPersistence.ts src/hooks/useTasks.ts scripts/verify-task-persistence.ts`

## 2026-07-13 - Phase 361 Business-date rollover no-op update elimination
- Root cause confirmed: every business-date transition fetched and parsed the carryover ledger, then unconditionally called `setStore` and returned a freshly allocated normalized task tree. On dates with no inherited tasks and no normalization change, that still triggered renderer state work and a redundant ledger IPC.
- Exported the existing carryover-ledger comparison from `taskPersistence` so both startup and rollover use the same exact ordered ledger comparison.
- Updated the rollover callback in `useTasks` to write the ledger only when it differs and preserve `previousTasks` when carryover/normalization produces an equal task tree.
- Updated `scripts/verify-task-persistence.ts` with source-boundary checks for both no-op guards.
- RED observed:
  - `npm.cmd run verify:task-persistence` failed because rollover unconditionally wrote `carryoverResult.ledger`.
- Verification passed:
  - `npm.cmd run verify:task-persistence`
  - `npm.cmd run verify:task-carryover`
  - `npm.cmd run verify:task-core`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/hooks/taskPersistence.ts src/hooks/useTasks.ts scripts/verify-task-persistence.ts`

## 2026-07-13 - Phase 362 Retained review empty-write IPC elimination
- Root cause confirmed: saving app settings with deleted-review syncing enabled always cleared `retainedObsidianReviews` and sent `setStore(RETAINED_OBSIDIAN_REVIEWS_KEY, [])`, even when the renderer state and persisted Store value were already empty.
- Updated `updateAppSettings(...)` to use a functional retained-review state update. An empty existing list now returns its original reference and sends no IPC; a non-empty list still clears and persists `[]` exactly once.
- Updated `scripts/verify-task-hook-state.ts` with the intended functional no-op boundary.
- RED observed:
  - `npm.cmd run verify:task-hook-state` failed because the setting handler unconditionally rewrote the empty list.
- Verification passed:
  - `npm.cmd run verify:task-hook-state`
  - `npm.cmd run verify:task-core`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/hooks/useTasks.ts scripts/verify-task-hook-state.ts` passed with only LF-to-CRLF working-copy warnings.

## 2026-07-13 - Phase 363 Duplicate app-settings submission elimination
- Root cause confirmed: settings UI can submit a newly allocated `AppBehaviorSettings` object with identical scalar values. The renderer previously replaced state and invoked `settings:setApp`; main-process equality avoided the disk write only after IPC and normalization.
- Added `areAppBehaviorSettingsEqual(...)` to the renderer task-hook state helpers. It compares the complete nine-field persisted behavior-settings contract without importing Electron-only equality code.
- Updated `updateAppSettings(...)` to run retained-review cleanup first, then preserve the existing settings state and skip settings IPC when the submitted settings are equivalent.
- RED observed:
  - `npm.cmd run verify:task-hook-state` failed because the new comparison helper was not exported.
- Verification passed:
  - `npm.cmd run verify:task-hook-state`
  - `npm.cmd run verify:task-core`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/hooks/taskHookState.ts src/hooks/useTasks.ts scripts/verify-task-hook-state.ts` passed with only LF-to-CRLF working-copy warnings.

## 2026-07-13 - Phase 364 App UI state startup hydration persistence guard
- Root cause confirmed: `persistAppUiState(...)` runs on the first renderer effect with defaults while `loadAppUiState(...)` is still awaiting Store IPC. That could send a default `setStoreMany` payload before the saved UI state arrives, and then resend the hydrated values afterward.
- Added a module-level hydration guard. Persistence now remains disabled until Store hydration has completed.
- Added `primeAppUiStatePersistence(...)` and a shared `createAppUiStateStoreEntries(...)` payload builder. The loaded snapshot becomes the persisted baseline using exactly the same serialized shape as normal updates.
- Compact-mode loading now establishes its own persisted baseline before updating React state.
- RED observed:
  - `npm.cmd run verify:app-ui-state-persistence-module` failed because the loaded-state priming API did not exist.
- Verification passed:
  - `npm.cmd run verify:app-ui-state-persistence-module`
  - `npm.cmd run build`
  - `git diff --check -- src/app/appUiStatePersistence.ts scripts/verify-app-ui-state-persistence-module.ts`
- Typecheck status after the final two-IPC hydration-order correction:
  - `npm.cmd run typecheck` is currently blocked by concurrent changes in `src/components/ReviewView.tsx`: unused `buildReviewDateGroups`, import conflicts with local `formatTime`/`groupLabel`/`localDateKey`/`ReviewRecord`, missing `getCompletionReviews`, and an implicit-any review parameter. The prior typecheck had passed before these external edits; this phase did not modify `ReviewView.tsx`.
- Verification gap recorded:
  - `npm.cmd run verify:cleanup-core` reached `verify-app-shell-composition-module` and failed an unrelated stale assertion requiring the old inline `calendarTasks` memo. Current `App.tsx` delegates the view to `createAppTaskView(...)`; this is in the parallel large-file refactor boundary and was not changed here.

## 2026-07-13 - Phase 365 Companion settings duplicate submission elimination
- Root cause confirmed: Companion settings controls can submit a newly allocated, structurally equivalent settings object. The main process already skips the physical Store write, but the renderer still replaced state and transferred the full rules/templates payload through IPC.
- Added `areCompanionSettingsEqual(...)` to the shared Companion defaults module. It compares nested arrays and objects in the normalized settings contract without importing Electron-only Store logic into the renderer.
- Updated `createCompanionSettingsUpdater(...)` to receive the current settings snapshot and return before either `setCompanionSettingsState(...)` or IPC when the submitted value is equivalent. Actual changes keep the original renderer-state-first then persistence sequence.
- Updated `App.tsx` to provide the current Companion settings snapshot to the updater factory.
- Updated `scripts/verify-app-companion-actions-module.ts` with behavior coverage for an equivalent deep copy and a genuine vault-path change.
- RED observed:
  - `npm.cmd run verify:app-companion-actions-module` failed because equal settings still caused a renderer state update.
- Verification passed:
  - `npm.cmd run verify:app-companion-actions-module`
  - `npm.cmd run verify:companion`
  - `npm.cmd run verify:electron-companion-ipc-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- shared/obsidianCompanionDefaults.ts src/app/appCompanionActions.ts src/App.tsx scripts/verify-app-companion-actions-module.ts` passed with only LF-to-CRLF working-copy warnings.

## 2026-07-13 - Phase 365 ReviewView grouping module extraction
- Current target: remove `src/components/ReviewView.tsx` from the large-file list by separating pure review date/task grouping from the React rendering and edit/delete interactions.
- Updated `scripts/verify-review-empty-fields.ts` with RED structural checks requiring `src/components/reviewView/reviewGrouping.ts`, exported grouping/date helpers, retained status-guard checks, and `ReviewView.tsx` below 300 lines.
- RED observed:
  - `npm.cmd run verify:review-fields` failed because `src/components/reviewView/reviewGrouping.ts` did not exist.
- Updated code:
  - `src/components/reviewView/reviewGrouping.ts` now owns `ReviewRecord`, `TaskGroup`, `ReviewDateGroup`, `localDateKey(...)`, `groupLabel(...)`, `formatTime(...)`, and `buildReviewDateGroups(...)`.
  - `src/components/ReviewView.tsx` now imports those helpers and keeps rendering, expansion state, and review edit/delete form handling.
  - `ReviewView.tsx` is now 289 lines and the new grouping helper is 80 lines.
- Verification passed:
  - `npm.cmd run verify:review-fields`
  - `npm.cmd run typecheck`
  - `git diff --check -- src/components/ReviewView.tsx scripts/verify-review-empty-fields.ts` passed with only LF-to-CRLF working-copy warnings.
  - `git diff --no-index --check -- <empty-temp-file> src/components/reviewView/reviewGrouping.ts` reported no whitespace errors; only LF-to-CRLF warning/no-index difference behavior.
- Current production large-file scan after this phase:
  - 10 files remain at 300+ lines.
  - 5 files remain at 400+ lines.

## 2026-07-13 - Phase 368 AI Review profile module extraction
- Current target: remove `shared/aiReview/aiReviewSettings.ts` from the large-file list by separating profile/account responsibilities from the broader settings normalization contract.
- Updated `scripts/verify-ai-settings.ts` with RED structural checks requiring `shared/aiReview/aiReviewProfiles.ts`, profile helper ownership, `aiReviewSettings.ts` re-export compatibility, and `aiReviewSettings.ts` below 300 lines.
- RED observed:
  - `npm.cmd run verify:ai-settings` failed because `shared/aiReview/aiReviewProfiles.ts` did not exist.
- Updated code:
  - `shared/aiReview/aiReviewProfiles.ts` now owns AI provider/profile types, max-token normalization, provider guards, default profile creation, profile normalization, active-profile resolution, and report-profile routing.
  - `shared/aiReview/aiReviewSettings.ts` now imports profile normalization helpers, re-exports the previous public profile APIs, and keeps the full settings normalization/defaults contract.
  - `shared/aiReview/aiReviewSettings.ts` is now 254 lines and the new profile helper is 136 lines.
- Verification passed:
  - `npm.cmd run verify:ai-settings`
  - `npm.cmd run verify:report-profile-routing`
  - `npm.cmd run verify:profile-ops`
  - `npm.cmd run typecheck`
  - `git diff --check -- shared/aiReview/aiReviewSettings.ts scripts/verify-ai-settings.ts` passed with only LF-to-CRLF working-copy warnings.
  - `git diff --no-index --check -- <empty-temp-file> shared/aiReview/aiReviewProfiles.ts` reported no whitespace errors; only LF-to-CRLF warning.
- Current production large-file scan after this phase:
  - 9 files remain at 300+ lines.
  - 5 files remain at 400+ lines.

## 2026-07-13 - Phase 366 Personalization no-op update elimination
- Root cause confirmed: a freshly allocated `PersonalizationSettings` object with the same persisted values still called `setPersonalization(...)` and rebuilt the active theme opacity override. That creates needless renderer work and can trigger persistence-effect comparison work even though the final UI state is unchanged.
- Added `arePersonalizationSettingsEqual(...)` in `src/app/appPersonalization.ts`. It explicitly compares the complete personalization contract, including all opacity values, colors, layout choices, theme id, always-on-top, and font scale.
- Updated `changePersonalization(...)` to return before either setter for equivalent submissions. Genuine changes preserve the existing personalization-first and override-memory sequence.
- RED observed:
  - `npm.cmd run verify:app-personalization-module` failed because an equivalent deep copy still called the renderer state setters.
- Verification passed:
  - `npm.cmd run verify:app-personalization-module`
  - `npm.cmd run verify:app-ui-state-persistence-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/app/appPersonalization.ts scripts/verify-app-personalization-module.ts`

## 2026-07-13 - Phase 367 Theme preset and reset no-op elimination
- Root cause confirmed: `applyThemePreset(...)` always replaced personalization even when its computed preset plus remembered override already matched current state. `resetCurrentThemeDefaults(...)` likewise allocated a new empty override object and reset personalization when the selected theme was already at defaults.
- Added internal equality for the theme-opacity override map and used it with `arePersonalizationSettingsEqual(...)` at the two state-update boundaries.
- Reapplying the active preset now returns without state work. Reset likewise returns only when both personalization and overrides are already at the reset target; a customized opacity override still clears and restores the preset exactly as before.
- RED observed:
  - `npm.cmd run verify:app-personalization-module` failed because applying the active `minimal` preset updated renderer personalization state.
- Verification passed:
  - `npm.cmd run verify:app-personalization-module`
  - `npm.cmd run verify:app-ui-state-persistence-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/app/appPersonalization.ts scripts/verify-app-personalization-module.ts`

## 2026-07-13 - Phase 368 Hydrated theme override state consolidation
- Root cause confirmed: App UI-state hydration first seeded theme overrides from loaded personalization, then immediately ran a second functional state update to merge stored overrides. That causes two renderer state update attempts and an intermediate object that cannot be observed by the user.
- Added `mergeLoadedThemeOverrides(...)` to combine the same seed-then-merge order into one pure operation. It compares the final map with the previous map and returns the original reference when no override value changes.
- `loadAppUiState(...)` now calculates the persisted baseline with the same helper and submits one functional `setThemeOverrides(...)` update, preserving stored overrides as the final precedence source.
- RED observed:
  - `npm.cmd run verify:app-personalization-module` failed because the loaded-state merge helper did not exist.
- Verification passed:
  - `npm.cmd run verify:app-personalization-module`
  - `npm.cmd run verify:app-ui-state-persistence-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/app/appPersonalization.ts src/app/appUiStatePersistence.ts scripts/verify-app-personalization-module.ts scripts/verify-app-ui-state-persistence-module.ts`

## 2026-07-13 - Phase 369 TitleBar pinned-state refresh deduplication
- Root cause confirmed: every focus event, document visibility change, window-mode broadcast, and pin-toggle response called `setPinned(...)`, including when the returned on-top value already matched the rendered state.
- Added `setPinnedIfChanged(...)` in `src/components/TitleBar.tsx`. A `useRef` tracks the authoritative current pinned boolean; matching values return before React receives a state update, while genuine transitions update both the ref and state.
- Routed initial/focus/visibility refreshes, IPC mode broadcasts, direct toggle responses, and fallback mode reads through the same guard. Existing `readWindowMode(...)` runtime narrowing remains intact.
- RED observed:
  - `npm.cmd run verify:electron-window-ipc-module` failed because the no-op state guard did not exist.
- Calibrated a stale compact-mode hydration structural assertion in the same verifier: current code correctly records the normalized baseline before updating state, which is stronger than the old direct-setter-only pattern.
- Verification passed:
  - `npm.cmd run verify:electron-window-ipc-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/components/TitleBar.tsx scripts/verify-electron-window-ipc-module.ts`

## 2026-07-13 - Phase 370 Startup settings equivalent-state elimination
- Root cause confirmed: App initializes both Companion and Obsidian template settings with default objects. A normal startup IPC response can contain a structurally identical normalized default snapshot, but the loader then replaced both React state references anyway.
- Added `areObsidianTemplateSettingsEqual(...)` to `shared/appSettings.ts`, using full recursive comparison for paths, flags, nested templates, section configuration, and custom blocks. The startup module reuses this helper and existing `areCompanionSettingsEqual(...)`.
- Updated `loadAppStartupSettings(...)` so both success and fallback values use functional state setters that return `previous` when the normalized values are equivalent. IPC reads are intentionally retained, preserving current cross-process startup behavior.
- RED observed:
  - `npm.cmd run verify:app-startup-settings-module` failed because a deep-copied default Companion setting replaced the initial reference.
- Calibrated two stale import-shape assertions in the focused structural verifier after importing the equality helpers alongside the existing default factories.
- Verification passed:
  - `npm.cmd run verify:app-startup-settings-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- shared/appSettings.ts src/app/appStartupSettings.ts scripts/verify-app-startup-settings-module.ts`

## 2026-07-13 - Phase 371 Electron main Obsidian services extraction
- Current target: keep `electron/main.ts` out of the production large-file list by separating Obsidian service composition from the main process bootstrap file.
- Updated focused Electron verifiers with RED structural checks requiring `electron/mainObsidianServices.ts`, `createMainObsidianServices(...)`, helper composition ownership, and `electron/main.ts` under 300 lines.
- RED observed:
  - `npm.cmd run verify:electron-main-modules` failed because `electron/mainObsidianServices.ts` did not exist.
- Updated code:
  - `electron/mainObsidianServices.ts` now owns composition of daily-note content helpers and Obsidian sync helpers.
  - `electron/main.ts` now imports `createMainObsidianServices(...)` instead of importing daily-note/sync helper factories directly.
  - Date helper injection, `runReviewForDate` bridge injection, `localBlogDraftDir`, `zh`, and returned service names are preserved.
  - A follow-up format-only import compaction kept the Node-counted `electron/main.ts` line count below the verifier threshold without changing behavior.
- Verification passed:
  - `npm.cmd run verify:electron-main-modules`
  - `npm.cmd run verify:electron-obsidian-daily-note-content-module`
  - `npm.cmd run verify:electron-obsidian-sync-module`
  - `npm.cmd run verify:electron-main-window-bootstrap-module`
  - `npm.cmd run typecheck`
  - `git diff --check -- electron/main.ts scripts/verify-electron-main-modules.ts scripts/verify-electron-obsidian-daily-note-content-module.ts scripts/verify-electron-obsidian-sync-module.ts` passed with only LF-to-CRLF working-copy warnings.
  - `git diff --no-index --check -- <empty-temp-file> electron/mainObsidianServices.ts` reported no whitespace errors; only LF-to-CRLF warning.
- Current production large-file scan after this phase:
  - 8 files remain at 300+ lines.
  - 5 files remain at 400+ lines.

## 2026-07-13 - Phase 372 Electron Obsidian sync daily-note boundary extraction
- Current target: remove `electron/obsidianSync.ts` from the production large-file list by separating daily-note file writes and task payload validation from the sync orchestrator.
- Updated `scripts/verify-electron-obsidian-sync-module.ts` with RED structural checks requiring `electron/obsidianSyncDailyNote.ts`, `electron/obsidianSyncValidation.ts`, imported helper boundaries, and `electron/obsidianSync.ts` below 300 lines.
- RED observed:
  - `npm.cmd run verify:electron-obsidian-sync-module` failed because `electron/obsidianSyncDailyNote.ts` did not exist.
- Updated code:
  - `electron/obsidianSyncValidation.ts` now owns `ObsidianSyncTask` and recursive unknown payload validation.
  - `electron/obsidianSyncDailyNote.ts` now owns daily-note path resolution, overview refresh orchestration, daily-note file reads, timestamp preservation, managed-block no-op updates, and single-note sync writes.
  - `electron/obsidianSync.ts` now imports those helpers and remains responsible for affected-date collection, vault/input checks, multi-date sync, optional blog draft output, AI review triggering, and sync preview aggregation.
  - `electron/obsidianSync.ts` is now 269 lines.
- Verification passed:
  - `npm.cmd run verify:electron-obsidian-sync-module`
  - `npm.cmd run verify:electron-main-modules`
  - `npm.cmd run verify:electron-obsidian-daily-note-content-module`
  - `npm.cmd run typecheck`
  - `git diff --check -- electron/obsidianSync.ts scripts/verify-electron-obsidian-sync-module.ts`
  - `git diff --no-index --check -- <empty-temp-file> electron/obsidianSyncDailyNote.ts` reported no whitespace errors; only LF-to-CRLF warning.
  - `git diff --no-index --check -- <empty-temp-file> electron/obsidianSyncValidation.ts` reported no whitespace errors; only LF-to-CRLF warning.
- Current production large-file scan after this phase:
  - 7 files remain at 300+ lines.
  - 4 files remain at 400+ lines.

## 2026-07-13 - Phase 372 Auto-start renderer state refresh deduplication
- Root cause confirmed: `AutoStartToggle` unconditionally called its state setter after both the initial Electron read and every mutation result, even when the returned enabled value matched the rendered value.
- Added `setAutoStartIfChanged(...)` with an authoritative `useRef` baseline. Matching values return before React receives a state update; real transitions update the ref and state together.
- Routed both `getAutoStart()` and `setAutoStart(...)` responses through this helper. Strict `value === true` narrowing and main-process truth remain unchanged.
- RED observed:
  - `npm.cmd run verify:electron-window-ipc-module` failed because the no-op state guard did not exist.
- Verification passed:
  - `npm.cmd run verify:electron-window-ipc-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build` (normal Vite chunk-size warning remains)
  - `git diff --check -- src/components/settings/SettingsControls.tsx scripts/verify-electron-window-ipc-module.ts`

## 2026-07-13 - Phase 373 Priority picker no-op change elimination
- Root cause confirmed: `PriorityPicker` is shared by main tasks, subtasks, and quick capture. Selecting the already-active option unconditionally invoked its parent `onChange(priority)` callback, which can traverse task-tree update, persistence, and Obsidian-sync effects despite no visible or data change.
- Updated the option action so it calls `onChange(priority)` only when `priority !== value`; `setIsOpen(false)` still runs for every selection, preserving the close interaction.
- RED observed:
  - `npm.cmd run verify:task-item-subtask-card-module` failed because the picker always propagated the selected option.
- Verification passed:
  - `npm.cmd run verify:task-item-subtask-card-module`
  - `npm.cmd run typecheck`
  - `git diff --check -- src/components/PriorityPicker.tsx scripts/verify-task-item-subtask-card-module.ts` (only LF-to-CRLF working-copy warning)
- Production build is currently blocked outside this change by concurrent `electron/obsidianSync.ts` extraction work that leaves duplicate helper declarations. The build error names `getDailyFilePath`, `triggerOverviewUpdate`, `readDailyNoteFileIfPresent`, and `syncOneDailyNote`.

## 2026-07-13 - Phase 374 App shell overlay composition extraction
- Verified current App shell overlay extraction state from disk before recording it: `src/app/appShellComposition.tsx` is 273 lines and `src/app/appShellOverlayComposition.ts` exists.
- Focused verifier passed in the current worktree:
  - `npm.cmd run verify:app-shell-composition-module`
- Historical verification from the completed extraction remained applicable:
  - `npm.cmd run verify:date-navigator-module`
  - `npm.cmd run verify:app-main-content-module`
  - `npm.cmd run typecheck`
  - `git diff --check -- src/app/appShellComposition.tsx src/app/appShellOverlayComposition.ts scripts/verify-app-shell-composition-module.ts`
- Current large-file count after this phase was 6 production files at 300+ lines and 4 at 400+ lines.

## 2026-07-13 - Phase 375 SettingsPanel AI Review state hook extraction
- Current target: remove `src/components/SettingsPanel.tsx` from the production large-file list by moving AI Review state/effect orchestration into a settings hook.
- Updated structural verifiers with RED checks requiring `src/components/settings/useAiReviewSettingsPanelState.ts`, requiring `SettingsPanel.tsx` under 300 lines, and ensuring AI Review IPC/progress/deferred-persistence logic no longer lives in `SettingsPanel.tsx`.
- RED observed:
  - `npm.cmd run verify:settings-panel-modules` failed because `useAiReviewSettingsPanelState.ts` did not exist.
- Updated code:
  - `src/components/settings/useAiReviewSettingsPanelState.ts` now owns AI Review settings load/normalize, progress subscription, deferred settings persistence, diagnostics, generation status, manual generation orchestration, and weekly/monthly source options.
  - `src/components/SettingsPanel.tsx` now delegates AI Review state through `useAiReviewSettingsPanelState(...)` and remains focused on section navigation and rendering.
  - `scripts/verify-settings-ai-review-module.ts` and `scripts/verify-settings-ai-review-section.ts` were calibrated so existing AI Review behavior checks follow the new hook boundary.
  - `src/components/SettingsPanel.tsx` dropped from 392 lines to 161 lines; the new hook is 280 lines, below the large-file threshold.
- Verification passed:
  - `npm.cmd run verify:settings-panel-modules`
  - `npm.cmd run verify:settings-ai-review-module`
  - `npm.cmd run verify:settings-ai-review-section`
  - `npm.cmd run typecheck`
  - `git diff --check -- src/components/SettingsPanel.tsx src/components/settings/useAiReviewSettingsPanelState.ts scripts/verify-settings-panel-modules.ts scripts/verify-settings-ai-review-module.ts scripts/verify-settings-ai-review-section.ts` passed with only LF-to-CRLF working-copy warnings.
  - `git diff --no-index --check -- <empty-temp-file> src/components/settings/useAiReviewSettingsPanelState.ts` reported no whitespace errors; only LF-to-CRLF warning.
- Current production large-file scan after this phase:
  - 5 files remain at 300+ lines.
  - 4 files remain at 400+ lines.

## 2026-07-13 - Phase 376 Obsidian Companion mobile inbox extraction
- Current target: remove `electron/obsidianCompanion.ts` from the production large-file list by moving mobile inbox import and file-moving mechanics out of the sync planning module.
- Updated `electron/obsidianCompanion.verify.ts` with RED structural checks requiring `electron/obsidianCompanionMobileInbox.ts`, requiring `electron/obsidianCompanion.ts` below 300 lines, and preserving `importMobileInbox` through the existing `electron/obsidianCompanion.ts` entrypoint.
- RED observed:
  - `npm.cmd run verify:companion` failed because `electron/obsidianCompanionMobileInbox.ts` did not exist.
- Updated code:
  - `electron/obsidianCompanionMobileInbox.ts` now owns mobile inbox path validation, processed/failed directory setup, text/JSON capture parsing, capture type normalization, unique destination reservation, processed moves, and failed fallback moves.
  - `electron/obsidianCompanion.ts` re-exports `importMobileInbox` from the new module and remains responsible for template rendering, rule matching, sync plan construction, section insertion, managed-block replacement, and sync plan writing.
  - `electron/obsidianCompanion.ts` dropped from 378 lines to 236 lines; the new mobile inbox module is 149 lines.
- Verification passed:
  - `npm.cmd run verify:companion`
  - `npm.cmd run typecheck`
  - `git diff --check -- electron/obsidianCompanion.ts electron/obsidianCompanionMobileInbox.ts electron/obsidianCompanion.verify.ts` passed with only LF-to-CRLF working-copy warnings.
- Current production large-file scan after this phase:
  - 4 files remain at 300+ lines.
  - 4 files remain at 400+ lines.
## 2026-07-13 - Phase 378 App runtime and composition extraction completion
- Completed the remaining App entrypoint extraction by moving local state into `src/app/useAppLocalState.ts`, runtime effects into `src/app/useAppRuntimeEffects.ts`, and composition wiring into `src/app/useAppShellComposition.ts`.
- Kept `src/App.tsx` as the application entrypoint while the extracted modules retain explicit state/effect/composition ownership.
- Calibrated the cleanup verifiers to follow the actual extracted ownership boundaries, including Obsidian template actions and Companion mobile inbox collision handling.
- Final production-source scan: 270 files scanned, 0 files at or above 300 lines, and 0 files at or above 400 lines.
- Final verification passed:
  - `npm.cmd run verify:cleanup-core` (includes `npm.cmd run typecheck`)
  - `npm.cmd run build`

## 2026-07-13 - Phase 389 Obsidian sync affected-date planning extraction
- Added a RED requirement to `scripts/verify-electron-obsidian-sync-module.ts` for `electron/obsidianSyncPlanning.ts`, direct planner import by the orchestrator, and removal of local affected-date traversal.
- RED observed:
  - `npm.cmd run verify:electron-obsidian-sync-module` failed because `electron/obsidianSyncPlanning.ts` did not exist.
- Updated code:
  - `electron/obsidianSyncPlanning.ts` now owns completion-record date membership, recursive task/subtask affected-date collection, and `getDatesAffectedBySync(...)`.
  - `electron/obsidianSync.ts` supplies its existing `getTaskDate` and `getReviewDate` policies to the pure planner, while retaining sync and preview orchestration plus all filesystem side effects.
- Verification passed:
  - `npm.cmd run verify:electron-obsidian-sync-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git -C .. diff --check -- app/electron/obsidianSync.ts app/electron/obsidianSyncPlanning.ts app/scripts/verify-electron-obsidian-sync-module.ts`

## 2026-07-13 - Phase 390 AI Review generation hook extraction
- Added a RED requirement to `scripts/verify-settings-ai-review-module.ts` for `src/components/settings/useAiReviewGeneration.ts`, direct delegation by the panel state hook, and removal of generation orchestration/timer state from the settings persistence hook.
- RED observed:
  - `npm.cmd run verify:settings-ai-review-module` failed because `useAiReviewGeneration.ts` did not exist.
- Updated code:
  - `useAiReviewGeneration.ts` now owns progress subscription, fallback timer cleanup, daily inspection/overwrite confirmation, all report-generation IPC calls, result/diagnostic parsing, and generation status.
  - `useAiReviewSettingsPanelState.ts` retains settings lifecycle, normalization, panel option construction, immediate/deferred persistence, and exposes the generation hook result unchanged to the presentational section.
- Verification passed:
  - `npm.cmd run verify:settings-ai-review-module`
  - `npm.cmd run verify:settings-ai-review-section`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git -C .. diff --check -- app/src/components/settings/useAiReviewSettingsPanelState.ts app/src/components/settings/useAiReviewGeneration.ts app/scripts/verify-settings-ai-review-module.ts`

## 2026-07-13 - Phase 391 desktop window owner controller extraction
- Added a RED requirement to `scripts/verify-electron-desktop-window-mode-module.ts` for `electron/desktopWindowOwner.ts`, direct use by `desktopWindowMode.ts`, and removal of the owner helper bodies from the state-machine controller.
- RED observed:
  - `npm.cmd run verify:electron-desktop-window-mode-module` failed because `electron/desktopWindowOwner.ts` did not exist.
- Updated code:
  - `desktopWindowOwner.ts` now owns `setDesktopOwner`, `clearDesktopOwner`, applied-state tracking, and the existing owner diagnostics.
  - `desktopWindowMode.ts` retains desktop state transitions, polling, show/hide, topmost/clear-topmost, and app-background sink behavior while delegating owner operations.
- Regression calibration:
  - `npm.cmd run verify:window-mode` initially failed because `electron/windowMode.verify.ts` still asserted direct z-order injection from `main.ts`.
  - Root cause: Phase 383 moved that injection to `mainWindowComposition.ts`; the runtime dependency remained intact.
  - Updated the verifier to inspect the actual composition module.
- Verification passed:
  - `npm.cmd run verify:electron-desktop-window-mode-module`
  - `npm.cmd run verify:window-mode`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git -C .. diff --check -- app/electron/desktopWindowMode.ts app/electron/desktopWindowOwner.ts app/electron/windowMode.verify.ts app/scripts/verify-electron-desktop-window-mode-module.ts`

## 2026-07-13 - Phase 379 AI account manager presentation split
- Established RED verification with `npm.cmd run verify:settings-v2-ai-account`; it failed because `AiAccountList.tsx` did not exist.
- Extracted account list presentation into `src/components/settings/AiAccountList.tsx` and account field presentation into `src/components/settings/AiAccountDetails.tsx`.
- `src/components/settings/AiAccountManager.tsx` now owns only modal composition, selected-account resolution, and model-fetch IPC state; it is 116 lines.
- Verification passed:
  - `npm.cmd run verify:settings-v2-ai-account`
  - `npm.cmd run verify:settings-ai-review-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/components/settings/AiAccountManager.tsx src/components/settings/AiAccountList.tsx src/components/settings/AiAccountDetails.tsx scripts/verify-settings-v2-ai-account.ts scripts/verify-settings-ai-review-module.ts` (only LF-to-CRLF working-copy warnings)
- A fresh `>=250` line scan no longer lists `AiAccountManager.tsx`; 10 source files remain in the stricter pass.

## 2026-07-13 - Phase 380 Template editor block-list extraction
- Added RED verification to `scripts/verify-app-template-editor-module.ts`; `npm.cmd run verify:app-template-editor-module` failed because `TemplateEditorBlockList.tsx` did not exist.
- Added `src/components/templateEditor/TemplateEditorBlockList.tsx`, which owns the sortable DnD context and daily/report row rendering.
- Reduced `src/components/TemplateEditorModal.tsx` from 293 to 127 lines. It retains template state, all mutation callbacks, recognition, confirmation dialogs, and modal actions.
- Updated `scripts/verify-section-config.ts` so its render-type control assertion follows the extracted list component.
- Verification passed:
  - `npm.cmd run verify:app-template-editor-module`
  - `npm.cmd run verify:section-config`
  - `git diff --check -- src/components/TemplateEditorModal.tsx src/components/templateEditor/TemplateEditorBlockList.tsx scripts/verify-app-template-editor-module.ts scripts/verify-section-config.ts` (only LF-to-CRLF working-copy warnings)
- Global verification status:
  - `npm.cmd run typecheck` and `npm.cmd run build` are blocked by the current worktree's `src/components/ReviewView.tsx(115,1): error TS1005: '}' expected`, unrelated to this extraction.
- Fresh strict scan: `TemplateEditorModal.tsx` no longer appears; 15 non-script production candidates remain at `>=250` lines, including one test-side verifier file that is excluded from production cleanup work.

## 2026-07-13 - Phase 381 LLM provider response parsing extraction
- Added RED structural requirements to `scripts/verify-openai-client.ts` for `shared/llm/llmProviderResponseParsing.ts`; `npm.cmd run verify:openai-client` initially failed as expected because the module did not exist.
- Extracted unknown-safe SSE parsing, OpenAI-compatible/Anthropic/Gemini response parsing, stream aggregation, token-usage extraction, usage-only stream detection, and model-list parsing into `shared/llm/llmProviderResponseParsing.ts`.
- `shared/llm/llmProviderProtocol.ts` now owns request construction only and delegates response behavior through `createProviderResponseParser(...)`, preserving existing client-facing re-exports.
- An initial typecheck caught a TypeScript narrowing issue in the extracted backward SSE usage scan. It was repaired by retaining the indexed event in a local `unknown` value before narrowing; no runtime behavior changed.
- Verification passed:
  - `npm.cmd run verify:openai-client`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git -C .. diff --check -- app/shared/llm/llmProviderProtocol.ts app/shared/llm/llmProviderResponseParsing.ts app/scripts/verify-openai-client.ts` (only an LF-to-CRLF working-copy warning)

## 2026-07-13 - Phase 382 AI Review diagnostic validation extraction
- Added RED structural requirements to `scripts/verify-ai-run-diagnostics.ts` for `shared/aiReview/aiReviewDiagnosticsValidation.ts`; `npm.cmd run verify:ai-run-diagnostics` initially failed as expected because the module did not exist.
- Extracted runtime narrowing for unknown AI Review progress events and run diagnostics, plus optional-diagnostic reading, into `shared/aiReview/aiReviewDiagnosticsValidation.ts`.
- `shared/aiReview/runDiagnostics.ts` now owns the cross-process type contract, token aggregation, safe base URL display, IPC result reader facade, and stable re-exports of the validation API. Existing imports remain unchanged.
- Verification passed:
  - `npm.cmd run verify:ai-run-diagnostics`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git -C .. diff --check -- app/shared/aiReview/runDiagnostics.ts app/shared/aiReview/aiReviewDiagnosticsValidation.ts app/scripts/verify-ai-run-diagnostics.ts` (only LF-to-CRLF working-copy warnings)

## 2026-07-13 - Phase 383 Electron main-window composition extraction
- Added `electron/mainWindowComposition.ts` to assemble main-window persistence, mode control, shell/tray/task-menu behavior, startup, and bootstrap registration.
- `electron/main.ts` remains responsible for Electron process initialization, state/service creation, and lifecycle registration; it is currently 235 lines, below the strict 250-line cleanup scan threshold. The new composition module is 192 lines.
- Recalibrated focused structural verifiers so dependency-assembly assertions inspect `mainWindowComposition.ts`, while each extracted module retains its specific behavior assertions.
- Focused verification passed: context-menu, task-menu window, task-context-menu IPC, main-window events, main-window structure, window IPC, main-window persistence, window-mode state, main runtime state, and `npm.cmd run build`.
- Aggregate verification status: `npm.cmd run verify:cleanup-core` progressed through the Electron composition checks, then stopped in `verify:task-ordering-state` because `src/utils/taskOrderPersistence.ts` is absent in the concurrently changing worktree. This is outside the window-composition extraction scope.

## 2026-07-13 - Phase 383 task-order persistence parsing extraction
- Updated `scripts/verify-task-ordering-state.ts` first with a RED structural requirement for `src/utils/taskOrderPersistence.ts`; `npm.cmd run verify:task-ordering-state` failed as expected because the new module did not exist.
- Added `src/utils/taskOrderPersistence.ts` to own unknown persisted-state parsing, `TaskSource` runtime narrowing, and the persisted date-order contract.
- Kept `src/utils/taskOrdering.ts` as the stable public facade by re-exporting the parser APIs and types, while retaining display sorting and order mutation responsibilities.
- A first typecheck correctly found one unused local import after the re-export move; removing that unused local binding restored the intended facade-only import shape.
- Verification passed:
  - `npm.cmd run verify:task-ordering-state`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git -C .. diff --check -- app/src/utils/taskOrdering.ts app/src/utils/taskOrderPersistence.ts app/scripts/verify-task-ordering-state.ts` (only LF-to-CRLF working-copy warnings)

## 2026-07-13 - Phase 384 Obsidian Companion sync planning extraction
- Updated `electron/obsidianCompanion.verify.ts` first with RED structural requirements for `electron/obsidianCompanionPlanning.ts`; `npm.cmd run verify:companion` failed as expected because the module did not exist.
- Added `electron/obsidianCompanionPlanning.ts` to own date/time keys, capture template rendering, rule matching, runtime settings/item validation, vault-relative target resolution, and sync-plan construction.
- Kept `electron/obsidianCompanion.ts` responsible for executing validated plans: preflight vault checks, section insertion, managed-block replacement, and writing only changed files. Existing planning exports remain available through its re-export facade.
- The first post-extraction verifier run correctly exposed stale assertions that inspected rule-validator usage in the old module; those assertions were redirected to the planning module with the same requirements retained.
- Verification passed:
  - `npm.cmd run verify:companion`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git -C .. diff --check -- app/electron/obsidianCompanion.ts app/electron/obsidianCompanionPlanning.ts app/electron/obsidianCompanion.verify.ts` (only LF-to-CRLF working-copy warnings)
- Resulting sizes: `electron/obsidianCompanion.ts` is 108 lines and `electron/obsidianCompanionPlanning.ts` is 184 lines.

## 2026-07-13 - Phase 385 AI Review report output extraction
- Updated `scripts/verify-export-reports.ts` first with RED structural requirements for a dedicated `electron/aiReview/reportOutput.ts` module and stable facade re-exports. `npm.cmd run verify:export-reports` failed as expected because that module did not exist.
- Added `electron/aiReview/reportOutput.ts` as the owner of report content composition, atomic file writes, vault-contained output-path resolution, and personal/external report frontmatter formatting.
- Kept `electron/aiReview/exportReports.ts` focused on report message orchestration, external source redaction, custom template block generation, and the public weekly/monthly/external generator APIs.
- Preserved existing callers by re-exporting `composeReportContent` and `ReportResult` from `exportReports.ts`.
- Verification passed:
  - `npm.cmd run verify:export-reports`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git -C .. diff --check -- app/electron/aiReview/exportReports.ts app/electron/aiReview/reportOutput.ts app/scripts/verify-export-reports.ts app/task_plan.md app/progress.md` (only LF-to-CRLF working-copy warnings)

## 2026-07-13 - Phase 386 Markdown editor textarea DOM extraction
- Updated `scripts/verify-markdown-editor.ts` first with RED requirements for a dedicated `src/hooks/markdownEditorTextarea.ts` module. `npm.cmd run verify:markdown-editor` failed as expected because the helper module did not exist.
- Added `src/hooks/markdownEditorTextarea.ts` to own textarea mirror measurement, caret scrolling, focus, and selection restoration after controlled React updates.
- Kept `src/hooks/useMarkdownEditor.ts` focused on undo/redo history, React effect timing, markdown keyboard command dispatch, and its existing API used by Daily Work and completion-review inputs.
- Verification passed:
  - `npm.cmd run verify:markdown-editor`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git -C .. diff --check -- app/src/hooks/useMarkdownEditor.ts app/src/hooks/markdownEditorTextarea.ts app/scripts/verify-markdown-editor.ts` (only LF-to-CRLF working-copy warnings)

## 2026-07-13 - Phase 387 personalization settings state extraction
- Updated `scripts/verify-app-personalization-module.ts` first to require `src/app/personalizationSettings.ts`; `npm.cmd run verify:app-personalization-module` failed as expected because that module did not exist.
- Added `src/app/personalizationSettings.ts` as the pure owner of persistence keys, unknown stored-value normalization, theme override parsing/merging, settings equality, preset/reset transforms, and override memory.
- Reduced `src/app/appPersonalization.ts` to the React action factory plus compatibility re-exports, so existing app imports remain stable while pure behavior is separately testable.
- Verification passed:
  - `npm.cmd run verify:app-personalization-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git -C .. diff --check -- app/src/app/appPersonalization.ts app/src/app/personalizationSettings.ts app/scripts/verify-app-personalization-module.ts`
- Resulting sizes: `appPersonalization.ts` 70 lines; `personalizationSettings.ts` 188 lines.

## 2026-07-13 - Phase 388 App shell main-content composition extraction
- Updated `scripts/verify-app-shell-composition-module.ts` and `scripts/verify-app-main-content-module.ts` first to require `src/app/appShellMainContentComposition.tsx`. Both focused verifiers failed as expected because the module did not exist.
- Added `src/app/appShellMainContentComposition.tsx`, which owns typed prop construction for Header, DateNavigator, TabBar, AppTopContent, ReviewView, TaskList, AddTaskInput, and AppMainContent.
- Kept `src/app/appShellComposition.tsx` as the narrow shell coordinator: TitleBar prop assembly, main-content helper delegation, overlay helper delegation, and final return shape.
- The first post-extraction typecheck found the outer options interface still referenced `AppTopContent`; restoring its type-only component import corrected that ownership-neutral type dependency. Two stale structural assertions were redirected from the outer shell file to the new owner without weakening their behavior checks.
- Verification passed:
  - `npm.cmd run verify:app-shell-composition-module`
  - `npm.cmd run verify:app-main-content-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git -C .. diff --check -- app/src/app/appShellComposition.tsx app/src/app/appShellMainContentComposition.tsx app/scripts/verify-app-shell-composition-module.ts app/scripts/verify-app-main-content-module.ts`
- Resulting sizes: `appShellComposition.tsx` 241 lines; `appShellMainContentComposition.tsx` 200 lines.

## 2026-07-13 - Phase 392 Obsidian sync runtime guard reuse
- Updated `scripts/verify-electron-obsidian-sync-module.ts` first to require `electron/unknownValueGuards.ts`, shared imports in the selected sync modules, and removal of their duplicate local object-record guards.
- RED observed as expected: `npm.cmd run verify:electron-obsidian-sync-module` failed because `electron/unknownValueGuards.ts` did not exist.
- Added `electron/unknownValueGuards.ts` with `isObjectRecord(...)`, then migrated `electron/obsidianSyncValidation.ts` and `electron/obsidianSyncDailyNote.ts` from identical local guards without changing their runtime predicate semantics.
- Verification passed:
  - `npm.cmd run verify:electron-obsidian-sync-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git -C .. diff --check -- app/electron/unknownValueGuards.ts app/electron/obsidianSyncValidation.ts app/electron/obsidianSyncDailyNote.ts app/scripts/verify-electron-obsidian-sync-module.ts`
- Follow-up scan confirmed more identical object guards exist elsewhere, but they remain deliberately unmodified until each consumer's ownership and dependency direction are reviewed.

## 2026-07-13 - Phase 393 LLM response guard reuse
- Reviewed `shared/llm/openaiClient.ts`, `shared/llm/llmProviderProtocol.ts`, and `shared/llm/llmProviderResponseParsing.ts`; the parser only type-imports the client provider type, so exporting its pure guard for client reuse does not create a runtime import cycle.
- Updated `scripts/verify-openai-client.ts` first. RED observed: `npm.cmd run verify:openai-client` failed because provider-response parsing did not expose the shared object-record guard.
- Exported `isObjectRecord(...)` from `shared/llm/llmProviderResponseParsing.ts` and reused it in `shared/llm/openaiClient.ts`, removing the identical local predicate while retaining usage-only stream and model-list result validation behavior.
- Verification passed:
  - `npm.cmd run verify:openai-client`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git -C .. diff --check -- app/shared/llm/openaiClient.ts app/shared/llm/llmProviderResponseParsing.ts app/scripts/verify-openai-client.ts` (only LF-to-CRLF working-copy warnings)

## 2026-07-13 - Phase 394 Obsidian Companion runtime guard reuse
- Reviewed the Companion planning and mobile inbox modules: both had the exact Electron-layer object-record predicate already introduced in `electron/unknownValueGuards.ts`, and neither required a shared-layer dependency.
- Updated `electron/obsidianCompanion.verify.ts` first to require both consumers to import the shared Electron guard and reject local duplicate declarations. RED observed: `npm.cmd run verify:companion` failed because both modules still lacked the shared imports.
- Updated `electron/obsidianCompanionPlanning.ts` and `electron/obsidianCompanionMobileInbox.ts` to use `isObjectRecord(...)` for settings, JSON, and filesystem-error narrowing. All planning and inbox behavior remains within its existing module boundary.
- Verification passed:
  - `npm.cmd run verify:companion`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git -C .. diff --check -- app/electron/obsidianCompanionPlanning.ts app/electron/obsidianCompanionMobileInbox.ts app/electron/obsidianCompanion.verify.ts app/electron/unknownValueGuards.ts` (only an LF-to-CRLF working-copy warning)

## 2026-07-13 - Phase 393 verifier calibration and OpenAI client boundary review
- Recalibrated stale App shell and AI Review verifier ownership after concurrent extractions moved main-content composition and AI generation orchestration into their dedicated modules.
- Fresh focused verification, `npm.cmd run typecheck`, `npm.cmd run verify:cleanup-core`, and `npm.cmd run build` passed after calibration.
- Re-scanned the remaining strict large-file candidates and selected `shared/llm/openaiClient.ts` for the next behavior-preserving extraction.
- Confirmed the proposed low-coupling boundary: retain the current public facade and auto-provider retry loops, and move user-facing error formatting plus per-provider transport/timeout execution into an internal helper that reuses the existing protocol and response-parser modules.

## 2026-07-13 - Phase 395 LLM client transport extraction
- Updated `scripts/verify-openai-client.ts` first to require `shared/llm/llmClientTransport.ts`, public facade delegation, and removal of duplicate single-provider request execution. RED observed as expected because the transport module did not exist.
- Added `shared/llm/llmClientTransport.ts`, which owns one-provider chat/model HTTP execution, abort timeout handling, SSE/JSON response handling, diagnostics timing/usage assignment, model de-duplication, and neutral error callback points.
- Reduced `shared/llm/openaiClient.ts` to its intended facade boundary: public types and compatibility exports, config validation, automatic provider/URL candidate retries, user-facing Chinese error formatting, and `readListModelsResult(...)` IPC validation.
- Kept protocol request construction in `llmProviderProtocol.ts` and unknown-safe response parsing in `llmProviderResponseParsing.ts`; transport type-imports the facade contract, so no runtime cycle is introduced.
- Verification passed:
  - `npm.cmd run verify:openai-client`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git -C .. diff --check -- app/shared/llm/openaiClient.ts app/shared/llm/llmClientTransport.ts app/scripts/verify-openai-client.ts`
- Resulting sizes: `openaiClient.ts` 201 lines; `llmClientTransport.ts` 119 lines.

## 2026-07-13 - Phase 395 TitleBar window-mode hook extraction
- Re-read `src/components/TitleBar.tsx` and selected its pinned-window lifecycle as a self-contained boundary after deferring the more patch-fragile OpenAI transport extraction.
- Updated `scripts/verify-electron-window-ipc-module.ts` first; RED was observed because `src/components/useTitleBarWindowMode.ts` did not exist and TitleBar still owned the subscription.
- Added `src/components/useTitleBarWindowMode.ts` with the existing pinned state, no-op guard, initial mode refresh, focus/visibility listeners, `onWindowModeChanged` subscription, always-on-top response handling, and fallback `getWindowMode` read.
- Updated `TitleBar.tsx` to consume `{ pinned, toggleAlwaysOnTop }`, leaving its button event and visual state handling in place.
- A first small-block deletion left two legacy comments plus an unclosed `useEffect`; repaired it with a targeted UTF-8-context patch, then verified the component syntax and module boundary.
- Verification passed:
  - `npm.cmd run verify:electron-window-ipc-module`
  - `npm.cmd run verify:app-shell-composition-module`
  - `npm.cmd run typecheck`
  - `git diff --check -- src/components/TitleBar.tsx src/components/useTitleBarWindowMode.ts scripts/verify-electron-window-ipc-module.ts`
  - `npm.cmd run build`
- `npm.cmd run verify:cleanup-core` returned code 0 but emitted an unrelated `verify-electron-companion-ipc-module` assertion that still expects the old `isObject(...)` guard name. This needs verifier calibration in a separate follow-up; no TitleBar verifier or typecheck failure remained.

## 2026-07-13 - Phase 396 OpenAI client transport boundary verification
- Rechecked the in-progress LLM transport extraction after the aggregate verifier had reached a typecheck failure for legacy facade functions.
- The current concurrent worktree already had both legacy implementations removed and the facade delegated both chat and model-list attempts to `shared/llm/llmClientTransport.ts`.
- Strengthened `scripts/verify-openai-client.ts` to reject `callChatCompletionOnceLegacy(...)` and `listModelsOnceLegacy(...)`, preventing dead duplicate transport implementations from returning under renamed identifiers.
- The first focused verifier run was green because the concurrent removal had already occurred. A transient missing `AiReviewTokenUsage` import was observed during typecheck, traced to concurrent file state, and resolved once the import was present again; no unrelated source changes were made to address it.
- Verification passed:
  - `npm.cmd run verify:openai-client`
  - `npm.cmd run typecheck`
  - `npm.cmd run verify:cleanup-core`
  - `npm.cmd run build`
  - `git diff --check -- shared/llm/openaiClient.ts shared/llm/llmClientTransport.ts scripts/verify-openai-client.ts scripts/verify-electron-companion-ipc-module.ts`

## 2026-07-13 - Phase 397 task display ordering extraction
- Updated `scripts/verify-task-ordering-state.ts` first to require `src/utils/taskDisplayOrdering.ts`, facade re-exports from `taskOrdering.ts`, and direct ownership of the display-sorting performance invariants.
- RED observed as expected: `npm.cmd run verify:task-ordering-state` failed only because `src/utils/taskDisplayOrdering.ts` did not exist.
- Added `src/utils/taskDisplayOrdering.ts` for `DEFAULT_SOURCE_ORDER`, task-source normalization, source bucketing, completion/priority ordering, and manual-order missing-task insertion.
- Reduced `src/utils/taskOrdering.ts` to drag/order mutation helpers and compatibility exports, preserving existing consumer import paths.
- Verification passed:
  - `npm.cmd run verify:task-ordering-state`
  - `npm.cmd run verify:task-list-interactions`
  - `npm.cmd run verify:task-list-dnd-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run verify:cleanup-core`
  - `npm.cmd run build`
  - `git diff --check -- src/utils/taskOrdering.ts src/utils/taskDisplayOrdering.ts scripts/verify-task-ordering-state.ts` (only LF-to-CRLF working-copy warnings)

## 2026-07-13 - Phase 398 Shared Obsidian unknown-value guard reuse
- Reviewed the stable shared Obsidian modules `obsidianIpcResults.ts` and `obsidianTemplateSettings.ts`; both independently contained the same object-record narrowing predicate and have the same shared-layer dependency direction.
- Updated focused verifiers first. The first run exposed a missing `existsSync` import in `verify-settings-sync.ts`; after correcting that verifier prerequisite, both focused checks failed as intended because `shared/unknownValueGuards.ts` did not exist.
- Added `shared/unknownValueGuards.ts` with `isObjectRecord(...)`, then migrated the two consumers. IPC action and preview result readers retain malformed-value rejection; template settings normalization retains defaults and legacy migrations.
- Verification passed:
  - `npm.cmd run verify:settings-sync`
  - `npm.cmd run verify:template-source-settings`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `npm.cmd run verify:cleanup-core`
  - `git -C .. diff --check -- app/shared/unknownValueGuards.ts app/shared/obsidianIpcResults.ts app/shared/obsidianTemplateSettings.ts app/scripts/verify-settings-sync.ts app/scripts/verify-template-source-settings.ts`
- Follow-up scan confirms 12 identical local object-record guards still exist in other modules. They are deferred because each needs a dependency-ownership review before sharing a helper across its domain boundary. Production `any` / `as any` remains absent; current matches are user-facing English text or verifier strings only.

## 2026-07-13 - Phase 399 AI Review unknown-value guard reuse
- Reviewed the stable AI Review IPC readers, diagnostic validation, and settings-normalization modules. Each used the identical shared-layer object-record predicate, so importing `shared/unknownValueGuards.ts` keeps the dependency direction straightforward.
- Updated `verify-ai-settings.ts` and `verify-ai-run-diagnostics.ts` first. RED observed: both focused checks failed because the selected modules did not yet import `isObjectRecord(...)`.
- Migrated the three consumers with no changes to settings migration/defaulting, diagnostic schemas, or malformed IPC payload rejection.
- The first aggregate verification encountered two concurrent extraction transitions: first a transient stale read in task persistence, then a genuine stale task-list assertion that checked the old persistence facade after manual-order loading moved to `taskPersistenceInitialization.ts`. Verified the behavior lives in the initialization owner, then calibrated only that assertion to the actual owner while retaining the `useTasks` state exposure check.
- Verification passed:
  - `npm.cmd run verify:ai-settings`
  - `npm.cmd run verify:ai-run-diagnostics`
  - `npm.cmd run verify:task-list-interactions`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `npm.cmd run verify:cleanup-core`
  - `git -C .. diff --check -- app/shared/unknownValueGuards.ts app/shared/aiReview/aiReviewIpcResultReaders.ts app/shared/aiReview/aiReviewDiagnosticsValidation.ts app/shared/aiReview/aiReviewSettingsNormalization.ts app/scripts/verify-ai-settings.ts app/scripts/verify-ai-run-diagnostics.ts app/scripts/verify-task-list-interactions.ts`
- Follow-up scan now finds 10 identical local object-record predicates. The remaining instances span unrelated shared modules, Electron code, and UI code, so they need separate ownership reviews rather than a bulk cross-layer migration.

## 2026-07-13 - Phase 400 Electron AI Review task-payload guard reuse
- Rechecked `electron/aiReviewTaskPayload.ts`, `electron/unknownValueGuards.ts`, and its focused IPC verifier twice; all three were hash-stable despite the concurrent worktree.
- Updated `verify-electron-ai-review-daily-run-inspect-ipc-module.ts` first to require the Electron object-record guard import and reject a local duplicate predicate. RED was observed because `aiReviewTaskPayload.ts` still declared `isObject(...)`.
- Migrated the recursive task and completion-review validators to `isObjectRecord(...)`. This only centralizes the identical unknown-value narrowing and leaves accepted payload shapes unchanged.
- Verification passed:
  - `npm.cmd run verify:electron-ai-review-daily-run-inspect-ipc-module`
  - `npm.cmd run verify:electron-ai-review-backfill-ipc-module`
  - `npm.cmd run verify:electron-ai-review-weekly-report-ipc-module`
  - `npm.cmd run verify:electron-ai-review-monthly-report-ipc-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `npm.cmd run verify:cleanup-core`
  - `git -C .. diff --check -- app/electron/aiReviewTaskPayload.ts app/electron/unknownValueGuards.ts app/scripts/verify-electron-ai-review-daily-run-inspect-ipc-module.ts`

## 2026-07-13 - Phase 401 Shared AI Review object-record guard reuse
- Rechecked the four shared AI Review consumers and their focused verifiers twice before editing; their hashes were stable. All have the same shared-layer dependency direction to `shared/unknownValueGuards.ts`.
- Updated focused verification first to require `isObjectRecord(...)` imports and reject local `isObject(...)` predicates. RED was observed in `verify:recognize-template` because its shared-guard import did not yet exist.
- Migrated `recognizeTemplate.ts`, `recognizeReportTemplate.ts`, `sourceMaterials.ts`, and `sectionConfigNormalization.ts`. A focused run exposed one missed `arr.every(isObject)` call in the pre-existing concurrent recognition hardening; root-cause inspection isolated it, and it was changed to `arr.every(isObjectRecord)`.
- Focused verification passed:
  - `npm.cmd run verify:recognize-template`
  - `npm.cmd run verify:recognize-report`
  - `npm.cmd run verify:source-materials`
  - `npm.cmd run verify:section-config`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git -C .. diff --check -- app/shared/aiReview/recognizeTemplate.ts app/shared/aiReview/recognizeReportTemplate.ts app/shared/aiReview/sourceMaterials.ts app/shared/aiReview/sectionConfigNormalization.ts app/scripts/verify-recognize-template.ts app/scripts/verify-recognize-report.ts app/scripts/verify-source-materials.ts app/scripts/verify-section-config.ts`
- `npm.cmd run verify:cleanup-core` started successfully but currently stops in the unrelated `verify:task-persistence` assertion. The actual carryover-ledger parse/apply owner is now `src/hooks/useTaskBusinessDateEffects.ts`; the stale assertion still searches `src/hooks/useTaskLifecycleEffects.ts`. No task-persistence files were edited in this phase.

## 2026-07-13 - Phase 402 Shared Obsidian object-record guard reuse
- Rechecked `obsidianTemplateRecognition.ts`, `obsidianTemplateCenter.ts`, `obsidianCompanion.ts`, and their focused verifiers twice before editing; all were hash-stable despite the concurrent worktree.
- Updated the focused verifiers first to require `isObjectRecord(...)` imports from `shared/unknownValueGuards.ts` and reject duplicate local `isObject(...)` predicates. A verifier-local duplicate `recognitionSource` declaration was fixed before RED; RED was then observed for the intended missing shared import.
- Migrated template-recognition JSON parsing/fallbacks, template-center module normalization, and Companion settings/rules/capture/sync result narrowing to the shared guard without changing accepted shapes.
- Verification passed:
  - `npm.cmd run verify:obsidian-template-recognition`
  - `npm.cmd run verify:obsidian-template-center`
  - `npm.cmd run verify:app-companion-actions-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `npm.cmd run verify:task-persistence`
  - `npm.cmd run verify:cleanup-core`
  - `git -C .. diff --check -- app/shared/obsidianTemplateRecognition.ts app/shared/obsidianTemplateCenter.ts app/shared/obsidianCompanion.ts app/scripts/verify-obsidian-template-recognition.ts app/scripts/verify-obsidian-template-center.ts app/scripts/verify-app-companion-actions-module.ts`

## 2026-07-13 - Phase 403 Shared app-settings object-record guard reuse
- Reviewed `shared/appSettings.ts` after the shared guard foundation was in place. It has the same shared-layer dependency direction and an identical object-record predicate, so it can reuse `shared/unknownValueGuards.ts` without crossing layer boundaries.
- Updated `verify-completion-review-settings` first. RED was observed because `appSettings.ts` lacked the shared import. After migration, an existing structural assertion failed because App has since been reduced to a shell entrypoint; root-cause tracing confirmed the settings now flow through `useAppShellComposition.ts` into `appCompletionActions.ts`, so the verifier was calibrated to the actual ownership path.
- Preserved settings defaults, malformed persisted-value fallback, and both main-task/subtask completion-review decisions.
- Verification passed:
  - `npm.cmd run verify:completion-review-settings`
  - `npm.cmd run verify:obsidian-template-center`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `npm.cmd run verify:cleanup-core`
  - `git diff --check -- shared/appSettings.ts shared/unknownValueGuards.ts scripts/verify-completion-review-settings.ts task_plan.md progress.md`

## 2026-07-13 - Phase 404 Task-payload object-record guard reuse
- Reviewed `src/hooks/taskTransforms.ts`; it already depends on `shared/taskRollover.ts`, so importing `shared/unknownValueGuards.ts` retains the existing renderer-to-shared dependency direction.
- Updated `verify-task-hook-state` first. RED was observed because the task validator still declared local `isObject(...)`.
- Migrated recursive task and completion-review runtime validation to `isObjectRecord(...)`, preserving persisted-value rejection and normalization behavior.
- Verification passed:
  - `npm.cmd run verify:task-hook-state`
  - `npm.cmd run verify:task-persistence`
  - `npm.cmd run verify:task-carryover`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/hooks/taskTransforms.ts scripts/verify-task-hook-state.ts shared/unknownValueGuards.ts`
- `npm.cmd run verify:cleanup-core` began successfully but later stopped in `verify:task-persistence` because it expects a separate `src/hooks/useTaskInitializationEffects.ts` module that does not exist in the current stable working tree. This is outside the guard migration; no persistence owner was restored or changed.

## 2026-07-13 - Phase 405 Renderer task-menu object-record guard reuse
- Reviewed `src/app/taskMenuActions.ts`; it already depends on shared code through the renderer boundary and validates untrusted popup IPC payloads, so importing `shared/unknownValueGuards.ts` retains the existing dependency direction.
- Updated the focused verifier first. RED was observed because the renderer helper still had a local `isObjectRecord(...)` declaration.
- Migrated task-menu payload and updates-object narrowing to the shared guard, preserving malformed-payload `noop`, add-subtask text coercion, edit nonce handling, and popup action listener routing.
- Verification passed:
  - `npm.cmd run verify:app-task-menu-actions-module`
  - `npm.cmd run verify:app-runtime-effects-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/app/taskMenuActions.ts scripts/verify-app-task-menu-actions-module.ts shared/unknownValueGuards.ts`

## 2026-07-13 - Phase 406 Electron task-menu object-record guard reuse
- Reviewed `electron/taskContextMenuIpc.ts`; it validates runtime popup IPC inputs and has an identical local predicate while the Electron layer already supplies `electron/unknownValueGuards.ts`.
- Updated its focused verifier first. RED was observed because the IPC module did not yet import the Electron guard.
- Migrated popup-open and action-payload narrowing to `isObjectRecord(...)`, preserving malformed-payload rejection, finite resize validation, bounds clamping, and forwarding of valid actions.
- Verification passed:
  - `npm.cmd run verify:electron-task-context-menu-ipc-module`
  - `npm.cmd run verify:context-menu`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- electron/taskContextMenuIpc.ts electron/unknownValueGuards.ts scripts/verify-electron-task-context-menu-ipc-module.ts`
- Follow-up duplicate-guard scan finds only the intentional shared generic guard, the LLM response parser's exported provider-domain guard, and verifier text checks; no production-local duplicate object-record predicate remains.

## 2026-07-13 - Phase 398 task persistence initialization extraction
- Updated `scripts/verify-task-persistence.ts` first to require `src/hooks/taskPersistenceInitialization.ts`, initialization-owner exports, and facade compatibility re-exports.
- RED observed as expected: `npm.cmd run verify:task-persistence` failed because the initialization module did not exist.
- Added `src/hooks/taskPersistenceInitialization.ts` for stored-value parsing, retained-review validation, task-order parsing, carryover-ledger handling, and `loadInitialTaskState()`.
- Reduced `src/hooks/taskPersistence.ts` to generic debounced task-tree persistence plus stable re-exports for initialization and task UI persistence APIs.
- Calibrated `scripts/verify-task-list-interactions.ts` so its manual-order storage assertion reads the initialization owner after the extraction while retaining the `useTasks` state assertion.
- Verification passed:
  - `npm.cmd run verify:task-list-interactions`
  - `npm.cmd run verify:task-persistence`
  - `npm.cmd run verify:task-hook-state`
  - `npm.cmd run verify:task-carryover`
  - `npm.cmd run typecheck`
  - `npm.cmd run verify:cleanup-core`
  - `npm.cmd run build`
  - `git diff --check -- src/hooks/taskPersistence.ts src/hooks/taskPersistenceInitialization.ts scripts/verify-task-persistence.ts scripts/verify-task-list-interactions.ts`

## 2026-07-13 - Phase 399 task business-date effects extraction
- Updated `scripts/verify-task-hook-state.ts` first to require `src/hooks/useTaskBusinessDateEffects.ts` and composition from `useTaskLifecycleEffects.ts`.
- The first RED attempt exposed a missing `existsSync` import in the verifier; after correcting that verifier prerequisite, RED was observed as expected because the focused hook did not exist.
- Added `src/hooks/useTaskBusinessDateEffects.ts` for the rollover interval/timer, selected-date transition, carryover-ledger parsing, carryover mutation, and idempotent ledger writeback.
- Removed that business-date workflow from `src/hooks/useTaskLifecycleEffects.ts`, which remains the composition layer for other task lifecycle concerns.
- Task persistence verification exposed two stale location assertions for carryover behavior. Updated them to inspect the business-date owner rather than reintroducing the behavior into the facade.
- Verification passed:
  - `npm.cmd run verify:task-hook-state`
  - `npm.cmd run verify:task-carryover`
  - `npm.cmd run verify:task-persistence`
  - `npm.cmd run verify:task-obsidian-sync`
  - `npm.cmd run typecheck`
  - `npm.cmd run verify:cleanup-core`
  - `npm.cmd run build`
  - `git diff --check -- src/hooks/useTaskLifecycleEffects.ts src/hooks/useTaskBusinessDateEffects.ts scripts/verify-task-hook-state.ts scripts/verify-task-persistence.ts`

## 2026-07-13 - Phase 403 task-tree persistence and broadcast effects extraction
- Updated the task lifecycle structural checks first and observed the expected RED because `src/hooks/useTaskTreePersistenceEffects.ts` did not yet exist.
- Added `src/hooks/useTaskTreePersistenceEffects.ts` for deferred task-tree persistence, Store-loaded baseline priming, cleanup flushing, `onTasksChanged` subscription, structural equality protection, and stale-write suppression after an external task update.
- Kept the startup condition in `useTaskLifecycleEffects.ts`: a pristine loaded task tree primes the persistence baseline, while a normalized or carryover-changed tree remains eligible for its needed writeback.
- Verification passed:
  - `npm.cmd run verify:task-obsidian-sync`
  - `npm.cmd run verify:task-hook-state`
  - `npm.cmd run verify:task-persistence`
  - `npm.cmd run verify:task-carryover`
  - `npm.cmd run typecheck`
  - `npm.cmd run verify:cleanup-core`
  - `npm.cmd run build`
  - `git diff --check -- src/hooks/useTaskLifecycleEffects.ts src/hooks/useTaskTreePersistenceEffects.ts scripts/verify-task-obsidian-sync.ts scripts/verify-task-hook-state.ts scripts/verify-task-persistence.ts`

## 2026-07-13 - Phase 404 task startup initialization effects extraction
- Updated `scripts/verify-task-persistence.ts` first to require `src/hooks/useTaskInitializationEffects.ts`, assert startup ownership there, and require composition from `useTaskLifecycleEffects.ts`.
- RED observed as expected: `npm.cmd run verify:task-persistence` failed because the startup initialization hook did not yet exist.
- Added `src/hooks/useTaskInitializationEffects.ts` for asynchronous Store loading, state hydration, initial sync status selection, conditional carryover-ledger writeback, task-tree baseline priming, UI-state baseline priming, and the final `setIsLoaded(true)` transition.
- Reduced `src/hooks/useTaskLifecycleEffects.ts` to lifecycle composition and the existing post-load UI-state persistence effect.
- Verification passed:
  - `npm.cmd run verify:task-persistence`
  - `npm.cmd run verify:task-hook-state`
  - `npm.cmd run verify:task-obsidian-sync`
  - `npm.cmd run typecheck`
  - `npm.cmd run verify:task-carryover`
  - `npm.cmd run verify:cleanup-core`
  - `npm.cmd run build`
  - `git diff --check -- src/hooks/useTaskLifecycleEffects.ts src/hooks/useTaskInitializationEffects.ts scripts/verify-task-persistence.ts task_plan.md findings.md progress.md`

## 2026-07-13 - Phase 405 Obsidian daily-note rendering extraction
- Updated `scripts/verify-daily-template-markers.ts` first to require a dedicated `shared/obsidianDailyNoteRendering.ts` module, facade delegation, renderer ownership of daily content/template functions, and absence of those definitions in the facade.
- RED was observed as expected because the dedicated renderer module did not exist.
- Added `shared/obsidianDailyNoteRendering.ts` for managed daily-note blocks, default note assembly, custom template rendering, token replacement, and missing-block fallback insertion.
- Reduced `shared/obsidianTemplates.ts` to path resolution, managed-block utilities, sync preview construction, compatibility task-line exports, and renderer re-exports.
- Verification passed:
  - `npm.cmd run verify:daily-template-markers`
  - `npm.cmd run verify:daily-review-blocks`
  - `npm.cmd run verify:electron-obsidian-daily-note-content-module`
  - `npm.cmd run verify:electron-obsidian-sync-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run verify:cleanup-core`
  - `npm.cmd run build`
  - `git diff --check -- shared/obsidianTemplates.ts shared/obsidianDailyNoteRendering.ts scripts/verify-daily-template-markers.ts`

## 2026-07-13 - Phase 406 large-file rescan
- Scanned Git-tracked production `.ts`, `.tsx`, `.js`, and `.jsx` files while excluding scripts and generated output.
- No remaining production file meets the established 300-line large-file threshold.
- Largest remaining TypeScript/TSX modules: `electron/main.ts` (235), `src/components/TaskItem.tsx` (230), `shared/obsidianTemplateRecognition.ts` (228), and `src/hooks/useTasks.ts` (209).
- Reviewed the leading candidates: `TaskItem.tsx` is already presentation composition over extracted task-item helpers; `useTasks.ts` is an intentional state/action composition boundary over lifecycle, selector, mutation, persistence, and ordering modules; `main.js` is a legacy standalone entrypoint and is outside the Electron TypeScript modularization surface.

## 2026-07-13 - Phase 407 TaskItem editing lifecycle extraction
- Extended `scripts/verify-task-item-editing-helper.ts` first to require a dedicated `useTaskItemEditing.ts` lifecycle hook and composition from `TaskItem.tsx`.
- RED was observed as expected because the lifecycle hook module did not exist.
- Added `src/components/taskItem/useTaskItemEditing.ts` for external edit-trigger activation, edit-text state, submitted-text normalization, keyboard action routing, cancel reset, and completed-task edit protection.
- Updated `TaskItem.tsx` to compose the hook while retaining card-level propagation control immediately before edit start.
- The initial typecheck exposed a root-cause-confirmed missing React `KeyboardEvent` type import still used by the cluster keyboard handler; restored only that type import.
- Verification passed:
  - `npm.cmd run verify:task-item-editing-helper`
  - `npm.cmd run verify:task-item-interactions-helper`
  - `npm.cmd run verify:task-item-virtual-subtasks-hook`
  - `npm.cmd run verify:task-item-subtask-card-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run verify:cleanup-core`
  - `npm.cmd run build`
  - `git diff --check -- src/components/TaskItem.tsx src/components/taskItem/useTaskItemEditing.ts scripts/verify-task-item-editing-helper.ts scripts/verify-task-item-interactions-helper.ts`

## 2026-07-13 - Phase 408 LLM response metadata boundary extraction
- Extended `scripts/verify-openai-client.ts` first to require a dedicated `shared/llm/llmProviderResponseMetadata.ts` boundary and to keep chat response parsing independent from AI review usage types.
- RED was observed as expected because the metadata module did not exist.
- Added `shared/llm/llmProviderResponseMetadata.ts` for OpenAI/Anthropic/Gemini token usage, usage-only SSE detection, and model-list readers.
- Kept `shared/llm/llmProviderResponseParsing.ts` as the compatibility surface for existing consumers while limiting it to unknown-safe SSE and provider text-response parsing.
- Verification passed:
  - `npm.cmd run verify:openai-client`
  - `npm.cmd run verify:task-persistence`
  - `npm.cmd run typecheck`
  - `npm.cmd run verify:cleanup-core`
  - `npm.cmd run build`
  - `git diff --check -- shared/llm/llmProviderResponseParsing.ts shared/llm/llmProviderResponseMetadata.ts scripts/verify-openai-client.ts`

## 2026-07-13 - Phase 409 DailyWorkPanel resize lifecycle extraction
- Extended the cleanup suite with `scripts/verify-daily-work-panel-resize-hook.ts` and `verify:daily-work-panel-resize-hook`; RED was observed because `src/components/dailyWorkPanel/useDailyWorkPanelResize.ts` did not exist.
- Added `useDailyWorkPanelResize` for the original 64px start height, 56px/480px clamp, textarea-height fallback, pointermove/pointerup registration, and cleanup. `DailyWorkPanel.tsx` now only composes the hook and retains the editor/menu UI.
- The first focused pass passed daily command and markdown editor verification. `verify:rc-ui` then exposed a stale assertion expecting selected-date command flow in `App.tsx`; it was recalibrated to `useAppShellComposition.ts` and `appTaskView.ts` after confirming the current data path.
- `verify:ui-feedback-regressions` subsequently exposed three stale ownership assertions: window persistence is composed in `mainWindowComposition.ts`, real AI progress fallback is owned by `useAiReviewGeneration.ts`, and main-content prop assembly is owned by `useAppShellComposition.ts` plus `appShellMainContentComposition.tsx`. All checks were updated to their active owners without changing runtime behavior.
- Verification passed:
  - `npm.cmd run verify:daily-work-panel-resize-hook`
  - `npm.cmd run verify:daily-command`
  - `npm.cmd run verify:markdown-editor`
  - `npm.cmd run verify:rc-ui`
  - `npm.cmd run verify:ui-feedback-regressions`
  - `npm.cmd run typecheck`
  - `npm.cmd run verify:cleanup-core`
  - `npm.cmd run build`
  - `git diff --check -- src/components/DailyWorkPanel.tsx src/components/dailyWorkPanel/useDailyWorkPanelResize.ts scripts/verify-daily-work-panel-resize-hook.ts scripts/verify-cleanup-core.ts scripts/verify-rc-ui-regressions.ts scripts/verify-ui-feedback-regressions.ts package.json`

## 2026-07-13 - Phase 410 DailyWorkPanel command menu hook extraction
- Added `scripts/verify-daily-work-panel-commands-hook.ts` and confirmed RED with `npm.cmd run verify:daily-work-panel-commands-hook`; it failed because `useDailyWorkPanelCommands.ts` did not exist.
- Extracted the command-menu state and event routing into `src/components/dailyWorkPanel/useDailyWorkPanelCommands.ts`. The panel still owns task markdown creation, textarea selection access, and editor commits.
- Added `verify:daily-work-panel-commands-hook` to `package.json` and `verify:cleanup-core`.
- Focused GREEN verification passed:
  - `npm.cmd run verify:daily-work-panel-commands-hook`
  - `npm.cmd run verify:daily-command`
  - `npm.cmd run verify:markdown-editor`
  - `npm.cmd run typecheck`
  - `git diff --check -- src/components/DailyWorkPanel.tsx src/components/dailyWorkPanel/useDailyWorkPanelCommands.ts scripts/verify-daily-work-panel-commands-hook.ts scripts/verify-cleanup-core.ts package.json`
- Aggregate verification passed:
  - `npm.cmd run verify:cleanup-core`
  - `npm.cmd run build`
  - `git diff --check -- src/components/DailyWorkPanel.tsx src/components/dailyWorkPanel/useDailyWorkPanelCommands.ts scripts/verify-daily-work-panel-commands-hook.ts scripts/verify-cleanup-core.ts package.json task_plan.md findings.md progress.md`

## 2026-07-13 - Phase 409 persisted UI-state boundary narrowing
- Extended `scripts/verify-app-ui-state-persistence-module.ts` first to require `isObjectRecord(...)` from `shared/unknownValueGuards.ts` and reject assertion-based Store-value narrowing.
- RED was observed as expected because `appUiStatePersistence.ts` used `value as Record<string, unknown>`.
- Reused `isObjectRecord(...)` for persisted Store values and replaced recursive comparison access with `Object.getOwnPropertyDescriptor(...).value`, preserving malformed-value fallback and own-property equality semantics.
- Verification passed:
  - `npm.cmd run verify:app-ui-state-persistence-module`
  - `npm.cmd run verify:app-personalization-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/app/appUiStatePersistence.ts scripts/verify-app-ui-state-persistence-module.ts`

## 2026-07-13 - Phase 410 Obsidian template settings equality narrowing
- Extended `scripts/verify-template-source-settings.ts` first to reject assertion-based `Record<string, unknown>` access in recursive template-settings equality.
- RED was observed as expected because the equality helper narrowed `right` with an assertion before reading its property.
- Replaced that access with `Object.getOwnPropertyDescriptor(right, key)?.value`, retaining the existing own-property precondition and recursive comparison behavior.
- Verification passed:
  - `npm.cmd run verify:template-source-settings`
  - `npm.cmd run verify:obsidian-template-center`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- shared/obsidianTemplateSettings.ts scripts/verify-template-source-settings.ts`

## 2026-07-13 - Phase 411 Obsidian Companion settings boundary narrowing
- Extended `scripts/verify-app-companion-actions-module.ts` first to require shared object-record guard reuse and assertion-free recursive equality in `shared/obsidianCompanionDefaults.ts`.
- RED was observed as expected because Companion defaults retained a local `isRecord(...)` guard and a `right as Record<string, unknown>` comparison read.
- Reused `isObjectRecord(...)` from `shared/unknownValueGuards.ts` and replaced the equality read with `Object.getOwnPropertyDescriptor(right, key)?.value`.
- Verification passed:
  - `npm.cmd run verify:app-companion-actions-module`
  - `npm.cmd run verify:app-startup-settings-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- shared/obsidianCompanionDefaults.ts scripts/verify-app-companion-actions-module.ts`

## 2026-07-13 - Phase 412 AI Review deferred persistence equality narrowing
- Extended `scripts/verify-ai-review-settings-persistence.ts` first to reject assertion-based record access in the recursive deferred-persistence comparator.
- The package did not expose this focused verifier as an npm script, so its RED and GREEN runs used `npx.cmd tsx scripts/verify-ai-review-settings-persistence.ts` directly.
- RED was observed as expected because the comparator stored `right as Record<string, unknown>` before reading matching keys.
- Replaced that read with `Object.getOwnPropertyDescriptor(right, key)?.value`, preserving the preceding own-property check and debounce behavior.
- Verification passed:
  - `npx.cmd tsx scripts/verify-ai-review-settings-persistence.ts`
  - `npm.cmd run verify:settings-ai-review-module`
  - `npm.cmd run verify:settings-ai-review-section`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/components/settings/aiReviewSettingsPersistence.ts scripts/verify-ai-review-settings-persistence.ts`

## 2026-07-13 - Phase 413 task and Electron Store boundary narrowing
- Extended the focused Electron settings IPC and task hook-state verifiers first to reject `Record<string, unknown>` assertions at their runtime boundaries.
- RED was observed as expected: Electron batched entries used an assertion after manual object checking, and task-tree equality used two record assertions.
- Reused Electron `isObjectRecord(...)` for `store:setMany`, preserving the sender-excluded task broadcast; rewrote task-tree equality with `Object.entries`, `Object.values`, and own-property descriptor reads to retain undefined-field omission without JSON serialization.
- Verification passed:
  - `npm.cmd run verify:electron-settings-ipc-module`
  - `npm.cmd run verify:task-hook-state`
  - `npm.cmd run verify:task-persistence`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- electron/settingsIpc.ts src/hooks/taskHookState.ts scripts/verify-electron-settings-ipc-module.ts scripts/verify-task-hook-state.ts`

## 2026-07-13 - Phase 414 shared template compatibility guard reuse
- Extended `scripts/verify-daily-template-markers.ts` first to require `shared/obsidianTemplateCompat.ts` to import and use `isObjectRecord(...)` from the shared unknown-value guards.
- RED was observed because the compatibility module retained a local `isRecord(...)` helper.
- Replaced that duplicate guard while retaining its template compatibility, managed-marker, and unknown-value behavior.
- Verification passed:
  - `npm.cmd run verify:daily-template-markers`
  - `npm.cmd run verify:daily-review-blocks`
  - `npm.cmd run verify:electron-obsidian-daily-note-content-module`
  - `npm.cmd run typecheck`
  - `git diff --check -- shared/obsidianTemplateCompat.ts scripts/verify-daily-template-markers.ts`

## 2026-07-13 - Phase 415 task persistence object guard consolidation
- Extended `scripts/verify-task-persistence.ts` first to require task UI-state persistence and startup parsing to reuse `isObjectRecord(...)`, reject local `isRecord(...)` helpers, and use an own-property descriptor for recursive UI-state comparison.
- RED was observed because both task persistence modules kept local object guards.
- Reused the shared guard in the persisted UI-state and startup Store parsing paths. The equality check now reads the already-confirmed own right-side property through `Object.getOwnPropertyDescriptor(...).value`.
- Verification passed:
  - `npm.cmd run verify:task-persistence`
  - `npm.cmd run verify:task-list-interactions`
  - `npm.cmd run verify:task-hook-state`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/hooks/taskUiStatePersistence.ts src/hooks/taskPersistenceInitialization.ts scripts/verify-task-persistence.ts`

## 2026-07-13 - Phase 411 TitleBar more-menu hook extraction
- Added `scripts/verify-title-bar-more-menu-hook.ts` and confirmed RED with `npm.cmd run verify:title-bar-more-menu-hook`; it failed because `src/components/useTitleBarMoreMenu.ts` did not exist.
- Added `src/components/useTitleBarMoreMenu.ts` for more-menu open state, the guarded outside-click pointer listener, listener cleanup, menu toggle, and reset-position closure.
- Updated `TitleBar.tsx` to compose `{ moreOpen, toggleMoreMenu, resetPosition }`, retaining all titlebar button and menu presentation JSX.
- Recalibrated stale ownership checks in `scripts/verify-rc-ui-regressions.ts` and `scripts/verify-electron-window-ipc-module.ts` after the DailyWorkPanel command and TitleBar menu lifecycles moved into dedicated hooks.
- Added `verify:title-bar-more-menu-hook` to `package.json` and `verify:cleanup-core`.
- Verification passed:
  - `npm.cmd run verify:title-bar-more-menu-hook`
  - `npm.cmd run verify:rc-ui`
  - `npm.cmd run verify:electron-window-ipc-module`
  - `npm.cmd run verify:ui-feedback-regressions`
  - `npm.cmd run typecheck`
  - `npm.cmd run verify:cleanup-core`
  - `npm.cmd run build`

## 2026-07-13 - Phase 416 optimization baseline revalidation
- Ran `npm.cmd run verify:cleanup-core` to completion after confirming the concurrent TitleBar more-menu extraction had moved its pointer-target guard into `useTitleBarMoreMenu.ts`; the aggregate verifier passed.
- Current production-source scan results:
  - no `.ts` / `.tsx` production file over 300 lines;
  - no `as Record<string, unknown>` occurrence;
  - no production `any` / `as any` occurrence.
- Remaining duplicate object-record guard candidates are limited to `electron/aiReviewTemplateToolsIpc.ts`, `src/utils/taskOrderPersistence.ts`, `src/app/personalizationSettings.ts`, and `src/components/TaskMenuPopup.tsx`; each needs boundary-specific review before alteration.

## 2026-07-13 - Phase 417 remaining object guard consolidation
- Extended the four focused verifiers first to require shared object-record guard reuse in task ordering persistence, personalization settings, task-menu URL payload parsing, and AI Review template-tools IPC.
- RED was observed before the production changes because each target retained a local object guard.
- Reused `shared/unknownValueGuards.ts` in the renderer modules and `electron/unknownValueGuards.ts` in Electron. URL payload parsing keeps its structural task validation, while the AI Review model-list IPC path now rejects array-shaped configuration and uses the default named-field configuration instead.
- Verification passed:
  - `npm.cmd run verify:task-ordering-state`
  - `npm.cmd run verify:app-personalization-module`
  - `npm.cmd run verify:context-menu`
  - `npm.cmd run verify:electron-ai-review-template-tools-ipc-module`
  - `npm.cmd run verify:task-persistence`
  - `npm.cmd run verify:openai-client`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - scoped `git diff --check` for the Phase 417 production modules and verifiers

## 2026-07-13 - Phase 418 AI Review object guard reuse
- Extended `scripts/verify-ai-settings.ts` and `scripts/verify-section-config.ts` first to require AI profile and section normalization to import the shared `isObjectRecord(...)` predicate and reject duplicate local `isObject(...)` helpers.
- RED was observed as expected because both AI Review modules retained equivalent local guards.
- Reused `shared/unknownValueGuards.ts` in both modules. Their normalized profiles and review sections keep the same malformed-value fallback and reject arrays as before.
- Verification passed:
  - `npm.cmd run verify:ai-settings`
  - `npm.cmd run verify:section-config`
  - `npm.cmd run verify:electron-ai-review-settings-sections-ipc-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- shared/aiReview/aiReviewProfiles.ts shared/aiReview/sectionConfig.ts scripts/verify-ai-settings.ts scripts/verify-section-config.ts`

## 2026-07-13 - Phase 419 task-list conditional source grouping
- Extended `scripts/verify-task-list-dnd-module.ts` first to require `getTaskListDerivations(...)` to return no source groups for an all-personal list, while retaining tag history and the false grouping flag.
- RED was observed because the derivation always created a personal source group even though static and DnD render paths ignore it whenever grouping is disabled.
- Deferred source-group `Map` allocation until the first external task. Personal tasks are kept in insertion order until then, transferred once if needed, and all later sources continue through the same linear grouping path.
- Verification passed:
  - `npm.cmd run verify:task-list-dnd-module`
  - `npm.cmd run verify:task-list-interactions`
  - `npm.cmd run verify:task-ordering-state`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/components/taskList/taskListDerivations.ts scripts/verify-task-list-dnd-module.ts`

## 2026-07-13 - Phase 418 PriorityPicker popover hook extraction
- Extended `scripts/verify-priority-picker-popover-hook.ts` first and observed RED because the focused lifecycle Hook did not yet exist.
- Added `src/components/priorityPicker/usePriorityPickerPopover.ts` for popover state, positioning, outside click, resize/scroll listeners, RAF coalescing, and cleanup.
- Rewired `PriorityPicker.tsx` to compose the Hook while preserving portal presentation and priority change-only callback behavior; recalibrated `verify-task-item-subtask-card-module.ts` to inspect lifecycle mechanics at the Hook boundary.
- Fresh verification passed:
  - `npm.cmd run verify:priority-picker-popover-hook`
  - `npm.cmd run verify:task-item-subtask-card-module`
  - `npm.cmd run verify:task-list-interactions`
  - `npm.cmd run typecheck`
  - `npm.cmd run verify:cleanup-core`
  - `npm.cmd run build`
  - scoped `git diff --check` for the Phase 418 files

## 2026-07-13 - Phase 419 DateNavigator calendar lifecycle hook extraction
- Extended `scripts/verify-date-navigator-module.ts` first and observed RED because `useDateNavigatorCalendar` did not exist.
- Added `src/components/dateNavigator/useDateNavigatorCalendar.ts` for calendar open state, visible-month synchronization, outside-click handling, and close/toggle actions.
- Rewired `DateNavigator.tsx` to compose the Hook while retaining date-stepper behavior, return-to-today month reset, and lazy MonthCalendar presentation.
- Fresh verification passed:
  - `npm.cmd run verify:date-navigator-module`
  - `npm.cmd run verify:date-key-reuse`
  - `npm.cmd run verify:app-top-content-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run verify:cleanup-core`
  - `npm.cmd run build`
  - scoped `git diff --check` for the Phase 419 files

## 2026-07-13 - Phase 420 TaskMenuPopup lifecycle hook extraction
- Extended `scripts/verify-context-menu.ts` first and observed RED because `src/components/taskMenuPopup/useTaskMenuPopupLifecycle.ts` did not exist.
- Added the lifecycle hook for pane state, content-height reporting, ResizeObserver/RAF cleanup, and Escape-key navigation.
- Rewired `TaskMenuPopup.tsx` to compose the hook while retaining URL payload parsing, theme CSS variables, action dispatch, and pane presentation.
- Fresh verification passed:
  - `npm.cmd run verify:context-menu`
  - `npm.cmd run typecheck`
  - `npm.cmd run verify:cleanup-core`
  - `npm.cmd run build`
  - scoped `git diff --check` for the Phase 420 files

## 2026-07-13 - Phase 421 TaskCompletionDialog form hook extraction
- Added `scripts/verify-task-completion-dialog-form-hook.ts` first and observed RED because the form hook did not exist.
- Added `src/components/taskCompletionDialog/useTaskCompletionDialogForm.ts` for form resets, completion status/percent transitions, field state, and trimmed save payload construction.
- Rewired `TaskCompletionDialog.tsx` to compose the hook while retaining modal layout and Markdown-enabled textarea presentation.
- Focused verification passed:
  - `npm.cmd run verify:task-completion-dialog-form-hook`
  - `npm.cmd run verify:ui-feedback-regressions`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
- `npm.cmd run verify:cleanup-core` started successfully but stopped in the current `verify:task-list-interactions` selected-date-order assertion before reaching the new dialog hook verifier. This is outside the dialog extraction scope; no task selector files were changed in this phase.

## 2026-07-13 - Phase 422 task view source-order reuse
- Extended `scripts/verify-task-list-interactions.ts` first and observed RED because `selectTaskViewState(...)` independently normalized selected-date source order for display sorting and its returned state.
- Updated `sortTasksForDisplay(...)` to accept a caller-provided normalized source order with the existing standalone fallback, then calculated `sourceOrderForSelectedDate` once in `taskSelectors.ts` and reused it for sorting and the returned state.
- Verification passed:
  - `npm.cmd run verify:task-list-interactions`
  - `npm.cmd run verify:task-ordering-state`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/hooks/taskSelectors.ts src/utils/taskDisplayOrdering.ts scripts/verify-task-list-interactions.ts`

## 2026-07-13 - Phase 423 Header completion celebration hook extraction
- Added `scripts/verify-header-completion-celebration-hook.ts` first and observed RED because `src/components/header/useCompletionCelebration.ts` did not exist.
- Added the focused hook for previous completion count tracking, all-task completion transition detection, lazy `canvas-confetti` loading, and the unchanged celebration payload.
- Rewired `Header.tsx` to compose the hook while preserving date formatting, summary values, controls, and progress presentation; updated the App top-content verifier to follow the new boundary.
- Fresh verification passed:
  - `npm.cmd run verify:header-completion-celebration-hook`
  - `npm.cmd run verify:app-top-content-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run verify:cleanup-core`
  - `npm.cmd run build`
  - `git diff --check -- src/components/Header.tsx src/components/header/useCompletionCelebration.ts scripts/verify-header-completion-celebration-hook.ts scripts/verify-app-top-content-module.ts scripts/verify-cleanup-core.ts package.json`

## 2026-07-13 - Phase 424 task carryover candidate reuse
- Extended `scripts/verify-task-carryover.ts` first and observed RED because the carryover flow allocated `inheritedTasks` after collecting candidates.
- Replaced that intermediate filter with one direct traversal of `candidateTasks` that skips already-present target-date carryovers while building both carryover tasks and ledger IDs.
- Preserved the existing complete target-date index before candidate construction, so unordered persisted data remains protected from duplicate carryovers.
- Fresh verification passed:
  - `npm.cmd run verify:task-carryover`
  - `npm.cmd run verify:task-hook-state`
  - `npm.cmd run verify:task-persistence`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/hooks/taskCarryover.ts scripts/verify-task-carryover.ts`

## 2026-07-13 - Phase 425 task normalization structural sharing
- Extended `scripts/verify-task-hook-state.ts` first and observed RED because canonical tasks and subtasks were recreated while normalization added unchanged `undefined` fields.
- Updated `normalizeTask(...)` to reuse canonical scheduled-date arrays and recursively reuse unchanged subtask trees; the task itself now retains its reference when all normalized values and canonical fields are already present.
- Legacy stored tasks still receive canonical fields, latest completion-review selection remains unchanged, and a parent-only scheduled-date normalization retains unchanged child references.
- Fresh verification passed:
  - `npm.cmd run verify:task-hook-state`
  - `npm.cmd run verify:task-carryover`
  - `npm.cmd run verify:task-persistence`
  - `npx.cmd tsx scripts/verify-task-scheduled-dates-contract.ts`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/hooks/taskTransforms.ts scripts/verify-task-hook-state.ts`

## 2026-07-13 - Phase 426 TaskItem parent action controls extraction
- Added `scripts/verify-task-item-action-controls-module.ts` first and observed RED because the focused action-controls module did not exist.
- Extracted `ReviewActionButton`, `CompleteActionButton`, `DeleteActionButton`, and `TaskActionLayer` to `src/components/taskItem/taskItemActionControls.tsx`; `TaskItem.tsx` remains the composition owner and `taskItemControls.tsx` retains main content/edit/drag presentation.
- Recalibrated TaskItem checks to inspect the action-controls module. One stale completion-icon assertion in `verify-task-list-interactions` was repointed from the old controls module before the final regression pass.
- Fresh verification passed:
  - `npm.cmd run verify:task-item-action-controls-module`
  - `npm.cmd run verify:task-item-subtask-card-module`
  - `npm.cmd run verify:task-action-alignment`
  - `npm.cmd run verify:task-layout-unified-glass`
  - `npm.cmd run verify:task-list-dnd-module`
  - `npm.cmd run verify:task-list-interactions`
  - `npm.cmd run typecheck`
  - `npm.cmd run verify:cleanup-core`
  - `npm.cmd run build`
  - scoped `git diff --check` for the Phase 426 files

## 2026-07-13 - Phase 427 TitleBar primary actions presentation extraction
- Added `scripts/verify-title-bar-primary-actions-module.ts` first and observed RED because `src/components/titleBar/TitleBarPrimaryActions.tsx` did not exist.
- Extracted pin, position-lock, and settings button presentation into `TitleBarPrimaryActions`, retaining their exact selected markers, active style, icon variants, localized labels, and Framer Motion hover/tap settings.
- Kept `TitleBar.tsx` as the stateful composition owner for window-mode synchronization, optimistic visual state, handler logic, more-menu lifecycle, and desktop window controls.
- Fresh verification passed:
  - `npm.cmd run verify:title-bar-primary-actions-module`
  - `npm.cmd run verify:title-bar-more-menu-hook`
  - `npm.cmd run typecheck`
  - `npm.cmd run verify:cleanup-core`
  - `npm.cmd run build`
  - scoped `git diff --check` for the Phase 427 files

## 2026-07-13 - Phase 426 business-date task list reuse
- Extended `scripts/verify-task-carryover.ts` first and observed RED because `applyBusinessDateCarryover(...)` always used `.map(...)`, creating a new top-level task list even after every task normalized to its original reference.
- Replaced the unconditional mapping with a lazy-copy traversal that copies the list only after the first changed normalized task.
- No-op business-date checks now preserve both the original task-list and carryover-ledger references while keeping carryover selection and ordering unchanged.
- Fresh verification passed:
  - `npm.cmd run verify:task-carryover`
  - `npm.cmd run verify:task-hook-state`
  - `npm.cmd run verify:task-persistence`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/hooks/taskCarryover.ts scripts/verify-task-carryover.ts`

## 2026-07-13 - Phase 427 cross-date Obsidian review filtering
- Extended `scripts/verify-daily-template-markers.ts` first and observed RED because task-line rendering sorted all completion reviews before filtering records for an older daily note.
- Updated `getVisibleCompletionReviews(...)` to reuse raw single-review inputs, sort same-date review lists only when necessary, and scan cross-date review records before allocating or sorting matching results.
- Cross-date tasks with no matching reviews now reuse a shared empty result while chronological output for matching reviews remains unchanged.
- Fresh verification passed:
  - `npm.cmd run verify:daily-template-markers`
  - `npx.cmd tsx scripts/verify-subtask-obsidian-sync.ts`
  - `npm.cmd run verify:settings-sync`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- shared/obsidianTemplateTaskLines.ts scripts/verify-daily-template-markers.ts`
- `npm.cmd run verify:review-fields` currently fails before this path at its existing assertion that `TaskCompletionDialog` uses the shared completion-review status guard; this phase did not modify that component or verifier target.

## 2026-07-13 - Phase 428 default task source-order reuse
- Extended `scripts/verify-task-ordering-state.ts` first and observed RED because `getSourceOrderForDate(...)` always allocated a merged array even when there was no saved source order.
- Updated `getSourceOrderForDate(...)` to return the stable `DEFAULT_SOURCE_ORDER` reference for missing, empty, or fully invalid saved source orders; valid custom orders still receive validation and default-source completion.
- Fresh verification passed:
  - `npm.cmd run verify:task-ordering-state`
  - `npm.cmd run verify:task-list-interactions`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/utils/taskDisplayOrdering.ts scripts/verify-task-ordering-state.ts`

## 2026-07-13 - Phase 429 persisted default source-order reuse
- Extended `scripts/verify-task-ordering-state.ts` first and observed RED because a valid persisted source order identical to the default still returned a newly allocated normalized array.
- Updated `getSourceOrderForDate(...)` to reuse `DEFAULT_SOURCE_ORDER` whenever a saved source order validates and normalizes to that default sequence.
- Fresh verification passed:
  - `npm.cmd run verify:task-ordering-state`
  - `npm.cmd run verify:task-list-interactions`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/utils/taskDisplayOrdering.ts scripts/verify-task-ordering-state.ts`

## 2026-07-13 - Phase 430 Obsidian template modules section extraction
- Added `scripts/verify-obsidian-template-modules-section.ts` first and observed RED because `src/components/obsidianTemplateCenter/ObsidianTemplateModulesSection.tsx` did not exist.
- Extracted the template-module configuration list to `ObsidianTemplateModulesSection`, preserving canonical module traversal, fixed module enforcement, checkbox/title updates, classes, and localized labels.
- Updated `ObsidianTemplateCenter.tsx` to compose the section while retaining template-center state, presets, AI recognition/import, advanced blocks, preview, and reset wiring.
- Recalibrated `verify-obsidian-template-ui.ts` so module-update ownership is asserted at the extracted section boundary.
- Fresh verification passed:
  - `npm.cmd run verify:obsidian-template-modules-section`
  - `npm.cmd run verify:obsidian-template-ui`
  - `npm.cmd run verify:electron-obsidian-ipc-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run verify:cleanup-core`
  - `npm.cmd run build`
  - scoped `git diff --check` for the Phase 430 files

## 2026-07-13 - Phase 430 Obsidian legacy review comparison reuse
- Extended `scripts/verify-task-obsidian-sync.ts` first and observed RED because each legacy singleton completion review was wrapped in a new one-element array during recursive sync-input equivalence checks.
- Replaced wrapper-array comparison with a shared field-level single-review comparison helper, reused by the list comparison path.
- Fresh verification passed:
  - `npm.cmd run verify:task-obsidian-sync`
  - `npm.cmd run verify:settings-sync`
  - `npx.cmd tsx scripts/verify-subtask-obsidian-sync.ts`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/hooks/taskObsidianSync.ts scripts/verify-task-obsidian-sync.ts`

## 2026-07-13 - Phase 431 Obsidian Companion rules section extraction
- Added `scripts/verify-obsidian-companion-rules-section.ts` first and observed RED because `src/components/obsidianCompanion/ObsidianCompanionRulesSection.tsx` did not exist.
- Extracted Companion rules presentation and immutable updates to `ObsidianCompanionRulesSection`, preserving each rule field, write-mode narrowing, class names, and controlled input behavior.
- Updated `ObsidianCompanionPanel.tsx` to compose the section and refreshed `electron/obsidianCompanion.verify.ts` so it follows write-mode validation to the new owner.
- The first combined all-verification command timed out at the shell limit, so focused verification and aggregate gates were rerun separately with sufficient timeouts.
- Fresh verification passed:
  - `npm.cmd run verify:obsidian-companion-rules-section`
  - `npm.cmd run verify:companion`
  - `npm.cmd run verify:app-overlay-stack-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run verify:cleanup-core`
  - `npm.cmd run build`
  - scoped `git diff --check` for the Phase 431 files

## 2026-07-13 - Phase 431 static task-row render isolation
- Extended `scripts/verify-task-list-dnd-module.ts` first and observed RED because the static list renderer created fresh task action callbacks and reran every `TaskItem` whenever its parent list rendered.
- Added a memoized `StaticTaskItem` row that receives stable list callbacks and binds each task ID inside the row, allowing structurally shared unchanged tasks to retain their React render boundary.
- Fresh verification passed:
  - `npm.cmd run verify:task-list-dnd-module`
  - `npm.cmd run verify:task-list-interactions`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/components/taskList/TaskListStaticContent.tsx scripts/verify-task-list-dnd-module.ts`

## 2026-07-13 - Phase 432 task-tree recursive allocation reduction
- Audited `mapTaskTree(...)` and `removeTaskFromTree(...)` before changing them. Existing verification requires deletion of every matching duplicate ID, including nested duplicates, so search short-circuiting would be a behavior change and was not applied.
- Extended `scripts/verify-task-mutations.ts` first and observed RED because both recursive paths allocated an IIFE for every task with subtasks.
- Replaced those IIFEs with direct local branching while retaining the same recursive traversal and structural-sharing conditions.
- Fresh verification passed:
  - `npm.cmd run verify:task-mutations`
  - `npm.cmd run verify:task-hook-state`
  - `npm.cmd run verify:task-persistence`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/hooks/taskTransforms.ts scripts/verify-task-mutations.ts`

## 2026-07-13 - Phase 433 Obsidian Companion templates section extraction
- Added `scripts/verify-obsidian-companion-templates-section.ts` first and observed RED because `src/components/obsidianCompanion/ObsidianCompanionTemplatesSection.tsx` did not exist.
- Extracted the editable Companion template list to `ObsidianCompanionTemplatesSection`, preserving template traversal, immutable template-body updates, controlled textarea behavior, and the existing class names.
- Updated `ObsidianCompanionPanel.tsx` to compose the section and registered its structural verifier in the package scripts and aggregate cleanup verification.
- Fresh verification passed:
  - `npm.cmd run verify:obsidian-companion-templates-section`
  - `npm.cmd run verify:companion`
  - `npm.cmd run verify:app-overlay-stack-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run verify:cleanup-core`
  - `npm.cmd run build`

## 2026-07-13 - Phase 433 UI persistence equality allocation reduction
- Audited the high-frequency UI persistence effect and found equality checks created two `Object.entries(...)` arrays at every visited object level, including no-op note and navigation effects.
- Extended `scripts/verify-task-persistence.ts` first and observed RED because the equality helper still allocated both entry arrays.
- Replaced entry-array comparison with allocation-free own-key traversal plus a right-side own-key count, retaining recursive equality and descriptor-based reads from the comparison target.
- Fresh verification passed:
  - `npm.cmd run verify:task-persistence`
  - `npm.cmd run verify:task-hook-state`
  - `npm.cmd run verify:task-ordering-state`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/hooks/taskUiStatePersistence.ts scripts/verify-task-persistence.ts`

## 2026-07-13 - Phase 434 personal task display sort fast path
- Audited view derivation and display sorting. Selectors already combine filters, counts, scheduled-date matching, and date collection in one task traversal; the common all-personal display sort still built source-grouping `Set`, `Map`, source list, and result arrays.
- Extended `scripts/verify-task-list-interactions.ts` first and observed RED because no all-personal default-order bypass existed.
- Added a narrow sort fast path for visible tasks that all resolve to the personal source when no personal manual order applies. The result preserves the existing completion-first, priority-second ordering; external tasks and manual ordering continue through the original source-grouped logic.
- Fresh verification passed:
  - `npm.cmd run verify:task-list-interactions`
  - `npm.cmd run verify:task-ordering-state`
  - `npm.cmd run verify:task-list-dnd-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/utils/taskDisplayOrdering.ts scripts/verify-task-list-interactions.ts`

## 2026-07-13 - Phase 435 task-order deletion structural sharing
- Extended `scripts/verify-task-ordering-state.ts` first and observed RED because deleting an ID rebuilt unrelated date-order objects.
- Added a per-date cleaning helper that returns `null` when a date order is unchanged, so the top-level order map is copied only after the first actual cleanup and unaffected date references remain stable.
- Preserved removal from every valid source bucket, malformed persisted-order cleanup, empty-date removal, and the existing missing-ID no-op reference behavior.
- Fresh verification passed:
  - `npm.cmd run verify:task-ordering-state`
  - `npm.cmd run verify:task-list-interactions`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/utils/taskOrdering.ts scripts/verify-task-ordering-state.ts`

## 2026-07-13 - Phase 436 task-order deletion no-op allocation reduction
- Extended `scripts/verify-task-ordering-state.ts` first and observed RED because each untouched date still allocated filtered source and task-ID arrays while checking for deletion.
- Split persisted date-order cleanup into an allocation-free detection pass followed by rebuilding only for dates that need stale-ID removal or malformed-state cleanup.
- Preserved all Phase 435 structural sharing guarantees and existing malformed persistence behavior.
- Fresh verification passed:
  - `npm.cmd run verify:task-ordering-state`
  - `npm.cmd run verify:task-list-interactions`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/utils/taskOrdering.ts scripts/verify-task-ordering-state.ts`

## 2026-07-13 - Phase 437 source-order read allocation reduction
- Extended `scripts/verify-task-ordering-state.ts` first and observed RED because normalizing a saved source order always created filtered and merged arrays before checking whether the order was already valid.
- Replaced this with direct source scanning: default order still reuses its shared reference, valid complete custom order reuses the persisted array, and only incomplete or invalid data creates a normalized replacement.
- Preserved invalid-source filtering, missing-source completion, task display grouping, and drag-order consumers.
- Fresh verification passed:
  - `npm.cmd run verify:task-ordering-state`
  - `npm.cmd run verify:task-list-interactions`
  - `npm.cmd run verify:task-list-dnd-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/utils/taskDisplayOrdering.ts scripts/verify-task-ordering-state.ts`

## 2026-07-13 - Phase 438 task command bucket merge reduction
- Extended `scripts/verify-task-list-interactions.ts` first and observed RED because task-view command buckets were merged through `Array.prototype.flat()` after the shared traversal.
- Replaced the flatten call with direct ordered bucket appends, retaining the existing open high/medium/low then completed high/medium/low command ordering.
- Preserved selected-date command membership, filtered display tasks, count derivation, and the single task traversal.
- Fresh verification passed:
  - `npm.cmd run verify:task-list-interactions`
  - `npm.cmd run verify:task-hook-state`
  - `npm.cmd run verify:task-list-dnd-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/hooks/taskSelectors.ts scripts/verify-task-list-interactions.ts`

## 2026-07-13 - Phase 439 App root presentation memoization
- Extended the theme-state and viewport-style verifiers first and observed RED because `App` recreated theme state and the CSS-variable object during every root render.
- Memoized theme-state derivation by personalization reference, then memoized the viewport style object from personalization plus invisible-theme state.
- Preserved preset matching, invisible-theme opacity unification, runtime theme side effects, and the existing root markup.
- Fresh verification passed:
  - `npm.cmd run verify:app-theme-state-module`
  - `npm.cmd run verify:app-viewport-style-module`
  - `npm.cmd run verify:task-list-interactions`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/App.tsx scripts/verify-app-theme-state-module.ts scripts/verify-app-viewport-style-module.ts`

## 2026-07-13 - Phase 440 review grouping direct task bucketing
- Added `scripts/verify-review-grouping-state.ts` first and observed RED because review records were first collected by date, sorted as full date buckets, then regrouped by task.
- Replaced the intermediate date record arrays with nested date/task maps. Each task's records sort in place once, then groups retain their existing newest-first ordering.
- Preserved date descending order, task-group descending order, review timestamp descending order, and fallback completed-task records with no review.
- Fresh verification passed:
  - `npm.cmd run verify:review-grouping-state`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git -c safe.directory=G:/Personal-AI/DailyTodo diff --check -- src/components/reviewView/reviewGrouping.ts scripts/verify-review-empty-fields.ts scripts/verify-review-grouping-state.ts package.json`
- `npm.cmd run verify:review-fields` still fails before its grouping assertions on the pre-existing TaskCompletionDialog shared status-guard requirement; this phase did not alter that component.

## 2026-07-13 - Phase 441 completion dialog status boundary guard
- Reproduced `npm.cmd run verify:review-fields` failing because `TaskCompletionDialog` passed its raw `<select>` value into the form hook while the sibling review editor already narrowed DOM strings with `isTaskCompletionReviewStatus`.
- Added the shared guard at the dialog's DOM event boundary and retained the form hook guard as defense in depth, preserving all status and percent adjustment behavior.
- Fresh verification passed:
  - `npm.cmd run verify:review-fields`
  - `npm.cmd run verify:review-grouping-state`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git -c safe.directory=G:/Personal-AI/DailyTodo diff --check -- src/components/TaskCompletionDialog.tsx src/components/reviewView/reviewGrouping.ts scripts/verify-review-empty-fields.ts scripts/verify-review-grouping-state.ts package.json`

## 2026-07-13 - Phase 436 app UI persistence equality allocation reduction
- Extended `scripts/verify-app-ui-state-persistence-module.ts` first and observed RED because `areStoreValuesEqual(...)` allocated `Object.entries(left)` for every compared object.
- Replaced entry-array comparison with own-key count and traversal loops in `src/app/appUiStatePersistence.ts`, retaining recursive equality and descriptor-based right-side value reads.
- `npm.cmd run verify:task-ordering-state` passed when rerun independently after an earlier aggregate run reported its structural-sharing assertion. A subsequent `npm.cmd run verify:cleanup-core` exceeded the 120-second execution limit, so it is not counted as a passing aggregate gate.
- Fresh verification passed:
  - `npm.cmd run verify:app-ui-state-persistence-module`
  - `npm.cmd run verify:app-runtime-effects-module`
  - `npm.cmd run verify:task-ordering-state`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`

## 2026-07-13 - Phase 437 task-menu date and tag pane extraction
- Extended `scripts/verify-context-menu.ts` first and observed RED because focused date and tag pane modules did not exist.
- Extracted date selection and tag editing into `TaskMenuPopupDatePane.tsx` and `TaskMenuPopupTagPane.tsx`, then reduced `TaskMenuPopupPanes.tsx` to main-menu and subtask presentation. Added `TaskMenuPopupPaneHeader.tsx` to share the back-navigation header without duplicating SVG markup.
- Preserved popup dispatch contracts, quick-date and custom-date behavior, scheduled-date chip removal, tag suggestion filtering, keyboard actions, and the `TaskMenuPopup` `getTagSuggestions` re-export.
- Fresh verification passed:
  - `npm.cmd run verify:context-menu`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/components/TaskMenuPopup.tsx src/components/taskMenuPopup/TaskMenuPopupPanes.tsx src/components/taskMenuPopup/TaskMenuPopupDatePane.tsx src/components/taskMenuPopup/TaskMenuPopupTagPane.tsx src/components/taskMenuPopup/TaskMenuPopupPaneHeader.tsx scripts/verify-context-menu.ts`

## 2026-07-13 - Phase 440 app shell input assembly extraction
- Extended `scripts/verify-app-shell-composition-module.ts` first and observed RED because the pure `appShellCompositionInputs.ts` module did not exist.
- Extracted the final shell-options mapping into `src/app/appShellCompositionInputs.ts`. The runtime hook retains all existing `useMemo` action boundaries and derived values, then calls `createAppShellComposition(createAppShellCompositionInputs(...))`.
- Updated affected structural verifiers to keep asserting the same action, template, personalization, review-state, and complete-calendar-task data flows at the pure factory boundary.
- Fresh verification passed:
  - `npm.cmd run verify:app-shell-composition-module`
  - `npm.cmd run verify:app-runtime-effects-module`
  - `npm.cmd run verify:app-completion-actions-module`
  - `npm.cmd run verify:app-review-dialog-state-module`
  - `npm.cmd run verify:app-ui-actions-module`
  - `npm.cmd run verify:app-modal-actions-module`
  - `npm.cmd run verify:app-template-editor-module`
  - `npm.cmd run verify:app-task-view-module`
  - `npm.cmd run verify:app-personalization-module`
  - `npm.cmd run verify:app-top-content-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - scoped `git diff --check`
## 2026-07-13 - Phase 442 Obsidian template import presentation extraction
- Extended `scripts/verify-obsidian-template-ui.ts` first and observed RED because `ObsidianTemplateImportSection.tsx` did not exist.
- Extracted the AI template import and recognized-draft preview into `src/components/obsidianTemplateCenter/ObsidianTemplateImportSection.tsx`. `ObsidianTemplateCenter.tsx` now composes it with the unchanged state-hook outputs.
- Restored the adjacent preset and module sections after an initial ASCII-boundary replacement was too broad; the final component preserves all four template-center regions.
- Fresh verification passed: `verify:obsidian-template-ui`, `verify:obsidian-template-recognition`, `verify:obsidian-template-modules-section`, `typecheck`, `build`, and the scoped `git diff --check`.
## 2026-07-13 - Phase 443 task tree mutation utility extraction
- Extended `scripts/verify-task-mutations.ts` first and observed RED because `src/hooks/taskTree.ts` did not exist.
- Extracted the existing recursive immutable update and delete implementations into `src/hooks/taskTree.ts`, removed them from `taskTransforms.ts`, and changed `useTasks.ts` to import the focused utilities.
- Fresh verification passed:
  - `npm.cmd run verify:task-mutations`
  - `npm.cmd run verify:task-hook-state`
  - `npm.cmd run verify:task-list-interactions`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/hooks/taskTree.ts src/hooks/taskTransforms.ts src/hooks/useTasks.ts scripts/verify-task-mutations.ts`
## 2026-07-13 - Phase 444 markdown editor indentation utility extraction
- Extended `scripts/verify-markdown-editor.ts` first and observed RED because `src/utils/markdownEditorIndentation.ts` did not exist.
- Extracted the pure selected-line, indent, and outdent transforms into `src/utils/markdownEditorIndentation.ts`. `src/utils/markdownEditor.ts` retains the public editor types and re-exports the commands, alongside list continuation and selection wrapping.
- Fresh verification passed:
  - `npm.cmd run verify:markdown-editor`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/utils/markdownEditor.ts src/utils/markdownEditorIndentation.ts scripts/verify-markdown-editor.ts`
## 2026-07-13 - Phase 445 Obsidian completion-review visibility extraction
- Extended `scripts/verify-daily-template-markers.ts` first and observed RED because `shared/obsidianTemplateCompletionReviewVisibility.ts` did not exist.
- Extracted legacy-review fallback, date-visible review selection, chronological ordering, and streaming review visitation into `shared/obsidianTemplateCompletionReviewVisibility.ts`. The task-line module now composes that policy while retaining task-tree visibility and rendering ownership.
- One intermediate verifier run exposed stale source-file targets in structural assertions after the extraction; those assertions were corrected before the final verification run.
- Fresh verification passed:
  - `npm.cmd run verify:daily-template-markers`
  - `npm.cmd run verify:daily-markdown-template`
  - `npm.cmd run verify:template-file`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- shared/obsidianTemplateTaskLines.ts shared/obsidianTemplateCompletionReviewVisibility.ts scripts/verify-daily-template-markers.ts`

## 2026-07-13 - Phase 446 Obsidian template settings equality extraction
- Extended `scripts/verify-template-source-settings.ts` first and observed RED because `shared/obsidianTemplateSettingsEquality.ts` did not exist.
- Extracted `areSettingValuesEqual` into `shared/obsidianTemplateSettingsEquality.ts`; `shared/obsidianTemplateSettings.ts` retains `areObsidianTemplateSettingsEqual` as the typed public facade.
- Fresh verification passed:
  - `npm.cmd run verify:template-source-settings`
  - `npm.cmd run verify:daily-markdown-template`
  - `npm.cmd run verify:daily-template-markers`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- shared/obsidianTemplateSettings.ts shared/obsidianTemplateSettingsEquality.ts scripts/verify-template-source-settings.ts`

## 2026-07-13 - Phase 447 Obsidian daily template migration extraction
- Extended `scripts/verify-template-source-settings.ts` first and observed RED because `shared/obsidianTemplateSettingsDailyMigration.ts` did not exist.
- Extracted old daily Markdown placeholder migration into `shared/obsidianTemplateSettingsDailyMigration.ts`. `shared/obsidianTemplateSettings.ts` still owns setting defaults, path migration, report template normalization, and the typed public settings API.
- Fresh verification passed:
  - `npm.cmd run verify:template-source-settings`
  - `npm.cmd run verify:daily-markdown-template`
  - `npm.cmd run verify:daily-template-markers`
  - `npm.cmd run verify:template-file`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- shared/obsidianTemplateSettings.ts shared/obsidianTemplateSettingsDailyMigration.ts shared/obsidianTemplateSettingsEquality.ts scripts/verify-template-source-settings.ts`

## 2026-07-13 - Phase 448 Obsidian template settings path migration extraction
- Extended `scripts/verify-template-source-settings.ts` first and observed RED because `shared/obsidianTemplateSettingsPathMigration.ts` did not exist.
- Extracted stored-string reading, current/legacy path selection, and legacy report-directory migration into `shared/obsidianTemplateSettingsPathMigration.ts`. `shared/obsidianTemplateSettings.ts` continues to orchestrate field precedence and typed settings normalization.
- Fresh verification passed:
  - `npm.cmd run verify:template-source-settings`
  - `npm.cmd run verify:daily-markdown-template`
  - `npm.cmd run verify:daily-template-markers`
  - `npm.cmd run verify:template-file`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- shared/obsidianTemplateSettings.ts shared/obsidianTemplateSettingsPathMigration.ts shared/obsidianTemplateSettingsDailyMigration.ts shared/obsidianTemplateSettingsEquality.ts scripts/verify-template-source-settings.ts`

## 2026-07-13 - Phase 449 Obsidian template recognition result reader extraction
- Extended `scripts/verify-obsidian-template-recognition.ts` first and observed RED because `shared/obsidianTemplateRecognitionResultReaders.ts` did not exist.
- Extracted recognition IPC result validation and template-picker IPC result parsing into `shared/obsidianTemplateRecognitionResultReaders.ts`; `shared/obsidianTemplateRecognition.ts` now re-exports the existing public functions and result types.
- An initial focused verification found that prompt/draft parsing still requires `OBSIDIAN_TEMPLATE_MODULE_IDS`; restored that runtime import as the single minimal fix.
- Fresh verification passed:
  - `npm.cmd run verify:obsidian-template-recognition`
  - `npm.cmd run verify:obsidian-template-ui`
  - `npm.cmd run verify:template-file`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- shared/obsidianTemplateRecognition.ts shared/obsidianTemplateRecognitionResultReaders.ts scripts/verify-obsidian-template-recognition.ts`

## 2026-07-13 - Phase 450 Obsidian template task-line formatting extraction
- Extended `scripts/verify-daily-template-markers.ts` first and observed RED because `shared/obsidianTemplateTaskLineFormatting.ts` did not exist.
- Extracted task/review text escaping, tag and timestamp formatting, placeholder rendering, and completion-review template compilation into `shared/obsidianTemplateTaskLineFormatting.ts`; task-tree traversal remains in `shared/obsidianTemplateTaskLines.ts`.
- The first combined patch was rejected because concurrent file changes and a non-ASCII comment made its context stale; the subsequent smaller patches applied safely. An initial verification also exposed a stale structural assertion that still required the extracted compiler function to remain inline, so that assertion was removed.
- Two attempted package-script aliases did not exist in the current `package.json`; verification used the actual scripts `verify:review-fields` and `verify:task-obsidian-sync` instead.
- Fresh verification passed:
  - `npm.cmd run verify:daily-template-markers`
  - `npm.cmd run verify:review-fields`
  - `npm.cmd run verify:task-obsidian-sync`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- shared/obsidianTemplateTaskLines.ts shared/obsidianTemplateTaskLineFormatting.ts scripts/verify-daily-template-markers.ts`

## 2026-07-13 - Phase 451 Obsidian template module settings extraction
- Extended `scripts/verify-obsidian-template-center.ts` first and observed RED because `shared/obsidianTemplateModuleSettings.ts` did not exist.
- Extracted template module types, identifiers, labels, defaults, completion/task-line templates, presets, and normalization into `shared/obsidianTemplateModuleSettings.ts`. `shared/obsidianTemplateCenter.ts` now re-exports the static API and retains DailyTemplate mapping plus settings mutation behavior.
- The first combined edit was rejected because concurrent changes made the old source context stale. Re-read the target and applied the extraction in smaller patches. A stale guard-location assertion was then adjusted to inspect the new normalization owner.
- Fresh verification passed:
  - `npm.cmd run verify:obsidian-template-center`
  - `npm.cmd run verify:obsidian-template-recognition`
  - `npm.cmd run verify:obsidian-template-ui`
  - `npm.cmd run verify:obsidian-template-modules-section`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- shared/obsidianTemplateCenter.ts shared/obsidianTemplateModuleSettings.ts scripts/verify-obsidian-template-center.ts`

## 2026-07-13 - Phase 452 Obsidian Companion runtime validation extraction
- Added `scripts/verify-obsidian-companion-validation.ts` first and observed RED because `shared/obsidianCompanionValidation.ts` did not exist.
- Extracted capture/template/rule/sync-plan narrowing and sync/write/mobile-import IPC-result readers into `shared/obsidianCompanionValidation.ts`. `shared/obsidianCompanion.ts` retains stable shared contracts, `isWriteMode`, and explicit compatibility re-exports.
- `verify:app-companion-actions-module` initially failed because it still expected final action-field mapping in `useAppShellComposition.ts`. The mapping had already moved to `src/app/appShellCompositionInputs.ts`, so the verifier now checks the actual pure composition owner while retaining the hook memoization checks.
- Fresh focused verification passed:
  - `npm.cmd run verify:app-companion-actions-module`
  - `npx.cmd tsx scripts/verify-obsidian-companion-validation.ts`
  - `npm.cmd run verify:electron-companion-ipc-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- shared/obsidianCompanion.ts shared/obsidianCompanionValidation.ts scripts/verify-obsidian-companion-validation.ts scripts/verify-app-companion-actions-module.ts electron/obsidianCompanion.verify.ts`
- `npm.cmd run verify:companion` remains blocked before this phase's assertions by concurrent `electron/obsidianCompanionPlanning.ts` source containing `Object.entries(replacements).map(...)` and `new Map(...)`, which the existing aggregate verifier rejects. That file was not changed for this phase.

## 2026-07-13 - Phase 453 LLM model-list result reader extraction
- Scanned remaining tracked runtime files after Phase 452. Chose the low-coupling model-list IPC-result reader inside `shared/llm/openaiClient.ts` rather than splitting static prompt data, global UI persistence lifecycle state, or concurrently changing Electron modules.
- Intended boundary: the new reader will own untrusted `{ ok, models/error }` narrowing. `openaiClient.ts` will retain LLM contracts, transport/error composition, and the public compatibility export.
- Extended `scripts/verify-openai-client.ts` first and observed RED because `shared/llm/llmModelListResultReader.ts` did not exist.
- Extracted `ListModelsResult` and `readListModelsResult` into `shared/llm/llmModelListResultReader.ts`; `openaiClient.ts` explicitly re-exports both while retaining request transport composition and automatic provider fallback.
- A first combined patch was rejected because its context included a historical non-ASCII comment; no business code changed. Re-read the ASCII type/function boundary and applied the same extraction in a smaller patch.
- Fresh verification passed:
  - `npm.cmd run verify:openai-client`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- shared/llm/openaiClient.ts shared/llm/llmModelListResultReader.ts scripts/verify-openai-client.ts task_plan.md findings.md progress.md`

## 2026-07-13 - Phase 454 Floating scrollbar metrics extraction
- Scanned the active renderer candidates and chose `useFloatingScrollbar.ts`, whose pure geometry/drag calculation boundary is independent from the existing DOM lifecycle and observer scheduling.
- Added `scripts/verify-floating-scrollbar-metrics.ts` first and observed RED because `src/hooks/floatingScrollbarMetrics.ts` did not exist.
- Extracted `getFloatingScrollbarMetrics` and `getFloatingScrollbarScrollTop` into `src/hooks/floatingScrollbarMetrics.ts`; `useFloatingScrollbar.ts` retains DOM construction, event listeners, observers, request-animation-frame scheduling, visibility timing, and cleanup.
- The first GREEN run found two test-only arithmetic mistakes in the newly authored expected pointer-drag result. The implementation preserved the pre-existing formula; corrected the test inputs/expected output after tracing the `currentY - startY` calculation.
- Fresh verification passed:
  - `npx.cmd tsx scripts/verify-floating-scrollbar-metrics.ts`
  - `npm.cmd run verify:app-main-content-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/hooks/useFloatingScrollbar.ts src/hooks/floatingScrollbarMetrics.ts scripts/verify-floating-scrollbar-metrics.ts`

## 2026-07-13 - Phase 455 Theme preset matching extraction
- Added `scripts/verify-theme-preset-matching.ts` first and observed RED because `src/types/themePresetMatching.ts` did not exist.
- Extracted the pure preset candidate comparison into `src/types/themePresetMatching.ts`. `src/types/themePresets.ts` keeps `matchThemePreset` and delegates to the new module, preserving all existing callers.
- Focused verification passed:
  - `npx.cmd tsx scripts/verify-theme-preset-matching.ts`
  - `npm.cmd run verify:app-personalization-module`
  - `npm.cmd run verify:app-theme-state-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/types/themePresets.ts src/types/themePresetMatching.ts scripts/verify-theme-preset-matching.ts`
- Broader theme scripts were investigated but not altered: `verify:theme-no-blue` reads `src/styles/context-menu.css`, which concurrent work has deleted/moved; `verify:theme-visual-isolation` has a stale reset-action regex that omits the concurrent equality guard. These failures are unrelated to the matching extraction.

## 2026-07-13 - Phase 456 AI review prompt formatting extraction
- Added `scripts/verify-ai-review-prompt-formatting.ts` first and observed RED because `shared/aiReview/promptFormatting.ts` did not exist.
- Extracted deterministic daily-stat text, render-type instruction selection, and the custom-block fallback prompt into `shared/aiReview/promptFormatting.ts`. `shared/aiReview/promptBuilder.ts` remains the public message-building facade and delegates to the new module.
- Fresh verification passed:
  - `npx.cmd tsx scripts/verify-ai-review-prompt-formatting.ts`
  - `npm.cmd run verify:section-config`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- shared/aiReview/promptBuilder.ts shared/aiReview/promptFormatting.ts scripts/verify-ai-review-prompt-formatting.ts`

## 2026-07-13 - Phase 457 AI review default prompt catalog extraction
- Added `scripts/verify-ai-review-default-prompts.ts` first and observed RED because `shared/aiReview/defaultWeeklyPrompts.ts` and `shared/aiReview/defaultMonthlyPrompts.ts` did not exist.
- Moved the personal/external weekly templates into `shared/aiReview/defaultWeeklyPrompts.ts` and the personal/external monthly templates into `shared/aiReview/defaultMonthlyPrompts.ts`. `shared/aiReview/defaultPrompts.ts` now re-exports all four constants to preserve existing import paths.
- Fresh verification passed:
  - `npx.cmd tsx scripts/verify-ai-review-default-prompts.ts`
  - `npm.cmd run verify:ai-runner`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- shared/aiReview/defaultPrompts.ts shared/aiReview/defaultWeeklyPrompts.ts shared/aiReview/defaultMonthlyPrompts.ts scripts/verify-ai-review-default-prompts.ts`
- `npm.cmd run verify:ai-review-runner` was attempted first but does not exist in the current package scripts; the actual `verify:ai-runner` command above passed.

## 2026-07-13 - Phase 458 Report output formatting extraction
- Added `scripts/verify-report-output-formatting.ts` first and observed RED because `shared/reportOutputFormatting.ts` did not exist.
- Extracted `validateBlockOutput` into `shared/reportOutputFormatting.ts`, retaining list conversion plus table, Callout, and Dataview downgrade behavior. `shared/reportGenerator.ts` now explicitly re-exports the function while retaining work-slice selection and report-block prompt construction.
- Fresh verification passed:
  - `npx.cmd tsx scripts/verify-report-output-formatting.ts`
  - `npm.cmd run verify:export-reports`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- shared/reportGenerator.ts shared/reportOutputFormatting.ts scripts/verify-report-output-formatting.ts`

## 2026-07-13 - Phase 459 AI onboarding step presentation extraction
- Added `scripts/verify-ai-onboarding-steps.ts` first and observed RED because `src/components/aiOnboarding/AiOnboardingSteps.tsx` did not exist.
- Extracted the three conditional onboarding step bodies into `src/components/aiOnboarding/AiOnboardingSteps.tsx`. `AiOnboarding.tsx` retains draft state, parent-owned typed updates, modal layout/animation, navigation, and completion/skip decisions.
- Fresh verification passed:
  - `npx.cmd tsx scripts/verify-ai-onboarding-steps.ts`
  - `npm.cmd run verify:app-overlay-stack-module`
  - `npm.cmd run verify:app-modal-actions-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/components/AiOnboarding.tsx src/components/aiOnboarding/AiOnboardingSteps.tsx scripts/verify-ai-onboarding-steps.ts`

## 2026-07-13 - Phase 460 AI review report message composition extraction
- Added `scripts/verify-ai-review-report-message-composition.ts` first and observed RED because `shared/aiReview/reportMessageComposition.ts` did not exist.
- Extracted shared statistics and source-section composition into `shared/aiReview/reportMessageComposition.ts`. Weekly and monthly builders now pass their period/source labels while retaining their existing public APIs, defaults, period helpers, and source-selection policy.
- Fresh verification passed:
  - `npx.cmd tsx scripts/verify-ai-review-report-message-composition.ts`
  - `npm.cmd run verify:weekly`
  - `npm.cmd run verify:monthly`
  - `npm.cmd run verify:export-reports`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- shared/aiReview/weekly.ts shared/aiReview/monthly.ts shared/aiReview/reportMessageComposition.ts scripts/verify-ai-review-report-message-composition.ts`

## 2026-07-13 - Phase 461 light anonymization ownership extraction
- Added `scripts/verify-light-anonymization-module.ts` first and observed RED because `shared/lightAnonymization.ts` did not exist.
- Moved light anonymization into `shared/lightAnonymization.ts`; `shared/templateBlockDefaults.ts` now keeps the existing `lightAnonymize` API through a direct compatibility re-export.
- The focused verifier, `npm.cmd run typecheck`, `npm.cmd run build`, and scoped `git diff --check` passed.
- `npx.cmd tsx scripts/verify-template-hub-rewrite.ts` passed its anonymization sections after its compatibility assertion was updated, then failed at its unrelated stale `buildDailyNoteFromTemplate` assertion.

## 2026-07-13 - Phase 462 daily Markdown core-section rules extraction
- Added `scripts/verify-daily-markdown-core-sections.ts` first and observed RED because `shared/dailyMarkdownCoreSections.ts` did not exist.
- Moved core placeholder detection and ordered fallback-section assembly into `shared/dailyMarkdownCoreSections.ts`; `shared/dailyMarkdownTemplate.ts` retains token replacement, content normalization, and the public missing-token export.
- The first green pass exposed two type-boundary issues: an unused type import and a too-wide values record. Narrowed the render values to explicitly guarantee the three core fields.
- Verification passed:
  - `npx.cmd tsx scripts/verify-daily-markdown-core-sections.ts`
  - `npx.cmd tsx scripts/verify-daily-markdown-template.ts`
  - `npx.cmd tsx scripts/verify-unified-template-recognition.ts`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- shared/dailyMarkdownTemplate.ts shared/dailyMarkdownCoreSections.ts scripts/verify-daily-markdown-core-sections.ts`

## 2026-07-13 - Phase 463 AI Review template file parsing extraction
- Added `scripts/verify-ai-review-template-file-parsing.ts` first and observed RED because `shared/aiReview/templateFileParsing.ts` did not exist.
- Moved UTF-8 text decoding, injected DOCX extraction, and parse-error normalization into `shared/aiReview/templateFileParsing.ts`. `shared/aiReview/templateFile.ts` now retains extension metadata, `fileExt`, and direct compatibility exports for the parser and result type.
- Verification passed:
  - `npx.cmd tsx scripts/verify-ai-review-template-file-parsing.ts`
  - `npx.cmd tsx scripts/verify-template-file.ts`
  - `npx.cmd tsx scripts/verify-electron-ai-review-template-tools-ipc-module.ts`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- shared/aiReview/templateFile.ts shared/aiReview/templateFileParsing.ts scripts/verify-ai-review-template-file-parsing.ts`

## 2026-07-13 - Phase 464 AI Review schedule-time parsing extraction
- Added `scripts/verify-ai-review-schedule-time-parsing.ts` first and observed RED because `shared/aiReview/scheduleTimeParsing.ts` did not exist.
- Moved strict schedule-time parsing into `shared/aiReview/scheduleTimeParsing.ts`. `shared/aiReview/timer.ts` continues to own daily, weekly, and monthly next-run date calculations and supplies its pre-existing cadence-specific fallback times.
- Verification passed:
  - `npx.cmd tsx scripts/verify-ai-review-schedule-time-parsing.ts`
  - `npm.cmd run verify:ai-timer`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- shared/aiReview/timer.ts shared/aiReview/scheduleTimeParsing.ts scripts/verify-ai-review-schedule-time-parsing.ts`

## 2026-07-13 - Phase 465 Electron shared unknown-value guard consolidation
- Added `scripts/verify-electron-shared-unknown-value-guards.ts` first and observed RED because `electron/unknownValueGuards.ts` still defined its own guard instead of re-exporting the shared implementation.
- Replaced Electron's duplicate `isObjectRecord` body with a direct compatibility export from `shared/unknownValueGuards.ts`; Electron callers retain their current local import paths.
- Updated `scripts/verify-electron-obsidian-sync-module.ts` and `electron/obsidianCompanion.verify.ts` to validate the compatibility boundary instead of requiring duplicate function text.
- Verification passed:
  - `npx.cmd tsx scripts/verify-electron-shared-unknown-value-guards.ts`
  - `npm.cmd run verify:electron-obsidian-sync-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- electron/unknownValueGuards.ts scripts/verify-electron-shared-unknown-value-guards.ts scripts/verify-electron-obsidian-sync-module.ts electron/obsidianCompanion.verify.ts`
- `npx.cmd tsx electron/obsidianCompanion.verify.ts` passed the updated guard assertion, then failed at its unrelated existing capture-template allocation assertion.

## 2026-07-13 - Phase 466 shared schedule-time validation consolidation
- Added `scripts/verify-shared-schedule-time-validation.ts` first and observed RED because `scheduleTimeParsing.ts` did not expose `isScheduleTime`.
- Added `isScheduleTime` to the parsing module, updated `parseScheduleTime` to use the same predicate, and replaced the duplicated private `isTime` validators in app and AI-review settings normalization.
- The shared predicate accepts only strict `HH:mm` strings. Existing normalization fallbacks remain caller-owned and unchanged.
- Verification passed:
  - `npx.cmd tsx scripts/verify-shared-schedule-time-validation.ts`
  - `npx.cmd tsx scripts/verify-ai-review-schedule-time-parsing.ts`
  - `npm.cmd run verify:ai-settings`
  - `npm.cmd run verify:completion-review-settings`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- shared/aiReview/scheduleTimeParsing.ts shared/appSettings.ts shared/aiReview/aiReviewSettingsNormalization.ts scripts/verify-shared-schedule-time-validation.ts`

## 2026-07-13 - Next large-file boundary audit
- A combined PowerShell inspection command failed before reading files because a nested quote was unterminated. No source file was changed. Subsequent inspection will use separate commands with simpler quoting.

## 2026-07-13 - Phase 467 task action hook extraction
- Added `scripts/verify-task-actions-hook.ts` first and observed RED because `src/hooks/useTaskActions.ts` did not exist.
- Moved the action callback family out of `useTasks.ts` into `useTaskActions.ts`: app settings, daily notes, main tasks, reviews, subtasks, manual ordering, and clear-completed actions. The new hook takes explicit state/setter inputs and preserves the original return API.
- The first focused run revealed stale static checks that still inspected callback text in `useTasks.ts`; updated `verify-task-hook-state.ts` and `verify-task-list-interactions.ts` to inspect `useTaskActions.ts` while retaining their existing behavior assertions.
- Verification passed:
  - `npx.cmd tsx scripts/verify-task-actions-hook.ts`
  - `npm.cmd run verify:task-hook-state`
  - `npm.cmd run verify:task-list-interactions`
  - `npm.cmd run verify:task-persistence`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/hooks/useTasks.ts src/hooks/useTaskActions.ts scripts/verify-task-actions-hook.ts scripts/verify-task-hook-state.ts scripts/verify-task-list-interactions.ts`

## 2026-07-13 - Phase 468 daily AI content inspection extraction
- Added `scripts/verify-electron-ai-review-daily-content-inspection.ts` first and observed RED because `electron/aiReviewDailyContentInspection.ts` did not exist.
- Extracted the stable daily-note snapshot read, read-consistency guard, managed-content detection, and safe error shaping into `electron/aiReviewDailyContentInspection.ts`.
- Kept `aiReviewDailyRunner.ts` as the daily-review orchestration owner: it strips the internal snapshot for the public inspect API, preserves `读取日记失败` diagnostics, and passes the same inspected snapshot into `runReviewForFile`.
- Updated the stale daily runner/regeneration structural assertions to inspect the new module for file-read behavior, while retaining runner orchestration assertions.
- Added `verify:electron-ai-review-daily-content-inspection` and included it in `verify:cleanup-core`.
- Verification passed:
  - `npx.cmd tsx scripts/verify-electron-ai-review-daily-content-inspection.ts`
  - `npm.cmd run verify:electron-ai-review-daily-runner-module`
  - `npm.cmd run verify:ai-regenerate-detection`
  - `npx.cmd tsx scripts/verify-ai-regenerate-force.ts`
  - `npm.cmd run verify:ai-progress-ui`
  - `npm.cmd run verify:ai-run-diagnostics`
  - `npm.cmd run verify:electron-shared-types-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - scoped `git diff --check`
- `npm.cmd run verify:ai-regenerate-force` was unavailable because there is no matching package script; running its existing verifier directly passed.

## 2026-07-13 - Phase 469 App UI-state persistence snapshot extraction
- Added `scripts/verify-app-ui-state-persistence-snapshot.ts` first and observed RED because `src/app/appUiStatePersistenceSnapshot.ts` did not exist.
- Extracted UI-state store-entry construction and recursive own-key equality into `src/app/appUiStatePersistenceSnapshot.ts`.
- Kept `src/app/appUiStatePersistence.ts` as the hydration, compact-mode IPC, persistence debounce, and pending-write owner.
- Updated `scripts/verify-app-ui-state-persistence-module.ts` to check the extracted comparison/key policy in the snapshot module and composition in the persistence module.
- The first verification run revealed that `compactMode` is intentionally outside the snapshot input contract; removed that unused property from the persistence call site.
- Added `verify:app-ui-state-persistence-snapshot` and included it in `verify:cleanup-core`.
- Verification passed:
  - `npm.cmd run verify:app-ui-state-persistence-snapshot`
  - `npm.cmd run verify:app-ui-state-persistence-module`
  - `npm.cmd run verify:app-personalization-module`
  - `npm.cmd run verify:electron-window-ipc-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - scoped `git diff --check`

## 2026-07-13 - Phase 470 LLM client error-message policy extraction
- Added `scripts/verify-llm-client-error-messages.ts` first and observed RED because `shared/llm/llmClientErrorMessages.ts` did not exist.
- Extracted HTTP and streaming diagnostics, automatic-provider failure summaries, timeout messages, and model-list error formatting into `shared/llm/llmClientErrorMessages.ts`.
- Kept `shared/llm/openaiClient.ts` as the public validation and provider-candidate orchestration facade, and refreshed `scripts/verify-openai-client.ts` to validate the new policy boundary.
- Added `verify:llm-client-error-messages` and included it in `verify:cleanup-core`.
- Verification passed:
  - `npm.cmd run verify:llm-client-error-messages`
  - `npm.cmd run verify:openai-client`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- shared/llm/openaiClient.ts shared/llm/llmClientErrorMessages.ts scripts/verify-openai-client.ts scripts/verify-llm-client-error-messages.ts scripts/verify-cleanup-core.ts package.json`

## 2026-07-13 - Phase 471 Obsidian sync preview assembly extraction
- Added `scripts/verify-electron-obsidian-sync-preview-module.ts` first and observed RED because `electron/obsidianSyncPreview.ts` did not exist.
- Extracted read-only multi-date preview assembly into `electron/obsidianSyncPreview.ts`: it reads existing daily files, calls the shared preview builder, and aggregates preview totals in one traversal.
- Kept `electron/obsidianSync.ts` as the public vault/input gate and sync/preview orchestration facade. Updated the original sync structural verifier to check the new preview ownership.
- Added `verify:electron-obsidian-sync-preview-module` and included it in `verify:cleanup-core`.
- Verification passed:
  - `npm.cmd run verify:electron-obsidian-sync-preview-module`
  - `npm.cmd run verify:electron-obsidian-sync-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- electron/obsidianSync.ts electron/obsidianSyncPreview.ts scripts/verify-electron-obsidian-sync-module.ts scripts/verify-electron-obsidian-sync-preview-module.ts scripts/verify-cleanup-core.ts package.json`

## 2026-07-13 - Phase 472 Obsidian blog-draft assembly extraction
- Added `scripts/verify-electron-obsidian-blog-draft-module.ts` first and observed RED because `electron/obsidianBlogDraft.ts` did not exist.
- Extracted blog-draft front matter, localized Markdown body assembly, and selected-date task statistics into `electron/obsidianBlogDraft.ts`.
- Kept `electron/obsidianDailyNoteContent.ts` as the daily-template and legacy managed-block migration owner; it now composes the focused builder with its existing date, task, template, and localization dependencies.
- Added `verify:electron-obsidian-blog-draft-module` and included it in `verify:cleanup-core`.
- Verification passed:
  - `npm.cmd run verify:electron-obsidian-blog-draft-module`
  - `npm.cmd run verify:electron-obsidian-daily-note-content-module`
  - `npm.cmd run verify:electron-obsidian-sync-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- electron/obsidianDailyNoteContent.ts electron/obsidianBlogDraft.ts scripts/verify-electron-obsidian-blog-draft-module.ts scripts/verify-electron-obsidian-daily-note-content-module.ts scripts/verify-cleanup-core.ts package.json`

## 2026-07-13 - Phase 473 AI-review default-template catalog extraction
- Added `scripts/verify-section-config-default-templates.ts` first and observed RED because `shared/aiReview/sectionConfigDefaultTemplates.ts` did not exist.
- Extracted daily fixed/custom defaults, four report-template catalogs, and default block-order assembly into `sectionConfigDefaultTemplates.ts`.
- Kept `sectionConfig.ts` as the stable public facade through direct re-exports; runtime guards and normalization continue to depend on the facade without caller import migration.
- The first broad validation exposed an unused local re-export import; removed it and repeated the complete verification set.
- Verification passed:
  - `npm.cmd run verify:section-config-default-templates`
  - `npm.cmd run verify:section-config`
  - `npm.cmd run verify:app-template-editor-module`
  - `npm.cmd run verify:obsidian-template-center`
  - `npm.cmd run verify:section-overrides`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- shared/aiReview/sectionConfig.ts shared/aiReview/sectionConfigDefaultTemplates.ts scripts/verify-section-config-default-templates.ts scripts/verify-cleanup-core.ts package.json`

## 2026-07-13 - Phase 474 Obsidian managed-block sync policy extraction
- Added `scripts/verify-electron-obsidian-managed-block-sync.ts` first and observed RED because `electron/obsidianManagedBlockSync.ts` did not exist.
- Extracted task-sync timestamp preservation and managed-block no-op detection from `obsidianSyncDailyNote.ts` into `obsidianManagedBlockSync.ts`.
- Kept the daily-note sync helper as the owner of template selection, legacy migration, filesystem interaction, and write ordering; it supplies the existing `upsertMarkedBlock` dependency to the policy helper.
- Added `verify:electron-obsidian-managed-block-sync` and included it in `verify:cleanup-core`.
- Verification passed:
  - `npm.cmd run verify:electron-obsidian-managed-block-sync`
  - `npm.cmd run verify:electron-obsidian-sync-module`
  - `npm.cmd run verify:daily-template-markers`
  - `npm.cmd run verify:electron-obsidian-sync-preview-module`
  - `npm.cmd run verify:electron-obsidian-daily-note-content-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- electron/obsidianSyncDailyNote.ts electron/obsidianManagedBlockSync.ts scripts/verify-electron-obsidian-managed-block-sync.ts scripts/verify-electron-obsidian-sync-module.ts scripts/verify-cleanup-core.ts package.json`

## 2026-07-13 - Phase 475 AI-review template report execution extraction
- Added `scripts/verify-electron-ai-review-template-report-generation.ts` first and observed RED because `electron/aiReview/templateReportGeneration.ts` did not exist.
- Extracted the legacy single-call and template-block report execution flows from `exportReports.ts` into `templateReportGeneration.ts`.
- Updated the existing report verifier's structural checks to inspect the new execution owner while preserving the facade assertions for the three report entry points and external redaction.
- Added `verify:electron-ai-review-template-report-generation` and included it in `verify:cleanup-core`.
- Verification passed:
  - `npm.cmd run verify:electron-ai-review-template-report-generation`
  - `npm.cmd run verify:export-reports`
  - `npm.cmd run verify:electron-ai-review-weekly-report-ipc-module`
  - `npm.cmd run verify:electron-ai-review-external-report-ipc-module`
  - `npm.cmd run verify:electron-ai-review-report-ipc-execution-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- electron/aiReview/exportReports.ts electron/aiReview/templateReportGeneration.ts scripts/verify-export-reports.ts scripts/verify-electron-ai-review-template-report-generation.ts scripts/verify-cleanup-core.ts package.json`

## 2026-07-13 - Phase 476 Obsidian sync blog-draft output extraction
- Added `scripts/verify-electron-obsidian-sync-blog-draft-output.ts` first and observed RED because `electron/obsidianSyncBlogDraftOutput.ts` did not exist.
- Extracted the optional local blog-draft output into `obsidianSyncBlogDraftOutput.ts`, including directory/file guards, no-op write suppression, and the existing best-effort error boundary.
- Kept `obsidianSync.ts` as the sync orchestrator: it supplies the selected date, validated tasks, resulting note content, and existing draft builder dependency.
- Added `verify:electron-obsidian-sync-blog-draft-output` and included it in `verify:cleanup-core`.
- Verification passed:
  - `npm.cmd run verify:electron-obsidian-sync-blog-draft-output`
  - `npm.cmd run verify:electron-obsidian-sync-module`
  - `npm.cmd run verify:electron-obsidian-blog-draft-module`
  - `npm.cmd run verify:electron-obsidian-sync-preview-module`
  - `npm.cmd run verify:electron-obsidian-daily-note-content-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- electron/obsidianSync.ts electron/obsidianSyncBlogDraftOutput.ts scripts/verify-electron-obsidian-sync-blog-draft-output.ts scripts/verify-electron-obsidian-sync-module.ts scripts/verify-cleanup-core.ts package.json`

## 2026-07-13 - Phase 477 Obsidian Companion template/rule policy extraction
- Added `scripts/verify-electron-obsidian-companion-template-rules.ts` first and observed RED because `electron/obsidianCompanionTemplateRules.ts` did not exist.
- Extracted case-insensitive fixed-token rendering, date/time token formatting, and rule matching from `obsidianCompanionPlanning.ts` into `obsidianCompanionTemplateRules.ts`.
- Kept `obsidianCompanionPlanning.ts` as the validated planning and vault-bound target-resolution owner, preserving its existing compatibility exports.
- Updated stale Companion structural checks that still expected policy functions to be implemented in the planning module.
- Added `verify:electron-obsidian-companion-template-rules` and included it in `verify:cleanup-core`.
- Verification passed:
  - `npm.cmd run verify:electron-obsidian-companion-template-rules`
  - `npm.cmd run verify:electron-companion-ipc-module`
  - `npm.cmd exec tsx electron/obsidianCompanion.verify.ts`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- electron/obsidianCompanionPlanning.ts electron/obsidianCompanionTemplateRules.ts electron/obsidianCompanion.verify.ts scripts/verify-electron-obsidian-companion-template-rules.ts scripts/verify-electron-companion-ipc-module.ts scripts/verify-cleanup-core.ts package.json`

## 2026-07-13 - Phase 478 AI Review generation presentation extraction
- Added `scripts/verify-settings-ai-review-generation-presentation.ts` first and observed RED because `src/components/settings/AiReviewGenerationPresentation.tsx` did not exist.
- Extracted pure generation presentation policy from `AiReviewSettingsWidgets.tsx` into `AiReviewGenerationPresentation.tsx`: date helpers, result copy, staged progress percentages/display, `GenerationProgress`, `DiagnosticCard`, and initial/final progress events.
- Kept `AiReviewSettingsWidgets.tsx` as the account-management entry point and compatibility export path, preserving all existing consumers.
- The first migration attempt exposed tool-side historical-text encoding corruption that broke JSX/template syntax. Recovered the exact baseline Chinese text and reapplied the narrow extraction without changing behavior.
- Updated `verify-ai-progress-ui`, `verify-ai-run-diagnostics`, and `verify-settings-ai-review-module` to inspect the new presentation owner.
- Verification passed:
  - `npm.cmd run verify:settings-ai-review-generation-presentation`
  - `npm.cmd run verify:ai-progress-ui`
  - `npm.cmd run verify:ai-run-diagnostics`
  - `npm.cmd run verify:settings-ai-review-module`
  - `npm.cmd run verify:settings-ai-review-section`
  - `npm.cmd run verify:settings-ai-review-manual-generation-section`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/components/settings/AiReviewSettingsWidgets.tsx src/components/settings/AiReviewGenerationPresentation.tsx scripts/verify-settings-ai-review-generation-presentation.ts scripts/verify-ai-progress-ui.ts scripts/verify-ai-run-diagnostics.ts scripts/verify-settings-ai-review-module.ts scripts/verify-cleanup-core.ts package.json`

## 2026-07-13 - Phase 479 Task completion Markdown field extraction
- Added `scripts/verify-task-completion-dialog-markdown-field.ts` first and observed RED because `src/components/taskCompletionDialog/TaskCompletionMarkdownField.tsx` did not exist.
- Extracted the completion-dialog Markdown textarea lifecycle into `TaskCompletionMarkdownField.tsx`, including the shared Markdown editor hook, composition handling, keyboard routing, and undo/redo reset on task changes.
- Replaced all three completion review textareas with the focused field while keeping dialog form state and completion actions in `TaskCompletionDialog.tsx`.
- The first compilation pass exposed an intentionally temporary duplicate inline field; removed it. The existing form verifier then exposed a stale assertion that mistook the retained runtime status guard for an inline transition rule; narrowed the assertion to the removed cast-and-branch implementation.
- Verification passed:
  - `npm.cmd run verify:task-completion-dialog-markdown-field`
  - `npm.cmd run verify:task-completion-dialog-form-hook`
  - `npm.cmd run verify:markdown-editor`
  - `npm.cmd run verify:review-fields`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/components/TaskCompletionDialog.tsx src/components/taskCompletionDialog/TaskCompletionMarkdownField.tsx scripts/verify-task-completion-dialog-markdown-field.ts scripts/verify-task-completion-dialog-form-hook.ts scripts/verify-cleanup-core.ts package.json`

## 2026-07-13 - Phase 480 AI review block-filling extraction
- Added `scripts/verify-electron-ai-review-block-filling.ts` first and observed RED because `electron/aiReview/reviewBlockFilling.ts` did not exist.
- Extracted per-block discovery and fill policy from `electron/aiReview/runner.ts` into `reviewBlockFilling.ts`, including heading discovery that ignores nested managed blocks, freeze/skip decisions, deterministic carryover, response cleanup, and managed-block replacement.
- Kept the runner as the review-file orchestrator with the existing caller-provided snapshot support, daily stats calculation, ordered block execution, and atomic write boundary.
- Added `verify:electron-ai-review-block-filling` and included it in `verify:cleanup-core`.
- Verification passed:
  - `npm.cmd run verify:electron-ai-review-block-filling`
  - `npm.cmd run verify:ai-runner`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- electron/aiReview/runner.ts electron/aiReview/reviewBlockFilling.ts scripts/verify-electron-ai-review-block-filling.ts scripts/verify-cleanup-core.ts package.json`

## 2026-07-13 - Phase 481 LLM provider text-value extraction
- Added `scripts/verify-llm-provider-text-values.ts` first and observed RED because `shared/llm/llmProviderTextValues.ts` did not exist.
- Moved generic unknown-value to text normalization, segmented-content assembly, and whitespace-safe stream chunk selection out of `llmProviderResponseParsing.ts` into `llmProviderTextValues.ts`.
- Kept all provider-specific response fields, aggregation, and truncation policy in the response parser.
- The existing OpenAI verifier initially failed on a stale structural assertion that expected the text utilities inline; updated it to assert the focused owner and parser composition.
- Added `verify:llm-provider-text-values` and included it in `verify:cleanup-core`.
- Verification passed:
  - `npm.cmd run verify:llm-provider-text-values`
  - `npm.cmd run verify:openai-client`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- shared/llm/llmProviderResponseParsing.ts shared/llm/llmProviderTextValues.ts scripts/verify-llm-provider-text-values.ts scripts/verify-openai-client.ts scripts/verify-cleanup-core.ts package.json`

## 2026-07-13 - Phase 482 Obsidian template task-visibility extraction
- Added `scripts/verify-obsidian-template-task-visibility.ts` first and observed RED because `shared/obsidianTemplateTaskVisibility.ts` did not exist.
- Moved the existing visible task/review/date index and single-pass sync-preview statistics traversal out of `obsidianTemplateTaskLines.ts` into `obsidianTemplateTaskVisibility.ts`.
- Kept `buildTaskLines` in the task-line module and retained `collectVisibleTaskStats` through a compatibility re-export.
- Updated `verify-daily-template-markers.ts` to inspect the focused visibility owner, then added the new verifier to `package.json` and `verify:cleanup-core`.

## 2026-07-13 - Phase 483 Companion capture item builder extraction
- Added `scripts/verify-companion-capture-item-builder.ts` first and observed RED because `src/store/companionCaptureItems.ts` did not exist.
- Extracted pure desktop `CaptureItem` construction from `src/store/taskStore.ts` into `src/store/companionCaptureItems.ts`, including selected-date task filtering and daily work/inspiration note items.
- Kept `taskStore.ts` as the window/Electron facade and preserved `buildCaptureItems` through a compatibility re-export. Updated the existing Companion item and App composition structural verifiers to follow the focused owner.
- Added `verify:companion-capture-item-builder` and included it in `verify:cleanup-core`.
- Passed:
  - `npm.cmd run verify:companion-capture-item-builder`
  - `npx.cmd tsx scripts/verify-companion-capture-items.ts`
  - `npm.cmd run verify:app-companion-capture-module`
  - `npm.cmd run verify:task-core`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/store/taskStore.ts src/store/companionCaptureItems.ts scripts/verify-companion-capture-item-builder.ts scripts/verify-companion-capture-items.ts scripts/verify-app-companion-capture-module.ts scripts/verify-cleanup-core.ts package.json`
- The aggregate cleanup verifier remains expected to stop at the unrelated baseline context-menu assertion requiring `useTasks` to expose `addSubtask` directly.

## 2026-07-13 - Phase 484 App UI-state load snapshot extraction
- Added `scripts/verify-app-ui-state-load-snapshot.ts` first and observed RED because `src/app/appUiStateLoadSnapshot.ts` did not exist.
- Extracted batched Store-value parsing into `appUiStateLoadSnapshot.ts`: strict panel/search/dark-mode values, priority filtering, personalization normalization, and initial theme-override baseline construction.
- Kept `appUiStatePersistence.ts` as the asynchronous compact-mode/Store hydration coordinator and debounced persistence owner. Its theme override updater preserves the prior merge precedence through the focused snapshot helper.
- Updated `verify-app-ui-state-persistence-module.ts` and `verify-app-personalization-module.ts` to inspect the extracted load owner, then added `verify:app-ui-state-load-snapshot` to `verify:cleanup-core`.
- Passed:
  - `npm.cmd run verify:app-ui-state-load-snapshot`
  - `npm.cmd run verify:app-ui-state-persistence-module`
  - `npm.cmd run verify:app-personalization-module`
  - `npm.cmd run verify:electron-window-ipc-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/app/appUiStatePersistence.ts src/app/appUiStateLoadSnapshot.ts scripts/verify-app-ui-state-load-snapshot.ts scripts/verify-app-ui-state-persistence-module.ts scripts/verify-app-personalization-module.ts scripts/verify-cleanup-core.ts package.json`
- `npm.cmd run verify:cleanup-core` again reached the unchanged unrelated baseline stop: `scripts/verify-context-menu.ts` reports `useTasks should expose addSubtask.` after all task-core checks pass.

## 2026-07-13 - Phase 485 Obsidian overview-refresh extraction
- Added `scripts/verify-electron-obsidian-overview-update.ts` first and observed RED because `electron/obsidianOverviewUpdate.ts` did not exist.
- Extracted the best-effort vault-local Python overview update from `obsidianSyncDailyNote.ts` into `obsidianOverviewUpdate.ts`, preserving the exact Python arguments, payload, timeout, hidden-window behavior, and silent-failure semantics.
- Retained `triggerOverviewUpdate` in the daily-note sync helper as a delegating compatibility wrapper; daily-note content and write behavior remain there.
- Added `verify:electron-obsidian-overview-update` to `package.json` and `verify:cleanup-core`.
- Passed:
  - `npm.cmd run verify:electron-obsidian-overview-update`
  - `npm.cmd run verify:electron-obsidian-sync-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- electron/obsidianOverviewUpdate.ts electron/obsidianSyncDailyNote.ts scripts/verify-electron-obsidian-overview-update.ts scripts/verify-cleanup-core.ts package.json`
- `npm.cmd run verify:cleanup-core` again stopped only at the unchanged unrelated baseline assertion: `scripts/verify-context-menu.ts` reports `useTasks should expose addSubtask.`

## 2026-07-13 - Phase 486 Obsidian Vault accessor extraction
- Added `scripts/verify-electron-obsidian-vault-accessors.ts` first and observed RED because `electron/obsidianVaultAccessors.ts` did not exist.
- Extracted Vault default-path selection, malformed stored-path fallback, directory checks, and localized unavailable-status messages from `appStateAccessors.ts` into the focused Vault accessor factory.
- Kept `createAppStateAccessors` as the stable facade, composing and returning the same three Vault accessor functions for all current Electron and IPC consumers.
- Updated the existing app-state accessor structural verifier to assert the new implementation owner and facade composition.
- Passed:
  - `npm.cmd run verify:electron-obsidian-vault-accessors`
  - `npm.cmd run verify:electron-app-state-accessors-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- electron/obsidianVaultAccessors.ts electron/appStateAccessors.ts scripts/verify-electron-obsidian-vault-accessors.ts scripts/verify-electron-app-state-accessors-module.ts scripts/verify-cleanup-core.ts package.json`
- `npm.cmd run verify:cleanup-core` again stopped only at the unchanged unrelated baseline assertion: `scripts/verify-context-menu.ts` reports `useTasks should expose addSubtask.`

## 2026-07-13 - Phase 487 Personalization load-settings extraction
- The pre-existing `scripts/verify-app-personalization-load-settings.ts` was confirmed RED before implementation because `src/app/personalizationLoadSettings.ts` did not exist.
- Extracted all unknown Store-value readers, stored opacity-override parsing, default merging, legacy preset lookup, and removed-theme validation into `src/app/personalizationLoadSettings.ts`.
- Kept the `personalizationSettings.ts` export surface stable, so `appPersonalization.ts` and UI-state hydration retain their current import paths.
- Updated `verify-app-personalization-module.ts` to inspect the focused parsing owner and compatibility facade boundary.
- Passed:
  - `npm.cmd run verify:app-personalization-load-settings`
  - `npm.cmd run verify:app-personalization-module`
  - `npm.cmd run verify:app-ui-state-load-snapshot`
  - `npm.cmd run verify:app-ui-state-persistence-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/app/personalizationLoadSettings.ts src/app/personalizationSettings.ts scripts/verify-app-personalization-load-settings.ts scripts/verify-app-personalization-module.ts scripts/verify-cleanup-core.ts package.json`
- `npm.cmd run verify:cleanup-core` again stopped before this phase's verifier at the unchanged unrelated baseline: `scripts/verify-context-menu.ts` reports `useTasks should expose addSubtask.`

## 2026-07-13 - Phase 488 Markdown editor history extraction
- Added `scripts/verify-markdown-editor-history.ts` first and observed RED because `src/hooks/markdownEditorHistory.ts` did not exist.
- Extracted the pure editor-history state machine into `markdownEditorHistory.ts`, covering 500ms typing coalescing, redo truncation after a branch edit, equivalent-value selection updates, undo/redo, and reset.
- Updated `useMarkdownEditor.ts` to compose the history factory while preserving React refs, selection restoration, command-menu closure, and Markdown keyboard dispatch in the Hook.
- Passed:
  - `npm.cmd run verify:markdown-editor-history`
  - `npm.cmd run verify:markdown-editor`
  - `npm.cmd run verify:task-completion-dialog-markdown-field`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/hooks/markdownEditorHistory.ts src/hooks/useMarkdownEditor.ts scripts/verify-markdown-editor-history.ts scripts/verify-cleanup-core.ts package.json`
- `npm.cmd run verify:cleanup-core` again stopped before this phase's verifier at the unchanged unrelated baseline: `scripts/verify-context-menu.ts` reports `useTasks should expose addSubtask.`

## 2026-07-13 - Phase 489 Daily AI review progress extraction
- Added `scripts/verify-electron-ai-review-daily-progress.ts` first and observed RED because `electron/aiReviewDailyProgress.ts` did not exist.
- Extracted daily AI-review stage labels/messages, progress emission, stage recording, LLM request-status, and final diagnostic-status derivation into `electron/aiReviewDailyProgress.ts`.
- Kept `electron/aiReviewDailyRunner.ts` as the inspection/filesystem/LLM orchestration owner; it now composes the focused progress helper and passes its collected stages to the existing diagnostic factory.
- Updated `verify-ai-run-diagnostics.ts`, registered `verify:electron-ai-review-daily-progress`, and included it in `verify:cleanup-core`.
- Passed:
  - `npm.cmd run verify:electron-ai-review-daily-progress`
  - `npm.cmd run verify:ai-run-diagnostics`
  - `npm.cmd run verify:ai-runner`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- electron/aiReviewDailyRunner.ts electron/aiReviewDailyProgress.ts scripts/verify-electron-ai-review-daily-progress.ts scripts/verify-ai-run-diagnostics.ts scripts/verify-cleanup-core.ts package.json`
- `npm.cmd run verify:cleanup-core` again stopped only at the unchanged unrelated baseline assertion: `scripts/verify-context-menu.ts` reports `useTasks should expose addSubtask.`

## 2026-07-13 - Phase 490 Task app-state action extraction
- Added `scripts/verify-task-app-state-actions.ts` first and observed RED because `src/hooks/taskAppStateActions.ts` did not exist.
- Extracted app-setting persistence, retained-review clearing, and selected-date daily work/inspiration updates into `src/hooks/taskAppStateActions.ts`.
- Kept `useTaskActions.ts` responsible for task-tree mutation and ordering actions; it now memoizes the extracted handlers so unchanged dependencies retain the same public action callbacks.
- Updated `verify-task-actions-hook.ts` and `verify-task-hook-state.ts`, registered `verify:task-app-state-actions`, and included it in `verify:cleanup-core`.
- Passed:
  - `npm.cmd run verify:task-app-state-actions`
  - `npx.cmd tsx scripts/verify-task-actions-hook.ts`
  - `npx.cmd tsx scripts/verify-task-hook-state.ts`
  - `npm.cmd run verify:task-core`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - scoped `git diff --check`
- `npm.cmd run verify:cleanup-core` stopped only at the unchanged unrelated baseline assertion: `scripts/verify-context-menu.ts` reports `useTasks should expose addSubtask.`

## 2026-07-13 - Phase 491 Task completion action extraction
- Added `scripts/verify-task-completion-actions.ts` first and observed RED because `src/hooks/taskCompletionActions.ts` did not exist.
- Extracted task/subtask completion-review creation, review editing, delete confirmation, deleted-review retention/persistence, and review-free subtask completion into `taskCompletionActions.ts` with injected dependencies.
- Kept `useTaskActions.ts` as the React composition owner for the extracted handler factory plus ordinary task-tree CRUD and manual ordering callbacks.
- Restored the original public `completeTaskWithReview` parameter type after extraction and verified that a caller-provided review ID is still overwritten by the generated ID, matching prior behavior.
- Updated task-action and task-hook-state structure checks; registered `verify:task-completion-actions` in `verify:task-core` and `verify:cleanup-core`.
- Passed:
  - `npm.cmd run verify:task-completion-actions`
  - `npx.cmd tsx scripts/verify-task-actions-hook.ts`
  - `npx.cmd tsx scripts/verify-task-hook-state.ts`
  - `npm.cmd run verify:task-core`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/hooks/taskCompletionActions.ts src/hooks/useTaskActions.ts scripts/verify-task-completion-actions.ts scripts/verify-task-actions-hook.ts scripts/verify-task-hook-state.ts scripts/verify-cleanup-core.ts package.json`
- `npm.cmd run verify:cleanup-core` passed the new task-completion checks and then stopped at the unchanged unrelated baseline assertion: `scripts/verify-context-menu.ts` reports `useTasks should expose addSubtask.`

## 2026-07-13 - Phase 492 Task tree action extraction
- Added `scripts/verify-task-tree-actions.ts` first and observed RED because `src/hooks/taskTreeActions.ts` did not exist.
- Extracted ordinary task-tree actions into `taskTreeActions.ts`: task creation/edit/update/delete, subtask creation/toggle/delete, task toggle/collapse, priority changes, and selected-day completed-task clearing.
- Kept `useTaskActions.ts` as the React composition layer; base task deletion still coordinates manual-order cleanup there after the focused factory removes the task tree entry.
- The initial new test assumed clearing removes tasks; investigation against `clearCompletedTasks` and its established verifier showed the intended behavior is setting `cleared: true`, so the new test was corrected without changing production behavior.
- Updated the two stale task-list structure assertions that had expected ordinary task-tree mutations to remain in `useTaskActions.ts`.
- Passed:
  - `npm.cmd run verify:task-tree-actions`
  - `npx.cmd tsx scripts/verify-task-actions-hook.ts`
  - `npx.cmd tsx scripts/verify-task-hook-state.ts`
  - `npm.cmd run verify:task-core`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/hooks/taskTreeActions.ts src/hooks/useTaskActions.ts scripts/verify-task-tree-actions.ts scripts/verify-task-actions-hook.ts scripts/verify-task-hook-state.ts scripts/verify-task-list-interactions.ts scripts/verify-cleanup-core.ts package.json`
- `npm.cmd run verify:cleanup-core` passed the new task-tree checks and then stopped at the unchanged unrelated baseline assertion: `scripts/verify-context-menu.ts` reports `useTasks should expose addSubtask.`
- Verification passed:
  - `npm.cmd run verify:obsidian-template-task-visibility`
  - `npm.cmd run verify:daily-template-markers`
  - `npm.cmd run verify:review-fields`
  - `npx.cmd tsx scripts/verify-subtask-obsidian-sync.ts`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- shared/obsidianTemplateTaskLines.ts shared/obsidianTemplateTaskVisibility.ts scripts/verify-obsidian-template-task-visibility.ts scripts/verify-daily-template-markers.ts scripts/verify-cleanup-core.ts package.json`
- `npm.cmd run verify:cleanup-core` stopped at an unrelated baseline assertion in `verify-context-menu.ts`: `useTasks should expose addSubtask.` The focused extraction checks completed before that stop.

## 2026-07-13 - Phase 493 Tag suggestion lookup memoization
- Added a focused structural regression check first and observed RED because the tag pane rebuilt a selected-tag `Set` on every input render.
- Preserved the public `getTagSuggestions` helper while adding an internal `ReadonlySet` variant; `TagPane` now memoizes selected-tag membership and reuses it while filtering input suggestions.
- Updated the stale `verify-context-menu.ts` action assertions after `useTasks` was intentionally split: the verifier now checks hook composition, facade spreading, and the `TaskActions` contract in `useTaskActions.ts`.
- Passed:
  - `npm.cmd run verify:context-menu`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/components/taskMenuPopup/TaskMenuPopupTagPane.tsx scripts/verify-context-menu.ts`
- The scoped diff check reported only the repository's LF-to-CRLF advisory, with exit code `0`.
- The aggregate cleanup check then passed the prior context-menu stop and exposed successive stale structural ownership assertions after concurrent extractions. Updated each verifier to inspect the actual owner/composition boundary:
  - `verify-app-obsidian-template-actions-module` now inspects `appShellCompositionInputs.ts` for the action wiring.
  - `verify-date-key-reuse` now verifies `obsidianTemplateTaskVisibility.ts` owns shared date resolution and the task-line builder reuses its date map.
  - `verify-electron-shared-types-module` now verifies `obsidianVaultAccessors.ts` owns `VaultStatus` and `appStateAccessors.ts` forwards the focused factory.
- Each focused verifier passed. A fresh `typecheck` and production `build` also passed after these changes; full `verify:cleanup-core` has not yet been rerun beyond the newly repaired Electron shared-type boundary.
- Re-ran the full suite after the Electron shared-type repair. It exposed one final stale daily-runner structural assertion after `aiReviewDailyProgress.ts` centralized diagnostic recording; updated it from direct `stage(...)` expectations to `progress.record(...)` expectations.
- Passed fresh aggregate and production gates:
  - `npm.cmd run verify:cleanup-core`
  - `npm.cmd run build`
  - scoped `git diff --check` (only existing LF-to-CRLF advisories, exit code `0`)

## 2026-07-13 - Phase 494 Task ordering action extraction
- Added `scripts/verify-task-ordering-actions.ts` first and observed RED because `src/hooks/taskOrderingActions.ts` did not exist.
- Extracted manual ordering action coordination into `taskOrderingActions.ts`: task-tree deletion followed by global manual-order cleanup, source-group moves, and within-source task moves.
- Updated `useTaskActions.ts` to compose the injectable factory through `useMemo`, preserving its existing public callback names and dependency-driven identity behavior.
- Registered `verify:task-ordering-actions` in `verify:task-core` and `verify:cleanup-core`, and updated task action structure checks for the new owner.
- Passed:
  - `npm.cmd run verify:task-ordering-actions`
  - `npm.cmd run verify:task-core`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- src/hooks/useTaskActions.ts src/hooks/taskOrderingActions.ts scripts/verify-task-ordering-actions.ts scripts/verify-task-actions-hook.ts scripts/verify-task-hook-state.ts scripts/verify-cleanup-core.ts package.json`
- `npm.cmd run verify:cleanup-core` passed the new task checks and context-menu, then stopped at the unrelated stale `verify:date-key-reuse` assertion requiring `shared/obsidianTemplateTaskLines.ts` to import `taskRollover` directly.

## 2026-07-13 - Phase 495 AI review diagnostics extraction
- Added `scripts/verify-electron-ai-review-diagnostics-module.ts` first and observed RED because `electron/aiReviewDiagnostics.ts` did not exist.
- Extracted diagnostic construction from `electron/aiReviewRuntime.ts` into `electron/aiReviewDiagnostics.ts`, retaining runtime account resolution, progress IPC fanout, and DOCX text extraction in the runtime factory.
- The initial runtime-verifier failure was a stale structural expectation requiring `aiReviewRuntime.ts` to own `mergeTokenUsage` and `createDiagnostic`; it now validates the actual diagnostic owner and runtime delegation.
- Passed:
  - `npm.cmd run verify:electron-ai-review-diagnostics-module`
  - `npm.cmd run verify:electron-ai-review-runtime-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `git diff --check -- electron/aiReviewDiagnostics.ts electron/aiReviewRuntime.ts scripts/verify-electron-ai-review-diagnostics-module.ts scripts/verify-electron-ai-review-runtime-module.ts scripts/verify-cleanup-core.ts package.json`
- The aggregate cleanup suite was not rerun in this phase; its latest recorded state includes post-Phase-494 verifier repairs that have not yet received a complete aggregate pass.

## 2026-07-13 - Task-menu scheduled-date derivation memoization
- Added the date-pane cache assertion first and observed RED because the component recomputed sorted scheduled dates and their membership `Set` on every render.
- Updated `TaskMenuPopupDatePane` to derive both values together with `useMemo`, keyed only to `task.scheduledDates`; task-menu dispatch, sorting, and close behavior remain unchanged.
- Passed:
  - `npm.cmd run verify:context-menu`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `npm.cmd run verify:cleanup-core`
  - scoped `git diff --check` (only existing LF-to-CRLF advisories, exit code `0`)

## 2026-07-13 - Phase 496 Task persistence transforms extraction
- Added `scripts/verify-task-persistence-transforms.ts` first and confirmed RED because `src/hooks/taskPersistenceTransforms.ts` did not exist.
- Extracted task runtime guards, stored-array parsing, scheduled-date normalization, legacy completion-review migration, and recursive subtask normalization into `taskPersistenceTransforms.ts`.
- Preserved `taskTransforms.ts` as the import-compatible facade. Restored its original date-query semantics after reviewing the first facade draft: `getTaskVisibleDates` keeps valid/unique/sorted dates and `taskAppliesToDate` rejects malformed scheduled values.
- Updated stale source-shape checks in scheduled-date, task hook-state, and task persistence verifiers to assert the focused persistence owner while retaining facade contract checks.
- Passed:
  - `npm.cmd run verify:task-persistence-transforms`
  - `npx.cmd tsx scripts/verify-task-scheduled-dates-contract.ts`
  - `npm.cmd run verify:task-hook-state`
  - `npm.cmd run verify:task-persistence`
  - `npm.cmd run verify:task-carryover`
  - `npm.cmd run verify:task-core`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - scoped `git diff --check` (only existing LF-to-CRLF advisories, exit code `0`)
- The initial `npm.cmd run verify:task-scheduled-dates-contract` command failed only because that verifier is not registered as a package script; it passed through its actual `npx.cmd tsx` entrypoint.

## 2026-07-13 - Phase 497 App shell composition contract extraction
- Added `scripts/verify-app-shell-composition-types.ts` first and observed RED because `src/app/appShellCompositionTypes.ts` did not exist.
- Moved the large compile-time `AppShellCompositionOptions` interface into `appShellCompositionTypes.ts`; runtime prop composition remains in `appShellComposition.tsx`.
- Re-exported the type through the original shell composition module, so `appShellCompositionInputs.ts` continues using its stable import path.
- Updated two stale structural assertions in the existing shell verifier: they now verify the compatibility re-export and inspect `calendarTasks` typing at the new contract owner.

## 2026-07-13 - Phase 498 Electron main AI review services composition
- Added `scripts/verify-electron-main-ai-review-services-module.ts` first and confirmed RED because `electron/mainAiReviewServices.ts` did not exist.
- Extracted the related main-process service wiring into `electron/mainAiReviewServices.ts`: runtime helpers, delayed runner bridge, Obsidian services, daily review runner, and timer scheduler.
- Preserved the circular-dependency break exactly: bridge creation -> bridge callback injected into Obsidian services -> daily runner created from `getDailyFilePath` -> concrete runner bound -> timers created.
- Updated runtime, daily-runner, bridge, timer, AI IPC, Obsidian sync, and Electron-main structural verifiers to inspect the new owner and assert `main.ts` delegation.
- Passed focused verification:
  - `npm.cmd run verify:electron-main-ai-review-services-module`
  - `npm.cmd run verify:electron-ai-review-runtime-module`
  - `npm.cmd run verify:electron-ai-review-daily-runner-module`
  - `npm.cmd run verify:electron-ai-review-runner-bridge-module`
  - `npm.cmd run verify:electron-ai-review-timer-module`
  - `npm.cmd run verify:electron-ai-review-ipc-module`
  - `npm.cmd run verify:electron-obsidian-sync-module`
  - `npm.cmd run verify:electron-main-modules`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - scoped `git diff --check` (only existing LF-to-CRLF advisories, exit code `0`)
- Passed:
  - `npm.cmd run verify:app-shell-composition-types`
  - `npm.cmd run verify:app-shell-composition-module`
  - `npm.cmd run verify:app-main-content-module`
  - `npm.cmd run verify:app-overlay-stack-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - scoped `git diff --check` (only existing LF-to-CRLF advisory, exit code `0`)

## 2026-07-13 - Phase 499 Desktop widget state application extraction
- Re-scanned production module sizes. The largest remaining file was the 949-line `electron/obsidianCompanion.verify.ts`; its mobile-inbox split was deliberately not pursued because it would only divide a tightly coupled fault-injection test suite without improving production responsibility boundaries.
- Added `scripts/verify-electron-desktop-widget-state-applier-module.ts` first and observed RED because `electron/desktopWidgetStateApplier.ts` was absent.
- Extracted imperative desktop widget state application into `electron/desktopWidgetStateApplier.ts`; `desktopWindowMode.ts` now delegates resolved state effects while retaining state resolution, polling, and mode lifecycle.
- Updated the existing desktop window mode structural verifier to inspect the new application owner.
- Passed:
  - `npm.cmd run verify:electron-desktop-widget-state-applier-module`
  - `npm.cmd run verify:electron-desktop-window-mode-module`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - scoped `git diff --check` (existing LF-to-CRLF advisory only, exit code `0`)
- `npm.cmd run verify:window-mode` failed independently at the stale TitleBar `readWindowMode` assertion; this phase did not modify TitleBar or its window-mode IPC behavior.
