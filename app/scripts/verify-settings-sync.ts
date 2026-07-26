import assert from 'node:assert/strict';
import fs, { existsSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  createDefaultAppSettings,
  createDefaultObsidianTemplateSettings,
  normalizeObsidianTemplateSettings,
} from '../shared/appSettings';
import {
  getBusinessDateKey,
  getNextRolloverDelay,
  shouldCarryTaskForward,
} from '../shared/taskRollover';
import {
  buildDailyNoteContent,
  buildDailyNoteFromTemplate,
  buildInspirationBlock,
  buildTaskBlock,
  buildWorkBlock,
  buildSyncPreview,
  readMarkedBlockBody,
  replaceManagedBlock,
  resolveTemplatePath,
} from '../shared/obsidianTemplates';
import { readObsidianActionResult } from '../shared/obsidianIpcResults';
import {
  mergeRetainedReviewsForObsidian,
  retainDeletedReview,
} from '../shared/obsidianReviewRetention';
import { getCompletionReviews } from '../shared/completionReviews';
import { createObsidianSyncHelpers } from '../electron/obsidianSync';

const defaultSettings = createDefaultAppSettings();
const viteEnv = fs.readFileSync(path.join(process.cwd(), 'src/vite-env.d.ts'), 'utf8');
const preloadSource = fs.readFileSync(path.join(process.cwd(), 'electron/preload.ts'), 'utf8');
assert.equal(defaultSettings.language, 'zh-CN');
assert.equal(defaultSettings.rolloverTime, '05:00');
assert.equal(defaultSettings.autoCarryForward, true);
assert.equal(defaultSettings.confirmBeforeDeletingReview, false);
assert.equal(defaultSettings.lockWindowPosition, false);

