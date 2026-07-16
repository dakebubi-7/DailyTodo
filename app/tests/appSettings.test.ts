import { describe, expect, it } from 'vitest';
import { createDefaultAppSettings, normalizeAppSettings } from '../shared/appSettings';

describe('app behavior settings', () => {
  it('enables edge auto-hide by default and only accepts boolean overrides', () => {
    expect(createDefaultAppSettings().edgeAutoHide).toBe(true);
    expect(normalizeAppSettings({ edgeAutoHide: false }).edgeAutoHide).toBe(false);
    expect(normalizeAppSettings({ edgeAutoHide: 'false' }).edgeAutoHide).toBe(true);
  });
});
