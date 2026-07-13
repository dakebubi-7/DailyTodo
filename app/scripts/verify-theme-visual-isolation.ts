import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const globals = readFileSync(join(root, 'src/styles/globals.css'), 'utf8').replace(/\r\n/g, '\n');
const settingsPanel = readFileSync(join(root, 'src/components/SettingsPanel.tsx'), 'utf8');
const appearanceSection = readFileSync(join(root, 'src/components/settings/AppearanceSettingsSection.tsx'), 'utf8');
const appPersonalization = readFileSync(join(root, 'src/app/appPersonalization.ts'), 'utf8');
const appShellComposition = readFileSync(join(root, 'src/app/appShellComposition.tsx'), 'utf8');

assert.ok(
  settingsPanel.includes('AppearanceSettingsSection') &&
    settingsPanel.includes('onResetTheme={onResetTheme}'),
  'SettingsPanel should delegate reset-current-theme behavior to AppearanceSettingsSection.',
);
assert.ok(
  appearanceSection.includes('onClick={onResetTheme}') &&
    appearanceSection.includes('Reset current theme defaults'),
  'AppearanceSettingsSection should render reset-current-theme copy.',
);
assert.match(
  appPersonalization,
  /resetCurrentThemeDefaults: \(\) => \{\s*const reset = getThemeDefaultsReset\(personalization, activeThemeId, themeOverrides\);\s*if \(!reset\) return;\s*setThemeOverrides\(reset\.nextThemeOverrides\);\s*setPersonalization\(reset\.nextPersonalization\);\s*\}/,
  'App personalization actions should reset the active theme preset through the reset helper.',
);
assert.match(
  appPersonalization,
  /export function getThemeDefaultsReset\b[\s\S]*const next = \{ \.\.\.themeOverrides \};\s*delete next\[preset\.id\];[\s\S]*nextThemeOverrides: next/,
  'Theme reset should clear per-theme opacity override memory in the personalization helper.',
);
assert.match(
  appShellComposition,
  /const settingsPanelProps = \{[\s\S]*onApplyTheme: appPersonalizationActions\.applyThemePreset,[\s\S]*onResetTheme: appPersonalizationActions\.resetCurrentThemeDefaults,[\s\S]*onChange: appPersonalizationActions\.changePersonalization,[\s\S]*\};/,
  'App shell composition should pass the personalization reset action to SettingsPanel.',
);

assert.ok(
  globals.includes(".app-shell[data-theme='invisible'] .titlebar-icon-active") &&
    globals.includes('box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.22) !important;'),
  'Invisible titlebar active pinned/locked controls should be visibly active on light desktops.',
);
assert.ok(
  globals.includes(".dark .app-shell[data-theme='invisible']") && globals.includes('color: #fff !important;'),
  'Invisible dark mode should force primary UI text to white.',
);
assert.ok(
  globals.includes("html:not(.dark) .app-shell[data-theme='invisible']") && globals.includes('color: #111827 !important;'),
  'Invisible light mode should force primary UI text to black.',
);
assert.ok(
  globals.includes(".dark .app-shell[data-theme='invisible'] .completion-dialog") && globals.includes('rgba(18, 18, 20, var(--dialog-opacity))'),
  'Invisible dark completion dialog should use a neutral black-gray readable surface.',
);
assert.ok(
  globals.includes(".app-shell[data-theme='invisible'] .task-complete-action-complete") && globals.includes('linear-gradient(135deg, #e5e7eb, #71717a)'),
  'Invisible completed circles should use a neutral gray completion color, not amber or blue.',
);

assert.ok(
  globals.includes(".theme-minimal .task-card") &&
    globals.includes('background: rgba(255, 255, 255, var(--card-opacity)) !important;'),
  'Minimal task cards should stay flat white.',
);
assert.ok(
  globals.includes(".theme-minimal .task-card") &&
    globals.includes('border-bottom-color: rgba(39, 39, 42, 0.12) !important;'),
  'Minimal task cards should keep a slightly stronger bottom edge.',
);
assert.ok(
  globals.includes(".theme-minimal .task-card:hover") &&
    globals.includes('background: rgba(255, 255, 255, calc(var(--card-opacity) + 0.02)) !important;'),
  'Minimal hover cards should keep the same flat white surface.',
);
assert.ok(
  globals.includes(".theme-minimal .task-cluster-collapsed.task-cluster-has-children .task-cluster-main-card.task-card") &&
    globals.includes('background: rgba(255, 255, 255, var(--card-opacity)) !important;'),
  'Minimal collapsed main cards should stay flat white.',
);
assert.ok(
  globals.includes(".theme-minimal .task-cluster-collapsed.task-cluster-has-children .task-cluster-main-card.task-card") &&
    globals.includes('border-bottom-color: rgba(39, 39, 42, 0.12) !important;'),
  'Minimal collapsed main cards should keep a slightly stronger bottom edge.',
);
assert.ok(
  globals.includes(".theme-minimal .task-cluster-collapsed.task-cluster-has-children .task-cluster-main-card.task-card:hover") &&
    globals.includes('background: rgba(255, 255, 255, calc(var(--card-opacity) + 0.02)) !important;'),
  'Minimal collapsed hover cards should keep the same flat white surface.',
);
assert.ok(
  !globals.includes('.theme-minimal .task-cluster-collapsed.task-cluster-has-children .task-cluster-main-card.task-card::after'),
  'Minimal collapsed cards should not rely on a pseudo-element separator.',
);

