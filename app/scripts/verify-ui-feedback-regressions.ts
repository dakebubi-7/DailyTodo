import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const main = readFileSync(join(root, 'electron/main.ts'), 'utf8');
const mainWindowComposition = readFileSync(join(root, 'electron/mainWindowComposition.ts'), 'utf8');
const mainWindowPersistence = readFileSync(join(root, 'electron/mainWindowPersistence.ts'), 'utf8');
const windowIpc = readFileSync(join(root, 'electron/windowIpc.ts'), 'utf8');
const windowState = readFileSync(join(root, 'electron/windowState.ts'), 'utf8');
const settingsPanel = readFileSync(join(root, 'src/components/SettingsPanel.tsx'), 'utf8');
const aiReviewGeneration = readFileSync(join(root, 'src/components/settings/useAiReviewGeneration.ts'), 'utf8');
const aiReviewManualGenerationSection = readFileSync(
  join(root, 'src/components/settings/AiReviewManualGenerationSection.tsx'),
  'utf8',
);
const taskItem = readFileSync(join(root, 'src/components/TaskItem.tsx'), 'utf8');
const addTaskInput = readFileSync(join(root, 'src/components/AddTaskInput.tsx'), 'utf8');
const appTsx = readFileSync(join(root, 'src/App.tsx'), 'utf8');
const appShellCompositionInputs = readFileSync(join(root, 'src/app/appShellCompositionInputs.ts'), 'utf8');
const appShellMainContentComposition = readFileSync(join(root, 'src/app/appShellMainContentComposition.tsx'), 'utf8');
const appMainContent = readFileSync(join(root, 'src/components/AppMainContent.tsx'), 'utf8');
const titleBar = readFileSync(join(root, 'src/components/TitleBar.tsx'), 'utf8');
const titleBarPrimaryActions = readFileSync(join(root, 'src/components/titleBar/TitleBarPrimaryActions.tsx'), 'utf8');
const compactDayStrip = readFileSync(join(root, 'src/components/CompactDayStrip.tsx'), 'utf8');
const dailyWorkPanel = readFileSync(join(root, 'src/components/DailyWorkPanel.tsx'), 'utf8');
const taskCompletionDialog = readFileSync(join(root, 'src/components/TaskCompletionDialog.tsx'), 'utf8');
const quickCapture = readFileSync(join(root, 'shared/quickCapture.ts'), 'utf8');
const tabBar = readFileSync(join(root, 'src/components/TabBar.tsx'), 'utf8');
const themePresets = readFileSync(join(root, 'src/types/themePresets.ts'), 'utf8');
const globals = readFileSync(join(root, 'src/styles/globals.css'), 'utf8').replace(/\r\n/g, '\n');

function expectIncludes(source: string, needle: string, message: string) {
  assert.ok(source.includes(needle), message);
}

function expectNotIncludes(source: string, needle: string, message: string) {
  assert.ok(!source.includes(needle), message);
}

expectIncludes(windowState, 'function normalizeRestoredWindowState', 'Window restore should normalize saved settings-sized bounds before startup.');
expectIncludes(mainWindowComposition, "from './mainWindowPersistence'", 'Main-window composition should import the extracted persistence helper.');
expectIncludes(mainWindowPersistence, 'normalizeRestoredWindowState(stored)', 'Initial bounds should use normalized saved bounds.');
expectIncludes(windowIpc, 'persistWindowState(win, { persistSize: false })', 'Opening settings should not persist the temporary 720px width as the default startup size.');
expectIncludes(windowIpc, 'persistWindowState(win, { overrideBounds: restoredBounds })', 'Closing settings should persist only the restored compact bounds.');
expectIncludes(main, "from './windowState'", 'Main should import extracted window-state helpers.');
expectIncludes(windowState, 'SETTINGS_WINDOW_WIDTH', 'Settings mode should still use a wider temporary width.');

expectIncludes(aiReviewGeneration, 'waitingForRealProgress', 'AI generation state should expose a waiting value instead of synthesizing fake repeated stages.');
expectIncludes(aiReviewGeneration, 'Waiting for real progress...', 'Fallback progress copy should explain it is waiting for real progress.');
expectNotIncludes(aiReviewGeneration, 'function fallbackProgress', 'AI generation state should not synthesize fake pipeline stages.');
expectNotIncludes(aiReviewGeneration, 'setCurrentProgress((current) => fallbackProgress(current))', 'AI generation state should not advance through fake stages on a timer.');
expectIncludes(aiReviewManualGenerationSection, 'progressDisplay(currentProgress, waitingForRealProgress)', 'Generate button should use real progress or the waiting fallback copy.');
expectNotIncludes(taskItem, 'shouldShowAiAssistBadge', 'TaskItem should not keep the old AI assist badge heuristic; natural quick capture handles AI-like intent.');
expectNotIncludes(taskItem, 'task-ai-assist-badge', 'TaskItem should not render the old AI assist badge.');
expectNotIncludes(globals, '.task-ai-assist-badge', 'AI assist badge styling should be removed because the requirement is natural-language task parsing, not a badge.');
expectIncludes(quickCapture, 'NATURAL_DATE_PATTERNS', 'Quick capture should understand natural Chinese date phrases like 明天 without slash syntax.');
expectIncludes(quickCapture, 'NATURAL_URGENCY_PATTERNS', 'Quick capture should infer high priority from urgent Chinese phrases.');
expectIncludes(quickCapture, 'extractNaturalTaskTitle', 'Quick capture should extract concise task titles from natural sentences.');
expectIncludes(addTaskInput, 'resolveDateIntent(parsed.dateIntent)', 'AddTaskInput should route parsed date intents to taskDate.');
expectIncludes(addTaskInput, 'onAdd(nextText, effectivePriority, effectiveSource, taskDate)', 'AddTaskInput should pass the resolved date into addTask.');
expectIncludes(appTsx, 'useAppShellComposition({', 'App should delegate shell prop composition before rendering main content.');
expectIncludes(appShellCompositionInputs, 'deleteTaskReview: taskState.deleteTaskReview', 'Shell-composition inputs should pass delete-review wiring into composition.');
expectIncludes(appShellCompositionInputs, 'addTask: taskState.addTask', 'Shell-composition inputs should pass quick-capture addTask wiring into composition.');
expectIncludes(appTsx, '<AppMainContent {...shellComposition.mainContentProps} />', 'App should render main content through composed shell props.');
expectIncludes(appShellMainContentComposition, 'const reviewViewProps = {', 'Main-content composition should gather review-view props before delegating main content.');
expectIncludes(appShellMainContentComposition, 'onDeleteReview: deleteTaskReview', 'Main-content composition should keep delete-review wiring.');
expectIncludes(appShellMainContentComposition, 'const addTaskInputProps = {', 'Main-content composition should gather add-task props before delegating main content.');
expectIncludes(appShellMainContentComposition, 'onAdd: addTask', 'Main-content composition should pass parsed quick-capture dates into addTask without a redundant wrapper.');
expectIncludes(appMainContent, '<ReviewView {...reviewViewProps} />', 'AppMainContent should render the review tab with forwarded delete-review support.');
expectIncludes(appMainContent, '<AddTaskInput {...addTaskInputProps} />', 'AppMainContent should render AddTaskInput with forwarded quick-capture addTask wiring.');

