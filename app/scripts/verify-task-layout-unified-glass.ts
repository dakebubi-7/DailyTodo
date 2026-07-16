import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const taskItem = readFileSync(join(root, 'src/components/TaskItem.tsx'), 'utf8');
const taskItemPresentation = readFileSync(join(root, 'src/components/taskItem/taskItemPresentation.tsx'), 'utf8');
const taskItemControls = readFileSync(join(root, 'src/components/taskItem/taskItemControls.tsx'), 'utf8');
const taskItemActionControls = readFileSync(join(root, 'src/components/taskItem/taskItemActionControls.tsx'), 'utf8');
const settingsPanel = readFileSync(join(root, 'src/components/SettingsPanel.tsx'), 'utf8');
const appearanceSettingsSection = readFileSync(join(root, 'src/components/settings/AppearanceSettingsSection.tsx'), 'utf8');
const app = readFileSync(join(root, 'src/App.tsx'), 'utf8');
const mainWindowFactory = readFileSync(join(root, 'electron/mainWindowFactory.ts'), 'utf8');
const globals = readFileSync(join(root, 'src/styles/globals.css'), 'utf8').replace(/\r\n/g, '\n');
const watercolorTheme = readFileSync(join(root, 'src/styles/watercolor-theme.css'), 'utf8').replace(/\r\n/g, '\n');

assert.ok(taskItem.includes('<DragHandleButton dragHandleProps={dragHandleProps} />') && taskItemControls.includes('className="task-drag-handle"'), 'Main task rows should keep the drag handle at the leading edge.');
assert.ok(taskItem.includes('onClick={toggleCluster}'), 'Main task rows should keep the collapsible child interaction on the card.');
assert.ok(taskItem.includes("role={hasChildren ? 'button' : undefined}"), 'Main task rows with children should expose button semantics for collapse/expand.');
assert.ok(taskItem.includes('aria-expanded={hasChildren ? !task.collapsed : undefined}'), 'Main task rows should expose the current collapsed state.');
assert.ok(taskItem.includes('<CompleteActionButton') && taskItemActionControls.includes('className={getTaskCompleteActionClassName(completed)}'), 'Main task rows should keep the completion circle.');
assert.ok(taskItem.includes('<PriorityPicker value={task.priority} onChange={onPriorityChange} />'), 'Main task rows should keep the priority dot immediately before the title.');
assert.ok(taskItem.includes('<TaskMainContent') && taskItemControls.includes('className="task-text"'), 'Main task rows should keep the task title text through the controls main-content component.');
assert.ok(taskItem.includes('<TaskActionLayer') && taskItemActionControls.includes('ReviewActionButton'), 'Main task rows should keep the review eye action through the controls action layer.');

assert.ok(!taskItem.includes('className="task-source-badge"'), 'Main task rows should not render a source badge; keep the desktop-shortcut layout compact.');
assert.ok(!taskItem.includes('sourceLabels'), 'TaskItem should not keep source-label copy for a removed main-row source badge.');
assert.ok(!taskItem.includes('sourceTitles'), 'TaskItem should not keep source-title copy for a removed main-row source badge.');
assert.ok(!globals.includes('.task-source-badge'), 'Task card CSS should not include source-badge styling after removing the main-row badge.');
assert.ok(!globals.includes('source/review/delete'), 'Task action safe-space copy should not describe a removed source action.');

assert.ok(settingsPanel.includes('<AppearanceSettingsSection'), 'SettingsPanel should render the extracted appearance settings section.');
assert.ok(appearanceSettingsSection.includes("label={zh ? '玻璃透明度' : 'Glass opacity'}"), 'Settings should expose one total glass opacity control.');
assert.ok(appearanceSettingsSection.includes('value={glassOpacityValue(settings)}'), 'Glass opacity control should read one total value.');
assert.ok(appearanceSettingsSection.includes('onChange={(value) => onChange(withUnifiedGlassOpacity(settings, value))}'), 'Glass opacity control should write the same value to all opacity fields.');
assert.ok(appearanceSettingsSection.includes("label={zh ? '模糊强度' : 'Blur strength'}"), 'Settings should expose blur strength.');
assert.ok(!appearanceSettingsSection.includes('OPACITY_AREAS.map'), 'Settings should not render old per-area opacity controls.');
assert.ok(!appearanceSettingsSection.includes('function OpacityAreaControl('), 'Settings should not keep the old opacity area control component.');

assert.ok(mainWindowFactory.includes("platform === 'win32'"), 'Windows should use a native DWM composition path for desktop glass.');
assert.ok(mainWindowFactory.includes('shouldPreferWin32AcrylicFallback'), 'Windows should branch Win10 Win32 Acrylic and Win11 Electron Acrylic host surfaces.');
assert.ok(mainWindowFactory.includes('transparent: false'), 'Windows 11 should keep an opaque host surface so Electron Acrylic can compose behind the renderer.');
assert.ok(mainWindowFactory.includes("backgroundColor: '#F2F2F2'"), 'Windows 11 Acrylic should start from a neutral native surface color.');
assert.ok(mainWindowFactory.includes('transparent: true'), 'Windows 10 and other platforms should preserve transparent fallback window creation.');
assert.ok(mainWindowFactory.includes("backgroundColor: '#00000000'"), 'Windows 10 and other platforms should preserve fully transparent fallback backgrounds.');
assert.ok(globals.includes('backdrop-filter: blur(var(--blur-strength)) saturate(var(--glass-saturation));'), 'App shell should use the configured blur strength for frosted glass.');

