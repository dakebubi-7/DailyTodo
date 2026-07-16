import { describe, expect, it } from 'vitest';
import { getActivationStripBounds, getActivationStripPageHtml } from '../electron/edgeAutoHideActivationStrip';

describe('edge auto-hide activation strip', () => {
  const workArea = { x: -1920, y: 0, width: 1920, height: 1040 };
  const bounds = { x: -1920, y: 120, width: 240, height: 480 };

  it('places a short left activation strip inside a negative-coordinate display edge', () => {
    expect(getActivationStripBounds('left', bounds, workArea)).toEqual({
      x: -1920,
      y: 312,
      width: 8,
      height: 96,
    });
  });

  it('places a short right activation strip inside the matching display edge', () => {
    expect(getActivationStripBounds('right', { ...bounds, x: -240 }, workArea)).toEqual({
      x: -8,
      y: 312,
      width: 8,
      height: 96,
    });
  });

  it('places a short top activation strip centered on the original window', () => {
    expect(getActivationStripBounds('top', { ...bounds, x: -900, y: 0 }, workArea)).toEqual({
      x: -828,
      y: 0,
      width: 96,
      height: 8,
    });
  });

  it('keeps all activation handles short', () => {
    expect(getActivationStripBounds('left', bounds, workArea).height).toBe(96);
    expect(getActivationStripBounds('right', bounds, workArea).height).toBe(96);
    expect(getActivationStripBounds('top', bounds, workArea).width).toBe(96);
    expect(getActivationStripBounds('top', bounds, workArea).height).toBe(8);
  });

  it('uses a liquid-glass style activation strip', () => {
    const page = getActivationStripPageHtml();
    expect(page).toContain('backdrop-filter');
    expect(page).toContain('linear-gradient');
    expect(page).toContain('border-radius: 999px');
    expect(page).not.toContain('rgba(77, 124, 255');
  });

  it('binds explicit mouse enter and press signals inside the activation strip page', () => {
    const page = getActivationStripPageHtml();

    expect(page).toContain("addEventListener('mouseenter'");
    expect(page).toContain("addEventListener('mousedown'");
    expect(page).toContain('edge-auto-hide-activate');
  });
});
