import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const cwd = process.cwd();
const root = existsSync(join(cwd, 'src')) ? cwd : join(cwd, 'app');

const i18n = [
  'src/i18n.ts',
  'src/i18n/shellTextZh.ts',
  'src/i18n/shellTextZhSettings.ts',
  'src/i18n/shellTextEn.ts',
  'src/i18n/shellTextEnSettings.ts',
].map((filePath) => readFileSync(join(root, filePath), 'utf8')).join('\n');
const addTaskInput = readFileSync(join(root, 'src/components/AddTaskInput.tsx'), 'utf8');
const taskItem = readFileSync(join(root, 'src/components/TaskItem.tsx'), 'utf8');
const taskTypes = readFileSync(join(root, 'src/types/task.ts'), 'utf8');
const useTasks = readFileSync(join(root, 'src/hooks/useTasks.ts'), 'utf8');
const taskList = readFileSync(join(root, 'src/components/TaskList.tsx'), 'utf8');
const taskListContent = readFileSync(join(root, 'src/components/taskList/TaskListContent.tsx'), 'utf8');
const taskListDnd = readFileSync(join(root, 'src/components/taskList/taskListDnd.ts'), 'utf8');
const taskListDerivations = readFileSync(join(root, 'src/components/taskList/taskListDerivations.ts'), 'utf8');
const sortableSourceSection = readFileSync(join(root, 'src/components/taskList/SortableSourceSection.tsx'), 'utf8');
const settingsPanel = readFileSync(join(root, 'src/components/SettingsPanel.tsx'), 'utf8');
const settingsPanelShell = readFileSync(join(root, 'src/components/settings/SettingsPanelShell.tsx'), 'utf8');
const settingsPanelNavigation = readFileSync(join(root, 'src/components/settings/settingsPanelNavigation.ts'), 'utf8');
const appearanceSettingsSection = readFileSync(join(root, 'src/components/settings/AppearanceSettingsSection.tsx'), 'utf8');
const appearanceSettings = readFileSync(join(root, 'src/components/settings/appearanceSettings.ts'), 'utf8');
const taskCompletionDialog = readFileSync(join(root, 'src/components/TaskCompletionDialog.tsx'), 'utf8');
const taskItemControls = readFileSync(join(root, 'src/components/taskItem/taskItemControls.tsx'), 'utf8');
const taskItemPresentation = readFileSync(join(root, 'src/components/taskItem/taskItemPresentation.tsx'), 'utf8');
const subtaskCard = readFileSync(join(root, 'src/components/taskItem/SubtaskCard.tsx'), 'utf8');
const subtaskCardControls = readFileSync(join(root, 'src/components/taskItem/subtaskCardControls.tsx'), 'utf8');
const subtaskCardPresentation = readFileSync(join(root, 'src/components/taskItem/subtaskCardPresentation.ts'), 'utf8');
const globalsCss = readFileSync(join(root, 'src/styles/globals.css'), 'utf8');
const personalization = readFileSync(join(root, 'src/types/personalization.ts'), 'utf8');
const app = readFileSync(join(root, 'src/App.tsx'), 'utf8');
const appViewportStyle = readFileSync(join(root, 'src/app/appViewportStyle.ts'), 'utf8');

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(i18n.includes('inspiration:') && i18n.includes('inspirationDescription:'), 'Inspiration i18n copy should keep title and description entries.');
assert(taskTypes.includes("export type TaskSource = 'personal' | 'external';"), 'TaskSource type should support personal and external tasks.');
assert(taskTypes.includes('source?: TaskSource'), 'Task should persist an optional source field.');
assert(addTaskInput.includes("const [source, setSource] = useState<TaskSource>('personal')"), 'AddTaskInput should keep selected task source state.');
assert(addTaskInput.includes('source-toggle-button'), 'AddTaskInput should render a compact source toggle button.');
assert(addTaskInput.includes("event.altKey && event.key.toLowerCase() === 's'"), 'AddTaskInput should support Alt+S to toggle task source.');
assert(!addTaskInput.includes('<select'), 'AddTaskInput should not use a large source select in the one-row composer.');
assert(useTasks.includes("source: TaskSource = 'personal'"), 'addTask should accept a task source defaulting to personal.');
assert(useTasks.includes('source,'), 'New tasks should persist their selected source.');

