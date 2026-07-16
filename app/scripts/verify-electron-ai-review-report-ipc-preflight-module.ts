import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'aiReviewReportIpcPreflight.ts');
const weeklyPath = join(root, 'electron', 'aiReviewWeeklyReportIpc.ts');
const monthlyPath = join(root, 'electron', 'aiReviewMonthlyReportIpc.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron AI Review report IPC preflight helper module should exist.');

const moduleSource = readFileSync(modulePath, 'utf8');
const weekly = readFileSync(weeklyPath, 'utf8');
const monthly = readFileSync(monthlyPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(moduleSource, /export type StartReportPreflightOptions\b/, 'report IPC preflight helper should export explicit options.');
assert.match(moduleSource, /export function startReportPreflight\b/, 'report IPC preflight helper should export startReportPreflight.');
assert.match(moduleSource, /const startedAt = Date\.now\(\)/, 'report IPC preflight helper should preserve started-at timing.');
assert.match(moduleSource, /emitAiReviewProgress\(reportKind, 'prepareMaterials', PREPARE_MATERIALS_LABEL, 'running', prepareMessage\)/, 'report IPC preflight helper should preserve prepare-materials running progress emission.');
assert.match(moduleSource, /const settings = getAiReviewSettings\(\)/, 'report IPC preflight helper should preserve AI Review settings loading.');
assert.match(moduleSource, /const llm = ensureReportLlmAvailable\(reportKind\)/, 'report IPC preflight helper should preserve report account resolution.');
assert.match(moduleSource, /emitAiReviewProgress\(reportKind, 'requestAi', REQUEST_AI_LABEL, 'failed', llm\.error\)/, 'report IPC preflight helper should preserve failed request-AI progress emission.');
assert.match(moduleSource, /const vaultStatus = getVaultStatus\(\)/, 'report IPC preflight helper should preserve vault-status lookup.');
assert.match(moduleSource, /const vaultError = vaultStatus\.ok[\s\S]*?\? 'Obsidian vault path is missing\.'[\s\S]*?: \(vaultStatus\.reason \|\| 'Obsidian vault path is missing\.'\);/, 'report IPC preflight helper should normalize both unavailable and missing vault-path failures.');
assert.match(moduleSource, /emitAiReviewProgress\(reportKind, 'writeObsidian', WRITE_OBSIDIAN_LABEL, 'failed', vaultError\)/, 'report IPC preflight helper should preserve failed write-Obsidian progress emission for normalized vault failures.');
assert.match(moduleSource, /return \{ ok: true, startedAt, settings, llm, vaultPath: vaultStatus\.vaultPath \}/, 'report IPC preflight helper should preserve the successful preflight return shape.');

for (const source of [weekly, monthly]) {
  assert.match(source, /from '\.\/aiReviewReportIpcPreflight'/, 'weekly/monthly report IPC modules should import the shared report preflight helper.');
  assert.match(source, /const preflight = startReportPreflight\(\{/, 'weekly/monthly report IPC modules should build report preflight data through the shared helper.');
  assert.match(source, /if \(!preflight\.ok\) \{\s*return preflight\.result;\s*\}/s, 'weekly/monthly report IPC modules should return shared preflight failures directly.');
  assert.match(source, /const \{ startedAt, settings, llm, vaultPath \} = preflight/, 'weekly/monthly report IPC modules should read successful preflight data from the shared helper.');
}

assert.match(weekly, /prepareMessage:\s*READ_WEEKLY_SOURCES_MESSAGE/, 'weekly report IPC module should pass weekly source-read text to the shared preflight helper.');
assert.doesNotMatch(weekly, /const startedAt = Date\.now\(\)/, 'weekly report IPC module should not keep inline started-at timing after preflight-helper extraction.');
assert.doesNotMatch(weekly, /emitAiReviewProgress\('weekly', 'prepareMaterials', PREPARE_MATERIALS_LABEL, 'running', READ_WEEKLY_SOURCES_MESSAGE\)/, 'weekly report IPC module should not keep inline prepare-materials running progress after preflight-helper extraction.');
assert.doesNotMatch(weekly, /const llm = ensureReportLlmAvailable\('weekly'\)/, 'weekly report IPC module should not keep inline LLM availability resolution after preflight-helper extraction.');
assert.doesNotMatch(weekly, /const vaultStatus = getVaultStatus\(\)/, 'weekly report IPC module should not keep inline vault-status lookup after preflight-helper extraction.');
assert.doesNotMatch(weekly, /stage\('requestAi', REQUEST_AI_LABEL, 'failed', undefined, llm\.error\)/, 'weekly report IPC module should not keep inline failed request-AI stage creation after preflight-helper extraction.');

assert.match(monthly, /prepareMessage:\s*READ_MONTHLY_SOURCES_MESSAGE/, 'monthly report IPC module should pass monthly source-read text to the shared preflight helper.');
assert.doesNotMatch(monthly, /const startedAt = Date\.now\(\)/, 'monthly report IPC module should not keep inline started-at timing after preflight-helper extraction.');
assert.doesNotMatch(monthly, /emitAiReviewProgress\('monthly', 'prepareMaterials', PREPARE_MATERIALS_LABEL, 'running', READ_MONTHLY_SOURCES_MESSAGE\)/, 'monthly report IPC module should not keep inline prepare-materials running progress after preflight-helper extraction.');
assert.doesNotMatch(monthly, /const llm = ensureReportLlmAvailable\('monthly'\)/, 'monthly report IPC module should not keep inline LLM availability resolution after preflight-helper extraction.');
assert.doesNotMatch(monthly, /const vaultStatus = getVaultStatus\(\)/, 'monthly report IPC module should not keep inline vault-status lookup after preflight-helper extraction.');
assert.doesNotMatch(monthly, /stage\('requestAi', REQUEST_AI_LABEL, 'failed', undefined, llm\.error\)/, 'monthly report IPC module should not keep inline failed request-AI stage creation after preflight-helper extraction.');

const preflightHelper = await import('../electron/aiReviewReportIpcPreflight');
const { PREPARE_MATERIALS_LABEL, REQUEST_AI_LABEL, WRITE_OBSIDIAN_LABEL } = await import('../electron/aiReviewIpcMessages');

const realDateNow = Date.now;
try {
  Date.now = () => 1000;
  const successSettings = { weeklySourceMode: 'daily-notes' } as any;
  const successResolution = { source: 'default' } as any;
  const successCallLlm = async () => ({ ok: true as const, content: 'ok' });
  const successEvents: any[] = [];
  const successResult = preflightHelper.startReportPreflight({
    reportKind: 'weekly',
    prepareMessage: 'read weekly',
    getAiReviewSettings: () => successSettings,
    ensureReportLlmAvailable: () => ({ ok: true, callLlm: successCallLlm, resolution: successResolution }),
    getVaultStatus: () => ({ ok: true, vaultPath: 'C:/vault' }),
    emitAiReviewProgress: (...args: any[]) => successEvents.push(args),
    stage: () => {
      throw new Error('stage should not run for successful preflight');
    },
    createDiagnostic: () => {
      throw new Error('createDiagnostic should not run for successful preflight');
    },
  });
  assert.deepEqual(
    successEvents,
    [['weekly', 'prepareMaterials', PREPARE_MATERIALS_LABEL, 'running', 'read weekly']],
    'report IPC preflight helper should emit prepare-materials running progress for successful preflight.',
  );
  assert.equal(successResult.ok, true, 'report IPC preflight helper should succeed when LLM and vault are available.');
  if (successResult.ok) {
    assert.equal(successResult.startedAt, 1000, 'report IPC preflight helper should preserve started-at timing on success.');
    assert.equal(successResult.settings, successSettings, 'report IPC preflight helper should return loaded settings on success.');
    assert.equal(successResult.llm.callLlm, successCallLlm, 'report IPC preflight helper should return the resolved LLM caller on success.');
    assert.equal(successResult.llm.resolution, successResolution, 'report IPC preflight helper should preserve successful LLM resolution on success.');
    assert.equal(successResult.vaultPath, 'C:/vault', 'report IPC preflight helper should return the vault path on success.');
  }

  Date.now = () => 2000;
  const accountResolution = { source: 'profile', profileId: 'missing' } as any;
  const accountEvents: any[] = [];
  const accountStageCalls: any[] = [];
  const accountDiagnosticCalls: any[] = [];
  const accountResult = preflightHelper.startReportPreflight({
    reportKind: 'monthly',
    prepareMessage: 'read monthly',
    getAiReviewSettings: () => ({ monthlySourceMode: 'weekly-reports' } as any),
    ensureReportLlmAvailable: () => ({ ok: false, error: 'missing account', resolution: accountResolution }),
    getVaultStatus: () => {
      throw new Error('vault status should not be queried when account resolution fails');
    },
    emitAiReviewProgress: (...args: any[]) => accountEvents.push(args),
    stage: (...args: any[]) => {
      accountStageCalls.push(args);
      return { key: args[0], label: args[1], status: args[2], durationMs: args[3], message: args[4] };
    },
    createDiagnostic: (params: any) => {
      accountDiagnosticCalls.push(params);
      return { id: 'account-diagnostic' };
    },
  });
  assert.deepEqual(
    accountEvents,
    [
      ['monthly', 'prepareMaterials', PREPARE_MATERIALS_LABEL, 'running', 'read monthly'],
      ['monthly', 'requestAi', REQUEST_AI_LABEL, 'failed', 'missing account'],
    ],
    'report IPC preflight helper should emit prepare-materials running and failed request-AI progress for account failures.',
  );
  assert.deepEqual(
    accountStageCalls,
    [['requestAi', REQUEST_AI_LABEL, 'failed', undefined, 'missing account']],
    'report IPC preflight helper should preserve failed request-AI stage construction for account failures.',
  );
  assert.deepEqual(
    accountDiagnosticCalls,
    [{
      reportKind: 'monthly',
      startedAt: 2000,
      finalStatus: 'accountUnavailable',
      resolution: accountResolution,
      stages: [{ key: 'requestAi', label: REQUEST_AI_LABEL, status: 'failed', durationMs: undefined, message: 'missing account' }],
      sourceChars: undefined,
      error: 'missing account',
    }],
    'report IPC preflight helper should preserve account-unavailable diagnostic construction.',
  );
  assert.deepEqual(
    accountResult,
    { ok: false, result: { ok: false, error: 'missing account', diagnostic: { id: 'account-diagnostic' } } },
    'report IPC preflight helper should preserve the account failure return shape.',
  );

  Date.now = () => 3000;
  const vaultResolution = { source: 'default' } as any;
  const vaultEvents: any[] = [];
  const vaultDiagnosticCalls: any[] = [];
  const vaultResult = preflightHelper.startReportPreflight({
    reportKind: 'weekly',
    prepareMessage: 'read weekly',
    getAiReviewSettings: () => ({ weeklySourceMode: 'daily-notes' } as any),
    ensureReportLlmAvailable: () => ({ ok: true, callLlm: async () => ({ ok: true as const, content: 'ok' }), resolution: vaultResolution }),
    getVaultStatus: () => ({ ok: false, reason: 'vault unavailable' }),
    emitAiReviewProgress: (...args: any[]) => vaultEvents.push(args),
    stage: () => {
      throw new Error('stage should not run for vault failures');
    },
    createDiagnostic: (params: any) => {
      vaultDiagnosticCalls.push(params);
      return { id: 'vault-diagnostic' };
    },
  });
  assert.deepEqual(
    vaultEvents,
    [
      ['weekly', 'prepareMaterials', PREPARE_MATERIALS_LABEL, 'running', 'read weekly'],
      ['weekly', 'writeObsidian', WRITE_OBSIDIAN_LABEL, 'failed', 'vault unavailable'],
    ],
    'report IPC preflight helper should emit failed write-Obsidian progress for vault failures.',
  );
  assert.deepEqual(
    vaultDiagnosticCalls,
    [{
      reportKind: 'weekly',
      startedAt: 3000,
      finalStatus: 'writeFailed',
      resolution: vaultResolution,
      stages: [],
      sourceChars: undefined,
      error: 'vault unavailable',
    }],
    'report IPC preflight helper should preserve vault write-failure diagnostic construction.',
  );
  assert.deepEqual(
    vaultResult,
    { ok: false, result: { ok: false, error: 'vault unavailable', diagnostic: { id: 'vault-diagnostic' } } },
    'report IPC preflight helper should preserve the vault failure return shape.',
  );
} finally {
  Date.now = realDateNow;
}

assert.equal(
  scripts['verify:electron-ai-review-report-ipc-preflight-module'],
  'tsx scripts/verify-electron-ai-review-report-ipc-preflight-module.ts',
  'package.json should expose the focused AI Review report IPC preflight helper verifier.',
);
assertCleanupCoreIncludes('verify:electron-ai-review-report-ipc-preflight-module', 'cleanup-core should include the focused AI Review report IPC preflight helper verifier.');

console.log('electron AI Review report IPC preflight helper verification passed');
