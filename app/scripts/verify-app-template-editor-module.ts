import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';
import {
  applyTemplateUpdate,
  getInitialTemplateForKind,
} from '../src/app/appTemplateEditor';
import {
  createDefaultDailyTemplate,
  createDefaultReportTemplate,
} from '../shared/aiReview/sectionConfig';
import { createDefaultObsidianTemplateSettings } from '../shared/appSettings';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const helperPath = join(root, 'src/app/appTemplateEditor.ts');
const shellHelperPath = join(root, 'src/app/appShellComposition.tsx');
const overlayHelperPath = join(root, 'src/app/appShellOverlayComposition.ts');
const shellCompositionHookPath = join(root, 'src/app/useAppShellComposition.ts');
const shellInputsPath = join(root, 'src/app/appShellCompositionInputs.ts');
const appPath = join(root, 'src/App.tsx');
const modalActionsPath = join(root, 'src/app/appModalActions.ts');
const templateEditorModalPath = join(root, 'src/components/TemplateEditorModal.tsx');
const templateEditorModelPath = join(root, 'src/components/templateEditor/templateEditorModel.ts');
const templateEditorBlockListPath = join(root, 'src/components/templateEditor/TemplateEditorBlockList.tsx');
const sortableBlockRowPath = join(root, 'src/components/templateEditor/SortableBlockRow.tsx');
const templateBlockControlsPath = join(root, 'src/components/templateEditor/TemplateBlockControls.tsx');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(helperPath), 'App template editor helper module should exist.');
assert.ok(existsSync(shellHelperPath), 'App shell composition helper should exist for template editor wiring verification.');
assert.ok(existsSync(overlayHelperPath), 'App shell overlay composition helper should exist for template editor wiring verification.');
assert.ok(existsSync(shellCompositionHookPath), 'Runtime shell composition hook should exist for template editor wiring verification.');
assert.ok(existsSync(shellInputsPath), 'Pure shell-inputs helper should exist for template editor wiring verification.');
assert.ok(existsSync(templateEditorModelPath), 'Template editor model helper module should exist.');
assert.ok(existsSync(templateEditorBlockListPath), 'Template editor block list component should exist.');
assert.ok(existsSync(sortableBlockRowPath), 'Template editor sortable block row component should exist.');
assert.ok(existsSync(templateBlockControlsPath), 'Template editor block controls component should exist.');