assert.ok(
  globals.includes(".app-shell[data-theme='invisible'] .task-card") &&
    globals.includes('background: transparent !important;'),
  'Invisible task cards should stay transparent, not white or black blocks.',
);
assert.ok(
  globals.includes(".app-shell[data-theme='invisible'] .task-subtask-row") &&
    globals.includes('background: transparent !important;'),
  'Invisible subtasks should stay transparent like main task cards.',
);
assert.ok(
  globals.includes(".app-shell[data-theme='invisible'] .task-cluster-collapsed.task-cluster-has-children .task-cluster-main-card.task-card") &&
    globals.includes('background: transparent !important;'),
  'Invisible collapsed main cards should override generic collapsed surfaces.',
);
assert.ok(
  globals.includes(".app-shell[data-theme='invisible'] .task-stack-segment") &&
    globals.includes('background: transparent !important;'),
  'Invisible collapsed stack segments should stay transparent.',
);
assert.ok(
  globals.includes(".app-shell[data-theme='invisible'] .task-subtask-row:hover") &&
    globals.includes('background: rgba(255, 255, 255, 0.04) !important;'),
  'Invisible subtasks should only show a very subtle hover surface.',
);
assert.ok(
  globals.includes(".dark .app-shell[data-theme='invisible'] .task-subtask-row:hover") &&
    globals.includes('background: rgba(255, 255, 255, 0.035) !important;'),
  'Dark invisible subtasks should only show a very subtle hover surface.',
);
assert.ok(
  globals.includes(".dark .app-shell[data-theme='minimal']") && globals.includes('--personal-accent: #e5e7eb'),
  'Minimal dark should neutralize blue accents.',
);
assert.ok(
  globals.includes(".dark .theme-minimal .task-card") &&
    globals.includes('background: rgba(24, 24, 27, var(--card-opacity)) !important;'),
  'Dark minimal task cards should use neutral black surfaces, not white or blue.',
);
assert.ok(
  globals.includes(".dark .theme-minimal .task-card:hover") &&
    globals.includes('background: rgba(28, 28, 31, var(--card-opacity)) !important;'),
  'Dark minimal hovered task cards should stay neutral black.',
);
assert.ok(
  globals.includes(".dark .theme-minimal .task-cluster-collapsed.task-cluster-has-children .task-cluster-main-card.task-card") &&
    globals.includes('background: rgba(24, 24, 27, var(--card-opacity)) !important;'),
  'Dark minimal collapsed main task cards should override the generic blue dark surface.',
);
assert.ok(
  globals.includes(".dark .theme-minimal .task-stack-segment") &&
    globals.includes('background: rgba(24, 24, 27, var(--card-opacity)) !important;'),
  'Dark minimal stack segments should use the same neutral black surface as main tasks.',
);
assert.ok(
  globals.includes(".theme-minimal .task-subtask-row") && globals.includes('min-height: 3.15rem;'),
  'Minimal subtasks should match the main task height.',
);
assert.ok(
  globals.includes(".theme-minimal .task-subtask-row") && globals.includes('border-radius: 0.78rem !important;'),
  'Minimal subtasks should match the main task radius.',
);
assert.ok(
  globals.includes(".theme-minimal .task-subtask-row") &&
    globals.includes('background: rgba(255, 255, 255, var(--card-opacity)) !important;'),
  'Minimal subtasks should use the same flat white surface as minimal main cards.',
);
assert.ok(
  globals.includes(".theme-minimal .task-subtask-row:hover") &&
    globals.includes('background: rgba(255, 255, 255, calc(var(--card-opacity) + 0.02)) !important;'),
  'Minimal subtasks should stay flat on hover.',
);
assert.ok(
  globals.includes(".dark .theme-minimal .task-subtask-row") && globals.includes('background: rgba(32, 33, 37, var(--card-opacity)) !important;'),
  'Dark minimal subtasks should keep the same dark flat surface.',
);

