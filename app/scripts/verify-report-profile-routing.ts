import { strict as assert } from 'node:assert';
import {
  createDefaultAiReviewSettings,
  normalizeAiReviewSettings,
  resolveProfileForReportKind,
  type AiProfile,
  type AiReviewSettings,
} from '../shared/aiReview/aiReviewSettings';

function profile(id: string, apiKey: string, name = id): AiProfile {
  return {
    id,
    name,
    provider: 'openai',
    baseUrl: `https://${id}.example.com/v1`,
    apiKey,
    model: `${id}-model`,
    timeoutSeconds: 90,
    maxTokens: 8192,
    note: '',
  };
}

function settings(overrides: Partial<AiReviewSettings> = {}): AiReviewSettings {
  const active = profile('p-active', 'active-secret', 'Active');
  const daily = profile('p-daily', 'daily-secret', 'Daily');
  const weekly = profile('p-weekly', 'weekly-secret', 'Weekly');
  const monthly = profile('p-monthly', 'monthly-secret', 'Monthly');
  return normalizeAiReviewSettings({
    ...createDefaultAiReviewSettings(),
    enabled: true,
    profiles: [active, daily, weekly, monthly],
    activeProfileId: active.id,
    ...overrides,
  });
}

function assertNoSecrets(value: unknown) {
  const serialized = JSON.stringify(value);
  for (const secret of ['active-secret', 'daily-secret', 'weekly-secret', 'monthly-secret', 'missing-secret']) {
    assert.ok(!serialized.includes(secret), `serialized routing metadata must not include ${secret}`);
  }
}

const def = createDefaultAiReviewSettings();
assert.equal(def.dailyReviewProfileId, '', 'daily route follows current account by default');
assert.equal(def.weeklyReportProfileId, '', 'weekly route follows current account by default');
assert.equal(def.monthlyReportProfileId, '', 'monthly route follows current account by default');

const normalized = normalizeAiReviewSettings({
  profiles: [profile('p-active', 'active-secret'), profile('p-daily', 'daily-secret')],
  activeProfileId: 'p-active',
  dailyReviewProfileId: 'p-daily',
  weeklyReportProfileId: '',
  monthlyReportProfileId: 'deleted-profile',
});
assert.equal(normalized.dailyReviewProfileId, 'p-daily', 'normalize preserves valid daily route id');
assert.equal(normalized.weeklyReportProfileId, '', 'normalize preserves empty weekly route id');
assert.equal(normalized.monthlyReportProfileId, 'deleted-profile', 'normalize preserves missing monthly route id for runtime fallback');
assert.equal(normalizeAiReviewSettings({ dailyReviewProfileId: 123 }).dailyReviewProfileId, '', 'normalize clears non-string route id');

const dailyResolution = resolveProfileForReportKind(settings({ dailyReviewProfileId: 'p-daily' }), 'daily');
assert.equal(dailyResolution.profile.id, 'p-daily', 'daily uses configured profile');
assert.equal(dailyResolution.source, 'specific');
assert.equal(dailyResolution.requestedProfileId, 'p-daily');
assertNoSecrets({ ...dailyResolution, profile: { ...dailyResolution.profile, apiKey: undefined } });

const weeklyResolution = resolveProfileForReportKind(settings({ weeklyReportProfileId: '' }), 'weekly');
assert.equal(weeklyResolution.profile.id, 'p-active', 'empty weekly route uses active profile');
assert.equal(weeklyResolution.source, 'default');
assert.equal(weeklyResolution.requestedProfileId, undefined);

const missingMonthlyResolution = resolveProfileForReportKind(settings({ monthlyReportProfileId: 'deleted-profile' }), 'monthly');
assert.equal(missingMonthlyResolution.profile.id, 'p-active', 'missing monthly route falls back to active profile with key');
assert.equal(missingMonthlyResolution.source, 'fallbackDefault');
assert.equal(missingMonthlyResolution.requestedProfileId, 'deleted-profile');
assert.ok(missingMonthlyResolution.warning, 'missing route produces warning');
assertNoSecrets(missingMonthlyResolution.warning);

const missingKeyResolution = resolveProfileForReportKind(
  settings({
    profiles: [profile('p-active', 'active-secret'), profile('p-daily', '')],
    activeProfileId: 'p-active',
    dailyReviewProfileId: 'p-daily',
  }),
  'daily',
);
assert.equal(missingKeyResolution.profile.id, 'p-active', 'specific profile without key falls back to active profile with key');
assert.equal(missingKeyResolution.source, 'fallbackDefault');
assert.ok(missingKeyResolution.warning, 'profile without key produces warning');
assertNoSecrets(missingKeyResolution.warning);

const unavailableResolution = resolveProfileForReportKind(
  settings({
    profiles: [profile('p-active', ''), profile('p-monthly', '')],
    activeProfileId: 'p-active',
    monthlyReportProfileId: 'p-monthly',
  }),
  'monthly',
);
assert.equal(unavailableResolution.source, 'missing', 'missing source when specific and active profiles have no key');
assert.equal(unavailableResolution.profile.id, 'p-monthly', 'missing keyed specific profile remains visible to availability helper');
assert.equal(unavailableResolution.requestedProfileId, 'p-monthly');
assertNoSecrets({ warning: unavailableResolution.warning, requestedProfileId: unavailableResolution.requestedProfileId, source: unavailableResolution.source });

const missingNoDefaultResolution = resolveProfileForReportKind(
  settings({
    profiles: [profile('p-active', '')],
    activeProfileId: 'p-active',
    monthlyReportProfileId: 'gone',
  }),
  'monthly',
);
assert.equal(missingNoDefaultResolution.source, 'missing', 'missing source when requested profile and default key are unavailable');
assert.equal(missingNoDefaultResolution.profile.id, 'p-active');
assertNoSecrets(missingNoDefaultResolution.warning);

console.log('Report profile routing verification passed');
