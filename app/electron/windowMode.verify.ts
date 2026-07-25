import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_WINDOW_MODE,
  isAlwaysOnTop,
  isWindowMode,
  needsDesktopGuard,
  readWindowMode,
  resolveWindowMode,
  setDesktopMode,
  togglePinnedMode,
} from '../shared/windowMode';

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

// isWindowMode
assert(isWindowMode('normal') && isWindowMode('onTop') && isWindowMode('desktop'), 'valid modes accepted');
assert(!isWindowMode('floating') && !isWindowMode(undefined) && !isWindowMode(true), 'invalid modes rejected');

// readWindowMode
assert(readWindowMode('onTop') === 'onTop', 'readWindowMode admits valid modes');
assert(readWindowMode('floating') === undefined, 'readWindowMode rejects invalid modes');
assert(readWindowMode(null) === undefined, 'readWindowMode rejects null');

// resolveWindowMode: new key wins
assert(resolveWindowMode('desktop', true) === 'desktop', 'new key takes precedence over legacy');
// resolveWindowMode: legacy migration
assert(resolveWindowMode(undefined, true) === 'onTop', 'legacy true → onTop');
assert(resolveWindowMode(undefined, false) === 'normal', 'legacy false → normal');
// resolveWindowMode: nothing stored → default
assert(resolveWindowMode(undefined, undefined) === DEFAULT_WINDOW_MODE, 'empty → default onTop');
assert(resolveWindowMode('garbage', 'garbage') === DEFAULT_WINDOW_MODE, 'garbage → default onTop');

// isAlwaysOnTop
assert(isAlwaysOnTop('onTop'), 'onTop is always-on-top');
assert(!isAlwaysOnTop('normal') && !isAlwaysOnTop('desktop'), 'normal/desktop not always-on-top');

// needsDesktopGuard
assert(needsDesktopGuard('desktop'), 'desktop needs guard');
assert(!needsDesktopGuard('normal') && !needsDesktopGuard('onTop'), 'others no guard');

// togglePinnedMode (titlebar pin)
assert(togglePinnedMode('normal') === 'onTop', 'normal → onTop');
assert(togglePinnedMode('onTop') === 'normal', 'onTop → normal');
assert(togglePinnedMode('desktop') === 'onTop', 'desktop → onTop (exit desktop)');

// setDesktopMode (tray checkbox) — mutual exclusion
assert(setDesktopMode('normal', true) === 'desktop', 'normal + pin → desktop');
assert(setDesktopMode('onTop', true) === 'desktop', 'onTop + pin → desktop (exits onTop)');
assert(setDesktopMode('desktop', true) === 'desktop', 'desktop + pin → desktop (idempotent)');
assert(setDesktopMode('desktop', false) === 'normal', 'desktop + unpin → normal');
assert(setDesktopMode('normal', false) === 'normal', 'normal + unpin → normal (no change)');
assert(setDesktopMode('onTop', false) === 'onTop', 'onTop + unpin → onTop (no change)');

const here = dirname(fileURLToPath(import.meta.url));
const desktopWindowModeSource = readFileSync(join(here, 'desktopWindowMode.ts'), 'utf8');
const mainWindowCompositionSource = readFileSync(join(here, 'mainWindowComposition.ts'), 'utf8');
const mainWindowModeControllerSource = readFileSync(join(here, 'mainWindowModeController.ts'), 'utf8');
const windowIpcSource = readFileSync(join(here, 'windowIpc.ts'), 'utf8');
const titleBarSource = readFileSync(join(here, '../src/components/TitleBar.tsx'), 'utf8');
const titleBarWindowModeSource = readFileSync(join(here, '../src/components/useTitleBarWindowMode.ts'), 'utf8');
const viteEnvSource = readFileSync(join(here, '../src/vite-env.d.ts'), 'utf8');
assert(desktopWindowModeSource.includes('function reapplyWindowZOrder'), 'desktopWindowMode.ts should define reapplyWindowZOrder helper');
assert(
  /setTimeout\(\s*\(\)\s*=>\s*\{[\s\S]*?reapplyWindowZOrder\(win\);[\s\S]*?\},\s*80\);/.test(mainWindowModeControllerSource),
  'mainWindowModeController.ts should preserve delayed z-order reapplication.',
);
assert(mainWindowCompositionSource.includes('reapplyWindowZOrder: desktopWindowMode.reapplyWindowZOrder'), 'main-window composition should pass controller reapplyWindowZOrder into downstream window-mode helpers.');
assert(windowIpcSource.includes('reapplyWindowZOrder(mainWindow);'), 'lock window position changes should reapply z-order for the main window');
assert(titleBarSource.includes('useTitleBarWindowMode'), 'TitleBar should use the dedicated window-mode hook');
assert(titleBarWindowModeSource.includes('readWindowMode'), 'TitleBar window-mode hook should parse window-mode IPC returns with readWindowMode');
assert(titleBarWindowModeSource.includes("readWindowMode(mode) === 'onTop'") || titleBarWindowModeSource.includes("readWindowMode(await window.electronAPI?.getWindowMode())"), 'TitleBar window-mode hook should only pin after validating window-mode returns');
assert(viteEnvSource.includes('getWindowMode: () => Promise<unknown>'), 'ambient getWindowMode should return Promise<unknown>');
assert(viteEnvSource.includes('setWindowMode: (mode: unknown) => Promise<unknown>'), 'ambient setWindowMode should return Promise<unknown>');

console.log('windowMode.verify: all assertions passed');
