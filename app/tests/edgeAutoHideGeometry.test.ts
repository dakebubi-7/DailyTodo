import { describe, expect, it } from 'vitest';
import {
  EDGE_AUTO_HIDE_REVEAL_PX,
  EDGE_AUTO_HIDE_SIDE_PUSH_IN_PX,
  EDGE_AUTO_HIDE_SIDE_STRIP_LENGTH_PX,
  EDGE_AUTO_HIDE_TOP_SNAP_PX,
  getActivationStripBounds,
  getEdgeAttachment,
  getExpandedBounds,
  getRetractedBounds,
  isPointInActivationStrip,
  isPointInRect,
} from '../electron/edgeAutoHideGeometry';

describe('edge auto-hide geometry', () => {
  const workArea = { x: 0, y: 0, width: 1920, height: 1040 };

  it('does not hide on a flush or nearby side placement', () => {
    expect(EDGE_AUTO_HIDE_SIDE_PUSH_IN_PX).toBe(24);
    // Flush left/right stays free.
    expect(getEdgeAttachment({ x: 0, y: 400, width: 240, height: 480 }, workArea)).toBeNull();
    expect(getEdgeAttachment({ x: 1680, y: 400, width: 240, height: 480 }, workArea)).toBeNull();
    // Nearby but not past the edge stays free.
    expect(getEdgeAttachment({ x: 12, y: 400, width: 240, height: 480 }, workArea)).toBeNull();
    expect(getEdgeAttachment({ x: 40, y: 400, width: 240, height: 480 }, workArea)).toBeNull();
    expect(getEdgeAttachment({ x: 1600, y: 400, width: 240, height: 480 }, workArea)).toBeNull();
  });

  it('hides sides only after the window is dragged past the edge', () => {
    expect(getEdgeAttachment({ x: -24, y: 400, width: 240, height: 480 }, workArea)).toBe('left');
    expect(getEdgeAttachment({ x: -23, y: 400, width: 240, height: 480 }, workArea)).toBeNull();
    expect(getEdgeAttachment({ x: 1704, y: 400, width: 240, height: 480 }, workArea)).toBe('right');
    expect(getEdgeAttachment({ x: 1703, y: 400, width: 240, height: 480 }, workArea)).toBeNull();
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
    expect(EDGE_AUTO_HIDE_REVEAL_PX).toBe(8);
  });

  it('uses a short centered side activation strip', () => {
    const bounds = { x: 0, y: 120, width: 240, height: 480 };
    expect(EDGE_AUTO_HIDE_SIDE_STRIP_LENGTH_PX).toBe(96);
    expect(getActivationStripBounds('left', bounds, workArea)).toEqual({
      x: 0,
      y: 312,
      width: 8,
      height: 96,
    });
    expect(getActivationStripBounds('right', { ...bounds, x: 1680 }, workArea)).toEqual({
      x: 1912,
      y: 312,
      width: 8,
      height: 96,
    });
    expect(isPointInActivationStrip({ x: 4, y: 350 }, 'left', bounds, workArea)).toBe(true);
    expect(isPointInActivationStrip({ x: 4, y: 150 }, 'left', bounds, workArea)).toBe(false);
  });

  it('uses a short centered top activation strip', () => {
    const bounds = { x: 600, y: 0, width: 240, height: 480 };
    expect(getActivationStripBounds('top', bounds, workArea)).toEqual({
      x: 672,
      y: 0,
      width: 96,
      height: 8,
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

  it('accepts pointer positions in the visible activation strip only', () => {
    const expanded = { x: 0, y: 120, width: 240, height: 480 };

    expect(isPointInRect({ x: 4, y: 350 }, { x: 0, y: 312, width: 8, height: 96 })).toBe(true);
    expect(isPointInActivationStrip({ x: 4, y: 350 }, 'left', expanded, workArea)).toBe(true);
    expect(isPointInActivationStrip({ x: 9, y: 350 }, 'left', expanded, workArea)).toBe(false);
    expect(isPointInActivationStrip({ x: 4, y: 150 }, 'left', expanded, workArea)).toBe(false);
  });
});
