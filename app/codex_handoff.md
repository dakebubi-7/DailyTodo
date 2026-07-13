# DailyTodo Codex Handoff - Phase 337

Workspace: G:\Personal-AI\DailyTodo\app
Date: 2026-07-11
Goal: continue full-codebase optimization. Do not claim the whole goal is complete.

## Active Mode: A + B

A: This file is the lightweight handoff for a new Codex thread.
B: Use fast batch mode by default.

Fast batch mode:
- Each phase should pick one clear bug or optimization seam.
- Add a focused RED verifier first.
- Make the smallest aligned fix.
- Run the focused verifier and one adjacent verifier.
- Run `npm run typecheck` and `npm run build` every 3-5 phases, or immediately for shared type/build-sensitive changes.

## User Preferences / Constraints

- Reply in Chinese, concise, speed-first.
- If later a 400 appears, continue directly.
- Do not run `git add`, commit, push, or PR unless explicitly asked.
- The worktree has long-running dirty changes. Do not revert unrelated edits.
- Do not proactively run heavy suites:
  - `npm run verify:cleanup-core`
  - `npm run verify:rc`
- PowerShell environment. Avoid bash-only `&&`.

## Current Progress

Last completed phase: Phase 337.

Recent phases:
- Phase 184: `shared/pathTemplate.ts` path variables made case-insensitive.
- Phase 185: `shared/aiReview/sourceMaterials.ts` reuses shared path template expansion and rejects absolute source paths before sanitization.
- Phase 186: AI Review weekly source dirs now go through vault boundary guard.
- Phase 187: AI Review report writers reject escaping `relativeDir` output paths.
- Phase 188: Companion target paths reject absolute Windows paths before filename sanitization.
- Phase 189: Companion template variables are whitespace-tolerant and case-insensitive.
- Phase 190: Companion mobile inbox importer ignores directories even if their names end with `.md`, `.txt`, or `.json`.
- Phase 191: Companion `writeSyncPlan(...)` now rejects malformed direct plans that try to write outside the plan vault.
- Phase 192: Companion `writeSyncPlan(...)` now preflights all change paths before writing, preventing partial writes from mixed safe/unsafe malformed plans.
- Phase 193: Companion mobile inbox JSON files now require non-empty `content`; invalid JSON captures move to `_failed` instead of `_processed`.
- Phase 194: Obsidian sync skips optional local blog draft output unless `localBlogDraftDir` is a real directory, so a file-backed misconfiguration no longer breaks daily-note sync.
- Phase 195: Companion mobile inbox import now rejects file-backed inbox paths with a structured error instead of throwing while creating `_processed` / `_failed`.
- Phase 196: Companion mobile inbox now validates `_processed` / `_failed` as directories before moving files, so file conflicts fail cleanly without side effects.
- Phase 197: Companion mobile inbox now rejects blank `.md` / `.txt` captures instead of creating empty items and moving them to `_processed`.
- Phase 198: AI Review source collection now skips directory/non-file source candidates instead of throwing `EISDIR`, for both daily and weekly sources.
- Phase 199: AI Review `readWithStamp(...)` now treats non-file snapshot targets as null-stamp paths instead of throwing `EISDIR`.
- Phase 200: Electron vault status now rejects existing non-directory Obsidian paths, and the development default vault fallback also requires a real directory.
- Phase 201: Obsidian daily-note sync/preview now reject directory-backed daily note targets structurally instead of throwing `EISDIR`.
- Phase 202: `obsidian:openDailyNote` now rejects existing non-file daily note targets before shell open.
- Phase 203: Electron app/tray icon path resolution now ignores directory candidates and falls back unless the resource is a real file.
- Phase 204: Electron development `userData` override now applies only when `DEV_APPDATA_ROOT` is a real directory.
- Phase 205: SafeStore corrupt-config recovery now backs up/resets `config.json` only when the resolved config path is a real file.
- Phase 206: Companion `writeSyncPlan(...)` now rejects existing directory/non-file targets during batch preflight, preventing partial writes before a later `EISDIR`.
- Phase 207: AI Review shared report writing now returns structured failures when the output directory path is blocked by a file instead of throwing from `mkdirSync(...)`.
- Phase 208: Obsidian optional local blog draft output now skips/catches directory-backed `daily-memo-*.md` target conflicts so the primary daily-note sync still succeeds.
- Phase 209: Companion `buildSyncPlan(...)` now rejects existing directory/non-file target paths during planning instead of emitting misleading `update-file` changes.
- Phase 210: Companion mobile inbox import now returns items only after the source file successfully moves to `_processed`, so processed-move failures no longer leak failed captures as successful items.
- Phase 211: Companion mobile inbox fallback `_failed` move errors are now captured as structured import errors instead of escaping from `importMobileInbox(...)`.
- Phase 212: Companion mobile inbox root `statSync` failures are now returned as structured import errors before any processing-directory setup or file moves.
- Phase 213: Companion mobile inbox processed/failed destination moves now reserve targets with exclusive creation and retry on races, preventing overwrite of existing processed/failed files.
- Phase 214: Companion mobile inbox `readdirSync(...)` failures are now returned as structured import errors before any per-file read or move begins.
- Phase 215: Companion mobile inbox reserved-destination cleanup failures now preserve the original move failure and append cleanup details instead of masking it.
- Phase 216: Companion mobile inbox reservation close failures now clean up the just-created processed placeholder before fallback routing, preserving structured errors.
- Phase 217: AI Review daily runner source character counting failures now return structured no-source-materials diagnostics instead of throwing after inspection succeeds.
- Phase 218: AI Review atomic replacements now best-effort remove same-directory tmp files when replacement fails, while preserving structured errors.
- Phase 219: Obsidian template picker now verifies the selected path is a real file before reading template content.
- Phase 220: AI Review atomic replacement cleanup failures now append `temporary cleanup failed` details without masking the original write/rename error.
- Phase 221: Electron vault path accessors now ignore malformed/non-string stored vault paths instead of returning them as active filesystem paths.
- Phase 222: Companion settings loaded from store are now normalized so malformed persisted fields fall back to safe defaults before UI/IPC planning.
- Phase 223: Companion settings writes now normalize malformed setter/IPC input before persisting to Electron Store.
- Phase 224: Companion settings rule/template arrays now require valid element shapes before reaching Companion planning; malformed arrays fall back to defaults.
- Phase 225: Companion rule condition arrays now require string elements/enums before reaching `matchesRule(...)`; malformed persisted rules fall back to defaults.
- Phase 226: Companion `buildSyncPlan(...)` now returns structured failures for malformed runtime `rules/templates` collections instead of throwing from IPC/planner boundaries.
- Phase 227: Companion `buildSyncPlan(...)` now returns structured failures for malformed runtime rule/template array elements instead of throwing from IPC/planner boundaries.
- Phase 228: Companion `buildSyncPlan(...)` now returns structured failures for malformed runtime capture items instead of emitting downstream template/matching errors.
- Phase 229: Obsidian sync/preview now return structured failures for non-array runtime task inputs instead of throwing before date derivation.
- Phase 230: Obsidian sync/preview now return structured failures for malformed runtime task entries, nested subtasks, and completion review arrays.
- Phase 231: Obsidian sync/preview now return structured failures for non-string runtime `dailyWork` / `inspiration` inputs without writes or preview files.
- Phase 232: Obsidian sync/preview now return structured failures for non-string runtime selected-date inputs before path/template expansion.
- Phase 233: `obsidian:openDailyNote` now rejects non-string runtime selected-date inputs before daily-note path derivation.
- Phase 234: Obsidian sync/preview IPC now defaults only omitted daily section scalars, preserving malformed falsy values for runtime validation.
- Phase 235: Companion preview/write IPC now defaults only omitted item payloads, preserving malformed falsy values for `buildSyncPlan(...)` validation.
- Phase 236: Companion mobile inbox import now rejects non-string runtime inbox paths before filesystem checks.
- Phase 237: Obsidian template recognition now validates raw template input before AI settings/API-key checks.
- Phase 238: AI Review template/report recognition now validates raw template input before AI settings/API-key checks.
- Phase 239: AI Review template-file picker now verifies selected paths are files before reading them.
- Phase 240: AI Review model-list IPC now narrows runtime provider values before calling `listModels(...)`.
- Phase 241: AI Review template-recognition parser now falls back for malformed section entries instead of throwing.
- Phase 242: AI Review template-file picker now rejects malformed non-string selected paths before basename/stat/read handling.
- Phase 243: Obsidian template-file picker now rejects malformed non-string selected paths before basename/stat/read handling.
- Phase 244: Obsidian choosePath now persists only string selected paths and ignores malformed runtime dialog path values.
- Phase 245: Obsidian path IPC now normalizes stored path reads so malformed truthy store values are not returned to renderer path consumers.
- Phase 246: Main-window startup now treats non-string/blank stored Obsidian paths as unset before default vault-path seeding.
- Phase 247: Main-window persistence now passes raw persisted window-state values through normalizers instead of casting them first.
- Phase 248: Window IPC compact/autostart boolean getters now treat only strict persisted `true` as enabled.
- Phase 249: Window IPC compact/autostart setters now normalize runtime IPC values to strict booleans before persistence and OS login-item updates.
- Phase 250: Window settings-mode IPC now opens only for strict `true`, preventing malformed truthy runtime values from opening settings mode.
- Phase 251: Window lock-position IPC now enables locking only for strict `true`, preventing malformed truthy runtime values from enabling it.
- Phase 252: Window mode IPC now narrows runtime mode values with `isWindowMode(...)` before applying/persisting mode changes.
- Phase 253: Task context menu resize IPC now accepts only finite numeric heights before applying the existing clamp.
- Phase 254: Task context menu open IPC now guards runtime payload shape before creating popup windows.
- Phase 255: Task-menu popup creation now defensively normalizes coordinates to finite values before work-area clamping.
- Phase 256: Renderer task-context-menu payload builder now normalizes popup coordinates before IPC.
- Phase 257: Renderer task-context-menu theme numeric fields now clamp CSS-derived values to safe visual ranges.
- Phase 258: Renderer task-menu action parser now turns malformed forwarded payloads into no-op actions instead of throwing or mutating tasks.
- Phase 259: Electron task-context-menu action forwarding now guards runtime payload shape before broadcasting to the renderer.
- Phase 260: Renderer preload task-menu action API types now expose `unknown` payloads to match the runtime guard boundary.
- Phase 261: Renderer preload task-change listener API now exposes `unknown` payloads to match the runtime normalization boundary.
- Phase 262: Renderer preload Obsidian sync/preview task array API types now expose `unknown[]` to match the runtime validation boundary.
- Phase 263: Renderer preload Companion sync/write API types now expose `unknown` settings and `unknown[]` items to match the runtime validation boundary.
- Phase 264: Renderer preload AI Review daily/backfill/weekly/monthly task input API types now expose `unknown` to match the runtime preload boundary.
- Phase 265: Renderer preload app/Obsidian settings setter API types now expose `unknown` to match the runtime settings IPC boundary.
- Phase 266: Renderer preload AI Review settings/sections setter API types now expose `unknown` to match the runtime settings/sections IPC boundary.
- Phase 267: Renderer preload/Electron IPC Companion settings setter API types now expose `unknown` through app-state normalization.
- Phase 268: Renderer preload task context menu open API type now exposes `unknown` to match the runtime IPC guard boundary.
- Phase 269: Renderer preload/Electron IPC task context menu resize height API types now expose `unknown` before finite-number narrowing.
- Phase 270: Renderer preload/Electron IPC window mode setter API types now expose `unknown` before `isWindowMode(...)` narrowing.
- Phase 271: Renderer preload/Electron IPC window settings-mode setter API types now expose `unknown` before strict `open === true` narrowing.
- Phase 272: Renderer preload/Electron IPC lock-position setter API types now expose `unknown` before strict `locked === true` narrowing.
- Phase 273: Renderer preload/Electron IPC compact-mode setter API types now expose `unknown` before strict `compactMode === true` narrowing.
- Phase 274: Renderer preload/Electron IPC autostart setter API types now expose `unknown` before strict `enabled === true` narrowing.
- Phase 275: Renderer preload/Electron IPC Companion mobile inbox import path API types now expose `unknown` before string narrowing.
- Phase 276: Renderer preload/Electron IPC Obsidian template recognition raw-template API types now expose `unknown` before validator narrowing.
- Phase 277: Renderer preload/Electron IPC AI Review template/report recognition API types now expose `unknown` before raw-template validation and report-target narrowing.
- Phase 278: Renderer preload/Electron IPC Obsidian daily-note open date API types now expose `unknown` before non-string date rejection.
- Phase 279: Renderer preload/Electron IPC AI Review model-list config API types now expose `unknown` before local field-level narrowing.
- Phase 280: AI Review report-date IPC APIs and `getDateKey(...)` now accept runtime `unknown`; malformed values fall back to today's date instead of throwing before normalization.
- Phase 281: Obsidian sync/preview task, date, text, and before-task payloads now expose `unknown` until their existing runtime validation accepts them.


















































## Phase 278 Files Changed

- `electron/obsidianIpc.ts`
  - Narrowed `obsidian:openDailyNote` handler input from trusted `string` to `date?: unknown`.
- `electron/preload.ts`
  - Narrowed `openDailyNote(...)` input from trusted `string` to `unknown`.
- `src/vite-env.d.ts`
  - Narrowed the ambient `openDailyNote(...)` input to `unknown`.
- `scripts/verify-electron-obsidian-ipc-module.ts`
  - Added focused structure coverage requiring daily-note open dates to expose unknown runtime data through preload, ambient types, and IPC handler.

## Phase 278 Verification

RED:
- `npm.cmd run verify:electron-obsidian-ipc-module` failed before the fix because `obsidian:openDailyNote` still typed `date` as `string`.

Passed before handoff update:
- `npm.cmd run verify:electron-obsidian-ipc-module`
- `npm.cmd run verify:electron-main-window-bootstrap-module`
- `npm.cmd run typecheck`

Deferred under fast batch mode:
- `npm.cmd run build` (last passed Phase 276)

## Phase 279 Files Changed

- `electron/aiReviewTemplateToolsIpc.ts`
  - Narrowed `aiReview:listModels` handler input from a trusted config object to `cfg: unknown`.
  - Retained string guards for base URL/API key and whitelist narrowing for provider values.
- `electron/preload.ts`
  - Narrowed `aiReview.listModels(...)` input to `unknown`.
- `src/vite-env.d.ts`
  - Narrowed the ambient `aiReview.listModels(...)` input to `unknown`.
- `scripts/verify-electron-ai-review-template-tools-ipc-module.ts`
  - Added focused structure coverage requiring model-list config to expose unknown runtime data through IPC, preload, and ambient types.

## Phase 279 Verification

RED:
- `npm.cmd run verify:electron-ai-review-template-tools-ipc-module` failed before the fix because `aiReview:listModels` still typed `cfg` as a structured config object.

Passed before handoff update:
- `npm.cmd run verify:electron-ai-review-template-tools-ipc-module`
- `npm.cmd run verify:electron-ai-review-ipc-module`
- `npm.cmd run typecheck`
- `npm.cmd run build`

## Phase 280 Files Changed

- `electron/taskDateHelpers.ts`
  - Changed `getDateKey(...)` to accept runtime `unknown` and fall back to today unless the input is a non-empty string.
- `electron/aiReviewDailyRunInspectIpc.ts`
- `electron/aiReviewWeeklyReportIpc.ts`
- `electron/aiReviewMonthlyReportIpc.ts`
- `electron/aiReviewExternalReportIpc.ts`
- `electron/aiReviewSourceMaterialsIpc.ts`
  - Narrowed report-date IPC inputs from trusted strings to `unknown`.
- `electron/aiReviewReportIpcSourceCollection.ts`
- `electron/aiReviewIpcRegistrationTypes.ts`
- `electron/mainWindowBootstrap.ts`
  - Synchronized AI Review report-source injection and registration contracts.
- `electron/preload.ts`
- `src/vite-env.d.ts`
  - Narrowed exposed AI Review date API inputs to `unknown`.
- `scripts/verify-electron-task-date-helpers-module.ts`
- `scripts/verify-electron-ai-review-daily-run-inspect-ipc-module.ts`
- `scripts/verify-electron-ai-review-report-ipc-source-collection-module.ts`
- `scripts/verify-ai-regenerate-detection.ts`
  - Added/synchronized focused runtime-boundary coverage for the split AI Review IPC modules.

## Phase 280 Verification

RED:
- `npm.cmd run verify:electron-task-date-helpers-module` failed before the fix because `getDateKey(...)` still sliced a string-only parameter.
- `npm.cmd run verify:electron-ai-review-daily-run-inspect-ipc-module` failed before the fix because daily report-date IPC still typed `date` as `string`.

Passed before handoff update:
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

## Phase 281 Files Changed

- `electron/obsidianIpc.ts`
  - Narrowed sync/preview IPC handlers and injected dependency contracts from trusted task arrays/strings to `unknown`.
- `electron/obsidianSync.ts`
  - Narrowed sync/preview helper entry points to `unknown`, retaining their existing array, shape, text, and date guards.
- `electron/mainWindowBootstrap.ts`
  - Synchronized injected sync/preview contracts with the runtime boundary.
- `electron/preload.ts`
- `src/vite-env.d.ts`
  - Narrowed all Obsidian sync/preview input payloads to `unknown`.
- `scripts/verify-electron-obsidian-ipc-module.ts`
  - Added focused structure coverage for the aligned unknown contract across helper, IPC, preload, and ambient declarations.

## Phase 281 Verification

RED:
- `npm.cmd run verify:electron-obsidian-ipc-module` failed before the fix because the injected sync dependency still typed runtime payloads as task arrays and strings.

Passed before handoff update:
- `npm.cmd run verify:electron-obsidian-ipc-module`
- `npm.cmd run verify:electron-obsidian-sync-module`
- `npm.cmd run typecheck`
- `npm.cmd run build`

## Phase 277 Files Changed

- `electron/aiReviewTemplateToolsIpc.ts`
  - Narrowed `aiReview:recognizeTemplate` handler input from trusted `string` to `unknown`.
  - Narrowed `aiReview:recognizeReportTemplate` handler inputs from trusted `string` values to `target: unknown, rawTemplate: unknown`.
- `electron/preload.ts`
  - Narrowed `aiReview.recognizeTemplate(...)` and `aiReview.recognizeReportTemplate(...)` inputs to `unknown`.
- `src/vite-env.d.ts`
  - Narrowed the ambient AI Review recognition inputs to `unknown`.
- `scripts/verify-electron-ai-review-template-tools-ipc-module.ts`
  - Added focused structure coverage requiring AI Review recognition inputs to expose unknown runtime data through preload, ambient types, and IPC handlers.

## Phase 277 Verification

RED:
- `npm.cmd run verify:electron-ai-review-template-tools-ipc-module` failed before the fix because `recognizeTemplate(...)` still typed `rawTemplate` as `string`.

Passed before handoff update:
- `npm.cmd run verify:electron-ai-review-template-tools-ipc-module`
- `npm.cmd run verify:recognize-template`
- `npm.cmd run verify:recognize-report`
- `npm.cmd run verify:electron-ai-review-ipc-module`
- `npm.cmd run typecheck`

Deferred under fast batch mode:
- `npm.cmd run build` (last passed Phase 276)

## Phase 276 Files Changed

- `electron/obsidianIpc.ts`
  - Narrowed `obsidianTemplate:recognize` handler input from trusted `string` to `unknown`.
- `electron/preload.ts`
  - Narrowed `obsidianTemplate.recognize(...)` input from trusted `string` to `unknown`.
- `src/vite-env.d.ts`
  - Narrowed `obsidianTemplate.recognize(...)` ambient input from trusted `string` to `unknown`.
- `scripts/verify-electron-obsidian-ipc-module.ts`
  - Added focused structure coverage requiring Obsidian template recognition raw input to expose unknown runtime data through preload, ambient types, and IPC handler.

## Phase 276 Verification

RED:
- `npm.cmd run verify:electron-obsidian-ipc-module` failed before the fix because `obsidianTemplate:recognize` still typed `rawTemplate` as `string`.

Passed before handoff update:
- `npm.cmd run verify:electron-obsidian-ipc-module`
- `npm.cmd run verify:obsidian-template-recognition`
- `npm.cmd run typecheck`
- `npm.cmd run build`

## Phase 275 Files Changed

- `electron/companionIpc.ts`
  - Narrowed `companion:importMobileInbox` handler input from trusted `string` to `unknown`.
- `electron/preload.ts`
  - Narrowed `importMobileInbox(...)` input from trusted `string` to `unknown`.
- `src/vite-env.d.ts`
  - Narrowed `importMobileInbox(...)` ambient input from trusted `string` to `unknown`.
- `electron/obsidianCompanion.ts`
  - Narrowed `importMobileInbox(...)` implementation input from trusted `string` to `unknown`, matching its existing non-string runtime guard.
- `scripts/verify-electron-companion-ipc-module.ts`
  - Added focused structure coverage requiring mobile inbox import paths to expose unknown runtime data through preload, ambient types, and IPC handler.

## Phase 275 Verification

RED:
- `npm.cmd run verify:electron-companion-ipc-module` failed before the fix because `companion:importMobileInbox` still typed `inboxPath` as `string`.

