import assert from 'node:assert/strict';
import { createDailyAiReviewProgress } from '../electron/aiReviewDailyProgress';

const emitted: Array<{ key: string; status: string; message?: string }> = [];
const created: Array<{ key: string; label: string; status: string; durationMs?: number; message?: string }> = [];

const progress = createDailyAiReviewProgress({
  emit(reportKind, key, _label, status, message) {
    assert.equal(reportKind, 'daily');
    emitted.push({ key, status, message });
  },
  createStage(key, label, status, durationMs, message) {
    const value = { key, label, status, durationMs, message };
    created.push(value);
    return value as never;
  },
});

progress.emit('inspectDaily', 'running', 'Checking daily note');
progress.record('prepareMaterials', 'completed', 42, 'Prepared source material');

assert.deepEqual(emitted, [
  { key: 'inspectDaily', status: 'running', message: 'Checking daily note' },
  { key: 'prepareMaterials', status: 'completed', message: 'Prepared source material' },
]);
assert.deepEqual(created, [
  {
    key: 'prepareMaterials',
    label: progress.labels.prepareMaterials,
    status: 'completed',
    durationMs: 42,
    message: 'Prepared source material',
  },
]);
assert.deepEqual(progress.stages, created as never[]);
assert.equal(progress.labels.inspectDaily.length > 0, true, 'progress should own the daily stage labels.');
assert.equal(progress.messages.aiContentFound.length > 0, true, 'progress should own the daily inspection messages.');
assert.equal(progress.getRequestStatus([{ ok: true }, { ok: false }]), 'failed');
assert.equal(progress.getRequestStatus([]), 'completed');
assert.equal(progress.getFinalStatus(true, [{ ok: false }]), 'completedWithWarning');
assert.equal(progress.getFinalStatus(true, [{ ok: true }]), 'completed');
assert.equal(progress.getFinalStatus(false, []), 'writeFailed');

console.log('AI review daily progress verification passed');
