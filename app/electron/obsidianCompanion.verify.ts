import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  buildSyncPlan,
  importMobileInbox,
  matchesRule,
  renderTemplate,
  writeSyncPlan,
} from './obsidianCompanion';
import { createDefaultCompanionSettings, normalizeCompanionSettings } from '../shared/obsidianCompanionDefaults';
import { CaptureItem, isWriteMode } from '../shared/obsidianCompanion';
import { readFileSync } from 'fs';

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const item: CaptureItem = {
  id: 'task-1',
  type: 'task',
  content: 'Review inbox',
  tags: ['work', '#focus'],
  priority: 'high',
  source: 'desktop',
  status: 'new',
  createdAt: '2026-05-26T08:30:00.000Z',
};

const rendered = renderTemplate('{{date}} {{content}} {{tags}} {{priority}}', item);
assert(rendered.includes('2026-05-26'), 'template should render date');
assert(rendered.includes('Review inbox'), 'template should render content');
assert(rendered.includes('#work #focus'), 'template should normalize tags');
assert(rendered.includes('high'), 'template should render priority');
const flexibleRendered = renderTemplate('{{ DATE }} {{Content}} {{ TAGS }} {{PRIORITY}} {{ CREATEDAT }}', item);
assert(flexibleRendered.includes('2026-05-26'), 'template should render spaced uppercase date tokens');
assert(flexibleRendered.includes('Review inbox'), 'template should render mixed-case content tokens');
assert(flexibleRendered.includes('#work #focus'), 'template should render spaced uppercase tags tokens');
assert(flexibleRendered.includes('high'), 'template should render uppercase priority tokens');
assert(flexibleRendered.includes('2026-05-26T08:30:00.000Z'), 'template should render uppercase createdAt tokens');

const companionTemplateRulesSource = readFileSync(path.join(process.cwd(), 'electron/obsidianCompanionTemplateRules.ts'), 'utf8');
assert(
  !companionTemplateRulesSource.includes('Object.entries(replacements).map'),
  'Capture template rendering should not allocate entry and map arrays for its fixed replacement fields.',
);
assert(
  !companionTemplateRulesSource.includes('new Map('),
  'Capture template rendering should use direct fixed-field lookup instead of creating a map per render.',
);

assert(
  matchesRule(item, {
    id: 'rule-1',
    name: 'High focus tasks',
    enabled: true,
    priority: 1,
    when: { type: 'task', tagsAll: ['focus'], containsAny: ['inbox'] },
    write: { target: 'Daily.md', templateId: 'daily-task-line', mode: 'append' },
    afterMatch: 'continue',
  }),
  'rule should match type, tags, and content'
);

const vaultPath = fs.mkdtempSync(path.join(os.tmpdir(), 'dailytodo-companion-'));
const settings = createDefaultCompanionSettings(vaultPath);
const plan = buildSyncPlan(settings, [item]);
assert(plan.ok, plan.errors.join(' '));
assert(plan.changes.length === 1, 'plan should contain one task write');
assert(plan.changes[0].filePath.startsWith(vaultPath), 'target should stay inside vault');

fs.mkdirSync(path.dirname(plan.changes[0].filePath), { recursive: true });
fs.writeFileSync(plan.changes[0].filePath, 'existing target', 'utf-8');
const originalTargetPlanExistsSync = fs.existsSync;
let targetExistsChecks = 0;
try {
  fs.existsSync = ((target: fs.PathLike) => {
    if (String(target) === plan.changes[0].filePath) targetExistsChecks += 1;
    return originalTargetPlanExistsSync(target);
  }) as typeof fs.existsSync;
  const existingTargetPlan = buildSyncPlan(settings, [item]);
  assert(existingTargetPlan.ok, existingTargetPlan.errors.join(' '));
  assert(existingTargetPlan.changes[0].action === 'update-file', 'existing file targets should remain updates');
} finally {
  fs.existsSync = originalTargetPlanExistsSync;
}
assert(targetExistsChecks === 1, 'buildSyncPlan should inspect each existing target path once per matched rule');

const writeResult = writeSyncPlan(plan);
assert(writeResult.ok, writeResult.errors.join(' '));
assert(fs.existsSync(plan.changes[0].filePath), 'sync should create target file');
const written = fs.readFileSync(plan.changes[0].filePath, 'utf-8');
assert(written.includes('## Daily Tasks'), 'sync should create target section');
assert(written.includes('Review inbox'), 'sync should write rendered content');

const flexibleTargetPlan = buildSyncPlan(
  {
    ...settings,
    rules: [
      {
        ...settings.rules[0],
        write: { ...settings.rules[0].write, target: 'logs/daily/{{ DATE }}.md' },
      },
    ],
    templates: [
      {
        id: 'daily-task-line',
        name: 'Flexible line',
        body: '- [ ] {{ Content }} {{ TAGS }}',
      },
    ],
  },
  [item],
);
assert(flexibleTargetPlan.ok, flexibleTargetPlan.errors.join(' '));
assert(
  flexibleTargetPlan.changes[0].filePath.endsWith(path.join('logs', 'daily', '2026-05-26.md')),
  'Companion target paths should expand spaced uppercase date tokens',
);
assert(
  flexibleTargetPlan.changes[0].content.includes('Review inbox #work #focus'),
  'Companion template bodies should expand spaced/mixed-case tokens',
);

