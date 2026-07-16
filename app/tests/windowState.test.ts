import { describe, expect, it } from 'vitest';
import {
  DEFAULT_WINDOW_HEIGHT,
  DEFAULT_WINDOW_WIDTH,
  normalizeRestoredWindowState,
} from '../electron/windowState';

describe('normalizeRestoredWindowState', () => {
  it('returns undefined for non-object payloads', () => {
    expect(normalizeRestoredWindowState(null)).toBeUndefined();
    expect(normalizeRestoredWindowState('nope')).toBeUndefined();
    expect(normalizeRestoredWindowState(42)).toBeUndefined();
  });

  it('keeps only finite numeric bounds fields', () => {
    expect(
      normalizeRestoredWindowState({
        x: 12,
        y: '18',
        width: 260,
        height: Number.NaN,
        extra: true,
      }),
    ).toEqual({ x: 12, width: 260 });
  });

  it('returns undefined when no finite bounds exist', () => {
    expect(
      normalizeRestoredWindowState({
        x: 'left',
        width: true,
        height: null,
      }),
    ).toBeUndefined();
  });

  it('collapses settings-sized widths back to the widget default', () => {
    expect(
      normalizeRestoredWindowState({
        x: 40,
        y: 80,
        width: 800,
        height: 640,
      }),
    ).toEqual({
      x: 40,
      y: 80,
      width: DEFAULT_WINDOW_WIDTH,
      height: 640,
    });
  });

  it('fills missing height when collapsing settings-sized widths', () => {
    expect(
      normalizeRestoredWindowState({
        width: 812,
      }),
    ).toEqual({
      width: DEFAULT_WINDOW_WIDTH,
      height: DEFAULT_WINDOW_HEIGHT,
    });
  });
});
