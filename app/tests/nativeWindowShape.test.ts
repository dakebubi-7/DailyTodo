import { describe, expect, it } from 'vitest';
import { createRoundedWindowShape } from '../electron/nativeWindowShape';
import { applyConfiguredGlassAndRoundedShape } from '../electron/windowIpc';

describe('native window shape', () => {
  it('keeps the center fully covered while removing the transparent square corner pixels', () => {
    const shape = createRoundedWindowShape({ width: 160, height: 100 }, 18);

    expect(shape).toContainEqual({ x: 0, y: 18, width: 160, height: 64 });
    expect(shape.some((rect) => rect.x > 0 && rect.y === 0)).toBe(true);
    expect(shape.some((rect) => rect.x > 0 && rect.y === 99)).toBe(true);
  });

  it('reapplies the rounded native shape after a Win32 glass material update', () => {
    const calls: string[] = [];

    expect(applyConfiguredGlassAndRoundedShape(
      (settings) => {
        expect(settings).toMatchObject({ enabled: true, opacity: 48, blurStrength: 14 });
        calls.push('material');
        return true;
      },
      { enabled: true, opacity: 48, blurStrength: 14 },
      () => calls.push('shape'),
    )).toEqual({ nativeGlassApplied: true });

    expect(calls).toEqual(['material', 'shape']);
  });

  it('reports when composition falls back to the renderer after reapplying shape', () => {
    const calls: string[] = [];

    expect(applyConfiguredGlassAndRoundedShape(
      () => {
        calls.push('material');
        return false;
      },
      { enabled: true, opacity: 48, blurStrength: 14 },
      () => calls.push('shape'),
    )).toEqual({ nativeGlassApplied: false });

    expect(calls).toEqual(['material', 'shape']);
  });
});