const traversalPlan = buildSyncPlan(
  {
    ...settings,
    rules: [
      {
        ...settings.rules[0],
        write: { ...settings.rules[0].write, target: '../outside.md' },
      },
    ],
  },
  [item]
);
assert(!traversalPlan.ok, 'path traversal should be rejected');
assert(traversalPlan.errors.some((error) => error.includes('escapes')), 'path traversal error should be explicit');

const absolutePathPlan = buildSyncPlan(
  {
    ...settings,
    rules: [
      {
        ...settings.rules[0],
        write: { ...settings.rules[0].write, target: 'C:/secret/{{date}}.md' },
      },
    ],
  },
  [item]
);
assert(!absolutePathPlan.ok, 'absolute Windows target paths should be rejected before filename sanitization');
assert(
  absolutePathPlan.errors.some((error) => error.includes('relative to the vault')),
  'absolute target path error should be explicit',
);

const directoryBackedPlanVault = fs.mkdtempSync(path.join(os.tmpdir(), 'dailytodo-companion-plan-dir-target-'));
const directoryBackedPlanSettings = createDefaultCompanionSettings(directoryBackedPlanVault);
const directoryBackedPlanTarget = path.join(directoryBackedPlanVault, 'logs', 'daily', 'DailyTodo', '2026-05-26.md');
fs.mkdirSync(directoryBackedPlanTarget, { recursive: true });
const directoryBackedTargetPlan = buildSyncPlan(directoryBackedPlanSettings, [item]);
assert(!directoryBackedTargetPlan.ok, 'buildSyncPlan should reject existing directory-backed target paths');
assert(
  directoryBackedTargetPlan.errors.some((error) => /file|directory/i.test(error)),
  'buildSyncPlan directory-target errors should explain that the target must be a file',
);
assert(
  directoryBackedTargetPlan.changes.length === 0,
  'buildSyncPlan should not emit changes for directory-backed target paths',
);

let malformedRuntimeSettingsThrew = false;
let malformedRuntimeSettingsPlan: ReturnType<typeof buildSyncPlan> | undefined;
try {
  malformedRuntimeSettingsPlan = buildSyncPlan(
    {
      ...settings,
      rules: 'not-rules',
      templates: null,
    } as never,
    [item],
  );
} catch {
  malformedRuntimeSettingsThrew = true;
}
assert(
  !malformedRuntimeSettingsThrew,
  'buildSyncPlan should not throw when runtime Companion settings have malformed rules/templates collections',
);
assert(
  malformedRuntimeSettingsPlan && !malformedRuntimeSettingsPlan.ok,
  'buildSyncPlan should return a structured failure for malformed runtime Companion settings',
);
assert(
  malformedRuntimeSettingsPlan?.errors.some((error) => /rules|templates|settings/i.test(error)),
  'malformed runtime Companion settings errors should mention rules/templates/settings',
);
assert(
  malformedRuntimeSettingsPlan?.changes.length === 0,
  'buildSyncPlan should not emit changes for malformed runtime Companion settings',
);

let malformedRuntimeElementsThrew = false;
let malformedRuntimeElementsPlan: ReturnType<typeof buildSyncPlan> | undefined;
try {
  malformedRuntimeElementsPlan = buildSyncPlan(
    {
      ...settings,
      rules: [
        {
          id: 'bad-runtime-rule',
          name: 'Bad runtime rule',
          enabled: true,
          priority: 1,
          when: { type: 'task' },
          write: null,
          afterMatch: 'continue',
        },
      ],
      templates: [{ id: 123, body: null }],
    } as never,
    [item],
  );
} catch {
  malformedRuntimeElementsThrew = true;
}
assert(
  !malformedRuntimeElementsThrew,
  'buildSyncPlan should not throw when runtime Companion settings contain malformed rule/template elements',
);
assert(
  malformedRuntimeElementsPlan && !malformedRuntimeElementsPlan.ok,
  'buildSyncPlan should return a structured failure for malformed runtime Companion rule/template elements',
);
assert(
  malformedRuntimeElementsPlan?.errors.some((error) => /rule|template|settings/i.test(error)),
  'malformed runtime Companion rule/template element errors should mention rules/templates/settings',
);
assert(
  malformedRuntimeElementsPlan?.changes.length === 0,
  'buildSyncPlan should not emit changes for malformed runtime Companion rule/template elements',
);

let malformedRuntimeItemsThrew = false;
let malformedRuntimeItemsPlan: ReturnType<typeof buildSyncPlan> | undefined;
try {
  malformedRuntimeItemsPlan = buildSyncPlan(settings, [{ ...item, tags: [123] }] as never);
} catch {
  malformedRuntimeItemsThrew = true;
}
assert(
  !malformedRuntimeItemsThrew,
  'buildSyncPlan should not throw when runtime capture items contain malformed entries',
);
assert(
  malformedRuntimeItemsPlan && !malformedRuntimeItemsPlan.ok,
  'buildSyncPlan should return a structured failure for malformed runtime capture items',
);
assert(
  malformedRuntimeItemsPlan?.errors.some((error) => /item|capture/i.test(error)),
  'malformed runtime capture item errors should mention items/captures',
);
assert(
  malformedRuntimeItemsPlan?.changes.length === 0,
  'buildSyncPlan should not emit changes for malformed runtime capture items',
);


