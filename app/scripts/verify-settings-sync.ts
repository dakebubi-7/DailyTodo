import assert from 'node:assert/strict';
import {
  createDefaultAppSettings,
  createDefaultObsidianTemplateSettings,
} from '../shared/appSettings';
import {
  getBusinessDateKey,
  getNextRolloverDelay,
  shouldCarryTaskForward,
} from '../shared/taskRollover';
import {
  buildDailyNoteContent,
  buildSyncPreview,
  replaceManagedBlock,
} from '../shared/obsidianTemplates';
import {
  mergeRetainedReviewsForObsidian,
  retainDeletedReview,
} from '../shared/obsidianReviewRetention';

const defaultSettings = createDefaultAppSettings();
assert.equal(defaultSettings.language, 'zh-CN');
assert.equal(defaultSettings.rolloverTime, '05:00');
assert.equal(defaultSettings.autoCarryForward, true);
assert.equal(defaultSettings.syncDeletedReviewsToObsidian, true);
assert.equal(defaultSettings.confirmBeforeDeletingReview, false);
assert.equal(defaultSettings.lockWindowPosition, false);

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
assert.equal(shouldCarryTaskForward({ ...baseTask, completed: true, completedAt: '2026-05-26T18:00:00.000Z' }), false);

const templates = createDefaultObsidianTemplateSettings();
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

assert.equal(retained.length, 1);
assert.equal(retainedAgain.length, 1);
assert.equal(mergedForObsidian[0].completionReviews?.length, 1);
assert.equal(mergedForObsidian[0].completionReviews?.[0].summary, reviewRecord.summary);
assert.equal(mergedForObsidian[0].completed, true);

console.log('settings-sync verification passed');