Passed before handoff update:
- `npm.cmd run verify:electron-companion-ipc-module`
- `npm.cmd run verify:companion`
- `npm.cmd run typecheck`

Deferred under fast batch mode:
- `npm.cmd run build` (last passed Phase 273)

## Phase 274 Files Changed

- `electron/windowIpc.ts`
  - Narrowed `window:setAutoStart` handler input from trusted `boolean` to `unknown`.
- `electron/preload.ts`
  - Narrowed `setAutoStart(...)` input from trusted `boolean` to `unknown`.
- `src/vite-env.d.ts`
  - Narrowed `setAutoStart(...)` ambient input from trusted `boolean` to `unknown`.
- `scripts/verify-electron-window-ipc-module.ts`
  - Added focused structure coverage requiring autostart setter inputs to expose unknown runtime data through preload, ambient types, and IPC handler.

## Phase 274 Verification

RED:
- `npm.cmd run verify:electron-window-ipc-module` failed before the fix because `window:setAutoStart` still typed `enabled` as `boolean`.

Passed before handoff update:
- `npm.cmd run verify:electron-window-ipc-module`
- `npm.cmd run verify:electron-main-window-bootstrap-module`
- `npm.cmd run typecheck`

Deferred under fast batch mode:
- `npm.cmd run build` (last passed Phase 273)

## Phase 273 Files Changed

- `electron/windowIpc.ts`
  - Narrowed `window:setCompactMode` handler input from trusted `boolean` to `unknown`.
- `electron/preload.ts`
  - Narrowed `setWindowCompactMode(...)` input from trusted `boolean` to `unknown`.
- `src/vite-env.d.ts`
  - Narrowed `setWindowCompactMode(...)` ambient input from trusted `boolean` to `unknown`.
- `scripts/verify-electron-window-ipc-module.ts`
  - Added focused structure coverage requiring compact-mode setter inputs to expose unknown runtime data through preload, ambient types, and IPC handler.

## Phase 273 Verification

RED:
- `npm.cmd run verify:electron-window-ipc-module` failed before the fix because `window:setCompactMode` still typed `compactMode` as `boolean`.

Passed before handoff update:
- `npm.cmd run verify:electron-window-ipc-module`
- `npm.cmd run verify:electron-main-window-bootstrap-module`
- `npm.cmd run typecheck`
- `npm run build`

## Phase 272 Files Changed

- `electron/windowIpc.ts`
  - Narrowed `window:setLockWindowPosition` handler input from trusted `boolean` to `unknown`.
- `electron/preload.ts`
  - Narrowed `setLockWindowPosition(...)` input from trusted `boolean` to `unknown`.
- `src/vite-env.d.ts`
  - Narrowed `setLockWindowPosition(...)` ambient input from trusted `boolean` to `unknown`.
- `scripts/verify-electron-window-ipc-module.ts`
  - Added focused structure coverage requiring lock-position setter inputs to expose unknown runtime data through preload, ambient types, and IPC handler.

## Phase 272 Verification

RED:
- `npm.cmd run verify:electron-window-ipc-module` failed before the fix because `window:setLockWindowPosition` still typed `locked` as `boolean`.

Passed before handoff update:
- `npm.cmd run verify:electron-window-ipc-module`
- `npm.cmd run verify:electron-app-state-accessors-module`
- `npm.cmd run verify:electron-main-window-bootstrap-module`
- `npm.cmd run typecheck`

Deferred under fast batch mode:
- `npm.cmd run build` (last passed Phase 268)

## Phase 271 Files Changed

- `electron/windowIpc.ts`
  - Narrowed `window:setSettingsMode` handler input from trusted `boolean` to `unknown`.
- `electron/preload.ts`
  - Narrowed `setSettingsMode(...)` input from trusted `boolean` to `unknown`.
- `src/vite-env.d.ts`
  - Narrowed `setSettingsMode(...)` ambient input from trusted `boolean` to `unknown`.
- `scripts/verify-electron-window-ipc-module.ts`
  - Added focused structure coverage requiring settings-mode setter inputs to expose unknown runtime data through preload, ambient types, and IPC handler.

## Phase 271 Verification

RED:
- `npm.cmd run verify:electron-window-ipc-module` failed before the fix because `window:setSettingsMode` still typed `open` as `boolean`.

Passed before handoff update:
- `npm.cmd run verify:electron-window-ipc-module`
- `npm.cmd run verify:electron-settings-mode-state-module`
- `npm.cmd run verify:electron-main-window-bootstrap-module`
- `npm.cmd run typecheck`

Deferred under fast batch mode:
- `npm.cmd run build` (last passed Phase 268)

## Phase 270 Files Changed

- `electron/windowIpc.ts`
  - Narrowed `window:setWindowMode` handler input from trusted `WindowMode` to `unknown`.
- `electron/preload.ts`
  - Narrowed `setWindowMode(...)` input from trusted `string` to `unknown`.
- `src/vite-env.d.ts`
  - Narrowed `setWindowMode(...)` ambient input from trusted `WindowMode` to `unknown`.
- `scripts/verify-electron-window-ipc-module.ts`
  - Added focused structure coverage requiring window-mode setter inputs to expose unknown runtime data through preload, ambient types, and IPC handler.

## Phase 270 Verification

RED:
- `npm.cmd run verify:electron-window-ipc-module` failed before the fix because `window:setWindowMode` still typed `mode` as `WindowMode`.

Passed before handoff update:
- `npm.cmd run verify:electron-window-ipc-module`
- `npm.cmd run verify:electron-main-window-mode-controller-module`
- `npm.cmd run typecheck`

Deferred under fast batch mode:
- `npm.cmd run build` (last passed Phase 268)

## Phase 269 Files Changed

- `electron/taskContextMenuIpc.ts`
  - Narrowed `taskContextMenu:resize` handler input from trusted `number` to `unknown`.
- `electron/preload.ts`
  - Narrowed `resizeTaskContextMenu(...)` input from trusted `number` to `unknown`.
- `src/vite-env.d.ts`
  - Narrowed `resizeTaskContextMenu(...)` ambient input from trusted `number` to `unknown`.
- `scripts/verify-electron-task-context-menu-ipc-module.ts`
  - Added focused structure coverage requiring resize heights to expose unknown runtime data through preload, ambient types, and IPC handler.

## Phase 269 Verification

RED:
- `npm.cmd run verify:electron-task-context-menu-ipc-module` failed before the fix because `taskContextMenu:resize` still typed `height` as `number`.

Passed before handoff update:
- `npm.cmd run verify:electron-task-context-menu-ipc-module`
- `npm.cmd run verify:context-menu`
- `npm.cmd run typecheck`

Deferred under fast batch mode:
- `npm.cmd run build` (last passed Phase 268)

## Phase 268 Files Changed

- `src/vite-env.d.ts`
  - Narrowed `openTaskContextMenu(...)` input from a trusted structured task-menu payload to `unknown`.
- `scripts/verify-electron-task-context-menu-ipc-module.ts`
  - Added focused structure coverage requiring the ambient preload type for `openTaskContextMenu(...)` to expose unknown runtime data.

## Phase 268 Verification

RED:
- `npm.cmd run verify:electron-task-context-menu-ipc-module` failed before the fix because `openTaskContextMenu(...)` still advertised a trusted structured payload.

Passed before handoff update:
- `npm.cmd run verify:electron-task-context-menu-ipc-module`
- `npm.cmd run verify:context-menu`
- `npm.cmd run typecheck`
- `npm.cmd run build`

## Phase 267 Files Changed

- `src/vite-env.d.ts`
  - Narrowed `setCompanionSettings(...)` input from trusted `CompanionSettings` to `unknown`.
- `electron/companionIpc.ts`
  - Narrowed the Companion settings setter option and `companion:setSettings` handler payload to `unknown`.
- `electron/appStateAccessors.ts`
  - Narrowed `setCompanionSettings(value)` to `unknown` while keeping normalization before persistence.
- `scripts/verify-electron-companion-ipc-module.ts`
  - Added focused structure coverage requiring Companion settings setter ambient/preload/IPC/app-state inputs to expose unknown runtime data.

## Phase 267 Verification

RED:
- `npm.cmd run verify:electron-companion-ipc-module` failed before the fix because `setCompanionSettings(...)` still advertised trusted `CompanionSettings`.

Passed before handoff update:
- `npm.cmd run verify:electron-companion-ipc-module`
- `npm.cmd run verify:electron-app-state-accessors-module`
- `npm.cmd run typecheck`

Deferred under fast batch mode:
- `npm.cmd run build` (last passed Phase 263)

## Phase 266 Files Changed

- `src/vite-env.d.ts`
  - Narrowed `aiReview.setSettings(...)` and `aiReview.setSections(...)` inputs from trusted settings/section objects to `unknown`.
- `scripts/verify-electron-ai-review-settings-sections-ipc-module.ts`
  - Added focused structure coverage requiring AI Review settings/sections ambient setter inputs to expose unknown runtime data.
  - Added preload checks confirming both setters still forward `unknown` to the AI Review IPC channels.

## Phase 266 Verification

RED:
- `npm.cmd run verify:electron-ai-review-settings-sections-ipc-module` failed before the fix because `aiReview.setSettings(...)` still advertised trusted `AiReviewSettings`.

Passed before handoff update:
- `npm.cmd run verify:electron-ai-review-settings-sections-ipc-module`
- `npm.cmd run verify:ai-settings`
- `npm.cmd run verify:section-config`
- `npm.cmd run typecheck`

Deferred under fast batch mode:
- `npm.cmd run build` (last passed Phase 263)

## Phase 265 Files Changed

- `src/vite-env.d.ts`
  - Narrowed `setAppSettings(...)` and `setObsidianTemplateSettings(...)` inputs from trusted settings objects to `unknown`.
- `scripts/verify-electron-settings-ipc-module.ts`
  - Added focused structure coverage requiring app/Obsidian settings ambient setter inputs to expose unknown runtime data.
  - Added preload checks confirming both settings setters still forward `unknown` to the settings IPC channels.

## Phase 265 Verification

RED:
- `npm.cmd run verify:electron-settings-ipc-module` failed before the fix because app settings ambient setter input still advertised trusted `AppBehaviorSettings`.

Passed before handoff update:
- `npm.cmd run verify:electron-settings-ipc-module`
- `npm.cmd run verify:electron-app-state-accessors-module`
- `npm.cmd run typecheck`

Deferred under fast batch mode:
- `npm.cmd run build` (last passed Phase 263)

## Phase 264 Files Changed

- `src/vite-env.d.ts`
  - Narrowed `aiReview.runForDate(...)`, `aiReview.backfill(...)`, `aiReview.generateWeekly(...)`, and `aiReview.generateMonthly(...)` task inputs from trusted `Task[]` to `unknown`.
- `scripts/verify-ai-regenerate-force.ts`
  - Added focused structure coverage requiring AI Review ambient task inputs to expose unknown runtime data.
  - Calibrated stale IPC assertions to the current split modules: daily run/inspect, backfill, weekly report, and monthly report.

## Phase 264 Verification

RED:
- `npm.cmd exec -- tsx scripts/verify-ai-regenerate-force.ts` failed before the fix because AI Review ambient task inputs still advertised trusted `Task[]`.

Passed before handoff update:
- `npm.cmd exec -- tsx scripts/verify-ai-regenerate-force.ts`
- `npm.cmd run verify:electron-ai-review-daily-run-inspect-ipc-module`
- `npm.cmd run typecheck`

Deferred under fast batch mode:
- `npm.cmd run build` (last passed Phase 263)

Note:
- `npm.cmd run verify:ai-regenerate-force` is not currently a package script; direct `tsx` was used for focused RED/GREEN verification.

## Phase 263 Files Changed

- `src/vite-env.d.ts`
  - Narrowed `previewCompanionSync(...)` and `writeCompanionSync(...)` inputs from trusted `CompanionSettings` / `CaptureItem[]` to `unknown` / `unknown[]`.
- `scripts/verify-electron-companion-ipc-module.ts`
  - Added focused structure coverage requiring Companion sync/write preload APIs to expose unknown runtime inputs and checking preload still forwards unknown runtime data.

## Phase 263 Verification

Passed before handoff update:
- `npm.cmd run verify:electron-companion-ipc-module`
- `npm.cmd run verify:companion`
- `npm.cmd run typecheck`
- `npm.cmd run build`

## Phase 262 Files Changed

- `src/vite-env.d.ts`
  - Narrowed `syncTasksToObsidian(...)` and `previewTasksToObsidian(...)` task arrays plus optional `beforeTasks` arrays from trusted `Task[]` to `unknown[]`.
- `scripts/verify-settings-sync.ts`
  - Added focused structure coverage requiring Obsidian sync/preview preload APIs to expose unknown task arrays and checking preload still forwards `unknown[]`.

## Phase 262 Verification

Passed before handoff update:
- `npm.cmd run verify:settings-sync`
- `npm.cmd run typecheck`

Deferred under fast batch mode:
- `npm.cmd run build` (last passed Phase 260)

## Phase 261 Files Changed

- `src/vite-env.d.ts`
  - Narrowed `onTasksChanged(callback)` payload type from trusted `Task[]` to `unknown`.
- `scripts/verify-task-hook-state.ts`
  - Added focused structure coverage requiring the preload task-change listener API to expose unknown payload types.

## Phase 261 Verification

Passed before handoff update:
- `npm.cmd run verify:task-hook-state`
- `npm.cmd run verify:task-mutations`
- `npm.cmd run typecheck`

Deferred under fast batch mode:
- `npm.cmd run build` (last passed Phase 260)

## Phase 260 Files Changed

- `src/vite-env.d.ts`
  - Narrowed `dispatchTaskMenuAction(payload)` and `onTaskMenuAction(callback)` payload types to `unknown`.
- `scripts/verify-app-task-menu-actions-module.ts`
  - Added focused structure coverage requiring the preload task-menu action APIs to expose unknown payload types.

## Phase 260 Verification

Passed before handoff update:
- `npm.cmd run verify:app-task-menu-actions-module`
- `npm run verify:context-menu`
- `npm.cmd run typecheck`
- `npm.cmd run build`

## Phase 259 Files Changed

- `electron/taskContextMenuIpc.ts`
  - Added `TaskMenuActionPayload` and `isTaskMenuActionPayload(...)`; malformed action payloads close the popup and return without renderer broadcast.
- `scripts/verify-electron-task-context-menu-ipc-module.ts`
  - Added focused structure coverage requiring an Electron-side action payload guard before `webContents.send(...)`.

## Phase 259 Verification

Passed before handoff update:
- `npm.cmd run verify:electron-task-context-menu-ipc-module`
- `npm run verify:context-menu`
- `npm.cmd run typecheck`
- `npm.cmd run build`

## Phase 258 Files Changed

- `src/app/taskMenuActions.ts`
  - Added `isTaskMenuActionPayload(...)`; malformed runtime payloads parse to `{ kind: 'noop' }` and apply as no-ops.
- `scripts/verify-app-task-menu-actions-module.ts`
  - Added focused RED structure coverage for task-menu action payload runtime guarding.

## Phase 258 Verification

Passed before handoff update:
- `npm run verify:app-task-menu-actions-module`
- `npm run verify:context-menu`

Deferred under fast batch mode:
- `npm run typecheck` (last passed Phase 255)
- `npm run build` (last passed Phase 255)

## Phase 257 Files Changed

- `src/components/taskItem/taskItemContextMenu.ts`
  - `parseCssNumber(...)` now supports min/max clamps; menu opacity/blur/radius use safe bounded ranges.
- `scripts/verify-task-item-context-menu-helper.ts`
  - Added focused RED structure coverage for bounded CSS numeric parsing.

## Phase 257 Verification

Passed before handoff update:
- `npm run verify:task-item-context-menu-helper`
- `npm run verify:context-menu`

Deferred under fast batch mode:
- `npm run typecheck` (last passed Phase 255)
- `npm run build` (last passed Phase 255)

## Phase 256 Files Changed

- `src/components/taskItem/taskItemContextMenu.ts`
  - Added `normalizeScreenCoordinate(...)`; popup payload coordinates now fall back to `0` unless finite.
- `scripts/verify-task-item-context-menu-helper.ts`
  - Added focused RED structure coverage requiring renderer-side coordinate normalization before IPC payload creation.

## Phase 256 Verification

Passed before handoff update:
- `npm run verify:task-item-context-menu-helper`
- `npm run verify:context-menu`

Deferred under fast batch mode:
- `npm run typecheck` (last passed Phase 255)
- `npm run build` (last passed Phase 255)

## Phase 255 Files Changed

- `electron/taskMenuWindow.ts`
  - Popup coordinates now fall back to the work-area center unless `payload.screenX` / `screenY` are finite numbers.
- `scripts/verify-context-menu.ts`
  - Added focused RED structure coverage requiring defensive coordinate normalization before popup placement clamping.

## Phase 255 Verification

Passed before handoff update:
- `npm run verify:context-menu`
- `npm run verify:electron-task-context-menu-ipc-module`
- `npm run typecheck`
- `npm run build`

## Phase 254 Files Changed

- `electron/taskContextMenuIpc.ts`
  - Added `isTaskMenuPayload(...)`; `taskContextMenu:open` now ignores malformed runtime payloads before popup creation.
- `scripts/verify-electron-task-context-menu-ipc-module.ts`
  - Added focused RED structure coverage for open-payload runtime guarding; calibrated one local variable name expectation after product fix.

## Phase 254 Verification

Passed before handoff update:
- `npm run verify:electron-task-context-menu-ipc-module`
- `npm run verify:context-menu`

Deferred under fast batch mode:
- `npm run typecheck` (last passed Phase 249)
- `npm run build` (last passed Phase 249)

## Phase 253 Files Changed

- `electron/taskContextMenuIpc.ts`
  - `taskContextMenu:resize` now accepts only finite numeric runtime heights before clamping; malformed values use the default task-menu height.
- `scripts/verify-electron-task-context-menu-ipc-module.ts`
  - Added focused RED structure coverage preventing broad `Number(height)` coercion.

## Phase 253 Verification

Passed before handoff update:
- `npm run verify:electron-task-context-menu-ipc-module`
- `npm run verify:context-menu`

Deferred under fast batch mode:
- `npm run typecheck` (last passed Phase 249)
- `npm run build` (last passed Phase 249)

## Phase 252 Files Changed

- `electron/windowIpc.ts`
  - `window:setWindowMode` now validates runtime mode input with `isWindowMode(...)` before calling `setWindowMode(...)`.
- `scripts/verify-electron-window-ipc-module.ts`
  - Added focused RED structure coverage for window-mode runtime narrowing; calibrated one over-broad negative regex after product fix.

## Phase 252 Verification

Passed before handoff update:
- `npm run verify:electron-window-ipc-module`
- `npm run verify:electron-main-window-bootstrap-module`

Deferred under fast batch mode:
- `npm run typecheck` (last passed Phase 249)
- `npm run build` (last passed Phase 249)

## Phase 251 Files Changed

- `electron/windowIpc.ts`
  - `window:setLockWindowPosition` now derives `nextLockWindowPosition = locked === true` before settings persistence.
- `scripts/verify-electron-window-ipc-module.ts`
  - Added focused RED structure coverage preventing broad `Boolean(locked)` coercion.

## Phase 251 Verification

Passed before handoff update:
- `npm run verify:electron-window-ipc-module`
- `npm run verify:electron-main-window-bootstrap-module`

Deferred under fast batch mode:
- `npm run typecheck` (last passed Phase 249)
- `npm run build` (last passed Phase 249)

## Phase 250 Files Changed

- `electron/windowIpc.ts`
  - `window:setSettingsMode` now derives `shouldOpenSettings = open === true` before branching.
- `scripts/verify-electron-window-ipc-module.ts`
  - Added focused RED structure coverage preventing broad truthiness for settings-mode IPC input.

## Phase 250 Verification

Passed before handoff update:
- `npm run verify:electron-window-ipc-module`
- `npm run verify:electron-main-window-bootstrap-module`

Deferred under fast batch mode:
- `npm run typecheck` (last passed Phase 249)
- `npm run build` (last passed Phase 249)

## Phase 249 Files Changed

- `electron/windowIpc.ts`
  - `window:setCompactMode` and `window:setAutoStart` now normalize IPC values with strict `=== true` before persistence/return; autostart also uses normalized values for login-item settings.
- `scripts/verify-electron-window-ipc-module.ts`
  - Added focused RED structure coverage preventing raw runtime boolean setter persistence.

## Phase 249 Verification

Passed before handoff update:
- `npm run verify:electron-window-ipc-module`
- `npm run verify:electron-main-window-bootstrap-module`
- `npm run typecheck`
- `npm run build`

## Phase 248 Files Changed

- `electron/windowIpc.ts`
  - `window:getCompactMode` and `window:getAutoStart` now use strict `=== true` persisted boolean reads.
- `scripts/verify-electron-window-ipc-module.ts`
  - Added focused RED structure coverage preventing broad truthiness coercion for persisted booleans.

## Phase 248 Verification

Passed before handoff update:
- `npm run verify:electron-window-ipc-module`
- `npm run verify:electron-main-window-bootstrap-module`

Deferred under fast batch mode:
- `npm run typecheck` (last passed Phase 245)
- `npm run build` (last passed Phase 245)

## Phase 247 Files Changed

- `electron/mainWindowPersistence.ts`
  - Removed `WindowState` casts from persisted window-state reads before normalization.