const unsafeDirectWritePath = path.resolve(vaultPath, '..', 'outside-companion-direct.md');
fs.rmSync(unsafeDirectWritePath, { force: true });
const unsafeWriteResult = writeSyncPlan({
  ok: true,
  vaultPath,
  changes: [{
    filePath: unsafeDirectWritePath,
    action: 'create-file',
    mode: 'append',
    content: 'should not leave the vault',
    itemIds: ['malformed-direct-plan'],
    ruleId: 'malformed-direct-plan',
  }],
  unmatchedItems: [],
  errors: [],
});
assert(!unsafeWriteResult.ok, 'writeSyncPlan should reject direct changes outside the plan vault');
assert(!fs.existsSync(unsafeDirectWritePath), 'writeSyncPlan must not create files outside the plan vault');
assert(
  unsafeWriteResult.errors.some((error) => error.includes('escapes')),
  'writeSyncPlan vault-escape error should be explicit',
);

const safeDirectWritePath = path.join(vaultPath, 'safe-direct-write.md');
const mixedUnsafeDirectWritePath = path.resolve(vaultPath, '..', 'outside-companion-mixed-direct.md');
fs.rmSync(safeDirectWritePath, { force: true });
fs.rmSync(mixedUnsafeDirectWritePath, { force: true });
const mixedWriteResult = writeSyncPlan({
  ok: true,
  vaultPath,
  changes: [
    {
      filePath: safeDirectWritePath,
      action: 'create-file',
      mode: 'append',
      content: 'safe should not be written when another change escapes',
      itemIds: ['safe-direct-plan'],
      ruleId: 'safe-direct-plan',
    },
    {
      filePath: mixedUnsafeDirectWritePath,
      action: 'create-file',
      mode: 'append',
      content: 'unsafe should be rejected before any writes',
      itemIds: ['unsafe-direct-plan'],
      ruleId: 'unsafe-direct-plan',
    },
  ],
  unmatchedItems: [],
  errors: [],
});
assert(!mixedWriteResult.ok, 'writeSyncPlan should reject a mixed plan before writing any changes');
assert(
  !fs.existsSync(safeDirectWritePath),
  'writeSyncPlan must not partially write safe changes when a later change escapes the vault',
);
assert(
  !fs.existsSync(mixedUnsafeDirectWritePath),
  'writeSyncPlan must not create the unsafe file from a mixed malformed plan',
);
assert(
  mixedWriteResult.errors.some((error) => error.includes('escapes')),
  'mixed writeSyncPlan vault-escape error should be explicit',
);

const safeBeforeDirectoryConflictPath = path.join(vaultPath, 'safe-before-directory-conflict.md');
const directoryOccupiedWritePath = path.join(vaultPath, 'occupied-directory-target.md');
fs.rmSync(safeBeforeDirectoryConflictPath, { force: true });
fs.rmSync(directoryOccupiedWritePath, { recursive: true, force: true });
fs.mkdirSync(directoryOccupiedWritePath, { recursive: true });
const directoryConflictWriteResult = writeSyncPlan({
  ok: true,
  vaultPath,
  changes: [
    {
      filePath: safeBeforeDirectoryConflictPath,
      action: 'create-file',
      mode: 'append',
      content: 'safe write should be blocked by later directory target',
      itemIds: ['safe-before-directory-conflict'],
      ruleId: 'safe-before-directory-conflict',
    },
    {
      filePath: directoryOccupiedWritePath,
      action: 'update-file',
      mode: 'append',
      content: 'directory target should fail preflight',
      itemIds: ['directory-conflict'],
      ruleId: 'directory-conflict',
    },
  ],
  unmatchedItems: [],
  errors: [],
});
assert(
  !directoryConflictWriteResult.ok,
  'writeSyncPlan should reject directory-backed targets before writing any changes',
);
assert(
  !fs.existsSync(safeBeforeDirectoryConflictPath),
  'writeSyncPlan must not partially write safe changes when a later target is occupied by a directory',
);
assert(
  fs.statSync(directoryOccupiedWritePath).isDirectory(),
  'writeSyncPlan must not replace a directory-backed target',
);

const inboxPath = fs.mkdtempSync(path.join(os.tmpdir(), 'dailytodo-mobile-inbox-'));
fs.writeFileSync(path.join(inboxPath, 'note.txt'), 'Mobile note', 'utf-8');
fs.mkdirSync(path.join(inboxPath, 'archive.md'), { recursive: true });
const importResult = importMobileInbox(inboxPath);
assert(importResult.ok, importResult.errors.join(' '));
assert(importResult.items.length === 1, 'mobile inbox import should import only real files');
assert(importResult.items[0].content === 'Mobile note', 'mobile inbox import should read the text file');
assert(
  fs.existsSync(path.join(inboxPath, 'archive.md')),
  'mobile inbox import should ignore directories even when their names have supported file extensions',
);

const processedMoveFailureInboxPath = fs.mkdtempSync(path.join(os.tmpdir(), 'dailytodo-mobile-processed-move-failure-'));
fs.writeFileSync(path.join(processedMoveFailureInboxPath, 'note.txt'), 'Move failure note', 'utf-8');
const originalRenameSync = fs.renameSync;
let processedMoveFailureResult: ReturnType<typeof importMobileInbox> | undefined;
try {
  fs.renameSync = ((from: fs.PathLike, to: fs.PathLike) => {
    const destinationParts = String(to).split(/[\\/]/);
    if (destinationParts.includes('_processed')) {
      throw new Error('simulated processed move failure');
    }
    return originalRenameSync(from, to);
  }) as typeof fs.renameSync;
  processedMoveFailureResult = importMobileInbox(processedMoveFailureInboxPath);
} finally {
  fs.renameSync = originalRenameSync;
}
assert(
  processedMoveFailureResult && !processedMoveFailureResult.ok,
  'mobile inbox import should fail when a processed move fails',
);
assert(
  processedMoveFailureResult?.items.length === 0,
  'mobile inbox import should not return capture items that failed to move to _processed',
);
assert(
  processedMoveFailureResult?.errors.some((error) => error.includes('processed move failure')),
  'processed move failures should be reported in import errors',
);
assert(
  fs.existsSync(path.join(processedMoveFailureInboxPath, '_failed', 'note.txt')),
  'mobile inbox files that fail to move to _processed should move to _failed',
);

