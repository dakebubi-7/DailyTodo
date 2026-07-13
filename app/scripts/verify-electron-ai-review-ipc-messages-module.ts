import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'aiReviewIpcMessages.ts');
const ipcPath = join(root, 'electron', 'aiReviewIpc.ts');
const externalReportPath = join(root, 'electron', 'aiReviewExternalReportIpc.ts');
const monthlyReportPath = join(root, 'electron', 'aiReviewMonthlyReportIpc.ts');
const weeklyReportPath = join(root, 'electron', 'aiReviewWeeklyReportIpc.ts');
const completionPath = join(root, 'electron', 'aiReviewReportIpcCompletion.ts');
const noSourceFailurePath = join(root, 'electron', 'aiReviewReportIpcNoSourceFailure.ts');
const preflightPath = join(root, 'electron', 'aiReviewReportIpcPreflight.ts');
const prepareProgressPath = join(root, 'electron', 'aiReviewReportIpcPrepareProgress.ts');
const templateToolsPath = join(root, 'electron', 'aiReviewTemplateToolsIpc.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron AI Review IPC messages module should exist.');

const messagesModule = await import('../electron/aiReviewIpcMessages');
const messages = readFileSync(modulePath, 'utf8');
const ipc = readFileSync(ipcPath, 'utf8');
const externalReport = existsSync(externalReportPath) ? readFileSync(externalReportPath, 'utf8') : '';
const monthlyReport = existsSync(monthlyReportPath) ? readFileSync(monthlyReportPath, 'utf8') : '';
const weeklyReport = existsSync(weeklyReportPath) ? readFileSync(weeklyReportPath, 'utf8') : '';
const completion = existsSync(completionPath) ? readFileSync(completionPath, 'utf8') : '';
const noSourceFailure = existsSync(noSourceFailurePath) ? readFileSync(noSourceFailurePath, 'utf8') : '';
const preflight = existsSync(preflightPath) ? readFileSync(preflightPath, 'utf8') : '';
const prepareProgress = existsSync(prepareProgressPath) ? readFileSync(prepareProgressPath, 'utf8') : '';
const templateTools = existsSync(templateToolsPath) ? readFileSync(templateToolsPath, 'utf8') : '';
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

const expectedConstants: Record<string, string> = {
  PREPARE_MATERIALS_LABEL: '准备复盘材料',
  REQUEST_AI_LABEL: '请求 AI',
  WRITE_OBSIDIAN_LABEL: '写入 Obsidian',
  READ_WEEKLY_SOURCES_MESSAGE: '读取本周日报素材',
  READ_MONTHLY_SOURCES_MESSAGE: '读取本月周报/日报素材',
  WAIT_WEEKLY_REPORT_MESSAGE: '等待模型生成周报',
  WAIT_MONTHLY_REPORT_MESSAGE: '等待模型生成月报',
  RECEIVED_WEEKLY_REPORT_MESSAGE: '已收到 AI 周报',
  RECEIVED_MONTHLY_REPORT_MESSAGE: '已收到 AI 月报',
  WEEKLY_WRITTEN_MESSAGE: '周报已写入',
  MONTHLY_WRITTEN_MESSAGE: '月报已写入',
  AI_REVIEW_DISABLED_ERROR: 'AI 复盘未启用或缺少 Key',
  TEMPLATE_CONTENT_REQUIRED_ERROR: '请粘贴你的模板内容',
  REPORT_TEMPLATE_REQUIRED_ERROR: '请粘贴你的报告模板',
  RECOGNIZE_REPORT_PROMPT_ERROR: '未能识别出可用的生成指令',
  PICK_TEMPLATE_FILE_TITLE: '选择模板文件（.md / .txt / .docx）',
  PICK_TEMPLATE_FILE_FILTER: '模板文件',
};

const messageImport = ipc.match(/import \{(?<imports>[^}]+)\} from '\.\/aiReviewIpcMessages';/s);
const importedNames = messageImport?.groups?.imports ?? '';
const externalReportMessageImport = externalReport.match(/import \{(?<imports>[^}]+)\} from '\.\/aiReviewIpcMessages';/s);
const externalReportImportedNames = externalReportMessageImport?.groups?.imports ?? '';
const monthlyReportMessageImport = monthlyReport.match(/import \{(?<imports>[^}]+)\} from '\.\/aiReviewIpcMessages';/s);
const monthlyReportImportedNames = monthlyReportMessageImport?.groups?.imports ?? '';
const weeklyReportMessageImport = weeklyReport.match(/import \{(?<imports>[^}]+)\} from '\.\/aiReviewIpcMessages';/s);
const weeklyReportImportedNames = weeklyReportMessageImport?.groups?.imports ?? '';
const completionMessageImport = completion.match(/import \{(?<imports>[^}]+)\} from '\.\/aiReviewIpcMessages';/s);
const completionImportedNames = completionMessageImport?.groups?.imports ?? '';
const noSourceFailureMessageImport = noSourceFailure.match(/import \{(?<imports>[^}]+)\} from '\.\/aiReviewIpcMessages';/s);
const noSourceFailureImportedNames = noSourceFailureMessageImport?.groups?.imports ?? '';
const preflightMessageImport = preflight.match(/import \{(?<imports>[^}]+)\} from '\.\/aiReviewIpcMessages';/s);
const preflightImportedNames = preflightMessageImport?.groups?.imports ?? '';
const prepareProgressMessageImport = prepareProgress.match(/import \{(?<imports>[^}]+)\} from '\.\/aiReviewIpcMessages';/s);
const prepareProgressImportedNames = prepareProgressMessageImport?.groups?.imports ?? '';
const templateToolsMessageImport = templateTools.match(/import \{(?<imports>[^}]+)\} from '\.\/aiReviewIpcMessages';/s);
const templateToolsImportedNames = templateToolsMessageImport?.groups?.imports ?? '';

