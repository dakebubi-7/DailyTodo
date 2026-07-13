import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  AI_REVIEW_SETTINGS_KEY,
  createDefaultAiReviewSettings,
  isMonthlySourceMode,
  isWeeklySourceMode,
  normalizeAiReviewSettings,
  normalizeMonthlySourceMode,
  normalizeWeeklySourceMode,
  sanitizeRelDir,
  DEFAULT_REPORT_DIRS,
  createDefaultAiProfile,
  resolveActiveProfile,
} from '../shared/aiReview/aiReviewSettings';
import {
  createDefaultAiProfile as createProfileFromModule,
  resolveActiveProfile as resolveActiveProfileFromModule,
} from '../shared/aiReview/aiReviewProfiles';

const aiReviewSettingsPath = path.join(process.cwd(), 'shared/aiReview/aiReviewSettings.ts');
const aiReviewProfilesPath = path.join(process.cwd(), 'shared/aiReview/aiReviewProfiles.ts');
const aiReviewSettingsNormalizationPath = path.join(process.cwd(), 'shared/aiReview/aiReviewSettingsNormalization.ts');
const unknownValueGuardsPath = path.join(process.cwd(), 'shared/unknownValueGuards.ts');

assert.ok(fs.existsSync(aiReviewProfilesPath), 'AI profile helpers should live in shared/aiReview/aiReviewProfiles.ts');
assert.ok(fs.existsSync(aiReviewSettingsNormalizationPath), 'AI review settings normalization should have a dedicated module.');
assert.ok(fs.existsSync(unknownValueGuardsPath), 'shared unknown-value guards module should exist.');

const aiReviewSettingsSrc = fs.readFileSync(aiReviewSettingsPath, 'utf-8');
const aiReviewProfilesSrc = fs.readFileSync(aiReviewProfilesPath, 'utf-8');
const aiReviewSettingsNormalizationSrc = fs.readFileSync(aiReviewSettingsNormalizationPath, 'utf-8');
const unknownValueGuardsSrc = fs.readFileSync(unknownValueGuardsPath, 'utf-8');
const aiReviewSettingsLines = aiReviewSettingsSrc.split(/\r?\n/).length;