const processedReservationCleanupFailureInboxPath = fs.mkdtempSync(path.join(os.tmpdir(), 'dailytodo-mobile-processed-cleanup-failure-'));
fs.writeFileSync(path.join(processedReservationCleanupFailureInboxPath, 'note.txt'), 'Cleanup failure note', 'utf-8');
const originalRmSync = fs.rmSync;
let processedReservationCleanupFailureResult: ReturnType<typeof importMobileInbox> | undefined;
try {
  fs.renameSync = ((from: fs.PathLike, to: fs.PathLike) => {
    const destinationParts = String(to).split(/[\\/]/);
    if (destinationParts.includes('_processed')) {
      throw new Error('simulated processed move failure before cleanup');
    }
    return originalRenameSync(from, to);
  }) as typeof fs.renameSync;
  fs.rmSync = ((target: fs.PathLike, options?: fs.RmOptions) => {
    const targetParts = String(target).split(/[\\/]/);
    if (targetParts.includes('_processed')) {
      throw new Error('simulated reservation cleanup failure');
    }
    return originalRmSync(target, options);
  }) as typeof fs.rmSync;
  processedReservationCleanupFailureResult = importMobileInbox(processedReservationCleanupFailureInboxPath);
} finally {
  fs.renameSync = originalRenameSync;
  fs.rmSync = originalRmSync;
}
assert(
  processedReservationCleanupFailureResult && !processedReservationCleanupFailureResult.ok,
  'mobile inbox import should fail structurally when processed move cleanup also fails',
);
assert(
  processedReservationCleanupFailureResult?.items.length === 0,
  'mobile inbox import should not return items when processed move cleanup fails',
);
assert(
  processedReservationCleanupFailureResult?.errors.some((error) => error.includes('processed move failure before cleanup')) &&
    processedReservationCleanupFailureResult?.errors.some((error) => error.includes('reservation cleanup failure')),
  'mobile inbox import should report both the original processed move failure and reservation cleanup failure',
);
assert(
  fs.existsSync(path.join(processedReservationCleanupFailureInboxPath, '_failed', 'note.txt')),
  'mobile inbox files should still route to _failed when processed reservation cleanup fails',
);

const processedReservationCloseFailureInboxPath = fs.mkdtempSync(path.join(os.tmpdir(), 'dailytodo-mobile-processed-close-failure-'));
fs.writeFileSync(path.join(processedReservationCloseFailureInboxPath, 'note.txt'), 'Close failure note', 'utf-8');
const originalOpenSync = fs.openSync;
const originalCloseSync = fs.closeSync;
const reservedDescriptorPaths = new Map<number, string>();
let processedReservationCloseFailureResult: ReturnType<typeof importMobileInbox> | undefined;
try {
  fs.openSync = ((target: fs.PathLike, flags: string | number, mode?: fs.Mode) => {
    const descriptor = originalOpenSync(target, flags, mode);
    reservedDescriptorPaths.set(descriptor, String(target));
    return descriptor;
  }) as typeof fs.openSync;
  fs.closeSync = ((descriptor: number) => {
    const reservedPath = reservedDescriptorPaths.get(descriptor);
    originalCloseSync(descriptor);
    if (reservedPath?.split(/[\\/]/).includes('_processed')) {
      throw new Error('simulated processed reservation close failure');
    }
  }) as typeof fs.closeSync;
  processedReservationCloseFailureResult = importMobileInbox(processedReservationCloseFailureInboxPath);
} finally {
  fs.openSync = originalOpenSync;
  fs.closeSync = originalCloseSync;
}
assert(
  processedReservationCloseFailureResult && !processedReservationCloseFailureResult.ok,
  'mobile inbox import should fail structurally when processed reservation close fails',
);
assert(
  processedReservationCloseFailureResult?.items.length === 0,
  'mobile inbox import should not return items when processed reservation close fails',
);
assert(
  processedReservationCloseFailureResult?.errors.some((error) => error.includes('processed reservation close failure')),
  'processed reservation close failures should be reported in import errors',
);
assert(
  fs.existsSync(path.join(processedReservationCloseFailureInboxPath, '_failed', 'note.txt')),
  'mobile inbox files should still route to _failed when processed reservation close fails',
);
assert(
  !fs.existsSync(path.join(processedReservationCloseFailureInboxPath, '_processed', 'note.txt')),
  'mobile inbox import should clean up reserved processed placeholders when reservation close fails',
);

