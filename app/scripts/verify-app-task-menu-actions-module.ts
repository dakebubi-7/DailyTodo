import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'src/app/taskMenuActions.ts');
const sharedUpdatesPath = join(root, 'shared', 'taskMenuActionUpdates.ts');
const runtimeHookPath = join(root, 'src/app/useAppRuntimeEffects.ts');
const appPath = join(root, 'src/App.tsx');
const viteEnvPath = join(root, 'src/vite-env.d.ts');

assert.ok(existsSync(modulePath), 'App task menu action helper module should exist.');
assert.ok(existsSync(sharedUpdatesPath), 'Shared task-menu update normalizer should exist.');
assert.ok(existsSync(runtimeHookPath), 'App runtime effects hook module should exist.');

const helper = readFileSync(modulePath, 'utf8');
const sharedUpdates = readFileSync(sharedUpdatesPath, 'utf8');
const runtimeHook = readFileSync(runtimeHookPath, 'utf8');
const app = readFileSync(appPath, 'utf8');
const viteEnv = readFileSync(viteEnvPath, 'utf8');

assert.match(helper, /export type TaskMenuActionPayload\b/, 'task menu helper should export TaskMenuActionPayload.');
assert.match(helper, /export type ParsedTaskMenuAction\b/, 'task menu helper should export ParsedTaskMenuAction.');
assert.match(helper, /export function parseTaskMenuAction\b/, 'task menu helper should export parseTaskMenuAction.');
assert.match(helper, /export function createEditRequest\b/, 'task menu helper should export createEditRequest.');
assert.match(helper, /export function applyParsedTaskMenuAction\b/, 'task menu helper should export applyParsedTaskMenuAction.');
assert.match(helper, /export function registerTaskMenuActionListener\b/, 'task menu helper should export registerTaskMenuActionListener.');
assert.match(helper, /import \{ normalizeTaskMenuActionPayload \} from '\.\.\/\.\.\/shared\/taskMenuActionUpdates';/, 'task menu helper should delegate unknown payload normalization to the shared helper.');
assert.match(helper, /const normalized = normalizeTaskMenuActionPayload\(payload\);/, 'task menu parser should normalize forwarded runtime payloads before interpreting actions.');
assert.match(sharedUpdates, /import \{ isObjectRecord \} from '\.\/unknownValueGuards';/, 'shared task-menu normalizer should reuse the shared object-record predicate.');
assert.match(sharedUpdates, /typeof value\.taskId !== 'string' \|\| !value\.taskId\.trim\(\)/, 'shared task-menu normalizer should require a non-empty string taskId.');
assert.match(sharedUpdates, /const updates = pickTaskMenuActionUpdates\(value\.updates\);/, 'shared task-menu normalizer should filter untrusted updates through the allowlist.');
assert.match(helper, /__action\?: 'edit' \| 'delete' \| 'addSubtask'/, 'task menu helper should own special action typing.');
assert.match(helper, /kind: 'addSubtask'/, 'task menu helper should normalize addSubtask actions.');
assert.match(helper, /kind: 'delete'/, 'task menu helper should normalize delete actions.');
assert.match(helper, /kind: 'edit'/, 'task menu helper should normalize edit actions.');
assert.match(helper, /kind: 'update'/, 'task menu helper should normalize ordinary task updates.');
assert.match(helper, /kind: 'noop'/, 'task menu helper should provide a no-op action for malformed runtime payloads.');
assert.match(helper, /if \(!normalized\) \{[\s\S]*return \{ kind: 'noop' \};[\s\S]*\}/, 'task menu parser should return noop when shared normalization rejects a runtime payload.');

assert.match(helper, /String\(updates\.text \|\| ''\)/, 'task menu helper should preserve addSubtask text coercion.');
assert.match(helper, /handlers\.addSubtask\(action\.taskId, action\.text\)/, 'task menu helper should route addSubtask actions to the addSubtask handler.');
assert.match(helper, /handlers\.deleteTask\(action\.taskId\)/, 'task menu helper should route delete actions to the delete handler.');
assert.match(helper, /handlers\.setEditRequest\(\(prev\) => createEditRequest\(prev, action\.taskId\)\)/, 'task menu helper should route edit actions through createEditRequest.');
assert.match(helper, /handlers\.updateTask\(action\.taskId, action\.updates\)/, 'task menu helper should route update actions to the update handler.');
assert.match(helper, /electronAPI\?\.onTaskMenuAction\?\.\(\(payload\) => \{\s*applyParsedTaskMenuAction\(parseTaskMenuAction\(payload\), handlers\);\s*\}\)/s, 'task menu helper should register forwarded popup actions and route them through parser/apply helpers.');

assert.match(app, /from '\.\/app\/useAppRuntimeEffects'/, 'App should import the runtime effects hook.');
assert.match(app, /useAppRuntimeEffects\(\{/, 'App should delegate runtime effects through the runtime hook.');
assert.match(runtimeHook, /from '\.\/taskMenuActions'/, 'runtime hook should import task menu action helpers.');
assert.match(runtimeHook, /registerTaskMenuActionListener\(window\.electronAPI, \{/, 'runtime hook should delegate popup listener registration to the helper.');
assert.doesNotMatch(app, /if \(action\.kind === 'addSubtask'\)/, 'App should not inline addSubtask task-menu routing.');
assert.doesNotMatch(app, /if \(action\.kind === 'delete'\)/, 'App should not inline delete task-menu routing.');
assert.doesNotMatch(app, /if \(action\.kind === 'edit'\)/, 'App should not inline edit task-menu routing.');
assert.doesNotMatch(app, /__action\?: 'edit' \| 'delete' \| 'addSubtask'/, 'App should not inline special task menu action typing.');
assert.doesNotMatch(app, /const action = \(updates as \{ __action\?/, 'App should not inline task menu action parsing.');
assert.doesNotMatch(app, /window\.electronAPI\?\.onTaskMenuAction\(\(payload\) =>/, 'App should not inline task-menu popup listener registration.');

assert.match(
  viteEnv,
  /dispatchTaskMenuAction: \(payload: unknown\) => Promise<void>/,
  'vite-env should expose task-menu dispatch with an unknown runtime payload type.',
);
assert.match(
  viteEnv,
  /onTaskMenuAction: \(callback: \(payload: unknown\) => void\) => \(\) => void;/,
  'vite-env should expose task-menu action listeners with an unknown runtime payload type.',
);
assert.doesNotMatch(
  viteEnv,
  /dispatchTaskMenuAction: \(payload: \{ taskId: string; updates: Partial<import\('\.\/types\/task'\)\.Task> \}\) => Promise<void>/,
  'vite-env should not claim task-menu dispatch payloads are trusted task objects.',
);
assert.doesNotMatch(
  viteEnv,
  /onTaskMenuAction: \(callback: \(payload: \{ taskId: string; updates: Partial<import\('\.\/types\/task'\)\.Task> \}\) => void\) => \(\) => void;/,
  'vite-env should not claim task-menu listener payloads are trusted task objects.',
);

console.log('app task menu action helper verification passed');
