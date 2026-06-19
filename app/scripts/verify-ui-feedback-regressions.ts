import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const main = readFileSync(join(root, 'electron/main.ts'), 'utf8');
const settingsPanel = readFileSync(join(root, 'src/components/SettingsPanel.tsx'), 'utf8');
const taskItem = readFileSync(join(root, 'src/components/TaskItem.tsx'), 'utf8');
const addTaskInput = readFileSync(join(root, 'src/components/AddTaskInput.tsx'), 'utf8');
const appTsx = readFileSync(join(root, 'src/App.tsx'), 'utf8');
const quickCapture = readFileSync(join(root, 'shared/quickCapture.ts'), 'utf8');
const globals = readFileSync(join(root, 'src/styles/globals.css'), 'utf8').replace(/\r\n/g, '\n');

function expectIncludes(source: string, needle: string, message: string) {
  assert.ok(source.includes(needle), message);
}

function expectNotIncludes(source: string, needle: string, message: string) {
  assert.ok(!source.includes(needle), message);
}

expectIncludes(main, 'function normalizeRestoredWindowState', 'Window restore should normalize saved settings-sized bounds before startup.');
expectIncludes(main, 'normalizeRestoredWindowState(stored)', 'Initial bounds should use normalized saved bounds.');
expectIncludes(main, 'persistWindowState(win, { persistSize: false })', 'Opening settings should not persist the temporary 720px width as the default startup size.');
expectIncludes(main, 'persistWindowState(win, { overrideBounds:', 'Closing settings should persist only the restored compact bounds.');
expectIncludes(main, 'SETTINGS_WINDOW_WIDTH', 'Settings mode should still use a wider temporary width.');

expectIncludes(settingsPanel, 'waitingForRealProgress', 'AI generation UI should expose a waiting state instead of synthesizing fake repeated stages.');
expectIncludes(settingsPanel, '等待真实进度', 'Fallback progress copy should explain it is waiting for real progress.');
expectNotIncludes(settingsPanel, 'function fallbackProgress', 'SettingsPanel should not synthesize fake AI pipeline stages.');
expectNotIncludes(settingsPanel, 'setCurrentProgress((current) => fallbackProgress(current))', 'AI progress fallback should not advance through fake stages on a timer.');
expectIncludes(settingsPanel, 'progressDisplay(currentProgress, waitingForRealProgress)', 'Generate button should use real progress or the waiting fallback copy.');
expectNotIncludes(taskItem, 'shouldShowAiAssistBadge', 'TaskItem should not keep the old AI assist badge heuristic; natural quick capture handles AI-like intent.');
expectNotIncludes(taskItem, 'task-ai-assist-badge', 'TaskItem should not render the old AI assist badge.');
expectNotIncludes(globals, '.task-ai-assist-badge', 'AI assist badge styling should be removed because the requirement is natural-language task parsing, not a badge.');
expectIncludes(quickCapture, 'NATURAL_DATE_PATTERNS', 'Quick capture should understand natural Chinese date phrases like 明天 without slash syntax.');
expectIncludes(quickCapture, 'NATURAL_URGENCY_PATTERNS', 'Quick capture should infer high priority from urgent Chinese phrases.');
expectIncludes(quickCapture, 'extractNaturalTaskTitle', 'Quick capture should extract concise task titles from natural sentences.');
expectIncludes(addTaskInput, 'resolveDateIntent(parsed.dateIntent)', 'AddTaskInput should route parsed date intents to taskDate.');
expectIncludes(addTaskInput, 'onAdd(nextText, effectivePriority, effectiveSource, taskDate)', 'AddTaskInput should pass the resolved date into addTask.');
expectIncludes(appTsx, '<ReviewView allTasks={allTasks} onEditReview={editTaskReview} onDeleteReview={deleteTaskReview}', 'Main review tab should support deleting records from context/menu actions.');
expectIncludes(appTsx, 'onAdd={(text, taskPriority, taskSource, taskDate) => addTask(text, taskPriority, taskSource, taskDate)}', 'App should pass parsed quick-capture dates into addTask.');