const processedDestinationRaceInboxPath = fs.mkdtempSync(path.join(os.tmpdir(), 'dailytodo-mobile-processed-race-'));
const processedDestinationRaceProcessedPath = path.join(processedDestinationRaceInboxPath, '_processed');
fs.mkdirSync(processedDestinationRaceProcessedPath, { recursive: true });
fs.writeFileSync(path.join(processedDestinationRaceInboxPath, 'note.txt'), 'Race import note', 'utf-8');
const processedDestinationRaceCollisionPath = path.join(processedDestinationRaceProcessedPath, 'note.txt');
fs.writeFileSync(processedDestinationRaceCollisionPath, 'existing processed note', 'utf-8');
const originalExistsSync = fs.existsSync;
const originalDateNow = Date.now;
let processedDestinationRaceResult: ReturnType<typeof importMobileInbox> | undefined;
try {
  fs.existsSync = ((target: fs.PathLike) => {
    if (String(target) === processedDestinationRaceCollisionPath) return false;
    return originalExistsSync(target);
  }) as typeof fs.existsSync;
  Date.now = () => 424242;
  processedDestinationRaceResult = importMobileInbox(processedDestinationRaceInboxPath);
} finally {
  fs.existsSync = originalExistsSync;
  Date.now = originalDateNow;
}
const processedDestinationRaceAlternatePath = path.join(processedDestinationRaceProcessedPath, 'note-424242-1.txt');
assert(
  processedDestinationRaceResult && processedDestinationRaceResult.ok,
  'mobile inbox import should retry when the processed destination appears after uniqueness checking',
);
assert(
  fs.readFileSync(processedDestinationRaceCollisionPath, 'utf-8') === 'existing processed note',
  'mobile inbox import must not overwrite a processed destination that appears during move',
);
assert(
  fs.readFileSync(processedDestinationRaceAlternatePath, 'utf-8') === 'Race import note',
  'mobile inbox import should move raced files to the next unique processed destination',
);

const failedMoveFailureInboxPath = fs.mkdtempSync(path.join(os.tmpdir(), 'dailytodo-mobile-failed-move-failure-'));
fs.writeFileSync(path.join(failedMoveFailureInboxPath, 'note.txt'), 'Failed move failure note', 'utf-8');
let failedMoveFailureThrew = false;
let failedMoveFailureResult: ReturnType<typeof importMobileInbox> | undefined;
try {
  fs.renameSync = ((from: fs.PathLike, to: fs.PathLike) => {
    const destinationParts = String(to).split(/[\\/]/);
    if (destinationParts.includes('_processed') || destinationParts.includes('_failed')) {
      throw new Error(`simulated ${destinationParts.includes('_failed') ? 'failed' : 'processed'} move failure`);
    }
    return originalRenameSync(from, to);
  }) as typeof fs.renameSync;
  failedMoveFailureResult = importMobileInbox(failedMoveFailureInboxPath);
} catch {
  failedMoveFailureThrew = true;
} finally {
  fs.renameSync = originalRenameSync;
}
assert(
  !failedMoveFailureThrew,
  'mobile inbox import should not throw when both processed and failed moves fail',
);
assert(
  failedMoveFailureResult && !failedMoveFailureResult.ok,
  'mobile inbox import should return a structured failure when both processed and failed moves fail',
);
assert(
  failedMoveFailureResult?.items.length === 0,
  'mobile inbox import should not return capture items when both processed and failed moves fail',
);
assert(
  failedMoveFailureResult?.errors.some((error) => error.includes('processed move failure')) &&
    failedMoveFailureResult?.errors.some((error) => error.includes('failed move failure')),
  'mobile inbox import should report both the original processed move failure and the failed fallback move',
);

const invalidJsonInboxPath = fs.mkdtempSync(path.join(os.tmpdir(), 'dailytodo-mobile-invalid-json-'));
fs.writeFileSync(path.join(invalidJsonInboxPath, 'empty.json'), JSON.stringify({ type: 'note', tags: ['mobile'] }), 'utf-8');
const invalidJsonImportResult = importMobileInbox(invalidJsonInboxPath);
assert(!invalidJsonImportResult.ok, 'mobile inbox import should reject JSON captures without content');
assert(invalidJsonImportResult.items.length === 0, 'invalid JSON captures without content should not create capture items');
assert(
  invalidJsonImportResult.errors.some((error) => error.toLowerCase().includes('content')),
  'invalid JSON capture errors should mention missing content',
);
assert(
  fs.existsSync(path.join(invalidJsonInboxPath, '_failed', 'empty.json')),
  'invalid JSON captures without content should move to _failed',
);
assert(
  !fs.existsSync(path.join(invalidJsonInboxPath, '_processed', 'empty.json')),
  'invalid JSON captures without content should not move to _processed',
);

const nonObjectJsonInboxPath = fs.mkdtempSync(path.join(os.tmpdir(), 'dailytodo-mobile-non-object-json-'));
fs.writeFileSync(path.join(nonObjectJsonInboxPath, 'array.json'), JSON.stringify(['not', 'a', 'capture']), 'utf-8');
const nonObjectJsonImportResult = importMobileInbox(nonObjectJsonInboxPath);
assert(!nonObjectJsonImportResult.ok, 'mobile inbox import should reject JSON captures whose root is not an object');
assert(nonObjectJsonImportResult.items.length === 0, 'non-object JSON captures should not create capture items');
assert(
  nonObjectJsonImportResult.errors.some((error) => error.toLowerCase().includes('object')),
  'non-object JSON capture errors should explain that a JSON object is required',
);
assert(
  fs.existsSync(path.join(nonObjectJsonInboxPath, '_failed', 'array.json')),
  'non-object JSON captures should move to _failed',
);
assert(
  !fs.existsSync(path.join(nonObjectJsonInboxPath, '_processed', 'array.json')),
  'non-object JSON captures should not move to _processed',
);

