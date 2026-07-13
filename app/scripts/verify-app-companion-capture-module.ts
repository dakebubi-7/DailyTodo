import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';
import { buildCaptureItems } from '../src/store/taskStore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const helperPath = join(root, 'src/app/appCompanionCapture.ts');
const shellCompositionHookPath = join(root, 'src/app/useAppShellComposition.ts');
const appPath = join(root, 'src/App.tsx');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(helperPath), 'App companion capture helper module should exist.');
assert.ok(existsSync(shellCompositionHookPath), 'Runtime shell composition hook should exist for companion capture wiring verification.');

const helper = readFileSync(helperPath, 'utf8');
const shellCompositionHook = readFileSync(shellCompositionHookPath, 'utf8');
const app = readFileSync(appPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.deepEqual(
  buildCaptureItems(
    [
      {
        id: 'created-at-task',
        text: 'Capture me',
        completed: false,
        priority: 'medium',
        createdAt: '2026-07-12T08:00:00.000Z',
        taskDate: '',
        isToday: true,
      },
    ],
    '2026-07-12',
  ).map((item) => item.id),
  ['task-created-at-task'],
  'desktop capture items should use the shared task-date precedence for legacy tasks without taskDate.',
);

assert.match(helper, /export interface AppCompanionCaptureInput\b/, 'helper should export AppCompanionCaptureInput.');
assert.match(helper, /export function createAppCompanionCaptureItems\b/, 'helper should export createAppCompanionCaptureItems.');
assert.match(helper, /export function createAppCompanionCaptureGetter\b/, 'helper should export createAppCompanionCaptureGetter.');
assert.match(helper, /return \(\) => createAppCompanionCaptureItems\(input\)/, 'capture getter should lazily create capture items from the supplied input.');
assert.match(helper, /buildCaptureItems\(allTasks, selectedDate, dailyWork, dailyInspiration\)/, 'helper should preserve desktop capture item construction.');
assert.match(helper, /\.\.\.mobileCaptureItems/, 'helper should append imported mobile capture items.');
assert.match(helper, /CaptureItem\[\]/, 'helper should preserve CaptureItem array typing.');

const taskStore = readFileSync(join(root, 'src/store/taskStore.ts'), 'utf8');
const companionCaptureItems = readFileSync(join(root, 'src/store/companionCaptureItems.ts'), 'utf8');
assert.match(companionCaptureItems, /from ['"].*taskRollover['"]/, 'Capture-item builder should reuse shared task-date resolution for capture filtering.');
assert.doesNotMatch(
  companionCaptureItems,
  /task\.taskDate \|\| task\.createdAt\.slice\(0,\s*10\)/,
  'taskStore should not keep a local task-date fallback chain for capture filtering.',
);

assert.match(app, /useAppShellComposition\(\{/, 'App should delegate companion capture wiring through the runtime composition hook.');
assert.match(shellCompositionHook, /import \{ createAppCompanionCaptureGetter \} from '\.\/appCompanionCapture'/, 'Runtime shell composition hook should import the companion capture getter helper.');
assert.match(
  shellCompositionHook,
  /const getCurrentCaptureItems = useMemo\(\(\) => createAppCompanionCaptureGetter\(\{\s*allTasks: taskState\.allTasks,\s*selectedDate: taskState\.selectedDate,\s*dailyWork: taskState\.dailyWork,\s*dailyInspiration: taskState\.dailyInspiration,\s*mobileCaptureItems: appState\.mobileCaptureItems,\s*\}\), \[taskState\.allTasks, taskState\.selectedDate, taskState\.dailyWork, taskState\.dailyInspiration, appState\.mobileCaptureItems\]\);/s,
  'Runtime shell composition hook should preserve the capture getter until capture inputs change.',
);
assert.doesNotMatch(app, /const getCurrentCaptureItems = \(\) => createAppCompanionCaptureItems\(\{/s, 'App should not inline lazy capture item construction.');
assert.doesNotMatch(app, /\.\.\.buildCaptureItems\(allTasks, selectedDate, dailyWork, dailyInspiration\)/, 'App should not inline desktop capture item spreading.');
assert.doesNotMatch(app, /from '\.\/store\/taskStore';[\s\S]*buildCaptureItems/, 'App should not import buildCaptureItems directly from taskStore.');
assert.equal(scripts['verify:app-companion-capture-module'], 'tsx scripts/verify-app-companion-capture-module.ts', 'package.json should expose the focused companion capture verifier.');
assertCleanupCoreIncludes('verify:app-companion-capture-module', 'cleanup-core should include the focused companion capture verifier.');

console.log('App companion capture helper verification passed');
