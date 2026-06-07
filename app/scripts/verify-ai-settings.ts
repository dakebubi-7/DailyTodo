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
assert.equal(def.externalWeeklyPrompt, '');
assert.equal(def.externalMonthlyPrompt, '');

assert.equal(DEFAULT_REPORT_DIRS.weekly, 'logs/weekly-review');
assert.equal(DEFAULT_REPORT_DIRS.monthly, 'logs/monthly-review');
assert.equal(DEFAULT_REPORT_DIRS.externalWeekly, 'exports/weekly-reports');
assert.equal(DEFAULT_REPORT_DIRS.externalMonthly, 'exports/monthly-reports');

// sanitizeRelDir：去首尾斜杠、去 ..、空→fallback（纯工具函数）
assert.equal(sanitizeRelDir('  /a/b/ ', 'fb'), 'a/b');
assert.equal(sanitizeRelDir('../x', 'fb'), 'fb', '含 .. 非法 → fallback');
assert.equal(sanitizeRelDir('a/../b', 'fb'), 'fb', '路径中 .. 非法 → fallback');
assert.equal(sanitizeRelDir('', 'fb'), 'fb');
assert.equal(sanitizeRelDir('reports/wk', 'fb'), 'reports/wk', '合法保留');

// normalize：路径原样保留（允许用户输入 / 和 \\），模板非字符串清空，合法保留
const rep = normalizeAiReviewSettings({ weeklyDir: '../etc', monthlyPrompt: 123, externalWeeklyDir: '/out/wk/', weeklyPrompt: '自定义周报', externalWeeklyPrompt: '外部周报模板' });
assert.equal(rep.weeklyDir, '../etc', '路径输入原样保留，真正写文件前再 sanitize');
assert.equal(rep.monthlyPrompt, '', '非字符串模板 → 空');
assert.equal(rep.externalWeeklyDir, '/out/wk/', '路径原样保留');
assert.equal(rep.weeklyPrompt, '自定义周报', '合法模板保留');
assert.equal(rep.externalWeeklyPrompt, '外部周报模板', '新增外部周报模板保留');

console.log('AI settings verification passed');