assert.ok(
  globals.includes('.dark .task-card {\n  border-color: rgba(255, 255, 255, 0.09) !important;\n  background: transparent !important;'),
  'Dark task cards should stay transparent instead of drawing black blocks behind rows.',
);
assert.ok(
  globals.includes('.dark .task-card:hover {\n  border-color: color-mix(in srgb, var(--personal-secondary) 22%, rgba(255, 255, 255, 0.1)) !important;\n  background: rgba(255, 255, 255, 0.04) !important;'),
  'Dark task cards should keep hover feedback subtle and translucent, not black.',
);
assert.ok(
  globals.includes('.theme-dark-mode.dark .task-card {\n  border-color: rgba(71, 85, 105, 0.4) !important;\n  background: transparent !important;'),
  'The built-in dark theme should not override task cards back to black blocks.',
);
assert.ok(
  globals.includes('.dark .task-subtask-row {\n  border-color: rgba(255, 255, 255, 0.08);\n  background: transparent;'),
  'Dark subtask rows should be transparent instead of drawing black strips.',
);
assert.ok(
  globals.includes('.dark .task-subtask-row:hover {\n  background: rgba(255, 255, 255, 0.04);'),
  'Dark subtask hover feedback should be subtle and translucent, not black.',
);
assert.ok(!globals.includes('background: rgba(24, 26, 32, 0.74);'), 'Dark subtasks should not keep the old black strip background.');
assert.ok(!globals.includes('background: rgba(34, 38, 46, 0.9);'), 'Dark subtasks should not keep the old black hover strip background.');
assert.ok(
  !globals.includes('.dark .task-card {\n  border-color: rgba(71, 85, 105, 0.4) !important;\n  background: rgba(51, 65, 85, 0.5) !important;'),
  'Dark task cards should not keep the old slate black background.',
);
assert.ok(
  !globals.includes('.theme-dark-mode.dark .task-card {\n  border-color: rgba(71, 85, 105, 0.4) !important;\n  background: rgba(51, 65, 85, var(--card-opacity)) !important;'),
  'The built-in dark theme task card should not keep the old slate black background.',
);
assert.ok(globals.includes('.dark .task-text {\n  color: #fff;'), 'Dark main task text should be pure white.');
assert.ok(globals.includes('.dark .task-subtask-text {\n  color: #fff;'), 'Dark subtask text should be pure white.');

// Theme-scoped 2026-06-16 design: every theme owns its surfaces under .app-shell[data-theme="..."].
assert.ok(
  globals.includes('/* Theme-scoped final fixes 2026-06-16: keep each theme isolated. */'),
  'A theme-scoped final block should keep per-theme rules from leaking into other themes.',
);

// Dark task rows across built-in dark themes stay transparent (no black blocks).
assert.ok(
  globals.includes('.dark .task-subtask-row {\n  border-color: rgba(255, 255, 255, 0.08);\n  background: transparent;'),
  'Dark subtask rows should be transparent instead of drawing black strips.',
);
assert.ok(
  globals.includes('.theme-dark-mode.dark .task-card {\n  border-color: rgba(71, 85, 105, 0.4) !important;\n  background: transparent !important;'),
  'The built-in dark theme should not override task cards back to black blocks.',
);

// Watercolor dark text stays white (kept in watercolor-theme.css).
assert.ok(
  watercolorTheme.includes('.dark .theme-watercolor .task-text,\n.dark .theme-watercolor .task-subtask-text,\n.dark .theme-watercolor .date-current {\n  color: #fff !important;'),
  'Dark watercolor task and subtask text should override to pure white.',
);
assert.ok(!watercolorTheme.includes('color: #cdd8e6 !important;'), 'Dark watercolor should not tint task text blue-gray.');

// Invisible theme: text edit + completion stay readable, completed circle stays neutral, inner surfaces transparent.
assert.ok(
  globals.includes("body .app-shell[data-theme=\"invisible\"] :is(.add-task-input, .task-edit-input)") ||
    globals.includes(".app-shell[data-theme='invisible'] .task-card"),
  'Invisible theme should scope its rules under the data-theme selector.',
);
assert.ok(
  globals.includes(".app-shell[data-theme='invisible'] .task-complete-action-complete") && globals.includes('linear-gradient(135deg, #e5e7eb, #71717a)'),
  'Invisible completed circle should use a neutral low-noise fill, not amber.',
);
assert.ok(
  globals.includes(".dark .app-shell[data-theme='invisible'] .completion-dialog") && globals.includes('rgba(18, 18, 20, var(--dialog-opacity))'),
  'Invisible dark completion dialog should use a neutral black-gray surface.',
);

// Invisible light/dark text is fully readable (no gray): white in dark, near-black in light.
assert.ok(
  globals.includes(".dark .app-shell[data-theme='invisible']") && globals.includes('color: #fff !important;'),
  'Invisible dark mode text should be pure white.',
);
assert.ok(
  globals.includes("html:not(.dark) .app-shell[data-theme='invisible']") && globals.includes('color: #111827 !important;'),
  'Invisible light mode text should be near-black, not gray.',
);

console.log('verify-task-layout-unified-glass passed');
