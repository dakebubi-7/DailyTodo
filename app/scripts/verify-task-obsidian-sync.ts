import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  areSelectedDailyNoteSyncInputsEquivalent,
  buildObsidianSyncTasks,
  buildSelectedDailyNoteSyncInput,
} from '../src/hooks/taskObsidianSync';
import type { Task } from '../src/types/task';

const task: Task = {
  id: 'task-1',
  text: 'Write sync helper',
  completed: false,
  priority: 'medium',
  source: 'personal',
  createdAt: '2026-07-05T01:00:00.000Z',
  taskDate: '2026-07-05',
  isToday: true,
};

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const useTasks = readFileSync(join(root, 'src/hooks/useTasks.ts'), 'utf8');
const lifecycleEffectsPath = join(root, 'src/hooks/useTaskLifecycleEffects.ts');
const syncEffectsPath = join(root, 'src/hooks/useTaskObsidianSyncEffects.ts');
const taskTreePersistenceEffectsPath = join(root, 'src/hooks/useTaskTreePersistenceEffects.ts');

assert.equal(
  existsSync(lifecycleEffectsPath),
  true,
  'task lifecycle effects should be isolated in a focused hook module.',
);
const lifecycleEffects = readFileSync(lifecycleEffectsPath, 'utf8');
assert.equal(
  existsSync(syncEffectsPath),
  true,
  'Obsidian synchronization effects should be isolated in a focused hook module.',
);
const syncEffects = readFileSync(syncEffectsPath, 'utf8');
assert.equal(
  existsSync(taskTreePersistenceEffectsPath),
  true,
  'task-tree persistence and broadcast effects should be isolated in a focused hook module.',
);
const taskTreePersistenceEffects = readFileSync(taskTreePersistenceEffectsPath, 'utf8');

const syncInput = buildSelectedDailyNoteSyncInput({
  tasks: [task],
  selectedDate: '2026-07-05',
  dailyWorkNotes: {
    '2026-07-05': 'Focused implementation',
    '2026-07-04': 'Previous note',
  },
  dailyInspirationNotes: {},
});

assert.deepEqual(syncInput, {
  tasks: [task],
  selectedDate: '2026-07-05',
  dailyWork: 'Focused implementation',
  dailyInspiration: '',
});
assert.equal(
  areSelectedDailyNoteSyncInputsEquivalent(
    syncInput,
    { ...syncInput, tasks: [{ ...task, collapsed: true, cleared: true, isToday: false }] },
  ),
  true,
  'sync input equivalence should ignore renderer-only task state that does not appear in Obsidian Markdown.',
);
assert.equal(
  areSelectedDailyNoteSyncInputsEquivalent(
    { ...syncInput, beforeTasks: [{ ...task, text: 'Previous task text' }] },
    { ...syncInput, beforeTasks: [{ ...task, text: 'Different previous task text' }] },
  ),
  true,
  'sync input equivalence should ignore previous-task snapshots after a successful sync.',
);
assert.equal(
  areSelectedDailyNoteSyncInputsEquivalent(
    syncInput,
    { ...syncInput, tasks: [{ ...task, text: 'Changed task text' }] },
  ),
  false,
  'sync input equivalence should detect task text changes that must update Obsidian Markdown.',
);
assert.equal(
  areSelectedDailyNoteSyncInputsEquivalent(
    syncInput,
    {
      ...syncInput,
      tasks: [{
        ...task,
        completionReview: {
          status: 'partial',
          percent: 50,
          summary: 'New review',
          unknowns: '',
          nextStep: 'Continue',
          reviewedAt: '2026-07-05T03:00:00.000Z',
        },
      }],
    },
  ),
  false,
  'sync input equivalence should detect completion review changes that must update Obsidian Markdown.',
);

const retainedReviewTasks = buildObsidianSyncTasks({
  allTasks: [task],
  retainedObsidianReviews: [
    {
      task,
      review: {
        id: 'review-1',
        status: 'done',
        percent: 100,
        summary: 'Done',
        unknowns: '',
        nextStep: '',
        reviewedAt: '2026-07-05T02:00:00.000Z',
      },
      deletedAt: '2026-07-05T03:00:00.000Z',
    },
  ],
  syncDeletedReviewsToObsidian: false,
});