for (const apiName of ['syncTasksToObsidian', 'previewTasksToObsidian']) {
  const ambientSignature = new RegExp(
    `${apiName}:\\s*\\([\\s\\S]*?tasks:\\s*unknown[\\s\\S]*?beforeTasks\\?:\\s*unknown[\\s\\S]*?\\)\\s*=>\\s*Promise`,
  );
  assert.match(
    viteEnv,
    ambientSignature,
    `vite-env should expose ${apiName} task inputs as unknown runtime data at the preload boundary.`,
  );
}
assert.doesNotMatch(
  viteEnv,
  /(syncTasksToObsidian|previewTasksToObsidian):\s*\([\s\S]*?tasks:\s*import\('\.\/types\/task'\)\.Task\[[\s\S]*?beforeTasks\?:\s*import\('\.\/types\/task'\)\.Task\[\]/,
  'vite-env should not claim Obsidian sync/preview task inputs are trusted Task arrays.',
);
assert.match(
  viteEnv,
  /previewTasksToObsidian:[\s\S]*?Promise<unknown>/,
  'ambient Obsidian preview should expose unknown return values at the preload boundary.',
);
assert.doesNotMatch(
  viteEnv,
  /previewTasksToObsidian:[\s\S]*?Promise<import\('\.\.\/shared\/obsidianTemplates'\)\.SyncPreview>/,
  'ambient Obsidian preview should not claim a trusted SyncPreview return.',
);
assert.match(
  viteEnv,
  /syncTasksToObsidian:[\s\S]*?Promise<unknown>/,
  'ambient Obsidian sync should expose unknown return values at the preload boundary.',
);
assert.doesNotMatch(
  viteEnv,
  /syncTasksToObsidian:\s*\(\s*tasks:\s*unknown[\s\S]*?beforeTasks\?:\s*unknown\s*\)\s*=>\s*Promise<\{\s*ok: boolean;/,
  'ambient Obsidian sync should not claim a trusted structured result.',
);
assert.deepEqual(readObsidianActionResult({ ok: true, filePath: 'C:/vault/daily.md' }), {
  ok: true,
  filePath: 'C:/vault/daily.md',
});
assert.deepEqual(readObsidianActionResult({ ok: false, reason: 'no vault' }), { ok: false, reason: 'no vault' });
assert.equal(readObsidianActionResult({ ok: true, filePath: 1 }), undefined);
assert.equal(readObsidianActionResult(null), undefined);

const unknownValueGuardsUrl = new URL('../shared/unknownValueGuards.ts', import.meta.url);
assert.equal(existsSync(unknownValueGuardsUrl), true, 'shared unknown-value guards module should exist.');
const unknownValueGuardsSource = readFileSync(unknownValueGuardsUrl, 'utf8');
const obsidianIpcResultsSource = readFileSync(new URL('../shared/obsidianIpcResults.ts', import.meta.url), 'utf8');
assert.match(
  unknownValueGuardsSource,
  /export function isObjectRecord\b/,
  'shared unknown-value guards should expose an object-record predicate.',
);
assert.match(
  obsidianIpcResultsSource,
  /import \{ isObjectRecord \} from '\.\/unknownValueGuards';/,
  'Obsidian IPC result readers should reuse the shared object-record predicate.',
);
assert.doesNotMatch(
  obsidianIpcResultsSource,
  /function isObject\(/,
  'Obsidian IPC result readers should not keep a duplicate local object predicate.',
);
assert.match(
  preloadSource,
  /syncTasksToObsidian:\s*\(\s*tasks:\s*unknown[\s\S]*?beforeTasks\?:\s*unknown/,
  'preload should forward Obsidian sync task inputs as unknown runtime data.',
);
assert.match(
  preloadSource,
  /previewTasksToObsidian:\s*\(\s*tasks:\s*unknown[\s\S]*?beforeTasks\?:\s*unknown/,
  'preload should forward Obsidian preview task inputs as unknown runtime data.',
);

assert.equal(getBusinessDateKey(new Date('2026-05-27T04:30:00+08:00'), '05:00'), '2026-05-26');
assert.equal(getBusinessDateKey(new Date('2026-05-27T05:01:00+08:00'), '05:00'), '2026-05-27');
assert.ok(getNextRolloverDelay(new Date('2026-05-27T04:59:30+08:00'), '05:00') <= 30_000);

const baseTask = {
  id: 'task-1',
  text: 'Write implementation notes',
  completed: false,
  priority: 'medium' as const,
  createdAt: '2026-05-26T10:00:00.000Z',
  taskDate: '2026-05-26',
  isToday: false,
};

assert.equal(shouldCarryTaskForward(baseTask), true);
assert.equal(
  shouldCarryTaskForward({
    ...baseTask,
    completed: true,
    completionReviews: [{ status: 'partial', percent: 50, summary: 'half', unknowns: '', nextStep: 'finish', reviewedAt: '2026-05-26T18:00:00.000Z' }],
  }),
  true,
);
assert.equal(
  shouldCarryTaskForward({
    ...baseTask,
    completed: true,
    completionReviews: [{ status: 'done', percent: 100, summary: 'done', unknowns: '', nextStep: '', reviewedAt: '2026-05-26T18:00:00.000Z' }],
  }),
  false,
);
assert.equal(
  shouldCarryTaskForward({
    ...baseTask,
    completed: true,
    completionReviews: [
      { status: 'done', percent: 100, summary: 'latest done', unknowns: '', nextStep: '', reviewedAt: '2026-05-26T18:00:00.000Z' },
      { status: 'partial', percent: 40, summary: 'older partial', unknowns: '', nextStep: 'resume', reviewedAt: '2026-05-26T17:00:00.000Z' },
    ],
  }),
  false,
);
assert.equal(shouldCarryTaskForward({ ...baseTask, completed: true, completedAt: '2026-05-26T18:00:00.000Z' }), false);

const templates = createDefaultObsidianTemplateSettings();
assert.throws(
  () => resolveTemplatePath('G:/vault', 'C:/secret/report.md', '2026-05-27'),
  /Template path must be relative to the vault/,
  'absolute Windows template paths should be rejected before any filename sanitization rewrites them into misleading relative paths.',
);
const expandedDailyPath = resolveTemplatePath('G:/vault', 'logs/daily/{{year}}/{{month}}/{{ date }}.md', '2026-05-27');
assert.equal(
  path.relative(path.resolve('G:/vault'), expandedDailyPath).replace(/\\/g, '/'),
  'logs/daily/2026/05/2026-05-27.md',
  'daily template paths should expand the same date/year/month variables as report path templates.',
);
const caseInsensitiveDailyPath = resolveTemplatePath('G:/vault', 'logs/daily/{{YEAR}}/{{Month}}/{{ DATE }}.md', '2026-05-27');
assert.equal(
  path.relative(path.resolve('G:/vault'), caseInsensitiveDailyPath).replace(/\\/g, '/'),
  'logs/daily/2026/05/2026-05-27.md',
  'daily template path variable expansion should tolerate uppercase or mixed-case variable names.',
);
const migratedLegacyPaths = normalizeObsidianTemplateSettings({
  monthlyDir: 'legacy/monthly/personal',
  externalMonthlyDir: 'legacy/monthly/external',
});
assert.equal(
  migratedLegacyPaths.monthlyPath,
  'legacy/monthly/personal/{{year}}-{{month}}.md',
  'legacy monthlyDir should migrate to a monthly report file path.',
);
assert.equal(
  migratedLegacyPaths.externalMonthlyPath,
  'legacy/monthly/external/{{year}}-{{month}}.md',
  'legacy externalMonthlyDir should migrate to a monthly external report file path.',
);

const daily = buildDailyNoteContent({
  date: '2026-05-27',
  tasks: [baseTask],
  dailyWork: 'Ship the settings sync pass.',
  dailyInspiration: 'Keep normal controls out of developer mode.',
  templates,
});

assert.match(daily, /<!-- DAILYTODO:WORK:START -->/);
assert.match(daily, /## 今日工作/);
assert.match(daily, /## 每日任务/);
assert.match(daily, /Ship the settings sync pass\./);

const original = [
  '# 2026-05-27 每日记录',
  '',
  '<!-- DAILYTODO:TASKS:START -->',
  'old managed content',
  '<!-- DAILYTODO:TASKS:END -->',
  '',
  '## My private Obsidian section',
  'Do not overwrite this.',
].join('\n');
const replaced = replaceManagedBlock(
  original,
  '<!-- DAILYTODO:TASKS:START -->',
  '<!-- DAILYTODO:TASKS:END -->',
  '<!-- DAILYTODO:TASKS:START -->\nnew managed content\n<!-- DAILYTODO:TASKS:END -->',
);
assert.match(replaced, /new managed content/);
assert.match(replaced, /Do not overwrite this\./);
assert.doesNotMatch(replaced, /old managed content/);

const preview = buildSyncPreview({
  date: '2026-05-27',
  tasksBeforeDelete: [{ ...baseTask, completionReviews: [{ id: 'review-1', status: 'partial', percent: 50, summary: 'remove me', unknowns: '', nextStep: '', reviewedAt: '2026-05-27T12:00:00.000Z' }] }],
  tasksAfterDelete: [baseTask],
  dailyWork: '',
  dailyInspiration: '',
  templates,
  vaultPath: 'G:/vault',
});

assert.equal(preview.files.length, 1);
assert.equal(preview.managedBlocks.some((block) => block.marker === 'DAILYTODO:TASKS'), true);
assert.equal(preview.deletedReviewWillDisappear, true);
assert.equal(preview.taskCount, 0);
assert.equal(preview.completionRecordCount, 0);

const crossDateReviewedTask = {
  ...baseTask,
  completed: true,
  completionReview: {
    id: 'review-cross-date',
    status: 'partial' as const,
    percent: 50,
    summary: 'Reviewed on selected date.',
    unknowns: '',
    nextStep: 'Continue tomorrow',
    reviewedAt: '2026-05-27T12:00:00.000Z',
  },
  completionReviews: [{
    id: 'review-cross-date',
    status: 'partial' as const,
    percent: 50,
    summary: 'Reviewed on selected date.',
    unknowns: '',
    nextStep: 'Continue tomorrow',
    reviewedAt: '2026-05-27T12:00:00.000Z',
  }],
};
const crossDatePreview = buildSyncPreview({
  date: '2026-05-27',
  tasksAfterDelete: [crossDateReviewedTask],
  dailyWork: '',
  dailyInspiration: '',
  templates,
  vaultPath: 'G:/vault',
});
assert.equal(
  crossDatePreview.taskCount,
  1,
  'sync preview should count tasks that will appear in the selected daily note because they have a completion review on that date.',
);
assert.equal(crossDatePreview.completionRecordCount, 1);

const hiddenOldReviewTask = {
  ...baseTask,
  completed: true,
  completionReview: {
    id: 'review-hidden-old',
    status: 'partial' as const,
    percent: 40,
    summary: 'Old review from another date.',
    unknowns: '',
    nextStep: 'Not for selected date',
    reviewedAt: '2026-05-26T12:00:00.000Z',
  },
  completionReviews: [{
    id: 'review-hidden-old',
    status: 'partial' as const,
    percent: 40,
    summary: 'Old review from another date.',
    unknowns: '',
    nextStep: 'Not for selected date',
    reviewedAt: '2026-05-26T12:00:00.000Z',
  }],
};
const hiddenOldReviewPreview = buildSyncPreview({
  date: '2026-05-27',
  tasksAfterDelete: [hiddenOldReviewTask],
  dailyWork: '',
  dailyInspiration: '',
  templates,
  vaultPath: 'G:/vault',
});
assert.equal(
  hiddenOldReviewPreview.completionRecordCount,
  0,
  'sync preview should not count completion records that will not appear in the selected daily note.',
);
const hiddenDeletedReviewPreview = buildSyncPreview({
  date: '2026-05-27',
  tasksBeforeDelete: [hiddenOldReviewTask],
  tasksAfterDelete: [{ ...hiddenOldReviewTask, completionReview: undefined, completionReviews: [] }],
  dailyWork: '',
  dailyInspiration: '',
  templates,
  vaultPath: 'G:/vault',
});
assert.equal(
  hiddenDeletedReviewPreview.deletedReviewWillDisappear,
  false,
  'sync preview should ignore deleted reviews that were never visible in the selected daily note.',
);

const syncVaultPath = fs.mkdtempSync(path.join(os.tmpdir(), 'dailytodo-sync-vault-'));
const syncBlogDraftDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dailytodo-sync-blog-'));
const syncHelpers = createObsidianSyncHelpers({
  getDateKey: (date?: string) => date || '2026-05-27',
  getTaskDate: (task) => task.taskDate || task.createdAt?.slice(0, 10) || '',
  getReviewDate: (review) => review.reviewedAt.slice(0, 10),
  getCompletionReviews,
  getVaultPath: () => syncVaultPath,
  getVaultStatus: () => ({ ok: true as const, vaultPath: syncVaultPath }),
  getTemplates: () => templates,
  buildDailyTemplate: (date, dailyWork = '', inspiration = '', templateSettings = templates) =>
    buildDailyNoteFromTemplate({
      date,
      tasks: [],
      dailyWork,
      dailyInspiration: inspiration,
      templates: templateSettings,
    }),
  buildWorkBlock,
  buildInspirationBlock,
  buildTaskBlock,
  migrateLegacyInspirationSection: (existing) => existing,
  upsertMarkedBlock: replaceManagedBlock,
  readMarkedBlockBody,
  migrateLegacyWorkSection: (existing) => existing,
  buildBlogDraft: () => '',
  runReviewForDate: async () => ({}),
  localBlogDraftDir: syncBlogDraftDir,
});
const noOpSyncTask = { ...baseTask, taskDate: '2026-05-27' };
const noOpSyncResult = syncHelpers.syncTasksToObsidian([noOpSyncTask], '2026-05-27');
assert.equal(noOpSyncResult.ok, true, 'initial sync should create the no-op sync daily note.');
const noOpSyncFilePath = path.join(syncVaultPath, 'logs', 'daily', 'DailyTodo', '2026-05-27.md');
const noOpSyncContent = fs.readFileSync(noOpSyncFilePath, 'utf8').replace(
  /同步时间：[^\n]*/,
  '同步时间：2000/1/1 00:00:00',
);
fs.writeFileSync(noOpSyncFilePath, noOpSyncContent, 'utf8');
const originalNoOpSyncWriteFile = fs.writeFileSync;
let noOpSyncWriteCount = 0;
fs.writeFileSync = ((...args: Parameters<typeof fs.writeFileSync>) => {
  if (args[0] === noOpSyncFilePath) {
    noOpSyncWriteCount += 1;
  }
  return originalNoOpSyncWriteFile(...args);
}) as typeof fs.writeFileSync;
try {
  const secondNoOpSyncResult = syncHelpers.syncTasksToObsidian([noOpSyncTask], '2026-05-27');
  assert.equal(secondNoOpSyncResult.ok, true, 'no-op sync should still report success.');
} finally {
  fs.writeFileSync = originalNoOpSyncWriteFile;
}
assert.equal(
  noOpSyncWriteCount,
  0,
  'syncing unchanged tasks should preserve the existing task sync timestamp without rewriting the daily note.',
);
let malformedRuntimeTasksSyncThrew = false;
let malformedRuntimeTasksSyncResult: { ok?: boolean; reason?: string; error?: string } | undefined;
try {
  malformedRuntimeTasksSyncResult = syncHelpers.syncTasksToObsidian({ not: 'tasks' } as never, '2026-05-27') as {
    ok?: boolean;
    reason?: string;
    error?: string;
  };
} catch {
  malformedRuntimeTasksSyncThrew = true;
}
assert.equal(
  malformedRuntimeTasksSyncThrew,
  false,
  'sync should not throw when runtime tasks input is not an array.',
);
assert.equal(
  malformedRuntimeTasksSyncResult?.ok,
  false,
  'sync should return a structured failure when runtime tasks input is not an array.',
);
assert.match(
  malformedRuntimeTasksSyncResult?.reason ?? malformedRuntimeTasksSyncResult?.error ?? '',
  /task|array/i,
  'malformed runtime tasks sync errors should mention tasks/arrays.',
);

let malformedRuntimeTasksPreviewThrew = false;
let malformedRuntimeTasksPreviewResult:
  | { files?: unknown[]; taskCount?: number; completionRecordCount?: number; error?: string }
  | undefined;
try {
  malformedRuntimeTasksPreviewResult = syncHelpers.previewTasksToObsidian('not-tasks' as never, '2026-05-27') as {
    files?: unknown[];
    taskCount?: number;
    completionRecordCount?: number;
    error?: string;
  };
} catch {
  malformedRuntimeTasksPreviewThrew = true;
}
assert.equal(
  malformedRuntimeTasksPreviewThrew,
  false,
  'preview should not throw when runtime tasks input is not an array.',
);
assert.deepEqual(
  malformedRuntimeTasksPreviewResult?.files,
  [],
  'preview should not emit file previews for malformed runtime tasks input.',
);
assert.equal(
  malformedRuntimeTasksPreviewResult?.taskCount,
  0,
  'preview should not count malformed runtime tasks input.',
);
assert.match(
  malformedRuntimeTasksPreviewResult?.error ?? '',
  /task|array/i,
  'malformed runtime tasks preview errors should mention tasks/arrays.',
);

let malformedRuntimeTaskElementsSyncThrew = false;
let malformedRuntimeTaskElementsSyncResult: { ok?: boolean; reason?: string; error?: string } | undefined;
try {
  malformedRuntimeTaskElementsSyncResult = syncHelpers.syncTasksToObsidian(
    [{ ...baseTask, subtasks: 'not-subtasks' }] as never,
    '2026-05-29',
  ) as {
    ok?: boolean;
    reason?: string;
    error?: string;
  };
} catch {
  malformedRuntimeTaskElementsSyncThrew = true;
}
assert.equal(
  malformedRuntimeTaskElementsSyncThrew,
  false,
  'sync should not throw when runtime task array contains malformed task entries.',
);
assert.equal(
  malformedRuntimeTaskElementsSyncResult?.ok,
  false,
  'sync should return a structured failure when runtime task array contains malformed task entries.',
);
assert.match(
  malformedRuntimeTaskElementsSyncResult?.reason ?? malformedRuntimeTaskElementsSyncResult?.error ?? '',
  /task|malformed/i,
  'malformed runtime task entry sync errors should mention malformed tasks.',
);

let malformedRuntimeTaskElementsPreviewThrew = false;
let malformedRuntimeTaskElementsPreviewResult:
  | { files?: unknown[]; taskCount?: number; completionRecordCount?: number; error?: string }
  | undefined;
try {
  malformedRuntimeTaskElementsPreviewResult = syncHelpers.previewTasksToObsidian(
    [{ ...baseTask, subtasks: 'not-subtasks' }] as never,
    '2026-05-29',
  ) as {
    files?: unknown[];
    taskCount?: number;
    completionRecordCount?: number;
    error?: string;
  };
} catch {
  malformedRuntimeTaskElementsPreviewThrew = true;
}
assert.equal(
  malformedRuntimeTaskElementsPreviewThrew,
  false,
  'preview should not throw when runtime task array contains malformed task entries.',
);
assert.deepEqual(
  malformedRuntimeTaskElementsPreviewResult?.files,
  [],
  'preview should not emit file previews for malformed runtime task entries.',
);
assert.equal(
  malformedRuntimeTaskElementsPreviewResult?.taskCount,
  0,
  'preview should not count malformed runtime task entries.',
);
assert.match(
  malformedRuntimeTaskElementsPreviewResult?.error ?? '',
  /task|malformed/i,
  'malformed runtime task entry preview errors should mention malformed tasks.',
);

const malformedRuntimeSectionsDate = '2026-05-30';
const malformedRuntimeSectionsPath = path.join(
  syncVaultPath,
  'logs',
  'daily',
  'DailyTodo',
  `${malformedRuntimeSectionsDate}.md`,
);
let malformedRuntimeSectionsSyncThrew = false;
let malformedRuntimeSectionsSyncResult: { ok?: boolean; reason?: string; error?: string } | undefined;
try {
  malformedRuntimeSectionsSyncResult = syncHelpers.syncTasksToObsidian(
    [],
    malformedRuntimeSectionsDate,
    { text: 'not daily work' } as never,
    '',
  ) as {
    ok?: boolean;
    reason?: string;
    error?: string;
  };
} catch {
  malformedRuntimeSectionsSyncThrew = true;
}
assert.equal(
  malformedRuntimeSectionsSyncThrew,
  false,
  'sync should not throw when runtime daily section input is not a string.',
);
assert.equal(
  malformedRuntimeSectionsSyncResult?.ok,
  false,
  'sync should return a structured failure when runtime daily section input is not a string.',
);
assert.match(
  malformedRuntimeSectionsSyncResult?.reason ?? malformedRuntimeSectionsSyncResult?.error ?? '',
  /dailyWork|inspiration|string/i,
  'malformed runtime daily section sync errors should mention dailyWork/inspiration string input.',
);
assert.equal(
  fs.existsSync(malformedRuntimeSectionsPath),
  false,
  'sync should not write a daily note for malformed runtime daily section input.',
);

let malformedRuntimeSectionsPreviewThrew = false;
let malformedRuntimeSectionsPreviewResult:
  | { files?: unknown[]; taskCount?: number; completionRecordCount?: number; error?: string }
  | undefined;
try {
  malformedRuntimeSectionsPreviewResult = syncHelpers.previewTasksToObsidian(
    [],
    malformedRuntimeSectionsDate,
    '',
    ['not inspiration'] as never,
  ) as {
    files?: unknown[];
    taskCount?: number;
    completionRecordCount?: number;
    error?: string;
  };
} catch {
  malformedRuntimeSectionsPreviewThrew = true;
}
assert.equal(
  malformedRuntimeSectionsPreviewThrew,
  false,
  'preview should not throw when runtime daily section input is not a string.',
);
assert.deepEqual(
  malformedRuntimeSectionsPreviewResult?.files,
  [],
  'preview should not emit file previews for malformed runtime daily section input.',
);
assert.match(
  malformedRuntimeSectionsPreviewResult?.error ?? '',
  /dailyWork|inspiration|string/i,
  'malformed runtime daily section preview errors should mention dailyWork/inspiration string input.',
);

let malformedRuntimeDateSyncThrew = false;
let malformedRuntimeDateSyncResult: { ok?: boolean; reason?: string; error?: string } | undefined;
try {
  malformedRuntimeDateSyncResult = syncHelpers.syncTasksToObsidian([], { date: '2026-05-31' } as never) as {
    ok?: boolean;
    reason?: string;
    error?: string;
  };
} catch {
  malformedRuntimeDateSyncThrew = true;
}
assert.equal(
  malformedRuntimeDateSyncThrew,
  false,
  'sync should not throw when runtime selected date input is not a string.',
);
assert.equal(
  malformedRuntimeDateSyncResult?.ok,
  false,
  'sync should return a structured failure when runtime selected date input is not a string.',
);
assert.match(
  malformedRuntimeDateSyncResult?.reason ?? malformedRuntimeDateSyncResult?.error ?? '',
  /date|string/i,
  'malformed runtime date sync errors should mention date/string input.',
);
assert.equal(
  fs.existsSync(path.join(syncVaultPath, 'logs', 'daily', 'DailyTodo', '[object Object].md')),
  false,
  'sync should not write a daily note for malformed runtime selected date input.',
);

let malformedRuntimeDatePreviewThrew = false;
let malformedRuntimeDatePreviewResult:
  | { files?: unknown[]; taskCount?: number; completionRecordCount?: number; error?: string }
  | undefined;
try {
  malformedRuntimeDatePreviewResult = syncHelpers.previewTasksToObsidian([], ['2026-05-31'] as never) as {
    files?: unknown[];
    taskCount?: number;
    completionRecordCount?: number;
    error?: string;
  };
} catch {
  malformedRuntimeDatePreviewThrew = true;
}
assert.equal(
  malformedRuntimeDatePreviewThrew,
  false,
  'preview should not throw when runtime selected date input is not a string.',
);
assert.deepEqual(
  malformedRuntimeDatePreviewResult?.files,
  [],
  'preview should not emit file previews for malformed runtime selected date input.',
);
assert.match(
  malformedRuntimeDatePreviewResult?.error ?? '',
  /date|string/i,
  'malformed runtime date preview errors should mention date/string input.',
);
const directoryBackedDailyNotePath = path.join(syncVaultPath, 'logs', 'daily', 'DailyTodo', '2026-05-28.md');
fs.mkdirSync(directoryBackedDailyNotePath, { recursive: true });
let directoryBackedSyncThrew = false;
let directoryBackedSyncResult: { ok?: boolean; reason?: string; error?: string } | undefined;
try {
  directoryBackedSyncResult = syncHelpers.syncTasksToObsidian([], '2026-05-28') as { ok?: boolean; reason?: string; error?: string };
} catch {
  directoryBackedSyncThrew = true;
}
assert.equal(directoryBackedSyncThrew, false, 'sync should not throw when the daily note target path is a directory.');
assert.equal(directoryBackedSyncResult?.ok, false, 'sync should fail structurally when the daily note target path is a directory.');
assert.match(
  directoryBackedSyncResult?.reason ?? directoryBackedSyncResult?.error ?? '',
  /file|directory|daily note/i,
  'sync failure should explain that the daily note target must be a file.',
);

const beforeCrossDateDeletionTask = {
  ...crossDateReviewedTask,
  text: 'Cross-date deletion task',
};
const afterCrossDateDeletionTask = {
  ...beforeCrossDateDeletionTask,
  completionReview: undefined,
  completionReviews: [],
};
const fileBackedBlogDraftVaultPath = fs.mkdtempSync(path.join(os.tmpdir(), 'dailytodo-sync-file-blog-vault-'));
const fileBackedBlogDraftRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dailytodo-sync-file-blog-root-'));
const fileBackedBlogDraftPath = path.join(fileBackedBlogDraftRoot, 'not-a-directory');
fs.writeFileSync(fileBackedBlogDraftPath, 'not a directory', 'utf-8');
const fileBackedBlogDraftHelpers = createObsidianSyncHelpers({
  getDateKey: (date?: string) => date || '2026-05-27',
  getTaskDate: (task) => task.taskDate || task.createdAt?.slice(0, 10) || '',
  getReviewDate: (review) => review.reviewedAt.slice(0, 10),
  getCompletionReviews,
  getVaultPath: () => fileBackedBlogDraftVaultPath,
  getVaultStatus: () => ({ ok: true as const, vaultPath: fileBackedBlogDraftVaultPath }),
  getTemplates: () => templates,
  buildDailyTemplate: (date, dailyWork = '', inspiration = '', templateSettings = templates) =>
    buildDailyNoteFromTemplate({
      date,
      tasks: [],
      dailyWork,
      dailyInspiration: inspiration,
      templates: templateSettings,
    }),
  buildWorkBlock,
  buildInspirationBlock,
  buildTaskBlock,
  migrateLegacyInspirationSection: (existing) => existing,
  upsertMarkedBlock: replaceManagedBlock,
  readMarkedBlockBody,
  migrateLegacyWorkSection: (existing) => existing,
  buildBlogDraft: () => 'draft should be skipped when the configured path is a file',
  runReviewForDate: async () => ({}),
  localBlogDraftDir: fileBackedBlogDraftPath,
});
let fileBackedBlogDraftResult: { ok?: boolean; filePath?: string } | undefined;
assert.doesNotThrow(() => {
  fileBackedBlogDraftResult = fileBackedBlogDraftHelpers.syncTasksToObsidian([beforeCrossDateDeletionTask], '2026-05-27') as {
    ok?: boolean;
    filePath?: string;
  };
}, 'sync should not fail when the optional local blog draft path points to a file');
assert.equal(fileBackedBlogDraftResult?.ok, true, 'sync should still report success when optional blog draft output is skipped');
assert.equal(
  fs.existsSync(path.join(fileBackedBlogDraftVaultPath, 'logs', 'daily', 'DailyTodo', '2026-05-27.md')),
  true,
  'sync should still write the selected daily note when optional blog draft output is skipped.',
);
assert.equal(
  fs.readFileSync(fileBackedBlogDraftPath, 'utf8'),
  'not a directory',
  'sync should not overwrite a file that was misconfigured as the blog draft directory.',
);

const directoryBackedBlogDraftTargetVaultPath = fs.mkdtempSync(path.join(os.tmpdir(), 'dailytodo-sync-dir-blog-target-vault-'));
const directoryBackedBlogDraftTargetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dailytodo-sync-dir-blog-target-'));
fs.mkdirSync(path.join(directoryBackedBlogDraftTargetDir, 'daily-memo-2026-05-27.md'), { recursive: true });
const directoryBackedBlogDraftTargetHelpers = createObsidianSyncHelpers({
  getDateKey: (date?: string) => date || '2026-05-27',
  getTaskDate: (task) => task.taskDate || task.createdAt?.slice(0, 10) || '',
  getReviewDate: (review) => review.reviewedAt.slice(0, 10),
  getCompletionReviews,
  getVaultPath: () => directoryBackedBlogDraftTargetVaultPath,
  getVaultStatus: () => ({ ok: true as const, vaultPath: directoryBackedBlogDraftTargetVaultPath }),
  getTemplates: () => templates,
  buildDailyTemplate: (date, dailyWork = '', inspiration = '', templateSettings = templates) =>
    buildDailyNoteFromTemplate({
      date,
      tasks: [],
      dailyWork,
      dailyInspiration: inspiration,
      templates: templateSettings,
    }),
  buildWorkBlock,
  buildInspirationBlock,
  buildTaskBlock,
  migrateLegacyInspirationSection: (existing) => existing,
  upsertMarkedBlock: replaceManagedBlock,
  readMarkedBlockBody,
  migrateLegacyWorkSection: (existing) => existing,
  buildBlogDraft: () => 'draft should be skipped when the target path is a directory',
  runReviewForDate: async () => ({}),
  localBlogDraftDir: directoryBackedBlogDraftTargetDir,
});
let directoryBackedBlogDraftTargetResult: { ok?: boolean; filePath?: string } | undefined;
assert.doesNotThrow(() => {
  directoryBackedBlogDraftTargetResult = directoryBackedBlogDraftTargetHelpers.syncTasksToObsidian([beforeCrossDateDeletionTask], '2026-05-27') as {
    ok?: boolean;
    filePath?: string;
  };
}, 'sync should not fail when the optional local blog draft target path is occupied by a directory');
assert.equal(
  directoryBackedBlogDraftTargetResult?.ok,
  true,
  'sync should still report success when optional blog draft target output is skipped',
);
assert.equal(
  fs.existsSync(path.join(directoryBackedBlogDraftTargetVaultPath, 'logs', 'daily', 'DailyTodo', '2026-05-27.md')),
  true,
  'sync should still write the selected daily note when optional blog draft target output is skipped.',
);
assert.equal(
  fs.statSync(path.join(directoryBackedBlogDraftTargetDir, 'daily-memo-2026-05-27.md')).isDirectory(),
  true,
  'sync should not replace a directory occupying the optional blog draft target path.',
);
const crossDateDeletionPreview = syncHelpers.previewTasksToObsidian(
  [afterCrossDateDeletionTask],
  '2026-05-27',
  '',
  '',
  [beforeCrossDateDeletionTask],
);
assert.equal(
  crossDateDeletionPreview.files.length,
  2,
  'sync preview should include every daily note file affected by deleting a selected-date review from an older task.',
);
assert.equal(
  crossDateDeletionPreview.files.some((file) => file.filePath.endsWith('2026-05-26.md')),
  true,
  'sync preview should include the original task-date daily note file when a cross-date review deletion changes it.',
);
assert.equal(
  crossDateDeletionPreview.taskCount,
  1,
  'sync preview should count tasks across every affected daily note file, not only the selected date note.',
);
syncHelpers.syncTasksToObsidian([beforeCrossDateDeletionTask], '2026-05-27');
const originalTaskDateFilePath = path.join(syncVaultPath, 'logs', 'daily', 'DailyTodo', '2026-05-26.md');
assert.equal(fs.existsSync(originalTaskDateFilePath), true, 'initial sync should create the original task-date daily note.');
assert.equal(
  fs.readFileSync(originalTaskDateFilePath, 'utf8').includes(beforeCrossDateDeletionTask.completionReview!.summary),
  true,
  'initial sync should write the cross-date review into the original task-date daily note before deletion.',
);
syncHelpers.syncTasksToObsidian(
  [afterCrossDateDeletionTask],
  '2026-05-27',
  '',
  '',
  [beforeCrossDateDeletionTask],
);
assert.equal(
  fs.readFileSync(originalTaskDateFilePath, 'utf8').includes(beforeCrossDateDeletionTask.completionReview!.summary),
  false,
  'syncing after deleting a cross-date review should also refresh the older affected daily note and remove the stale review block.',
);

const reviewRecord = {
  id: 'review-keep',
  status: 'partial' as const,
  percent: 40,
  summary: 'Keep this in Obsidian when delete sync is off.',
  unknowns: '',
  nextStep: 'Resume tomorrow',
  reviewedAt: '2026-05-27T13:00:00.000Z',
};
const reviewedTask = {
  ...baseTask,
  taskDate: '2026-05-27',
  completed: true,
  completionReview: reviewRecord,
  completionReviews: [reviewRecord],
};
const locallyDeletedTask = {
  ...reviewedTask,
  completionReview: undefined,
  completionReviews: undefined,
};
const retained = retainDeletedReview([], reviewedTask, reviewRecord, '2026-05-27T14:00:00.000Z');
const retainedAgain = retainDeletedReview(retained, reviewedTask, reviewRecord, '2026-05-27T15:00:00.000Z');
const mergedForObsidian = mergeRetainedReviewsForObsidian([locallyDeletedTask], retainedAgain);
const secondReviewRecord = {
  ...reviewRecord,
  id: 'review-keep-2',
  summary: 'Keep this too when archived task is missing locally.',
  reviewedAt: '2026-05-27T16:00:00.000Z',
};
const archivedTaskWithFirstReview = {
  ...reviewedTask,
  completionReview: reviewRecord,
  completionReviews: [reviewRecord],
};
const archivedTaskWithSecondReview = {
  ...reviewedTask,
  completionReview: secondReviewRecord,
  completionReviews: [secondReviewRecord],
};
const retainedArchivedReviews = retainDeletedReview(
  retainDeletedReview([], archivedTaskWithFirstReview, reviewRecord, '2026-05-27T14:00:00.000Z'),
  archivedTaskWithSecondReview,
  secondReviewRecord,
  '2026-05-27T16:30:00.000Z',
);
const mergedArchivedOnly = mergeRetainedReviewsForObsidian([], retainedArchivedReviews);
const nestedLocallyDeletedTask = {
  ...locallyDeletedTask,
  id: 'nested-task',
};
const nestedRetainedReviews = retainDeletedReview(
  retainDeletedReview(
    [],
    { ...nestedLocallyDeletedTask, completionReview: reviewRecord, completionReviews: [reviewRecord] },
    reviewRecord,
  ),
  { ...nestedLocallyDeletedTask, completionReview: secondReviewRecord, completionReviews: [secondReviewRecord] },
  secondReviewRecord,
);
const mergedNestedReviews = mergeRetainedReviewsForObsidian([
  {
    ...baseTask,
    id: 'nested-parent',
    subtasks: [nestedLocallyDeletedTask],
  },
], nestedRetainedReviews);

assert.equal(retained.length, 1);
assert.equal(retainedAgain.length, 1);
assert.equal(mergedForObsidian[0].completionReviews?.length, 1);
assert.equal(mergedForObsidian[0].completionReviews?.[0].summary, reviewRecord.summary);
assert.equal(mergedForObsidian[0].completed, true);
assert.equal(mergedArchivedOnly.length, 1, 'retained archived reviews for the same task should merge into one restored archived task.');
assert.deepEqual(
  mergedArchivedOnly[0].completionReviews?.map((review) => review.id),
  ['review-keep', 'review-keep-2'],
  'retained archived reviews should accumulate across multiple entries for the same missing task.',
);
assert.equal(
  mergedArchivedOnly[0].completionReview?.id,
  'review-keep-2',
  'retained archived reviews should preserve the latest review as completionReview after merging.',
);
assert.deepEqual(
  mergedNestedReviews[0].subtasks?.[0].completionReviews?.map((review) => review.id),
  ['review-keep', 'review-keep-2'],
  'retained reviews should merge together when they target the same nested task.',
);
const reviewRetentionSource = fs.readFileSync(path.join(process.cwd(), 'shared/obsidianReviewRetention.ts'), 'utf8');
assert.ok(
  reviewRetentionSource.includes('const retainedReviewsByTaskId = new Map<string, RetainedObsidianReview[]>();'),
  'retained Obsidian review merging should group entries by task before traversing the task tree.',
);
assert.ok(
  !reviewRetentionSource.includes('retainedReviews.forEach(({ task: archivedTask, review }) => {'),
  'retained Obsidian review merging should not traverse the task tree once per retained review.',
);

console.log('settings-sync verification passed');
