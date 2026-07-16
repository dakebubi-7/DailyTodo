import { isObjectRecord } from './unknownValueGuards';

export type InvisibleGlassSettings = {
  enabled: boolean;
  opacity: number;
  blurStrength: number;
};

export const DEFAULT_INVISIBLE_GLASS_OPACITY = 58;
export const DEFAULT_INVISIBLE_GLASS_BLUR_STRENGTH = 14;

/**
 * Native Win32 BlurBehind has no continuous radius API.
 * Host BlurBehind is off at blur 0 (true clear / no blur) and on above 0.
 * Continuous 1-100 densify (frost -> solid) comes from CSS frost layers.
 */
export type NativeBlurTier = 'off' | 'on';

/**
 * Non-invisible themes may still use a light CSS blur.
 * Invisible theme keeps CSS blur at 0 so Win10 BlurBehind + drag stay smooth.
 */
export const CSS_ASSIST_BLUR_MAX_PX = 18;

const ACCENT_DISABLED = 0;
const ACCENT_ENABLE_BLURBEHIND = 3;
const LIGHT_ACRYLIC_TINT = 0x00ECECF0;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clampInvisibleGlassOpacity(value: unknown, fallback = DEFAULT_INVISIBLE_GLASS_OPACITY): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? clamp(Math.round(value), 0, 100)
    : fallback;
}

export function clampInvisibleGlassBlurStrength(value: unknown, fallback = DEFAULT_INVISIBLE_GLASS_BLUR_STRENGTH): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? clamp(Math.round(value), 0, 100)
    : fallback;
}

/**
 * Host BlurBehind is off only at blur 0 so the slider has a true "no blur" end.
 * Values above 0 keep acrylic on; continuous densify is CSS frost -> solid.
 */
export function resolveNativeBlurTier(blurStrength: number): NativeBlurTier {
  return clampInvisibleGlassBlurStrength(blurStrength) <= 0 ? 'off' : 'on';
}

/**
 * Map the 0-100 blur slider to a continuous CSS backdrop-filter radius for non-invisible themes.
 * Invisible theme forces 0px and uses frost layers instead so window drag stays fluid on Win10.
 */
export function resolveCssAssistBlurPx(blurStrength: number): number {
  const blur = clampInvisibleGlassBlurStrength(blurStrength);
  if (blur <= 0) return 0;
  return (blur / 100) * CSS_ASSIST_BLUR_MAX_PX;
}

/**
 * Continuous frost amount for the blur slider (0-1).
 * 0 = clear/no frost, 100 = fully solid.
 */
export function resolveInvisibleFrostMix(blurStrength: number): number {
  return clampInvisibleGlassBlurStrength(blurStrength) / 100;
}

/**
 * Shell fill alpha: starts from glass opacity and densifies to solid at blur 100.
 * Progression: clear glass -> frosted -> heavier frost -> solid plate.
 */
export function resolveInvisibleSurfaceAlpha(opacityPercent: number, blurStrength: number = 0): number {
  const opacity = clampInvisibleGlassOpacity(opacityPercent) / 100;
  const frost = resolveInvisibleFrostMix(blurStrength);
  // Keep a tiny floor so the window never fully vanishes; solid at 100.
  return Math.min(1, Math.max(0.03, opacity + frost * (1 - opacity)));
}

/**
 * Frost veil alpha over acrylic.
 * Low blur: light milkiness. Mid blur: heavier frost. High blur: densifies into solid with the shell.
 */
export function resolveInvisibleVeilAlpha(blurStrength: number): number {
  const frost = resolveInvisibleFrostMix(blurStrength);
  if (frost <= 0) return 0;
  // Front-loaded frost so early slider motion already reads as "getting blurry",
  // then densifies harder toward solid near the end.
  return Math.min(1, frost ** 0.85);
}