assert.equal(retainedReviewTasks[0].completionReviews?.[0].id, 'review-1');
assert.match(
  useTasks,
  /useTaskLifecycleEffects\(/,
  'useTasks should compose its persistence and synchronization lifecycle effects from a focused hook.',
);
assert.match(
  lifecycleEffects,
  /export function useTaskLifecycleEffects\(/,
  'task lifecycle effects should have a focused hook boundary.',
);
assert.match(
  lifecycleEffects,
  /useTaskObsidianSyncEffects\(/,
  'task lifecycle effects should compose Obsidian synchronization through a focused hook.',
);
assert.match(
  syncEffects,
  /export function useTaskObsidianSyncEffects\(/,
  'Obsidian synchronization hook should export its focused effect boundary.',
);
assert.match(
  syncEffects,
  /const obsidianSyncTasks = useMemo\(\(\) => buildObsidianSyncTasks\(\{[\s\S]*?\}\), \[allTasks, retainedObsidianReviews, appSettings\.syncDeletedReviewsToObsidian\]\);/,
  'Obsidian synchronization hook should memoize derived sync tasks across unrelated UI renders.',
);
assert.match(
  lifecycleEffects,
  /useTaskTreePersistenceEffects\(/,
  'task lifecycle effects should compose the focused task-tree persistence hook.',
);
assert.match(
  taskTreePersistenceEffects,
  /createTaskTreePersistence/,
  'task-tree persistence effects should use the shared deferred task-tree persistence helper.',
);
assert.match(
  taskTreePersistenceEffects,
  /taskTreePersistenceRef\.current\.schedule\(allTasks\);/,
  'task-tree persistence effects should coalesce rapid task tree changes before persisting them.',
);
assert.match(
  taskTreePersistenceEffects,
  /if \(skipTasksWrite\) \{\s*taskTreePersistenceRef\.current\.reset\(\);\s*return;\s*\}/,
  'task-tree persistence effects should discard pending local work and clear the stale persistence baseline after receiving a task broadcast.',
);
assert.match(
  taskTreePersistenceEffects,
  /return \(\) => taskTreePersistenceRef\.current\?\.flush\(\);/,
  'task-tree persistence effects should flush a pending task tree when it unmounts.',
);
assert.doesNotMatch(
  lifecycleEffects,
  /const taskTreePersistenceRef = useRef/,
  'task lifecycle effects should not retain task-tree persistence controller state after extraction.',
);
assert.match(
  lifecycleEffects,
  /useEffect\(\(\) => \{\s*if \(!isLoaded\) return;[\s\S]*?persistTaskUiState\(\{[\s\S]*?\}\);\s*\}, \[activeTab, currentDate, dailyInspirationNotes, dailyWorkNotes, isLoaded, selectedDate, taskListOrderByDate\]\);/,
  'task lifecycle effects should persist task UI state without rewriting the task tree.',
);
assert.match(
  syncEffects,
  /useEffect\(\(\) => \{\s*if \(!isLoaded\) return;[\s\S]*?const syncInput = buildSelectedDailyNoteSyncInput\([\s\S]*?syncSelectedDailyNote\(syncInput\)[\s\S]*?\}, 250\);[\s\S]*?\}, \[dailyInspirationNotes, dailyWorkNotes, isLoaded, obsidianPath, obsidianSyncTasks, selectedDate, setSyncStatus\]\);/,
  'Obsidian synchronization hook should not restart syncs for tabs, business dates, or local task ordering.',
);
assert.match(
  syncEffects,
  /areSelectedDailyNoteSyncInputsEquivalent/,
  'Obsidian synchronization hook should skip the IPC call when the generated daily-note input is unchanged.',
);
const taskObsidianSyncSource = readFileSync(join(root, 'src/hooks/taskObsidianSync.ts'), 'utf8');
assert.doesNotMatch(
  taskObsidianSyncSource,
  /task\.completionReview \? \[task\.completionReview\] : undefined/,
  'Obsidian sync equivalence should compare legacy single reviews without allocating wrapper arrays per task.',
);

console.log('task obsidian sync verification passed');