for (const [name, value] of Object.entries(expectedConstants)) {
  assert.match(messages, new RegExp(`export const ${name}\\b`), `messages module should export ${name}.`);
  assert.equal(messagesModule[name], value, `${name} should preserve its existing text value.`);
  assert.match(
    `${importedNames}\n${externalReportImportedNames}\n${monthlyReportImportedNames}\n${weeklyReportImportedNames}\n${completionImportedNames}\n${noSourceFailureImportedNames}\n${preflightImportedNames}\n${prepareProgressImportedNames}\n${templateToolsImportedNames}`,
    new RegExp(`\\b${name}\\b`),
    `AI Review IPC consumers should import ${name} from the messages module.`,
  );
  assert.doesNotMatch(ipc, new RegExp(`const ${name}\\b`), `AI Review IPC module should not keep ${name} inline after extraction.`);
  assert.doesNotMatch(externalReport, new RegExp(`const ${name}\\b`), `AI Review external report IPC module should not redefine ${name} inline.`);
  assert.doesNotMatch(monthlyReport, new RegExp(`const ${name}\\b`), `AI Review monthly report IPC module should not redefine ${name} inline.`);
  assert.doesNotMatch(weeklyReport, new RegExp(`const ${name}\\b`), `AI Review weekly report IPC module should not redefine ${name} inline.`);
  assert.doesNotMatch(completion, new RegExp(`const ${name}\\b`), `AI Review report IPC completion helper should not redefine ${name} inline.`);
  assert.doesNotMatch(noSourceFailure, new RegExp(`const ${name}\\b`), `AI Review report IPC no-source failure helper should not redefine ${name} inline.`);
  assert.doesNotMatch(preflight, new RegExp(`const ${name}\\b`), `AI Review report IPC preflight helper should not redefine ${name} inline.`);
  assert.doesNotMatch(prepareProgress, new RegExp(`const ${name}\\b`), `AI Review report IPC prepare-progress helper should not redefine ${name} inline.`);
  assert.doesNotMatch(templateTools, new RegExp(`const ${name}\\b`), `AI Review template/tools IPC module should not redefine ${name} inline.`);
}

assert.match(preflight, /emitAiReviewProgress\(reportKind, 'prepareMaterials', PREPARE_MATERIALS_LABEL, 'running', prepareMessage\)/, 'AI Review report preflight helper should keep using the extracted preparation label.');
assert.match(prepareProgress, /emitAiReviewProgress\(reportKind, 'prepareMaterials', PREPARE_MATERIALS_LABEL, 'completed', sourceCharsMessage\)/, 'AI Review report prepare-progress helper should keep using the extracted preparation label.');
assert.match(noSourceFailure, /emitAiReviewProgress\(reportKind, 'prepareMaterials', PREPARE_MATERIALS_LABEL, 'failed', NO_SOURCE_MATERIALS_ERROR\.zh\)/, 'AI Review report no-source failure helper should keep using the extracted preparation label.');
assert.match(monthlyReport, /WAIT_MONTHLY_REPORT_MESSAGE/, 'AI Review monthly report IPC should keep using the extracted monthly wait text.');
assert.match(monthlyReport, /MONTHLY_WRITTEN_MESSAGE/, 'AI Review monthly report IPC should keep using the extracted monthly written text.');
assert.match(completion, /WRITE_OBSIDIAN_LABEL/, 'AI Review report completion helper should keep using the extracted write-Obsidian label.');
assert.match(preflight, /REQUEST_AI_LABEL/, 'AI Review report preflight helper should keep using the extracted request-AI label.');
assert.match(preflight, /WRITE_OBSIDIAN_LABEL/, 'AI Review report preflight helper should keep using the extracted write-Obsidian label.');
assert.match(externalReport, /return \{ ok: false, error: AI_REVIEW_DISABLED_ERROR \}/, 'AI Review external report IPC should keep using the extracted disabled error.');
assert.match(templateTools, /return \{ ok: false, error: AI_REVIEW_DISABLED_ERROR, sections: fallback, unmatched: true \}/, 'AI Review template/tools IPC should keep using the extracted disabled error for template recognition.');
assert.match(templateTools, /title: zh\(PICK_TEMPLATE_FILE_TITLE\)/, 'AI Review template/tools IPC should keep localizing the extracted picker title.');
assert.match(templateTools, /name: zh\(PICK_TEMPLATE_FILE_FILTER\)/, 'AI Review template/tools IPC should keep localizing the extracted picker filter.');

assert.equal(
  scripts['verify:electron-ai-review-ipc-messages-module'],
  'tsx scripts/verify-electron-ai-review-ipc-messages-module.ts',
  'package.json should expose the focused AI Review IPC messages verifier.',
);
assertCleanupCoreIncludes('verify:electron-ai-review-ipc-messages-module', 'cleanup-core should include the focused AI Review IPC messages verifier.');

console.log('electron AI Review IPC messages module verification passed');
