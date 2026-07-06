import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const cwd = process.cwd();
const root = existsSync(join(cwd, 'src')) ? cwd : join(cwd, 'app');
const taskTypes = readFileSync(join(root, 'src/types/task.ts'), 'utf8');
const taskItem = readFileSync(join(root, 'src/components/TaskItem.tsx'), 'utf8');
const popup = readFileSync(join(root, 'src/components/TaskMenuPopup.tsx'), 'utf8');
const useTasks = readFileSync(join(root, 'src/hooks/useTasks.ts'), 'utf8');
const mainProcess = readFileSync(join(root, 'electron/main.ts'), 'utf8');
const preload = readFileSync(join(root, 'electron/preload.ts'), 'utf8');
const appTsx = readFileSync(join(root, 'src/App.tsx'), 'utf8');
const styleEntry = readFileSync(join(root, 'src/styles/index.css'), 'utf8');
const taskTransforms = readFileSync(join(root, 'src/hooks/taskTransforms.ts'), 'utf8');
const taskSelectors = readFileSync(join(root, 'src/hooks/taskSelectors.ts'), 'utf8');
const contextMenuCss = readFileSync(join(root, 'src/styles/context-menu.css'), 'utf8');
const globalsCss = readFileSync(join(root, 'src/styles/globals.css'), 'utf8');
const mainTsx = readFileSync(join(root, 'src/main.tsx'), 'utf8');

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
assert(popup.includes('tm-date-chips'), 'Popup should render selected date chips with delete affordances.');
assert(popup.includes('tm-quick-grid'), 'Popup should group quick date actions into a compact grid.');
assert(popup.includes('type="date"'), 'Popup date pane should have a date input.');
assert(popup.includes('allTags'), 'Popup tag pane should use tag suggestions from history.');
assert(popup.includes('--menu-accent') || popup.includes('setProperty'), 'Popup should apply the active theme accent.');
assert(popup.includes('resizeTaskContextMenu'), 'Popup should resize its window to hug content.');
assert(taskItem.includes("'--personal-accent'") || taskItem.includes('--personal-accent'), 'TaskItem should capture the current theme when opening the menu.');

// TaskItem opens the popup window via IPC, not an in-window menu
assert(taskItem.includes('onContextMenu'), 'TaskItem should handle onContextMenu event.');
assert(taskItem.includes('openTaskContextMenu'), 'TaskItem should open the popup window via IPC.');
assert(taskItem.includes('screenX') && taskItem.includes('screenY'), 'TaskItem should pass screen coordinates to the popup.');
assert(!taskItem.includes("from './TaskContextMenu'"), 'TaskItem should no longer import the in-window TaskContextMenu.');
assert(!taskItem.includes('<TaskContextMenu'), 'TaskItem should no longer render the in-window TaskContextMenu.');
assert(taskItem.includes('scheduledDates'), 'TaskItem should display scheduledDates.');
assert(taskItem.includes('task.tags'), 'TaskItem should display tags.');
assert(taskItem.includes('task.subtasks') && taskItem.includes('task-subtasks'), 'TaskItem should display persisted subtasks below the parent task.');
assert(taskItem.includes('task-cluster-has-children') && taskItem.includes('onToggleCollapse'), 'TaskItem should make child task clusters collapsible.');
assert(taskItem.includes('SubtaskCard') && taskItem.includes('useVirtualSubtasks'), 'TaskItem should render compact subtask cards with virtualization support.');
assert(taskItem.includes('onToggleSubtask') && taskItem.includes('onDeleteSubtask'), 'TaskItem should support subtask completion and deletion actions.');
assert(taskItem.includes('onViewSubtaskReview'), 'TaskItem should expose subtask completion review actions.');

// Main process popup window + IPC plumbing
assert(mainProcess.includes('openTaskMenuWindow'), 'Main process should create a popup window for the task menu.');
assert(mainProcess.includes("ipcMain.handle('taskContextMenu:open'"), 'Main process should handle taskContextMenu:open.');
assert(mainProcess.includes("ipcMain.handle('taskContextMenu:action'"), 'Main process should forward taskContextMenu:action to the main window.');
assert(mainProcess.includes('workArea'), 'Popup placement should clamp to the screen work area.');

// Preload bridge
assert(preload.includes('openTaskContextMenu'), 'Preload should expose openTaskContextMenu.');
assert(preload.includes('dispatchTaskMenuAction'), 'Preload should expose dispatchTaskMenuAction.');
assert(preload.includes('onTaskMenuAction'), 'Preload should expose onTaskMenuAction.');

// App listens for popup actions and applies them
assert(appTsx.includes('onTaskMenuAction'), 'App should subscribe to popup menu actions.');
assert(appTsx.includes('updateTask'), 'App should apply task updates from popup actions.');
assert(appTsx.includes('editRequest'), 'App should route the popup edit action via editRequest.');

// Renderer routes the popup view
assert(mainTsx.includes("'task-menu'") || mainTsx.includes('task-menu'), 'Renderer entry should route the task-menu view.');
assert(mainTsx.includes("import './styles/index.css';"), 'Renderer entry should import the shared style entry.');
assert(styleEntry.includes("@import './context-menu.css';"), 'Style entry should import context-menu.css once.');
assert(!appTsx.includes("import './styles/context-menu.css';"), 'App should not duplicate the global context-menu.css import.');

// useTasks update method + multi-date visibility
assert(useTasks.includes('addSubtask'), 'useTasks should expose addSubtask.');
assert(useTasks.includes('toggleSubtask') && useTasks.includes('deleteSubtask'), 'useTasks should manage subtask completion and deletion.');
assert(useTasks.includes('updateSubtaskReview') || useTasks.includes('completeSubtaskWithReview'), 'useTasks should support subtask completion review persistence.');
assert(useTasks.includes('toggleTaskCollapse'), 'useTasks should persist tree collapse state.');
assert(taskTransforms.includes('scheduledDates?.includes(date)'), 'Task transforms should consider scheduledDates for date visibility.');
assert(taskSelectors.includes('taskMatchesDate(task, selectedDate, currentDate)'), 'Task selectors should use taskMatchesDate for selected-day visibility.');

// Styling
assert(contextMenuCss.includes('.tm-card'), 'CSS should style the popup glass card.');
assert(contextMenuCss.includes('.tm-popup::before') && contextMenuCss.includes('display: none'), 'Popup should suppress global texture overlays that create gray backing.');
assert(contextMenuCss.includes('.tm-card-shell'), 'Popup should separate shadow shell from menu surface to avoid gray backing.');
assert(contextMenuCss.includes('.tm-date-chip-remove'), 'CSS should style date delete affordances.');
assert(contextMenuCss.includes('.tm-subtask-form'), 'CSS should style the add-subtask form.');
assert(contextMenuCss.includes('.tm-popup'), 'CSS should style the popup window container.');
assert(contextMenuCss.includes('--menu-accent'), 'Popup should be themed via the accent CSS variable.');
assert(contextMenuCss.includes('.dark .tm-card'), 'Popup should have a dark-mode card variant.');
assert(contextMenuCss.includes('.scheduled-dates'), 'CSS should still have scheduled-dates style for task cards.');
// Invisible theme: bottom add-task bar must not render an opaque square.
assert(globalsCss.includes('.theme-invisible .add-task') && globalsCss.includes('background: transparent'),
  'Invisible theme should make the bottom add-task bar transparent (no opaque square).');

console.log('Context menu (popup window) verification passed');
