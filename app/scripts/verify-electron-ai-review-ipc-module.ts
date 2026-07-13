import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron/aiReviewIpc.ts');
const backfillPath = join(root, 'electron/aiReviewBackfillIpc.ts');
const dailyRunInspectPath = join(root, 'electron/aiReviewDailyRunInspectIpc.ts');
const externalReportPath = join(root, 'electron/aiReviewExternalReportIpc.ts');
const monthlyReportPath = join(root, 'electron/aiReviewMonthlyReportIpc.ts');
const registrationTypesPath = join(root, 'electron/aiReviewIpcRegistrationTypes.ts');
const settingsSectionsPath = join(root, 'electron/aiReviewSettingsSectionsIpc.ts');
const sourceMaterialsPath = join(root, 'electron/aiReviewSourceMaterialsIpc.ts');
const templateToolsPath = join(root, 'electron/aiReviewTemplateToolsIpc.ts');
const weeklyReportPath = join(root, 'electron/aiReviewWeeklyReportIpc.ts');
const bootstrapPath = join(root, 'electron/mainWindowBootstrap.ts');
const ipcRegistrationPath = join(root, 'electron/mainWindowIpcRegistration.ts');
const mainPath = join(root, 'electron/main.ts');

assert.ok(existsSync(modulePath), 'Electron AI Review IPC module should exist.');
assert.ok(existsSync(backfillPath), 'Electron AI Review backfill IPC module should exist.');
assert.ok(existsSync(dailyRunInspectPath), 'Electron AI Review daily run/inspect IPC module should exist.');
assert.ok(existsSync(externalReportPath), 'Electron AI Review external report IPC module should exist.');
assert.ok(existsSync(monthlyReportPath), 'Electron AI Review monthly report IPC module should exist.');
assert.ok(existsSync(registrationTypesPath), 'Electron AI Review IPC registration types module should exist.');
assert.ok(existsSync(settingsSectionsPath), 'Electron AI Review settings/sections IPC module should exist.');
assert.ok(existsSync(sourceMaterialsPath), 'Electron AI Review source-materials IPC module should exist.');
assert.ok(existsSync(templateToolsPath), 'Electron AI Review template/tools IPC module should exist.');
assert.ok(existsSync(weeklyReportPath), 'Electron AI Review weekly report IPC module should exist.');
assert.ok(existsSync(bootstrapPath), 'Electron main-window bootstrap module should exist.');

const helper = readFileSync(modulePath, 'utf8');
const backfill = readFileSync(backfillPath, 'utf8');
const dailyRunInspect = readFileSync(dailyRunInspectPath, 'utf8');
const externalReport = readFileSync(externalReportPath, 'utf8');
const monthlyReport = readFileSync(monthlyReportPath, 'utf8');
const registrationTypes = readFileSync(registrationTypesPath, 'utf8');
const settingsSections = readFileSync(settingsSectionsPath, 'utf8');
const sourceMaterials = readFileSync(sourceMaterialsPath, 'utf8');
const templateTools = readFileSync(templateToolsPath, 'utf8');
const weeklyReport = readFileSync(weeklyReportPath, 'utf8');
const bootstrap = readFileSync(bootstrapPath, 'utf8');
const ipcRegistration = readFileSync(ipcRegistrationPath, 'utf8');
const main = readFileSync(mainPath, 'utf8');

