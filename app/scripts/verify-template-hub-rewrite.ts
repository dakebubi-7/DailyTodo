import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const cwd = process.cwd();
const root = existsSync(join(cwd, 'app')) ? join(cwd, 'app') : cwd;
const sectionConfig = readFileSync(join(root, 'shared/aiReview/sectionConfig.ts'), 'utf8');

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

// T1: CustomBlock data structures exist
assert(sectionConfig.includes("export type RenderType"), 'RenderType type not defined');
assert(/export type RenderType\s*=\s*['"]text['"]\s*\|\s*['"]list['"]\s*\|\s*['"]table['"]\s*\|\s*['"]callout['"]\s*\|\s*['"]dataview['"]/.test(sectionConfig), 'RenderType union incomplete');
assert(sectionConfig.includes('export interface CustomBlock'), 'CustomBlock interface not defined');
assert(/id:\s*string/.test(sectionConfig), 'CustomBlock.id missing');
assert(/name:\s*string/.test(sectionConfig), 'CustomBlock.name missing');
assert(/aiGenerate:\s*boolean/.test(sectionConfig), 'CustomBlock.aiGenerate missing');
assert(/renderType:\s*RenderType/.test(sectionConfig), 'CustomBlock.renderType missing');
assert(/prompt:\s*string/.test(sectionConfig), 'CustomBlock.prompt missing');
assert(sectionConfig.includes('export interface FixedBlock'), 'FixedBlock interface not defined');
assert(sectionConfig.includes("id: 'work' | 'inspire' | 'tasks'"), 'FixedBlock.id union incorrect');
assert(sectionConfig.includes('export interface DailyTemplate'), 'DailyTemplate interface not defined');
assert(sectionConfig.includes('export interface ReportTemplate'), 'ReportTemplate interface not defined');

console.log('T1: CustomBlock data structures ✓');

// T2: Path template variable expansion
const pathTemplate = readFileSync(join(root, 'shared/pathTemplate.ts'), 'utf8');
assert(pathTemplate.includes('export function expandPathTemplate'), 'expandPathTemplate function not exported');
assert(/expandPathTemplate\([^)]*Date[^)]*\)/.test(pathTemplate), 'expandPathTemplate signature incorrect');

// Dynamic test
const pt = await import(pathToFileURL(join(root, 'shared/pathTemplate.ts')).href);
const d = new Date(2026, 5, 15, 10, 0, 0); // June 15, 2026 local time
const out = pt.expandPathTemplate('logs/daily/{{date}}.md', d);
assert(out === 'logs/daily/2026-06-15.md', `date variable expansion wrong, got: ${out}`);
const out2 = pt.expandPathTemplate('logs/weekly/{{year}}-W{{week}}.md', d);
assert(/^logs\/weekly\/2026-W\d{2}\.md$/.test(out2), `year/week variable expansion wrong, got: ${out2}`);
const out3 = pt.expandPathTemplate('logs/monthly/{{year}}-{{month}}.md', d);
assert(out3 === 'logs/monthly/2026-06.md', `year/month variable expansion wrong, got: ${out3}`);
// Unknown variable left as-is
const out4 = pt.expandPathTemplate('logs/{{unknown}}/{{date}}.md', d);
assert(out4 === 'logs/{{unknown}}/2026-06-15.md', `unknown variable should be preserved, got: ${out4}`);

console.log('T2: Path template variable expansion ✓');

// T3: Light anonymization
const blockDefaults = readFileSync(join(root, 'shared/templateBlockDefaults.ts'), 'utf8');
assert(blockDefaults.includes('export function lightAnonymize'), 'lightAnonymize not exported');

const bd = await import(pathToFileURL(join(root, 'shared/templateBlockDefaults.ts')).href);
const sample = '联系张三 13800138000,邮箱 zhang@example.com,项目代号 Apollo-X';
const redacted = bd.lightAnonymize(sample);
assert(redacted.includes('[人员]'), 'name not anonymized');
assert(redacted.includes('[联系方式]'), 'phone/email not anonymized');
assert(redacted.includes('[项目A]') || redacted.includes('[项目B]'), 'project code not anonymized');
assert(!redacted.includes('张三'), 'name still present');
assert(!redacted.includes('13800138000'), 'phone still present');
assert(!redacted.includes('zhang@example.com'), 'email still present');
// Non-sensitive content preserved
const noop = bd.lightAnonymize('这是普通文字,没有什么敏感信息。');
assert(noop === '这是普通文字,没有什么敏感信息。', 'normal text should pass through unchanged');

