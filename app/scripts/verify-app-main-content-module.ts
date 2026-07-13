import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const mainContentPath = join(root, 'src/components/AppMainContent.tsx');
const addTaskInputPath = join(root, 'src/components/AddTaskInput.tsx');
const helperPath = join(root, 'src/app/appShellComposition.tsx');
const mainContentCompositionPath = join(root, 'src/app/appShellMainContentComposition.tsx');
const runtimeCompositionPath = join(root, 'src/app/useAppShellComposition.ts');
const appPath = join(root, 'src/App.tsx');
const floatingScrollbarPath = join(root, 'src/hooks/useFloatingScrollbar.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(mainContentPath), 'App main content component should exist.');
assert.ok(existsSync(helperPath), 'App shell composition helper should exist for main-content wiring verification.');
assert.ok(existsSync(mainContentCompositionPath), 'App shell main-content composition helper should exist for main-content wiring verification.');
assert.ok(existsSync(runtimeCompositionPath), 'App shell runtime composition hook should exist for main-content wiring verification.');
assert.ok(existsSync(floatingScrollbarPath), 'Floating scrollbar hook module should exist.');

const mainContent = readFileSync(mainContentPath, 'utf8');
const addTaskInput = readFileSync(addTaskInputPath, 'utf8');
const helper = readFileSync(helperPath, 'utf8');
const mainContentComposition = readFileSync(mainContentCompositionPath, 'utf8');
const runtimeComposition = readFileSync(runtimeCompositionPath, 'utf8');
const app = readFileSync(appPath, 'utf8');
const floatingScrollbar = readFileSync(floatingScrollbarPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(mainContent, /export interface AppMainContentProps\b/, 'main content should export AppMainContentProps.');
assert.match(mainContent, /export function AppMainContent\b/, 'main content should export AppMainContent.');
assert.match(mainContent, /from 'framer-motion'/, 'main content should own the main motion shell import.');
assert.match(mainContent, /lazy\(\(\) => import\('\.\/ReviewView'\)/, 'main content should lazy-load ReviewView for the completed tab.');
assert.match(mainContent, /<Suspense fallback=\{null\}>[\s\S]*<ReviewView \{\.\.\.reviewViewProps\} \/>[\s\S]*<\/Suspense>/, 'main content should suspend the cold ReviewView branch.');
assert.doesNotMatch(mainContent, /^import \{ ReviewView \} from '\.\/ReviewView';$/m, 'main content should not eagerly import ReviewView.');
assert.match(mainContent, /from '\.\/TaskList'/, 'main content should own the TaskList import.');
assert.match(mainContent, /from '\.\/AddTaskInput'/, 'main content should own the AddTaskInput import.');
assert.match(addTaskInput, /import \{ memo, useMemo, useState \} from 'react';/, 'AddTaskInput should import memo to avoid re-rendering for unrelated task mutations.');
assert.match(addTaskInput, /export const AddTaskInput = memo\(function AddTaskInput\(/, 'AddTaskInput should be memoized while its onAdd callback remains stable for the selected date.');
assert.match(mainContent, /mainScrollRef/, 'main content should accept the main scroll ref.');
assert.match(mainContent, /\{topContent\}/, 'main content should render the delegated top content block.');
assert.match(mainContent, /className="app-main-scroll min-h-0 flex flex-1 flex-col overflow-hidden"/, 'main content should own the app-main-scroll container.');
assert.match(mainContent, /<TaskList \{\.\.\.taskListProps\} \/>/, 'main content should render TaskList through prop forwarding.');
assert.match(mainContent, /<AddTaskInput \{\.\.\.addTaskInputProps\} \/>/, 'main content should render AddTaskInput through prop forwarding.');
assert.match(mainContent, /initial=\{\{ opacity: 0, y: 8 \}\}/, 'main content should preserve the existing entry motion initial state.');
assert.match(mainContent, /animate=\{\{ opacity: 1, y: 0 \}\}/, 'main content should preserve the existing entry motion animate state.');
assert.match(mainContent, /transition=\{\{ duration: 0\.45, delay: 0\.12 \}\}/, 'main content should preserve the existing entry motion timing.');

assert.match(mainContentComposition, /const reviewViewProps = \{[\s\S]*allTasks,[\s\S]*onEditReview: editTaskReview,[\s\S]*onDeleteReview: deleteTaskReview,[\s\S]*\};/, 'main-content composition helper should gather ReviewView props.');
assert.match(mainContentComposition, /const taskListProps = \{[\s\S]*tasks: visibleTasks,[\s\S]*onToggle: completionActions\.toggleTask,[\s\S]*editRequest,[\s\S]*\};/, 'main-content composition helper should gather TaskList props.');
assert.match(mainContentComposition, /const addTaskInputProps = \{\s*onAdd: addTask,\s*\};/, 'main-content composition helper should gather AddTaskInput props.');
assert.match(mainContentComposition, /return \{[\s\S]*mainScrollRef,[\s\S]*topContent: <AppTopContent \{\.\.\.topContentProps\} \/>,[\s\S]*reviewViewProps,[\s\S]*taskListProps,[\s\S]*addTaskInputProps,[\s\S]*\};/, 'main-content composition helper should assemble AppMainContent props.');
assert.match(helper, /createAppShellMainContentComposition\(mainContent\);/, 'shell composition helper should delegate grouped main-content inputs.');

assert.match(app, /from '\.\/components\/AppMainContent'/, 'App should import AppMainContent.');
assert.match(runtimeComposition, /from '\.\/appShellComposition'/, 'runtime composition hook should import the shell composition helper.');
assert.match(app, /from '\.\/app\/useAppShellComposition'/, 'App should import the shell composition runtime hook.');
assert.match(app, /<AppMainContent \{\.\.\.shellComposition\.mainContentProps\} \/>/, 'App should delegate the main content shell into AppMainContent through shell composition.');
assert.doesNotMatch(floatingScrollbar, /querySelector\([^\n]+\)\s+as\s+HTMLElement\s*\|\s*null/, 'Floating scrollbar should not cast querySelector results directly to HTMLElement.');
assert.match(floatingScrollbar, /header\s+instanceof\s+HTMLElement/, 'Floating scrollbar should narrow optional headers with instanceof HTMLElement before offsetHeight.');
assert.match(
  floatingScrollbar,
  /const header = headerSelector \? el\.querySelector\(headerSelector\) : null;[\s\S]*?let headerHeight = header instanceof HTMLElement \? header\.offsetHeight : 0;/,
  'Floating scrollbar should resolve and measure its optional header once during setup.',
);
assert.match(
  floatingScrollbar,
  /let headerResizeObserver: ResizeObserver \| undefined;[\s\S]*?if \(header instanceof HTMLElement\) \{[\s\S]*?headerResizeObserver = new ResizeObserver[\s\S]*?headerResizeObserver\.observe\(header\);[\s\S]*?\}/,
  'Floating scrollbar should observe header size changes so cached measurements stay current.',
);
assert.doesNotMatch(
  floatingScrollbar,
  /const headerOffset = \(\) => \{[\s\S]*?querySelector\(/,
  'Floating scrollbar layout helpers should not query the header on every frame.',
);
assert.match(
  floatingScrollbar,
  /headerResizeObserver\?\.disconnect\(\);/,
  'Floating scrollbar cleanup should disconnect its optional header observer.',
);
assert.match(
  floatingScrollbar,
  /let layoutFrame:\s*number \| undefined;[\s\S]*?const scheduleLayout = \(show = false\) => \{[\s\S]*?if \(layoutFrame !== undefined\) return;[\s\S]*?layoutFrame = window\.requestAnimationFrame\(\(\) => \{[\s\S]*?layoutFrame = undefined;[\s\S]*?layout\(\)[\s\S]*?\}\);[\s\S]*?\};/,
  'Floating scrollbar should coalesce observer-driven layout work into one animation frame.',
);
assert.match(
  floatingScrollbar,
  /new ResizeObserver\(\(\) => scheduleLayout\(\)\);[\s\S]*?new MutationObserver\(\(\) => scheduleLayout\(\)\);/,
  'Floating scrollbar observers should schedule, rather than synchronously repeat, layout work.',
);
assert.match(
  floatingScrollbar,
  /const scheduleShow = \(\) => \{[\s\S]*?scheduleLayout\(true\);[\s\S]*?\};[\s\S]*?const onScroll = \(\) => \{[\s\S]*?scheduleShow\(\);/,
  'Floating scrollbar scroll events should coalesce layout and visibility work into an animation frame.',
);
assert.doesNotMatch(
  floatingScrollbar,
  /const onScroll = \(\) => \{\s*show\(\);/,
  'Floating scrollbar scroll events should not synchronously force a layout for every event.',
);
assert.match(
  floatingScrollbar,
  /if \(layoutFrame !== undefined\) window\.cancelAnimationFrame\(layoutFrame\);/,
  'Floating scrollbar cleanup should cancel any queued layout frame.',
);
assert.doesNotMatch(app, /const reviewViewProps = \{/, 'App should not inline ReviewView props once shell composition owns them.');
assert.doesNotMatch(app, /const taskListProps = \{/, 'App should not inline TaskList props once shell composition owns them.');
assert.doesNotMatch(app, /const addTaskInputProps = \{/, 'App should not inline AddTaskInput props once shell composition owns them.');
assert.doesNotMatch(app, /const mainContentProps = \{/, 'App should not inline main-content props once shell composition owns them.');
assert.doesNotMatch(app, /<ReviewView\b/, 'App should not render ReviewView directly once AppMainContent owns the main-content branch.');
assert.doesNotMatch(app, /<TaskList\b/, 'App should not render TaskList directly once AppMainContent owns the main-content branch.');
assert.doesNotMatch(app, /<AddTaskInput\b/, 'App should not render AddTaskInput directly once AppMainContent owns the main-content shell.');
assert.doesNotMatch(app, /className="app-main-scroll min-h-0 flex flex-1 flex-col overflow-hidden"/, 'App should not keep the app-main-scroll container inline once AppMainContent owns it.');
assert.equal(scripts['verify:app-main-content-module'], 'tsx scripts/verify-app-main-content-module.ts', 'package.json should expose the focused App main-content verifier.');
assertCleanupCoreIncludes('verify:app-main-content-module', 'cleanup-core should include the focused App main-content verifier.');

console.log('App main content verification passed');