expectIncludes(dailyWorkPanel, 'daily-inline-bottom-row', 'Daily inline editor should group the resizer and action buttons into one bottom row.');
expectIncludes(globals, '.dark .add-task-input {\n  border-color: rgba(255, 255, 255, 0.18);\n  background: rgba(255, 255, 255, 0.24);\n  color: #f8fafc;', 'Add-task input should match the brighter gray daily editor surface in dark mode.');
expectIncludes(taskCompletionDialog, 'completion-input-shell', 'Task completion dialog should wrap editable controls in a dedicated shell so the separator is visible.');
expectIncludes(taskCompletionDialog, 'rounded-[14px]', 'Completion dialog outer frame should use the medium-tight rounded radius.');
expectIncludes(taskCompletionDialog, 'className="completion-field completion-percent-field"', 'Completion dialog should mark the percent field with a dedicated scoped class.');
expectIncludes(taskCompletionDialog, 'completion-percent-field-head', 'Completion dialog percent field should split label and value into a flatter header row.');
expectIncludes(globals, '.completion-input-shell {\n  margin-top: 0.28rem;\n  padding-top: 0.55rem;\n  border-top: 1px solid rgba(39, 39, 42, 0.1);', 'Completion fields should visibly separate the label text area from the editable control area.');
expectIncludes(globals, '.completion-dialog .completion-field {\n  border-radius: 0.9rem;', 'Completion dialog field cards should use a tighter outer radius.');
expectIncludes(globals, '.completion-dialog .completion-percent-field', 'Only the completion dialog should flatten the percent field shell.');
expectIncludes(globals, '.completion-dialog .completion-field:has(select) .completion-input-shell {\n  border: 0;\n  background: transparent;\n  box-shadow: none;\n  padding: 0;\n  border-radius: 0.68rem;', 'Completion dialog select shell should use a tighter inner outer-shell radius.');
expectIncludes(globals, '.completion-dialog .completion-percent-field .completion-input-shell {\n  border-radius: 0.74rem;', 'Completion dialog progress shell should use a tighter shell radius.');
expectIncludes(globals, ".completion-dialog .completion-percent-field input[type='range']::-webkit-slider-runnable-track", 'Only the completion dialog percent field should define a local slider track style.');
expectNotIncludes(globals, ".completion-field input[type='range']::-webkit-slider-runnable-track", 'The flatter slider styling should not leak into the shared completion-field range rule.');
expectIncludes(globals, '.completion-dialog .completion-field:has(select) .completion-input-shell {\n  border: 0;\n  background: transparent;\n  box-shadow: none;\n  padding: 0;', 'Completion status dropdown shell should not keep the bright white edge in non-dark themes.');
expectIncludes(globals, '.completion-field:has(select) .completion-input-shell {\n  border: 1px solid rgba(39, 39, 42, 0.1);\n  border-radius: 0.75rem;\n  background: rgba(255, 255, 255, 0.72);', 'Completion status dropdown should draw a full input-like shell in the generic layer so it stays visible in light theme too.');
expectIncludes(globals, '.completion-dialog .completion-field select {\n  min-height: 2.55rem;\n  border: 1px solid rgba(39, 39, 42, 0.08);\n  border-radius: 0.68rem;\n  background: rgba(244, 244, 245, 0.92);', 'Completion status select should carry its own light neutral surface in non-dark themes.');
expectIncludes(globals, ".dark .app-shell[data-theme='minimal'] .completion-field:has(select) .completion-input-shell {\n  border: 1px solid rgba(255, 255, 255, 0.14) !important;\n  border-radius: 0.68rem;\n  background: #6a6a6f !important;\n  background-color: #6a6a6f !important;\n  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);\n  padding: 0.08rem 0.16rem !important;", 'Minimal dark completion status dropdown should keep the lighter shell with the tighter radius.');
expectIncludes(globals, '.dark .app-shell[data-theme=\'minimal\'] .completion-field select {\n  min-height: 2rem;\n  border: 0 !important;\n  border-radius: 0.6rem;\n  background: transparent !important;\n  background-color: transparent !important;\n  color: #f8fafc !important;\n  padding: 0.28rem 2.1rem 0.28rem 0.72rem !important;', 'Minimal dark completion status select should be more compact inside the shell.');
expectIncludes(globals, '.dark .app-shell[data-theme=\'minimal\'] .completion-field:has(input[type=\'range\']) .completion-input-shell {\n  border: 0 !important;\n  border-radius: 0 !important;\n  background: transparent !important;\n  background-color: transparent !important;\n  box-shadow: none !important;\n  padding: 0 !important;', 'Completion progress field should not use a second tinted surface around the slider.');
expectIncludes(globals, '.dark .app-shell[data-theme=\'minimal\'] .completion-percent-field input[type=\'range\'] {\n  accent-color: #d4d4d8 !important;', 'Completion progress slider should use a gray/gray-white accent.');
expectIncludes(globals, '.dark .app-shell[data-theme=\'minimal\'] .completion-percent-field input[type=\'range\']::-webkit-slider-runnable-track {\n  height: 0.38rem;\n  border-radius: 999px;\n  background: rgba(228, 228, 231, 0.72);', 'Completion progress slider track should render as gray/gray-white in Chromium.');
expectIncludes(globals, '.dark .app-shell[data-theme=\'minimal\'] .completion-percent-field input[type=\'range\']::-webkit-slider-thumb {\n  -webkit-appearance: none;\n  appearance: none;\n  width: 1.18rem;\n  height: 1.18rem;', 'Completion progress slider thumb should render as a gray-white knob in Chromium.');

