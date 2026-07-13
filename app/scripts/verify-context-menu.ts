import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import assertStrict from 'node:assert/strict';
import { getTagSuggestions, parseTaskMenuPopupPayload } from '../src/components/TaskMenuPopup';

const cwd = process.cwd();
const root = existsSync(join(cwd, 'src')) ? cwd : join(cwd, 'app');
const taskTypes = readFileSync(join(root, 'src/types/task.ts'), 'utf8');
const taskItem = readFileSync(join(root, 'src/components/TaskItem.tsx'), 'utf8');
const taskItemContextMenu = readFileSync(join(root, 'src/components/taskItem/taskItemContextMenu.ts'), 'utf8');
const subtasksViewport = readFileSync(join(root, 'src/components/taskItem/TaskSubtasksViewport.tsx'), 'utf8');
const taskItemPresentation = readFileSync(join(root, 'src/components/taskItem/taskItemPresentation.tsx'), 'utf8');
const popupEntry = readFileSync(join(root, 'src/components/TaskMenuPopup.tsx'), 'utf8');
const popupPanesPath = join(root, 'src/components/taskMenuPopup/TaskMenuPopupPanes.tsx');
const popupPanes = existsSync(popupPanesPath) ? readFileSync(popupPanesPath, 'utf8') : '';
const popupDatePanePath = join(root, 'src/components/taskMenuPopup/TaskMenuPopupDatePane.tsx');
const popupDatePane = existsSync(popupDatePanePath) ? readFileSync(popupDatePanePath, 'utf8') : '';
const popupTagPanePath = join(root, 'src/components/taskMenuPopup/TaskMenuPopupTagPane.tsx');
const popupTagPane = existsSync(popupTagPanePath) ? readFileSync(popupTagPanePath, 'utf8') : '';
const popupLifecyclePath = join(root, 'src/components/taskMenuPopup/useTaskMenuPopupLifecycle.ts');
const popupLifecycle = existsSync(popupLifecyclePath) ? readFileSync(popupLifecyclePath, 'utf8') : '';
const popup = `${popupEntry}\n${popupPanes}\n${popupDatePane}\n${popupTagPane}`;
const useTasks = readFileSync(join(root, 'src/hooks/useTasks.ts'), 'utf8');
const useTaskActions = readFileSync(join(root, 'src/hooks/useTaskActions.ts'), 'utf8');
const mainProcess = readFileSync(join(root, 'electron/main.ts'), 'utf8');
const mainWindowComposition = readFileSync(join(root, 'electron/mainWindowComposition.ts'), 'utf8');
const mainWindowBootstrap = readFileSync(join(root, 'electron/mainWindowBootstrap.ts'), 'utf8');
const mainWindowIpcRegistration = readFileSync(join(root, 'electron/mainWindowIpcRegistration.ts'), 'utf8');
const mainShellController = readFileSync(join(root, 'electron/mainShellController.ts'), 'utf8');
const taskContextMenuIpc = readFileSync(join(root, 'electron/taskContextMenuIpc.ts'), 'utf8');
const taskMenuWindow = readFileSync(join(root, 'electron/taskMenuWindow.ts'), 'utf8');
const preload = readFileSync(join(root, 'electron/preload.ts'), 'utf8');
const appTsx = readFileSync(join(root, 'src/App.tsx'), 'utf8');
const appRuntimeEffects = readFileSync(join(root, 'src/app/useAppRuntimeEffects.ts'), 'utf8');
const taskMenuActions = readFileSync(join(root, 'src/app/taskMenuActions.ts'), 'utf8');
const styleEntry = readFileSync(join(root, 'src/styles/index.css'), 'utf8');
const taskTransforms = readFileSync(join(root, 'src/hooks/taskTransforms.ts'), 'utf8');
const taskSelectors = readFileSync(join(root, 'src/hooks/taskSelectors.ts'), 'utf8');
const taskMenuPopupCss = readFileSync(join(root, 'src/styles/task-menu-popup.css'), 'utf8');
const globalsCss = readFileSync(join(root, 'src/styles/globals.css'), 'utf8');
const mainTsx = readFileSync(join(root, 'src/main.tsx'), 'utf8');
const taskMenuStyles = readFileSync(join(root, 'src/styles/task-menu.css'), 'utf8');

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

