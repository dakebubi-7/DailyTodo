import { strict as assert } from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const cwd = process.cwd();
const root = existsSync(join(cwd, 'src')) ? cwd : join(cwd, 'app');
const actionsPath = join(root, 'src/hooks/useTaskActions.ts');
const appStateActionsPath = join(root, 'src/hooks/taskAppStateActions.ts');
const completionActionsPath = join(root, 'src/hooks/taskCompletionActions.ts');
const taskTreeActionsPath = join(root, 'src/hooks/taskTreeActions.ts');
const taskOrderingActionsPath = join(root, 'src/hooks/taskOrderingActions.ts');
const useTasksPath = join(root, 'src/hooks/useTasks.ts');

assert.ok(existsSync(actionsPath), 'task action callbacks should be isolated in useTaskActions.ts');
assert.ok(existsSync(appStateActionsPath), 'app-state task actions should be isolated in taskAppStateActions.ts');
assert.ok(existsSync(completionActionsPath), 'completion-review task actions should be isolated in taskCompletionActions.ts');
assert.ok(existsSync(taskTreeActionsPath), 'ordinary task-tree actions should be isolated in taskTreeActions.ts');
assert.ok(existsSync(taskOrderingActionsPath), 'manual ordering actions should be isolated in taskOrderingActions.ts');

const actionsSource = readFileSync(actionsPath, 'utf8');
const appStateActionsSource = readFileSync(appStateActionsPath, 'utf8');
const completionActionsSource = readFileSync(completionActionsPath, 'utf8');
const taskTreeActionsSource = readFileSync(taskTreeActionsPath, 'utf8');
const taskOrderingActionsSource = readFileSync(taskOrderingActionsPath, 'utf8');
const useTasksSource = readFileSync(useTasksPath, 'utf8');

assert.match(actionsSource, /export function useTaskActions\(/, 'task action hook should expose the callback composition boundary');
assert.match(actionsSource, /export interface UseTaskActionsInput/, 'task action hook should make its state dependencies explicit');
assert.match(actionsSource, /export interface TaskActions/, 'task action hook should make its stable public actions explicit');
assert.match(actionsSource, /updateAppSettings/, 'task action hook should retain app-settings update behavior');
assert.match(actionsSource, /deleteTaskReview/, 'task action hook should retain review deletion behavior');
assert.match(actionsSource, /reorderTasksWithinSource/, 'task action hook should retain manual ordering behavior');
assert.match(actionsSource, /createTaskAppStateActionHandlers/, 'task action hook should compose app-state action handlers');
assert.match(actionsSource, /createTaskCompletionActionHandlers/, 'task action hook should compose completion-review action handlers');
assert.match(actionsSource, /createTaskTreeActionHandlers/, 'task action hook should compose ordinary task-tree action handlers');
assert.match(actionsSource, /createTaskOrderingActionHandlers/, 'task action hook should compose manual ordering action handlers');
assert.match(appStateActionsSource, /export function createTaskAppStateActionHandlers\(/, 'app-state actions should expose a focused handler factory');
assert.match(appStateActionsSource, /updateAppSettings/, 'app-state actions should retain settings updates');
assert.match(appStateActionsSource, /updateDailyWork/, 'app-state actions should retain daily work updates');
assert.match(appStateActionsSource, /updateDailyInspiration/, 'app-state actions should retain daily inspiration updates');
assert.match(completionActionsSource, /export function createTaskCompletionActionHandlers\(/, 'completion-review actions should expose a focused handler factory');
assert.match(completionActionsSource, /retainDeletedTaskReviewForObsidian/, 'completion-review actions should retain deleted reviews for Obsidian when needed');
assert.match(completionActionsSource, /confirmDeleteReview\(\)/, 'completion-review actions should retain the delete confirmation boundary');
assert.match(taskTreeActionsSource, /export function createTaskTreeActionHandlers\(/, 'task-tree actions should expose a focused handler factory');
assert.match(taskTreeActionsSource, /clearCompletedTasks\(/, 'task-tree actions should retain selected-day completed-task clearing behavior');
assert.match(taskTreeActionsSource, /addSubtaskToTask\(/, 'task-tree actions should retain subtask creation behavior');
assert.match(taskOrderingActionsSource, /export function createTaskOrderingActionHandlers\(/, 'ordering actions should expose a focused handler factory');
assert.match(taskOrderingActionsSource, /removeTaskFromTaskOrderState/, 'ordering actions should retain task-delete order cleanup');
assert.match(taskOrderingActionsSource, /reorderTasksWithinSourceForDate/, 'ordering actions should retain in-source reorder behavior');
assert.match(useTasksSource, /useTaskActions\(/, 'useTasks should compose the focused task action hook');
assert.doesNotMatch(useTasksSource, /const addTask = useCallback/, 'useTasks should not retain inline task action callbacks');
assert.doesNotMatch(useTasksSource, /const reorderTasksWithinSource = useCallback/, 'useTasks should not retain inline ordering callbacks');

console.log('Task actions hook verification passed.');