let malformedRuntimeInboxPathThrew = false;
let malformedRuntimeInboxPathResult: ReturnType<typeof importMobileInbox> | undefined;
const malformedRuntimeInboxPath = { path: 'not-a-string' };
const originalExistsSyncForMalformedInboxPath = fs.existsSync;
try {
  (fs as { existsSync: typeof fs.existsSync }).existsSync = ((target: fs.PathLike) => {
    if ((target as unknown) === malformedRuntimeInboxPath) {
      throw new Error('fs.existsSync should not receive malformed runtime inbox paths');
    }
    return originalExistsSyncForMalformedInboxPath(target);
  }) as typeof fs.existsSync;
  malformedRuntimeInboxPathResult = importMobileInbox(malformedRuntimeInboxPath as never);
} catch {
  malformedRuntimeInboxPathThrew = true;
} finally {
  (fs as { existsSync: typeof fs.existsSync }).existsSync = originalExistsSyncForMalformedInboxPath;
}
assert(!malformedRuntimeInboxPathThrew, 'mobile inbox import should not throw when runtime inbox path is not a string');
assert(
  malformedRuntimeInboxPathResult && !malformedRuntimeInboxPathResult.ok,
  'malformed runtime inbox paths should return an explicit failure result',
);
assert(
  malformedRuntimeInboxPathResult?.items.length === 0,
  'malformed runtime inbox paths should not create capture items',
);
assert(
  malformedRuntimeInboxPathResult?.errors.some((error) => /path|string/i.test(error)),
  'malformed runtime inbox path errors should mention path/string input',
);

const fileBackedInboxRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dailytodo-mobile-file-inbox-'));
const fileBackedInboxPath = path.join(fileBackedInboxRoot, 'not-a-directory');
fs.writeFileSync(fileBackedInboxPath, 'not a directory', 'utf-8');
let fileBackedInboxThrew = false;
let fileBackedInboxResult: ReturnType<typeof importMobileInbox> | undefined;
try {
  fileBackedInboxResult = importMobileInbox(fileBackedInboxPath);
} catch {
  fileBackedInboxThrew = true;
}
assert(!fileBackedInboxThrew, 'mobile inbox import should not throw when inbox path points to a file');
assert(fileBackedInboxResult && !fileBackedInboxResult.ok, 'file-backed mobile inbox paths should return an explicit failure result');
assert(
  fileBackedInboxResult?.errors.some((error) => error.toLowerCase().includes('directory')),
  'file-backed mobile inbox path errors should mention that a directory is required',
);
assert(
  fs.readFileSync(fileBackedInboxPath, 'utf-8') === 'not a directory',
  'mobile inbox import should not modify a file that was passed as the inbox path',
);

const statFailureInboxPath = fs.mkdtempSync(path.join(os.tmpdir(), 'dailytodo-mobile-stat-failure-'));
fs.writeFileSync(path.join(statFailureInboxPath, 'note.txt'), 'Should not be read after stat failure', 'utf-8');
const originalStatSync = fs.statSync;
let statFailureInboxThrew = false;
let statFailureInboxResult: ReturnType<typeof importMobileInbox> | undefined;
try {
  (fs as { statSync: typeof fs.statSync }).statSync = ((target: fs.PathLike) => {
    if (String(target) === statFailureInboxPath) {
      throw new Error('simulated inbox stat failure');
    }
    return originalStatSync(target);
  }) as typeof fs.statSync;
  statFailureInboxResult = importMobileInbox(statFailureInboxPath);
} catch {
  statFailureInboxThrew = true;
} finally {
  (fs as { statSync: typeof fs.statSync }).statSync = originalStatSync;
}
assert(!statFailureInboxThrew, 'mobile inbox import should not throw when inbox root stat fails');
assert(
  statFailureInboxResult && !statFailureInboxResult.ok,
  'mobile inbox root stat failures should return an explicit failure result',
);
assert(
  statFailureInboxResult?.errors.some((error) => error.includes('simulated inbox stat failure')),
  'mobile inbox root stat failures should be reported in import errors',
);
assert(
  fs.existsSync(path.join(statFailureInboxPath, 'note.txt')),
  'mobile inbox import should not move files when inbox root validation fails',
);

const readdirFailureInboxPath = fs.mkdtempSync(path.join(os.tmpdir(), 'dailytodo-mobile-readdir-failure-'));
fs.writeFileSync(path.join(readdirFailureInboxPath, 'note.txt'), 'Should not be read after readdir failure', 'utf-8');
const originalReaddirSync = fs.readdirSync;
let readdirFailureInboxThrew = false;
let readdirFailureInboxResult: ReturnType<typeof importMobileInbox> | undefined;
try {
  (fs as { readdirSync: typeof fs.readdirSync }).readdirSync = ((target: fs.PathLike, options?: Parameters<typeof fs.readdirSync>[1]) => {
    if (String(target) === readdirFailureInboxPath) {
      throw new Error('simulated inbox readdir failure');
    }
    return originalReaddirSync(target, options as never) as never;
  }) as unknown as typeof fs.readdirSync;
  readdirFailureInboxResult = importMobileInbox(readdirFailureInboxPath);
} catch {
  readdirFailureInboxThrew = true;
} finally {
  (fs as { readdirSync: typeof fs.readdirSync }).readdirSync = originalReaddirSync;
}
assert(!readdirFailureInboxThrew, 'mobile inbox import should not throw when inbox file enumeration fails');
assert(
  readdirFailureInboxResult && !readdirFailureInboxResult.ok,
  'mobile inbox readdir failures should return an explicit failure result',
);
assert(
  readdirFailureInboxResult?.errors.some((error) => error.includes('simulated inbox readdir failure')),
  'mobile inbox readdir failures should be reported in import errors',
);
assert(
  fs.existsSync(path.join(readdirFailureInboxPath, 'note.txt')),
  'mobile inbox import should not move files when inbox enumeration fails',
);

