import {
  resolveDesktopWidgetState,
  type DesktopWidgetState,
} from './desktopWidgetState';

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const desktopForegroundClasses = new Set([
  'WorkerW',
  'Progman',
  'SHELLDLL_DefView',
  'SysListView32',
]);

function resolve(
  foregroundClass: string,
  ownForeground: boolean,
  currentState: DesktopWidgetState,
  desktopShellSeenAt: number,
  now: number,
) {
  return resolveDesktopWidgetState({
    foregroundClass,
    ownForeground,
    currentState,
    desktopShellSeenAt,
    now,
    desktopForegroundClasses,
  });
}

const desktop = resolve('WorkerW', false, 'app-background', 0, 1000);
assert(desktop.nextState === 'desktop-visible', 'desktop shell foreground should make the widget visible.');
assert(desktop.desktopShellSeenAt === 1000, 'desktop shell foreground should refresh the grace timestamp.');
assert(!desktop.shouldForceAppBackground, 'desktop shell foreground should not force an app-background sink.');

const active = resolve('DailyTodo', true, 'desktop-visible', 1000, 1050);
assert(active.nextState === 'dt-active', 'foreground app window should become interactive.');
assert(active.desktopShellSeenAt === 1000, 'foreground app window should retain the existing grace timestamp.');

const grace = resolve('', false, 'desktop-visible', 1000, 1100);
assert(grace.nextState === 'desktop-visible', 'brief missing foreground class should retain desktop visibility.');

const background = resolve('Notepad', false, 'desktop-visible', 1000, 1200);
assert(background.nextState === 'app-background', 'another application should sink the desktop widget.');
assert(background.desktopShellSeenAt === 0, 'another application should clear the desktop grace timestamp.');
assert(background.shouldForceAppBackground, 'another application should force a background sink.');

console.log('desktopWidgetState.verify: all assertions passed');