- `scripts/verify-electron-main-window-persistence-module.ts`
  - Added focused RED structure coverage requiring raw store values to flow into `normalizeRestoredWindowState(...)`.

## Phase 247 Verification

Passed before handoff update:
- `npm run verify:electron-main-window-persistence-module`
- `npm run verify:electron-main-window-startup-module`

Deferred under fast batch mode:
- `npm run typecheck` (last passed Phase 245)
- `npm run build` (last passed Phase 245)

## Phase 246 Files Changed

- `electron/mainWindowStartup.ts`
  - Default vault-path seeding now treats non-string/blank stored values as unset instead of relying on truthiness.
- `scripts/verify-electron-main-window-startup-module.ts`
  - Added focused RED structure coverage preventing malformed truthy stored vault paths from suppressing default seeding.

## Phase 246 Verification

Passed before handoff update:
- `npm run verify:electron-main-window-startup-module`
- `npm run verify:electron-main-window-bootstrap-module`

Deferred under fast batch mode:
- `npm run typecheck` (last passed Phase 245)
- `npm run build` (last passed Phase 245)

## Phase 245 Files Changed

- `electron/obsidianIpc.ts`
  - Added `getStoredObsidianPath()` and routed `obsidian:getPath` plus choosePath fallbacks through it.
- `scripts/verify-electron-obsidian-ipc-module.ts`
  - Added focused RED structure coverage preventing raw malformed stored path returns.

## Phase 245 Verification

Passed before handoff update:
- `npm run verify:electron-obsidian-ipc-module`
- `npm run verify:electron-main-window-bootstrap-module`
- `npm run typecheck`
- `npm run build`

## Phase 244 Files Changed

- `electron/obsidianIpc.ts`
  - `obsidian:choosePath` now checks selected paths are strings before store writes/returns.
- `scripts/verify-electron-obsidian-ipc-module.ts`
  - Added focused RED structure coverage preventing raw runtime dialog path persistence.

## Phase 244 Verification

Passed before handoff update:
- `npm run verify:electron-obsidian-ipc-module`
- `npm run verify:electron-main-window-bootstrap-module`

Deferred under fast batch mode:
- `npm run typecheck` (last passed Phase 241)
- `npm run build` (last passed Phase 241)

## Phase 243 Files Changed

- `electron/obsidianIpc.ts`
  - `obsidianTemplate:pickTemplateFile` now checks selected paths are strings before `path.basename(...)`.
- `scripts/verify-electron-obsidian-ipc-module.ts`
  - Added focused RED structure coverage for runtime selected-path type guarding.

## Phase 243 Verification

Passed before handoff update:
- `npm run verify:electron-obsidian-ipc-module`
- `npm run verify:electron-main-window-bootstrap-module`

Deferred under fast batch mode:
- `npm run typecheck` (last passed Phase 241)
- `npm run build` (last passed Phase 241)

## Phase 242 Files Changed

- `electron/aiReviewTemplateToolsIpc.ts`
  - `aiReview:pickTemplateFile` now checks selected paths are strings before `path.basename(...)`.
- `scripts/verify-electron-ai-review-template-tools-ipc-module.ts`
  - Added focused RED structure coverage for runtime selected-path type guarding.

## Phase 242 Verification

Passed before handoff update:
- `npm run verify:electron-ai-review-template-tools-ipc-module`
- `npm run verify:electron-ai-review-ipc-module`

Deferred under fast batch mode:
- `npm run typecheck` (last passed Phase 241)
- `npm run build` (last passed Phase 241)

## Phase 241 Files Changed

- `shared/aiReview/recognizeTemplate.ts`
  - `parseRecognizedSections(...)` now verifies parsed section entries are object-shaped before reading marker/title/type fields.
- `scripts/verify-recognize-template.ts`
  - Added focused RED runtime coverage for malformed LLM section entries.

## Phase 241 Verification

Passed before handoff update:
- `npm run verify:recognize-template`
- `npm run verify:electron-ai-review-template-tools-ipc-module`
- `npm run typecheck`
- `npm run build`

## Phase 240 Files Changed

- `electron/aiReviewTemplateToolsIpc.ts`
  - `aiReview:listModels` now narrows runtime provider values to `openai`, `anthropic`, `gemini`, or `auto`; malformed values fall back to `auto`.
- `scripts/verify-electron-ai-review-template-tools-ipc-module.ts`
  - Added focused RED structure coverage for provider narrowing before `listModels(...)`.

## Phase 240 Verification

Passed before handoff update:
- `npm run verify:electron-ai-review-template-tools-ipc-module`
- `npm run verify:electron-ai-review-ipc-module`

Deferred under fast batch mode:
- `npm run typecheck` (last passed Phase 237)
- `npm run build` (last passed Phase 237)

## Phase 239 Files Changed

- `electron/aiReviewTemplateToolsIpc.ts`
  - `aiReview:pickTemplateFile` now verifies selected paths are real files before `fs.readFileSync(...)`.
- `scripts/verify-electron-ai-review-template-tools-ipc-module.ts`
  - Added focused RED structure coverage for the file-only picker guard.

## Phase 239 Verification

Passed before handoff update:
- `npm run verify:electron-ai-review-template-tools-ipc-module`
- `npm run verify:electron-ai-review-ipc-module`

Deferred under fast batch mode:
- `npm run typecheck` (last passed Phase 237)
- `npm run build` (last passed Phase 237)
## Phase 238 Files Changed

- `electron/aiReviewTemplateToolsIpc.ts`
  - `aiReview:recognizeTemplate` now validates `rawTemplate` before AI settings/API-key checks.
  - `aiReview:recognizeReportTemplate` now validates `rawTemplate` before AI settings/API-key checks.
- `scripts/verify-electron-ai-review-template-tools-ipc-module.ts`
  - Added focused RED structure coverage for the recognition input validation order.

## Phase 238 Verification

Passed before handoff update:
- `npm run verify:electron-ai-review-template-tools-ipc-module`
- `npm run verify:electron-ai-review-ipc-module`

Deferred under fast batch mode:
- `npm run typecheck` (last passed Phase 237)
- `npm run build` (last passed Phase 237)
## Phase 237 Files Changed

- `electron/obsidianIpc.ts`
  - `obsidianTemplate:recognize` now validates `rawTemplate` before AI settings/API-key checks.
- `scripts/verify-electron-obsidian-ipc-module.ts`
  - Added focused RED structure coverage for the template-recognition validation order.

## Phase 237 Verification

Passed before handoff update:
- `npm run verify:electron-obsidian-ipc-module`
- `npm run verify:obsidian-template-recognition`
- `npm run typecheck`
- `npm run build`
## Phase 236 Files Changed

- `electron/obsidianCompanion.ts`
  - `importMobileInbox(...)` now rejects non-string runtime `inboxPath` values before filesystem checks.
- `electron/obsidianCompanion.verify.ts`
  - Added focused RED runtime coverage ensuring malformed inbox paths do not reach `fs.existsSync(...)`.

## Phase 236 Verification

Passed before handoff update:
- `npm run verify:companion`
- `npm run verify:electron-companion-ipc-module`

Deferred under fast batch mode:
- `npm run typecheck` (last passed Phase 234)
- `npm run build` (last passed Phase 234)
## Phase 235 Files Changed

- `electron/companionIpc.ts`
  - `companion:previewSync` and `companion:writeSync` now default only `undefined` item payloads to `[]`.
  - Falsy malformed runtime item payloads are preserved for `buildSyncPlan(...)` validation.
- `scripts/verify-electron-companion-ipc-module.ts`
  - Added focused RED structure coverage preventing `items || []` forwarding.

## Phase 235 Verification

Passed before handoff update:
- `npm run verify:electron-companion-ipc-module`
- `npm run verify:companion`

Deferred under fast batch mode:
- `npm run typecheck` (last passed Phase 234)
- `npm run build` (last passed Phase 234)
## Phase 234 Files Changed

- `electron/obsidianIpc.ts`
  - `obsidian:syncTasks` and `obsidian:previewTasks` now default only `undefined` daily section values to empty strings.
  - Falsy malformed runtime values are preserved for downstream sync/preview validation.
- `scripts/verify-electron-obsidian-ipc-module.ts`
  - Added focused RED structure coverage preventing `dailyWork || ''` / `inspiration || ''` forwarding.

## Phase 234 Verification

Passed before handoff update:
- `npm run verify:electron-obsidian-ipc-module`
- `npm run verify:electron-main-window-bootstrap-module`
- `npm run typecheck`
- `npm run build`
## Phase 233 Files Changed

- `electron/obsidianIpc.ts`
  - `obsidian:openDailyNote` now rejects non-string runtime selected-date inputs before `getDateKey(...)` and daily-note path derivation.
- `scripts/verify-electron-obsidian-ipc-module.ts`
  - Added focused RED structure coverage for the `openDailyNote` runtime date guard.

## Phase 233 Verification

Passed before handoff update:
- `npm run verify:electron-obsidian-ipc-module`
- `npm run verify:electron-main-window-bootstrap-module`

Deferred under fast batch mode:
- `npm run typecheck` (last passed Phase 230)
- `npm run build` (last passed Phase 230)
## Phase 232 Files Changed

- `electron/obsidianSync.ts`
  - `syncTasksToObsidian(...)` now rejects non-string runtime `date` before affected-date/path derivation.
  - `previewTasksToObsidian(...)` now returns an empty structured preview for non-string runtime selected dates.
- `scripts/verify-settings-sync.ts`
  - Added focused RED coverage for malformed runtime selected-date inputs.

## Phase 232 Verification

Passed before handoff update:
- `npm run verify:settings-sync`
- `npm run verify:electron-obsidian-sync-module`

Deferred under fast batch mode:
- `npm run typecheck` (last passed Phase 230)
- `npm run build` (last passed Phase 230)
## Phase 231 Files Changed

- `electron/obsidianSync.ts`
  - `syncTasksToObsidian(...)` now rejects non-string runtime `dailyWork` / `inspiration` before writes or review triggering.
  - `previewTasksToObsidian(...)` now returns an empty structured preview for non-string daily section inputs.
- `scripts/verify-settings-sync.ts`
  - Added focused RED coverage for malformed runtime daily section scalar inputs.

## Phase 231 Verification

Passed before handoff update:
- `npm run verify:settings-sync`
- `npm run verify:electron-obsidian-sync-module`

Deferred under fast batch mode:
- `npm run typecheck` (last passed Phase 230)
- `npm run build` (last passed Phase 230)
## Phase 230 Files Changed

- `electron/obsidianSync.ts`
  - Added recursive runtime task validation for Obsidian sync/preview inputs.
  - Sync and preview now reject malformed task entries, nested `subtasks`, and completion review arrays before affected-date derivation.
- `scripts/verify-settings-sync.ts`
  - Added focused RED coverage for array-shaped runtime task payloads containing malformed task entries.

## Phase 230 Verification

Passed before handoff update:
- `npm run verify:settings-sync`
- `npm run verify:electron-obsidian-sync-module`
- `npm run typecheck`
- `npm run build`
## Phase 229 Files Changed

- `electron/obsidianSync.ts`
  - `syncTasksToObsidian(...)` now rejects non-array runtime `tasks` / `beforeTasks` before deriving affected sync dates.
  - `previewTasksToObsidian(...)` now returns an empty structured preview with a clear task-array error for non-array runtime input.
- `scripts/verify-settings-sync.ts`
  - Added focused RED coverage for malformed non-array runtime sync and preview task inputs.

## Phase 229 Verification

Passed before handoff update:
- `npm run verify:settings-sync`
- `npm run verify:electron-obsidian-sync-module`

Deferred under fast batch mode:
- `npm run typecheck` (last passed Phase 227)
- `npm run build` (last passed Phase 227)
## Phase 228 Files Changed

- `electron/obsidianCompanion.ts`
  - Added runtime `CaptureItem` validation before `buildSyncPlan(...)` matches rules or renders templates.
  - Malformed/non-array runtime capture items return a structured failed `SyncPlan` with no changes.
- `electron/obsidianCompanion.verify.ts`
  - Added focused RED coverage for malformed runtime capture item entries passed to `buildSyncPlan(...)`.

## Phase 228 Verification

Passed before handoff update:
- `npm run verify:companion`
- `npm run verify:electron-companion-ipc-module`

Deferred under fast batch mode:
- `npm run typecheck` (last passed Phase 227)
- `npm run build` (last passed Phase 227)
## Phase 227 Files Changed

- `electron/obsidianCompanion.ts`
  - `buildSyncPlan(...)` now validates runtime rule/template element shapes before sorting rules or reading template fields.
  - Malformed array elements return a structured failed `SyncPlan` with no changes.
- `electron/obsidianCompanion.verify.ts`
  - Added focused RED coverage for malformed runtime rule/template elements passed to `buildSyncPlan(...)`.

## Phase 227 Verification

Passed before handoff update:
- `npm run verify:companion`
- `npm run verify:electron-companion-ipc-module`
- `npm run typecheck`
- `npm run build`
## Phase 226 Files Changed

- `electron/obsidianCompanion.ts`
  - `buildSyncPlan(...)` now validates runtime settings collection shape before reading `settings.templates.map(...)` or sorting `settings.rules`.
  - Malformed runtime settings return a structured failed `SyncPlan` with no changes.
- `electron/obsidianCompanion.verify.ts`
  - Added focused RED coverage for malformed direct/runtime Companion settings passed to `buildSyncPlan(...)`.

## Phase 226 Verification

Passed before handoff update:
- `npm run verify:companion`
- `npm run verify:electron-companion-ipc-module`

Deferred under fast batch mode:
- `npm run typecheck` (last passed Phase 225)
- `npm run build` (last passed Phase 224)

## Phase 225 Files Changed

- `electron/appStateAccessors.ts`
  - Added nested Companion rule condition validation for optional enum fields and string-array fields.
  - Malformed `tagsAny` / `tagsAll` / `containsAny` arrays now cause rules to fall back to defaults before planning/matching.
- `scripts/verify-electron-app-state-accessors-module.ts`
  - Added focused RED coverage for a valid-looking Companion rule with malformed condition array elements.

## Phase 225 Verification

Passed before handoff update:
- `npm run verify:electron-app-state-accessors-module`
- `npm run verify:electron-companion-ipc-module`
- `npm run typecheck`

Deferred under fast batch mode:
- `npm run build` (last passed Phase 224)

## Phase 224 Files Changed

- `electron/appStateAccessors.ts`
  - Added runtime element guards for Companion rule/template arrays.
  - `normalizeCompanionSettings(...)` now falls back to default rules/templates when stored arrays contain malformed elements.
- `scripts/verify-electron-app-state-accessors-module.ts`
  - Added focused RED coverage for malformed rule/template array elements in store-loaded Companion settings.

## Phase 224 Verification

Passed before handoff update:
- `npm run verify:electron-app-state-accessors-module`
- `npm run verify:electron-companion-ipc-module`
- `npm run typecheck`
- `npm run build`

## Phase 223 Files Changed

- `electron/appStateAccessors.ts`
  - `setCompanionSettings(...)` now persists `normalizeCompanionSettings(value, getVaultPath())` instead of raw caller input.
- `scripts/verify-electron-app-state-accessors-module.ts`
  - Added focused RED coverage for malformed Companion settings passed through the setter.
  - Verifies the value persisted to store is normalized/default-safe.

## Phase 223 Verification

Passed before handoff update:
- `npm run verify:electron-app-state-accessors-module`
- `npm run verify:electron-companion-ipc-module`

Deferred under fast batch mode:
- `npm run typecheck` (last passed Phase 222)
- `npm run build` (last passed Phase 222)

## Phase 222 Files Changed

- `electron/appStateAccessors.ts`
  - Added `normalizeCompanionSettings(...)` for store-loaded Companion settings.
  - Malformed path/preset/sync/preview/rules/templates fields fall back to `createDefaultCompanionSettings(getVaultPath())` values.
- `scripts/verify-electron-app-state-accessors-module.ts`
  - Added focused RED coverage for malformed `obsidianCompanionSettings` store data.
  - Verifies normalized strings, default manual sync mode, default preview boolean, and default rules/templates arrays.

## Phase 222 Verification

Passed before handoff update:
- `npm run verify:electron-app-state-accessors-module`
- `npm run verify:electron-companion-ipc-module`
- `npm run typecheck`
- `npm run build`

## Phase 221 Files Changed

- `electron/appStateAccessors.ts`
  - `getVaultPath()` now accepts only string values from `store.get('obsidianVaultPath')`.
  - Malformed/non-string persisted values fall back to the development default or empty path instead of reaching filesystem APIs.
- `scripts/verify-electron-app-state-accessors-module.ts`
  - Added focused RED coverage for a malformed object stored as `obsidianVaultPath`.
  - Verifies no throw and no malformed object returned as the active vault path.

## Phase 221 Verification

Passed before handoff update:
- `npm run verify:electron-app-state-accessors-module`
- `npm run verify:electron-main-modules`

Deferred under fast batch mode:
- `npm run typecheck` (last passed Phase 218)
- `npm run build` (last passed Phase 218)

## Phase 220 Files Changed

- `electron/aiReview/atomicWrite.ts`
  - `atomicReplace(...)` now wraps tmp cleanup in its own try/catch.
  - Cleanup failures are appended to the original replacement failure as `temporary cleanup failed: ...`.
- `scripts/verify-atomic-write.ts`
  - Added focused coverage requiring preservation of the original replacement failure when tmp cleanup also fails.

## Phase 220 Verification

Passed before handoff update:
- `npm run verify:atomic-write`
- `npm run verify:export-reports`

Deferred under fast batch mode:
- `npm run typecheck` (last passed Phase 218)
- `npm run build` (last passed Phase 218)

## Phase 219 Files Changed

- `electron/obsidianIpc.ts`
  - `obsidianTemplate:pickTemplateFile` now checks `fs.statSync(filePath).isFile()` before reading selected template content.
  - Non-file selected paths return a structured `{ ok: false, error }` instead of falling through to a low-level read failure.
- `scripts/verify-electron-obsidian-ipc-module.ts`
  - Added focused RED coverage requiring the template picker file-shape guard before `fs.readFileSync(...)`.

## Phase 219 Verification

Passed before handoff update:
- `npm run verify:electron-obsidian-ipc-module`
- `npm run verify:electron-main-window-bootstrap-module`

Deferred under fast batch mode:
- `npm run typecheck` (last passed Phase 218)
- `npm run build` (last passed Phase 218)

## Phase 218 Files Changed

- `electron/aiReview/atomicWrite.ts`
  - `atomicReplace(...)` now tracks the tmp file path outside the try block.
  - Replacement/write failures remove the tmp file with `fs.rmSync(tmp, { force: true })` before returning `{ ok: false }`.
- `scripts/verify-atomic-write.ts`
  - Added focused coverage requiring tmp cleanup in `atomicReplace(...)` failure handling.
  - Existing runtime checks still cover normal read/write, conflict refusal, create, and deleted-file refusal behavior.

## Phase 218 Verification

Passed before handoff update:
- `npm run verify:atomic-write`
- `npm run verify:export-reports`
- `npm run typecheck`
- `npm run build`

## Phase 217 Files Changed

- `electron/aiReviewDailyRunner.ts`
  - Source character counting now wraps the second daily-note `fs.readFileSync(...)` in try/catch.
  - Failures emit failed `prepareMaterials` progress, append a failed diagnostic stage, and return `{ ok: false, finalStatus: 'noSourceMaterials' }` via the existing diagnostic path.
- `scripts/verify-electron-ai-review-daily-runner-module.ts`
  - Added RED runtime coverage that lets the inspection read succeed but makes the later sourceChars read fail.
  - Verifies no throw, structured failure, reported error, failed `prepareMaterials`, and no-source-materials diagnostic.

## Phase 217 Verification

Passed before handoff update:
- `npm run verify:electron-ai-review-daily-runner-module`
- `npm run verify:electron-ai-review-daily-run-inspect-ipc-module`

Deferred under fast batch mode:
- `npm run typecheck` (last passed Phase 215)
- `npm run build` (last passed Phase 215)

## Phase 216 Files Changed

- `electron/obsidianCompanion.ts`
  - `reserveFilePath(...)` now catches `fs.closeSync(...)` failures after exclusive destination creation.
  - Close failures clean up the just-created reservation placeholder with `fs.rmSync(filePath, { force: true })`.
  - Cleanup failures are combined as `...; reservation cleanup failed: ...`.
- `electron/obsidianCompanion.verify.ts`
  - Added RED coverage that simulates a `_processed` reservation close failure after placeholder creation.
  - Verifies structured failure, no successful item, `_failed` fallback routing, visible close error, and no leftover `_processed` placeholder.

## Phase 216 Verification

Passed before handoff update:
- `npm run verify:companion`
- `npm run verify:electron-companion-ipc-module`

Deferred under fast batch mode:
- `npm run typecheck` (last passed Phase 215)
- `npm run build` (last passed Phase 215)

## Phase 215 Files Changed

- `electron/obsidianCompanion.ts`
  - `moveToUniqueDestination(...)` now catches reservation-placeholder cleanup failures after a failed rename.
  - Cleanup failures are combined with the original move error as `...; reservation cleanup failed: ...`.
- `electron/obsidianCompanion.verify.ts`
  - Added RED coverage that simulates a `_processed` move failure plus `_processed` reservation cleanup failure.
  - Verifies no successful item, both errors are visible, and fallback `_failed` routing still happens.