assert.match(helper, /export function registerAiReviewIpcHandlers\b/, 'AI Review IPC module should export registerAiReviewIpcHandlers.');
assert.match(helper, /from '\.\/aiReviewIpcRegistrationTypes'/, 'AI Review IPC module should import explicit registration dependencies from the focused type module.');
assert.match(registrationTypes, /export type RegisterAiReviewIpcHandlersOptions\b/, 'AI Review IPC registration types module should define explicit registration dependencies.');
assert.match(registrationTypes, /getDateKey\(date\?: unknown\): string/, 'AI Review IPC registration should expose an untrusted-date normalizer.');
assert.match(helper, /registerAiReviewSettingsSectionsIpcHandlers\(\{/, 'AI Review IPC module should delegate settings/sections handling to the focused helper.');
assert.match(settingsSections, /setAiReviewSettings/, 'AI Review settings/sections IPC module should own settings setter wiring.');
assert.match(settingsSections, /setReviewSections/, 'AI Review settings/sections IPC module should own review-sections setter wiring.');
assert.match(settingsSections, /scheduleAiTimers\(\)/, 'AI Review settings/sections IPC module should reschedule AI timers after settings updates.');
assert.match(helper, /registerAiReviewWeeklyReportIpcHandlers\(\{/, 'AI Review IPC module should delegate weekly report generation to the focused helper.');
assert.match(weeklyReport, /generatePersonalWeekly/, 'AI Review weekly report IPC module should own weekly report generation wiring.');
assert.match(helper, /registerAiReviewMonthlyReportIpcHandlers\(\{/, 'AI Review IPC module should delegate monthly report generation to the focused helper.');
assert.match(monthlyReport, /generatePersonalMonthly/, 'AI Review monthly report IPC module should own monthly report generation wiring.');
assert.match(helper, /registerAiReviewBackfillIpcHandlers\(\{/, 'AI Review IPC module should delegate backfill handling to the focused helper.');
assert.match(backfill, /backfillReviews/, 'AI Review backfill IPC module should own backfill runner wiring.');
assert.match(helper, /registerAiReviewExternalReportIpcHandlers\(\{/, 'AI Review IPC module should delegate external report generation to the focused helper.');
assert.match(externalReport, /generateExternalReport/, 'AI Review external report IPC module should own external report generation wiring.');
assert.match(externalReport, /buildMonthlyMessages/, 'AI Review external report IPC module should own external report prompt message wiring.');
assert.match(helper, /registerAiReviewSourceMaterialsIpcHandlers\(\{/, 'AI Review IPC module should delegate source-material tests to the focused helper.');
assert.match(sourceMaterials, /collectDailySourcesForDates/, 'AI Review source-materials IPC module should own daily source-material test collection.');
assert.match(sourceMaterials, /collectMonthlySources/, 'AI Review source-materials IPC module should own monthly source-material test collection.');
assert.match(helper, /registerAiReviewTemplateToolsIpcHandlers\(\{/, 'AI Review IPC module should delegate template/tool handlers to the focused helper.');
assert.match(templateTools, /buildRecognizeMessages/, 'AI Review template/tools IPC module should own review-template recognition wiring.');
assert.match(templateTools, /buildRecognizeReportMessages/, 'AI Review template/tools IPC module should own report-template recognition wiring.');
assert.match(templateTools, /parseTemplateFile/, 'AI Review template/tools IPC module should own template-file parsing wiring.');
assert.match(templateTools, /listModels\(/, 'AI Review template/tools IPC module should own model listing wiring.');
assert.match(templateTools, /dialog\.showOpenDialog/, 'AI Review template/tools IPC module should own template-file picker dialog wiring.');
assert.match(helper, /registerAiReviewDailyRunInspectIpcHandlers\(\{/, 'AI Review IPC module should delegate daily run/inspect handling to the focused helper.');
assert.match(dailyRunInspect, /runReviewForDate\(getDateKey\(date\), tasks, force === true\)/, 'AI Review daily run/inspect IPC module should own daily review runner wiring with a strictly narrowed force flag.');
assert.match(dailyRunInspect, /inspectDailyAiContent\(getDateKey\(date\)\)/, 'AI Review daily run/inspect IPC module should own daily inspection wiring.');
assert.doesNotMatch(helper, /setAiReviewSettings\(value\)/, 'AI Review IPC parent should not call the AI Review settings setter inline after settings/sections extraction.');
assert.doesNotMatch(helper, /setReviewSections\(value\)/, 'AI Review IPC parent should not call the review-sections setter inline after settings/sections extraction.');
assert.doesNotMatch(helper, /scheduleAiTimers\(\);/, 'AI Review IPC parent should not reschedule timers inline after settings/sections extraction.');
assert.doesNotMatch(helper, /import \{[^}]*ipcMain[^}]*\} from 'electron'/, 'AI Review IPC parent should no longer import ipcMain after all channel handlers are delegated.');

for (const channel of [
  'aiReview:getSettings',
  'aiReview:setSettings',
  'aiReview:getSections',
  'aiReview:setSections',
  'aiReview:runForDate',
  'aiReview:inspectDaily',
  'aiReview:backfill',
  'aiReview:generateWeekly',
  'aiReview:generateMonthly',
  'aiReview:generateExternal',
  'aiReview:testSourceMaterials',
  'aiReview:recognizeTemplate',
  'aiReview:recognizeReportTemplate',
  'aiReview:listModels',
  'aiReview:pickTemplateFile',
]) {
  const registrationPattern = new RegExp("ipcMain\\.handle\\('" + channel + "'");
  const owner = [
    'aiReview:getSettings',
    'aiReview:setSettings',
    'aiReview:getSections',
    'aiReview:setSections',
  ].includes(channel)
    ? settingsSections
    : [
    'aiReview:runForDate',
    'aiReview:inspectDaily',
  ].includes(channel)
    ? dailyRunInspect
    : [
    'aiReview:backfill',
  ].includes(channel)
    ? backfill
    : [
    'aiReview:generateWeekly',
  ].includes(channel)
    ? weeklyReport
    : [
    'aiReview:generateMonthly',
  ].includes(channel)
    ? monthlyReport
    : [
    'aiReview:generateExternal',
  ].includes(channel)
    ? externalReport
    : [
    'aiReview:testSourceMaterials',
  ].includes(channel)
    ? sourceMaterials
    : [
    'aiReview:recognizeTemplate',
    'aiReview:recognizeReportTemplate',
    'aiReview:listModels',
    'aiReview:pickTemplateFile',
  ].includes(channel)
    ? templateTools
    : helper;
  assert.match(owner, registrationPattern, `AI Review IPC modules should register ${channel}.`);
  assert.doesNotMatch(main, registrationPattern, `main should not register ${channel} inline.`);
}

assert.match(main, /from '\.\/mainWindowComposition'/, 'main should delegate AI Review IPC wiring through main-window composition.');
assert.match(bootstrap, /from '\.\/mainWindowIpcRegistration'/, 'mainWindowBootstrap should delegate AI Review IPC composition through the focused helper.');
assert.match(ipcRegistration, /from '\.\/aiReviewIpc'/, 'mainWindowIpcRegistration should import AI Review IPC registration from aiReviewIpc.');
assert.match(ipcRegistration, /registerAiReviewIpcHandlers\(\{/, 'mainWindowIpcRegistration should delegate AI Review IPC registration to the helper.');
assert.match(ipcRegistration, /getAiReviewSettings,/, 'mainWindowIpcRegistration should pass the AI Review settings getter to the helper.');
assert.match(ipcRegistration, /setAiReviewSettings,/, 'mainWindowIpcRegistration should pass the AI Review settings setter to the helper.');
assert.match(ipcRegistration, /getReviewSections,/, 'mainWindowIpcRegistration should pass the review sections getter to the helper.');
assert.match(ipcRegistration, /setReviewSections,/, 'mainWindowIpcRegistration should pass the review sections setter to the helper.');
assert.match(ipcRegistration, /scheduleAiTimers,/, 'mainWindowIpcRegistration should pass the AI timer rescheduler to the helper.');
assert.match(main, /from '\.\/mainAiReviewServices'/, 'main should delegate AI timer scheduling through the AI review services composition.');
assert.match(main, /scheduleAiTimers,/, 'main should pass the composed timer scheduler to main-window composition.');
assert.match(ipcRegistration, /runReviewForDate,/, 'mainWindowIpcRegistration should pass the daily review runner to the helper.');
assert.match(ipcRegistration, /inspectDailyAiContent,/, 'mainWindowIpcRegistration should pass the daily inspection helper to the AI Review IPC module.');

for (const symbol of [
  'backfillReviews',
  'buildRecognizeMessages',
  'parseRecognizedSections',
  'buildRecognizeReportMessages',
  'parseRecognizedReportPrompt',
  'parseTemplateFile',
  'generatePersonalWeekly',
  'generatePersonalMonthly',
  'generateExternalReport',
  'collectDailySourcesForDates',
  'collectMonthlySources',
  'hasSourceMaterials',
  'DEFAULT_EXTERNAL_WEEKLY_SYSTEM',
  'DEFAULT_EXTERNAL_MONTHLY_SYSTEM',
  'computeRangeStats',
  'listModels',
]) {
  const symbolPattern = new RegExp(`\\b${symbol}\\b`);
  assert.doesNotMatch(main, symbolPattern, `main should not keep direct ${symbol} references after AI Review IPC extraction.`);
}

console.log('electron AI Review IPC module verification passed');