// Data model
assert(taskTypes.includes('scheduledDates?: string[]'), 'Task should have optional scheduledDates field.');
assert(taskTypes.includes('subtasks?: Task[]'), 'Task should support persisted subtasks.');
assert(taskTypes.includes('parentTaskId?: string'), 'Task should optionally store parentTaskId for flattened integrations.');
assert(taskTypes.includes('collapsed?: boolean'), 'Task should persist collapsed state for task trees.');
assert(taskTypes.includes('completionReview?: TaskCompletionReview'), 'Subtasks should be able to reuse completion review data.');

// Popup component exists and renders the three panes
assert(existsSync(join(root, 'src/components/TaskMenuPopup.tsx')), 'TaskMenuPopup component should exist.');
assert(popup.includes('export function TaskMenuPopup'), 'TaskMenuPopup should be exported.');
assert(existsSync(popupPanesPath), 'Task-menu popup pane UI should be extracted to src/components/taskMenuPopup/TaskMenuPopupPanes.tsx.');
assert(popupEntry.includes("from './taskMenuPopup/TaskMenuPopupPanes'"), 'TaskMenuPopup should import pane components from the extracted pane module.');
assert(existsSync(popupDatePanePath), 'Date-pane UI should live in a focused task-menu popup module.');
assert(existsSync(popupTagPanePath), 'Tag-pane UI should live in a focused task-menu popup module.');
assert(popupEntry.includes("from './taskMenuPopup/TaskMenuPopupDatePane'"), 'TaskMenuPopup should import the extracted date pane.');
assert(popupEntry.includes("from './taskMenuPopup/TaskMenuPopupTagPane'"), 'TaskMenuPopup should import the extracted tag pane.');
assert(!popupEntry.includes('function MenuPane'), 'TaskMenuPopup should not inline MenuPane after pane extraction.');
assert(!popupEntry.includes('function DatePane'), 'TaskMenuPopup should not inline DatePane after pane extraction.');
assert(!popupEntry.includes('function TagPane'), 'TaskMenuPopup should not inline TagPane after pane extraction.');
assert(!popupEntry.includes('function SubtaskPane'), 'TaskMenuPopup should not inline SubtaskPane after pane extraction.');
assert(popupPanes.includes('export function MenuPane'), 'Extracted pane module should export MenuPane.');
assert(popupPanes.includes('export function SubtaskPane'), 'Extracted pane module should export SubtaskPane.');
assert(!popupPanes.includes('export function DatePane'), 'Shared pane module should not retain date-pane presentation.');
assert(!popupPanes.includes('export function TagPane'), 'Shared pane module should not retain tag-pane presentation.');
assert(popupDatePane.includes('export function DatePane'), 'Date-pane module should export DatePane.');
assert(popupDatePane.includes("import { useMemo, useState } from 'react';"), 'Date pane should import useMemo for scheduled-date derivation.');
assert(/const\s+\{\s*activeDates,\s*active\s*\}\s*=\s*useMemo\(\(\)\s*=>\s*\{[\s\S]*?return\s*\{\s*activeDates,\s*active\s*\};[\s\S]*?\},\s*\[task\.scheduledDates\]\)/.test(popupDatePane), 'Date pane should derive sorted scheduled dates and membership together only when scheduledDates changes.');
assert(popupTagPane.includes('export function TagPane'), 'Tag-pane module should export TagPane.');
assert(popupTagPane.includes('export function getTagSuggestions'), 'Tag-pane module should own tag suggestion filtering.');
assert(popupEntry.includes('export { getTagSuggestions }'), 'TaskMenuPopup should re-export getTagSuggestions for existing callers.');
assert(popupEntry.split(/\r?\n/).length < 300, 'TaskMenuPopup should stay below the 300-line large-file threshold after pane extraction.');
assert(popupPanes.split(/\r?\n/).length < 160, 'Shared task-menu pane module should keep only menu and subtask presentation.');
assert(existsSync(popupLifecyclePath), 'TaskMenuPopup viewport lifecycle should live in a focused hook.');
assert(popupEntry.includes("from './taskMenuPopup/useTaskMenuPopupLifecycle'"), 'TaskMenuPopup should compose the extracted viewport lifecycle hook.');
assert(popupEntry.includes('useTaskMenuPopupLifecycle'), 'TaskMenuPopup should use the extracted viewport lifecycle hook.');
assert(!popupEntry.includes('new ResizeObserver('), 'TaskMenuPopup should not inline viewport resize observation after lifecycle extraction.');
assert(!popupEntry.includes("window.addEventListener('keydown'"), 'TaskMenuPopup should not inline Escape-key lifecycle after extraction.');
assert(popupLifecycle.includes('export function useTaskMenuPopupLifecycle'), 'TaskMenuPopup lifecycle hook should be exported.');
assert(popupLifecycle.includes('new ResizeObserver(report)'), 'TaskMenuPopup lifecycle hook should observe content height.');
assert(popupLifecycle.includes('resizeTaskContextMenu(h + 32)'), 'TaskMenuPopup lifecycle hook should retain popup height reporting.');
assert(popupLifecycle.includes('lastReportedHeightRef'), 'TaskMenuPopup lifecycle hook should retain duplicate height-report suppression.');
assert(popupLifecycle.includes('if (h <= 0 || h === lastReportedHeightRef.current) return;'), 'TaskMenuPopup lifecycle hook should skip unchanged heights.');
assert(popupLifecycle.includes("window.addEventListener('keydown', onKey)"), 'TaskMenuPopup lifecycle hook should register Escape-key handling.');
assert(popupLifecycle.includes("if (pane === 'menu') close()"), 'TaskMenuPopup lifecycle hook should close the top-level popup on Escape.');
assert(popupLifecycle.includes("else setPane('menu')"), 'TaskMenuPopup lifecycle hook should return nested panes to the menu on Escape.');
assert(popup.includes('设置日期'), 'Popup should have date setting option.');
assert(popup.includes('编辑标签'), 'Popup should have tag editing option.');
assert(popup.includes('今天') && popup.includes('明天'), 'Popup date pane should have today/tomorrow shortcuts.');
assert(popup.includes('下周'), 'Popup date pane should have a 下周 (+7 days) shortcut.');
assert(popup.includes("shiftDateKey(today, 7)"), '下周 should be today + 7 days (same weekday next week).');
assert(popup.includes('清除日期'), 'Popup date pane should have clear dates option.');
assert(popup.includes('移除已选日期'), 'Popup date pane should show removable existing dates.');
assert(popup.includes('添加子任务'), 'Popup should expose an add-subtask action.');
assert(popup.includes("'subtask'") || popup.includes('"subtask"'), 'Popup should have a dedicated subtask pane.');
assert(popup.includes('SubtaskPane'), 'Popup should render a SubtaskPane for adding child tasks.');
assert(popup.includes('__action') && popup.includes('addSubtask'), 'Popup should dispatch an explicit addSubtask action.');
assert(!popup.includes('as unknown as Partial<Task>'), 'Popup should dispatch special task-menu actions with typed update payloads instead of double-casting through unknown.');
assert(popup.includes('type TaskMenuPopupActionUpdate'), 'Popup should define a typed update payload for special task-menu actions.');
assert(popup.includes('tm-date-chips'), 'Popup should render selected date chips with delete affordances.');
assert(popup.includes('tm-quick-grid'), 'Popup should group quick date actions into a compact grid.');
assert(popup.includes('type="date"'), 'Popup date pane should have a date input.');
assert(popup.includes('allTags'), 'Popup tag pane should use tag suggestions from history.');
assert(popup.includes('--menu-accent') || popup.includes('setProperty'), 'Popup should apply the active theme accent.');
assert(popup.includes('export function parseTaskMenuPopupPayload'), 'Popup should export a runtime payload parser for URL bootstrap data.');
assert(popup.includes('isTaskLike(value.task)'), 'Popup payload parser should require a structurally valid task.');
assert(!popup.includes('parsed.task as Task'), 'Popup should not cast URL payload tasks as trusted Task objects.');
assert(popupEntry.includes("import { isObjectRecord } from '../../shared/unknownValueGuards';"), 'Popup payload parsing should reuse the shared object-record guard.');
assert(!popupEntry.includes('function isRecord('), 'Popup payload parsing should not duplicate the shared object-record guard.');
assert(!popup.includes('Boolean(parsed.isDark)'), 'Popup should not coerce malformed isDark values with Boolean(...).');
assert(popup.includes("typeof value.isDark === 'boolean' ? value.isDark : false"), 'Popup should treat only real booleans as isDark.');
assert(popup.includes('Array.isArray(value.allTags)'), 'Popup should parse allTags as an array of strings.');
assert(popup.includes("typeof tag === 'string'"), 'Popup should keep only string tags from URL payload data.');