## Phase 215 Verification

Passed before handoff update:
- `npm run verify:companion`
- `npm run verify:electron-companion-ipc-module`
- `npm run typecheck`
- `npm run build`

## Phase 214 Files Changed

- `electron/obsidianCompanion.ts`
  - Inbox file enumeration via `fs.readdirSync(inboxPath, { withFileTypes: true })` is now wrapped in try/catch.
  - Enumeration failures return `{ ok: false, items: [], errors: [message] }` before per-file read/parse/move work starts.
- `electron/obsidianCompanion.verify.ts`
  - Added RED coverage that simulates an inbox-root `readdirSync(...)` failure.
  - Verifies no throw, structured failure, reported enumeration error, and no pending-file move.

## Phase 214 Verification

Passed before handoff update:
- `npm run verify:companion`
- `npm run verify:electron-companion-ipc-module`

Deferred under fast batch mode:
- `npm run typecheck` (last passed Phase 212; next phase should refresh)
- `npm run build` (last passed Phase 212; next phase should refresh)

## Phase 213 Files Changed

- `electron/obsidianCompanion.ts`
  - `getUniqueDestination(...)` now accepts reserved destinations.
  - Added no-overwrite `moveToUniqueDestination(...)` using exclusive `fs.openSync(destination, 'wx')` reservation and `EEXIST` retry.
  - `_processed` and `_failed` moves now use the reserved destination helper instead of directly renaming to a path selected only by `existsSync(...)`.
- `electron/obsidianCompanion.verify.ts`
  - Added RED coverage for a stale uniqueness check / destination race where `_processed/note.txt` already exists.
  - Verifies existing processed content is preserved and the new file moves to the next unique destination.

## Phase 213 Verification

Passed before handoff update:
- `npm run verify:companion`
- `npm run verify:electron-companion-ipc-module`

Deferred under fast batch mode:
- `npm run typecheck` (last passed Phase 212)
- `npm run build` (last passed Phase 212)

## Phase 212 Files Changed

- `electron/obsidianCompanion.ts`
  - The mobile inbox root `fs.statSync(inboxPath).isDirectory()` validation is now wrapped in try/catch.
  - Root stat failures return `{ ok: false, items: [], errors: [message] }` before `_processed` / `_failed` setup or file moves.
- `electron/obsidianCompanion.verify.ts`
  - Added RED coverage that simulates an inbox-root `statSync` failure.
  - Verifies no throw, structured failure, reported stat error, and no pending-file move.

## Phase 212 Verification

Passed before handoff update:
- `npm run verify:companion`
- `npm run verify:electron-companion-ipc-module`
- `npm run typecheck`
- `npm run build`

Note:
- The suggested AI Review daily-runner directory-target seam was inspected first; current behavior already converts that path shape into a structured inspection failure before sourceChars is read, so Phase 212 used the next real filesystem-root validation gap instead.

## Phase 211 Files Changed

- `electron/obsidianCompanion.ts`
  - The fallback move to `_failed` is now wrapped in its own try/catch.
  - Failed fallback moves are appended to the structured `errors` array.
- `electron/obsidianCompanion.verify.ts`
  - Added RED coverage that simulates both `_processed` and `_failed` move failures.
  - Verifies no throw, no successful items, and both move errors reported.

## Phase 211 Verification

Passed before handoff update:
- `npm run verify:companion`
- `npm run verify:electron-companion-ipc-module`

Deferred under fast batch mode:
- `npm run typecheck`
- `npm run build`

## Phase 210 Files Changed

- `electron/obsidianCompanion.ts`
  - `importMobileInbox(...)` now appends a parsed capture item only after its source file has successfully moved to `_processed`.
  - Failed processed moves continue through the existing error and `_failed` routing.
- `electron/obsidianCompanion.verify.ts`
  - Added RED coverage that simulates a `_processed` move failure and verifies zero returned items plus `_failed` routing.

## Phase 210 Verification

Passed before handoff update:
- `npm run verify:companion`
- `npm run verify:electron-companion-ipc-module`

Deferred under fast batch mode:
- `npm run typecheck`
- `npm run build`

## Phase 209 Files Changed

- `electron/obsidianCompanion.ts`
  - `buildSyncPlan(...)` now rejects existing non-file target paths before adding changes.
  - `writeSyncPlan(...)` guards remain as defense in depth.
- `electron/obsidianCompanion.verify.ts`
  - Added RED coverage for a default Companion daily-note target occupied by a directory before planning.
  - Verifies planner failure and no emitted changes.

## Phase 209 Verification

Passed before handoff update:
- `npm run verify:companion`
- `npm run verify:electron-companion-ipc-module`
- `npm run typecheck`
- `npm run build`

Note:
- First GREEN verifier run hit `TypeError: assert.equal is not a function`; fixed the assertion to use the verifier's local boolean assert style.

## Phase 208 Files Changed

- `electron/obsidianSync.ts`
  - Optional blog draft output is now isolated in a local try/catch.
  - The draft target is written only when missing or a real file; existing directory/non-file targets are skipped.
- `scripts/verify-settings-sync.ts`
  - Added RED coverage for a directory occupying `daily-memo-2026-05-27.md` inside a valid local blog draft directory.
  - Asserts primary sync success and no replacement of the directory-backed optional target.

## Phase 208 Verification

Passed before handoff update:
- `npm run verify:settings-sync`
- `npm run verify:electron-obsidian-sync-module`

Deferred under fast batch mode:
- `npm run typecheck`
- `npm run build`

## Phase 207 Files Changed

- `electron/aiReview/exportReports.ts`
  - Shared `writeReport(...)` now catches filesystem setup/write exceptions and returns `{ ok: false, error }`.
  - Vault-escape path validation still throws before write-time handling.
- `scripts/verify-export-reports.ts`
  - Added RED coverage for a file-backed `logs/weekly-review` output path.
  - Asserts structured failure, no overwrite of the conflicting file, and no nested report file creation.

## Phase 207 Verification

Passed before handoff update:
- `npm run verify:export-reports`
- `npm run verify:electron-ai-review-weekly-report-ipc-module`

Deferred under fast batch mode:
- `npm run typecheck`
- `npm run build`

## Phase 206 Files Changed

- `electron/obsidianCompanion.ts`
  - `writeSyncPlan(...)` preflight now rejects existing non-file targets with `Sync plan target must be a file: ...`.
  - The same file-target guard remains inside the write loop as defense in depth.
- `electron/obsidianCompanion.verify.ts`
  - Added RED coverage for a mixed direct plan where a later vault-internal directory target previously allowed an earlier safe file write.

## Phase 206 Verification

Passed before handoff update:
- `npm run verify:companion`
- `npm run verify:electron-companion-ipc-module`
- `npm run typecheck`
- `npm run build`

## Phase 205 Files Changed

- `electron/safeStore.ts`
  - `createSafeStore()` now requires the resolved `configPath` to be a real file before corrupt-config backup/reset runs.
  - Directory/non-file config targets skip backup/overwrite side effects and fall through to the existing retry.
- `scripts/verify-electron-foundation-modules.ts`
  - Added focused RED coverage requiring `fs.statSync(configPath).isFile()` in the safe-store recovery branch.

## Phase 205 Verification

Passed before handoff update:
- `npm run verify:electron-foundation-modules`
- `npm run verify:electron-main-modules`

Deferred under fast batch mode:
- `npm run typecheck`
- `npm run build`

## Phase 204 Files Changed

- `electron/appEnvironment.ts`
  - `applyDevelopmentUserDataOverride()` now requires `DEV_APPDATA_ROOT` to exist and be a directory before calling `app.setPath('userData', ...)`.
- `scripts/verify-electron-app-environment-module.ts`
  - Added focused RED coverage requiring the development userData directory guard.

## Phase 204 Verification

Passed before handoff update:
- `npm run verify:electron-app-environment-module`
- `npm run verify:electron-main-modules`

Deferred under fast batch mode:
- `npm run typecheck`
- `npm run build`

## Phase 203 Files Changed

- `electron/appIcons.ts`
  - `resolveIconPath(...)` now requires existing candidates to be real files.
  - Directory candidates named like icon resources fall through to fallback icon handling.
- `scripts/verify-electron-main-modules.ts`
  - Added focused RED coverage for `fs.statSync(candidate).isFile()` in icon path resolution.

## Phase 203 Verification

Passed before handoff update:
- `npm run verify:electron-main-modules`
- `npm run verify:electron-app-environment-module`
- `npm run typecheck`
- `npm run build`

## Phase 202 Files Changed

- `electron/obsidianIpc.ts`
  - `obsidian:openDailyNote` now checks existing rendered daily note targets with `fs.statSync(filePath).isFile()`.
  - Existing non-file targets return `{ ok: false, reason }` before overview refresh or `shell.openPath(...)`.
- `scripts/verify-electron-obsidian-ipc-module.ts`
  - Added focused static RED coverage requiring the file-shape guard in `openDailyNote`.

## Phase 202 Verification

Passed before handoff update:
- `npm run verify:electron-obsidian-ipc-module`
- `npm run verify:electron-main-window-bootstrap-module`

Deferred under fast batch mode:
- `npm run typecheck`
- `npm run build`

## Phase 201 Files Changed

- `electron/obsidianSync.ts`
  - Added `readDailyNoteFileIfPresent(...)`.
  - Sync and preview now require existing daily note targets to be real files.
  - Directory-backed daily note targets return structured errors instead of uncaught filesystem exceptions.
- `scripts/verify-settings-sync.ts`
  - Added RED coverage for a directory occupying a rendered daily note `*.md` path.
  - Asserts sync does not throw and returns a file-target failure.

## Phase 201 Verification

Passed before handoff update:
- `npm run verify:settings-sync`
- `npm run verify:electron-obsidian-sync-module`

Deferred under fast batch mode:
- `npm run typecheck`
- `npm run build`

## Phase 200 Files Changed

- `electron/appStateAccessors.ts`
  - Added `isExistingDirectory(...)`.
  - `getDefaultVaultPath()` and `getVaultStatus()` now require real directories, not just existing paths.
  - Existing file-backed vault paths return structured failure instead of `ok: true`.
- `scripts/verify-electron-app-state-accessors-module.ts`
  - Added RED coverage for `obsidianVaultPath` pointing to a regular file.
  - Asserts status rejection and folder/directory explanation.

## Phase 200 Verification

Passed before handoff update:
- `npm run verify:electron-app-state-accessors-module`
- `npm run verify:electron-main-modules`
- `npm run typecheck`
- `npm run build`

## Phase 199 Files Changed

- `electron/aiReview/atomicWrite.ts`
  - `readWithStamp(...)` now checks `stat.isFile()` before reading.
  - Non-file paths return `{ content: '', stamp: null }` instead of throwing.
- `scripts/verify-atomic-write.ts`
  - Added RED coverage for directory-backed snapshot paths.
  - Asserts no throw, no content, and no stamp for non-file targets.

## Phase 199 Verification

Passed before handoff update:
- `npm run verify:atomic-write`
- `npm run verify:export-reports`

Deferred under fast batch mode:
- `npm run typecheck`
- `npm run build`

## Phase 198 Files Changed

- `shared/aiReview/sourceMaterials.ts`
  - Added `readSourceFileIfPresent(...)`.
  - Daily and weekly source collection now reads only real files with non-empty content.
  - Directory/non-file candidates are skipped after existing vault-boundary checks.
- `scripts/verify-source-materials.ts`
  - Added RED coverage for a directory whose path renders like a daily source file.
  - Asserts collection does not throw and still returns valid files.

## Phase 198 Verification

Passed before handoff update:
- `npm run verify:source-materials`
- `npm run verify:electron-ai-review-source-materials-ipc-module`

Deferred under fast batch mode:
- `npm run typecheck`
- `npm run build`

## Phase 197 Files Changed

- `electron/obsidianCompanion.ts`
  - Mobile inbox import now requires non-empty trimmed content for all supported file types.
  - Blank `.md` / `.txt` files reuse the existing `_failed` routing instead of becoming empty capture items.
- `electron/obsidianCompanion.verify.ts`
  - Added RED coverage for whitespace-only `blank.txt`.
  - Asserts no item, explicit content error, `_failed` move, and no `_processed` move.

## Phase 197 Verification

Passed before handoff update:
- `npm run verify:companion`
- `npm run verify:app-companion-mobile-module`
- `npm run typecheck`
- `npm run build`

Note: the first RED attempt hit a test-literal syntax error; it was corrected before confirming the intended RED failure.

## Phase 196 Files Changed

- `electron/obsidianCompanion.ts`
  - Added `ensureMobileInboxDirectory(...)` for `_processed` / `_failed` setup.
  - Processing destinations must be directories before any inbox files are read or moved.
- `electron/obsidianCompanion.verify.ts`
  - Added RED coverage for `_processed` occupied by a file.
  - Asserts no throw, structured error, no pending-file move, and no overwrite of the conflicting file.

## Phase 196 Verification

Passed before handoff update:
- `npm run verify:companion`
- `npm run verify:app-companion-mobile-module`

Deferred under fast batch mode:
- `npm run typecheck`
- `npm run build`

## Phase 195 Files Changed

- `electron/obsidianCompanion.ts`
  - `importMobileInbox(...)` now requires `inboxPath` to be a directory before creating `_processed` and `_failed` folders.
  - File-backed inbox paths return a structured failure without modifying the file.
- `electron/obsidianCompanion.verify.ts`
  - Added RED coverage for passing a real file as the mobile inbox path.
  - Asserts no throw, explicit directory error, and no file mutation.

## Phase 195 Verification

Passed before handoff update:
- `npm run verify:companion`
- `npm run verify:app-companion-mobile-module`

Deferred under fast batch mode:
- `npm run typecheck`
- `npm run build`

## Phase 194 Files Changed

- `electron/obsidianSync.ts`
  - `syncTasksToObsidian(...)` now writes optional blog drafts only when `localBlogDraftDir` exists and is a directory.
  - File-backed or missing draft paths are skipped instead of interrupting the main Obsidian sync.
- `scripts/verify-settings-sync.ts`
  - Added RED coverage for a misconfigured file-backed blog draft path.
  - Asserts the main daily note still syncs and the configured file is not overwritten.

## Phase 194 Verification

Passed before handoff update:
- `npm run verify:settings-sync`
- `npm run verify:electron-obsidian-sync-module`
- `npm run typecheck`
- `npm run build`

## Phase 193 Files Changed

- `electron/obsidianCompanion.ts`
  - `importMobileInbox(...)` now treats raw-content fallback as text-file-only.
  - `.json` inbox captures with missing/empty `content` throw before item creation and are moved through the existing `_failed` path.
- `electron/obsidianCompanion.verify.ts`
  - Added RED coverage for an `empty.json` capture with metadata but no content.
  - Asserts no item is created, the error mentions content, the file moves to `_failed`, and `_processed` is untouched.

## Phase 193 Verification

Passed before handoff update:
- `npm run verify:companion`
- `npm run verify:electron-companion-ipc-module`

Deferred under fast batch mode:
- `npm run typecheck`
- `npm run build`

## Phase 192 Files Changed

- `electron/obsidianCompanion.ts`
  - `writeSyncPlan(...)` now preflights every `change.filePath` against `plan.vaultPath` before any filesystem side effect.
  - The existing in-loop path guard remains as defense in depth.
- `electron/obsidianCompanion.verify.ts`
  - Added RED coverage for a malformed mixed plan: safe in-vault change first, unsafe outside-vault change second.
  - Asserts the whole plan is rejected and no partial safe-file write occurs.

## Phase 192 Verification

Passed before handoff update:
- `npm run verify:companion`
- `npm run verify:electron-companion-ipc-module`

Deferred under fast batch mode:
- `npm run typecheck`
- `npm run build`

## Phase 191 Files Changed

- `shared/obsidianCompanion.ts`
  - `SyncPlan` now carries optional `vaultPath`.
- `electron/obsidianCompanion.ts`
  - `buildSyncPlan(...)` attaches `settings.vaultPath`.
  - `writeSyncPlan(...)` rejects missing vault paths and vault-escaping change paths before file operations.
- `electron/obsidianCompanion.verify.ts`
  - Added RED coverage for malformed direct `writeSyncPlan(...)` outside-vault writes.

## Phase 191 Verification

Passed before handoff update:
- `npm run verify:companion`
- `npm run verify:electron-companion-ipc-module`
- `npm run typecheck`
- `npm run build`

## Phase 190 Files Changed

- `electron/obsidianCompanion.ts`
  - `importMobileInbox(...)` now uses `fs.readdirSync(inboxPath, { withFileTypes: true })`.
  - It filters `entry.isFile()` before supported extension checks.
- `electron/obsidianCompanion.verify.ts`
  - Added RED coverage for a real `note.txt` plus an `archive.md` directory.

## Phase 190 Verification

Passed before handoff:
- `npm run verify:companion`
- `npm run verify:electron-companion-ipc-module`
- `npm run verify:app-companion-actions-module`
- `npm run typecheck`
- `npm run build`

## Persistent Memory Files

Read these at the start of the new thread:
- `task_plan.md`
- `progress.md`
- `findings.md`

## Recommended Next Seam Candidates

Continue from runtime/filesystem boundary hardening seams:
1. Check adjacent renderer menu/action payload builders for broad numeric/string coercion or missing runtime shape guards.
2. Check nearby Electron IPC boundaries that still trust preload TypeScript signatures for booleans, strings, paths, or payload objects.
3. Good next candidate: scan remaining preload/ambient APIs for trusted `string` or typed payload inputs where the Electron handler already performs runtime narrowing.
4. Typecheck and production build passed at Phase 282; next phase can return to focused + adjacent verification unless it touches build-sensitive shared/runtime code.

## Phase 282 Files Changed

- `electron/companionIpc.ts`
  - Companion preview/write handlers now receive `unknown` settings and item payloads from IPC.
- `electron/obsidianCompanion.ts`
  - `buildSyncPlan(...)` now accepts runtime `unknown` payloads and establishes the minimal planning-settings shape via a private guard.
- `electron/mainWindowBootstrap.ts`
  - Companion settings-setter injection matches the unknown runtime boundary.
- `scripts/verify-electron-companion-ipc-module.ts`
  - Added RED contract coverage for sync handler payloads and bootstrap injection.

## Phase 282 Verification

Passed before handoff update:
- `npm.cmd run verify:electron-companion-ipc-module`
- `npm.cmd run verify:companion`
- `npm.cmd run verify:electron-main-window-bootstrap-module`
- `npm.cmd run typecheck`
- `npm.cmd run build`

## New Thread Starter Prompt

Please read `G:\Personal-AI\DailyTodo\app\codex_handoff.md`, then continue optimizing from Phase 282 in fast batch mode. Do not revert unrelated changes. Do not run git add/commit/push unless explicitly asked.

## Phase 283 Files Changed

- `electron/aiReviewDailyRunInspectIpc.ts`
  - Added recursive runtime validation for daily AI Review task payloads.
  - Rejects malformed tasks with the existing structured failure result before runner invocation.
  - Treats only literal `true` as a force-regeneration request.
- `electron/preload.ts` and `src/vite-env.d.ts`
  - `aiReview.runForDate(...)` exposes renderer-provided date, tasks, and force values as `unknown`.
- `scripts/verify-electron-ai-review-daily-run-inspect-ipc-module.ts`
  - Added RED/contract coverage for runtime task validation and strict force narrowing.
- `scripts/verify-ai-regenerate-force.ts`
  - Extended force-regeneration regression coverage.
- `scripts/verify-electron-ai-review-ipc-module.ts`
  - Synchronized parent wiring assertion with `force === true`.

## Phase 283 Verification

RED confirmed before implementation:
- `npm.cmd run verify:electron-ai-review-daily-run-inspect-ipc-module` failed because the task runtime guard did not exist.

Passed after implementation:
- `npm.cmd run verify:electron-ai-review-daily-run-inspect-ipc-module`
- `npm.cmd exec -- tsx scripts/verify-ai-regenerate-force.ts`
- `npm.cmd run verify:electron-main-window-bootstrap-module`
- `npm.cmd run typecheck`
- `npm.cmd run build`

Passed after the final parent-verifier synchronization:
- `npm.cmd run verify:electron-ai-review-ipc-module`
- `npm.cmd run verify:electron-ai-review-daily-run-inspect-ipc-module`
- `npm.cmd exec -- tsx scripts/verify-ai-regenerate-force.ts`
- `npm.cmd run typecheck`

## Recommended Next Seam Candidates

Continue scanning remaining preload and ambient APIs for trusted structured renderer inputs that reach Electron handlers without a local runtime guard. Prioritize nested task/payload objects and booleans still normalized with generic truthiness; preserve the established pattern of focused RED verifier, minimal boundary narrowing, focused regression, typecheck, and periodic build checkpoint.

## New Thread Starter Prompt

Please read `G:\Personal-AI\DailyTodo\app\codex_handoff.md`, then continue optimizing from Phase 283 in fast batch mode. Do not revert unrelated changes. Do not run git add/commit/push unless explicitly asked.

## Phase 284 Files Changed

- `electron/aiReviewTaskPayload.ts`
  - New shared recursive runtime guard for AI Review `ElectronTask[]` payloads, including optional carried-task fields and completion-review entries.
