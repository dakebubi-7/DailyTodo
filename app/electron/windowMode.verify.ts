import {
  DEFAULT_WINDOW_MODE,
  isAlwaysOnTop,
  isWindowMode,
  needsDesktopGuard,
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

console.log('windowMode.verify: all assertions passed');
