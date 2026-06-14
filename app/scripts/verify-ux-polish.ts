import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const cwd = process.cwd();
const root = existsSync(join(cwd, 'src')) ? cwd : join(cwd, 'app');
const i18n = readFileSync(join(root, 'src/i18n.ts'), 'utf8');
const addTaskInput = readFileSync(join(root, 'src/components/AddTaskInput.tsx'), 'utf8');
const taskItem = readFileSync(join(root, 'src/components/TaskItem.tsx'), 'utf8');
const taskTypes = readFileSync(join(root, 'src/types/task.ts'), 'utf8');
const useTasks = readFileSync(join(root, 'src/hooks/useTasks.ts'), 'utf8');
const taskList = readFileSync(join(root, 'src/components/TaskList.tsx'), 'utf8');
const settingsPanel = readFileSync(join(root, 'src/components/SettingsPanel.tsx'), 'utf8');
const taskCompletionDialog = readFileSync(join(root, 'src/components/TaskCompletionDialog.tsx'), 'utf8');
const globalsCss = readFileSync(join(root, 'src/styles/globals.css'), 'utf8');
const personalization = readFileSync(join(root, 'src/types/personalization.ts'), 'utf8');
const app = readFileSync(join(root, 'src/App.tsx'), 'utf8');

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(i18n.includes("inspiration: '灵感随笔'"), 'Inspiration title should be renamed to 灵感随笔.');
assert(i18n.includes("inspirationDescription: '记录我的灵感与碎碎念。'"), 'Inspiration description should match the requested copy.');
assert(!i18n.includes('灵感闪念'), 'Old inspiration label should be removed from user-facing i18n copy.');

assert(taskTypes.includes("export type TaskSource = 'personal' | 'external';"), 'TaskSource type should support personal and external tasks.');
assert(taskTypes.includes('source?: TaskSource'), 'Task should persist an optional source field.');
assert(addTaskInput.includes("const [source, setSource] = useState<TaskSource>('personal')"), 'AddTaskInput should keep selected task source state.');
assert(addTaskInput.includes('source-toggle-button'), 'AddTaskInput should render a compact source toggle button.');
assert(addTaskInput.includes("event.altKey && event.key.toLowerCase() === 's'"), 'AddTaskInput should support Alt+S to toggle task source.');
assert(!addTaskInput.includes('<select'), 'AddTaskInput should not use a large source select in the one-row composer.');
assert(useTasks.includes("source: TaskSource = 'personal'"), 'addTask should accept a task source defaulting to personal.');
assert(useTasks.includes('source,'), 'New tasks should persist their selected source.');
assert(taskItem.includes('task-source-badge'), 'TaskItem should display a source badge.');
assert(taskList.includes('task-source-group'), 'TaskList should render grouped task sections when external tasks are visible.');
assert(taskList.includes("task.source || 'personal'"), 'TaskList should treat missing task source as personal.');
assert(taskList.includes("externalTasks.length > 0"), 'TaskList should only split sections when external tasks exist.');

assert(globalsCss.includes('.daily-command-active::before'), 'Keyboard-selected command rows should have a non-opacity marker.');
assert(globalsCss.includes('.source-toggle-button'), 'Compact source toggle should have explicit styling.');
assert(globalsCss.includes('.task-source-group-title'), 'Task source section headers should have explicit styling.');
assert(globalsCss.includes('.task-source-badge'), 'Task source badge should have explicit styling.');

assert(settingsPanel.includes('primary: true'), 'Settings root should mark primary sections.');
assert(settingsPanel.includes('settings-nav-section-title'), 'Settings root should visually separate common and advanced settings.');
assert(settingsPanel.includes("entry.primary ? 'settings-nav-primary'"), 'Primary settings sections should receive a stronger visual class.');

