import type { AiReviewSettings } from '../shared/aiReview/aiReviewSettings';
import { isObjectRecord } from './unknownValueGuards';

export const SECRET_PREFIX = 'enc:v1:';

export type SecretCrypto = {
  isAvailable(): boolean;
  encryptString(plain: string): Buffer;
  decryptString(payload: Buffer): string;
};

function getDefaultCrypto(): SecretCrypto {
  // Lazy-load Electron so unit tests can import pure helpers without the Electron runtime.
  const { safeStorage } = require('electron') as typeof import('electron');
  return {
    isAvailable: () => {
      try {
        return safeStorage.isEncryptionAvailable();
      } catch {
        return false;
      }
    },
    encryptString: (plain) => safeStorage.encryptString(plain),
    decryptString: (payload) => safeStorage.decryptString(payload),
  };
}

export function protectSecret(value: string, crypto: SecretCrypto = getDefaultCrypto()): string {
  if (!value || value.startsWith(SECRET_PREFIX)) return value;
  if (!crypto.isAvailable()) return value;
  return SECRET_PREFIX + crypto.encryptString(value).toString('base64');
}

export function revealSecret(value: string, crypto: SecretCrypto = getDefaultCrypto()): string {
  if (!value.startsWith(SECRET_PREFIX)) return value;
  if (!crypto.isAvailable()) return '';
  try {
    return crypto.decryptString(Buffer.from(value.slice(SECRET_PREFIX.length), 'base64'));
  } catch {
    return '';
  }
}

function protectProfileSecrets<T extends { apiKey?: string }>(profile: T, crypto: SecretCrypto): T {
  if (typeof profile.apiKey !== 'string' || !profile.apiKey) return profile;
  return { ...profile, apiKey: protectSecret(profile.apiKey, crypto) };
}

function revealProfileSecrets<T extends { apiKey?: string }>(profile: T, crypto: SecretCrypto): T {
  if (typeof profile.apiKey !== 'string' || !profile.apiKey) return profile;
  return { ...profile, apiKey: revealSecret(profile.apiKey, crypto) };
}

export function protectAiReviewSettingsSecrets(
  settings: AiReviewSettings,
  crypto: SecretCrypto = getDefaultCrypto(),
): AiReviewSettings {
  return {
    ...settings,
    apiKey: protectSecret(settings.apiKey || '', crypto),
    profiles: Array.isArray(settings.profiles)
      ? settings.profiles.map((profile) => protectProfileSecrets(profile, crypto))
      : settings.profiles,
  };
}

export function revealAiReviewSettingsSecrets(
  settings: AiReviewSettings,
  crypto: SecretCrypto = getDefaultCrypto(),
): AiReviewSettings {
  return {
    ...settings,
    apiKey: revealSecret(settings.apiKey || '', crypto),
    profiles: Array.isArray(settings.profiles)
      ? settings.profiles.map((profile) => revealProfileSecrets(profile, crypto))
      : settings.profiles,
  };
}

export function isEncryptedSecret(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith(SECRET_PREFIX);
}

export function storedSettingsLookProtected(value: unknown): boolean {
  if (!isObjectRecord(value)) return false;
  if (isEncryptedSecret(value.apiKey)) return true;
  const profiles = value.profiles;
  if (!Array.isArray(profiles)) return false;
  return profiles.some((profile) => isObjectRecord(profile) && isEncryptedSecret(profile.apiKey));
}
