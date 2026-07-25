import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';

const minimizeRecoveryPath = resolve(process.cwd(), 'electron/minimizeRecovery.ts');

type RecoveryModule = {
  ON_TOP_MINIMIZE_RECOVERY_DELAY_MS: number;
  recoverFromUnexpectedMinimize(options: {
    win: {
      isDestroyed(): boolean;
      isMinimized(): boolean;
      showInactive(): void;
    };
    getWindowMode(): 'normal' | 'onTop' | 'desktop';
    isQuitting(): boolean;
    userHidden: { isHidden(): boolean };
    diag(message: string): void;
  }): void;
};

async function loadRecoveryModule(): Promise<RecoveryModule> {
  if (!existsSync(minimizeRecoveryPath)) {
    throw new Error('electron/minimizeRecovery.ts should provide unexpected-minimize recovery');
  }
  return import(/* @vite-ignore */ pathToFileURL(minimizeRecoveryPath).href) as Promise<RecoveryModule>;
}

afterEach(() => {
  vi.useRealTimers();
});

describe('unexpected minimize recovery', () => {
  it('waits briefly before recovering an on-top window without focusing it', async () => {
    vi.useFakeTimers();
    const { ON_TOP_MINIMIZE_RECOVERY_DELAY_MS, recoverFromUnexpectedMinimize } = await loadRecoveryModule();
    const showInactive = vi.fn();

    recoverFromUnexpectedMinimize({
      win: {
        isDestroyed: () => false,
        isMinimized: () => true,
        showInactive,
      },
      getWindowMode: () => 'onTop',
      isQuitting: () => false,
      userHidden: { isHidden: () => false },
      diag: vi.fn(),
    });

    vi.advanceTimersByTime(ON_TOP_MINIMIZE_RECOVERY_DELAY_MS - 1);
    expect(showInactive).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(showInactive).toHaveBeenCalledOnce();
  });

  it('keeps desktop recovery immediate and leaves normal windows minimized', async () => {
    const { recoverFromUnexpectedMinimize } = await loadRecoveryModule();
    const desktopShowInactive = vi.fn();
    const normalShowInactive = vi.fn();
    const createOptions = (mode: 'normal' | 'desktop', showInactive: () => void) => ({
      win: {
        isDestroyed: () => false,
        isMinimized: () => true,
        showInactive,
      },
      getWindowMode: () => mode,
      isQuitting: () => false,
      userHidden: { isHidden: () => false },
      diag: vi.fn(),
    });

    recoverFromUnexpectedMinimize(createOptions('desktop', desktopShowInactive));
    recoverFromUnexpectedMinimize(createOptions('normal', normalShowInactive));

    expect(desktopShowInactive).toHaveBeenCalledOnce();
    expect(normalShowInactive).not.toHaveBeenCalled();
  });

  it('does not restore an on-top window that was hidden before the delayed fallback runs', async () => {
    vi.useFakeTimers();
    const { ON_TOP_MINIMIZE_RECOVERY_DELAY_MS, recoverFromUnexpectedMinimize } = await loadRecoveryModule();
    const showInactive = vi.fn();
    let hidden = false;

    recoverFromUnexpectedMinimize({
      win: {
        isDestroyed: () => false,
        isMinimized: () => true,
        showInactive,
      },
      getWindowMode: () => 'onTop',
      isQuitting: () => false,
      userHidden: { isHidden: () => hidden },
      diag: vi.fn(),
    });
    hidden = true;
    vi.advanceTimersByTime(ON_TOP_MINIMIZE_RECOVERY_DELAY_MS);

    expect(showInactive).not.toHaveBeenCalled();
  });
});
