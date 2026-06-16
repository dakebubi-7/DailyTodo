import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  AI_REVIEW_SETTINGS_KEY,
  createDefaultAiReviewSettings,
  normalizeAiReviewSettings,
  sanitizeRelDir,
  DEFAULT_REPORT_DIRS,
  createDefaultAiProfile,
  resolveActiveProfile,
} from '../shared/aiReview/aiReviewSettings';

assert.equal(AI_REVIEW_SETTINGS_KEY, 'aiReviewSettings');

const def = createDefaultAiReviewSettings();
assert.equal(def.enabled, false, 'AI off by default (no key yet)');
assert.equal(def.baseUrl, 'https://api.openai.com/v1');
assert.equal(def.backfillDays, 7);
assert.equal(def.startupBackfillEnabled, false, 'startup backfill off by default to avoid token spend');
assert.equal(def.timerEnabled, false);
assert.equal(def.timerTime, '23:00');
assert.equal(def.timeoutSeconds, 90, 'default timeout 90s (DeepSeek/reports need >30s)');

// normalize 容错
const norm = normalizeAiReviewSettings({ enabled: 'yes', backfillDays: -5, startupBackfillEnabled: 'yes', timerTime: '99:99', model: '', timeoutSeconds: 0 });
assert.equal(norm.enabled, false, 'non-boolean → default');
assert.equal(norm.backfillDays, 7, 'invalid number → default');
assert.equal(norm.startupBackfillEnabled, false, 'non-boolean startup backfill → default off');
assert.equal(norm.timerTime, '23:00', 'invalid time → default');
assert.ok(norm.model.length > 0, 'empty model → default');
assert.equal(norm.timeoutSeconds, 90, 'out-of-range timeout → default');

// 合法值保留
const ok = normalizeAiReviewSettings({ enabled: true, apiKey: 'sk-x', backfillDays: 14, startupBackfillEnabled: true, timerTime: '07:30', timeoutSeconds: 180 });
assert.equal(ok.enabled, true);
assert.equal(ok.apiKey, 'sk-x');
assert.equal(ok.backfillDays, 14);
assert.equal(ok.startupBackfillEnabled, true);
assert.equal(ok.timerTime, '07:30');
assert.equal(ok.timeoutSeconds, 180, 'valid timeout preserved');
assert.equal(
  normalizeAiReviewSettings({
    profiles: [{ id: 'p1', name: 'A', provider: 'openai', baseUrl: 'https://x/v1', apiKey: 'k1', model: 'm1', timeoutSeconds: 60 }],
    activeProfileId: 'p1',
    dailyReviewProfileId: 'p1',
    weeklyReportProfileId: '',
    monthlyReportProfileId: 'deleted-profile',
  }).dailyReviewProfileId,
  'p1',
  '日报账号路由字段合法值保留',
);
assert.equal(
  normalizeAiReviewSettings({ weeklyReportProfileId: 123 }).weeklyReportProfileId,
  '',
  '账号路由字段非字符串清空',
);
assert.equal(
  normalizeAiReviewSettings({ monthlyReportProfileId: 'deleted-profile' }).monthlyReportProfileId,
  'deleted-profile',
  '账号路由字段失效 id 留给运行时回退处理',
);

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

// === 轻量多账号 profiles + activeProfileId ===
const defProfile = createDefaultAiProfile();
assert.ok(defProfile.id.length > 0, 'default profile has id');
assert.equal(defProfile.provider, 'auto');
assert.equal(defProfile.baseUrl, 'https://api.openai.com/v1');
assert.equal(def.activeProfileId, '', '默认未显式选择 activeProfileId');
assert.equal(def.dailyReviewProfileId, '', '日报账号默认跟随当前账号');
assert.equal(def.weeklyReportProfileId, '', '周报账号默认跟随当前账号');
assert.equal(def.monthlyReportProfileId, '', '月报账号默认跟随当前账号');
assert.equal(def.profiles.length, 0, '新安装默认没有 profiles，迁移时再生成');

// 旧版单配置自动迁移成 1 个默认 profile
const migrated = normalizeAiReviewSettings({
  provider: 'gemini',
  baseUrl: 'https://generativelanguage.googleapis.com',
  apiKey: 'g-key',
  model: 'gemini-1.5-flash',
  timeoutSeconds: 120,
});
assert.equal(migrated.profiles.length, 1, '旧单配置自动迁移');
assert.equal(migrated.activeProfileId, migrated.profiles[0].id, '迁移后 active 指向默认 profile');
assert.equal(migrated.profiles[0].provider, 'gemini');
assert.equal(migrated.profiles[0].apiKey, 'g-key');