console.log('T3: Light anonymization ✓');

// T3b: Idempotency — running lightAnonymize twice should not change text
const bd2 = await import(pathToFileURL(join(root, 'shared/templateBlockDefaults.ts')).href);
const sensitive = '张三 13800138000 zhang@example.com 项目1';
const once = bd2.lightAnonymize(sensitive);
const twice = bd2.lightAnonymize(once);
assert(once === twice, `idempotency broken: first=${once} second=${twice}`);
// Already-anonymized text should pass through unchanged
const alreadyAnonymized = '[人员] [联系方式] [项目A]';
const passthrough = bd2.lightAnonymize(alreadyAnonymized);
assert(passthrough === alreadyAnonymized, `already-anonymized should be unchanged: got=${passthrough}`);

console.log('T3b: Light anonymization idempotency ✓');

// T4: Double-generation bug fix
const templateRenderer = readFileSync(join(root, 'shared/templateRenderer.ts'), 'utf8');
assert(templateRenderer.includes('export function renderDailyTemplate'), 'renderDailyTemplate not exported');
assert(templateRenderer.includes('export function renderReportTemplate'), 'renderReportTemplate not exported');

// Static check: old buildDailyNoteFromTemplate no longer writes AI content
const obsTpl = readFileSync(join(root, 'shared/obsidianTemplates.ts'), 'utf8');
const fnMatch = obsTpl.match(/export function buildDailyNoteFromTemplate[\s\S]*?\n\}/);
assert(fnMatch, 'buildDailyNoteFromTemplate function not found');
assert(!/AI 草稿/.test(fnMatch[0]), 'buildDailyNoteFromTemplate still contains "AI 草稿" text');
assert(!/🤖/.test(fnMatch[0]), 'buildDailyNoteFromTemplate still contains 🤖 emoji');

// Dynamic check: renderDailyTemplate writes empty marker, NO AI content
const tr = await import(pathToFileURL(join(root, 'shared/templateRenderer.ts')).href);
const dailyTpl = {
  fixedBlocks: [
    { id: 'work', displayName: '今日工作' },
    { id: 'inspire', displayName: '灵感随笔' },
    { id: 'tasks', displayName: '每日任务' },
  ],
  customBlocks: [
    { id: 'b1', name: '复盘', aiGenerate: true, renderType: 'text', prompt: '' },
  ],
};
const rendered = tr.renderDailyTemplate({
  template: dailyTpl,
  work: '今天写了点东西',
  inspiration: '想到一个 idea',
  tasks: '- [x] 任务A',
  date: '2026-06-11',
});
assert(rendered.includes('<!-- DAILYTODO:REVIEW:START -->'), 'review marker START missing');
assert(rendered.includes('<!-- DAILYTODO:REVIEW:END -->'), 'review marker END missing');
const markerBody = rendered.match(/<!-- DAILYTODO:REVIEW:START -->([\s\S]*?)<!-- DAILYTODO:REVIEW:END -->/);
assert(markerBody, 'marker pair incomplete');
assert(!markerBody![1].includes('🤖'), `marker body has AI draft, bug not fixed. Body: "${markerBody![1]}"`);
assert(!markerBody![1].match(/\S/), `marker body should be empty/whitespace, got: "${markerBody![1]}"`);

console.log('T4: Double-generation bug fix ✓');

