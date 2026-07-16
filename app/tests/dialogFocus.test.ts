import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  focusDialog,
  handleDialogTabKeyDown,
  restoreDialogFocus,
} from '../src/components/dialogFocus';

type FakeFocusable = {
  disabled?: boolean;
  focus: ReturnType<typeof vi.fn>;
  isConnected?: boolean;
};

function createFocusable(options: { disabled?: boolean; isConnected?: boolean } = {}): FakeFocusable {
  return {
    ...options,
    focus: vi.fn(),
  };
}

function createDialog(focusableElements: FakeFocusable[]) {
  return {
    focus: vi.fn(),
    querySelectorAll: vi.fn(() => focusableElements),
  };
}

describe('dialog focus helpers', () => {
  it('focuses the first enabled interactive element', () => {
    const disabled = createFocusable({ disabled: true });
    const first = createFocusable();
    const second = createFocusable();
    const dialog = createDialog([disabled, first, second]);

    focusDialog(dialog);

    expect(first.focus).toHaveBeenCalledOnce();
    expect(second.focus).not.toHaveBeenCalled();
    expect(dialog.focus).not.toHaveBeenCalled();
  });

  it('focuses the dialog container when no interactive elements exist', () => {
    const dialog = createDialog([]);

    focusDialog(dialog);

    expect(dialog.focus).toHaveBeenCalledOnce();
  });

  it('wraps Tab from the last focusable element to the first', () => {
    const first = createFocusable();
    const last = createFocusable();
    const preventDefault = vi.fn();
    const dialog = createDialog([first, last]);

    handleDialogTabKeyDown({ key: 'Tab', shiftKey: false, preventDefault }, dialog, last);

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(first.focus).toHaveBeenCalledOnce();
  });

  it('wraps Shift+Tab from the first focusable element to the last', () => {
    const first = createFocusable();
    const last = createFocusable();
    const preventDefault = vi.fn();
    const dialog = createDialog([first, last]);

    handleDialogTabKeyDown({ key: 'Tab', shiftKey: true, preventDefault }, dialog, first);

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(last.focus).toHaveBeenCalledOnce();
  });

  it('leaves Tab between interior focusable elements to the browser', () => {
    const first = createFocusable();
    const middle = createFocusable();
    const last = createFocusable();
    const preventDefault = vi.fn();
    const dialog = createDialog([first, middle, last]);

    handleDialogTabKeyDown({ key: 'Tab', shiftKey: false, preventDefault }, dialog, middle);

    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('restores focus only to a connected trigger', () => {
    const connected = createFocusable({ isConnected: true });
    const disconnected = createFocusable({ isConnected: false });

    restoreDialogFocus(connected);
    restoreDialogFocus(disconnected);

    expect(connected.focus).toHaveBeenCalledOnce();
    expect(disconnected.focus).not.toHaveBeenCalled();
  });
});

describe('dialog focus lifecycle adoption', () => {
  it.each([
    '../src/components/TaskCompletionDialog.tsx',
    '../src/components/TaskReviewDialog.tsx',
  ])('connects %s to the shared focus lifecycle', (file) => {
    const source = readFileSync(resolve(import.meta.dirname, file), 'utf8');

    expect(source).toContain("import { useDialogFocus } from './useDialogFocus'");
    expect(source).toContain('const { dialogRef, handleKeyDown } = useDialogFocus');
  });
});