const validTask = {
  id: 'task-1',
  text: 'Popup task',
  completed: false,
  priority: 'medium',
  createdAt: '2026-07-12T01:00:00.000Z',
};
const parsed = parseTaskMenuPopupPayload({
  task: validTask,
  allTags: ['work', 12, 'focus'],
  isDark: 1,
  theme: {
    themeId: 'minimal',
    accent: '#111111',
    menuOpacity: 0.9,
    blurStrength: 'bad',
  },
});
assertStrict.ok(parsed, 'parseTaskMenuPopupPayload should accept structurally valid popup payloads.');
assertStrict.equal(parsed?.task.id, 'task-1');
assertStrict.deepEqual(parsed?.allTags, ['work', 'focus']);
assertStrict.equal(parsed?.isDark, false);
assertStrict.equal(parsed?.theme.themeId, 'minimal');
assertStrict.equal(parsed?.theme.accent, '#111111');
assertStrict.equal(parsed?.theme.menuOpacity, 0.9);
assertStrict.equal(parsed?.theme.blurStrength, 18);
assertStrict.equal(
  parseTaskMenuPopupPayload({
    task: { id: 1, text: 'bad', completed: false, priority: 'medium', createdAt: '2026-07-12T01:00:00.000Z' },
    allTags: [],
  }),
  null,
  'parseTaskMenuPopupPayload should reject malformed task payloads',
);
assertStrict.deepEqual(
  getTagSuggestions(['Work', 'Workout', 'Personal', 'Focus'], ['Work'], 'wo'),
  ['Workout'],
  'tag suggestions should normalize the query and exclude selected tags',
);
assertStrict.deepEqual(
  getTagSuggestions(['Work', 'Workout', 'Personal'], [], ''),
  ['Work', 'Workout', 'Personal'],
  'an empty tag query should retain all available suggestions',
);
assert(
  popupTagPane.includes("import { useMemo, useState } from 'react';"),
  'Tag pane should memoize selected-tag lookup state across input-only renders.',
);
assert(
  popupTagPane.includes('const selectedTagSet = useMemo(() => new Set(tags), [tags]);'),
  'Tag pane should rebuild its selected-tag set only when selected tags change.',
);
assert(
  popupTagPane.includes('getTagSuggestionsFromSet(allTags, selectedTagSet, input)'),
  'Tag pane should reuse its memoized selected-tag set while filtering suggestions.',
);
assert(taskItem.includes('createTaskContextMenuOpenPayload'), 'TaskItem should delegate current-theme capture and popup payload construction to its context menu helper.');
assert(taskItemContextMenu.includes('createTaskContextMenuTheme'), 'TaskItem context menu helper should own current-theme construction.');
assert(taskItemContextMenu.includes("'--personal-accent'") || taskItemContextMenu.includes('--personal-accent'), 'TaskItem context menu helper should capture the current theme when opening the menu.');