// 显式 profiles 保留，坏 activeProfileId 回落到第一个 profile
const kept = normalizeAiReviewSettings({
  profiles: [
    { id: 'p1', name: 'A', provider: 'openai', baseUrl: 'https://x/v1', apiKey: 'k1', model: 'm1', timeoutSeconds: 60 },
    { id: 'p2', name: 'B', provider: 'anthropic', baseUrl: 'https://api.anthropic.com', apiKey: 'k2', model: 'claude-3-5-haiku-latest', timeoutSeconds: 90 },
  ],
  activeProfileId: 'missing',
});
assert.equal(kept.profiles.length, 2, '显式 profiles 保留');
assert.equal(kept.activeProfileId, 'p1', '坏 activeProfileId 回落首个 profile');
assert.equal(kept.profiles[1].provider, 'anthropic');

// resolveActiveProfile：按 activeProfileId 取当前生效账号
const active = resolveActiveProfile(
  normalizeAiReviewSettings({
    profiles: [
      { id: 'p1', name: 'A', provider: 'openai', baseUrl: 'https://x/v1', apiKey: 'k1', model: 'm1', timeoutSeconds: 60 },
      { id: 'p2', name: 'B', provider: 'anthropic', baseUrl: 'https://api.anthropic.com', apiKey: 'k2', model: 'claude-3-5-haiku-latest', timeoutSeconds: 90 },
    ],
    activeProfileId: 'p2',
  }),
);
assert.equal(active.id, 'p2', 'resolve 返回 active 指向的 profile');
assert.equal(active.apiKey, 'k2');
assert.equal(active.model, 'claude-3-5-haiku-latest');

// resolveActiveProfile：activeProfileId 失效 → 回落第一个 profile
const activeFallback = resolveActiveProfile(
  normalizeAiReviewSettings({
    profiles: [{ id: 'only', name: 'X', provider: 'auto', baseUrl: 'https://y/v1', apiKey: 'ky', model: 'my', timeoutSeconds: 90 }],
    activeProfileId: 'gone',
  }),
);
assert.equal(activeFallback.id, 'only', 'active 失效回落首个 profile');

// resolveActiveProfile：没有任何 profile（全新默认）→ 用顶层字段合成一个
const activeSynth = resolveActiveProfile(createDefaultAiReviewSettings());
assert.equal(activeSynth.baseUrl, 'https://api.openai.com/v1', '无 profile 时用顶层字段合成');
assert.equal(activeSynth.model, 'gpt-4o-mini');

// === source modes ===
assert.equal(def.weeklySourceMode, 'daily-notes');
assert.equal(def.monthlySourceMode, 'weekly-then-daily');
assert.equal(def.externalWeeklySourceMode, 'daily-notes');
assert.equal(def.externalMonthlySourceMode, 'weekly-then-daily');

// === SettingsPanel UI references template/source/report account routing controls ===
const settingsPanelSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/SettingsPanel.tsx'), 'utf-8');
assert.ok(settingsPanelSrc.includes("'personalWeekly'"), 'SettingsPanel exposes personal weekly template editor');
assert.ok(settingsPanelSrc.includes("'externalMonthly'"), 'SettingsPanel exposes external monthly template editor');
assert.ok(settingsPanelSrc.includes('weeklySourceMode'), 'SettingsPanel exposes weekly source mode');
assert.ok(settingsPanelSrc.includes('monthlySourceMode'), 'SettingsPanel exposes monthly source mode');
assert.ok(settingsPanelSrc.includes('externalWeeklySourceMode'), 'SettingsPanel exposes external weekly source mode');
assert.ok(settingsPanelSrc.includes('externalMonthlySourceMode'), 'SettingsPanel exposes external monthly source mode');
assert.ok(settingsPanelSrc.includes('startupBackfillEnabled'), 'SettingsPanel exposes startup backfill toggle');
assert.ok(settingsPanelSrc.includes('startupBackfillEnable'));
assert.ok(settingsPanelSrc.includes('backfillDays'));
assert.ok(settingsPanelSrc.includes('dailyReviewProfileId'), 'SettingsPanel exposes daily report account routing');
assert.ok(settingsPanelSrc.includes('weeklyReportProfileId'), 'SettingsPanel exposes weekly report account routing');
assert.ok(settingsPanelSrc.includes('monthlyReportProfileId'), 'SettingsPanel exposes monthly report account routing');
assert.ok(settingsPanelSrc.includes('followCurrentAccount'), 'SettingsPanel exposes follow-current account option');
assert.ok(settingsPanelSrc.includes('reportAccountRouting'), 'SettingsPanel renders report account routing section');

const appSrc = fs.readFileSync(path.join(process.cwd(), 'src/App.tsx'), 'utf-8');
assert.ok(appSrc.includes('startupBackfillEnabled'), 'App gates startup daily-review backfill behind startupBackfillEnabled');
assert.ok(!appSrc.includes('if (!isLoaded) return;\n    void window.electronAPI?.aiReview?.backfill'), 'App must not call backfill unconditionally on startup');

console.log('AI settings verification passed');