expectIncludes(globals, '.dark .app-shell[data-theme=\'minimal\'] .add-task-input {\n  border-color: rgba(255, 255, 255, 0.18) !important;\n  background: #4f4f52 !important;\n  background-color: #4f4f52 !important;\n  color: #f8fafc !important;\n  font-size: 0.86rem !important;\n  font-weight: 650 !important;', 'Minimal dark add-task input should exactly match the daily editor background and text tokens.');
expectIncludes(globals, '.dark .app-shell[data-theme=\'minimal\'] .add-task-input::placeholder {\n  color: rgba(248, 250, 252, 0.7) !important;', 'Minimal dark add-task input placeholder should match the daily editor placeholder tone.');
expectIncludes(globals, '.dark .add-task-input:focus {\n  border-color: rgba(255, 255, 255, 0.3);\n  background: rgba(255, 255, 255, 0.28);', 'Add-task input focus state should stay in the same gray surface family.');

expectIncludes(globals, 'daily inline panel height tighten', 'Daily inline panel should have a final height-tightening override.');
expectIncludes(globals, '.daily-inline-panel {\n  padding: 0.55rem 0.7rem 0.5rem !important;', 'Daily inline panel should use tighter padding so the lower action area wastes less space.');
expectIncludes(globals, '.daily-inline-panel .daily-dialog-editor {\n  flex: 0 0 auto !important;', 'Daily inline panel editor should size to content instead of stretching the empty bottom area.');
expectIncludes(globals, '.daily-inline-bottom-row {\n  position: relative;\n  display: flex;\n  align-items: center;\n  justify-content: center;', 'Daily inline panel should keep the resizer centered within the shared bottom row.');
expectIncludes(globals, '.daily-inline-panel .daily-inline-resizer {\n  flex: 0 0 auto;\n  justify-content: center;\n  height: 0.46rem !important;', 'Daily inline panel resizer should remain centered and compact.');
expectIncludes(globals, '.daily-inline-panel .daily-dialog-actions {\n  position: absolute;\n  right: 0;\n  top: 50%;', 'Daily inline panel actions should stay on the right while sharing the same row as the centered resizer.');
expectIncludes(globals, '.daily-inline-panel .daily-dialog-actions button {\n  min-height: 1.9rem;\n  padding: 0 0.78rem;', 'Daily inline panel action buttons should be slightly shorter.');

expectIncludes(globals, 'daily inline editor dark contrast polish', 'Daily inline editor should have a final dark contrast polish override.');
expectIncludes(globals, '.dark .daily-dialog-textarea.daily-inline-textarea {\n  border-color: rgba(255, 255, 255, 0.18) !important;\n  background: #4f4f52 !important;', 'Daily inline editor textarea should use the requested darker gray background in dark mode.');
expectIncludes(globals, '.dark .daily-dialog-actions .daily-dialog-cancel {\n  border: 1px solid rgba(255, 255, 255, 0.18) !important;\n  background: rgba(255, 255, 255, 0.08) !important;\n  color: #e4e4e7 !important;', 'Daily inline editor cancel button should be readable in dark mode.');
expectIncludes(globals, '.dark .daily-dialog-actions .daily-dialog-save {\n  border: 1px solid rgba(255, 255, 255, 0.82) !important;\n  background: #ffffff !important;\n  color: #18181b !important;', 'Daily inline editor save button should use a clear white primary action in dark mode.');

expectIncludes(globals, 'minimal white settings neutralization', 'Minimal white settings pages should have a final neutralization override block.');
expectIncludes(globals, "html:not(.dark) .app-shell[data-theme='minimal'] .settings-panel {\n  background: rgba(255, 255, 255, 0.96) !important;", 'Minimal white settings panel should use a neutral white surface, not blue-gray.');
expectIncludes(globals, "html:not(.dark) .app-shell[data-theme='minimal'] .settings-section {\n  background: rgba(250, 250, 250, 0.96) !important;", 'Minimal white settings sections should use neutral light-gray cards.');
expectIncludes(globals, "html:not(.dark) .app-shell[data-theme='minimal'] :is(.settings-field input, .settings-field select, .settings-field textarea) {\n  background: #ffffff !important;", 'Minimal white settings fields should use neutral white inputs instead of blue-gray.');
expectIncludes(globals, "html:not(.dark) .app-shell[data-theme='minimal'] .settings-nav-item[aria-current='page']", 'Minimal white settings navigation active state should be neutralized.');
expectIncludes(globals, "html:not(.dark) .app-shell[data-theme='minimal'] :is(.settings-reset-button, .settings-switch-row, .settings-page button:not(.settings-nav-item))", 'Minimal white settings action controls should use neutral black-gray styling.');