assert.ok(aiReviewSettingsSrc.includes("from './aiReviewProfiles'"), 'AI settings should import/re-export profile helpers from the profile module');
assert.ok(aiReviewProfilesSrc.includes('export function createDefaultAiProfile'), 'profile module should own default profile creation');
assert.ok(aiReviewProfilesSrc.includes('export function normalizeAiProfile'), 'profile module should own profile normalization');
assert.ok(aiReviewProfilesSrc.includes('export function resolveActiveProfile'), 'profile module should own active-profile resolution');
assert.ok(aiReviewProfilesSrc.includes('export function resolveProfileForReportKind'), 'profile module should own report-profile routing');
assert.ok(aiReviewProfilesSrc.includes('export function isAiProvider'), 'profile module should own provider guards');
assert.match(unknownValueGuardsSrc, /export function isObjectRecord\b/, 'shared guards should expose an object-record predicate.');
assert.match(
  aiReviewProfilesSrc,
  /import \{ isObjectRecord \} from '\.\.\/unknownValueGuards';/,
  'AI review profile normalization should reuse the shared object-record predicate.',
);
assert.doesNotMatch(
  aiReviewProfilesSrc,
  /function isObject\(v: unknown\)/,
  'AI review profile normalization should not keep a duplicate local object predicate.',
);
assert.match(
  aiReviewSettingsNormalizationSrc,
  /import \{ isObjectRecord \} from '\.\.\/unknownValueGuards';/,
  'AI review settings normalization should reuse the shared object-record predicate.',
);
assert.doesNotMatch(
  aiReviewSettingsNormalizationSrc,
  /function isObject\(/,
  'AI review settings normalization should not keep a duplicate local object predicate.',
);
assert.ok(aiReviewSettingsLines < 300, `aiReviewSettings.ts should stay below 300 lines after profile extraction; got ${aiReviewSettingsLines}`);

assert.equal(typeof createProfileFromModule().id, 'string', 'profile module default profile factory should be executable');
assert.equal(
  resolveActiveProfileFromModule(createDefaultAiReviewSettings()).model,
  resolveActiveProfile(createDefaultAiReviewSettings()).model,
  'profile module and AI settings re-export should resolve the same default profile',
);

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
const normalizedDefaultSettings = normalizeAiReviewSettings(createDefaultAiReviewSettings());
assert.equal(
  normalizedDefaultSettings.profiles.length,
  0,
  'normalizing fresh default AI review settings should preserve the new-format empty profiles state.',
);
assert.equal(
  normalizedDefaultSettings.activeProfileId,
  '',
  'normalizing fresh default AI review settings should preserve the empty activeProfileId state.',
);
const malformedProfilesLegacy = normalizeAiReviewSettings({
  profiles: 'not-an-array',
  provider: 'gemini',
  baseUrl: 'https://generativelanguage.googleapis.com',
  apiKey: 'legacy-key',
  model: 'gemini-1.5-flash',
  timeoutSeconds: 120,
});
assert.equal(
  malformedProfilesLegacy.profiles.length,
  1,
  'malformed non-array profiles should still fall back to legacy single-account migration instead of discarding legacy credentials.',
);
assert.equal(malformedProfilesLegacy.profiles[0].apiKey, 'legacy-key');

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
assert.equal(isWeeklySourceMode('daily-notes'), true, 'daily-notes is a valid weekly source mode');
assert.equal(isWeeklySourceMode('weekly-reports'), false, 'weekly-reports is not valid for weekly source mode');
assert.equal(isMonthlySourceMode('weekly-reports'), true, 'weekly-reports is a valid monthly source mode');
assert.equal(isMonthlySourceMode(null), false, 'non-string monthly source modes should be rejected');
assert.equal(normalizeWeeklySourceMode('manual-files'), 'manual-files');
assert.equal(normalizeWeeklySourceMode('weekly-reports'), 'daily-notes');
assert.equal(normalizeMonthlySourceMode('manual-files'), 'manual-files');
assert.equal(normalizeMonthlySourceMode('nope'), 'weekly-then-daily');

assert.ok(aiReviewSettingsSrc.includes('export function isWeeklySourceMode'), 'AI settings should export a weekly source-mode guard');
assert.ok(aiReviewSettingsSrc.includes('export function isMonthlySourceMode'), 'AI settings should export a monthly source-mode guard');
assert.ok(aiReviewSettingsSrc.includes('isWeeklySourceMode(value) ? value'), 'weekly source normalization should use the shared guard');
assert.ok(aiReviewSettingsSrc.includes('isMonthlySourceMode(value) ? value'), 'monthly source normalization should use the shared guard');
assert.ok(!aiReviewSettingsSrc.includes('value as WeeklySourceMode'), 'weekly source normalization should not cast values after includes checks');
assert.ok(!aiReviewSettingsSrc.includes('value as MonthlySourceMode'), 'monthly source normalization should not cast values after includes checks');

// === SettingsPanel UI references template/source/report account routing controls ===
const settingsPanelSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/SettingsPanel.tsx'), 'utf-8');
const aiReviewSettingsSectionSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/settings/AiReviewSettingsSection.tsx'), 'utf-8');
const aiReviewSourceSectionSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/settings/AiReviewSourceSettingsSection.tsx'), 'utf-8');
const aiReviewReportRoutingSectionSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/settings/AiReviewReportRoutingSection.tsx'), 'utf-8');
assert.ok(settingsPanelSrc.includes("'personalWeekly'"), 'SettingsPanel exposes personal weekly template editor');
assert.ok(settingsPanelSrc.includes("'externalMonthly'"), 'SettingsPanel exposes external monthly template editor');
assert.ok(aiReviewSettingsSectionSrc.includes('AiReviewSourceSettingsSection'), 'AI review settings section should render the source settings module');
assert.ok(aiReviewSourceSectionSrc.includes('weeklySourceMode'), 'AI review source settings section exposes weekly source mode');
assert.ok(aiReviewSourceSectionSrc.includes('monthlySourceMode'), 'AI review source settings section exposes monthly source mode');
assert.ok(aiReviewSourceSectionSrc.includes('externalWeeklySourceMode'), 'AI review source settings section exposes external weekly source mode');
assert.ok(aiReviewSourceSectionSrc.includes('externalMonthlySourceMode'), 'AI review source settings section exposes external monthly source mode');
assert.ok(aiReviewSourceSectionSrc.includes('startupBackfillEnabled'), 'AI review source settings section exposes startup backfill toggle');
assert.ok(aiReviewSourceSectionSrc.includes('startupBackfillEnable'));
assert.ok(aiReviewSourceSectionSrc.includes('backfillDays'));
assert.ok(aiReviewSettingsSectionSrc.includes('AiReviewReportRoutingSection'), 'AI review settings section should render the report routing module');
assert.ok(aiReviewReportRoutingSectionSrc.includes('dailyReviewProfileId'), 'AI review report routing exposes daily report account routing');
assert.ok(aiReviewReportRoutingSectionSrc.includes('weeklyReportProfileId'), 'AI review report routing exposes weekly report account routing');
assert.ok(aiReviewReportRoutingSectionSrc.includes('monthlyReportProfileId'), 'AI review report routing exposes monthly report account routing');
assert.ok(aiReviewReportRoutingSectionSrc.includes('followCurrentAccount'), 'AI review report routing exposes follow-current account option');
assert.ok(aiReviewReportRoutingSectionSrc.includes('reportAccountRouting'), 'AI review report routing section exposes its structural label');

const aiReviewLifecyclePath = path.join(process.cwd(), 'src/app/appAiReviewLifecycle.ts');
assert.ok(fs.existsSync(aiReviewLifecyclePath), 'AI review startup lifecycle should live in src/app/appAiReviewLifecycle.ts');
const aiReviewLifecycleSrc = fs.readFileSync(aiReviewLifecyclePath, 'utf-8');
assert.ok(
  aiReviewLifecycleSrc.includes('if (settings.startupBackfillEnabled)')
    && aiReviewLifecycleSrc.includes('aiReview?.backfill(getCurrentTasks())'),
  'AI review startup backfill should be guarded by startupBackfillEnabled',
);
assert.ok(
  !aiReviewLifecycleSrc.includes('void aiReview?.getSettings().then(() => {\n    void aiReview?.backfill(getCurrentTasks())'),
  'AI review startup lifecycle must not backfill unconditionally after loading settings',
);

console.log('AI settings verification passed');
