import { describe, expect, it } from 'vitest';
import * as appShellEffects from '../src/app/appShellEffects';
import { afterEach, vi } from 'vitest';
import {
  buildInvisibleGlassSettings,
  getDesktopGlassShellAttributes,
  getPerformanceFrostShellAttributes,
  shouldSyncInvisibleGlassSettings,
  syncAlwaysOnTopPreference,
} from '../src/app/appShellEffects';

const originalWindowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');

afterEach(() => {
  if (originalWindowDescriptor) {
    Object.defineProperty(globalThis, 'window', originalWindowDescriptor);
    return;
  }
  Reflect.deleteProperty(globalThis, 'window');
});

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

  it('does not overwrite a persisted desktop window mode when the legacy always-on-top preference is absent', () => {
    const setWindowMode = vi.fn(() => Promise.resolve('normal'));
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { electronAPI: { setWindowMode } },
    });

    syncAlwaysOnTopPreference(undefined);

    expect(setWindowMode).not.toHaveBeenCalled();
  });

  it('adds a CSS shell fallback only when visible invisible-theme blur lacks native glass', () => {
    const getFallbackAttributes = Reflect.get(
      appShellEffects,
      'getInvisibleGlassFallbackShellAttributes',
    ) as ((isInvisibleTheme: boolean, blurStrength: number, nativeGlassApplied: boolean) => Record<string, string>) | undefined;

    expect(getFallbackAttributes).toBeTypeOf('function');
    expect(getFallbackAttributes?.(true, 24, true)).toEqual({});
    expect(getFallbackAttributes?.(true, 24, false)).toEqual({
      'data-glass-fallback': 'css',
    });
    expect(getFallbackAttributes?.(true, 0, false)).toEqual({});
    expect(getFallbackAttributes?.(false, 24, false)).toEqual({});
  });
});