- `electron/aiReviewDailyRunInspectIpc.ts`
  - Daily run now imports the shared task-payload guard instead of owning a local copy.
- `electron/aiReviewWeeklyReportIpc.ts`
  - Weekly report task payload is now `unknown`.
  - Malformed payloads return `{ ok: false, error: 'AI Review tasks contain malformed entries.' }` before preflight/source/stat/report work.
  - Validated tasks flow directly into `computeRangeStats(...)`.
- `electron/aiReviewMonthlyReportIpc.ts`
  - Monthly report task payload is now `unknown`.
  - Malformed payloads short-circuit before preflight/source/stat/report work.
  - Validated tasks flow directly into `computeRangeStats(...)`.
- `electron/aiReviewBackfillIpc.ts`
  - Backfill task payload is now `unknown`.
  - Malformed payloads return the existing processed/filled/errors result shape before backfill work.
  - Validated tasks flow directly to `tasksForDate`.
- Focused verifiers updated:
  - `scripts/verify-electron-ai-review-daily-run-inspect-ipc-module.ts`
  - `scripts/verify-electron-ai-review-weekly-report-ipc-module.ts`
  - `scripts/verify-electron-ai-review-monthly-report-ipc-module.ts`
  - `scripts/verify-electron-ai-review-backfill-ipc-module.ts`

## Phase 284 Verification

RED confirmed before implementation:
- `npm.cmd run verify:electron-ai-review-daily-run-inspect-ipc-module` failed because the shared task-payload guard module did not exist.
- `npm.cmd run verify:electron-ai-review-weekly-report-ipc-module` failed because the shared task-payload guard module did not exist.
- `npm.cmd run verify:electron-ai-review-monthly-report-ipc-module` failed because the shared task-payload guard module did not exist.
- `npm.cmd run verify:electron-ai-review-backfill-ipc-module` failed because the shared task-payload guard module did not exist.

Passed after implementation:
- `npm.cmd run verify:electron-ai-review-daily-run-inspect-ipc-module`
- `npm.cmd run verify:electron-ai-review-weekly-report-ipc-module`
- `npm.cmd run verify:electron-ai-review-monthly-report-ipc-module`
- `npm.cmd run verify:electron-ai-review-backfill-ipc-module`
- `npm.cmd run verify:electron-ai-review-ipc-module`
- `npm.cmd exec -- tsx scripts/verify-ai-regenerate-force.ts`
- `npm.cmd run typecheck`
- `npm.cmd run build`

## Recommended Next Seam Candidates

Continue scanning remaining Electron/preload APIs for `kind`, `key`, or small string-union parameters that still trust renderer input. Good candidates include `store:get` / `store:set` key handling and AI Review external/source-material report `kind` parameters, but inspect current guards before choosing.

## New Thread Starter Prompt

Please read `G:\Personal-AI\DailyTodo\app\codex_handoff.md`, then continue optimizing from Phase 284 in fast batch mode. Do not revert unrelated changes. Do not run git add/commit/push unless explicitly asked.

## Phase 285 Files Changed

- `electron/aiReviewReportKind.ts`
  - New shared runtime guard for AI Review `weekly` / `monthly` report-kind payloads.
  - Exposes `AI_REVIEW_REPORT_KIND_ERROR`.
- `electron/aiReviewExternalReportIpc.ts`
  - `aiReview:generateExternal` now receives `kind: unknown`.
  - Malformed kinds return `{ ok: false, error: AI_REVIEW_REPORT_KIND_ERROR }` before settings, vault, source collection, or report generation.
- `electron/aiReviewSourceMaterialsIpc.ts`
  - `aiReview:testSourceMaterials` now receives `kind: unknown`.
  - Malformed kinds return `{ ok: false, error: AI_REVIEW_REPORT_KIND_ERROR, sources: [] }` before vault/source work.
- `electron/preload.ts` and `src/vite-env.d.ts`
  - `aiReview.generateExternal(...)` and `aiReview.testSourceMaterials(...)` expose report kind inputs as `unknown`.
- Focused verifiers updated:
  - `scripts/verify-electron-ai-review-external-report-ipc-module.ts`
  - `scripts/verify-electron-ai-review-source-materials-ipc-module.ts`

## Phase 285 Verification

RED confirmed before implementation:
- `npm.cmd run verify:electron-ai-review-external-report-ipc-module` failed because the shared report-kind guard module did not exist.
- `npm.cmd run verify:electron-ai-review-source-materials-ipc-module` failed because the shared report-kind guard module did not exist.

Passed after implementation:
- `npm.cmd run verify:electron-ai-review-external-report-ipc-module`
- `npm.cmd run verify:electron-ai-review-source-materials-ipc-module`
- `npm.cmd run verify:electron-ai-review-ipc-module`
- `npm.cmd run verify:electron-main-window-bootstrap-module`
- `npm.cmd exec -- tsx scripts/verify-ai-regenerate-force.ts`
- `npm.cmd run typecheck`
- `npm.cmd run build`

## Phase 286 Files Changed

- `electron/settingsIpc.ts`
  - `store:get` now receives `key: unknown`.
  - Non-string keys return `undefined` before Electron Store reads.
  - `store:set` now receives `key: unknown`.
  - Non-string keys return early before Electron Store writes or task-change broadcast checks.
- `electron/preload.ts` and `src/vite-env.d.ts`
  - `getStore(...)` and `setStore(...)` expose store keys as runtime `unknown`.
- `scripts/verify-electron-settings-ipc-module.ts`
  - Added focused contract assertions for store key narrowing across IPC, preload, and ambient types.

## Phase 286 Verification

RED confirmed before implementation:
- `npm.cmd run verify:electron-settings-ipc-module` failed because `store:get` still typed `key` as `string`.

Passed after implementation:
- `npm.cmd run verify:electron-settings-ipc-module`
- `npm.cmd run verify:electron-main-window-bootstrap-module`
- `npm.cmd run typecheck`
- `npm.cmd run build`

## Recommended Next Seam Candidates

Continue scanning remaining Electron/preload APIs for listener payloads and small typed parameters that still overstate trust at runtime. Good candidates to inspect next include `onWindowModeChanged(...)` and `aiReview.onProgress(...)` ambient callback payload types, but verify whether the main process already normalizes emitted values before changing the public surface.

## New Thread Starter Prompt

Please read `G:\Personal-AI\DailyTodo\app\codex_handoff.md`, then continue optimizing from Phase 287 in fast batch mode. Do not revert unrelated changes. Do not run git add/commit/push unless explicitly asked.

## Phase 288 Files Changed

- `electron/preload.ts`
  - `onWindowModeChanged(...)` now forwards mode payloads as `unknown`.
- `src/vite-env.d.ts`
  - ambient `onWindowModeChanged(...)` and `aiReview.onProgress(...)` expose callback payloads as `unknown`.
- `shared/aiReview/runDiagnostics.ts`
  - added `isAiReviewProgressEvent(...)` runtime guard.
- `src/components/SettingsPanel.tsx`
  - narrows progress payloads before storing them as generation progress state.
- Focused verifiers updated/calibrated:
  - `scripts/verify-electron-window-ipc-module.ts`
  - `scripts/verify-ai-run-diagnostics.ts`
  - `scripts/verify-ai-progress-ui.ts`

## Phase 288 Verification

RED confirmed before implementation:
- `npm.cmd run verify:electron-window-ipc-module` failed because preload still typed mode as `string`.
- `npm.cmd run verify:ai-run-diagnostics` failed because ambient still claimed trusted progress events and the progress guard did not exist.

Passed after implementation:
- `npm.cmd run verify:electron-window-ipc-module`
- `npm.cmd run verify:ai-run-diagnostics`
- `npm.cmd run verify:ai-progress-ui`
- `npm.cmd run verify:electron-main-window-bootstrap-module`
- `npm.cmd run typecheck`
- `npm.cmd run build`

## Recommended Next Seam Candidates

Continue scanning remaining ambient return values and optional listener APIs that still overstate trust:
- ambient result types that claim strongly typed objects from IPC (`getAppSettings`, `getCompanionSettings`, `getSections`, etc.) while runtime still depends on main-process normalization
- any remaining preload listeners that use loose but non-`unknown` payload types
- optional store-key allowlisting remains higher blast radius and should stay separate

## New Thread Starter Prompt

Please read `G:\Personal-AI\DailyTodo\app\codex_handoff.md`, then continue optimizing from Phase 288 in fast batch mode. Do not revert unrelated changes. Do not run git add/commit/push unless explicitly asked.

## Phase 289 Files Changed

- `src/hooks/taskTransforms.ts`
  - added recursive `isTaskLike(...)` and `parseStoredTasks(...)` for store/broadcast task payloads.
- `src/hooks/taskHookState.ts`
  - `normalizeIncomingTasks(...)` now parses unknown payloads before normalization.
- `src/store/taskStore.ts`
  - `loadTasks()` returns `parseStoredTasks(tasks)` instead of casting store values to `Task[]`.
- `scripts/verify-task-hook-state.ts`
  - added RED/GREEN coverage for malformed task filtering and store-load parser ownership.

## Phase 289 Verification

RED confirmed before implementation:
- `npm.cmd run verify:task-hook-state` failed because `null`/malformed entries were cast into `normalizeTask(...)`.

Passed after implementation:
- `npm.cmd run verify:task-hook-state`
- `npm.cmd run verify:task-mutations`
- `npm.cmd run verify:task-carryover`
- `npm.cmd run typecheck`
- `npm.cmd run build`

## Recommended Next Seam Candidates

Continue renderer-side store value narrowing for remaining casts such as:
- `selectedDate` / `activeTab` / carryover ledger / retained reviews in `taskPersistence.ts`
- personalization and UI-state store reads that still use broad `as` casts
- keep ambient IPC return-type overtrust as a separate later pass if needed

## New Thread Starter Prompt

Please read `G:\Personal-AI\DailyTodo\app\codex_handoff.md`, then continue optimizing from Phase 289 in fast batch mode. Do not revert unrelated changes. Do not run git add/commit/push unless explicitly asked.

## Phase 290 Files Changed

- `src/hooks/taskPersistence.ts`
  - added runtime parsers for date keys, active tabs, string records, carryover ledgers, task list order, and retained Obsidian reviews.
  - `loadInitialTaskState()` now parses all of those store values before hydration.
- `src/hooks/useTasks.ts`
  - business-date rollover parses carryover ledger store values with `parseStoredCarryoverLedger(...)`.
- `scripts/verify-task-persistence.ts`
  - new focused RED/GREEN coverage for task UI store parsers and ownership.
- `package.json`
  - added `verify:task-persistence` and included it in `verify:task-core`.

## Phase 290 Verification

RED confirmed before implementation:
- `npm.cmd run verify:task-persistence` failed because the store parsers did not exist and casts remained.

Passed after implementation:
- `npm.cmd run verify:task-persistence`
- `npm.cmd run verify:task-carryover`
- `npm.cmd run verify:task-list-interactions`
- `npm.cmd run typecheck`
- `npm.cmd run build`

## Recommended Next Seam Candidates

Continue renderer-side store value narrowing for remaining casts such as:
- personalization store reads in `src/app/appPersonalization.ts`
- UI-state store reads in `src/app/appUiStatePersistence.ts`
- any remaining ambient IPC return-type overtrust as a separate later pass

## New Thread Starter Prompt

Please read `G:\Personal-AI\DailyTodo\app\codex_handoff.md`, then continue optimizing from Phase 290 in fast batch mode. Do not revert unrelated changes. Do not run git add/commit/push unless explicitly asked.

## Phase 291 Files Changed

- `src/app/appPersonalization.ts`
  - field-level `normalizeLoadedPersonalization(...)`
  - `parseStoredThemeOpacityOverrides(...)` for stored theme override maps
  - themeId memory no longer uses `as string`
- `src/app/appUiStatePersistence.ts`
  - open flags require `value === true`
  - search query accepts only strings
- Focused verifiers updated:
  - `scripts/verify-app-personalization-module.ts`
  - `scripts/verify-app-ui-state-persistence-module.ts`

## Phase 291 Verification

RED confirmed before implementation:
- `npm.cmd run verify:app-personalization-module` failed because personalization still cast store payloads.
- `npm.cmd run verify:app-ui-state-persistence-module` failed because UI store values still used `Boolean(...)` / `as string`.

Passed after implementation:
- `npm.cmd run verify:app-personalization-module`
- `npm.cmd run verify:app-ui-state-persistence-module`
- `npm.cmd run typecheck`
- `npm.cmd run build`

## Recommended Next Seam Candidates

Continue scanning remaining renderer casts and ambient return-type overtrust:
- `src/app/appTemplateEditor.ts` template casts
- any remaining store reads still using broad `as`
- ambient IPC return types that claim strongly typed main-process results without local renderer guards

## New Thread Starter Prompt

Please read `G:\Personal-AI\DailyTodo\app\codex_handoff.md`, then continue optimizing from Phase 291 in fast batch mode. Do not revert unrelated changes. Do not run git add/commit/push unless explicitly asked.

## Phase 292 Files Changed

- `src/components/TaskMenuPopup.tsx`
  - added `parseTaskMenuPopupPayload(...)`
  - validated popup bootstrap tasks with `isTaskLike(...)`
  - string-filtered tags and boolean-only dark mode
- `scripts/verify-context-menu.ts`
  - structural and runtime coverage for popup payload parsing

## Phase 292 Verification

Passed after implementation:
- `npm.cmd run verify:context-menu`
- `npm.cmd run verify:app-task-menu-actions-module`
- `npm.cmd run typecheck`
- `npm.cmd run build`

## Phase 293 Files Changed

- `src/app/appTemplateEditor.ts`
  - removed `Partial<ObsidianTemplateSettings>` cast
  - structural daily/report narrowing in `applyTemplateUpdate(...)`
- `scripts/verify-app-template-editor-module.ts`
  - runtime coverage for matched/mismatched template updates

## Phase 293 Verification

Passed after implementation:
- `npm.cmd run verify:app-template-editor-module`
- `npm.cmd run typecheck`
- `npm.cmd run build`

## Recommended Next Seam Candidates

Continue scanning remaining renderer casts and ambient return-type overtrust:
- `SettingsPanel` diagnostic cast on external report results
- DOM/event target casts that still affect trusted app state
- ambient IPC return types that claim strongly typed main-process results without local renderer guards

## New Thread Starter Prompt

Please read `G:\Personal-AI\DailyTodo\app\codex_handoff.md`, then continue optimizing from Phase 293 in fast batch mode. Do not revert unrelated changes. Do not run git add/commit/push unless explicitly asked.

## Phase 294 Files Changed

- `shared/aiReview/runDiagnostics.ts`
  - added `isAiReviewRunDiagnostic(...)`
  - added `readAiReviewRunDiagnostic(...)`
- `src/components/SettingsPanel.tsx`
  - daily and non-daily generation paths store only validated diagnostics
- `scripts/verify-ai-run-diagnostics.ts`
  - runtime and SettingsPanel ownership coverage for diagnostic narrowing

## Phase 294 Verification

Passed after implementation:
- `npm.cmd run verify:ai-run-diagnostics`
- `npm.cmd run verify:ai-progress-ui`
- `npm.cmd run verify:settings-ai-review-manual-generation-section`
- `npm.cmd run typecheck`
- `npm.cmd run build`

## Recommended Next Seam Candidates

Continue scanning remaining renderer casts and ambient return-type overtrust:
- settings select/event target casts that write app/AI settings state (`AppLanguage`, source modes, provider enums)
- ambient IPC return types that claim strongly typed main-process results without local renderer guards
- any remaining store reads still using broad `as`

## New Thread Starter Prompt

Please read `G:\Personal-AI\DailyTodo\app\codex_handoff.md`, then continue optimizing from Phase 294 in fast batch mode. Do not revert unrelated changes. Do not run git add/commit/push unless explicitly asked.

## Phase 287 Files Changed

- `electron/preload.ts`
  - `previewCompanionSync(...)` and `writeCompanionSync(...)` now accept `items: unknown`.
- `src/vite-env.d.ts`
  - ambient Companion sync APIs expose item inputs as runtime `unknown` instead of `unknown[]`.
- `scripts/verify-electron-companion-ipc-module.ts`
  - Added focused contract assertions rejecting ambient/preload claims that Companion items are already arrays.

## Phase 287 Verification

RED confirmed before implementation:
- Companion ambient/preload still advertised `items: unknown[]` while the planner treated items as `unknown`.

Passed after implementation:
- `npm.cmd run verify:electron-companion-ipc-module`
- `npm.cmd run typecheck`
- `npm.cmd run build`
- `npm.cmd run verify:companion`

## Recommended Next Seam Candidates

Next focus: ambient listener payload overtrust.
- `onWindowModeChanged(callback: (mode: WindowMode) => void)` still claims a trusted window mode at the ambient boundary while preload already treats the IPC event payload more loosely.
- `aiReview.onProgress(callback: (payload: AiReviewProgressEvent) => void)` still claims a trusted progress event at the ambient boundary while preload already forwards `unknown`.
- Prefer keeping main-process emitters normalized, making ambient/preload honest with `unknown`, and narrowing only at renderer consumers that need typed state.

## New Thread Starter Prompt

Please read `G:\Personal-AI\DailyTodo\app\codex_handoff.md`, then continue optimizing from Phase 287 in fast batch mode. Do not revert unrelated changes. Do not run git add/commit/push unless explicitly asked.

## Phase 295 Files Changed

- `shared/appSettings.ts`
  - exported `isAppLanguage(...)`
- `shared/aiReview/aiReviewSettings.ts`
  - exported `isAiProvider(...)`
- `src/components/settings/GeneralSettingsSection.tsx`
  - language select ignores invalid values via `isAppLanguage(...)`
- `src/components/settings/AiReviewSourceSettingsSection.tsx`
  - source selects use shared weekly/monthly normalizers
- `src/components/settings/AiReviewSettingsWidgets.tsx`
  - provider select ignores invalid values via `isAiProvider(...)`
- `scripts/verify-settings-basic-sections.ts`
- `scripts/verify-settings-ai-review-source-section.ts`
- `scripts/verify-settings-ai-review-module.ts`
  - assert runtime guards instead of enum casts

## Phase 295 Verification

Passed after implementation:
- `npm.cmd run verify:settings-basic-sections`
- `npm.cmd run verify:settings-ai-review-source-section`
- `npm.cmd run verify:settings-ai-review-module`
- `npm.cmd run verify:ai-settings`
- `npm.cmd run typecheck`
- `npm.cmd run build`

## Recommended Next Seam Candidates

Continue scanning remaining renderer select/event casts and ambient return-type overtrust:
- task priority filter select (`event.target.value as PriorityFilter`)
- completion-review status selects
- Companion write-mode select
- template render-type selects
- ambient IPC return types that claim strongly typed main-process results without local renderer guards

## New Thread Starter Prompt

Please read `G:\Personal-AI\DailyTodo\app\codex_handoff.md`, then continue optimizing from Phase 295 in fast batch mode. Do not revert unrelated changes. Do not run git add/commit/push unless explicitly asked.

## Phase 296 Files Changed

- `src/app/appTaskView.ts`
  - added `isPriorityFilter(...)`
- `src/components/taskList/TaskListToolbar.tsx`
  - priority select ignores invalid values via `isPriorityFilter(...)`
  - re-exports `PriorityFilter` from appTaskView
- `src/app/appUiStatePersistence.ts`
  - store hydration reuses `isPriorityFilter(...)`
- `scripts/verify-task-list-interactions.ts`
- `scripts/verify-app-task-view-module.ts`
- `scripts/verify-app-ui-state-persistence-module.ts`
  - require shared runtime guard instead of cast/inline checks

## Phase 296 Verification

Passed after implementation:
- `npm.cmd run verify:task-list-interactions`
- `npm.cmd run verify:app-task-view-module`
- `npm.cmd run verify:app-ui-state-persistence-module`
- `npm.cmd run typecheck`
- `npm.cmd run build`

## Recommended Next Seam Candidates

Continue scanning remaining renderer select/event casts and ambient return-type overtrust:
- completion-review status selects (`TaskCompletionDialog`, `ReviewView`)
- Companion write-mode select
- template render-type selects
- ambient IPC return types that claim strongly typed main-process results without local renderer guards

## New Thread Starter Prompt

Please read `G:\Personal-AI\DailyTodo\app\codex_handoff.md`, then continue optimizing from Phase 296 in fast batch mode. Do not revert unrelated changes. Do not run git add/commit/push unless explicitly asked.

## Phase 297 Files Changed

- `shared/completionReviews.ts`
  - added `TaskCompletionReviewStatus`
  - added `isTaskCompletionReviewStatus(...)`
- `src/components/TaskCompletionDialog.tsx`
  - status select ignores invalid values via the shared guard
- `src/components/ReviewView.tsx`
  - edit status select ignores invalid values via the shared guard
- `scripts/verify-review-empty-fields.ts`
  - runtime and ownership coverage for status narrowing

## Phase 297 Verification

Passed after implementation:
- `npm.cmd run verify:review-fields`
- `npm.cmd run typecheck`
- `npm.cmd run build`

## Recommended Next Seam Candidates

Continue scanning remaining renderer select/event casts and ambient return-type overtrust:
- Companion write-mode select (`event.target.value as WriteMode`)
- template render-type selects
- ambient IPC return types that claim strongly typed main-process results without local renderer guards

## New Thread Starter Prompt

