import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isTaskLike,
  normalizeScheduledDates,
  normalizeTask,
  parseStoredTasks,
} from '../src/hooks/taskPersistenceTransforms';
import type { Task } from '../src/types/task';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'src', 'hooks', 'taskPersistenceTransforms.ts');
const transformsPath = join(root, 'src', 'hooks', 'taskTransforms.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'task persistence transforms module should exist.');

const helper = readFileSync(modulePath, 'utf8');
const transforms = readFileSync(transformsPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export function isTaskCompletionReview\b/, 'persistence transforms should validate completion reviews.');
assert.match(helper, /export function isTaskLike\b/, 'persistence transforms should validate stored task shape.');
assert.match(helper, /export function parseStoredTasks\b/, 'persistence transforms should parse stored task arrays.');
assert.match(helper, /export function normalizeTask\b/, 'persistence transforms should normalize persisted task compatibility fields.');
assert.match(helper, /normalizeSubtasks\(/, 'persistence transforms should recursively normalize subtasks.');
assert.match(transforms, /from '\.\/taskPersistenceTransforms'/, 'task transforms should delegate persistence normalization to the focused module.');
assert.match(transforms, /export \{[^}]*parseStoredTasks[^}]*\}/s, 'task transforms should retain persistence compatibility exports.');
assert.doesNotMatch(transforms, /function normalizeSubtasks\b/, 'task transforms should not retain recursive persistence normalization.');

assert.equal(
  scripts['verify:task-persistence-transforms'],
  'tsx scripts/verify-task-persistence-transforms.ts',
  'package.json should expose the focused task persistence transforms verifier.',
);
assertCleanupCoreIncludes('verify:task-persistence-transforms', 'cleanup-core should include the focused task persistence transforms verifier.');

const baseTask: Task = {
  id: 'root',
  text: 'Root',
  completed: false,
  priority: 'medium',
  createdAt: '2026-07-13T00:00:00.000Z',
};

assert.deepEqual(
  normalizeScheduledDates(['2026-07-15', 'bad', '2026-07-14', '2026-07-15', '2026-07-13'], '2026-07-13'),
  ['2026-07-14', '2026-07-15'],
  'scheduled dates should retain sorted unique valid secondary dates only.',
);

const normalized = normalizeTask({
  ...baseTask,
  completionReview: {
    id: 'legacy',
    status: 'done',
    percent: 100,
    summary: 'done',
    unknowns: '',
    nextStep: '',
    reviewedAt: '2026-07-13T10:00:00.000Z',
  },
  scheduledDates: ['2026-07-15', '2026-07-13', '2026-07-14', '2026-07-15'],
  subtasks: [{ ...baseTask, id: 'child', taskDate: '2026-07-12' }],
}, '2026-07-13');
assert.equal(normalized.taskDate, '2026-07-13', 'normalization should assign the current business date when absent.');
assert.equal(normalized.isToday, true, 'normalization should synchronize the legacy today flag.');
assert.deepEqual(normalized.scheduledDates, ['2026-07-14', '2026-07-15'], 'normalization should apply scheduled-date cleanup.');
assert.equal(normalized.completionReviews?.[0]?.id, 'legacy', 'normalization should migrate one legacy review into the review history.');
assert.equal(normalized.subtasks?.[0]?.isToday, false, 'normalization should recurse into subtasks with the same business date.');
assert.equal(isTaskLike(normalized), true, 'normalized task should satisfy the persisted task guard.');
assert.deepEqual(
  parseStoredTasks([normalized, { id: 'invalid' }, null], '2026-07-13'),
  [normalized],
  'stored task parsing should drop invalid entries while retaining valid normalized tasks.',
);

console.log('task persistence transforms verification passed');