const processedFileConflictInboxPath = fs.mkdtempSync(path.join(os.tmpdir(), 'dailytodo-mobile-processed-conflict-'));
fs.writeFileSync(path.join(processedFileConflictInboxPath, '_processed'), 'not a directory', 'utf-8');
fs.writeFileSync(path.join(processedFileConflictInboxPath, 'note.txt'), 'Should remain in inbox', 'utf-8');
let processedFileConflictThrew = false;
let processedFileConflictResult: ReturnType<typeof importMobileInbox> | undefined;
try {
  processedFileConflictResult = importMobileInbox(processedFileConflictInboxPath);
} catch {
  processedFileConflictThrew = true;
}
assert(!processedFileConflictThrew, 'mobile inbox import should not throw when _processed is occupied by a file');
assert(
  processedFileConflictResult && !processedFileConflictResult.ok,
  'mobile inbox import should fail explicitly when _processed is occupied by a file',
);
assert(
  processedFileConflictResult?.errors.some((error) => error.includes('_processed') && error.toLowerCase().includes('directory')),
  'mobile inbox processing directory conflict errors should mention _processed and directory',
);
assert(
  fs.existsSync(path.join(processedFileConflictInboxPath, 'note.txt')),
  'mobile inbox import should not move files when processing directory setup fails',
);
assert(
  fs.readFileSync(path.join(processedFileConflictInboxPath, '_processed'), 'utf-8') === 'not a directory',
  'mobile inbox import should not overwrite a file occupying _processed',
);

const blankTextInboxPath = fs.mkdtempSync(path.join(os.tmpdir(), 'dailytodo-mobile-blank-text-'));
fs.writeFileSync(path.join(blankTextInboxPath, 'blank.txt'), '   \n\t  ', 'utf-8');
const blankTextImportResult = importMobileInbox(blankTextInboxPath);
assert(!blankTextImportResult.ok, 'mobile inbox import should reject blank text captures');
assert(blankTextImportResult.items.length === 0, 'blank text captures should not create capture items');
assert(
  blankTextImportResult.errors.some((error) => error.toLowerCase().includes('content')),
  'blank text capture errors should mention missing content',
);
assert(
  fs.existsSync(path.join(blankTextInboxPath, '_failed', 'blank.txt')),
  'blank text captures should move to _failed',
);
assert(
  !fs.existsSync(path.join(blankTextInboxPath, '_processed', 'blank.txt')),
  'blank text captures should not move to _processed',
);

// WriteMode runtime narrowing for Companion settings UI and shared rule validation.
assert(isWriteMode('append') === true, 'append should be a valid WriteMode');
assert(isWriteMode('managed-block') === true, 'managed-block should be a valid WriteMode');
assert(isWriteMode('overwrite') === false, 'unknown write modes should be rejected');
assert(isWriteMode(null) === false, 'non-string write modes should be rejected');

