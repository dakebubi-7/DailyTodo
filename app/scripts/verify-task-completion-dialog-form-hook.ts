import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const cwd = process.cwd();
const root = existsSync(join(cwd, 'src')) ? cwd : join(cwd, 'app');
const dialogPath = join(root, 'src/components/TaskCompletionDialog.tsx');
const hookPath = join(root, 'src/components/taskCompletionDialog/useTaskCompletionDialogForm.ts');
const dialog = readFileSync(dialogPath, 'utf8');
const hook = existsSync(hookPath) ? readFileSync(hookPath, 'utf8') : '';

assert.ok(existsSync(hookPath), 'TaskCompletionDialog form state should live in a focused hook.');
assert.ok(dialog.includes("from './taskCompletionDialog/useTaskCompletionDialogForm'"), 'TaskCompletionDialog should import the extracted form hook.');
assert.ok(dialog.includes('useTaskCompletionDialogForm'), 'TaskCompletionDialog should compose the extracted form hook.');
assert.ok(!dialog.includes("useState<TaskCompletionReview['status']>"), 'TaskCompletionDialog should not inline completion-review form state after extraction.');
assert.ok(!dialog.includes("const nextStatus = event.target.value as TaskCompletionReview['status']"), 'TaskCompletionDialog should not inline completion-status transition rules after extraction.');
assert.ok(dialog.includes('isTaskCompletionReviewStatus(event.target.value)'), 'TaskCompletionDialog should retain the runtime guard for status select values.');
assert.ok(hook.includes('export function useTaskCompletionDialogForm'), 'Task completion dialog form hook should be exported.');
assert.ok(hook.includes("useState<TaskCompletionReview['status']>('done')"), 'Form hook should retain its done-status default.');
assert.ok(hook.includes("if (value === 'done') setPercent(100)"), 'Form hook should retain done-status percent normalization.');
assert.ok(hook.includes("if (value === 'partial' && percent === 100) setPercent(80)"), 'Form hook should retain partial-status default percent behavior.');
assert.ok(hook.includes("if (value === 'blocked' && percent === 100) setPercent(50)"), 'Form hook should retain blocked-status default percent behavior.');
assert.ok(hook.includes('summary: summary.trim()'), 'Form hook should trim summary before saving.');
assert.ok(hook.includes('unknowns: unknowns.trim()'), 'Form hook should trim unknowns before saving.');
assert.ok(hook.includes('nextStep: nextStep.trim()'), 'Form hook should trim next-step text before saving.');

console.log('TaskCompletionDialog form hook verification passed');