Please read `G:\Personal-AI\DailyTodo\app\codex_handoff.md`, then continue optimizing from Phase 297 in fast batch mode. Do not revert unrelated changes. Do not run git add/commit/push unless explicitly asked.

## Phase 298 Files Changed

- `shared/obsidianCompanion.ts`
  - added `isWriteMode(...)`
- `src/components/ObsidianCompanionPanel.tsx`
  - write-mode select ignores invalid values via `isWriteMode(...)`
- `electron/obsidianCompanion.ts`
  - rule validation reuses `isWriteMode(...)`
- `electron/appStateAccessors.ts`
  - companion settings normalization reuses `isWriteMode(...)`
- `electron/obsidianCompanion.verify.ts`
  - runtime and UI ownership coverage for write-mode narrowing

## Phase 298 Verification

Passed after implementation:
- `npm.cmd run verify:companion`
- `npm.cmd run verify:electron-app-state-accessors-module`
- `npm.cmd run verify:electron-companion-ipc-module`
- `npm.cmd run typecheck`
- `npm.cmd run build`

## Recommended Next Seam Candidates

Continue scanning remaining renderer select/event casts and ambient return-type overtrust:
- template render-type selects (`TemplateEditorModal`, `TemplateRecognitionModal`)
- ambient IPC return types that claim strongly typed main-process results without local renderer guards (`getAppSettings`, `getCompanionSettings`, `getSections`)
- any remaining store/select casts that still write trusted app state

## New Thread Starter Prompt

Please read `G:\Personal-AI\DailyTodo\app\codex_handoff.md`, then continue optimizing from Phase 298 in fast batch mode. Do not revert unrelated changes. Do not run git add/commit/push unless explicitly asked.

## Phase 299 Files Changed

- `shared/aiReview/sectionConfig.ts`
  - added `isRenderType(...)`
- `src/components/TemplateEditorModal.tsx`
  - render-type select ignores invalid values via `isRenderType(...)`
- `src/components/TemplateRecognitionModal.tsx`
  - recognized-block render-type select ignores invalid values via `isRenderType(...)`
- `scripts/verify-section-config.ts`
  - runtime and modal ownership coverage for render-type narrowing

## Phase 299 Verification

Passed after implementation:
- `npm.cmd run verify:section-config`
- `npm.cmd run typecheck`
- `npm.cmd run build`

## Recommended Next Seam Candidates

Continue scanning remaining renderer casts and ambient return-type overtrust:
- ambient IPC return types that claim strongly typed main-process results without local renderer guards (`getAppSettings`, `getCompanionSettings`, `getSections`)
- any remaining store/select casts that still write trusted app state
- template kind casts only if they affect persisted template settings meaningfully

## New Thread Starter Prompt

Please read `G:\Personal-AI\DailyTodo\app\codex_handoff.md`, then continue optimizing from Phase 299 in fast batch mode. Do not revert unrelated changes. Do not run git add/commit/push unless explicitly asked.

## Phase 300 Files Changed

- `shared/obsidianCompanion.ts`
  - added `isCompanionTemplate(...)` and `isCompanionRule(...)`
- `shared/obsidianCompanionDefaults.ts`
  - added shared `normalizeCompanionSettings(...)`
- `electron/appStateAccessors.ts`
  - reuses shared Companion settings normalization
- `src/vite-env.d.ts`
  - ambient settings getters/reset return `Promise<unknown>`
- `src/store/taskStore.ts`
  - normalizes app/template/companion settings on read
- `src/components/SettingsPanel.tsx`
  - normalizes AI Review settings before state write
- `src/app/appAiReviewLifecycle.ts`
  - normalizes AI Review settings before startup/onboarding side effects
- `src/app/appStartupSettings.ts`
  - simplified template settings load after trusted wrappers
- `src/app/appObsidianTemplateActions.ts`
  - reset path trusts normalized template settings
- focused IPC/startup/lifecycle verifiers updated for the new contracts

## Phase 300 Verification

Passed after implementation:
- `npm.cmd run verify:electron-settings-ipc-module`
- `npm.cmd run verify:electron-companion-ipc-module`
- `npm.cmd run verify:electron-ai-review-settings-sections-ipc-module`
- `npm.cmd run verify:electron-app-state-accessors-module`
- `npm.cmd run verify:app-startup-settings-module`
- `npm.cmd run verify:app-ai-review-lifecycle-module`
- `npm.cmd run verify:companion`
- `npx.cmd tsc --noEmit -p tsconfig.json`
- `npm.cmd run build`

## Recommended Next Seam Candidates

Continue scanning remaining ambient return-type overtrust and renderer casts:
- AI Review setter return types still claim trusted settings/sections objects
- generation/result return objects still partially overtrusted at ambient boundary
- remaining DOM/event casts that write trusted app state
- any remaining store reads still using broad `as`

## New Thread Starter Prompt

Please read `G:\Personal-AI\DailyTodo\app\codex_handoff.md`, then continue optimizing from Phase 300 in fast batch mode. Do not revert unrelated changes. Do not run git add/commit/push unless explicitly asked.

## Phase 301 Files Changed

- `src/vite-env.d.ts`
  - `aiReview.setSettings` / `setSections` returns are now `Promise<unknown>`
- `scripts/verify-electron-ai-review-settings-sections-ipc-module.ts`
  - requires unknown setter returns and rejects trusted return claims

## Phase 301 Verification

Passed after implementation:
- `npm.cmd run verify:electron-ai-review-settings-sections-ipc-module`
- `npm.cmd run verify:ai-settings`
- `npx.cmd tsc --noEmit -p tsconfig.json`
- `npm.cmd run build`

## Recommended Next Seam Candidates

- AI Review generation/result ambient returns that still claim structured diagnostics/fields
- `setWindowMode` / other ambient returns that claim trusted enums/objects
- remaining renderer casts that write trusted app state

## New Thread Starter Prompt

Please read `G:\Personal-AI\DailyTodo\app\codex_handoff.md`, then continue optimizing from Phase 301 in fast batch mode. Do not revert unrelated changes. Do not run git add/commit/push unless explicitly asked.

## Phase 302 Files Changed

- `shared/aiReview/runDiagnostics.ts`
  - added `AiReviewGenerationResult` / `AiReviewDailyInspection`
  - added `readAiReviewGenerationResult(...)` / `readAiReviewDailyInspection(...)`
- `src/vite-env.d.ts`
  - generation/inspection ambient returns are now `Promise<unknown>`
- `src/components/SettingsPanel.tsx`
  - parses inspect/generation results before UI updates
- `src/app/appScheduledReports.ts`
  - scheduled report failures parse unknown generation results first
- `scripts/verify-ai-run-diagnostics.ts`
  - runtime and ownership coverage for the new readers and ambient contracts

## Phase 302 Verification

Passed after implementation:
- `npm.cmd run verify:ai-run-diagnostics`
- `npm.cmd run verify:ai-progress-ui`
- `npm.cmd run verify:settings-ai-review-manual-generation-section`
- `npm.cmd run verify:app-ai-review-lifecycle-module`
- `npx.cmd tsc --noEmit -p tsconfig.json`
- `npm.cmd run build`

## Recommended Next Seam Candidates

- remaining ambient returns still claiming structured trusted objects (`listModels`, `recognizeTemplate`, preview/sync plans, `setWindowMode`)
- remaining renderer casts that write trusted app state
- store/event seams still using broad `as`

## New Thread Starter Prompt

Please read `G:\Personal-AI\DailyTodo\app\codex_handoff.md`, then continue optimizing from Phase 302 in fast batch mode. Do not revert unrelated changes. Do not run git add/commit/push unless explicitly asked.

## Phase 303 Files Changed

- `shared/llm/openaiClient.ts`
  - added `readListModelsResult(...)`
- `src/vite-env.d.ts`
  - `aiReview.listModels` return is now `Promise<unknown>`
- `src/components/settings/AiReviewSettingsWidgets.tsx`
  - model-fetch path parses listModels results before UI updates
- focused verifiers for template-tools IPC, settings AI review module, and openai-client

## Phase 303 Verification

Passed after implementation:
- `npm.cmd run verify:electron-ai-review-template-tools-ipc-module`
- `npm.cmd run verify:settings-ai-review-module`
- `npm.cmd run verify:openai-client`
- `npx.cmd tsc --noEmit -p tsconfig.json`
- `npm.cmd run build`

## Recommended Next Seam Candidates

- remaining ambient returns still claiming structured trusted objects (`recognizeTemplate`, preview/sync plans, `setWindowMode`, `backfill`)
- remaining renderer casts that write trusted app state
- store/event seams still using broad `as`

## New Thread Starter Prompt

Please read `G:\Personal-AI\DailyTodo\app\codex_handoff.md`, then continue optimizing from Phase 303 in fast batch mode. Do not revert unrelated changes. Do not run git add/commit/push unless explicitly asked.

## Phase 304 Files Changed

- `shared/obsidianCompanion.ts`
  - added `isCaptureItem(...)`, `isSyncPlan(...)`, `readCompanionSyncPlan(...)`, `readCompanionWriteResult(...)`, `readCompanionMobileImportResult(...)`
- `src/vite-env.d.ts`
  - Companion preview/write/import returns are now `Promise<unknown>`
- `src/app/appCompanionActions.ts`
  - parses unknown IPC returns before plan/status/item side effects
- `electron/obsidianCompanion.ts`
  - reuses shared `isCaptureItem(...)`
- focused verifiers for Companion IPC and actions modules

## Phase 304 Verification

Passed after implementation:
- `npm.cmd run verify:electron-companion-ipc-module`
- `npm.cmd run verify:app-companion-actions-module`
- `npm.cmd run verify:app-companion-status-module`
- `npm.cmd run verify:app-companion-mobile-module`
- `npm.cmd run verify:companion`
- `npx.cmd tsc --noEmit -p tsconfig.json`
- `npm.cmd run build`

## Recommended Next Seam Candidates

- `previewTasksToObsidian` still claims trusted `SyncPreview`
- `setWindowMode` return still claims trusted `WindowMode`
- `aiReview.backfill` structured return
- `recognizeTemplate` / `recognizeReportTemplate` / `testSourceMaterials`
- remaining renderer casts that write trusted app state

## New Thread Starter Prompt

Please read `G:\Personal-AI\DailyTodo\app\codex_handoff.md`, then continue optimizing from Phase 304 in fast batch mode. Do not revert unrelated changes. Do not run git add/commit/push unless explicitly asked.

## Phase 305 Files Changed

- `shared/obsidianTemplates.ts`
  - added `isSyncPreview(...)` / `readSyncPreview(...)`
- `src/vite-env.d.ts`
  - `previewTasksToObsidian` return is now `Promise<unknown>`
- `src/store/taskStore.ts`
  - store wrapper parses preview returns with `readSyncPreview(...)`
- `src/app/appObsidianTemplateActions.ts`
  - action path revalidates preview returns before state writes
- focused verifiers for Obsidian IPC, template actions, and settings-sync

## Phase 305 Verification

Passed after implementation:
- `npm.cmd run verify:electron-obsidian-ipc-module`
- `npm.cmd run verify:app-obsidian-template-actions-module`
- `npm.cmd run verify:settings-sync`
- `npx.cmd tsc --noEmit -p tsconfig.json`
- `npm.cmd run build`

## Recommended Next Seam Candidates

- `setWindowMode` / `getWindowMode` returns still claim trusted `WindowMode`
- `aiReview.backfill` structured return
- `recognizeTemplate` / `recognizeReportTemplate` / `testSourceMaterials`
- remaining renderer casts that write trusted app state

## New Thread Starter Prompt

Please read `G:\Personal-AI\DailyTodo\app\codex_handoff.md`, then continue optimizing from Phase 305 in fast batch mode. Do not revert unrelated changes. Do not run git add/commit/push unless explicitly asked.

## Phase 306 Files Changed

- `shared/windowMode.ts`
  - added `readWindowMode(...)`
- `src/vite-env.d.ts`
  - `getWindowMode` / `setWindowMode` returns are now `Promise<unknown>`
- `src/components/TitleBar.tsx`
  - pin-state paths parse window-mode IPC/event payloads before UI updates
- focused verifiers for window IPC and window-mode

## Phase 306 Verification

Passed after implementation:
- `npm.cmd run verify:electron-window-ipc-module`
- `npm.cmd run verify:window-mode`
- `npx.cmd tsc --noEmit -p tsconfig.json`
- `npm.cmd run build`

## Recommended Next Seam Candidates

- `aiReview.backfill` structured return
- `recognizeTemplate` / `recognizeReportTemplate` / `testSourceMaterials`
- remaining renderer casts that write trusted app state
- remaining ambient structured returns (`syncTasksToObsidian`, openDailyNote, pickTemplateFile, etc.)

## New Thread Starter Prompt

Please read `G:\Personal-AI\DailyTodo\app\codex_handoff.md`, then continue optimizing from Phase 306 in fast batch mode. Do not revert unrelated changes. Do not run git add/commit/push unless explicitly asked.

## Phase 307 Files Changed

- `shared/aiReview/runDiagnostics.ts`
  - added `AiReviewBackfillReport` / `readAiReviewBackfillReport(...)`
- `src/vite-env.d.ts`
  - `aiReview.backfill` return is now `Promise<unknown>`
- `src/app/appAiReviewLifecycle.ts`
  - startup/daily backfill paths parse unknown IPC returns
- focused verifiers for backfill IPC, lifecycle, and run-diagnostics

## Phase 307 Verification

Passed after implementation:
- `npm.cmd run verify:electron-ai-review-backfill-ipc-module`
- `npm.cmd run verify:app-ai-review-lifecycle-module`
- `npm.cmd run verify:ai-run-diagnostics`
- `npx.cmd tsc --noEmit -p tsconfig.json`
- `npm.cmd run build`

## Recommended Next Seam Candidates

- `recognizeTemplate` / `recognizeReportTemplate` / `testSourceMaterials`
- remaining ambient structured returns (`syncTasksToObsidian`, openDailyNote, pickTemplateFile, setSettingsMode)
- remaining renderer casts that write trusted app state

## New Thread Starter Prompt

Please read `G:\Personal-AI\DailyTodo\app\codex_handoff.md`, then continue optimizing from Phase 307 in fast batch mode. Do not revert unrelated changes. Do not run git add/commit/push unless explicitly asked.

## Phase 308 Files Changed

- `shared/aiReview/recognizeTemplate.ts`
  - added `AiReviewRecognizeTemplateResult` / `readAiReviewRecognizeTemplateResult(...)`
- `shared/aiReview/recognizeReportTemplate.ts`
  - added `AiReviewRecognizeReportTemplateResult` / `readAiReviewRecognizeReportTemplateResult(...)`
- `shared/aiReview/sourceMaterials.ts`
  - added `AiReviewSourceMaterialsResult` / `readAiReviewSourceMaterialsResult(...)`
- `src/vite-env.d.ts`
  - `recognizeTemplate`, `recognizeReportTemplate`, and `testSourceMaterials` returns are now `Promise<unknown>`
- focused verifiers for template/tools IPC, source-materials IPC, recognize-template, recognize-report, and source-materials

## Phase 308 Verification

Passed after implementation:
- `npm.cmd run verify:electron-ai-review-template-tools-ipc-module`
- `npm.cmd run verify:electron-ai-review-source-materials-ipc-module`
- `npm.cmd run verify:recognize-template`
- `npm.cmd run verify:recognize-report`
- `npm.cmd run verify:source-materials`
- `npx.cmd tsc --noEmit -p tsconfig.json`
- `npm.cmd run build`

## Phase 309 Files Changed

- `shared/obsidianIpcResults.ts`
  - added browser-safe readers for Obsidian action results, path strings, and sync previews.
- `src/vite-env.d.ts`
  - Obsidian path/sync/preview/open returns now expose `Promise<unknown>`.
- `src/store/taskStore.ts`
  - parses sync/open/path/preview IPC returns before exposing typed wrappers.
- `src/app/appObsidianTemplateActions.ts`
  - parses preview returns before writing preview state.
- `scripts/verify-electron-obsidian-ipc-module.ts`
  - requires unknown ambient returns and reader usage for Obsidian sync/open paths.

## Phase 309 Verification

Passed after implementation:
- `npm.cmd run verify:electron-obsidian-ipc-module`
- `npm.cmd run verify:settings-sync`
- `npm.cmd run verify:app-obsidian-template-actions-module`
- `npx.cmd tsc --noEmit -p tsconfig.json`
- `npm.cmd run build`

## Recommended Next Seam Candidates

- remaining ambient structured returns (`syncTasksToObsidian`, `openDailyNote`, `pickTemplateFile`, `setSettingsMode`)
- `obsidianTemplate.recognize` result contract
- remaining renderer casts that write trusted app state

## New Thread Starter Prompt

Please read `G:\Personal-AI\DailyTodo\app\codex_handoff.md`, then continue optimizing from Phase 308 in fast batch mode. Do not revert unrelated changes. Do not run git add/commit/push unless explicitly asked.

## Phase 310 Files Changed

- `shared/obsidianTemplateRecognition.ts`
  - added `ObsidianTemplateRecognitionResult`, `TemplatePickerResult`, `readObsidianTemplateRecognitionResult(...)`, and `readTemplatePickerResult(...)`.
  - validates recognized draft module maps, unmapped sections, string arrays, preset ids, and picker fields before returning trusted shapes.
- `src/components/ObsidianTemplateCenter.tsx`
  - parses Obsidian template picker and recognition IPC returns before reading text, file names, errors, or recognized draft data.
  - surfaces malformed picker/recognition payloads as failure status instead of direct field reads.
- `src/vite-env.d.ts`
  - Obsidian template recognition/picker and AI Review template picker returns now expose `Promise<unknown>`.
- `scripts/verify-obsidian-template-recognition.ts`
  - covers recognition/picker result readers and compares parsed title against the parsed draft fixture.
- `scripts/verify-obsidian-template-ui.ts`
  - requires ambient `Promise<unknown>` returns and reader usage in the template center UI.

## Phase 310 Verification

Passed after implementation:
- `npm.cmd run verify:electron-obsidian-ipc-module`
- `npm.cmd run verify:electron-ai-review-template-tools-ipc-module`
- `npm.cmd run verify:obsidian-template-recognition`
- `npm.cmd run verify:obsidian-template-ui`
- `npm.cmd run typecheck`
- `npm.cmd run build`

## Recommended Next Seam Candidates

- remaining ambient structured setter returns (`setAppSettings`, `setObsidianTemplateSettings`, `setCompanionSettings`)
- boolean-return window/system APIs that still cross preload as runtime values
- remaining renderer casts that write trusted app state

## New Thread Starter Prompt

Please read `G:\Personal-AI\DailyTodo\app\codex_handoff.md`, then continue optimizing from Phase 310 in fast batch mode. Do not revert unrelated changes. Do not run git add/commit/push unless explicitly asked.

## Phase 311 Files Changed

- `src/vite-env.d.ts`
  - narrowed `setSettingsMode(...)` return from `Promise<{ ok: boolean; width?: number }>` to `Promise<unknown>` while preserving the existing `open: unknown` input.
- `scripts/verify-electron-window-ipc-module.ts`
  - requires the ambient settings-mode return to remain `Promise<unknown>` and rejects the old trusted `{ ok, width? }` result contract.
- `scripts/verify-settings-v2-window-mode.ts`
  - calibrated the focused settings-mode verifier to the current moduleized window implementation.
  - checks `createSettingsModeState(...)`, bootstrap injection, `windowIpc` ownership, strict `open === true`, width/min-size behavior, preload forwarding, ambient `Promise<unknown>`, and `syncSettingsMode(settingsOpen)` usage.

## Phase 311 Verification

Passed after implementation and verifier calibration:
- `npm.cmd run verify:settings-v2-window-mode`
- `npm.cmd run verify:electron-window-ipc-module`
- `npm.cmd run verify:app-shell-effects-module`
- `npm.cmd run typecheck`
- `npm.cmd run build`

Earlier Phase 311 RED/checkpoint failures:
- `npm.cmd run verify:electron-window-ipc-module` failed before the ambient fix because `setSettingsMode(...)` still claimed `Promise<{ ok: boolean; width?: number }>`.
- `npm.cmd run verify:settings-v2-window-mode` failed before calibration because it still asserted the old inline `main.ts` settings-mode shape.

## Recommended Next Seam Candidates

- boolean-return window/system APIs that still cross preload as runtime values
- remaining renderer casts that write trusted app state

## New Thread Starter Prompt

Please read `G:\Personal-AI\DailyTodo\app\codex_handoff.md`, then continue optimizing from Phase 311 in fast batch mode. Do not revert unrelated changes. Do not run git add/commit/push unless explicitly asked.

## Phase 312 Files Changed

- `src/vite-env.d.ts`
  - narrowed `setAppSettings(...)`, `setObsidianTemplateSettings(...)`, and `setCompanionSettings(...)` returns from `Promise<{ ok: boolean }>` to `Promise<unknown>`.
  - preserved the existing `settings: unknown` inputs for all three setters.
- `scripts/verify-electron-settings-ipc-module.ts`
  - requires app and Obsidian template settings setters to expose `Promise<unknown>` returns and rejects trusted `{ ok }` write-result contracts.
- `scripts/verify-electron-companion-ipc-module.ts`
  - requires Companion settings setter to expose a `Promise<unknown>` return and rejects the trusted `{ ok }` write-result contract.
