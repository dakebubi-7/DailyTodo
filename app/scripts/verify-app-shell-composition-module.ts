import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const helperPath = join(root, 'src/app/appShellComposition.tsx');
const compositionTypesPath = join(root, 'src/app/appShellCompositionTypes.ts');
const mainContentCompositionPath = join(root, 'src/app/appShellMainContentComposition.tsx');
const overlayPath = join(root, 'src/app/appShellOverlayComposition.ts');
const inputsPath = join(root, 'src/app/appShellCompositionInputs.ts');
const runtimeCompositionPath = join(root, 'src/app/useAppShellComposition.ts');
const appPath = join(root, 'src/App.tsx');
const titleBarPath = join(root, 'src/components/TitleBar.tsx');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(helperPath), 'App shell composition helper module should exist.');
assert.ok(existsSync(mainContentCompositionPath), 'App shell main-content composition helper should exist.');
assert.ok(existsSync(overlayPath), 'App shell overlay composition helper module should exist.');
assert.ok(existsSync(inputsPath), 'App shell composition inputs helper should exist.');
assert.ok(existsSync(runtimeCompositionPath), 'App shell runtime composition hook should exist.');

const helper = readFileSync(helperPath, 'utf8');
const compositionTypes = readFileSync(compositionTypesPath, 'utf8');
const mainContentComposition = readFileSync(mainContentCompositionPath, 'utf8');
const overlay = readFileSync(overlayPath, 'utf8');
const inputs = readFileSync(inputsPath, 'utf8');
const runtimeComposition = readFileSync(runtimeCompositionPath, 'utf8');
const app = readFileSync(appPath, 'utf8');
const titleBar = readFileSync(titleBarPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;
const helperLines = helper.split(/\r?\n/).length;

assert.match(
  helper,
  /export type \{ AppShellCompositionOptions \} from '\.\/appShellCompositionTypes';/,
  'helper should retain the AppShellCompositionOptions export path.',
);
assert.match(helper, /export interface AppShellComposition\b/, 'helper should export AppShellComposition.');
assert.match(helper, /export function createAppShellComposition\b/, 'helper should export createAppShellComposition.');
assert.match(helper, /from '\.\/appShellOverlayComposition'/, 'helper should delegate overlay-stack prop assembly to the overlay helper.');
assert.match(helper, /from '\.\/appShellMainContentComposition'/, 'helper should delegate main-content prop assembly to the main-content helper.');
assert.ok(helperLines < 300, `appShellComposition.tsx should stay below 300 lines after overlay extraction; got ${helperLines}`);
assert.match(helper, /from '\.\.\/components\/TitleBar'/, 'helper should own TitleBar prop typing.');
assert.match(titleBar, /import \{[^}]*\bmemo\b[^}]*\buseEffect\b[^}]*\buseState\b[^}]*\} from 'react';/, 'TitleBar should import memo to isolate it from unrelated task updates.');
assert.match(titleBar, /export const TitleBar = memo\(function TitleBar\(/, 'TitleBar should be memoized because shell composition rebuilds its prop bag during task updates.');
assert.match(helper, /from '\.\.\/components\/AppMainContent'/, 'helper should own AppMainContent prop typing.');
assert.match(helper, /from '\.\.\/components\/AppOverlayStack'/, 'helper should own AppOverlayStack prop typing.');
assert.match(helper, /const titleBarProps = \{[\s\S]*onToggleSettings: titleBar\.appModalActions\.toggleSettings,[\s\S]*\};/, 'helper should assemble TitleBar props from its grouped inputs.');
assert.match(overlay, /export function createAppShellOverlayComposition\b/, 'overlay helper should export createAppShellOverlayComposition.');
assert.match(overlay, /const settingsPanelProps = \{[\s\S]*onOpenCompanionSettings: appModalActions\.openCompanionSettings,[\s\S]*\};/, 'overlay helper should assemble SettingsPanel props.');
assert.match(overlay, /const companionPanelProps = \{[\s\S]*onImportMobileInbox: importCompanionMobileInbox,[\s\S]*\};/, 'overlay helper should assemble CompanionPanel props.');
assert.match(overlay, /const completionDialogProps = \{[\s\S]*onCompleteWithoutReview: completionActions\.completeWithoutReview,[\s\S]*\};/, 'overlay helper should assemble completion dialog props.');
assert.match(overlay, /const reviewDialogProps = \{[\s\S]*onDeleteRecord: deleteTaskReview,[\s\S]*\};/, 'overlay helper should assemble review dialog props.');
assert.match(overlay, /const editingTemplateInitialTemplate = editingTemplateKind\s*\?\s*getInitialTemplateForKind\(editingTemplateKind, obsidianTemplates\)\s*:\s*null;/s, 'overlay helper should own template initial-content derivation.');
assert.match(overlay, /aiOnboardingText: shellText\.settings\.aiReview\.onboarding,/, 'overlay helper should own AI onboarding text derivation.');
assert.doesNotMatch(helper, /const settingsPanelProps = \{/, 'shell composition should not keep SettingsPanel prop assembly inline after overlay extraction.');
assert.doesNotMatch(helper, /const companionPanelProps = \{/, 'shell composition should not keep CompanionPanel prop assembly inline after overlay extraction.');
assert.doesNotMatch(helper, /const completionDialogProps = \{/, 'shell composition should not keep completion dialog prop assembly inline after overlay extraction.');
assert.doesNotMatch(helper, /const reviewDialogProps = \{/, 'shell composition should not keep review dialog prop assembly inline after overlay extraction.');
assert.match(mainContentComposition, /export function createAppShellMainContentComposition\b/, 'main-content helper should export its composition factory.');
assert.match(mainContentComposition, /const topContentProps = \{[\s\S]*shellText:\s*shellText\.app,[\s\S]*selectedDateTasksForCommands,[\s\S]*\};/, 'main-content helper should assemble AppTopContent props.');
assert.match(mainContentComposition, /const taskListProps = \{[\s\S]*tasks: visibleTasks,[\s\S]*onToggle: completionActions\.toggleTask,[\s\S]*editRequest,[\s\S]*\};/, 'main-content helper should assemble TaskList props.');
assert.match(mainContentComposition, /return \{[\s\S]*mainScrollRef,[\s\S]*topContent: <AppTopContent \{\.\.\.topContentProps\} \/>,[\s\S]*taskListProps,[\s\S]*\};/, 'main-content helper should assemble AppMainContent props.');
assert.match(helper, /const mainContentProps = createAppShellMainContentComposition\(mainContent\);/, 'shell composition should delegate the grouped main-content input unchanged.');
assert.doesNotMatch(helper, /const topContentProps = \{/, 'shell composition should not retain top-content prop assembly after extraction.');
assert.doesNotMatch(helper, /const taskListProps = \{/, 'shell composition should not retain task-list prop assembly after extraction.');
assert.match(overlay, /const overlayStackProps = \{[\s\S]*settingsPanelProps,[\s\S]*companionPanelProps,[\s\S]*reviewDialogProps,[\s\S]*\};/, 'overlay helper should assemble AppOverlayStack props.');
assert.match(mainContentComposition, /const shellText = getShellText\(appSettings\.language\);/, 'main-content helper should own shell text lookup.');
assert.doesNotMatch(helper, /const editingTemplateInitialTemplate = /, 'shell composition should not inline template initial-content derivation after overlay extraction.');
assert.match(compositionTypes, /AppShellMainContentCompositionInputs extends AppShellMainContentCompositionOptions/, 'shell composition input contract should retain the grouped main-content calendar-task input.');
assert.match(mainContentComposition, /tasks: calendarTasks,/, 'main-content helper should pass prefiltered calendar tasks directly to DateNavigator.');
assert.doesNotMatch(mainContentComposition, /tasks: allTasks\.filter\(\(task\) => !task\.cleared\)/, 'main-content helper should not refilter calendar tasks on every app render.');

assert.match(runtimeComposition, /from '\.\/appShellComposition'/, 'runtime composition hook should import the shell composition helper.');
assert.match(runtimeComposition, /from '\.\/appShellCompositionInputs'/, 'runtime composition hook should import the pure shell-inputs helper.');
assert.match(inputs, /export function createAppShellCompositionInputs\b/, 'shell-inputs helper should export the pure input factory.');
assert.match(inputs, /: AppShellCompositionOptions \{/, 'shell-inputs helper should return the shell composition input contract.');
assert.match(runtimeComposition, /return createAppShellComposition\(createAppShellCompositionInputs\(\{/, 'runtime composition hook should build shell composition through the pure input factory.');
assert.ok(runtimeComposition.split(/\r?\n/).length < 190, 'runtime composition hook should stay below 190 lines after extracting final input assembly.');
assert.match(app, /from '\.\/app\/useAppShellComposition'/, 'App should import the shell composition runtime hook.');
assert.match(app, /const shellComposition = useAppShellComposition\(\{/, 'App should build shell composition through the runtime hook.');
assert.match(app, /<TitleBar \{\.\.\.shellComposition\.titleBarProps\} \/>/, 'App should render TitleBar from helper-built props.');
assert.match(app, /<AppOverlayStack \{\.\.\.shellComposition\.overlayStackProps\} \/>/, 'App should render AppOverlayStack from helper-built props.');
assert.match(app, /<AppMainContent \{\.\.\.shellComposition\.mainContentProps\} \/>/, 'App should render AppMainContent from helper-built props.');
assert.doesNotMatch(app, /const settingsPanelProps = \{/, 'App should not inline SettingsPanel prop assembly once the shell composition helper owns it.');
assert.doesNotMatch(app, /const topContentProps = \{/, 'App should not inline top-content prop assembly once the shell composition helper owns it.');
assert.doesNotMatch(app, /const taskListProps = \{/, 'App should not inline task-list prop assembly once the shell composition helper owns it.');
assert.doesNotMatch(app, /const mainContentProps = \{/, 'App should not inline main-content prop assembly once the shell composition helper owns it.');
assert.doesNotMatch(app, /const aiOnboardingText = /, 'App should not inline AI onboarding text derivation once the shell composition helper owns it.');
assert.doesNotMatch(app, /const editingTemplateInitialTemplate = /, 'App should not inline template initial-content derivation once the shell composition helper owns it.');
assert.doesNotMatch(app, /const calendarTasks = useMemo\(\(\) => allTasks\.filter\(\(task\) => !task\.cleared\), \[allTasks\]\);/, 'App should not allocate calendar task copies while DateNavigator owns cleared-task filtering.');
assert.match(inputs, /mainContent: \{[\s\S]*calendarTasks: taskState\.allTasks,[\s\S]*allTasks: taskState\.allTasks,[\s\S]*editTaskReview:/, 'shell-inputs helper should provide the complete task list to grouped main-content composition for DateNavigator on-demand filtering.');
assert.equal(scripts['verify:app-shell-composition-module'], 'tsx scripts/verify-app-shell-composition-module.ts', 'package.json should expose the focused App shell composition verifier.');
assertCleanupCoreIncludes('verify:app-shell-composition-module', 'cleanup-core should include the focused App shell composition verifier.');

console.log('App shell composition verification passed');
