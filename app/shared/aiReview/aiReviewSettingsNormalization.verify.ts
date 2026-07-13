import { strict as assert } from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createDefaultAiReviewSettings, normalizeAiReviewSettings } from './aiReviewSettings';

const modulePath = join(import.meta.dirname, 'aiReviewSettingsNormalization.ts');
assert.equal(existsSync(modulePath), true, 'AI review settings normalization should have a focused module');

const normalized = normalizeAiReviewSettings({
  timerTime: '99:99',
  weeklyTimerWeekday: 7,
  monthlyTimerDay: 0,
  profiles: 'invalid',
  apiKey: 'legacy-key',
});
const defaults = createDefaultAiReviewSettings();
assert.equal(normalized.timerTime, defaults.timerTime, 'invalid timer time should use the default');
assert.equal(normalized.weeklyTimerWeekday, defaults.weeklyTimerWeekday, 'invalid weekdays should use the default');
assert.equal(normalized.monthlyTimerDay, defaults.monthlyTimerDay, 'invalid month days should use the default');
assert.equal(normalized.profiles[0]?.apiKey, 'legacy-key', 'legacy credentials should survive malformed profile migration');

const settingsSource = readFileSync(join(import.meta.dirname, 'aiReviewSettings.ts'), 'utf8');
assert.match(
  settingsSource,
  /from '\.\/aiReviewSettingsNormalization'/,
  'settings API should delegate raw-value normalization to the focused module',
);

console.log('AI review settings normalization verification passed');
