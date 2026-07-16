import { describe, expect, it } from 'vitest';
import { applyInvisibleGlassCssPreview } from '../src/app/invisibleGlassPreview';
import { createAppViewportStyle } from '../src/app/appViewportStyle';
import type { PersonalizationSettings } from '../src/types/personalization';
import {
  resolveInvisibleFrostMix,
  resolveInvisibleSurfaceAlpha,
  resolveInvisibleVeilAlpha,
} from '../shared/invisibleGlass';

function createStyleRoot() {
  const store = new Map<string, string>();
  const attrs = new Map<string, string>();
  return {
    style: {
      setProperty(name: string, value: string) {
        store.set(name, value);
      },
      getPropertyValue(name: string) {
        return store.get(name) ?? '';
      },
    },
    setAttribute(name: string, value: string) {
      attrs.set(name, value);
    },
    getAttribute(name: string) {
      return attrs.has(name) ? attrs.get(name)! : null;
    },
  } as unknown as HTMLElement;
}

const baseSettings = {
  windowOpacity: 58,
  panelOpacity: 58,
  blurStrength: 50,
  radius: 18,
  accentColor: '#111111',
  secondaryColor: '#222222',
  layoutDensity: 'comfortable',
  texture: true,
  animations: true,
  themeId: 'invisible',
  topOpacity: 58,
  cardOpacity: 58,
  controlOpacity: 58,
  menuOpacity: 58,
  inputOpacity: 58,
  dialogOpacity: 58,
  settingsPanelOpacity: 58,
  alwaysOnTop: false,
  fontScale: 100,
} as PersonalizationSettings;

describe('invisible glass css preview', () => {
  it('writes continuous frost layers without live CSS backdrop blur', () => {
    const root = createStyleRoot();
    applyInvisibleGlassCssPreview({ blurStrength: 50, baseOpacity: 58 }, root);
    expect(root.style.getPropertyValue('--blur-strength')).toBe('0px');
    expect(root.style.getPropertyValue('--invisible-frost-mix')).toBe(String(resolveInvisibleFrostMix(50)));
    expect(root.style.getPropertyValue('--invisible-surface-alpha')).toBe(String(resolveInvisibleSurfaceAlpha(58, 50)));
    expect(root.style.getPropertyValue('--invisible-veil-alpha')).toBe(String(resolveInvisibleVeilAlpha(50)));
  });

  it('writes continuous opacity CSS vars for invisible glass drag preview', () => {
    const root = createStyleRoot();
    applyInvisibleGlassCssPreview({ windowOpacity: 40, blurStrength: 20 }, root);
    expect(root.style.getPropertyValue('--window-opacity')).toBe('0.4');
    expect(root.style.getPropertyValue('--settings-panel-opacity')).toBe('0.4');
    expect(root.style.getPropertyValue('--invisible-surface-alpha')).toBe(String(resolveInvisibleSurfaceAlpha(40, 20)));
  });

  it('keeps invisible theme CSS blur at zero so window drag stays fluid', () => {
    const style = createAppViewportStyle(baseSettings, true);
    expect(style['--blur-strength']).toBe('0px');
    expect(style['--invisible-frost-mix']).toBe(resolveInvisibleFrostMix(50));
    expect(style['--invisible-surface-alpha']).toBe(resolveInvisibleSurfaceAlpha(58, 50));
    expect(style['--invisible-veil-alpha']).toBe(resolveInvisibleVeilAlpha(50));
  });

  it('uses strict square radius variables when the personalization radius is zero', () => {
    const style = createAppViewportStyle({ ...baseSettings, radius: 0 }, false);

    expect(style['--shell-radius']).toBe('0px');
    expect(style['--card-radius']).toBe('0px');
    expect(style['--control-radius']).toBe('0px');
  });
});