export function createDisabledInvisibleGlassSettings(): InvisibleGlassSettings {
  return {
    enabled: false,
    opacity: DEFAULT_INVISIBLE_GLASS_OPACITY,
    blurStrength: 0,
  };
}

export function createInvisibleGlassSettings(
  partial: Partial<InvisibleGlassSettings> | boolean | null | undefined,
): InvisibleGlassSettings {
  if (partial === true) {
    return {
      enabled: true,
      opacity: DEFAULT_INVISIBLE_GLASS_OPACITY,
      blurStrength: DEFAULT_INVISIBLE_GLASS_BLUR_STRENGTH,
    };
  }

  if (partial === false || partial == null) {
    return createDisabledInvisibleGlassSettings();
  }

  return {
    enabled: partial.enabled === true,
    opacity: clampInvisibleGlassOpacity(partial.opacity),
    blurStrength: clampInvisibleGlassBlurStrength(partial.blurStrength),
  };
}

export function normalizeInvisibleGlassPayload(payload: unknown): InvisibleGlassSettings {
  if (payload === true || payload === false || payload == null) {
    return createInvisibleGlassSettings(payload);
  }

  if (!isObjectRecord(payload)) {
    return createDisabledInvisibleGlassSettings();
  }

  // Backward-compatible boolean payloads and full glass option objects both normalize here.
  if (typeof payload.enabled !== 'boolean' && typeof payload.opacity !== 'number' && typeof payload.blurStrength !== 'number') {
    return createDisabledInvisibleGlassSettings();
  }

  return createInvisibleGlassSettings({
    enabled: payload.enabled === true || (payload.enabled !== false && (typeof payload.opacity === 'number' || typeof payload.blurStrength === 'number')),
    opacity: typeof payload.opacity === 'number' ? payload.opacity : undefined,
    blurStrength: typeof payload.blurStrength === 'number' ? payload.blurStrength : undefined,
  });
}

export function createAcrylicGradientColor(opacityPercent: number): number {
  const opacity = clampInvisibleGlassOpacity(opacityPercent);
  // Continuous opacity remains independent of blur; keep native tint restrained so frost layers can show wallpaper.
  const alpha = Math.round((opacity / 100) * 0.36 * 255);
  return (((opacity > 0 ? Math.max(6, alpha) : 0) & 0xff) << 24) | LIGHT_ACRYLIC_TINT;
}

export function resolveWin32AccentState(enabled: boolean, blurStrength: number = 0): number {
  if (!enabled) return ACCENT_DISABLED;
  // True clear at blur 0: no native material. Continuous densify only after host blur is on.
  return resolveNativeBlurTier(blurStrength) === 'off' ? ACCENT_DISABLED : ACCENT_ENABLE_BLURBEHIND;
}

export function createWin32AccentPolicyFromGlass(settings: InvisibleGlassSettings) {
  return {
    AccentState: resolveWin32AccentState(settings.enabled, settings.blurStrength),
    AccentFlags: 0,
    GradientColor: 0,
    AnimationId: 0,
  };
}

/** Host-only signature: re-apply native acrylic only when theme/opacity/blur0-cross changes. */
export function getNativeGlassHostSignature(settings: InvisibleGlassSettings) {
  return {
    enabled: settings.enabled,
    opacity: settings.opacity,
    blurOn: settings.enabled && resolveNativeBlurTier(settings.blurStrength) === 'on',
  };
}

export function areNativeGlassHostSignaturesEqual(
  left: ReturnType<typeof getNativeGlassHostSignature>,
  right: ReturnType<typeof getNativeGlassHostSignature>,
): boolean {
  return left.enabled === right.enabled
    && left.opacity === right.opacity
    && left.blurOn === right.blurOn;
}

export function areInvisibleGlassSettingsEqual(
  left: InvisibleGlassSettings,
  right: InvisibleGlassSettings,
): boolean {
  return left.enabled === right.enabled
    && left.opacity === right.opacity
    && left.blurStrength === right.blurStrength;
}
