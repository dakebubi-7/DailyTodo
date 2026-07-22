import { describe, expect, it } from 'vitest';
import { normalizeLoadedPersonalization } from '../src/app/personalizationLoadSettings';

describe('personalization load settings', () => {
  it('preserves an explicit invisible-theme zero blur setting', () => {
    expect(normalizeLoadedPersonalization({
      themeId: 'invisible',
      blurStrength: 0,
    })?.blurStrength).toBe(0);
  });
});
