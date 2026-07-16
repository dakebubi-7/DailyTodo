import { describe, expect, it } from 'vitest';
import { getMainWindowVisualOptions } from '../electron/mainWindowFactory';

describe('main window visual options', () => {
  it('keeps the Windows 10 host transparent so Win32 Acrylic remains visible behind the renderer', () => {
    expect(getMainWindowVisualOptions('win32', '10.0.19045')).toEqual({
      transparent: true,
      backgroundColor: '#00000000',
      hasShadow: false,
    });
  });

  it('keeps the Windows 11 host transparent so Win32 Acrylic blur tiers stay visible', () => {
    expect(getMainWindowVisualOptions('win32', '10.0.22631')).toEqual({
      transparent: true,
      backgroundColor: '#00000000',
      hasShadow: false,
    });
  });

  it('keeps transparent fallback settings on other desktop platforms', () => {
    expect(getMainWindowVisualOptions('darwin')).toEqual({
      transparent: true,
      backgroundColor: '#00000000',
    });
  });

  it('does not replace the native rounded host with a rectangular shape', async () => {
    const factory = await import('../electron/mainWindowFactory');

    expect('createFullWindowShape' in factory).toBe(false);
  });
});