const helper = readFileSync(helperPath, 'utf8');
const shellHelper = readFileSync(shellHelperPath, 'utf8');
const overlayHelper = readFileSync(overlayHelperPath, 'utf8');
const shellCompositionHook = readFileSync(shellCompositionHookPath, 'utf8');
const shellInputs = readFileSync(shellInputsPath, 'utf8');
const app = readFileSync(appPath, 'utf8');
const modalActions = existsSync(modalActionsPath) ? readFileSync(modalActionsPath, 'utf8') : '';
const templateEditorModal = readFileSync(templateEditorModalPath, 'utf8');
const templateEditorModel = readFileSync(templateEditorModelPath, 'utf8');
const templateEditorBlockList = readFileSync(templateEditorBlockListPath, 'utf8');
const sortableBlockRow = readFileSync(sortableBlockRowPath, 'utf8');
const templateBlockControls = readFileSync(templateBlockControlsPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;
const model = await import('../src/components/templateEditor/templateEditorModel');

assert.match(helper, /export type AppTemplateKind\b/, 'helper should export AppTemplateKind.');
assert.match(helper, /export type AppReportTemplateKind\b/, 'helper should export AppReportTemplateKind.');
assert.match(helper, /export type TemplateFieldName\b/, 'helper should export TemplateFieldName.');
assert.match(helper, /export function getInitialTemplateForKind\b/, 'helper should export getInitialTemplateForKind.');
assert.match(helper, /export function getTemplateFieldForKind\b/, 'helper should export getTemplateFieldForKind.');
assert.match(helper, /export function applyTemplateUpdate\b/, 'helper should export applyTemplateUpdate.');
assert.match(helper, /createDefaultDailyTemplate\(\)/, 'helper should preserve daily default template fallback.');
assert.match(helper, /createDefaultReportTemplate\('personalWeekly'\)/, 'helper should preserve personal weekly fallback.');
assert.match(helper, /createDefaultReportTemplate\('personalMonthly'\)/, 'helper should preserve personal monthly fallback.');
assert.match(helper, /createDefaultReportTemplate\('externalWeekly'\)/, 'helper should preserve external weekly fallback.');
assert.match(helper, /createDefaultReportTemplate\('externalMonthly'\)/, 'helper should preserve external monthly fallback.');
assert.match(helper, /dailyTemplate/, 'helper should preserve daily template field.');
assert.match(helper, /weeklyTemplate/, 'helper should preserve weekly template field.');
assert.match(helper, /monthlyTemplate/, 'helper should preserve monthly template field.');
assert.match(helper, /externalWeeklyTemplate/, 'helper should preserve external weekly template field.');
assert.match(helper, /externalMonthlyTemplate/, 'helper should preserve external monthly template field.');
assert.doesNotMatch(helper, /obsidianTemplates as Partial<ObsidianTemplateSettings>/, 'helper should not cast template settings as Partial before reading fields.');
assert.doesNotMatch(helper, /template as DailyTemplate/, 'helper should not cast update payloads as DailyTemplate.');
assert.doesNotMatch(helper, /template as ReportTemplate/, 'helper should not cast update payloads as ReportTemplate.');
assert.match(helper, /function isDailyTemplate\(template: DailyTemplate \| ReportTemplate\): template is DailyTemplate/, 'helper should narrow daily templates structurally before updates.');

const settings = createDefaultObsidianTemplateSettings();
const daily = createDefaultDailyTemplate();
const weekly = createDefaultReportTemplate('personalWeekly');
assert.equal(getInitialTemplateForKind('daily', settings), settings.dailyTemplate);
assert.deepEqual(
  applyTemplateUpdate(settings, 'daily', daily).dailyTemplate,
  daily,
  'applyTemplateUpdate should write daily templates without casting',
);
assert.deepEqual(
  applyTemplateUpdate(settings, 'personalWeekly', weekly).weeklyTemplate,
  weekly,
  'applyTemplateUpdate should write report templates without casting',
);
assert.equal(
  applyTemplateUpdate(settings, 'daily', weekly).dailyTemplate,
  settings.dailyTemplate,
  'applyTemplateUpdate should ignore mismatched daily update payloads',
);
assert.equal(
  applyTemplateUpdate(settings, 'personalWeekly', daily).weeklyTemplate,
  settings.weeklyTemplate,
  'applyTemplateUpdate should ignore mismatched report update payloads',
);

assert.match(app, /useAppShellComposition\(\{/, 'App should route template editor shell props through the runtime composition hook.');
assert.match(shellCompositionHook, /return createAppShellComposition\(createAppShellCompositionInputs\(\{/, 'Runtime shell composition hook should route shell props through the pure input factory.');
assert.match(shellInputs, /obsidianTemplates: appState\.obsidianTemplates,/, 'Pure shell-inputs helper should pass Obsidian templates into the shell composition helper.');
assert.match(shellInputs, /editingTemplateKind: appState\.editingTemplateKind,/, 'Pure shell-inputs helper should pass editing template kind into the shell composition helper.');
assert.match(shellInputs, /overlay: \{[\s\S]*obsidianTemplates: appState\.obsidianTemplates,[\s\S]*editingTemplateKind: appState\.editingTemplateKind,[\s\S]*\},/, 'Shell input composition should place template editor state in the overlay group.');
assert.match(shellHelper, /const overlayStackProps = createAppShellOverlayComposition\(overlay\);/, 'Shell composition should delegate grouped overlay template inputs unchanged.');
assert.match(overlayHelper, /getInitialTemplateForKind\(editingTemplateKind, obsidianTemplates\)/, 'Overlay composition should delegate initial template selection.');
assert.match(modalActions || app, /applyTemplateUpdate\(obsidianTemplates, editingTemplateKind, tpl\)/, 'App modal action boundary should delegate template update merging.');
assert.doesNotMatch(app, /editingTemplateKind === 'daily'\s*\? \(\(obsidianTemplates as any\)\.dailyTemplate/, 'App should not inline initial template nested ternary.');
assert.doesNotMatch(app, /const field =\s*editingTemplateKind === 'daily' \? 'dailyTemplate'/, 'App should not inline template field mapping.');
assert.doesNotMatch(app, /\{ \.\.\.obsidianTemplates, \[field\]: tpl \} as any/, 'App should not inline unsafe template update merge.');
assert.match(templateEditorModel, /export function isDailyTemplate\(template: DailyTemplate \| ReportTemplate\): template is DailyTemplate/, 'Template editor model should own daily template narrowing.');
assert.match(templateEditorModel, /export function isReportTemplateKind\(kind: TemplateKind\): kind is ReportTemplateKind/, 'Template editor model should narrow report template kinds before default reset.');
assert.match(templateEditorModel, /export function getDailyVisualBlocks\b/, 'Template editor model should own daily visual block derivation.');
assert.match(templateEditorModel, /export function applyRecognizedTemplateBlocks\b/, 'Template editor model should own recognized block merge behavior.');
assert.match(templateEditorModel, /createDailyBlockOrder\(/, 'Template editor model should own save-time daily block-order completion.');
assert.match(templateEditorModel, /getDailyBlockOrder\(/, 'Template editor model should reuse normalized daily block ordering.');
assert.match(templateEditorModal, /from '\.\/templateEditor\/templateEditorModel'/, 'TemplateEditorModal should import pure model helpers.');
assert.match(templateEditorModal, /from '\.\/templateEditor\/TemplateEditorBlockList'/, 'TemplateEditorModal should import the extracted block list component.');
assert.match(templateEditorModal, /<TemplateEditorBlockList/, 'TemplateEditorModal should delegate block list rendering.');
assert.match(templateEditorModal, /isReportTemplateKind\(kind\)\s*\?\s*createDefaultReportTemplate\(kind\)/s, 'TemplateEditorModal reset should call createDefaultReportTemplate only after report-kind narrowing.');
assert.doesNotMatch(templateEditorModal, /kind as ReportTemplateKind/, 'TemplateEditorModal should not cast template kind during reset.');
assert.doesNotMatch(templateEditorModal, /function isDailyTemplate\(/, 'TemplateEditorModal should not inline daily template narrowing.');
assert.doesNotMatch(templateEditorModal, /function isReportTemplateKind\(/, 'TemplateEditorModal should not inline report-kind narrowing.');
assert.doesNotMatch(templateEditorModal, /function visualKey\(/, 'TemplateEditorModal should not inline sortable visual key generation.');
assert.doesNotMatch(templateEditorModal, /function moveItem</, 'TemplateEditorModal should not inline generic reorder logic.');
assert.doesNotMatch(templateEditorModal, /function SortableBlockRow\(/, 'TemplateEditorModal should not inline the sortable block row component.');
assert.doesNotMatch(templateEditorModal, /const RENDER_TYPE_LABELS/, 'TemplateEditorModal should not inline render-type labels.');
assert.doesNotMatch(templateEditorModal, /className="template-block-custom-controls"/, 'TemplateEditorModal should not inline custom block controls.');
assert.doesNotMatch(templateEditorModal, /<DndContext/, 'TemplateEditorModal should not own block-list drag context.');
assert.doesNotMatch(templateEditorModal, /const getDailyVisualBlocks\s*=/, 'TemplateEditorModal should delegate daily visual block derivation.');
assert.doesNotMatch(templateEditorModal, /const applyRecognizedBlocks\s*=\s*\(blocks: CustomBlock\[\], mode: 'replace' \| 'append'\) => \{\s*if \(isDailyTemplate\(template\)\)/s, 'TemplateEditorModal should delegate recognized block merge behavior.');
assert.ok(templateEditorModal.split(/\r?\n/).length < 300, 'TemplateEditorModal should be below the 300-line large-file threshold.');
assert.match(sortableBlockRow, /export function SortableBlockRow\b/, 'sortable row component should export SortableBlockRow.');
assert.match(sortableBlockRow, /useSortable\(/, 'sortable row component should own dnd-kit sortable wiring.');
assert.match(sortableBlockRow, /useSortableMotion\(/, 'sortable row component should own the drag motion behavior.');
assert.match(templateBlockControls, /export function TemplateBlockControls\b/, 'block controls component should export TemplateBlockControls.');
assert.match(templateBlockControls, /export function TemplateBlockPromptInput\b/, 'block controls component should export TemplateBlockPromptInput.');
assert.match(templateBlockControls, /isRenderType\(nextRenderType\)/, 'block controls should narrow render-type select values.');
assert.match(templateBlockControls, /RENDER_TYPES\.map/, 'block controls should render labels from canonical render-type keys.');
assert.match(templateEditorBlockList, /export function TemplateEditorBlockList\b/, 'block list component should be exported.');
assert.match(templateEditorBlockList, /<DndContext/, 'block list component should own drag context.');
assert.match(templateEditorBlockList, /<SortableBlockRow/, 'block list component should render sortable rows.');
assert.equal(scripts['verify:app-template-editor-module'], 'tsx scripts/verify-app-template-editor-module.ts', 'package.json should expose the focused template-editor verifier.');
assertCleanupCoreIncludes('verify:app-template-editor-module', 'cleanup-core should include the focused template-editor verifier.');

const c1 = { id: 'c1', name: 'One', aiGenerate: true, renderType: 'text' as const, prompt: '' };
const c2 = { id: 'c2', name: 'Two', aiGenerate: false, renderType: 'list' as const, prompt: 'two' };
const c3 = { id: 'c3', name: 'Three', aiGenerate: true, renderType: 'table' as const, prompt: 'three' };
const dailyTemplate = {
  fixedBlocks: [
    { id: 'work' as const, displayName: 'Work' },
    { id: 'tasks' as const, displayName: 'Tasks' },
  ],
  customBlocks: [c1, c2],
  blockOrder: [
    { type: 'custom' as const, id: 'c2' },
    { type: 'fixed' as const, id: 'work' as const },
    { type: 'custom' as const, id: 'missing' },
    { type: 'fixed' as const, id: 'tasks' as const },
  ],
};

assert.equal(model.isDailyTemplate(dailyTemplate), true, 'model should identify daily templates.');
assert.equal(model.isDailyTemplate({ customBlocks: [] }), false, 'model should identify report templates.');
assert.equal(model.isReportTemplateKind('daily'), false, 'model should exclude daily from report template kinds.');
assert.equal(model.isReportTemplateKind('externalMonthly'), true, 'model should accept report template kinds.');
assert.equal(model.visualKey({ type: 'custom', id: 'c2' }), 'custom:c2', 'visualKey should include block type and id.');
assert.deepEqual(model.moveItem(['a', 'b', 'c'], 0, 2), ['b', 'c', 'a'], 'moveItem should reorder items immutably.');
assert.deepEqual(
  model.getDailyVisualBlocks(dailyTemplate).map(model.visualKey),
  ['custom:c2', 'fixed:work', 'fixed:tasks', 'custom:c1'],
  'daily visual blocks should follow normalized order, skip missing blocks, and append omitted existing blocks.',
);
assert.deepEqual(
  model.setTemplateCustomBlocks(dailyTemplate, [c2]).blockOrder,
  [
    { type: 'custom', id: 'c2' },
    { type: 'fixed', id: 'work' },
    { type: 'fixed', id: 'tasks' },
  ],
  'daily custom-block replacement should prune removed custom order entries and keep fixed entries.',
);
assert.deepEqual(
  model.applyRecognizedTemplateBlocks(dailyTemplate, [c3], 'replace').blockOrder,
  [
    { type: 'fixed', id: 'work' },
    { type: 'fixed', id: 'tasks' },
    { type: 'custom', id: 'c3' },
  ],
  'daily recognized-block replace should preserve fixed order and replace custom order.',
);
assert.deepEqual(
  model.applyRecognizedTemplateBlocks({ customBlocks: [c1] }, [c2], 'append'),
  { customBlocks: [c1, c2] },
  'report recognized-block append should append custom blocks.',
);
assert.deepEqual(
  model.completeTemplateForSave({ ...dailyTemplate, blockOrder: [] }).blockOrder,
  [
    { type: 'fixed', id: 'work' },
    { type: 'fixed', id: 'tasks' },
    { type: 'custom', id: 'c1' },
    { type: 'custom', id: 'c2' },
  ],
  'save completion should fill empty daily block order from current fixed and custom blocks.',
);

console.log('App template editor helper verification passed');