assert(globalsCss.includes('.app-viewport::before') && globalsCss.includes('display: none'), 'App viewport should suppress pseudo overlays that create transparent square corners.');
assert(globalsCss.includes('clip-path: inset(0 round var(--shell-radius))'), 'App shell should clip themed backgrounds to rounded corners.');
assert(globalsCss.includes('.tm-popup') && globalsCss.includes('border-radius: 18px'), 'Popup window shell should explicitly clip and round outer corners.');
assert(globalsCss.includes('.dark.theme-watercolor .daily-work-textarea') && globalsCss.includes('#0f172a'), 'Watercolor dark theme editor should use a dark readable surface.');
assert(globalsCss.includes('.dark.theme-neumorphism .settings-range-row b'), 'Neumorphism dark theme range value should avoid gray-white badges.');
assert(globalsCss.includes('.dark .completion-field textarea') && globalsCss.includes('rgba(15, 23, 42'), 'Dark completion dialog textareas should use a dark solid surface.');
assert(taskCompletionDialog.includes('dark:bg-zinc-900') || taskCompletionDialog.includes('dark:bg-zinc-900/'), 'Primary completion button should use a clean dark action color instead of gold.');
assert(taskCompletionDialog.includes('dark:border-zinc-700') || taskCompletionDialog.includes('dark:bg-zinc-800'), 'Secondary completion button should also follow the dark neutral palette.');

// Personalization opacity model + area-based fine tuning
assert(personalization.includes('OPACITY_AREAS'), 'Personalization should define area-based opacity metadata.');
assert(personalization.includes('inputOpacity'), 'Personalization should persist input opacity separately.');
assert(personalization.includes('dialogOpacity'), 'Personalization should persist dialog opacity separately.');
assert(personalization.includes('settingsPanelOpacity'), 'Personalization should persist settings panel opacity separately.');
assert(app.includes('--input-opacity'), 'App should expose an input opacity CSS variable.');
assert(app.includes('--dialog-opacity'), 'App should expose a dialog opacity CSS variable.');
assert(app.includes('--settings-panel-opacity'), 'App should expose a settings panel opacity CSS variable.');
assert(app.includes('--glass-saturation'), 'App should expose a glass saturation CSS variable.');

assert(settingsPanel.includes('text.globalAppearance'), 'Personalization should group font size and radius under Global appearance.');
assert(settingsPanel.includes('settings-opacity-range-input'), 'Personalization should show theme opacity recommendations directly on sliders.');
assert(settingsPanel.includes('text.areaFineTuning'), 'Personalization should expose collapsed area fine tuning.');
assert(settingsPanel.includes('OPACITY_AREAS.map'), 'SettingsPanel should render all opacity areas from shared metadata.');
assert(!settingsPanel.includes('setSection(`theme-${preset.id}`'), 'Theme cards should no longer open separate opacity pages.');
assert(!settingsPanel.includes("section === 'theme-minimal'"), 'Separate per-theme opacity pages should be removed.');

// Review buttons only show when a review record exists
assert(taskItem.includes('const hasReviewAction = hasTaskReview(task);'), 'Main task review action should only show when a review exists.');
assert(taskItem.includes('{hasTaskReview(subtask) && (') && taskItem.includes('task-subtask-review task-subtask-review-active'), 'Subtask review action should only render when a review exists.');
assert(!taskItem.includes('补写子任务完成情况'), 'Subtask rows should not expose an empty review button.');
assert(!taskItem.includes('补写完成情况'), 'Main task rows should not expose an empty review button.');

// Frosted glass + rounded clipping
assert(globalsCss.includes('saturate(var(--glass-saturation))'), 'Transparent surfaces should use frosted glass saturation with blur.');
assert(globalsCss.includes('--settings-panel-opacity'), 'Settings panel opacity should be controlled by its own CSS variable.');
assert(globalsCss.includes('--input-opacity'), 'Input opacity should be controlled by its own CSS variable.');
assert(globalsCss.includes('--dialog-opacity'), 'Dialog opacity should be controlled by its own CSS variable.');
assert(globalsCss.includes('isolation: isolate'), 'App shell should isolate layered glass surfaces inside rounded clipping.');

console.log('UX polish verification passed');
