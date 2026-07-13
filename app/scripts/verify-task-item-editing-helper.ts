import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const editingPath = join(root, 'src/components/taskItem/taskItemEditing.ts');
const editingHookPath = join(root, 'src/components/taskItem/useTaskItemEditing.ts');
const taskItemPath = join(root, 'src/components/TaskItem.tsx');
const subtaskCardPath = join(root, 'src/components/taskItem/SubtaskCard.tsx');

assert.ok(existsSync(editingPath), 'TaskItem editing helper module should exist.');
assert.ok(existsSync(editingHookPath), 'TaskItem editing lifecycle hook module should exist.');
assert.ok(existsSync(subtaskCardPath), 'TaskItem SubtaskCard component module should exist.');

const editing = readFileSync(editingPath, 'utf8');
const editingHook = readFileSync(editingHookPath, 'utf8');
const taskItem = readFileSync(taskItemPath, 'utf8');
const subtaskCard = readFileSync(subtaskCardPath, 'utf8');

assert.match(editing, /export type TaskEditKeyAction = 'submit' \| 'cancel' \| null/, 'editing module should export the edit key action type.');
assert.match(editing, /export function getSubmittedTaskText\(editText: string\)/, 'editing module should export getSubmittedTaskText.');
assert.match(editing, /const trimmed = editText\.trim\(\)/, 'getSubmittedTaskText should trim the candidate edit text once.');
assert.match(editing, /return trimmed \|\| null/, 'getSubmittedTaskText should return null for empty trimmed text.');
assert.match(editing, /export function getTaskEditKeyAction\(key: string\): TaskEditKeyAction/, 'editing module should export getTaskEditKeyAction.');
assert.match(editing, /if \(key === 'Enter'\) return 'submit'/, 'Enter should map to submit.');
assert.match(editing, /if \(key === 'Escape'\) return 'cancel'/, 'Escape should map to cancel.');
assert.match(editing, /return null/, 'non-editing keys should map to null.');
assert.doesNotMatch(editing, /from ['"]\.\.\/\.\.\/types\/task['"]/, 'editing module should not depend on Task types.');
assert.doesNotMatch(editing, /useState|useEffect|useMemo|useRef/, 'editing module should stay hook-free.');

assert.match(editingHook, /export function useTaskItemEditing\(/, 'editing lifecycle module should export a focused hook.');
assert.match(editingHook, /useEffect\(/, 'editing lifecycle hook should own external edit-trigger handling.');
assert.match(editingHook, /if \(editTrigger && !task\.completed\)/, 'editing lifecycle hook should only open incomplete tasks from an external edit trigger.');
assert.match(editingHook, /getSubmittedTaskText\(editText\)/, 'editing lifecycle hook should reuse submitted-text normalization.');
assert.match(editingHook, /getTaskEditKeyAction\(event\.key\)/, 'editing lifecycle hook should reuse edit-key normalization.');
assert.match(editingHook, /onEdit\(submittedText\)/, 'editing lifecycle hook should forward valid submitted text.');
assert.doesNotMatch(editingHook, /TaskMainContent|TaskActionLayer|motion\./, 'editing lifecycle hook should not own TaskItem presentation.');

assert.match(taskItem, /import \{ useTaskItemEditing \} from '\.\/taskItem\/useTaskItemEditing';/, 'TaskItem should compose the focused editing lifecycle hook.');
assert.match(taskItem, /useTaskItemEditing\(\{ task, editTrigger, onEdit \}\)/, 'TaskItem should delegate edit lifecycle inputs to the focused hook.');
assert.doesNotMatch(taskItem, /const \[isEditing, setIsEditing\] = useState/, 'TaskItem should not own edit-mode state after extraction.');
assert.doesNotMatch(taskItem, /const handleSubmit = \(\) =>/, 'TaskItem should not own submit lifecycle after extraction.');
assert.doesNotMatch(taskItem, /const handleKeyDown = \(event: KeyboardEvent/, 'TaskItem should not own edit key lifecycle after extraction.');
assert.doesNotMatch(taskItem, /if \(editTrigger && !task\.completed\)/, 'TaskItem should not own external edit-trigger lifecycle after extraction.');

assert.match(subtaskCard, /import \{ getSubmittedTaskText, getTaskEditKeyAction \} from '\.\/taskItemEditing';/, 'SubtaskCard should import editing helpers from the editing module.');
assert.match(subtaskCard, /const submittedText = getSubmittedTaskText\(editText\);\s*\r?\n\s*if \(submittedText\) onEditSubtask\(subtask\.id, submittedText\);/, 'SubtaskCard submit handler should use the submitted text helper before calling onEditSubtask.');
assert.match(subtaskCard, /const action = getTaskEditKeyAction\(event\.key\);/, 'SubtaskCard keydown handler should use the key action helper.');
assert.match(subtaskCard, /if \(action === 'submit'\) submitEdit\(\);/, 'SubtaskCard should still submit for submit actions.');
assert.match(subtaskCard, /if \(action === 'cancel'\) \{\s*\r?\n\s*setEditText\(subtask\.text\);\s*\r?\n\s*setIsEditing\(false\);/, 'SubtaskCard should still reset text and exit editing for cancel actions.');
assert.doesNotMatch(subtaskCard, /if \(editText\.trim\(\)\) onEditSubtask\(subtask\.id, editText\.trim\(\)\)/, 'SubtaskCard should not inline submit text trimming.');
assert.doesNotMatch(subtaskCard, /event\.key === 'Enter'/, 'SubtaskCard should not directly compare Enter in the edit keydown handler.');
assert.doesNotMatch(subtaskCard, /event\.key === 'Escape'/, 'SubtaskCard should not directly compare Escape in the edit keydown handler.');

console.log('TaskItem editing helper verification passed');