expectIncludes(globals, '.dark .app-shell[data-theme=\'minimal\'] .settings-field select option', 'Minimal dark select options should be themed for contrast.');
expectIncludes(globals, '.dark .app-shell[data-theme=\'invisible\'] .settings-field select option', 'Invisible dark select options should be themed for contrast.');
expectIncludes(globals, '.dark .app-shell[data-theme=\'neumorphism\'] .settings-field select option', 'Neumorphism dark select options should be themed for contrast.');
expectIncludes(globals, 'background: #111827 !important;', 'Dark select options should use a black/gray popup background, not white.');
expectIncludes(globals, 'color: #f9fafb !important;', 'Dark select options should use readable light text.');

expectIncludes(globals, '.dark .app-shell[data-theme=\'minimal\'] .completion-dialog', 'Minimal dark completion dialog should be explicitly black-gray.');
expectIncludes(globals, '.dark .app-shell[data-theme=\'invisible\'] .completion-dialog', 'Invisible dark completion dialog should be explicitly black-gray.');
expectIncludes(globals, '.dark .app-shell[data-theme=\'neumorphism\'] .completion-dialog', 'Neumorphism dark completion dialog should be explicitly black-gray.');
expectIncludes(globals, 'background: rgba(18, 18, 20, var(--dialog-opacity)) !important;', 'Completion dialog dark surface should be neutral black-gray.');
expectNotIncludes(globals, ".app-shell[data-theme='invisible'] .completion-dialog {\n  background: rgba(31, 42, 56, 0.88)", 'Invisible completion dialog should no longer force blue-gray.');

expectIncludes(globals, "html:not(.dark) .app-shell[data-theme='invisible'] .review-entry", 'Invisible light completion records should follow light theme surfaces.');
expectIncludes(globals, "html:not(.dark) .app-shell[data-theme='minimal'] .app-top", 'Minimal light top bar should be explicitly neutral white/gray.');
expectIncludes(globals, "html:not(.dark) .app-shell[data-theme='minimal'] .add-task", 'Minimal light add task area should be explicitly neutral white/gray.');
expectIncludes(globals, ".dark .app-shell[data-theme='watercolor'] .date-today-button", 'Watercolor dark today button should be explicitly white.');
expectIncludes(globals, ".dark .app-shell[data-theme='watercolor'] .daily-work-textarea", 'Watercolor dark daily work editor should be explicitly blue.');
expectIncludes(globals, ".dark .app-shell[data-theme='watercolor'] .review-edit-textarea", 'Watercolor dark completion record editor should be explicitly blue.');
expectIncludes(globals, ".app-shell[data-theme='invisible'] .task-complete-action:not(.task-complete-action-complete)", 'Invisible incomplete completion action should be deliberately de-emphasized.');
expectIncludes(globals, 'background: rgba(255, 255, 255, 0.025) !important;', 'Invisible mark-complete action should use a very subtle fill.');

expectIncludes(globals, ".task-subtask-row {\n  padding-right: 3.25rem !important;", 'Subtask rows should reserve the same compact trailing action width as the action layer.');
expectIncludes(globals, ".task-delete-zone,\n.task-subtask-delete-zone {\n  transform: none !important;", 'Main/subtask delete zones should not be nudged out of vertical alignment.');
expectIncludes(globals, ".task-action-layer {\n  transform: translateY(-50%) !important;", 'Main task action layer should be vertically centered.');
expectIncludes(globals, ".task-action-layer,\n.task-subtask-action-layer {\n  grid-template-columns: 1.38rem 1.38rem !important;", 'Main and subtask action layers should use the same fixed icon columns.');
expectIncludes(globals, ".task-review-action,\n.task-delete-action,\n.task-subtask-review,\n.task-subtask-delete {\n  width: 1.28rem !important;", 'Review and delete icons should share one visual size across main/subtask rows.');

console.log('verify-ui-feedback-regressions passed');