expectIncludes(globals, 'neumorphism dark settings unified surface', 'Neumorphism dark settings should have a final unified surface override block.');
expectIncludes(globals, ".dark .app-shell[data-theme='neumorphism'] .settings-panel {\n  background: rgba(var(--neu-bg), calc(var(--settings-panel-opacity))) !important;", 'Neumorphism dark settings panel should use the theme surface instead of a hard-coded gray panel.');
expectIncludes(globals, ".dark .app-shell[data-theme='neumorphism'] .settings-panel-header {\n  background: rgba(var(--neu-bg), calc(var(--settings-panel-opacity))) !important;", 'Neumorphism dark settings header should use the same theme surface as the panel.');
expectIncludes(globals, ".dark .app-shell[data-theme='neumorphism'] .settings-v2-sidebar {\n  border-right-color: color-mix(in srgb, var(--neu-d) 55%, transparent) !important;\n  background: rgba(var(--neu-bg), calc(var(--settings-panel-opacity))) !important;", 'Neumorphism dark settings sidebar should use the theme panel surface instead of a generic dark gray strip.');
expectIncludes(globals, ".dark .app-shell[data-theme='neumorphism'] .settings-nav-item {\n  background: rgba(var(--neu-bg), calc(var(--control-opacity))) !important;", 'Neumorphism dark settings nav cards should reuse the theme control surface.');
expectIncludes(globals, ".dark .app-shell[data-theme='neumorphism'] .settings-nav-primary {\n  background: rgba(var(--neu-bg), calc(var(--control-opacity))) !important;", 'Neumorphism dark primary nav card should also use the theme control surface.');
expectIncludes(globals, ".dark .app-shell[data-theme='neumorphism'] .settings-v2-page .settings-section {\n  background: rgba(var(--neu-bg), calc(var(--panel-opacity))) !important;", 'Neumorphism dark settings sections should reuse the theme panel surface.');
expectIncludes(globals, ".dark .app-shell[data-theme='neumorphism'] :is(.settings-nav-item, .settings-switch-row, .settings-reset-button) {\n  background: rgba(var(--neu-bg), calc(var(--control-opacity))) !important;", 'Neumorphism dark settings controls should reuse the theme control surface.');
expectIncludes(globals, ".dark .app-shell[data-theme='neumorphism'] :is(.settings-field input, .settings-field select, .settings-field textarea) {\n  background: rgba(var(--neu-bg), calc(var(--control-opacity))) !important;", 'Neumorphism dark settings fields should use the theme control surface instead of a hard-coded gray.');
expectIncludes(globals, ".dark .app-shell[data-theme='neumorphism'] .theme-preset-card {\n  background: rgba(var(--neu-bg), calc(var(--panel-opacity))) !important;", 'Neumorphism dark appearance theme cards should use the theme panel surface family.');

expectIncludes(globals, 'dark mode settings neutralization', 'Theme-dark-mode settings should have a final neutralization override block.');
expectIncludes(globals, ".theme-dark-mode.dark .settings-panel {\n  background: rgba(24, 24, 27, 0.96) !important;", 'Theme-dark-mode settings panel should use the same neutral black-gray surface as minimal dark settings.');
expectIncludes(globals, ".theme-dark-mode.dark .settings-v2-sidebar {\n  border-right-color: rgba(255, 255, 255, 0.1) !important;\n  background: rgba(24, 24, 27, 0.96) !important;", 'Theme-dark-mode settings sidebar should use the same neutral black-gray surface as minimal dark settings.');
expectIncludes(globals, ".theme-dark-mode.dark .settings-v2-page .settings-section {\n  background: rgba(39, 39, 42, 0.92) !important;", 'Theme-dark-mode settings sections should use neutral dark-gray cards instead of blue-gray.');
expectIncludes(globals, ".theme-dark-mode.dark :is(.settings-nav-item, .settings-switch-row, .settings-reset-button) {\n  background: rgba(63, 63, 70, 0.96) !important;", 'Theme-dark-mode settings controls should use the same black-gray surfaces as minimal dark settings.');
expectIncludes(globals, ".theme-dark-mode.dark :is(.settings-field input, .settings-field select, .settings-field textarea) {\n  background: #3f3f46 !important;", 'Theme-dark-mode settings fields should use neutral gray inputs instead of blue-gray.');
expectIncludes(globals, ".theme-dark-mode.dark .theme-preset-card {\n  background: rgba(39, 39, 42, 0.92) !important;", 'Theme-dark-mode appearance theme cards should use the same neutral dark-gray surfaces.');

expectIncludes(globals, 'invisible dark settings neutralization', 'Invisible dark settings should have a final neutralization override block.');
expectIncludes(globals, ".dark .app-shell[data-theme='invisible'] .settings-panel {\n  background: rgba(24, 24, 27, 0.98) !important;", 'Invisible dark settings panel should use the neutral black-gray surface defined by its final override.');
expectIncludes(globals, ".dark .app-shell[data-theme='invisible'] .settings-v2-sidebar {\n  border-right-color: rgba(255, 255, 255, 0.1) !important;\n  background: rgba(24, 24, 27, 0.98) !important;", 'Invisible dark settings sidebar should use the same final neutral black-gray surface.');
expectIncludes(globals, ".dark .app-shell[data-theme='invisible'] .settings-v2-content {\n  background: rgba(24, 24, 27, 0.98) !important;", 'Invisible dark settings content column should use the same final neutral black-gray base surface.');
expectIncludes(globals, ".dark .app-shell[data-theme='invisible'] .settings-v2-page {\n  background: transparent !important;", 'Invisible dark settings page body should stay transparent so the content column surface is the only base layer.');
expectIncludes(globals, ".dark .app-shell[data-theme='invisible'] .settings-v2-page .settings-section {\n  background: rgba(39, 39, 42, 0.92) !important;", 'Invisible dark settings sections should use neutral dark-gray cards instead of blue-gray.');
expectIncludes(globals, ".dark .app-shell[data-theme='invisible'] :is(.settings-nav-item, .settings-switch-row, .settings-reset-button) {\n  background: rgba(63, 63, 70, 0.96) !important;", 'Invisible dark settings controls should use the same black-gray surfaces as minimal dark settings.');
expectIncludes(globals, ".dark .app-shell[data-theme='invisible'] :is(.settings-field input, .settings-field select, .settings-field textarea) {\n  background: #3f3f46 !important;", 'Invisible dark settings fields should use neutral gray inputs instead of blue-gray.');
expectIncludes(globals, ".dark .app-shell[data-theme='invisible'] .theme-preset-card {\n  background: rgba(39, 39, 42, 0.92) !important;", 'Invisible dark appearance theme cards should use the same neutral dark-gray surfaces.');