// TaskItem opens the popup window via IPC, not an in-window menu
assert(taskItem.includes('onContextMenu'), 'TaskItem should handle onContextMenu event.');
assert(taskItem.includes('openTaskContextMenu'), 'TaskItem should open the popup window via IPC.');
assert(taskItem.includes('screenX') && taskItem.includes('screenY'), 'TaskItem should pass screen coordinates to the popup.');
assert(!taskItem.includes("from './TaskContextMenu'"), 'TaskItem should no longer import the in-window TaskContextMenu.');
assert(!taskItem.includes('<TaskContextMenu'), 'TaskItem should no longer render the in-window TaskContextMenu.');
assert(taskItem.includes('scheduledDates'), 'TaskItem should display scheduledDates.');
assert(taskItem.includes('task.tags'), 'TaskItem should display tags.');
assert(taskItem.includes('task.subtasks') && taskItem.includes('task-subtasks'), 'TaskItem should display persisted subtasks below the parent task.');
assert(taskItemPresentation.includes('task-cluster-has-children') && taskItem.includes('getTaskClusterClassName') && taskItem.includes('onToggleCollapse'), 'TaskItem should make child task clusters collapsible.');
assert(/lazy\(\(\) => import\('\.\/taskItem\/TaskSubtasksViewport'\)/.test(taskItem) && taskItem.includes('<TaskSubtasksViewport') && taskItem.includes('useVirtualSubtasks') && taskItem.includes('isExpanded && ('), 'TaskItem should route expanded subtasks through the lazy virtualized viewport component.');
assert(subtasksViewport.includes('SubtaskCard') && subtasksViewport.includes('visibleVirtualItems') && subtasksViewport.includes('task-subtask-virtual-list'), 'TaskSubtasksViewport should render compact subtask cards with virtualization support.');
assert(taskItem.includes('onToggleSubtask') && taskItem.includes('onDeleteSubtask'), 'TaskItem should support subtask completion and deletion actions.');
assert(taskItem.includes('onViewSubtaskReview'), 'TaskItem should expose subtask completion review actions.');

// Main process popup window + IPC plumbing
assert(mainWindowComposition.includes('openTaskMenuWindow'), 'Main-window composition should create a popup window for the task menu.');
assert(mainWindowComposition.includes('createMainShellController'), 'Main-window composition should create the main shell controller for tray and popup shell actions.');
assert(mainWindowComposition.includes('createMainWindowBootstrap'), 'Main-window composition should delegate bootstrap callback assembly.');
assert(mainWindowBootstrap.includes("from './mainWindowIpcRegistration'"), 'Main-window bootstrap should delegate task context menu IPC composition.');
assert(mainWindowIpcRegistration.includes('registerTaskContextMenuIpcHandlers'), 'Main-window IPC composition should register task context menu IPC handlers.');
assert(mainShellController.includes('createTaskMenuWindow(payload'), 'Main shell controller should delegate popup BrowserWindow creation to the task-menu window helper.');
assert(taskContextMenuIpc.includes("ipcMain.handle('taskContextMenu:open'"), 'Task context menu IPC module should handle taskContextMenu:open.');
assert(taskContextMenuIpc.includes("ipcMain.handle('taskContextMenu:getPayload'"), 'Task context menu IPC module should expose payload hydration.');
assert(taskContextMenuIpc.includes("ipcMain.handle('taskContextMenu:action'"), 'Task context menu IPC module should forward taskContextMenu:action to the main window.');
assert(taskMenuWindow.includes('screen.getDisplayNearestPoint('), 'Task-menu window helper should clamp popup placement to the display nearest the trigger point.');
assert(!taskMenuWindow.includes('const { workArea } = screen.getPrimaryDisplay();'), 'Task-menu window helper should not always clamp popup placement to the primary display.');
assert(taskMenuWindow.includes('new BrowserWindow({'), 'Task-menu window helper should own popup BrowserWindow creation.');
assert(taskMenuWindow.includes('const primaryWorkArea = screen.getPrimaryDisplay().workArea;'),
  'Task-menu window helper should retain a primary-display fallback for malformed trigger coordinates.');
assert(taskMenuWindow.includes("const screenX = typeof payload.screenX === 'number' && Number.isFinite(payload.screenX)"),
  'Task-menu window helper should defensively normalize malformed popup x coordinates before selecting a display.');
assert(taskMenuWindow.includes("const screenY = typeof payload.screenY === 'number' && Number.isFinite(payload.screenY)"),
  'Task-menu window helper should defensively normalize malformed popup y coordinates before selecting a display.');
assert(taskMenuWindow.includes('const { workArea } = screen.getDisplayNearestPoint({ x: screenX, y: screenY });'),
  'Task-menu window helper should clamp popup coordinates inside the selected display work area.');
assert(!taskMenuWindow.includes('Math.min(payload.screenX'), 'Task-menu window helper should not clamp raw runtime x coordinates directly.');
assert(!taskMenuWindow.includes('Math.min(payload.screenY'), 'Task-menu window helper should not clamp raw runtime y coordinates directly.');
assert(taskMenuWindow.includes("view: 'task-menu'"), 'Task-menu window helper should load the task-menu renderer route.');
assert(taskMenuWindow.includes("menu.setAlwaysOnTop(true, 'screen-saver')"), 'Task-menu window helper should preserve popup z-order behavior.');

// Preload bridge
assert(preload.includes('openTaskContextMenu'), 'Preload should expose openTaskContextMenu.');
assert(preload.includes('getTaskContextMenuPayload'), 'Preload should expose getTaskContextMenuPayload for IPC payload hydration.');
assert(preload.includes('dispatchTaskMenuAction'), 'Preload should expose dispatchTaskMenuAction.');
assert(preload.includes('onTaskMenuAction'), 'Preload should expose onTaskMenuAction.');

// App listens for popup actions and applies them
assert(taskMenuActions.includes('onTaskMenuAction'), 'Task menu action helper should subscribe to popup menu actions.');
assert(appTsx.includes('useAppRuntimeEffects'), 'App should delegate popup menu action effects through the runtime hook.');
assert(appRuntimeEffects.includes('registerTaskMenuActionListener'), 'App runtime effects should register popup menu actions through the helper.');
assert(appRuntimeEffects.includes('updateTask: taskEffects.updateTask'), 'App runtime effects should apply task updates from popup actions.');
assert(appRuntimeEffects.includes('setEditRequest: appState.setEditRequest'), 'App runtime effects should route the popup edit action via editRequest.');

// Renderer routes the popup view
assert(mainTsx.includes("'task-menu'") || mainTsx.includes('task-menu'), 'Renderer entry should route the task-menu view.');
assert(!mainTsx.includes("import './styles/index.css';"), 'Renderer entry should not make the task-menu popup load the main application stylesheet.');
assert(!styleEntry.includes("@import './context-menu.css';"), 'Style entry should not load popup-only context-menu.css into the main application.');
assert(!appTsx.includes("import './styles/context-menu.css';"), 'App should not duplicate the global context-menu.css import.');
assert(taskMenuStyles.includes("@import './task-menu-popup.css';"), 'Task-menu stylesheet should include the popup-specific controls.');
assert(taskMenuStyles.includes('#root') && taskMenuStyles.includes('background: transparent'), 'Task-menu stylesheet should provide the popup viewport reset without importing the main app stylesheet.');

// useTasks update method + multi-date visibility
assert(useTasks.includes("import { useTaskActions } from './useTaskActions';"), 'useTasks should compose extracted task actions.');
assert(useTasks.includes('const taskActions = useTaskActions({'), 'useTasks should initialize the extracted task actions hook.');
assert(useTasks.includes('...taskActions'), 'useTasks should expose actions returned by the extracted task actions hook.');
assert(useTaskActions.includes('export interface TaskActions'), 'The extracted task actions hook should declare its public action contract.');
assert(useTaskActions.includes('addSubtask:') && useTaskActions.includes('toggleSubtask:') && useTaskActions.includes('deleteSubtask:'), 'Task actions should expose subtask creation, completion, and deletion.');
assert(useTaskActions.includes('updateSubtaskReview:') || useTaskActions.includes('completeSubtaskWithReview:'), 'Task actions should support subtask completion review persistence.');
assert(useTaskActions.includes('toggleTaskCollapse:'), 'Task actions should persist tree collapse state.');
assert(taskTransforms.includes('task.scheduledDates?.some'), 'Task transforms should consider scheduledDates without rebuilding the visible-date list for every lookup.');
assert(taskSelectors.includes('for (const scheduledDate of task.scheduledDates || [])'), 'Task selectors should check scheduled-date visibility without rebuilding visible-date arrays.');

// Styling
assert(taskMenuPopupCss.includes('.tm-card'), 'CSS should style the popup glass card.');
assert(taskMenuPopupCss.includes('.tm-popup::before') && taskMenuPopupCss.includes('display: none'), 'Popup should suppress global texture overlays that create gray backing.');
assert(taskMenuPopupCss.includes('.tm-card-shell'), 'Popup should separate shadow shell from menu surface to avoid gray backing.');
assert(taskMenuPopupCss.includes('.tm-date-chip-remove'), 'CSS should style date delete affordances.');
assert(taskMenuPopupCss.includes('.tm-subtask-form'), 'CSS should style the add-subtask form.');
assert(taskMenuPopupCss.includes('.tm-popup'), 'CSS should style the popup window container.');
assert(taskMenuPopupCss.includes('--menu-accent'), 'Popup should be themed via the accent CSS variable.');
assert(taskMenuPopupCss.includes('.dark .tm-card'), 'Popup should have a dark-mode card variant.');
assert(!taskMenuPopupCss.includes('.context-menu {'), 'Popup stylesheet should not retain the unused in-window context menu.');
assert(!taskMenuPopupCss.includes('.date-picker-menu {'), 'Popup stylesheet should not retain the unused date picker menu.');
assert(!taskMenuPopupCss.includes('.tag-editor {'), 'Popup stylesheet should not retain the unused tag editor.');
assert(globalsCss.includes('.scheduled-dates'), 'Main stylesheet should retain scheduled-date styling for task cards.');
assert(globalsCss.includes('.task-tags'), 'Main stylesheet should retain tag styling for task cards.');
assert(globalsCss.includes('.task-subtasks'), 'Main stylesheet should retain subtask summary styling for task cards.');
// Invisible theme: bottom add-task bar must not render an opaque square.
assert(globalsCss.includes('.theme-invisible .add-task') && globalsCss.includes('background: transparent'),
  'Invisible theme should make the bottom add-task bar transparent (no opaque square).');

console.log('Context menu (popup window) verification passed');

assert(!taskMenuWindow.includes('JSON.stringify(payload)'), 'Task-menu window helper must not serialize task menu payload into the renderer URL.');
