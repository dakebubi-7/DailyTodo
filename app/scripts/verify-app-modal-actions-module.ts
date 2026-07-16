import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const helperPath = join(root, 'src/app/appModalActions.ts');
const shellHelperPath = join(root, 'src/app/appShellComposition.tsx');
const overlayHelperPath = join(root, 'src/app/appShellOverlayComposition.ts');
const shellCompositionHookPath = join(root, 'src/app/useAppShellComposition.ts');
const shellInputsPath = join(root, 'src/app/appShellCompositionInputs.ts');
const appPath = join(root, 'src/App.tsx');
const overlayPath = join(root, 'src/components/AppOverlayStack.tsx');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(helperPath), 'App modal actions helper module should exist.');
assert.ok(existsSync(shellHelperPath), 'App shell composition helper should exist for modal wiring verification.');
assert.ok(existsSync(overlayHelperPath), 'App shell overlay composition helper should exist for modal wiring verification.');
assert.ok(existsSync(shellCompositionHookPath), 'Runtime shell composition hook should exist for modal wiring verification.');
assert.ok(existsSync(shellInputsPath), 'Pure shell-inputs helper should exist for modal wiring verification.');
assert.ok(existsSync(overlayPath), 'App overlay stack component should exist for modal wiring verification.');

const helper = readFileSync(helperPath, 'utf8');
const shellHelper = readFileSync(shellHelperPath, 'utf8');
const overlayHelper = readFileSync(overlayHelperPath, 'utf8');
const shellCompositionHook = readFileSync(shellCompositionHookPath, 'utf8');
const shellInputs = readFileSync(shellInputsPath, 'utf8');
const app = readFileSync(appPath, 'utf8');
const overlay = readFileSync(overlayPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export function createAppModalActions\b/, 'helper should export createAppModalActions.');
assert.match(helper, /setCompactMode\(\(prev\) => !prev\)/, 'helper should preserve compact-mode toggle behavior.');
assert.match(helper, /setSettingsOpen\(\(prev\) => !prev\)/, 'helper should preserve settings toggle behavior.');
assert.match(helper, /updateAppSettings\(\{ \.\.\.appSettings, lockWindowPosition: !appSettings\.lockWindowPosition \}\)/, 'helper should preserve lock-window-position update shape.');
assert.match(helper, /closeSettings: \(\) => setSettingsOpen\(false\)/, 'helper should expose closeSettings.');
assert.match(helper, /openCompanionSettings: \(\) => \{\s*setCompanionOpen\(true\);\s*setSettingsOpen\(false\);\s*\}/s, 'helper should open Companion settings and close SettingsPanel.');
assert.match(helper, /completeAiOnboarding: \(next(?:: [^)]+)?\) => \{\s*void aiReview\?\.setSettings\(next\);\s*setAiOnboarding\(null\);\s*\}/s, 'helper should preserve AI onboarding completion side effects.');
assert.match(helper, /saveTemplate: \(tpl(?:: [^)]+)?\) => \{\s*if \(!editingTemplateKind\) return;\s*updateObsidianTemplates\(applyTemplateUpdate\(obsidianTemplates, editingTemplateKind, tpl\)\);\s*setEditingTemplateKind\(null\);\s*\}/s, 'helper should guard and preserve template save behavior.');
assert.match(helper, /cancelTemplate: \(\) => setEditingTemplateKind\(null\)/, 'helper should expose template cancel behavior.');
assert.match(helper, /editTemplate: \(kind(?:: [^)]+)?\) => setEditingTemplateKind\(kind\)/, 'helper should expose template edit behavior.');
assert.match(helper, /closeCompanion: \(\) => setCompanionOpen\(false\)/, 'helper should expose Companion panel close behavior.');
assert.match(helper, /cancelCompletion: \(\) => setCompletionTask\(null\)/, 'helper should expose completion dialog cancel behavior.');
assert.match(helper, /closeReview: \(\) => setReviewTask\(null\)/, 'helper should expose review dialog close behavior.');
assert.match(helper, /addCompletionRecord: \(task(?:: [^)]+)?\) => setCompletionTask\(task\)/, 'helper should expose add completion record behavior.');
assert.match(helper, /import \{ applyTemplateUpdate, type AppTemplateKind \} from '\.\/appTemplateEditor'/, 'helper should own template update import.');