expectIncludes(globals, 'custom dark settings neutralization', 'Custom dark settings should have a final neutralization override block.');
expectIncludes(globals, ".dark .app-shell[data-theme='custom'] .settings-panel {\n  background: rgba(24, 24, 27, 0.96) !important;", 'Custom dark settings panel should use the same neutral black-gray surface as minimal dark settings.');
expectIncludes(globals, ".dark .app-shell[data-theme='custom'] .settings-v2-sidebar {\n  border-right-color: rgba(255, 255, 255, 0.1) !important;\n  background: rgba(24, 24, 27, 0.96) !important;", 'Custom dark settings sidebar should use the same neutral black-gray surface as minimal dark settings.');
expectIncludes(globals, ".dark .app-shell[data-theme='custom'] .settings-v2-content {\n  background: rgba(24, 24, 27, 0.96) !important;", 'Custom dark settings content column should use the same neutral black-gray base surface.');
expectIncludes(globals, ".dark .app-shell[data-theme='custom'] .settings-v2-page {\n  background: transparent !important;", 'Custom dark settings page body should stay transparent so the content column surface is the only base layer.');
expectIncludes(globals, ".dark .app-shell[data-theme='custom'] .settings-v2-page .settings-section {\n  background: rgba(39, 39, 42, 0.92) !important;", 'Custom dark settings sections should use neutral dark-gray cards instead of blue-gray.');
expectIncludes(globals, ".dark .app-shell[data-theme='custom'] :is(.settings-nav-item, .settings-switch-row, .settings-reset-button) {\n  background: rgba(63, 63, 70, 0.96) !important;", 'Custom dark settings controls should use the same black-gray surfaces as minimal dark settings.');
expectIncludes(globals, ".dark .app-shell[data-theme='custom'] :is(.settings-field input, .settings-field select, .settings-field textarea) {\n  background: #3f3f46 !important;", 'Custom dark settings fields should use neutral gray inputs instead of blue-gray.');
expectIncludes(globals, ".dark .app-shell[data-theme='custom'] .theme-preset-card {\n  background: rgba(39, 39, 42, 0.92) !important;", 'Custom dark appearance theme cards should use the same neutral dark-gray surfaces.');

expectIncludes(globals, 'dark minimal settings neutralization', 'Minimal dark settings pages should have a final neutralization override block.');
expectIncludes(globals, ".dark .app-shell[data-theme='minimal'] .settings-panel {\n  background: rgba(24, 24, 27, 0.96) !important;", 'Minimal dark settings panel should use a neutral dark-gray surface, not blue-gray.');
expectIncludes(globals, ".dark .app-shell[data-theme='minimal'] .settings-v2-page .settings-section {\n  background: rgba(39, 39, 42, 0.92) !important;", 'Minimal dark settings sections should use neutral dark-gray cards.');
expectIncludes(globals, ".dark .app-shell[data-theme='minimal'] :is(.settings-field input, .settings-field select, .settings-field textarea) {\n  background: #3f3f46 !important;", 'Minimal dark settings fields should use neutral gray inputs instead of blue-gray.');
expectIncludes(globals, ".dark .app-shell[data-theme='minimal'] .theme-preset-card {\n  border-color: rgba(255, 255, 255, 0.14) !important;\n  background: rgba(39, 39, 42, 0.92) !important;", 'Minimal dark appearance theme cards should use neutral dark-gray surfaces.');
expectIncludes(globals, ".dark .app-shell[data-theme='minimal'] :is(.settings-reset-button, .settings-switch-row, .settings-nav-item) {\n  background: rgba(63, 63, 70, 0.96) !important;", 'Minimal dark settings action controls should use neutral black-gray styling.');

expectIncludes(globals, 'generic dark template editor neutralization', 'The generic dark template editor path should have a final black-gray neutralization override block.');
expectIncludes(globals, ".dark .template-editor-overlay {\n  background: rgba(24, 24, 27, 0.42) !important;", 'Generic dark template editor overlay should use a neutral black-gray blur backdrop.');
expectIncludes(globals, ".dark .template-editor-modal {\n  border-color: rgba(255, 255, 255, 0.12) !important;\n  background: rgba(24, 24, 27, 0.98) !important;", 'Generic dark template editor modal should use a neutral dark-gray surface.');
expectIncludes(globals, ".dark .template-block-row {\n  border-color: rgba(255, 255, 255, 0.12) !important;\n  background: rgba(39, 39, 42, 0.92) !important;", 'Generic dark template blocks should use neutral dark-gray rows.');
expectIncludes(globals, ".dark :is(.block-name-input, .render-type-select, .block-prompt-input) {\n  background: #3f3f46 !important;", 'Generic dark template editor inputs should use neutral gray controls.');
expectIncludes(globals, ".dark :is(.block-delete-btn, .block-prompt-toggle, .template-editor-actions-row button, .template-editor-footer button) {\n  background: rgba(63, 63, 70, 0.96) !important;", 'Generic dark template editor actions should use neutral black-gray buttons.');

expectIncludes(globals, 'dark minimal template editor neutralization', 'Minimal dark template editor should have a final neutralization override block.');
expectIncludes(globals, ".dark .app-shell[data-theme='minimal'] .template-editor-overlay {\n  background: rgba(24, 24, 27, 0.42) !important;", 'Minimal dark template editor overlay should use a neutral black-gray blur backdrop.');
expectIncludes(globals, ".dark .app-shell[data-theme='minimal'] .template-editor-modal {\n  border-color: rgba(255, 255, 255, 0.12) !important;\n  background: rgba(24, 24, 27, 0.98) !important;", 'Minimal dark template editor modal should use a neutral dark-gray surface.');
expectIncludes(globals, ".dark .app-shell[data-theme='minimal'] .template-block-row {\n  border-color: rgba(255, 255, 255, 0.12) !important;\n  background: rgba(39, 39, 42, 0.92) !important;", 'Minimal dark template blocks should use neutral dark-gray rows.');
expectIncludes(globals, ".dark .app-shell[data-theme='minimal'] :is(.block-name-input, .render-type-select, .block-prompt-input) {\n  background: #3f3f46 !important;", 'Minimal dark template editor inputs should use neutral gray controls.');
expectIncludes(globals, ".dark .app-shell[data-theme='minimal'] :is(.block-delete-btn, .block-prompt-toggle, .template-editor-actions-row button, .template-editor-footer button) {\n  background: rgba(63, 63, 70, 0.96) !important;", 'Minimal dark template editor actions should use neutral black-gray buttons.');

expectIncludes(globals, ".dark .app-shell[data-theme='minimal'] .ai-account-inline-actions > select {\n  background: #3f3f46 !important;", 'Minimal dark AI account selector should use a neutral gray select surface.');
expectIncludes(globals, ".dark .app-shell[data-theme='minimal'] .ai-account-inline-actions > select option {\n  background: #2a2a2e !important;", 'Minimal dark AI account selector menu should use a neutral dark-gray popup.');
expectIncludes(globals, ".dark .app-shell[data-theme='minimal'] .render-type-select {\n  background: rgba(63, 63, 70, 0.96) !important;", 'Minimal dark template editor select should use a neutral gray surface.');
expectIncludes(globals, ".dark .app-shell[data-theme='minimal'] .render-type-select option {\n  background: #2a2a2e !important;", 'Minimal dark template editor popup options should use a neutral dark-gray menu.');

