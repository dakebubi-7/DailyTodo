import { describe, expect, it } from 'vitest';
import {
  buildInvisibleGlassSettings,
  getDesktopGlassShellAttributes,
  getPerformanceFrostShellAttributes,
  shouldSyncInvisibleGlassSettings,
} from '../src/app/appShellEffects';

describe('invisible glass shell effects', () => {
  it('builds disabled settings when the invisible theme is inactive', () => {
    expect(buildInvisibleGlassSettings(false, 48, 22)).toEqual({
      enabled: false,
      opacity: 58,
      blurStrength: 0,
    });
  });

  it('builds enabled settings from the personalization sliders', () => {
    expect(buildInvisibleGlassSettings(true, 48, 22)).toEqual({
      enabled: true,
      opacity: 48,
      blurStrength: 22,
    });
  });

  it('syncs native host on first apply and when opacity/host blur changes, not every frost step', () => {
    const settings = buildInvisibleGlassSettings(true, 40, 18);
    expect(shouldSyncInvisibleGlassSettings(null, settings)).toBe(true);
    expect(shouldSyncInvisibleGlassSettings(settings, settings)).toBe(false);
    expect(shouldSyncInvisibleGlassSettings(settings, {
      ...settings,
      blurStrength: 42,
    })).toBe(false);
    expect(shouldSyncInvisibleGlassSettings(settings, {
      ...settings,
      opacity: 41,
    })).toBe(true);
    expect(shouldSyncInvisibleGlassSettings(settings, {
      ...settings,
      blurStrength: 0,
    })).toBe(true);
  });

  it('adds the shell data flag only while performance frost is active', () => {
    expect(getPerformanceFrostShellAttributes(true)).toEqual({
      'data-performance-frost': 'true',
    });
    expect(getPerformanceFrostShellAttributes(false)).toEqual({});
  });

  it('marks only desktop mode for the CSS glass fallback', () => {
    expect(getDesktopGlassShellAttributes('desktop')).toEqual({ 'data-window-mode': 'desktop' });
    expect(getDesktopGlassShellAttributes('normal')).toEqual({});
  });
});
