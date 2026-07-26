import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  isEveryVisibleHistoryItemSelected,
  keepVisibleSelection,
  selectVisibleHistoryItems,
  toggleHistorySelection,
} from '../src/components/historyCleanup/historyCleanupSelection';

assert.deepEqual(
  toggleHistorySelection([], 'task-1'),
  ['task-1'],
  'selecting an item should add it to the selection',
);
assert.deepEqual(
  toggleHistorySelection(['task-1', 'task-2'], 'task-1'),
  ['task-2'],
  'selecting an already selected item should remove it',
);
assert.deepEqual(
  selectVisibleHistoryItems(['task-1', 'task-2', 'task-1']),
  ['task-1', 'task-2'],
  'select-all should retain each visible item once',
);
assert.deepEqual(
  keepVisibleSelection(['task-1', 'task-3', 'task-2'], ['task-2', 'task-1']),
  ['task-1', 'task-2'],
  'changing visible items should immediately drop hidden selections',
);
assert.equal(
  isEveryVisibleHistoryItemSelected(['task-1', 'task-2'], ['task-1', 'task-2']),
  true,
  'all visible items should report selected when each is selected',
);
assert.equal(
  isEveryVisibleHistoryItemSelected(['task-1'], []),
  false,
  'an empty visible list should not report a selected-all state',
);

const reviewRecordBlock = readFileSync('src/components/reviewView/ReviewRecordBlock.tsx', 'utf8');
assert.match(
  reviewRecordBlock,
  /if \(isCleanupMode \|\| !review \|\| !onDeleteReview\) return;/,
  'review cleanup mode should block right-click deletion so deletion remains a single scoped batch action',
);
assert.match(
  reviewRecordBlock,
  /isEditing && !isCleanupMode && review \?/,
  'review cleanup mode should hide an in-progress edit form so only cleanup interactions remain available',
);

console.log('history cleanup selection verification passed');