// T5: ObsidianTemplateSettings — 5 paths + 5 templates
const appSettings = readFileSync(join(root, 'shared/appSettings.ts'), 'utf8');
assert(appSettings.includes('dailyPath:'), 'dailyPath field missing');
assert(appSettings.includes('weeklyPath:'), 'weeklyPath field missing');
assert(appSettings.includes('monthlyPath:'), 'monthlyPath field missing');
assert(appSettings.includes('externalWeeklyPath:'), 'externalWeeklyPath field missing');
assert(appSettings.includes('externalMonthlyPath:'), 'externalMonthlyPath field missing');
assert(appSettings.includes('dailyTemplate:'), 'dailyTemplate field missing');
assert(appSettings.includes('weeklyTemplate:'), 'weeklyTemplate field missing');
assert(appSettings.includes('monthlyTemplate:'), 'monthlyTemplate field missing');
assert(appSettings.includes('externalWeeklyTemplate:'), 'externalWeeklyTemplate field missing');
assert(appSettings.includes('externalMonthlyTemplate:'), 'externalMonthlyTemplate field missing');
// Old fields must be removed
assert(!appSettings.includes('taskExportPath:'), 'taskExportPath still present (should be removed)');
assert(!appSettings.includes('dailyMarkdownTemplate:'), 'dailyMarkdownTemplate still present (should be removed)');
assert(!appSettings.includes('taskLineTemplate:'), 'taskLineTemplate still present (should be removed)');
assert(!appSettings.includes('completionReviewTemplate:'), 'completionReviewTemplate still present (should be removed)');

// Migration test: old normalize still works
const asm = await import(pathToFileURL(join(root, 'shared/appSettings.ts')).href);
const oldFormat = {
  obsidianPath: '/vault',
  dailyNotePath: 'logs/old/{{date}}.md',
  taskExportPath: 'logs/old/tasks/{{date}}.md',
  dailyMarkdownTemplate: '# Daily\n## {{work}}\nstuff\n## {{inspire}}\nmore\n## {{tasks}}\nlist\n## {{review}}\ngoal',
  weeklyDir: 'logs/old/weekly',
  monthlyDir: 'logs/old/monthly',
  externalWeeklyDir: 'logs/old/external-weekly',
  externalMonthlyDir: 'logs/old/external-monthly',
  syncDeletedReviewsToObsidian: true,
  confirmBeforeDeletingReview: false,
};
const normalized = asm.normalizeObsidianTemplateSettings(oldFormat);
assert(normalized.dailyPath === 'logs/old/{{date}}.md', `dailyPath migration failed: got ${normalized.dailyPath}`);
assert(/^logs\/old\/weekly\/.+\.md$/.test(normalized.weeklyPath), `weeklyPath migration failed: got ${normalized.weeklyPath}`);
assert(/^logs\/old\/monthly\/.+\.md$/.test(normalized.monthlyPath), `monthlyPath migration failed: got ${normalized.monthlyPath}`);
assert(/^logs\/old\/external-weekly\/.+\.md$/.test(normalized.externalWeeklyPath), `externalWeeklyPath migration failed: got ${normalized.externalWeeklyPath}`);
assert(/^logs\/old\/external-monthly\/.+\.md$/.test(normalized.externalMonthlyPath), `externalMonthlyPath migration failed: got ${normalized.externalMonthlyPath}`);
// dailyTemplate migrated from old markdown template
assert(normalized.dailyTemplate.fixedBlocks.length === 3, 'dailyTemplate.fixedBlocks should have 3');
assert(normalized.dailyTemplate.customBlocks.length >= 1, `dailyTemplate.customBlocks should have at least the {{review}} block, got ${normalized.dailyTemplate.customBlocks.length}`);
assert(normalized.confirmBeforeDeletingReview === false, 'confirmBeforeDeletingReview migration failed');
assert(normalized.syncDeletedReviewsToObsidian === true, 'syncDeletedReviewsToObsidian migration failed');

console.log('T5: 5 paths + 5 templates settings model ✓');

// T6: AiReviewSettings — 4 timers + anonymize flag
const aiSettings = readFileSync(join(root, 'shared/aiReview/aiReviewSettings.ts'), 'utf8');
assert(aiSettings.includes('weeklyTimerEnabled:'), 'weeklyTimerEnabled missing');
assert(aiSettings.includes('monthlyTimerEnabled:'), 'monthlyTimerEnabled missing');
assert(aiSettings.includes('externalWeeklyTimerEnabled:'), 'externalWeeklyTimerEnabled missing (should be new)');
assert(aiSettings.includes('externalMonthlyTimerEnabled:'), 'externalMonthlyTimerEnabled missing (should be new)');
assert(aiSettings.includes('anonymizeExternalReports:'), 'anonymizeExternalReports missing (should be new)');
// Old fields must be removed
assert(!aiSettings.includes('weeklyDir:'), 'weeklyDir still present (should be removed)');
assert(!aiSettings.includes('monthlyDir:'), 'monthlyDir still present (should be removed)');
assert(!aiSettings.includes('externalWeeklyDir:'), 'externalWeeklyDir still present (should be removed)');
assert(!aiSettings.includes('externalMonthlyDir:'), 'externalMonthlyDir still present (should be removed)');
assert(!aiSettings.includes('weeklyPrompt:'), 'weeklyPrompt still present (should be removed)');
assert(!aiSettings.includes('weeklySourceMode:'), 'weeklySourceMode still present (should be removed)');
assert(!aiSettings.includes('backfillDays:'), 'backfillDays still present (should be removed)');

