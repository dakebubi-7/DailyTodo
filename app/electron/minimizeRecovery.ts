import type { WindowMode } from '../shared/windowMode';

export const ON_TOP_MINIMIZE_RECOVERY_DELAY_MS = 160;

type MinimizeRecoveryWindow = {
  isDestroyed(): boolean;
  isMinimized(): boolean;
  showInactive(): void;
};

export type RecoverFromUnexpectedMinimizeOptions = {
  win: MinimizeRecoveryWindow;
  getWindowMode(): WindowMode;
  isQuitting(): boolean;
  userHidden: { isHidden(): boolean };
  diag(message: string): void;
};

function canRecover({ win, getWindowMode, isQuitting, userHidden }: RecoverFromUnexpectedMinimizeOptions): boolean {
  return !isQuitting()
    && !win.isDestroyed()
    && !userHidden.isHidden()
    && getWindowMode() !== 'normal'
    && win.isMinimized();
}

function showInactiveIfStillMinimized(options: RecoverFromUnexpectedMinimizeOptions, source: string): void {
  if (!canRecover(options)) return;
  try {
    options.win.showInactive();
    options.diag(`${source}: showInactive after minimize`);
  } catch (error) {
    options.diag(`${source} failed: ${String(error)}`);
  }
}

export function recoverFromUnexpectedMinimize(options: RecoverFromUnexpectedMinimizeOptions): void {
  const mode = options.getWindowMode();
  if (mode === 'desktop') {
    showInactiveIfStillMinimized(options, 'desktop guard');
    return;
  }
  if (mode !== 'onTop') return;

  setTimeout(() => showInactiveIfStillMinimized(options, 'on-top minimize recovery'), ON_TOP_MINIMIZE_RECOVERY_DELAY_MS);
}
