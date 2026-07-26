import { describe, expect, it } from 'vitest';
import { getActivationStripBounds, getActivationStripPageHtml } from '../electron/edgeAutoHideActivationStrip';

describe('edge auto-hide activation strip', () => {
  const workArea = { x: -1920, y: 0, width: 1920, height: 1040 };
  const bounds = { x: -1920, y: 120, width: 240, height: 480 };

  it('places a short left activation strip inside a negative-coordinate display edge', () => {
    expect(getActivationStripBounds('left', bounds, workArea)).toEqual({
      x: -1920,
      y: 312,
      width: 28,
      height: 96,
    });
  });

  it('places a short right activation strip inside the matching display edge', () => {
    expect(getActivationStripBounds('right', { ...bounds, x: -240 }, workArea)).toEqual({
      x: -28,
      y: 312,
      width: 28,
      height: 96,
    });
  });

  it('places a short top activation strip centered on the original window', () => {
    expect(getActivationStripBounds('top', { ...bounds, x: -900, y: 0 }, workArea)).toEqual({
      x: -828,
      y: 0,
      width: 96,
      height: 28,
    });
  });

  it('uses transparent A2 hit regions around every visible glass pull', () => {
    expect(getActivationStripBounds('left', bounds, workArea)).toMatchObject({ width: 28, height: 96 });
    expect(getActivationStripBounds('right', { ...bounds, x: -240 }, workArea)).toMatchObject({ width: 28, height: 96 });
    expect(getActivationStripBounds('top', { ...bounds, x: -900, y: 0 }, workArea)).toMatchObject({ width: 96, height: 28 });
  });

  it('defines A2 glass pulls for every supported edge', () => {
    const page = getActivationStripPageHtml();

    expect(page).toContain('<html data-edge="right">');
    expect(page).toContain('class="glass-pull"');
    expect(page).toContain('html[data-edge="left"] .glass-pull');
    expect(page).toContain('html[data-edge="right"] .glass-pull');
    expect(page).toContain('html[data-edge="top"] .glass-pull');
    expect(page).toContain('width: 15px');
    expect(page).toContain('height: 72px');
    expect(page).toContain('width: 72px');
    expect(page).toContain('height: 15px');
    expect(page).toContain('width 150ms ease');
    expect(page).toContain('height 150ms ease');
    expect(page).toContain('backdrop-filter');
    expect(page).toContain('border-right: 0');
    expect(page).toContain('border-left: 0');
    expect(page).toContain('border-top: 0');
  });

  it('binds explicit mouse enter and press signals inside the activation strip page', () => {
    const page = getActivationStripPageHtml();

    expect(page).toContain("addEventListener('mouseenter'");
    expect(page).toContain("addEventListener('mousedown'");
    expect(page).toContain('edge-auto-hide-activate');
  });
});