assert(!taskItem.includes('task-source-badge'), 'TaskItem should not render a per-row source badge after source grouping.');
assert(sortableSourceSection.includes('task-source-group'), 'SortableSourceSection should render grouped task sections when external tasks are visible.');
assert(taskListContent.includes('<SortableSourceSection'), 'TaskListContent should route source sections through the sortable source wrapper.');
assert(taskListDnd.includes("return task.source || 'personal';"), 'TaskList DnD helpers should treat missing task source as personal.');
assert(taskList.includes('getTaskListDerivations(tasks, sourceOrder)'), 'TaskList should delegate source grouping and tag history to the derivation helper.');
assert(taskList.includes('shouldGroupBySource={shouldGroupBySource}'), 'TaskList should pass derived source-group visibility to TaskListContent.');
assert(taskListDerivations.includes("if (source === 'external') shouldGroupBySource = true;"), 'TaskList should only split sections when external tasks exist.');

assert(globalsCss.includes('.daily-command-active::before'), 'Keyboard-selected command rows should have a non-opacity marker.');
assert(globalsCss.includes('.source-toggle-button'), 'Compact source toggle should have explicit styling.');
assert(globalsCss.includes('.task-source-group-title'), 'Task source section headers should have explicit styling.');
assert(!globalsCss.includes('.task-source-badge'), 'Task source badge CSS should stay removed after switching to grouped source headers.');

assert(settingsPanelNavigation.includes('primary: true'), 'Settings navigation should mark primary sections.');
assert(settingsPanelShell.includes('settings-nav-section-title'), 'Settings shell should visually separate common and advanced settings.');
assert(settingsPanelShell.includes("entry.primary ? 'settings-nav-primary'"), 'Primary settings sections should receive a stronger visual class.');
assert(settingsPanel.includes('<SettingsPanelShell'), 'SettingsPanel should delegate navigation and layout to the settings shell.');

assert(globalsCss.includes('.app-viewport::before') && globalsCss.includes('display: none'), 'App viewport should suppress pseudo overlays that create transparent square corners.');
assert(globalsCss.includes('clip-path: inset(0 round var(--shell-radius))'), 'App shell should clip themed backgrounds to rounded corners.');
assert(globalsCss.includes('.tm-popup') && globalsCss.includes('border-radius: 18px'), 'Popup window shell should explicitly clip and round outer corners.');
assert(globalsCss.includes('.dark.theme-watercolor .daily-work-textarea') && globalsCss.includes('#0f172a'), 'Watercolor dark theme editor should use a dark readable surface.');
assert(globalsCss.includes('.dark.theme-neumorphism .settings-range-row b'), 'Neumorphism dark theme range value should avoid gray-white badges.');
assert(globalsCss.includes('.dark .completion-field textarea') && globalsCss.includes('rgba(15, 23, 42'), 'Dark completion dialog textareas should use a dark solid surface.');
assert(taskCompletionDialog.includes('dark:bg-zinc-900') || taskCompletionDialog.includes('dark:bg-zinc-900/'), 'Primary completion button should use a clean dark action color instead of gold.');
assert(taskCompletionDialog.includes('dark:border-zinc-700') || taskCompletionDialog.includes('dark:bg-zinc-800'), 'Secondary completion button should also follow the dark neutral palette.');

assert(personalization.includes('OPACITY_AREAS'), 'Personalization should retain opacity metadata for migration and theme memory.');
assert(personalization.includes('inputOpacity'), 'Personalization should persist input opacity separately.');
assert(personalization.includes('dialogOpacity'), 'Personalization should persist dialog opacity separately.');
assert(personalization.includes('settingsPanelOpacity'), 'Personalization should persist settings panel opacity separately.');
assert(app.includes('createAppViewportStyle(personalization,') && app.includes('themeState.isInvisibleTheme'), 'App should delegate viewport CSS variables to the viewport-style helper.');
assert(appViewportStyle.includes("'--input-opacity': inputOpacity"), 'App viewport style helper should expose an input opacity CSS variable.');
assert(appViewportStyle.includes("'--dialog-opacity': dialogOpacity"), 'App viewport style helper should expose a dialog opacity CSS variable.');
assert(appViewportStyle.includes("'--settings-panel-opacity': settingsPanelOpacity"), 'App viewport style helper should expose a settings panel opacity CSS variable.');
assert(appViewportStyle.includes("'--glass-saturation': glassSaturation"), 'App viewport style helper should expose a glass saturation CSS variable.');

