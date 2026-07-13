import { describe, expect, it } from 'vitest';
import {
  protectAiReviewSettingsSecrets,
  revealAiReviewSettingsSecrets,
  protectSecret,
  revealSecret,
  SECRET_PREFIX,
} from '../electron/aiReviewSecrets';
import { createDefaultAiReviewSettings } from '../shared/aiReview/aiReviewSettings';

const crypto = {
  isAvailable: () => true,
  encryptString: (plain: string) => Buffer.from(plain, 'utf8'),
  decryptString: (payload: Buffer) => payload.toString('utf8'),
};

describe('aiReviewSecrets', () => {
  it('round-trips secrets with safeStorage-like crypto', () => {
    const sealed = protectSecret('abc', crypto);
    expect(sealed.startsWith(SECRET_PREFIX)).toBe(true);
    expect(revealSecret(sealed, crypto)).toBe('abc');
  });

  it('protects nested profile keys', () => {
    const settings = createDefaultAiReviewSettings();
    settings.apiKey = 'root';
    settings.profiles = [{
      id: '1',
      name: 'A',
      provider: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'child',
      model: 'gpt',
      timeoutSeconds: 30,
      maxTokens: 100,
    }];
    const protectedSettings = protectAiReviewSettingsSecrets(settings, crypto);
    expect(protectedSettings.apiKey.startsWith(SECRET_PREFIX)).toBe(true);
    expect(protectedSettings.profiles[0]?.apiKey.startsWith(SECRET_PREFIX)).toBe(true);
    const revealed = revealAiReviewSettingsSecrets(protectedSettings, crypto);
    expect(revealed.apiKey).toBe('root');
    expect(revealed.profiles[0]?.apiKey).toBe('child');
  });
});