- `scripts/verify-electron-app-state-accessors-module.ts`
  - calibrated the module wiring check to the current shared `normalizeCompanionSettings(...)` boundary instead of stale direct `createDefaultCompanionSettings` wiring.

## Phase 312 Verification

Passed after implementation and verifier calibration:
- `npm.cmd run verify:electron-settings-ipc-module`
- `npm.cmd run verify:electron-companion-ipc-module`
- `npm.cmd run verify:app-companion-actions-module`
- `npm.cmd run verify:app-obsidian-template-actions-module`
- `npm.cmd run verify:electron-app-state-accessors-module` (passed with escalation because it creates a temporary file-backed vault under Windows Temp)
- `npm.cmd run typecheck`
- `npm.cmd run build`

Earlier Phase 312 RED/checkpoint failures:
- `npm.cmd run verify:electron-settings-ipc-module` failed before the ambient fix because app and Obsidian template setters still claimed `Promise<{ ok: boolean }>`.
- `npm.cmd run verify:electron-companion-ipc-module` failed before the ambient fix because Companion settings setter still claimed `Promise<{ ok: boolean }>`.
- `npm.cmd run verify:electron-app-state-accessors-module` failed once in the restricted sandbox with `EPERM` while creating a Windows Temp directory; reran with escalation and passed.

## Phase 313 Files Changed

- `src/vite-env.d.ts`
  - narrowed `getAlwaysOnTop(...)`, `toggleAlwaysOnTop(...)`, `getLockWindowPosition(...)`, `setLockWindowPosition(...)`, `getWindowCompactMode(...)`, `getAutoStart(...)`, and `setAutoStart(...)` returns from `Promise<boolean>` to `Promise<unknown>`.
  - preserved existing runtime `unknown` setter inputs and kept `setWindowCompactMode(...)` as fire-and-forget `Promise<void>`.
- `src/components/settings/SettingsControls.tsx`
  - AutoStart initial load now writes state from `value === true`.
  - AutoStart setter response now writes state from the returned normalized enabled value instead of treating it as a trusted success flag.
- `scripts/verify-electron-window-ipc-module.ts`
  - requires the selected window/system boolean APIs to expose `Promise<unknown>` at the ambient boundary.
  - checks TitleBar / compact-mode / AutoStart consumers narrow unknown results before React state writes.

## Phase 313 Verification

Passed after implementation:
- `npm.cmd run verify:electron-window-ipc-module`
- `npm.cmd run verify:settings-panel-modules`
- `npm.cmd run verify:app-ui-state-persistence-module`
- `npm.cmd run verify:app-shell-effects-module`
- `npm.cmd run verify:window-mode`
- `npm.cmd run typecheck`
- `npm.cmd run build`

Earlier Phase 313 RED/checkpoint failure:
- `npm.cmd run verify:electron-window-ipc-module` failed before the ambient fix because `getAlwaysOnTop(...)` still claimed `Promise<boolean>`.

## Phase 314 Files Changed

- `scripts/verify-section-config.ts`
  - requires `TemplateRecognitionModal` to narrow `FileReader.result` before writing template-recognition text state.
  - rejects the old `result as string` cast.
- `src/components/TemplateRecognitionModal.tsx`
  - reads `ev.target?.result` into `fileText` and calls `setText(typeof fileText === 'string' ? fileText : '')`.

## Phase 314 Verification

RED:
- `npm.cmd run verify:section-config` failed before the fix because `FileReader.result` was still cast with `result as string`.

Passed after implementation:
- `npm.cmd run verify:section-config`
- `npm.cmd run verify:recognize-template`
- `npm.cmd run verify:recognize-report`
- `npm.cmd run typecheck`
- `npm.cmd run build`

## Speed Mode Adjustment

- User asked to speed up after the long optimization pass.
- Next work should batch similar low-risk renderer casts/runtime-boundary fixes together, keep docs terse, and use focused verifier batches with `typecheck` / `build` as checkpoints rather than after every tiny seam.

## Phase 315 Files Changed

- `src/components/TemplateEditorModal.tsx`
  - Added `isReportTemplateKind(...)`; reset now calls `createDefaultReportTemplate(kind)` only after narrowing instead of `kind as ReportTemplateKind`.
- `shared/aiReview/aiReviewSettings.ts`
  - Added exported `isWeeklySourceMode(...)` / `isMonthlySourceMode(...)`; normalizers now use guards instead of `value as ...` casts.
- `shared/obsidianCompanionDefaults.ts`
  - Added an `isRecord(...)` guard; settings normalization reads runtime values as `Record<string, unknown>` instead of `Partial<CompanionSettings>`.
- `src/utils/taskOrdering.ts`
  - Exported `isTaskSource(...)`; task-order cleanup filters object keys through the guard instead of casting `Object.keys(...)`.
- Focused verifiers updated for the four boundaries.

## Phase 315 Verification

RED / checkpoint:
- `npm.cmd run verify:app-template-editor-module` failed before fix on missing report-kind reset guard.
- `npm.cmd run verify:ai-settings` failed before fix because source-mode guards were not exported.
- `npm.cmd run verify:task-ordering-state` failed before fix because `isTaskSource` was not exported and keys were still cast.
- `npm.cmd run verify:companion` initially hit sandbox `EPERM` creating Windows Temp before reaching the new assertion.

Passed:
- `npm.cmd run verify:app-template-editor-module`
- `npm.cmd run verify:ai-settings`
- `npm.cmd run verify:task-ordering-state`
- `npm.cmd run verify:companion` with approved escalation for Windows Temp access
- `npm.cmd run typecheck`

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314)

## Phase 316 Files Changed

- `shared/aiReview/markers.ts`
  - Added canonical `REVIEW_MARKER_KEYS` for typed marker-key iteration.
- `shared/aiReview/sectionConfig.ts`
  - Added `isReviewMarkerKey(...)`, canonical `RENDER_TYPES`, and local `isFixedBlockId(...)`.
  - Normalizers now read runtime records through guards instead of `Partial` / `any` / marker-key casts.
  - Daily block-order normalization narrows fixed/custom ids before pushing typed order items.
- `shared/aiReview/recognizeTemplate.ts`
  - Parsed JSON now goes through record/array/confidence/marker-key guards before becoming `SectionConfig[]`.
- `shared/aiReview/fuzzyMatch.ts`
  - Iterates `REVIEW_MARKER_KEYS` instead of casting `Object.keys(SYNONYMS)`.
- `shared/templateRenderer.ts`
  - Iterates `REVIEW_MARKER_KEYS` instead of casting `Object.entries(BLOCK_KEYWORDS)`.
- `src/components/TemplateEditorModal.tsx`
  - Uses `RENDER_TYPES.map(...)` for render-type options and removes the report-template custom-block cast.
- `src/components/TemplateRecognitionModal.tsx`
  - Uses `RENDER_TYPES.map(...)` for render-type options.
- Focused verifiers updated for the batch.

## Phase 316 Verification

RED / checkpoint:
- `npm.cmd run verify:section-config` failed before fix because `RENDER_TYPES` / marker-key guards were missing and casts remained.
- `npm.cmd run verify:recognize-template` failed before fix because parsed JSON was still cast to records/arrays.
- `npm.cmd run verify:fuzzy-match` failed before fix because fuzzy matching cast `Object.keys(SYNONYMS)`.
- `npm.cmd run verify:daily-template-markers` failed before fix because template rendering cast `Object.entries(BLOCK_KEYWORDS)`.
- `npm.cmd run typecheck` failed once after the initial implementation because daily block-order `id` needed `isFixedBlockId(...)` narrowing.

Passed:
- `npm.cmd run verify:section-config`
- `npm.cmd run verify:recognize-template`
- `npm.cmd run verify:fuzzy-match`
- `npm.cmd run verify:daily-template-markers`
- `npm.cmd run verify:app-template-editor-module`
- `npm.cmd run verify:recognize-report`
- `npm.cmd run verify:obsidian-template-center`
- `npm.cmd run typecheck`

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314)

## Recommended Next Seam Candidates

- Continue batching small renderer/shared/Electron casts that write trusted app state.
- Good next scan: `rg -n " as " src shared electron | rg -v " as const|import type|type "` and pick a tight cluster with focused verifiers.
- Possible next clusters: `shared/obsidianTemplates.ts` / `shared/obsidianTemplateCenter.ts` object-build casts, or renderer DOM/event casts if they write state.
- Keep using focused verifier batches plus `typecheck`; run `build` every few phases or for broader shared/UI changes.

## New Thread Starter Prompt

Please read `G:\Personal-AI\DailyTodo\app\codex_handoff.md`, then continue optimizing from Phase 323 in faster batch mode. Group similar low-risk renderer/shared/Electron runtime narrowing fixes, keep docs terse, do not revert unrelated changes, and do not run git add/commit/push unless explicitly asked.

## Phase 317 Files Changed

- `electron/aiReviewTemplateToolsIpc.ts`
  - Added a local `isRecord(...)` guard.
  - Model-list config now narrows runtime `cfg` before reading `baseUrl`, `apiKey`, and `provider`.
- `electron/aiReviewDailyRunner.ts`
  - Removed the downstream `tasks as StatTask[]` cast; validated `ElectronTask[]` tasks flow directly into `runReviewForFile(...)`.
- Focused verifiers updated:
  - `scripts/verify-electron-ai-review-template-tools-ipc-module.ts`
  - `scripts/verify-electron-ai-review-daily-runner-module.ts`

## Phase 317 Verification

RED / checkpoint:
- `npm.cmd run verify:electron-ai-review-template-tools-ipc-module` failed before fix because model-list config still used `cfg as { ... }`.
- `npm.cmd run verify:electron-ai-review-daily-runner-module` failed before fix because daily runner still used `tasks as StatTask[]`.
- The daily-runner verifier hit sandbox `EPERM` creating a Windows Temp directory when run without escalation.

Passed:
- `npm.cmd run verify:electron-ai-review-template-tools-ipc-module`
- `npm.cmd run verify:electron-ai-review-daily-runner-module` with approved escalation for Windows Temp access
- `npm.cmd run typecheck`

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314)

## Phase 318 Files Changed

- `shared/appSettings.ts`
  - `readStringSetting(...)` now narrows indexed values before returning strings.
  - Obsidian template settings normalization uses the existing object guard instead of a record cast.
- `shared/obsidianTemplateCenter.ts`
  - `normalizeTemplateModules(...)` now seeds from `createDefaultModules()` and overwrites narrowed module fields without an empty-object accumulator cast.
- `shared/obsidianTemplates.ts`
  - Legacy compat reads now use local record/string/boolean helpers.
  - Legacy `modules.*.enabled`, old section-title fields, task-line/review templates, and daily markdown template remain supported without `any` casts.
  - Fixed/custom block fallback titles now use typed helper lookups.
- Focused verifiers updated:
  - `scripts/verify-obsidian-template-center.ts`
  - `scripts/verify-daily-template-markers.ts`

## Phase 318 Verification

RED / checkpoint:
- `npm.cmd run verify:obsidian-template-center` failed before fix because template module normalization still used `{} as ObsidianTemplateModules`.
- `npm.cmd run verify:daily-template-markers` failed before fix because `shared/obsidianTemplates.ts` still used `const a = t as any`.

Passed:
- `npm.cmd run verify:obsidian-template-center`
- `npm.cmd run verify:daily-template-markers`
- `npm.cmd run verify:template-source-settings`
- `npm.cmd run typecheck`

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314)

## Current Notes

- Continue fast batch mode. Prefer scanning remaining casts with `rg -n " as " src shared electron | rg -v " as const|import type|type "` and taking one tight low-risk cluster at a time.
- Do not run `git add`, commit, push, or PR unless explicitly asked.
- Do not claim the whole optimization is complete.

## Phase 319 Files Changed

- `shared/llm/openaiClient.ts`
  - Added a local object-record guard.
  - `readListModelsResult(...)` now narrows unknown runtime results before reading `ok`, `models`, or `error`.
- `shared/aiReview/runDiagnostics.ts`
  - Moved/reused `isObject(...)` before the progress-event guard.
  - `isAiReviewProgressEvent(...)` now narrows unknown runtime progress payloads before field reads.
- Focused verifiers updated:
  - `scripts/verify-openai-client.ts`
  - `scripts/verify-ai-run-diagnostics.ts`

## Phase 319 Verification

RED / checkpoint:
- `npm.cmd run verify:openai-client` failed before fix because `readListModelsResult(...)` still cast `value as Record<string, unknown>`.
- `npm.cmd run verify:ai-run-diagnostics` failed before fix because `isAiReviewProgressEvent(...)` still cast `value as Record<string, unknown>`.

Passed:
- `npm.cmd run verify:openai-client`
- `npm.cmd run verify:ai-run-diagnostics`
- `npm.cmd run typecheck`

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314)

## Current Notes After Phase 319

- Continue fast batch mode. Good next scan: `rg -n " as " src shared electron | rg -v " as const|import type|type "`.
- Likely next low-risk clusters: task-context-menu record casts, renderer DOM-target casts, or Electron Obsidian task casts if a focused verifier already covers the boundary.
- Do not run `git add`, commit, push, or PR unless explicitly asked.
- Do not claim the whole optimization is complete.

## Phase 320 Files Changed

- `electron/taskContextMenuIpc.ts`
  - Added `isObjectRecord(...)`.
  - `isTaskMenuPayload(...)` now narrows runtime popup-open payloads before reading task, tags, and coordinates.
  - `isTaskMenuActionPayload(...)` now narrows forwarded action payloads and nested `updates` through the same record guard.
- `src/app/taskMenuActions.ts`
  - Added `isObjectRecord(...)`.
  - Renderer-side task-menu action parsing now reads `taskId` and `updates` only after record-guard narrowing.
- Focused verifiers updated:
  - `scripts/verify-electron-task-context-menu-ipc-module.ts`
  - `scripts/verify-app-task-menu-actions-module.ts`

## Phase 320 Verification

RED / checkpoint:
- `npm.cmd run verify:electron-task-context-menu-ipc-module` failed before fix because task-context-menu open/action guards still cast runtime payloads to `Record<string, unknown>`.
- `npm.cmd run verify:app-task-menu-actions-module` failed before fix because renderer task-menu action guard still cast forwarded payloads to `Record<string, unknown>`.
- After the production guard patch, both verifier scripts briefly failed because their old text assertions still expected inline `updates && typeof updates === 'object'` checks; they were updated to assert `isObjectRecord(updates)` instead.

Passed:
- `npm.cmd run verify:electron-task-context-menu-ipc-module`
- `npm.cmd run verify:app-task-menu-actions-module`
- `npm.cmd run typecheck`

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314)

## Current Notes After Phase 320

- Continue fast batch mode. Good next scan: `rg -n " as " src shared electron | rg -v " as const|import type|type "`.
- Likely next low-risk clusters: renderer DOM-target casts or Electron Obsidian task casts if focused verifier coverage is already nearby.
- Do not run `git add`, commit, push, or PR unless explicitly asked.
- Do not claim the whole optimization is complete.

## Phase 321 Files Changed

- `src/components/TaskMenuPopup.tsx`
  - Added `TaskMenuPopupActionUpdate`.
  - Local `dispatch(...)` now accepts either `Partial<Task>` or the typed popup action update shape.
  - Removed `as unknown as Partial<Task>` from edit/delete/add-subtask popup action dispatch.
- Focused verifier updated:
  - `scripts/verify-context-menu.ts`

## Phase 321 Verification

RED / checkpoint:
- `npm.cmd run verify:context-menu` failed before fix because `TaskMenuPopup` still used `as unknown as Partial<Task>` for special action dispatch.

Passed:
- `npm.cmd run verify:context-menu`
- `npm.cmd run verify:app-task-menu-actions-module`
- `npm.cmd run typecheck`

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314)

## Current Notes After Phase 321

- Continue fast batch mode. Good next scan: `rg -n " as " src shared electron | rg -v " as const|import type|type "`.
- Likely next low-risk clusters: renderer DOM-target casts or typed key-list casts in settings/components.
- Do not run `git add`, commit, push, or PR unless explicitly asked.
- Do not claim the whole optimization is complete.

## Phase 322 Files Changed

- `src/app/appKeyboardShortcuts.ts`
  - Replaced `event.target as HTMLElement | null` with an `instanceof HTMLElement` guard before typing detection.
- `src/components/DateNavigator.tsx`
  - Replaced calendar outside-click `event.target as Node` with an `instanceof Node` containment guard.
- `src/components/TitleBar.tsx`
  - Replaced more-menu outside-click `event.target as HTMLElement | null` with an `instanceof Element` guard before `closest(...)`.
- Focused verifiers updated:
  - `scripts/verify-app-keyboard-shortcuts-module.ts`
  - `scripts/verify-date-navigator-module.ts`
  - `scripts/verify-electron-window-ipc-module.ts`

## Phase 322 Verification

RED / checkpoint:
- `npm.cmd run verify:app-keyboard-shortcuts-module` failed before fix because shortcut typing detection still cast `event.target as HTMLElement`.
- `npm.cmd run verify:date-navigator-module` failed before fix because DateNavigator outside-click handling still cast `event.target as Node`.
- `npm.cmd run verify:electron-window-ipc-module` failed before fix because TitleBar outside-click handling still cast `event.target as HTMLElement`.

Passed:
- `npm.cmd run verify:app-keyboard-shortcuts-module`
- `npm.cmd run verify:date-navigator-module`
- `npm.cmd run verify:electron-window-ipc-module`
- `npm.cmd run typecheck`

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314)

## Current Notes After Phase 322

- Continue fast batch mode. Good next scan: `rg -n " as " src shared electron | rg -v " as const|import type|type "`.
- Remaining low-risk clusters include PriorityPicker DOM target cast, useFloatingScrollbar querySelector cast, useMarkdownEditor style-copy `any`, and typed key-list casts in small settings components.
- Do not run `git add`, commit, push, or PR unless explicitly asked.
- Do not claim the whole optimization is complete.

## Phase 323 Files Changed

- `src/components/PriorityPicker.tsx`
  - Replaced outside-click `event.target as Node` with an `instanceof Node` guard before `contains(...)`.
- `src/hooks/useFloatingScrollbar.ts`
  - Replaced `querySelector(...) as HTMLElement | null` with an `instanceof HTMLElement` guard before `offsetHeight`.
- Focused verifiers updated:
  - `scripts/verify-task-item-subtask-card-module.ts`
  - `scripts/verify-app-main-content-module.ts`

## Phase 323 Verification

RED / checkpoint:
- `npm.cmd run verify:task-item-subtask-card-module` failed before fix because `PriorityPicker` still used `event.target as Node`.
- `npm.cmd run verify:app-main-content-module` failed before fix because `useFloatingScrollbar` still used `querySelector(...) as HTMLElement | null`.

Passed:
- `npm.cmd run verify:task-item-subtask-card-module`
- `npm.cmd run verify:app-main-content-module`
- `npm.cmd run typecheck`

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314)

## Current Notes After Phase 323

- Continue fast batch mode. Good next scan: `rg -n " as " src shared electron | rg -v " as const|import type|type "`.
- Remaining low-risk clusters include `useMarkdownEditor` style-copy `any`, typed key-list casts in small settings/components, and Electron Obsidian runtime `any` casts.
- Do not run `git add`, commit, push, or PR unless explicitly asked.
- Do not claim the whole optimization is complete.

## Phase 324 Files Changed

- `shared/appSettings.ts`
  - Added `TEMPLATE_CUSTOM_TOKEN_SET` and used it for `isTemplateCustomToken(...)` instead of widening the token tuple.
- `shared/aiReview/aiReviewSettings.ts`
  - Added `AI_PROVIDER_SET` and used it for `isAiProvider(...)` instead of casting providers to `string[]`.
- Focused verifier updated:
  - `scripts/verify-template-source-settings.ts`

## Phase 324 Verification

RED / checkpoint:
- `npm.cmd run verify:template-source-settings` failed before fix because `isTemplateCustomToken(...)` still cast `TEMPLATE_CUSTOM_TOKENS` to `readonly string[]`.

Passed:
- `npm.cmd run verify:template-source-settings`
- `npm.cmd run verify:ai-settings`
- `npm.cmd run typecheck`

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314)

## Current Notes After Phase 324

- Continue fast batch mode. Good next scan: `rg -n " as " src shared electron | rg -v " as const|import type|type "`.
- Remaining low-risk clusters include `useMarkdownEditor` style-copy `any`, typed key-list casts in settings components, CSSProperties casts, and Electron Obsidian runtime `any` casts.
- Do not run `git add`, commit, push, or PR unless explicitly asked.
- Do not claim the whole optimization is complete.

## Phase 325 Files Changed

- `src/hooks/useMarkdownEditor.ts`
  - Removed `prop as any` casts from caret mirror CSS style copying; the readonly style property list now indexes both declarations directly.
- `src/app/appScheduledReports.ts`
  - Added a local `Window` augmentation for `__dailytodoLastScheduledError` and removed the double `window as unknown as ...` cast.
- `src/components/settings/AiReviewManualGenerationSection.tsx`
  - Moved the generation action button tuples into a typed readonly array instead of casting the inline array.
- `src/components/settings/AiReviewReportRoutingSection.tsx`
  - Moved the report profile route tuples into a typed readonly array instead of casting the inline array.
