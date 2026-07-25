import { describe, expect, it } from 'vitest';
import { createDefaultAppSettings, normalizeAppSettings } from '../shared/appSettings';

describe('app behavior settings', () => {
  it('enables edge auto-hide by default and only accepts boolean overrides', () => {
    expect(createDefaultAppSettings().edgeAutoHide).toBe(true);
    expect(normalizeAppSettings({ edgeAutoHide: false }).edgeAutoHide).toBe(false);
    expect(normalizeAppSettings({ edgeAutoHide: 'false' }).edgeAutoHide).toBe(true);
  });

  it('defaults input shortcuts to standard and migrates the legacy mode once', () => {
    expect(createDefaultAppSettings().inputKeybindings).toEqual({ preset: 'standard', overrides: {} });
    expect(normalizeAppSettings({ inputKeyboardMode: 'obsidian' }).inputKeybindings).toEqual({
      preset: 'obsidian',
      overrides: {},
    });
    expect(normalizeAppSettings({ inputKeyboardMode: 'standard' }).inputKeybindings).toEqual({
      preset: 'standard',
      overrides: {},
    });
    expect(normalizeAppSettings({ inputKeyboardMode: 'vim' }).inputKeybindings).toEqual({
      preset: 'standard',
      overrides: {},
    });
  });

  it('keeps only valid sparse input shortcut overrides', () => {
    const settings = normalizeAppSettings({
      inputKeybindings: {
        preset: 'standard',
        overrides: {
          bold: { key: 'k', modKey: true },
          italic: { key: 'w', modKey: true },
          'continue-list': { key: 'l', modKey: true },
          unknown: { key: 'p', modKey: true },
        },
      },
    });

    expect(settings.inputKeybindings).toEqual({
      preset: 'standard',
      overrides: {
        bold: { key: 'k', modKey: true },
      },
    });
    expect(settings).not.toHaveProperty('inputKeyboardMode');
  });
});
