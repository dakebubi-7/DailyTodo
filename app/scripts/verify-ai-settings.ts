import { strict as assert } from 'node:assert';
import {
  AI_REVIEW_SETTINGS_KEY,
  createDefaultAiReviewSettings,
  normalizeAiReviewSettings,
  sanitizeRelDir,
  DEFAULT_REPORT_DIRS,
} from '../shared/aiReview/aiReviewSettings';

assert.equal(AI_REVIEW_SETTINGS_KEY, 'aiReviewSettings');

const def = createDefaultAiReviewSettings();
assert.equal(def.enabled, false, 'AI off by default (no key yet)');
assert.equal(def.baseUrl, 'https://api.openai.com/v1');
assert.equal(def.backfillDays, 7);
assert.equal(def.timerEnabled, false);
assert.equal(def.timerTime, '23:00');
assert.equal(def.timeoutSeconds, 90, 'default timeout 90s (DeepSeek/reports need >30s)');

// normalize 容错
const norm = normalizeAiReviewSettings({ enabled: 'yes', backfillDays: -5, timerTime: '99:99', model: '', timeoutSeconds: 0 });
assert.equal(norm.enabled, false, 'non-boolean → default');
assert.equal(norm.backfillDays, 7, 'invalid number → default');
assert.equal(norm.timerTime, '23:00', 'invalid time → default');
assert.ok(norm.model.length > 0, 'empty model → default');
assert.equal(norm.timeoutSeconds, 90, 'out-of-range timeout → default');

// 合法值保留
const ok = normalizeAiReviewSettings({ enabled: true, apiKey: 'sk-x', backfillDays: 14, timerTime: '07:30', timeoutSeconds: 180 });
assert.equal(ok.enabled, true);
assert.equal(ok.apiKey, 'sk-x');
assert.equal(ok.backfillDays, 14);
assert.equal(ok.timerTime, '07:30');
assert.equal(ok.timeoutSeconds, 180, 'valid timeout preserved');

// === 报告路径 + 模板字段 ===
assert.equal(def.weeklyDir, '', '路径默认空 = 用内置默认');
assert.equal(def.monthlyDir, '');
assert.equal(def.externalWeeklyDir, '');
assert.equal(def.externalMonthlyDir, '');
assert.equal(def.weeklyPrompt, '', '模板默认空 = 用内置默认句');
assert.equal(def.monthlyPrompt, '');

assert.equal(DEFAULT_REPORT_DIRS.weekly, 'logs/weekly-review');
assert.equal(DEFAULT_REPORT_DIRS.monthly, 'logs/monthly-review');
assert.equal(DEFAULT_REPORT_DIRS.externalWeekly, 'exports/weekly-reports');
assert.equal(DEFAULT_REPORT_DIRS.externalMonthly, 'exports/monthly-reports');

// sanitizeRelDir：去首尾斜杠、去 ..、空→fallback
assert.equal(sanitizeRelDir('  /a/b/ ', 'fb'), 'a/b');
assert.equal(sanitizeRelDir('../x', 'fb'), 'fb', '含 .. 非法 → fallback');
assert.equal(sanitizeRelDir('a/../b', 'fb'), 'fb', '路径中 .. 非法 → fallback');
assert.equal(sanitizeRelDir('', 'fb'), 'fb');
assert.equal(sanitizeRelDir('reports/wk', 'fb'), 'reports/wk', '合法保留');

// normalize：非法路径清空，非字符串模板清空，合法保留
const rep = normalizeAiReviewSettings({ weeklyDir: '../etc', monthlyPrompt: 123, externalWeeklyDir: '/out/wk/', weeklyPrompt: '自定义周报' });
assert.equal(rep.weeklyDir, '', '.. 路径 → 空');
assert.equal(rep.monthlyPrompt, '', '非字符串模板 → 空');
assert.equal(rep.externalWeeklyDir, 'out/wk', '合法路径去斜杠保留');
assert.equal(rep.weeklyPrompt, '自定义周报', '合法模板保留');

console.log('AI settings verification passed');