expectIncludes(globals, '.dark .app-shell[data-theme=\'minimal\'] .settings-field select option', 'Minimal dark select options should be themed for contrast.');
expectIncludes(globals, '.dark .app-shell[data-theme=\'invisible\'] .settings-field select option', 'Invisible dark select options should be themed for contrast.');
expectIncludes(globals, '.dark .app-shell[data-theme=\'neumorphism\'] .settings-field select option', 'Neumorphism dark select options should be themed for contrast.');
expectIncludes(globals, 'background: #111827 !important;', 'Dark select options should use a black/gray popup background, not white.');
expectIncludes(globals, 'color: #f9fafb !important;', 'Dark select options should use readable light text.');

expectIncludes(globals, '.dark .app-shell[data-theme=\'minimal\'] .completion-dialog', 'Minimal dark completion dialog should be explicitly black-gray.');
expectIncludes(globals, '.dark .app-shell[data-theme=\'invisible\'] .completion-dialog', 'Invisible dark completion dialog should be explicitly black-gray.');
expectIncludes(globals, ".dark .app-shell[data-theme='invisible'] :is(.completion-field, .completion-field select, .completion-field textarea) {\n  background: rgba(24, 24, 27, 0.86) !important;", 'Invisible dark completion fields should use neutral black-gray surfaces instead of blue-gray.');
expectIncludes(globals, ".dark .app-shell[data-theme='invisible'] .completion-field select option {\n  background: #18181b !important;", 'Invisible dark completion select menu should use a neutral black-gray popup.');
expectIncludes(globals, '.dark .app-shell[data-theme=\'neumorphism\'] .completion-dialog', 'Neumorphism dark completion dialog should be explicitly black-gray.');
expectIncludes(globals, 'background: rgba(18, 18, 20, var(--dialog-opacity)) !important;', 'Completion dialog dark surface should be neutral black-gray.');
expectNotIncludes(globals, ".app-shell[data-theme='invisible'] .completion-dialog {\n  background: rgba(31, 42, 56, 0.88)", 'Invisible completion dialog should no longer force blue-gray.');

expectIncludes(globals, "html:not(.dark) .app-shell[data-theme='invisible'] .completion-dialog {\n  border-color: rgba(39, 39, 42, 0.1) !important;\n  background: rgba(255, 255, 255, 0.78) !important;", 'Invisible light completion dialog should explicitly return to a light surface.');
expectIncludes(globals, "html:not(.dark) .app-shell[data-theme='invisible'] :is(.completion-field, .completion-field select, .completion-field textarea) {\n  background: rgba(255, 255, 255, 0.78) !important;", 'Invisible light completion fields should explicitly return to a light surface.');
expectIncludes(globals, "html:not(.dark) .app-shell[data-theme='invisible'] .review-entry", 'Invisible light completion records should follow light theme surfaces.');
expectIncludes(globals, "html:not(.dark) .app-shell[data-theme='minimal'] .app-top", 'Minimal light top bar should be explicitly neutral white/gray.');
expectIncludes(globals, "html:not(.dark) .app-shell[data-theme='minimal'] .add-task", 'Minimal light add task area should be explicitly neutral white/gray.');
expectIncludes(globals, ".dark .app-shell[data-theme='watercolor'] .daily-work-textarea", 'Watercolor dark daily work editor should be explicitly blue.');
expectIncludes(globals, ".dark .app-shell[data-theme='watercolor'] .review-edit-textarea", 'Watercolor dark completion record editor should be explicitly blue.');
expectIncludes(globals, ".app-shell[data-theme='invisible'] .task-complete-action:not(.task-complete-action-complete)", 'Invisible incomplete completion action should be deliberately de-emphasized.');
expectIncludes(globals, 'background: rgba(255, 255, 255, 0.025) !important;', 'Invisible mark-complete action should use a very subtle fill.');

expectIncludes(titleBar, 'const togglePrimarySelected = (event: React.MouseEvent<HTMLButtonElement>) => {', 'TitleBar should have a DOM-level selected-state toggle for primary buttons.');
expectIncludes(titleBar, "button.dataset.selected = button.dataset.selected === 'true' ? 'false' : 'true';", 'Primary titlebar buttons should toggle their selected dataset directly on click.');
expectIncludes(titleBarPrimaryActions, 'data-titlebar-primary="true"', 'Primary titlebar buttons should be marked for direct selected-state styling.');
expectIncludes(titleBarPrimaryActions, "data-selected={pinned ? 'true' : 'false'}", 'Pin button should expose its selected dataset state.');
expectIncludes(titleBarPrimaryActions, "data-selected={visualLockActive ? 'true' : 'false'}", 'Lock button should expose its selected dataset state.');
expectIncludes(titleBarPrimaryActions, "data-selected={visualSettingsActive ? 'true' : 'false'}", 'Settings button should expose its selected dataset state.');
expectIncludes(titleBarPrimaryActions, 'className={`titlebar-icon-button ${pinned ? \'titlebar-icon-active\' : \'\'}`}', 'Pin button should still expose active class semantics.');
expectIncludes(titleBarPrimaryActions, 'className={`titlebar-icon-button ${visualLockActive ? \'titlebar-icon-active\' : \'\'}`}', 'Lock button should expose active class semantics from local visual state.');
expectIncludes(titleBarPrimaryActions, 'className={`titlebar-icon-button ${visualSettingsActive ? \'titlebar-icon-active\' : \'\'}`}', 'Settings button should expose active class semantics from local visual state.');

expectIncludes(globals, ".titlebar-actions-primary .titlebar-icon-button[data-selected='true'] {", 'Titlebar primary selected buttons should use a direct data-selected CSS override.');
expectIncludes(globals, 'border-color: #ffffff !important;', 'Primary selected titlebar buttons should use an unmistakably white border.');
expectIncludes(globals, 'background: #ffffff !important;', 'Primary selected titlebar buttons should use a white selected background.');
expectIncludes(globals, 'color: #000000 !important;', 'Primary selected titlebar buttons should use black icons on the selected background.');
expectIncludes(globals, 'box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.35), 0 6px 14px rgba(0, 0, 0, 0.22) !important;', 'Primary selected titlebar buttons should use a stronger selected lift.');

