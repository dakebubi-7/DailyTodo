import { describe, expect, it, vi } from 'vitest';
import { handleDialogKeyDown } from '../src/components/dialogKeyboard';

describe('dialog keyboard handling', () => {
  it('closes on Escape and prevents the key from reaching the page', () => {
    const onClose = vi.fn();
    const preventDefault = vi.fn();
    handleDialogKeyDown({ key: 'Escape', preventDefault }, onClose);
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('ignores unrelated keys', () => {
    const onClose = vi.fn();
    const preventDefault = vi.fn();
    handleDialogKeyDown({ key: 'Enter', preventDefault }, onClose);
    expect(preventDefault).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
