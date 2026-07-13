import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';
import { readSyncPreview } from '../shared/obsidianIpcResults';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const helperPath = join(root, 'src/app/appObsidianTemplateActions.ts');
const compositionPath = join(root, 'src/app/useAppShellComposition.ts');
const compositionInputsPath = join(root, 'src/app/appShellCompositionInputs.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(helperPath), 'App Obsidian template actions helper module should exist.');

const helper = readFileSync(helperPath, 'utf8');
const composition = readFileSync(compositionPath, 'utf8');
const compositionInputs = readFileSync(compositionInputsPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export interface AppObsidianTemplateActionDependencies\b/, 'helper should export dependency interface.');
assert.match(helper, /export function createAppObsidianTemplateActions\b/, 'helper should export action factory.');
assert.match(helper, /setObsidianTemplatesState\(next\)/, 'helper should update local template state before persistence.');
assert.match(helper, /setSettingsSyncPreview\(null\)/, 'helper should clear sync preview after template changes or reset.');
assert.match(helper, /await setObsidianTemplateSettings\(next\)/, 'helper should persist template changes.');
assert.match(helper, /const next = await resetObsidianTemplateSettings\(\)/, 'helper should delegate template reset to the store wrapper.');
assert.match(helper, /setObsidianTemplatesState\(next\)/, 'helper should write normalized reset settings into local template state.');
assert.match(helper, /readSyncPreview/, 'helper should parse Obsidian sync preview results before writing preview state.');
assert.match(helper, /readSyncPreview\(\s*await previewTasksToObsidian\(obsidianSyncTasks, selectedDate, dailyWork, dailyInspiration, allTasks\)/, 'helper should revalidate preview IPC returns at the action boundary.');
assert.match(helper, /setSettingsSyncPreview\(preview \|\| null\)/, 'helper should preserve null fallback for empty or invalid preview results.');
assert.match(helper, /Promise<unknown>/, 'Obsidian template action dependencies should accept unknown preview IPC result contracts.');

assert.match(composition, /from '\.\/appObsidianTemplateActions'/, 'App shell composition should import Obsidian template action helper.');
assert.match(
  composition,
  /const templateActions = useMemo\(\(\) => createAppObsidianTemplateActions\(\{[\s\S]*obsidianSyncTasks: taskState\.obsidianSyncTasks,[\s\S]*selectedDate: taskState\.selectedDate,[\s\S]*dailyWork: taskState\.dailyWork,[\s\S]*dailyInspiration: taskState\.dailyInspiration,[\s\S]*allTasks: taskState\.allTasks,[\s\S]*\}\), \[taskState\.obsidianSyncTasks, taskState\.selectedDate, taskState\.dailyWork, taskState\.dailyInspiration, taskState\.allTasks\]\);/,
  'App shell composition should preserve Obsidian template action references until their sync inputs change.',
);
assert.match(compositionInputs, /updateObsidianTemplates: templateActions\.updateObsidianTemplates,[\s\S]*previewSettingsSync: templateActions\.previewSettingsSync,[\s\S]*resetObsidianTemplates: templateActions\.resetObsidianTemplates,/, 'App shell composition inputs should wire Obsidian template actions into the shell.');
assert.doesNotMatch(composition, /const updateObsidianTemplates = async \(next: ObsidianTemplateSettings\) => \{\s*setObsidianTemplatesState\(next\)/s, 'App shell composition should not inline template update action.');
assert.doesNotMatch(composition, /const resetObsidianTemplates = async \(\) => \{\s*const next = await resetObsidianTemplateSettings\(\)/s, 'App shell composition should not inline template reset action.');
assert.doesNotMatch(composition, /const previewSettingsSync = async \(\) => \{\s*const preview = await previewTasksToObsidian/s, 'App shell composition should not inline settings sync preview action.');
assert.equal(scripts['verify:app-obsidian-template-actions-module'], 'tsx scripts/verify-app-obsidian-template-actions-module.ts', 'package.json should expose the focused Obsidian template actions verifier.');
assertCleanupCoreIncludes('verify:app-obsidian-template-actions-module', 'cleanup-core should include the focused Obsidian template actions verifier.');

assert.deepEqual(
  readSyncPreview({
    files: [{ filePath: 'C:/vault/daily.md', action: 'update' }],
    managedBlocks: [{ marker: 'DAILYTODO:TASKS', action: 'replace' }],
    taskCount: 1,
    completionRecordCount: 0,
    deletedReviewWillDisappear: false,
  }),
  {
    files: [{ filePath: 'C:/vault/daily.md', action: 'update' }],
    managedBlocks: [{ marker: 'DAILYTODO:TASKS', action: 'replace' }],
    taskCount: 1,
    completionRecordCount: 0,
    deletedReviewWillDisappear: false,
  },
);
assert.equal(readSyncPreview({ files: [], managedBlocks: [], taskCount: '1', completionRecordCount: 0, deletedReviewWillDisappear: false }), undefined);
assert.equal(readSyncPreview(null), undefined);

console.log('App Obsidian template actions helper verification passed');