assert.match(app, /useAppShellComposition\(\{/, 'App should delegate modal action wiring through the runtime composition hook.');
assert.match(shellCompositionHook, /from '\.\/appModalActions'/, 'Runtime shell composition hook should import app modal actions helper.');
assert.match(
  shellCompositionHook,
  /const appModalActions = useMemo\(\(\) => createAppModalActions\(\{[\s\S]*appSettings: taskState\.appSettings,[\s\S]*obsidianTemplates: appState\.obsidianTemplates,[\s\S]*editingTemplateKind: appState\.editingTemplateKind,[\s\S]*updateAppSettings: taskState\.updateAppSettings,[\s\S]*updateObsidianTemplates: templateActions\.updateObsidianTemplates,[\s\S]*\}\), \[taskState\.appSettings, appState\.obsidianTemplates, appState\.editingTemplateKind, taskState\.updateAppSettings, templateActions\.updateObsidianTemplates\]\);/,
  'Runtime shell composition hook should preserve modal action references until their captured inputs change.',
);
assert.match(shellInputs, /appModalActions,/, 'Pure shell-inputs helper should pass modal actions into the shell composition helper.');
assert.match(shellInputs, /titleBar: \{[\s\S]*appModalActions,[\s\S]*\},/, 'Shell input composition should place modal actions in the title-bar group.');
assert.match(shellInputs, /overlay: \{[\s\S]*appModalActions,[\s\S]*\},/, 'Shell input composition should place modal actions in the overlay group.');
assert.match(shellHelper, /const titleBarProps = \{[\s\S]*onToggleCompactMode: titleBar\.appModalActions\.toggleCompactMode,[\s\S]*onToggleSettings: titleBar\.appModalActions\.toggleSettings,[\s\S]*onToggleLockWindowPosition: titleBar\.appModalActions\.toggleLockWindowPosition,[\s\S]*\};/, 'shell composition helper should route grouped TitleBar modal actions.');
assert.match(shellHelper, /const overlayStackProps = createAppShellOverlayComposition\(overlay\);/, 'shell composition helper should delegate grouped overlay inputs unchanged.');
assert.match(overlayHelper, /const settingsPanelProps = \{[\s\S]*onEditTemplate: appModalActions\.editTemplate,[\s\S]*onClose: appModalActions\.closeSettings,[\s\S]*onOpenCompanionSettings: appModalActions\.openCompanionSettings,[\s\S]*\};/, 'overlay composition helper should route SettingsPanel modal actions through the overlay prop bag.');
assert.match(overlayHelper, /const companionPanelProps = \{[\s\S]*onClose: appModalActions\.closeCompanion,[\s\S]*\};/, 'overlay composition helper should route Companion close through the overlay prop bag.');
assert.match(overlayHelper, /const completionDialogProps = \{[\s\S]*onCancel: appModalActions\.cancelCompletion,[\s\S]*\};/, 'overlay composition helper should route completion cancel through the overlay prop bag.');
assert.match(overlayHelper, /const reviewDialogProps = \{[\s\S]*onClose: appModalActions\.closeReview,[\s\S]*onAddRecord: appModalActions\.addCompletionRecord,[\s\S]*\};/, 'overlay composition helper should route review dialog actions through the overlay prop bag.');
assert.match(overlayHelper, /const overlayStackProps = \{[\s\S]*onCompleteAiOnboarding: appModalActions\.completeAiOnboarding,[\s\S]*onSaveTemplate: appModalActions\.saveTemplate,[\s\S]*onCancelTemplate: appModalActions\.cancelTemplate,[\s\S]*\};/, 'overlay composition helper should pass AI onboarding and template actions through AppOverlayStack.');
assert.match(app, /<TitleBar \{\.\.\.shellComposition\.titleBarProps\} \/>/, 'App should render TitleBar from shell composition props.');
assert.match(app, /<AppOverlayStack \{\.\.\.shellComposition\.overlayStackProps\} \/>/, 'App should render AppOverlayStack from shell composition props.');
assert.match(overlay, /<SettingsPanel \{\.\.\.settingsPanelProps\} \/>/, 'AppOverlayStack should forward SettingsPanel props.');
assert.match(overlay, /onComplete=\{onCompleteAiOnboarding\}/, 'AppOverlayStack should forward AI onboarding completion.');
assert.match(overlay, /onSave=\{onSaveTemplate\}/, 'AppOverlayStack should forward template save.');
assert.match(overlay, /onCancel=\{onCancelTemplate\}/, 'AppOverlayStack should forward template cancel.');
assert.match(overlay, /<ObsidianCompanionPanel \{\.\.\.companionPanelProps\} \/>/, 'AppOverlayStack should forward Companion panel props.');
assert.match(overlay, /<TaskCompletionDialog \{\.\.\.completionDialogProps\} \/>/, 'AppOverlayStack should forward completion dialog props.');
assert.match(overlay, /<TaskReviewDialog \{\.\.\.reviewDialogProps\} \/>/, 'AppOverlayStack should forward review dialog props.');
assert.doesNotMatch(app, /const titleBarProps = \{/, 'App should not inline TitleBar props once shell composition owns them.');
assert.doesNotMatch(app, /const settingsPanelProps = \{/, 'App should not inline SettingsPanel props once shell composition owns them.');
assert.doesNotMatch(app, /const companionPanelProps = \{/, 'App should not inline Companion props once shell composition owns them.');
assert.doesNotMatch(app, /const completionDialogProps = \{/, 'App should not inline completion dialog props once shell composition owns them.');
assert.doesNotMatch(app, /const reviewDialogProps = \{/, 'App should not inline review dialog props once shell composition owns them.');
assert.doesNotMatch(app, /onToggleCompactMode=\{\(\) => setCompactMode\(\(prev\) => !prev\)\}/, 'App should not inline compact-mode toggle.');
assert.doesNotMatch(app, /onToggleSettings=\{\(\) => setSettingsOpen\(\(prev\) => !prev\)\}/, 'App should not inline settings toggle.');
assert.doesNotMatch(app, /onToggleLockWindowPosition=\{\(\) => updateAppSettings\(\{ \.\.\.appSettings, lockWindowPosition: !appSettings\.lockWindowPosition \}\)\}/, 'App should not inline lock-position toggle.');
assert.doesNotMatch(app, /onOpenCompanionSettings=\{\(\) => \{\s*setCompanionOpen\(true\);\s*setSettingsOpen\(false\);\s*\}\}/s, 'App should not inline Companion settings opener.');
assert.doesNotMatch(app, /onComplete=\{\(next\) => \{\s*void window\.electronAPI\?\.aiReview\?\.setSettings\(next\);\s*setAiOnboarding\(null\);\s*\}\}/s, 'App should not inline AI onboarding completion.');
assert.doesNotMatch(app, /onSave=\{\(tpl\) => \{\s*updateObsidianTemplates\(applyTemplateUpdate\(obsidianTemplates, editingTemplateKind, tpl\)\);\s*setEditingTemplateKind\(null\);\s*\}\}/s, 'App should not inline template save.');
assert.doesNotMatch(app, /onCancel=\{\(\) => setEditingTemplateKind\(null\)\}/, 'App should not inline template cancel.');
assert.doesNotMatch(app, /onEditTemplate=\{\(kind\) => setEditingTemplateKind\(kind\)\}/, 'App should not inline template edit opener.');
assert.equal(scripts['verify:app-modal-actions-module'], 'tsx scripts/verify-app-modal-actions-module.ts', 'package.json should expose the focused modal actions verifier.');
assertCleanupCoreIncludes('verify:app-modal-actions-module', 'cleanup-core should include the focused modal actions verifier.');

console.log('App modal actions helper verification passed');
