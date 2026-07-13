import { describe, expect, it } from 'vitest';
import {
  protectAiReviewSettingsSecrets,
  revealAiReviewSettingsSecrets,
  protectSecret,
  revealSecret,
  SECRET_PREFIX,
  MASKED_API_KEY_PLACEHOLDER,
  maskAiReviewSettingsSecretsForRenderer,
  mergeAiReviewSettingsSecretsFromRenderer,
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

  it('masks secrets for renderer and restores placeholders on merge', () => {
    const settings = createDefaultAiReviewSettings();
    settings.apiKey = 'root-secret';
    settings.profiles = [{
      id: '1',
      name: 'A',
      provider: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'child-secret',
      model: 'gpt',
      timeoutSeconds: 30,
      maxTokens: 100,
    }];

    const masked = maskAiReviewSettingsSecretsForRenderer(settings);
    expect(masked.apiKey).toBe(MASKED_API_KEY_PLACEHOLDER);
    expect(masked.profiles[0]?.apiKey).toBe(MASKED_API_KEY_PLACEHOLDER);

    const merged = mergeAiReviewSettingsSecretsFromRenderer({
      ...masked,
      model: 'gpt-updated',
      profiles: [{ ...masked.profiles[0]!, model: 'child-updated' }],
    }, settings);
    expect(merged.apiKey).toBe('root-secret');
    expect(merged.profiles[0]?.apiKey).toBe('child-secret');
    expect(merged.model).toBe('gpt-updated');
    expect(merged.profiles[0]?.model).toBe('child-updated');

    const cleared = mergeAiReviewSettingsSecretsFromRenderer({
      ...masked,
      apiKey: '',
      profiles: [{ ...masked.profiles[0]!, apiKey: '' }],
    }, settings);
    expect(cleared.apiKey).toBe('');
    expect(cleared.profiles[0]?.apiKey).toBe('');
  });
});
