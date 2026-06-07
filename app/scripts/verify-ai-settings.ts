import { strict as assert } from 'node:assert';
import {
  AI_REVIEW_SETTINGS_KEY,
  createDefaultAiReviewSettings,
  normalizeAiReviewSettings,
} from '../shared/aiReview/aiReviewSettings';

assert.equal(AI_REVIEW_SETTINGS_KEY, 'aiReviewSettings');

const def = createDefaultAiReviewSettings();
assert.equal(def.enabled, false, 'AI off by default (no key yet)');
assert.equal(def.baseUrl, 'https://api.openai.com/v1');
assert.equal(def.backfillDays, 7);
assert.equal(def.timerEnabled, false);
assert.equal(def.timerTime, '23:00');

// normalize 容错
const norm = normalizeAiReviewSettings({ enabled: 'yes', backfillDays: -5, timerTime: '99:99', model: '' });
assert.equal(norm.enabled, false, 'non-boolean → default');
assert.equal(norm.backfillDays, 7, 'invalid number → default');
assert.equal(norm.timerTime, '23:00', 'invalid time → default');
assert.ok(norm.model.length > 0, 'empty model → default');

// 合法值保留
const ok = normalizeAiReviewSettings({ enabled: true, apiKey: 'sk-x', backfillDays: 14, timerTime: '07:30' });
assert.equal(ok.enabled, true);
assert.equal(ok.apiKey, 'sk-x');
assert.equal(ok.backfillDays, 14);
assert.equal(ok.timerTime, '07:30');

console.log('AI settings verification passed');