assert.ok(
  globals.includes(".app-shell[data-theme='neumorphism'] .task-card") && globals.includes('box-shadow: inset 3px 3px 6px color-mix(in srgb, var(--neu-d)'),
  'Neumorphism task cards should sit inset inside the source group container.',
);
assert.ok(
  globals.includes(".app-shell[data-theme='neumorphism'] .task-subtask-row") &&
    globals.includes('background: rgba(var(--neu-bg), 0.72) !important;'),
  'Neumorphism subtasks should use the same surface family as main task cards.',
);
assert.ok(
  globals.includes(".app-shell[data-theme='neumorphism'] .task-subtask-row") &&
    globals.includes('box-shadow: inset 3px 3px 6px color-mix(in srgb, var(--neu-d)'),
  'Neumorphism subtasks should use inset neumorphic depth instead of a light generic card.',
);
assert.ok(
  globals.includes(".dark .app-shell[data-theme='neumorphism'] .task-subtask-row") &&
    globals.includes('border-color: rgba(255, 255, 255, 0.06) !important;'),
  'Dark neumorphism subtasks should use a low-contrast border, not a bright white outline.',
);
assert.ok(
  globals.includes(".dark .app-shell[data-theme='neumorphism'] .task-subtask-row") &&
    globals.includes('box-shadow: inset 3px 3px 6px rgba(0, 0, 0, 0.32), inset -2px -2px 4px rgba(255, 255, 255, 0.025) !important;'),
  'Dark neumorphism subtasks should stay dark and recessed without a bright white rim.',
);
assert.ok(
  globals.includes(".app-shell[data-theme='neumorphism'] .add-task") && globals.includes('-8px -8px 18px color-mix(in srgb, var(--neu-l)'),
  'Neumorphism bottom add-task bar should be raised, not a dark inset trench.',
);

assert.ok(
  globals.includes(".app-shell[data-theme='watercolor'] .priority-dot-button") && globals.includes('width: 1.08rem !important;'),
  'Watercolor priority dot button should be smaller than before.',
);
assert.ok(
  globals.includes(".app-shell[data-theme='watercolor'] .priority-dot-button span") && globals.includes('width: 0.48rem !important;'),
  'Watercolor inner priority dot should be compact.',
);
assert.ok(
  globals.includes(".dark .app-shell[data-theme='watercolor'] .task-card,\n.dark .app-shell[data-theme='watercolor'] .task-cluster-collapsed.task-cluster-has-children .task-cluster-main-card.task-card") &&
    globals.includes('background: transparent !important;'),
  'Dark watercolor main task cards should stay in the watercolor transparent task-card family instead of the generic blue dark surface.',
);
assert.ok(
  globals.includes("html:not(.dark) .app-shell[data-theme='watercolor'] .task-subtask-row") &&
    globals.includes('background: transparent !important;'),
  'Light watercolor subtasks should stay transparent like watercolor main task cards, not white generic cards.',
);
assert.ok(
  globals.includes("html:not(.dark) .app-shell[data-theme='watercolor'] .task-subtask-row:hover") &&
    globals.includes('background: rgba(168, 197, 227, 0.08) !important;'),
  'Light watercolor subtasks should only show a subtle watercolor hover surface.',
);
assert.ok(
  globals.includes(".dark .app-shell[data-theme='watercolor'] .task-cluster-collapsed.task-cluster-has-children .task-cluster-main-card.task-card") &&
    globals.includes('background: transparent !important;'),
  'Dark watercolor collapsed main task cards should stay in the watercolor transparent task-card family.',
);
assert.ok(
  globals.includes(".dark .app-shell[data-theme='watercolor'] .task-stack-segment") &&
    globals.includes('background: transparent !important;'),
  'Dark watercolor stack segments should not use the generic blue dark surface.',
);
assert.ok(
  globals.includes(".dark .app-shell[data-theme='watercolor'] .task-subtask-row") &&
    globals.includes('background: transparent !important;'),
  'Dark watercolor subtasks should not use the generic light subtask surface.',
);
assert.ok(
  globals.includes(".dark .app-shell[data-theme='watercolor'] .task-subtask-row:hover") &&
    globals.includes('background: rgba(168, 197, 227, 0.08) !important;'),
  'Dark watercolor subtasks should only show a subtle watercolor hover surface.',
);
assert.ok(
  globals.includes(".dark .app-shell[data-theme='watercolor']") && globals.includes('color: #fff !important;'),
  'Watercolor dark mode should force readable white text.',
);
assert.ok(
  globals.includes(".dark .app-shell[data-theme='watercolor'] :is(.settings-field input, .settings-field select") && globals.includes('background: rgba(15, 23, 42, 0.92) !important;'),
  'Watercolor dark settings inputs/selects should have strong contrast.',
);

console.log('verify-theme-visual-isolation passed');