expectIncludes(globals, 'invisible titlebar pressed feedback', 'Invisible titlebar controls should have a dedicated pressed-state feedback block.');
expectIncludes(globals, ".app-shell[data-theme='invisible'] :is(.titlebar-icon-button, .titlebar-mode):active {", 'Invisible light titlebar controls should define a clear pressed state.');
expectIncludes(globals, 'background: #000000 !important;', 'Invisible light titlebar pressed controls should invert to solid black.');
expectIncludes(globals, 'color: #ffffff !important;', 'Invisible light titlebar pressed controls should invert icons to white.');
expectIncludes(globals, ".dark .app-shell[data-theme='invisible'] :is(.titlebar-icon-button, .titlebar-mode):active {", 'Invisible dark titlebar controls should define a clear pressed state.');
expectIncludes(globals, 'background: #ffffff !important;', 'Invisible dark titlebar pressed controls should invert to solid white.');
expectIncludes(globals, 'color: #000000 !important;', 'Invisible dark titlebar pressed controls should invert icons to black.');
expectIncludes(globals, 'transform: translateY(1px) scale(0.94) !important;', 'Invisible titlebar pressed controls should visibly depress without changing layout.');

expectIncludes(globals, "--task-action-safe-space: 4.85rem;", 'Task action column should define a shared trailing safe-space token.');
expectIncludes(globals, ".task-subtask-row {\n  padding-right: var(--task-action-safe-space) !important;", 'Subtask rows should reserve the same trailing safe space token as the main task action column.');
expectIncludes(globals, ".task-delete-zone,\n.task-subtask-delete-zone {\n  transform: none !important;", 'Main/subtask delete zones should not be nudged out of vertical alignment.');
expectIncludes(globals, ".task-action-layer {\n  display: grid !important;", 'Main task action layer should use the final shared grid model.');
expectIncludes(globals, "grid-template-columns: var(--task-review-action-width) var(--task-delete-action-width) !important;", 'Main and subtask action layers should use the same final icon columns.');
expectIncludes(globals, ".task-subtask-action-layer.task-action-layer {\n  position: absolute !important;\n  right: var(--task-action-right) !important;", 'Subtask action layer should align with the main task action layer right column.');

expectIncludes(globals, "date navigator theme surface fix", 'Date navigator should have a final theme-surface override for the manual-test stripe regression.');
expectIncludes(globals, ".app-shell :is(.date-current, .date-current:hover) {\n  background: transparent !important;", 'Date text block should not draw a white or black stripe under the date.');
expectIncludes(globals, "html:not(.dark) .app-shell :is(.date-stepper button, .date-calendar-button, .date-current) {\n  color: #000000 !important;", 'Light themes should use pure black date navigator text and icons.');
expectIncludes(globals, ".dark .app-shell :is(.date-stepper button, .date-calendar-button, .date-current) {\n  color: #ffffff !important;", 'Dark themes should use pure white date navigator text and icons.');
expectIncludes(globals, ".app-shell :is(.date-card, .date-stepper, .date-calendar-button) {\n  background: var(--date-nav-surface) !important;", 'Date card and controls should use the current theme surface instead of hard-coded white/blue fills.');
expectIncludes(globals, ".app-shell[data-theme='watercolor'].dark .date-current,\n.dark .app-shell[data-theme='watercolor'] .date-current {\n  background: transparent !important;", 'Watercolor dark date text should not inherit the old blue gradient stripe.');
expectIncludes(globals, "date navigator themes: forest, morandi, minimal, neumorphism, invisible, watercolor, custom", 'Date navigator regression should enumerate every selectable theme plus custom.');
for (const themeId of ['forest', 'morandi', 'minimal', 'neumorphism', 'invisible', 'watercolor', 'custom']) {
  expectIncludes(globals, `.app-shell[data-theme='${themeId}'] {`, `Date navigator surface tokens should explicitly cover ${themeId}.`);
  expectIncludes(globals, `.app-shell[data-theme='${themeId}'] .date-current`, `Date current background reset should be at data-theme specificity for ${themeId}.`);
}
expectIncludes(globals, "html:not(.dark) .app-shell[data-theme='minimal'] :is(.date-stepper button, .date-calendar-button, .date-current)", 'Light date text color should be at data-theme specificity, not only generic .app-shell specificity.');
expectIncludes(globals, ".dark .app-shell[data-theme='minimal'] :is(.date-stepper button, .date-calendar-button, .date-current)", 'Dark date text color should be at data-theme specificity, not only generic .app-shell specificity.');
expectNotIncludes(globals, ":is(.date-current, .tab-active, .settings-field input", 'Date current should not be grouped with controls that receive theme-neutral background-color.');
expectNotIncludes(globals, ":is(.date-current, .task-text, .task-subtask-text", 'Date current text color should be controlled by date navigator rules, not generic dark content groups.');
expectIncludes(globals, ".app-shell[data-theme='invisible'] {\n  --date-nav-surface: transparent;", 'Invisible light date navigator should not draw a full-width surface stripe.');
expectIncludes(globals, ".dark .app-shell[data-theme='invisible'] {\n  --date-nav-surface: transparent;", 'Invisible dark date navigator should not draw a full-width black stripe.');
expectNotIncludes(globals, "--date-nav-surface: rgba(16, 18, 22, var(--card-opacity));", 'Invisible dark date navigator surface should not be an opaque black bar.');
expectNotIncludes(globals, "--date-nav-surface: rgba(250, 250, 252, var(--card-opacity));", 'Invisible light date navigator surface should not be an opaque white bar.');
expectIncludes(globals, ".app-shell[data-theme='invisible'] :is(.daily-panel-tab-active, .tabbar button.font-semibold", 'Invisible active tabs should have their own underline-only override.');
expectIncludes(globals, ".dark .app-shell[data-theme='invisible'] :is(.daily-panel-tab-active, .tabbar button.font-semibold", 'Invisible dark active tabs should override the generic dark active pill.');
expectIncludes(tabBar, 'tabbar-active-indicator', 'TabBar active underline should have a class so invisible theme can recolor the forest/gold indicator.');
expectIncludes(tabBar, 'layoutId="activeTab"', 'TabBar active underline should keep Framer Motion layout animation when switching tabs.');
expectIncludes(globals, ".app-shell[data-theme='invisible'] .tabbar-active-indicator {\n  display: block !important;", 'Invisible theme should keep the animated built-in tab indicator visible.');
expectIncludes(globals, "left: 0.55rem !important;", 'Invisible selected tab underline should be longer than the short pseudo-element version.');
expectIncludes(globals, "right: 0.55rem !important;", 'Invisible selected tab underline should be longer than the short pseudo-element version.');
expectIncludes(globals, ".dark .app-shell[data-theme='invisible'] .tabbar-active-indicator {\n  background: #ffffff !important;", 'Invisible dark selected tab underline should be pure white, not gold.');
expectIncludes(globals, "background: #000000 !important;", 'Invisible light selected tab underline should be pure black.');
expectNotIncludes(globals, ".app-shell[data-theme='invisible'] .tabbar-active-indicator {\n  display: none !important;", 'Invisible theme should not hide the animated TabBar indicator.');
expectNotIncludes(globals, ".app-shell[data-theme='invisible'] .tabbar button.font-semibold::after", 'Invisible theme should not replace the animated TabBar indicator with a static pseudo-element.');
expectNotIncludes(globals, ".dark .app-shell[data-theme='invisible'] :is(.daily-panel-tab-active, .tabbar button.font-semibold, .tabbar button[class*=\"font-semibold\"]) {\n  border-color: var(--neutral-border) !important;", 'Invisible dark active tabs should not use the generic active pill background.');
expectNotIncludes(globals, ".dark .app-shell[data-theme='watercolor'] .date-today-button {\n  background: rgba(255, 255, 255, 0.94) !important;", 'Watercolor dark today button should not keep the old white-background exception.');