const companionTypes = readFileSync(path.join(process.cwd(), 'shared/obsidianCompanion.ts'), 'utf8');
const companionValidationModulePath = path.join(process.cwd(), 'shared/obsidianCompanionValidation.ts');
assert(
  fs.existsSync(companionValidationModulePath),
  'shared Companion validation module should exist.',
);
const companionValidation = readFileSync(companionValidationModulePath, 'utf8');
assert(
  companionTypes.includes("from './obsidianCompanionValidation'"),
  'shared Companion facade should re-export validation helpers for existing consumers.',
);
assert(
  !companionTypes.includes('export function isCaptureItem'),
  'shared Companion facade should delegate capture validation to the focused module.',
);
assert(
  !companionTypes.includes('export function readCompanionSyncPlan'),
  'shared Companion facade should delegate sync result reading to the focused module.',
);
assert(
  companionValidation.includes('export function isCaptureItem'),
  'shared Companion validation module should own capture-item validation.',
);
assert(
  companionValidation.includes('export function readCompanionSyncPlan'),
  'shared Companion validation module should own sync-plan result reading.',
);
const companionImplementation = readFileSync(path.join(process.cwd(), 'electron/obsidianCompanion.ts'), 'utf8');
const companionPlanningImplementation = readFileSync(path.join(process.cwd(), 'electron/obsidianCompanionPlanning.ts'), 'utf8');
const companionTemplateRulesImplementation = readFileSync(path.join(process.cwd(), 'electron/obsidianCompanionTemplateRules.ts'), 'utf8');
const electronUnknownValueGuards = readFileSync(path.join(process.cwd(), 'electron/unknownValueGuards.ts'), 'utf8');
assert(
  companionImplementation.includes("from './obsidianCompanionPlanning'"),
  'electron companion should preserve its planning API through the dedicated planning module.',
);
assert(
  companionPlanningImplementation.includes('export function buildSyncPlan'),
  'the dedicated companion planning module should own sync-plan construction.',
);
assert(
  companionPlanningImplementation.includes("from './obsidianCompanionTemplateRules'"),
  'the dedicated companion planning module should compose focused template/rule policies.',
);
assert(
  companionTemplateRulesImplementation.includes('export function renderTemplate'),
  'the focused template/rule module should own capture template rendering.',
);
assert(
  companionTemplateRulesImplementation.includes('export function matchesRule'),
  'the focused template/rule module should own rule matching.',
);
assert(
  !companionImplementation.includes('export function buildSyncPlan'),
  'the electron companion write executor should not retain sync-plan construction.',
);
const companionMobileInboxModulePath = path.join(process.cwd(), 'electron/obsidianCompanionMobileInbox.ts');
const companionImplementationLines = companionImplementation.split(/\r?\n/).length;
assert(companionTypes.includes('export function isWriteMode'), 'shared companion types should export isWriteMode');
assert(
  companionTypes.includes("value === 'append' || value === 'managed-block'"),
  'isWriteMode should admit only append and managed-block',
);
assert(
  fs.existsSync(companionMobileInboxModulePath),
  'mobile inbox import logic should live in electron/obsidianCompanionMobileInbox.ts',
);
const companionMobileInboxModule = readFileSync(companionMobileInboxModulePath, 'utf8');
assert(
  electronUnknownValueGuards.includes("export { isObjectRecord } from '../shared/unknownValueGuards';"),
  'Electron unknown-value guards should preserve object-record narrowing for Companion modules through the shared compatibility export.',
);
assert(
  companionPlanningImplementation.includes("from './unknownValueGuards'") &&
    companionMobileInboxModule.includes("from './unknownValueGuards'"),
  'Companion planning and mobile inbox modules should reuse the Electron object-record guard.',
);
assert(
  !companionPlanningImplementation.includes('function isObject(value: unknown)') &&
    !companionMobileInboxModule.includes('function isObject(value: unknown)'),
  'Companion planning and mobile inbox modules should not retain duplicate object-record guards.',
);
assert(
  companionImplementationLines < 300,
  `electron/obsidianCompanion.ts should stay below 300 lines after mobile inbox extraction, found ${companionImplementationLines}`,
);
assert(
  companionImplementation.includes('obsidianCompanionMobileInbox'),
  'electron companion entrypoint should preserve importMobileInbox through the mobile inbox module boundary',
);
assert(
  companionMobileInboxModule.includes('export function importMobileInbox'),
  'mobile inbox module should own the importMobileInbox implementation',
);
assert(
  companionMobileInboxModule.includes('moveToUniqueDestination') && companionMobileInboxModule.includes('reserveFilePath'),
  'mobile inbox module should own unique destination reservation and move helpers',
);
assert(
  !companionImplementation.includes('function moveToUniqueDestination') &&
    !companionImplementation.includes('function ensureMobileInboxDirectory'),
  'electron companion planning module should not retain mobile inbox file-moving helpers',
);

const companionPanel = readFileSync(path.join(process.cwd(), 'src/components/ObsidianCompanionPanel.tsx'), 'utf8');
const companionRulesSection = readFileSync(
  path.join(process.cwd(), 'src/components/obsidianCompanion/ObsidianCompanionRulesSection.tsx'),
  'utf8',
);
assert(companionPanel.includes('<ObsidianCompanionRulesSection'), 'ObsidianCompanionPanel should compose the rules section');
assert(companionRulesSection.includes('isWriteMode'), 'Obsidian Companion rules section should use isWriteMode');
assert(
  companionRulesSection.includes('isWriteMode(event.target.value)') || companionRulesSection.includes('isWriteMode(nextMode)'),
  'Obsidian Companion rules section should narrow write-mode select values with isWriteMode',
);
assert(
  !companionRulesSection.includes('event.target.value as WriteMode'),
  'Obsidian Companion rules section should not cast write-mode select values',
);
assert(
  companionPlanningImplementation.includes('isCompanionRule'),
  'electron companion planning should import the shared rule validator',
);
assert(
  companionPlanningImplementation.includes('isCompanionTemplate'),
  'electron companion planning should reuse the shared rule and template validators',
);
assert(
  !companionPlanningImplementation.includes('function isCompanionTemplate'),
  'electron companion should not duplicate the shared template validator',
);
assert(
  !companionPlanningImplementation.includes('function isCompanionRule'),
  'electron companion should not duplicate the shared rule validator',
);
assert(
  companionPlanningImplementation.includes('const normalizedContent = item.content.toLowerCase();'),
  'bulk sync planning should normalize each item content once before evaluating rules',
);
assert(
  companionPlanningImplementation.includes('matchesRule(item, rule, normalizedTags, normalizedContent)'),
  'bulk sync planning should reuse normalized item content for every rule',
);

const companionDefaults = readFileSync(path.join(process.cwd(), 'shared/obsidianCompanionDefaults.ts'), 'utf8');
assert(
  companionDefaults.includes('const candidate: Record<string, unknown> = value'),
  'normalizeCompanionSettings should read runtime settings through a Record<string, unknown> guard',
);
assert(
  !companionDefaults.includes('value as Partial<CompanionSettings>'),
  'normalizeCompanionSettings should not cast runtime settings to Partial<CompanionSettings>',
);
const normalizedCompanionDefaults = normalizeCompanionSettings({
  vaultPath: 123,
  rules: [{ id: 'bad', write: null }],
  templates: [{ id: 123 }],
}, vaultPath);
assert(
  normalizedCompanionDefaults.vaultPath === vaultPath,
  'normalizeCompanionSettings should default malformed vaultPath through runtime field narrowing',
);
assert(
  normalizedCompanionDefaults.rules === settings.rules,
  'normalizeCompanionSettings should fall back when runtime rules fail validation',
);

console.log('obsidian companion verification passed');