assert(settingsPanel.includes('<AppearanceSettingsSection'), 'SettingsPanel should render the extracted appearance settings section.');
assert(appearanceSettingsSection.includes('text.globalAppearance'), 'Personalization should group font size and radius under Global appearance.');
assert(appearanceSettingsSection.includes('value={glassOpacityValue(settings)}'), 'Appearance section should show one unified glass opacity slider.');
assert(appearanceSettingsSection.includes('onChange={(value) => onChange(withUnifiedGlassOpacity(settings, value))}'), 'Appearance section should update all glass opacity fields together.');
assert(appearanceSettings.includes('export function glassOpacityValue'), 'Appearance helpers should derive the unified glass opacity value.');
assert(appearanceSettings.includes('export function withUnifiedGlassOpacity'), 'Appearance helpers should expose the unified glass opacity writer.');
assert(appearanceSettings.includes('for (const key of OPACITY_KEYS)') && appearanceSettings.includes('next[key] = value;'), 'Unified glass opacity writer should update every opacity key.');
assert(!appearanceSettingsSection.includes('settings-opacity-range-input'), 'Appearance section should not render old per-area recommendation slider UI.');
assert(!appearanceSettingsSection.includes('text.areaFineTuning'), 'Appearance section should not expose old area fine tuning UI.');
assert(!appearanceSettingsSection.includes('OPACITY_AREAS.map'), 'Appearance section should not render old per-area opacity controls.');
assert(!settingsPanel.includes('setSection(`theme-${preset.id}`'), 'Theme cards should no longer open separate opacity pages.');
assert(!settingsPanel.includes("section === 'theme-minimal'"), 'Separate per-theme opacity pages should be removed.');

assert(taskItem.includes('const canOpenReviewAction = task.completed || hasReview;'), 'Main task review action should show for completed tasks even when a review is missing.');
assert(subtaskCard.includes('const canOpenReviewAction = subtask.completed || hasReview;'), 'Subtask review action should show for completed subtasks even when a review is missing.');
assert(taskItem.includes('getTaskReviewActionLabel(hasReview)'), 'Main task review action should derive view/backfill copy from the shared helper.');
assert(subtaskCard.includes('getSubtaskReviewActionLabel(hasReview)'), 'Subtask review action should derive view/backfill copy from the shared helper.');
assert(taskItemControls.includes('task-review-action-empty'), 'Main task review action should mark completed-without-review buttons for styling.');
assert(subtaskCardControls.includes('task-subtask-review task-icon-action task-review-action task-review-action-visible'), 'Subtask rows should keep the extracted review action button styling.');
assert(taskItemPresentation.includes("'\\u67e5\\u770b\\u5b8c\\u6210\\u60c5\\u51b5'") && taskItemPresentation.includes("'\\u8865\\u5199\\u5b8c\\u6210\\u60c5\\u51b5'"), 'Main task review helper should preserve view and backfill labels.');
assert(subtaskCardPresentation.includes("'\\u67e5\\u770b\\u5b50\\u4efb\\u52a1\\u5b8c\\u6210\\u60c5\\u51b5'") && subtaskCardPresentation.includes("'\\u8865\\u5199\\u5b50\\u4efb\\u52a1\\u5b8c\\u6210\\u60c5\\u51b5'"), 'Subtask review helper should preserve view and backfill labels.');

assert(globalsCss.includes('saturate(var(--glass-saturation))'), 'Transparent surfaces should use frosted glass saturation with blur.');
assert(globalsCss.includes('--settings-panel-opacity'), 'Settings panel opacity should be controlled by its own CSS variable.');
assert(globalsCss.includes('--input-opacity'), 'Input opacity should be controlled by its own CSS variable.');
assert(globalsCss.includes('--dialog-opacity'), 'Dialog opacity should be controlled by its own CSS variable.');
assert(globalsCss.includes('isolation: isolate'), 'App shell should isolate layered glass surfaces inside rounded clipping.');

console.log('UX polish verification passed');