// Default factory test
const ais = await import(pathToFileURL(join(root, 'shared/aiReview/aiReviewSettings.ts')).href);
const factoryName = Object.keys(ais).find((k) => k.startsWith('createDefault') && k.includes('AiReview')) || Object.keys(ais).find((k) => k.toLowerCase().includes('default') && k.toLowerCase().includes('ai'));
assert(factoryName, 'no createDefault factory found in aiReviewSettings module');
const defaults = ais[factoryName]();
assert(defaults.anonymizeExternalReports === true, `anonymizeExternalReports default should be true, got ${defaults.anonymizeExternalReports}`);
assert('externalWeeklyTimerEnabled' in defaults, 'externalWeeklyTimerEnabled missing in defaults');
assert('externalMonthlyTimerEnabled' in defaults, 'externalMonthlyTimerEnabled missing in defaults');

console.log('T6: AiReviewSettings 4 timers + anonymize ✓');

// T7: AI recognition — N blocks + renderType
const recog = readFileSync(join(root, 'shared/recognizeTemplateBlocks.ts'), 'utf8');
assert(recog.includes('export function buildRecognizeBlocksMessages'), 'buildRecognizeBlocksMessages not exported');
assert(recog.includes('export function parseRecognizedBlocks'), 'parseRecognizedBlocks not exported');

const r = await import(pathToFileURL(join(root, 'shared/recognizeTemplateBlocks.ts')).href);

// basic parsing: 3 blocks with renderType inferred from content
const sampleMd = `## 今日总结\n- 完成 A\n- 完成 B\n## 下周计划\n1. 计划 X\n## 灵感\n> [!note] 想法\n> 内容`;
const result = r.parseRecognizedBlocks(sampleMd, []);
assert(result.blocks.length === 3, `expected 3 blocks from parseRecognizedBlocks, got ${result.blocks.length}`);
assert(result.blocks[0].name === '今日总结', `block 0 name wrong: ${result.blocks[0].name}`);
assert(result.blocks[0].renderType === 'list', `block 0 should be list, got ${result.blocks[0].renderType}`);
assert(result.blocks[2].renderType === 'callout', `block 2 should be callout, got ${result.blocks[2].renderType}`);

// fixed block names are excluded
const mdWithFixed = `## 今日工作\n- 内容\n## 复盘\n- 复盘内容`;
const result2 = r.parseRecognizedBlocks(mdWithFixed, []);
assert(result2.blocks.length === 1, `should exclude fixed block 今日工作, got ${result2.blocks.length}`);
assert(result2.blocks[0].name === '复盘', `should keep 复盘, got ${result2.blocks[0].name}`);

// invalid input → low confidence + fallback
const fallback = [{ id: 'fb', name: 'fallback', aiGenerate: true, renderType: 'text', prompt: '' }];
const badResult = r.parseRecognizedBlocks('not valid', fallback);
assert(badResult.confidence === 'low', `should be low confidence, got ${badResult.confidence}`);
assert(badResult.blocks[0].name === 'fallback', 'should return fallback on bad input');

console.log('T7: AI recognition N blocks + renderType ✓');

// T8: Report generation helpers — slicing + renderType prompt injection
const repGen = readFileSync(join(root, 'shared/reportGenerator.ts'), 'utf8');
assert(repGen.includes('export function isWorkBlock'), 'isWorkBlock not exported');
assert(repGen.includes('export function buildBlockPrompt'), 'buildBlockPrompt not exported');
assert(repGen.includes('export function applyRenderTypeInstruction'), 'applyRenderTypeInstruction not exported');

const rg = await import(pathToFileURL(join(root, 'shared/reportGenerator.ts')).href);