- Focused verifiers updated:
  - `scripts/verify-markdown-editor.ts`
  - `scripts/verify-app-scheduled-reports-module.ts`
  - `scripts/verify-settings-ai-review-manual-generation-section.ts`
  - `scripts/verify-settings-ai-review-report-routing-section.ts`

## Phase 325 Verification

RED / checkpoint:
- `npm.cmd run verify:markdown-editor` failed before fix because `useMarkdownEditor` still copied mirror styles with `prop as any`.
- `npm.cmd run verify:app-scheduled-reports-module` failed before fix because scheduled-report diagnostics still double-cast `window`.
- `npm.cmd run verify:settings-ai-review-manual-generation-section` failed before fix because the manual-generation action list still used `as Array<[GenerationAction, string]>`.
- `npm.cmd run verify:settings-ai-review-report-routing-section` failed before fix because the report-routing key list still used `as Array<[ReportProfileKey, string]>`.
- `npm.cmd run verify:app-scheduled-reports-module` failed once after the code fix because the verifier had a stale `result.error` assertion; it was updated to `parsed.error`.

Passed:
- `npm.cmd run verify:markdown-editor`
- `npm.cmd run verify:app-scheduled-reports-module`
- `npm.cmd run verify:settings-ai-review-manual-generation-section`
- `npm.cmd run verify:settings-ai-review-report-routing-section`
- `npm.cmd run typecheck`

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314)

## Phase 326 Files Changed

- `src/components/taskItem/taskItemStack.ts`
  - Added `TaskStackSegmentStyle` for `--task-stack-segment-count` and removed the `as CSSProperties` return cast.
- `src/components/settings/AppearanceSettingsSection.tsx`
  - Added `ThemePresetPreviewStyle` plus `getThemePresetPreviewStyle(...)` and removed the inline `as CSSProperties` cast.
- `electron/obsidianCompanion.ts`
  - Reused `isObject(error)` in `isAlreadyExistsError(...)` before reading `error.code`, removing the local `{ code?: unknown }` cast.
- Focused verifiers updated:
  - `scripts/verify-task-item-stack-helper.ts`
  - `scripts/verify-settings-appearance-section.ts`
  - `scripts/verify-electron-companion-ipc-module.ts`

## Phase 326 Verification

RED / checkpoint:
- `npm.cmd run verify:task-item-stack-helper` failed before fix because `taskItemStack` still used `as CSSProperties` for the stack custom-property style.
- `npm.cmd run verify:settings-appearance-section` failed before fix because `AppearanceSettingsSection` still used `as CSSProperties` for theme preset preview styles.
- `npm.cmd run verify:electron-companion-ipc-module` failed before fix because `obsidianCompanion` still read EEXIST through `error as { code?: unknown }`.

Passed:
- `npm.cmd run verify:task-item-stack-helper`
- `npm.cmd run verify:settings-appearance-section`
- `npm.cmd run verify:electron-companion-ipc-module`
- `npm.cmd run typecheck`

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314)

## Current Notes After Phase 326

## Phase 327 Files Changed

- `src/components/taskItem/taskItemControls.tsx`
  - `TaskDragHandleProps` now uses `DraggableAttributes` and `DraggableSyntheticListeners` from `@dnd-kit/core`.
- `src/components/taskList/SortableTaskItem.tsx`
  - Removed `ButtonHTMLAttributes` import and direct casts around dnd-kit `attributes` / `listeners`.
- `scripts/verify-task-list-dnd-module.ts`
  - Rejects the old casts and verifies dnd-kit activator types are preserved.

## Phase 327 Verification

RED / checkpoint:
- `npm.cmd run verify:task-list-dnd-module` failed before fix because `SortableTaskItem` still cast dnd-kit activators to `ButtonHTMLAttributes<HTMLButtonElement>`.

Passed:
- `npm.cmd run verify:task-list-dnd-module`
- `npm.cmd run typecheck`

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314)

## Current Notes After Phase 327

- Continue fast batch mode. Current remaining low-risk candidates from the latest scan:
  - Electron Obsidian `any` casts in `electron/obsidianDailyNoteContent.ts` and `electron/obsidianSync.ts`.
  - Larger/trickier: `src/types/personalization.ts` `value as never`, `electron/win32Native.ts` BrowserWindow intersection cast.
- Do not run `git add`, commit, push, or PR unless explicitly asked.
- Do not claim the whole optimization is complete.

## Phase 328 Files Changed

- `shared/obsidianTemplates.ts`
  - Added `ObsidianTemplateTask` and `ObsidianTemplateCompletionReview`.
  - Changed task-line, task-block, daily-note, and sync-preview helpers to accept the smaller template task shape.
- `shared/completionReviews.ts`
  - Changed `getCompletionReviews(...)` to accept a small completion-review task shape rather than full renderer `Task`.
- `electron/obsidianDailyNoteContent.ts`
  - Removed `tasks as any` when calling shared template task helpers.
- `electron/obsidianSync.ts`
  - Made `hasValidObsidianSyncTasks(...)` narrow `unknown` to `ObsidianSyncTask[]`.
  - Added `readTemplateModuleEnabled(...)` and guarded legacy daily path/vault path reads.
  - Removed preview task `any` casts.

## Phase 328 Verification

RED / checkpoint:
- `npm.cmd run verify:electron-obsidian-daily-note-content-module` failed before fix because daily-note content still used `tasks as any`.
- `npm.cmd run verify:electron-obsidian-sync-module` failed before fix because sync validation was not a type predicate and sync still used `as any`.
- `npm.cmd run verify:daily-template-markers` failed before fix because `ObsidianTemplateTask` was missing.

Passed:
- `npm.cmd run verify:electron-obsidian-daily-note-content-module`
- `npm run verify:electron-obsidian-sync-module`
- `npm.cmd run verify:daily-template-markers`
- `npm run typecheck`

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314)

## Current Notes After Phase 328

- Continue fast batch mode. Production-code cast scan now shows the main remaining candidate as `src/types/personalization.ts:73` (`value as never`); `electron/win32Native.ts` BrowserWindow intersection cast remains larger/trickier.
- Script/test casts remain, mostly deliberate fixture shims; do not prioritize them unless production casts are exhausted.
- Do not run `git add`, commit, push, or PR unless explicitly asked.
- Do not claim the whole optimization is complete.

## Phase 329 Files Changed

- `src/types/personalization.ts`
  - Added `setThemeAppearanceOverride<K extends ThemeAppearanceKey>(...)`.
  - Removed `value as never` from `extractThemeAppearanceOverride(...)` while preserving key/value type pairing.
- `scripts/verify-app-personalization-module.ts`
  - Rejects the old `value as never` cast and requires the typed helper.

## Phase 329 Verification

RED / checkpoint:
- `npm.cmd run verify:app-personalization-module` failed before fix because `extractThemeAppearanceOverride(...)` still used `value as never`.

Passed:
- `npm.cmd run verify:app-personalization-module`
- `npm run typecheck`

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314)

## Current Notes After Phase 329

- Continue fast batch mode, but production cast cleanup now appears to be down to mostly deliberate constants/test fixtures plus the larger native-window boundary.
- Main meaningful remaining production candidate to inspect: `electron/win32Native.ts` BrowserWindow intersection cast. Treat as trickier; only touch if a focused verifier makes it small and safe.
- Do not run `git add`, commit, push, or PR unless explicitly asked.
- Do not claim the whole optimization is complete.

## Phase 330 Files Changed

- `electron/win32Native.ts`
  - Added `NativeBackgroundMaterialWindow` and `hasNativeBackgroundMaterial(...)`.
  - Replaced the BrowserWindow intersection cast with guarded optional capability probing before `setBackgroundMaterial('none')`.
- `scripts/verify-electron-win32-native-module.ts`
  - Rejects `win as BrowserWindow & ...` and requires the native material capability guard.

## Phase 330 Verification

RED / checkpoint:
- `npm.cmd run verify:electron-win32-native-module` failed before fix because the optional native material capability type/guard was missing.

Passed:
- `npm.cmd run verify:electron-win32-native-module`
- `npm run typecheck`

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314)

## Current Notes After Phase 330

- Latest production cast scan no longer shows obvious low-risk production casts; remaining hits are mostly text containing `as`, import aliases, and deliberate verify/test fixtures.
- Do not start another broad cleanup loop without a fresh target; a full build can be run on request or before packaging, but was deferred here for speed.
- Do not run `git add`, commit, push, or PR unless explicitly asked.
- Do not claim the whole optimization is complete.

## Phase 331 Files Changed

- `src/utils/taskOrdering.ts`
  - Added `parseTaskListOrderByDate(...)`, including guarded parsing of stored source order and per-source task-id lists.
- `src/hooks/taskPersistence.ts`
  - Replaced duplicate task-order parser helpers with a compatibility wrapper that delegates to the shared ordering parser.
- `scripts/verify-task-ordering-state.ts`
  - Added malformed persisted-order coverage for the shared parser.
- `scripts/verify-task-persistence.ts`
  - Requires delegation to the shared parser and rejects the duplicate helper.

## Phase 331 Verification

RED / checkpoint:
- `npm.cmd run verify:task-ordering-state` failed before fix because `parseTaskListOrderByDate(...)` was not exported.

Passed:
- `npm.cmd run verify:task-ordering-state`
- `npm.cmd run verify:task-persistence`
- `npm run typecheck`

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314)

## Current Notes After Phase 331

- Keep fast batch mode, but choose new targets from duplicate runtime parsing/normalization, stale module-boundary verifiers, or a clearly bounded remaining oversized module. Do not return to production cast scans without a new reason.
- Do not run `git add`, commit, push, or PR unless explicitly asked.
- Do not claim the whole optimization is complete.

## Phase 338 Files Changed

- `electron/aiReviewIpcRegistrationTypes.ts`
- `electron/aiReviewReportIpcTypes.ts`
- `electron/aiReviewTemplateToolsIpc.ts`
- `electron/aiReviewBackfillIpc.ts`
- `electron/aiReviewExternalReportIpc.ts`
- `electron/obsidianIpc.ts`
- `electron/mainWindowBootstrap.ts`
  - Replaced `Promise<any>` LLM caller declarations with `Promise<LlmResult>`.
- Associated focused verifier scripts
  - Require the shared `LlmResult` type at each affected integration boundary.

## Phase 338 Verification

RED observed: focused verifiers failed before production edits because their source still declared `Promise<any>`.

Passed:
- `npm.cmd run verify:electron-ai-review-ipc-registration-types-module`
- `npm.cmd run verify:electron-ai-review-report-ipc-types-module`
- `npm.cmd run verify:electron-ai-review-template-tools-ipc-module`
- `npm.cmd run verify:electron-ai-review-backfill-ipc-module`
- `npm.cmd run verify:electron-ai-review-external-report-ipc-module`
- `npm.cmd run verify:electron-obsidian-ipc-module`
- `npm.cmd run verify:electron-main-window-bootstrap-module`
- `npm.cmd run typecheck`

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314)

## Current Notes After Phase 338

- Continue fast batches. The only remaining `any` matches in this scan are `llmResults?: any[]` diagnostic aggregation fields in `electron/aiReviewReportIpcTypes.ts` and `electron/mainWindowBootstrap.ts`.
- Do not tighten those without tracing the diagnostic factory's actual input/consumers; their payload is not necessarily the raw `LlmResult` union.
- Do not run `git add`, commit, push, or PR unless explicitly asked.
- Do not claim the whole optimization is complete.

## Phase 339 Files Changed

- `electron/aiReviewReportIpcTypes.ts`
- `electron/mainWindowBootstrap.ts`
  - Replaced the final diagnostic `llmResults?: any[]` declarations with `llmResults?: LlmResult[]`.
- `scripts/verify-electron-ai-review-report-ipc-types-module.ts`
- `scripts/verify-electron-main-window-bootstrap-module.ts`
  - Require the shared diagnostic result array contract.

## Phase 339 Verification

RED observed: the report IPC types and bootstrap verifiers failed before production edits because their diagnostic declarations still used `any[]`.

Passed:
- `npm.cmd run verify:electron-ai-review-report-ipc-types-module`
- `npm.cmd run verify:electron-main-window-bootstrap-module`
- `npm.cmd run verify:electron-ai-review-runtime-module`
- `npm.cmd run verify:electron-ai-review-daily-runner-module`
- `npm.cmd run typecheck`
- targeted `rg` scan found no `Promise<any>` or `llmResults?: any[]` in production TypeScript sources.

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314)

## Current Notes After Phase 339

- The current LLM IPC type-boundary pass is complete. Select the next batch from a fresh, concrete duplication or runtime-boundary scan rather than widening this scope.
- Do not run `git add`, commit, push, or PR unless explicitly asked.
- Do not claim the whole optimization is complete.

## Phase 340 Files Changed

- `electron/obsidianCompanion.ts`
  - Parses mobile JSON captures as `unknown` and rejects non-object roots before field normalization.
- `electron/obsidianCompanion.verify.ts`
  - Covers an array-root JSON capture being rejected and moved to `_failed`.

## Phase 340 Verification

RED observed:
- `npm.cmd run verify:companion` failed before production edits because an array-root capture did not report that a JSON object is required.

Passed:
- `npm.cmd run verify:companion`
- `npm.cmd run verify:electron-companion-ipc-module`
- `npm.cmd run typecheck`

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314)

## Current Notes After Phase 340

- The mobile inbox boundary now distinguishes valid capture objects from merely parseable JSON. Its object-field compatibility behavior is unchanged.
- Continue fast batches from a fresh concrete runtime-boundary or duplication scan.
- Do not run `git add`, commit, push, or PR unless explicitly asked.
- Do not claim the whole optimization is complete.

## Phase 341 Files Changed

- `shared/llm/openaiClient.ts`
  - Non-streaming parsed provider response JSON is now declared as `unknown` at the network boundary.
- `scripts/verify-openai-client.ts`
  - Rejects a `let data: any` declaration in that response path.

## Phase 341 Verification

RED observed:
- `npm.cmd run verify:openai-client` failed before production edits because the non-streaming response path declared parsed JSON as `any`.

Passed:
- `npm.cmd run verify:openai-client`
- `npm.cmd run verify:ai-run-diagnostics`
- `npm.cmd run typecheck`

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314)

## Current Notes After Phase 341

- Raw non-streaming LLM JSON no longer introduces `any`, while provider compatibility extractors remain deliberately broad and require a separate behavior-preserving refactor.
- Continue fast batches from a fresh concrete runtime-boundary or duplication scan.
- Do not run `git add`, commit, push, or PR unless explicitly asked.
- Do not claim the whole optimization is complete.

## Phase 342 Files Changed

- `shared/llm/openaiClient.ts`
  - Model-list `Response.json()` output and parser request contract now use `unknown`; records are guarded before `id`/`name` reads.
- `scripts/verify-openai-client.ts`
  - Requires the `unknown` contract for model-list network values.

## Phase 342 Verification

RED observed:
- `npm.cmd run verify:openai-client` failed before production edits because model-list parser inputs were declared as `any`.

Passed:
- `npm.cmd run verify:openai-client`
- `npm.cmd run verify:ai-run-diagnostics`
- `npm.cmd run typecheck`

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314)

## Current Notes After Phase 342

- Both LLM network JSON entry points now begin as `unknown`. Provider chat-content extractors and SSE aggregation still use broad compatibility shapes and should be evaluated independently.
- Continue fast batches from a fresh concrete runtime-boundary or duplication scan.
- Do not run `git add`, commit, push, or PR unless explicitly asked.
- Do not claim the whole optimization is complete.

## Phase 343 Files Changed

- `shared/llm/openaiClient.ts`
  - `parseSse(...)` and provider aggregation now use `unknown[]`; each streaming provider narrows untrusted event values before reading fields.
- `scripts/verify-openai-client.ts`
  - Requires the `unknown[]` SSE event boundary contract.

## Phase 343 Verification

RED observed:
- `npm.cmd run verify:openai-client` failed before production edits because the SSE parser and aggregation contract still used `any[]`.

Passed:
- `npm.cmd run verify:openai-client`
- `npm.cmd run verify:ai-run-diagnostics`
- `npm.cmd run typecheck`
- `git diff --check -- shared/llm/openaiClient.ts scripts/verify-openai-client.ts`

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314)

## Current Notes After Phase 343

- Raw LLM JSON now begins as `unknown` for non-streaming, model-list, and SSE responses.
- Remaining provider helper `any` values are compatibility internals; tighten them only in small, behavior-preserving, independently verified phases.
- Continue fast batches from a fresh concrete runtime-boundary or duplication scan.
- Do not run `git add`, commit, push, or PR unless explicitly asked.
- Do not claim the whole optimization is complete.

## Phase 344 Files Changed

- `shared/llm/openaiClient.ts`
  - OpenAI-compatible text extraction helpers now accept `unknown` and narrow choice, delta, message, top-level, and segmented values before reading fields.
- `scripts/verify-openai-client.ts`
  - Requires the `unknown` text-extractor contracts.

## Phase 344 Verification

RED observed:
- `npm.cmd run verify:openai-client` failed before production edits because text extraction helpers still accepted `any`.

Passed:
- `npm.cmd run verify:openai-client`
- `npm.cmd run verify:ai-run-diagnostics`
- `npm.cmd run typecheck`
- `git diff --check -- shared/llm/openaiClient.ts scripts/verify-openai-client.ts`

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314)

## Current Notes After Phase 344

- The LLM client now uses `unknown` at all raw network entry points and for OpenAI-compatible text extraction helpers.
- Remaining LLM-client `any` values are provider parse/truncation contracts and token-usage helpers. Address them as separate behavior-preserving batches.
- Continue fast batches from a fresh concrete runtime-boundary or duplication scan.
- Do not run `git add`, commit, push, or PR unless explicitly asked.
- Do not claim the whole optimization is complete.

## Phase 345 Files Changed

- `shared/llm/openaiClient.ts`
  - Provider non-streaming parse/truncation contracts now use `unknown`; provider-specific envelope, choice/candidate, and text-part reads are narrowed.
- `scripts/verify-openai-client.ts`
  - Requires the `unknown` provider parser contract.

## Phase 345 Verification

RED observed:
- `npm.cmd run verify:openai-client` failed before production edits because provider parse and truncation contracts still used `any`.

Passed:
- `npm.cmd run verify:openai-client`
- `npm.cmd run verify:ai-run-diagnostics`
- `npm.cmd run typecheck`
- `git diff --check -- shared/llm/openaiClient.ts scripts/verify-openai-client.ts`

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314)

## Current Notes After Phase 345

- The provider non-streaming response boundary is now consistently `unknown` through parsing and truncation detection.
- Remaining `any` values in `openaiClient.ts` are limited to token-usage extraction and usage-only stream diagnostics. Treat those user-facing diagnostics as the next separate batch.
- Continue fast batches from a fresh concrete runtime-boundary or duplication scan.
- Do not run `git add`, commit, push, or PR unless explicitly asked.
- Do not claim the whole optimization is complete.

## Phase 346 Files Changed

- `shared/llm/openaiClient.ts`
  - Token-usage extraction, SSE usage aggregation, usage-only stream detection, and its user-facing error helper now accept `unknown` values and narrow all event/usage records.
- `scripts/verify-openai-client.ts`
  - Requires the unknown usage-diagnostic helper contracts.

## Phase 346 Verification

RED observed:
- `npm.cmd run verify:openai-client` failed before production edits because usage diagnostic helpers still accepted `any` inputs.

Passed:
- `npm.cmd run verify:openai-client`
- `npm.cmd run verify:ai-run-diagnostics`
- `npm.cmd run typecheck`
- `git diff --check -- shared/llm/openaiClient.ts scripts/verify-openai-client.ts`
- `rg -n "\bany\b" shared/llm/openaiClient.ts` found no production `any` usages.

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314)

## Current Notes After Phase 346

- `shared/llm/openaiClient.ts` has no production `any` usages: non-streaming, model-list, SSE, content, truncation, and diagnostics inputs all begin as `unknown` and narrow locally.
- Continue from a new whole-project scan for remaining high-value runtime boundaries or duplicated domain helpers. Do not refactor unrelated modules merely to chase a global count.
- Do not run `git add`, commit, push, or PR unless explicitly asked.
- Do not claim the whole optimization is complete.

## Phase 347 Files Changed

- `electron/taskMenuWindow.ts`
  - Selects the nearest display for popup work-area clamping after normalizing trigger coordinates.
- `scripts/verify-context-menu.ts`
- `scripts/verify-electron-task-menu-window-module.ts`
  - Require nearest-display placement and align the scheduled-date assertion with the shared helper.

## Phase 347 Verification

RED observed:
- Both task-menu verifiers failed before the production change because placement used only `screen.getPrimaryDisplay()`.

Passed:
- `npm.cmd run verify:context-menu`
- `npm.cmd run verify:electron-task-menu-window-module`
- `npm.cmd run typecheck`
- `git diff --check -- electron/taskMenuWindow.ts scripts/verify-context-menu.ts scripts/verify-electron-task-menu-window-module.ts`

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314)

## Current Notes After Phase 347

- Task-menu popup placement now respects the display where the context menu was opened, while malformed coordinates retain a deterministic primary-display fallback.
- Keep fast batch mode: select the next target from a concrete runtime boundary or duplicated domain helper rather than broad cosmetic scans.
- Do not run `git add`, commit, push, or PR unless explicitly asked.
- Do not claim the whole optimization is complete.

