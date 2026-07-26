import { describe, expect, it } from 'vitest';
import {
  EDGE_AUTO_HIDE_ACTIVATION_HIT_THICKNESS_PX,
  EDGE_AUTO_HIDE_DESKTOP_EDGE_HIT_PX,
  EDGE_AUTO_HIDE_SIDE_STRIP_LENGTH_PX,
  EDGE_AUTO_HIDE_TOP_SNAP_PX,
  getActivationStripBounds,
  getEdgeAttachment,
  getDesktopEdgeAtPoint,
  getExpandedBounds,
  getRetractedBounds,
  isPointInActivationStrip,
  isPointInRect,
  isPointOnDesktopEdge,
} from '../electron/edgeAutoHideGeometry';

describe('edge auto-hide geometry', () => {
  const workArea = { x: 0, y: 0, width: 1920, height: 1040 };

  it('recognizes side snap positions without requiring the window to be pushed offscreen', () => {
    expect(getEdgeAttachment({ x: 0, y: 400, width: 240, height: 480 }, workArea)).toBe('left');
    expect(getEdgeAttachment({ x: 1680, y: 400, width: 240, height: 480 }, workArea)).toBe('right');
    expect(getEdgeAttachment({ x: 12, y: 400, width: 240, height: 480 }, workArea)).toBe('left');
    expect(getEdgeAttachment({ x: 40, y: 400, width: 240, height: 480 }, workArea)).toBeNull();
    expect(getEdgeAttachment({ x: 1600, y: 400, width: 240, height: 480 }, workArea)).toBeNull();
  });

  it('identifies the desktop edge touched by the drag cursor', () => {
    expect(getDesktopEdgeAtPoint({ x: 2, y: 400 }, workArea)).toBe('left');
    expect(getDesktopEdgeAtPoint({ x: 1918, y: 400 }, workArea)).toBe('right');
    expect(getDesktopEdgeAtPoint({ x: 900, y: 2 }, workArea)).toBe('top');
    expect(getDesktopEdgeAtPoint({ x: 900, y: 400 }, workArea)).toBeNull();
  });

  it('only attaches the top when the window is placed at the top', () => {
    expect(EDGE_AUTO_HIDE_TOP_SNAP_PX).toBe(12);
    expect(getEdgeAttachment({ x: 600, y: 12, width: 240, height: 480 }, workArea)).toBe('top');
    expect(getEdgeAttachment({ x: 600, y: 13, width: 240, height: 480 }, workArea)).toBeNull();
    expect(getEdgeAttachment({ x: 600, y: 100, width: 240, height: 480 }, workArea)).toBeNull();
  });

  it('does not attach to the bottom edge', () => {
    expect(getEdgeAttachment({ x: 600, y: 552, width: 360, height: 480 }, workArea)).toBeNull();
  });

  it('fully parks the main window offscreen when retracted', () => {
    const bounds = { x: 0, y: 120, width: 240, height: 480 };

    expect(getRetractedBounds('left', bounds, workArea)).toEqual({
      x: -240,
      y: 120,
      width: 240,
      height: 480,
    });
    expect(getRetractedBounds('right', { ...bounds, x: 1680 }, workArea)).toEqual({
      x: 1920,
      y: 120,
      width: 240,
      height: 480,
    });
    expect(getRetractedBounds('top', { ...bounds, x: 600, y: 0 }, workArea)).toEqual({
      x: 600,
      y: -480,
      width: 240,
      height: 480,
    });
  });

  it('uses wider centered activation hit regions for every supported edge', () => {
    const bounds = { x: 0, y: 120, width: 240, height: 480 };
    expect(EDGE_AUTO_HIDE_ACTIVATION_HIT_THICKNESS_PX).toBe(28);
    expect(EDGE_AUTO_HIDE_SIDE_STRIP_LENGTH_PX).toBe(96);
    expect(getActivationStripBounds('left', bounds, workArea)).toEqual({
      x: 0,
      y: 312,
      width: 28,
      height: 96,
    });
    expect(getActivationStripBounds('right', { ...bounds, x: 1680 }, workArea)).toEqual({
      x: 1892,
      y: 312,
      width: 28,
      height: 96,
    });
    expect(getActivationStripBounds('top', { ...bounds, x: 600, y: 0 }, workArea)).toEqual({
      x: 672,
      y: 0,
      width: 96,
      height: 28,
    });
  });

  it('restores the expanded bounds flush to its original work-area edge', () => {
    expect(getExpandedBounds('left', { x: -240, y: 120, width: 240, height: 480 }, workArea)).toEqual({
      x: 0,
      y: 120,
      width: 240,
      height: 480,
    });
    expect(getExpandedBounds('right', { x: 1920, y: 120, width: 240, height: 480 }, workArea)).toEqual({
      x: 1680,
      y: 120,
      width: 240,
      height: 480,
    });
  });

  it('preserves negative display coordinates when retracting from the left edge', () => {
    const secondaryWorkArea = { x: -1920, y: 0, width: 1920, height: 1040 };
    const bounds = { x: -1920, y: 120, width: 240, height: 480 };

    expect(getRetractedBounds('left', bounds, secondaryWorkArea)).toEqual({
      x: -2160,
      y: 120,
      width: 240,
      height: 480,
    });
  });

  it('accepts pointer positions throughout each transparent activation hit region only', () => {
    const expanded = { x: 0, y: 120, width: 240, height: 480 };

    expect(isPointInRect({ x: 27, y: 350 }, { x: 0, y: 312, width: 28, height: 96 })).toBe(true);
    expect(isPointInActivationStrip({ x: 0, y: 350 }, 'left', expanded, workArea)).toBe(true);
    expect(isPointInActivationStrip({ x: 27, y: 350 }, 'left', expanded, workArea)).toBe(true);
    expect(isPointInActivationStrip({ x: 28, y: 350 }, 'left', expanded, workArea)).toBe(false);

    const rightExpanded = { ...expanded, x: 1680 };
    expect(isPointInActivationStrip({ x: 1892, y: 350 }, 'right', rightExpanded, workArea)).toBe(true);
    expect(isPointInActivationStrip({ x: 1919, y: 350 }, 'right', rightExpanded, workArea)).toBe(true);
    expect(isPointInActivationStrip({ x: 1891, y: 350 }, 'right', rightExpanded, workArea)).toBe(false);

    const topExpanded = { ...expanded, x: 600, y: 0 };
    expect(isPointInActivationStrip({ x: 700, y: 0 }, 'top', topExpanded, workArea)).toBe(true);
    expect(isPointInActivationStrip({ x: 700, y: 27 }, 'top', topExpanded, workArea)).toBe(true);
    expect(isPointInActivationStrip({ x: 700, y: 28 }, 'top', topExpanded, workArea)).toBe(false);
  });

  it('only treats the absolute desktop edge as hide intent', () => {
    expect(EDGE_AUTO_HIDE_DESKTOP_EDGE_HIT_PX).toBe(4);
    expect(isPointOnDesktopEdge({ x: 0, y: 400 }, 'left', workArea)).toBe(true);
    expect(isPointOnDesktopEdge({ x: 3, y: 400 }, 'left', workArea)).toBe(true);
    expect(isPointOnDesktopEdge({ x: 4, y: 400 }, 'left', workArea)).toBe(false);
    expect(isPointOnDesktopEdge({ x: 120, y: 400 }, 'left', workArea)).toBe(false);

    expect(isPointOnDesktopEdge({ x: 1919, y: 400 }, 'right', workArea)).toBe(true);
    expect(isPointOnDesktopEdge({ x: 1916, y: 400 }, 'right', workArea)).toBe(true);
    expect(isPointOnDesktopEdge({ x: 1915, y: 400 }, 'right', workArea)).toBe(false);

    expect(isPointOnDesktopEdge({ x: 900, y: 0 }, 'top', workArea)).toBe(true);
    expect(isPointOnDesktopEdge({ x: 900, y: 3 }, 'top', workArea)).toBe(true);
    expect(isPointOnDesktopEdge({ x: 900, y: 4 }, 'top', workArea)).toBe(false);
  });
});