expectNotIncludes(titleBarPrimaryActions, 'titlebarPrimaryActiveStyle', 'Primary titlebar action selection should be styled by CSS rather than an inline style object.');
expectNotIncludes(titleBarPrimaryActions, 'style={', 'Primary titlebar actions should not carry inline selected-theme styles.');
expectNotIncludes(titleBarPrimaryActions, 'CSSProperties', 'Primary titlebar actions should not import CSSProperties for selected-theme styling.');

expectIncludes(compactDayStrip, 'data-day-count={count}', 'CompactDayStrip should expose its rendered day count for CSS sizing.');
expectIncludes(compactDayStrip, "data-compact={count === 3 ? 'true' : undefined}", 'CompactDayStrip should expose the actual three-day compact state.');
expectIncludes(globals, ".compact-day-strip[data-compact='true'] {", 'Compact day styling should follow the rendered compact state, not viewport width.');
expectIncludes(globals, "--compact-progress-track: #e8eaed;\n  --compact-progress-fill: #25282d;\n  --compact-progress-ratio: #17191d;\n  --compact-progress-fill-text: #ffffff;", 'Light compact progress tokens should define the neutral progress palette.');
expectIncludes(globals, ".dark .app-shell {\n  --compact-progress-track: #17191d;\n  --compact-progress-fill: #eceef1;\n  --compact-progress-ratio: #f4f5f6;\n  --compact-progress-fill-text: #17191d;", 'Dark app shell should override compact progress tokens for contrast.');
expectIncludes(globals, ".compact-day-summary {\n  display: grid;\n  grid-template-columns: minmax(0, 1fr) minmax(6.4rem, 42%);\n  align-items: center;\n  height: 28px;", 'Compact summary should use the final fixed 28px progress-row layout.');
expectIncludes(globals, ".compact-day-progress-track {\n  position: relative;\n  display: flex;\n  min-width: 0;\n  height: 20px;", 'Compact progress track should fit the tightened summary row.');
expectIncludes(globals, 'background: var(--compact-progress-track);', 'Compact progress track should use its theme token.');
expectIncludes(globals, 'color: var(--compact-progress-ratio);', 'Compact progress ratio should use its contrast token.');
expectIncludes(globals, 'background: var(--compact-progress-fill);', 'Compact progress fill should use its theme token.');
expectIncludes(globals, 'color: var(--compact-progress-fill-text);', 'Compact progress fill text should use its contrast token.');
expectIncludes(globals, ".compact-day-strip-weekday {\n  display: block;\n  min-height: 0.78rem;\n  line-height: 0.78rem;", 'Weekday labels should reserve their line box so their tops cannot clip.');
expectIncludes(globals, ".compact-day-strip[data-compact='true'] .compact-day-strip-day {\n  min-height: 2.72rem;\n  gap: 0.06rem;", 'Actual compact day cells should use the three-day tight spacing.');
expectIncludes(globals, ".compact-day-strip[data-compact='true'].compact-day-strip-has-today-action {\n  grid-template-columns: 2rem minmax(0, 1fr);\n  gap: 0.18rem;", 'Actual compact state should shrink the back-to-today column.');
expectIncludes(globals, ".compact-day-strip[data-compact='true'] .compact-day-strip-today-label {\n  position: absolute;", 'Actual compact state should visually hide the today label while retaining its accessible name.');
expectIncludes(globals, ".task-toolbar {\n  position: relative;\n  z-index: 2;\n  container-type: inline-size;", 'Toolbar controls should respond to their own available width.');
expectIncludes(globals, "@container (max-width: 280px) {\n  .task-toolbar-row {", 'Toolbar controls should share a container-width compact breakpoint.');
expectIncludes(globals, ".task-toolbar .task-toolbar-tools :is(.task-tool-icon, .task-view-launcher),\n  .task-toolbar .task-daily-action {\n    height: 1.72rem;\n    min-height: 1.72rem;\n    font-size: 0.62rem;", 'Small-window toolbar controls should share the compact sizing contract.');
expectIncludes(globals, ".task-toolbar :is(.task-filter-button, .task-filter-select, .task-clear-filter, .task-search-input) {\n    height: 1.72rem;\n    min-height: 1.72rem;", 'Expanded toolbar search and filter controls should match the compact control height.');

console.log('verify-ui-feedback-regressions passed');
