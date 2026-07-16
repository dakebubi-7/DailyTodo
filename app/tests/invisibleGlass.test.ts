import { describe, expect, it } from 'vitest';
import {
  createAcrylicGradientColor,
  createInvisibleGlassSettings,
  createWin32AccentPolicyFromGlass,
  normalizeInvisibleGlassPayload,
  resolveCssAssistBlurPx,
  resolveInvisibleFrostMix,
  resolveInvisibleSurfaceAlpha,
  resolveInvisibleVeilAlpha,
  resolveNativeBlurTier,
  resolveWin32AccentState,
} from '../shared/invisibleGlass';

describe('invisible glass settings', () => {
  it('normalizes boolean payloads for backward compatibility', () => {
    expect(normalizeInvisibleGlassPayload(true)).toEqual({
      enabled: true,
      opacity: 58,
      blurStrength: 14,
    });
    expect(normalizeInvisibleGlassPayload(false).enabled).toBe(false);
  });

  it('clamps opacity and blur from the settings payload', () => {
    expect(createInvisibleGlassSettings({
      enabled: true,
      opacity: 140,
      blurStrength: -4,
    })).toEqual({
      enabled: true,
      opacity: 100,
      blurStrength: 0,
    });
  });

  it('keeps true clear at blur 0 and continuous frost densify above 0', () => {
    // Native BlurBehind is off only at 0 (true no-blur). Continuous densify is CSS frost -> solid.
    expect(resolveNativeBlurTier(0)).toBe('off');
    expect(resolveNativeBlurTier(1)).toBe('on');
    expect(resolveNativeBlurTier(50)).toBe('on');
    expect(resolveNativeBlurTier(100)).toBe('on');

    expect(resolveWin32AccentState(true, 0)).toBe(0);
    expect(resolveWin32AccentState(true, 24)).toBe(3);
    expect(resolveWin32AccentState(true, 80)).toBe(3);
    expect(resolveWin32AccentState(false, 80)).toBe(0);

    expect(resolveCssAssistBlurPx(0)).toBe(0);
    expect(resolveCssAssistBlurPx(50)).toBe(9);
    expect(resolveCssAssistBlurPx(100)).toBe(18);

    expect(resolveInvisibleFrostMix(0)).toBe(0);
    expect(resolveInvisibleFrostMix(1)).toBeCloseTo(0.01, 5);
    expect(resolveInvisibleFrostMix(25)).toBeCloseTo(0.25, 5);
    expect(resolveInvisibleFrostMix(50)).toBeCloseTo(0.5, 5);
    expect(resolveInvisibleFrostMix(100)).toBe(1);

    // clear -> denser plate -> solid at 100
    expect(resolveInvisibleSurfaceAlpha(58, 0)).toBeCloseTo(0.58, 5);
    expect(resolveInvisibleSurfaceAlpha(58, 50)).toBeGreaterThan(resolveInvisibleSurfaceAlpha(58, 0));
    expect(resolveInvisibleSurfaceAlpha(58, 100)).toBeCloseTo(1, 5);
    expect(resolveInvisibleVeilAlpha(0)).toBe(0);
    expect(resolveInvisibleVeilAlpha(1)).toBeGreaterThan(0);
    expect(resolveInvisibleVeilAlpha(25)).toBeGreaterThan(resolveInvisibleVeilAlpha(1));
    expect(resolveInvisibleVeilAlpha(50)).toBeGreaterThan(resolveInvisibleVeilAlpha(25));
    expect(resolveInvisibleVeilAlpha(100)).toBe(1);

    const soft = createWin32AccentPolicyFromGlass({
      enabled: true,
      opacity: 40,
      blurStrength: 24,
    });
    expect(soft.AccentState).toBe(3);
    expect(soft.AccentFlags).toBe(0);
    expect(soft.GradientColor).toBe(0);

    const zeroBlur = createWin32AccentPolicyFromGlass({
      enabled: true,
      opacity: 40,
      blurStrength: 0,
    });
    expect(zeroBlur.AccentState).toBe(0);
    expect(zeroBlur.GradientColor).toBe(0);

    const disabled = createWin32AccentPolicyFromGlass({
      enabled: false,
      opacity: 40,
      blurStrength: 80,
    });
    expect(disabled.AccentState).toBe(0);
    expect(disabled.GradientColor).toBe(0);
  });
});