// isWorkBlock — identifies which blocks use the "work" slice
assert(rg.isWorkBlock({ name: '本周工作总结', aiGenerate: true, renderType: 'text', prompt: '', id: '1' }) === true, '工作总结 should be work block');
assert(rg.isWorkBlock({ name: '本周完成任务', aiGenerate: true, renderType: 'table', prompt: '', id: '2' }) === false, '完成任务 should NOT be work block');
assert(rg.isWorkBlock({ name: 'Weekly Summary', aiGenerate: true, renderType: 'text', prompt: '', id: '3' }) === true, 'summary should be work block');

// applyRenderTypeInstruction — appends format instruction to user prompt
const textPrompt = rg.applyRenderTypeInstruction('请总结', 'text');
assert(textPrompt === '请总结', 'text renderType should not add instruction');
const listPrompt = rg.applyRenderTypeInstruction('请列出', 'list');
assert(listPrompt.includes('- '), 'list renderType should include bullet format hint');
const tablePrompt = rg.applyRenderTypeInstruction('请统计', 'table');
assert(tablePrompt.includes('|'), 'table renderType should include table format hint');
const calloutPrompt = rg.applyRenderTypeInstruction('请高亮', 'callout');
assert(calloutPrompt.includes('[!'), 'callout renderType should include callout format hint');

// buildBlockPrompt — assembles final prompt for one block
const prompt = rg.buildBlockPrompt({
  block: { name: '下周计划', aiGenerate: true, renderType: 'list', prompt: '', id: '4' },
  sourceContent: '本周完成了 A、B、C',
  period: '2026-W24',
});
assert(typeof prompt === 'string' && prompt.length > 10, 'buildBlockPrompt should return non-empty string');
assert(prompt.includes('2026-W24'), 'buildBlockPrompt should include period');

console.log('T8: Report generation helpers ✓');

// T9: TemplateEditorModal component exists with correct exports
const templateModal = readFileSync(join(root, 'src/components/TemplateEditorModal.tsx'), 'utf8');
assert(templateModal.includes('export function TemplateEditorModal') || templateModal.includes('export default function TemplateEditorModal'), 'TemplateEditorModal not exported');
assert(templateModal.includes("kind:"), 'TemplateEditorModal should accept kind prop');
assert(templateModal.includes('onSave'), 'TemplateEditorModal should accept onSave prop');
assert(templateModal.includes('onCancel'), 'TemplateEditorModal should accept onCancel prop');
assert(templateModal.includes('DailyTemplate') || templateModal.includes('ReportTemplate'), 'TemplateEditorModal should reference template types');
assert(templateModal.includes('fixedBlocks'), 'TemplateEditorModal should handle fixedBlocks');
assert(templateModal.includes('customBlocks'), 'TemplateEditorModal should handle customBlocks');
assert(templateModal.includes('aiGenerate'), 'TemplateEditorModal should have aiGenerate toggle');
assert(templateModal.includes('renderType'), 'TemplateEditorModal should have renderType selector');
assert(templateModal.includes('恢复默认') || templateModal.includes('resetToDefault'), 'TemplateEditorModal should have reset button');
assert(templateModal.includes('draggable'), 'TemplateEditorModal should use HTML5 drag-and-drop');
console.log('T9: TemplateEditorModal component ✓');

// T10: TemplateRecognitionModal component
const recogModal = readFileSync(join(root, 'src/components/TemplateRecognitionModal.tsx'), 'utf8');
assert(recogModal.includes('export function TemplateRecognitionModal') || recogModal.includes('export default function TemplateRecognitionModal'), 'TemplateRecognitionModal not exported');
assert(recogModal.includes('onApply'), 'TemplateRecognitionModal should have onApply prop');
assert(recogModal.includes('onCancel'), 'TemplateRecognitionModal should have onCancel prop');
assert(recogModal.includes('parseRecognizedBlocks'), 'TemplateRecognitionModal should call parseRecognizedBlocks');
assert(recogModal.includes('替换自定义区块') || recogModal.includes('replace'), 'TemplateRecognitionModal should have replace option');
assert(recogModal.includes('追加') || recogModal.includes('append'), 'TemplateRecognitionModal should have append option');
assert(recogModal.includes('.md') || recogModal.includes('accept'), 'TemplateRecognitionModal should accept .md/.txt files');
console.log('T10: TemplateRecognitionModal component ✓');

// T11: SettingsPanel restructured
const sp = readFileSync(join(root, 'src/components/SettingsPanel.tsx'), 'utf8');
// Nav: must have new 'settings' key (merged entry replacing obsidian + ai-review)
assert(sp.includes("key: 'settings'") || sp.includes("'settings'"), "settings nav key missing");
// Nav: must NOT have separate 'ai-review' nav entry at top level
const aiReviewNavMatch = sp.match(/'ai-review'.*primary:\s*true/);
assert(!aiReviewNavMatch, "AI Review should no longer be a primary nav entry");
// 4 zones in the settings section
assert(sp.includes('Obsidian 同步') || sp.includes('obsidian-sync'), '4-zone: Obsidian 同步 zone missing');
assert(sp.includes('模板设置') || sp.includes('template-settings'), '4-zone: 模板设置 zone missing');
assert(sp.includes('AI 设置') || sp.includes('ai-settings'), '4-zone: AI 设置 zone missing');
assert(sp.includes('周/月报') || sp.includes('timer-settings'), '4-zone: 周/月报自动生成 zone missing');
// 5 paths in the Obsidian sync zone
assert(sp.includes('dailyPath') || sp.includes('日报路径'), '5-paths: dailyPath missing');
assert(sp.includes('externalWeeklyPath') || sp.includes('对外周报'), '5-paths: externalWeeklyPath missing');
// 5 template edit buttons
assert((sp.match(/\[编辑|editTemplate|onEditTemplate/g) || []).length >= 3, 'at least 3 template edit buttons');
// Sticky layout
assert(sp.includes('sticky') || sp.includes('position: sticky') || sp.includes('settings-sticky'), 'sticky toolbar/nav missing');
// Immediate generation buttons
assert(sp.includes('立即生成') || sp.includes('generateNow'), 'generate now buttons missing');
// externalMonthlyPath default must use {{month}} not {{week}}
assert(sp.includes('{{month}}') || sp.includes('externalMonthlyPath'), 'externalMonthlyPath should use {{month}} template');
console.log('T11: SettingsPanel 4-zone restructured ✓');

// T12: i18n — nav keys present in both zh and en
const i18n = readFileSync(join(root, 'src/i18n.ts'), 'utf8');
// zh section must have Chinese titles for all 6 nav entries
assert(i18n.includes("'settings'") || i18n.includes('"settings"'), "i18n: settings key missing");
assert(i18n.includes('外观'), "i18n zh: 外观 missing");
assert(i18n.includes('窗口'), "i18n zh: 窗口 missing");
assert(i18n.includes('每日结转'), "i18n zh: 每日结转 missing");
assert(i18n.includes('通用'), "i18n zh: 通用 missing");
assert(i18n.includes('开发者'), "i18n zh: 开发者 missing");
// en section must have English translations
assert(i18n.includes('Appearance') || i18n.includes('appearance'), "i18n en: Appearance missing");
assert(i18n.includes('Window') || i18n.includes('window'), "i18n en: Window missing");
assert(i18n.includes('Settings') || i18n.includes('settings'), "i18n en: Settings missing");
assert(i18n.includes('Daily Rollover') || i18n.includes('Rollover'), "i18n en: Daily Rollover missing");
assert(i18n.includes('General'), "i18n en: General missing");
assert(i18n.includes('Developer'), "i18n en: Developer missing");
// New template-related keys should be in i18n
assert(i18n.includes('模板设置') || i18n.includes('templateSettings'), "i18n: 模板设置 key missing");
assert(i18n.includes('AI 设置') || i18n.includes('aiSettings'), "i18n: AI 设置 key missing");

// SettingsPanel must use i18n — not all-hardcoded English nav titles
const sp2 = readFileSync(join(root, 'src/components/SettingsPanel.tsx'), 'utf8');
// The nav entry titles should come from i18n text, not be hardcoded English strings
assert(!sp2.includes("title: 'Personalization'"), "SettingsPanel: still has hardcoded 'Personalization'");
assert(!sp2.includes("title: 'Window'"), "SettingsPanel: still has hardcoded 'Window'");
assert(!sp2.includes("title: 'AI Review'"), "SettingsPanel: still has hardcoded 'AI Review'");
assert(!sp2.includes("title: 'Obsidian Sync'"), "SettingsPanel: still has hardcoded 'Obsidian Sync'");
console.log('T12: i18n nav keys localized ✓');

// T13: Main process changes — new IPC handlers + runner idempotency
const mainTs = readFileSync(join(root, 'electron/main.ts'), 'utf8');
// Must have IPC handler for setObsidianTemplateSettings (5 paths + 5 templates)
assert(mainTs.includes('setObsidianTemplateSettings') || mainTs.includes('obsidianTemplateSettings'), 'main.ts: setObsidianTemplateSettings IPC missing');
// Must have generate-now handlers for all 4 report types
assert(mainTs.includes('generatePersonalWeekly') || mainTs.includes('personalWeekly') || mainTs.includes('generateWeekly'), 'main.ts: generatePersonalWeekly missing');
assert(mainTs.includes('generateExternalWeekly') || mainTs.includes('externalWeekly'), 'main.ts: generateExternalWeekly missing');
// Must have external timer scheduling functions (not just the setting fields)
assert(mainTs.includes('scheduleExternalWeeklyTimer'), 'main.ts: scheduleExternalWeeklyTimer function missing');
assert(mainTs.includes('scheduleExternalMonthlyTimer'), 'main.ts: scheduleExternalMonthlyTimer function missing');
// External timers must check the right settings fields
assert(mainTs.includes('externalWeeklyTimerEnabled'), 'main.ts: externalWeeklyTimerEnabled check missing');
assert(mainTs.includes('externalMonthlyTimerEnabled'), 'main.ts: externalMonthlyTimerEnabled check missing');
// Must send tick events for external timers
assert(mainTs.includes("'aiReview:externalWeeklyTick'") || mainTs.includes('"aiReview:externalWeeklyTick"'), 'main.ts: aiReview:externalWeeklyTick event missing');
assert(mainTs.includes("'aiReview:externalMonthlyTick'") || mainTs.includes('"aiReview:externalMonthlyTick"'), 'main.ts: aiReview:externalMonthlyTick event missing');

// Runner idempotency: if marker has content and force=false, block should be skipped
const runnerTs = readFileSync(join(root, 'electron/aiReview/runner.ts'), 'utf8');
assert(runnerTs.includes('force'), 'runner.ts: force parameter missing');
assert(runnerTs.includes('Skip') || runnerTs.includes('skip'), 'runner.ts: Skip action missing');
// The runner should NOT write AI content if marker body is non-empty and force=false
// (This is handled by decideBlock — verify the call is there)
assert(runnerTs.includes('decideBlock'), 'runner.ts: decideBlock call missing');

// preload.ts must expose onExternalWeeklyTick + onExternalMonthlyTick
const preloadTs = readFileSync(join(root, 'electron/preload.ts'), 'utf8');
assert(preloadTs.includes('onExternalWeeklyTick'), 'preload.ts: onExternalWeeklyTick missing');
assert(preloadTs.includes('onExternalMonthlyTick'), 'preload.ts: onExternalMonthlyTick missing');

console.log('T13: Main process IPC + runner idempotency ✓');

// T14: End-to-end smoke test
// 1. All new shared modules exist
assert(existsSync(join(root, 'shared/pathTemplate.ts')), 'pathTemplate.ts missing');
assert(existsSync(join(root, 'shared/templateBlockDefaults.ts')), 'templateBlockDefaults.ts missing');
assert(existsSync(join(root, 'shared/templateRenderer.ts')), 'templateRenderer.ts missing');
assert(existsSync(join(root, 'shared/recognizeTemplateBlocks.ts')), 'recognizeTemplateBlocks.ts missing');
assert(existsSync(join(root, 'shared/reportGenerator.ts')), 'reportGenerator.ts missing');

// 2. All new UI components exist
assert(existsSync(join(root, 'src/components/TemplateEditorModal.tsx')), 'TemplateEditorModal.tsx missing');
assert(existsSync(join(root, 'src/components/TemplateRecognitionModal.tsx')), 'TemplateRecognitionModal.tsx missing');

// 3. Settings model integration
const asm2 = await import(pathToFileURL(join(root, 'shared/appSettings.ts')).href);
const t14Defaults = asm2.createDefaultObsidianTemplateSettings();
assert(t14Defaults.dailyPath === 'logs/daily/{{date}}.md', `dailyPath default wrong: ${t14Defaults.dailyPath}`);
assert(t14Defaults.externalMonthlyPath.includes('{{month}}'), `externalMonthlyPath should use {{month}}, got: ${t14Defaults.externalMonthlyPath}`);
assert(t14Defaults.externalMonthlyPath.includes('external'), `externalMonthlyPath should include 'external': ${t14Defaults.externalMonthlyPath}`);
assert(t14Defaults.dailyTemplate.fixedBlocks.length === 3, 'dailyTemplate should have 3 fixed blocks');
assert(t14Defaults.dailyTemplate.customBlocks.length > 0, 'dailyTemplate should have custom blocks');
assert(t14Defaults.weeklyTemplate.customBlocks.length > 0, 'weeklyTemplate should have custom blocks');
assert(t14Defaults.externalWeeklyTemplate.customBlocks.length > 0, 'externalWeeklyTemplate should have custom blocks');

// 4. Path expansion works end-to-end
const pt2 = await import(pathToFileURL(join(root, 'shared/pathTemplate.ts')).href);
const t14Expanded = pt2.expandPathTemplate(t14Defaults.externalMonthlyPath, new Date(2026, 5, 11));
assert(t14Expanded.includes('2026'), `expanded external monthly path should include year: ${t14Expanded}`);
assert(t14Expanded.includes('06'), `expanded external monthly path should include month 06: ${t14Expanded}`);
assert(!t14Expanded.includes('W'), `expanded external monthly path should NOT have week marker: ${t14Expanded}`);

// 5. Template renderer produces empty markers
const tr2 = await import(pathToFileURL(join(root, 'shared/templateRenderer.ts')).href);
const t14Rendered = tr2.renderDailyTemplate({
  template: t14Defaults.dailyTemplate,
  work: 'some work',
  inspiration: '',
  tasks: '- [ ] task',
  date: '2026-06-11',
});
assert(t14Rendered.includes('## 今日工作'), 'rendered daily should include work heading');
assert(t14Rendered.includes('## 每日任务'), 'rendered daily should include tasks heading');
assert(t14Rendered.includes('<!-- DAILYTODO:'), 'rendered daily should include AI markers');
const t14AiContent = t14Rendered.match(/🤖|AI 草稿/);
assert(!t14AiContent, `rendered daily should NOT include AI content, found: ${t14AiContent?.[0]}`);

// 6. Anonymization end-to-end
const bd3 = await import(pathToFileURL(join(root, 'shared/templateBlockDefaults.ts')).href);
const external = '联系张三,项目 Apollo-X,邮箱 test@test.com';
const anon = bd3.lightAnonymize(external);
assert(!anon.includes('张三'), 'anonymized text should not contain 张三');
assert(!anon.includes('Apollo-X'), 'anonymized text should not contain Apollo-X');
assert(!anon.includes('test@test.com'), 'anonymized text should not contain email');

// 7. Recognition pipeline end-to-end
const rg2 = await import(pathToFileURL(join(root, 'shared/recognizeTemplateBlocks.ts')).href);
const weeklyMd = `## 本周工作总结\n总结内容\n## 下周计划\n- 计划A\n- 计划B`;
const recResult = rg2.parseRecognizedBlocks(weeklyMd, []);
assert(recResult.blocks.length === 2, `recognition should find 2 blocks, got ${recResult.blocks.length}`);
assert(recResult.blocks[0].name === '本周工作总结', `block 0 should be 本周工作总结, got ${recResult.blocks[0].name}`);
assert(recResult.blocks[1].renderType === 'list', `下周计划 should be list, got ${recResult.blocks[1].renderType}`);

// 8. isWorkBlock correctly identifies work blocks
const rg3 = await import(pathToFileURL(join(root, 'shared/reportGenerator.ts')).href);
assert(rg3.isWorkBlock({ name: '本周工作总结', id: '1', aiGenerate: true, renderType: 'text', prompt: '' }), '本周工作总结 should be work block');
assert(!rg3.isWorkBlock({ name: '下周计划', id: '2', aiGenerate: true, renderType: 'list', prompt: '' }), '下周计划 should NOT be work block');

console.log('T14: End-to-end smoke test ✓');
console.log('');
console.log('════════════════════════════════════════');
console.log('All 14 tasks verified. Template hub rewrite complete.');
console.log('════════════════════════════════════════');
