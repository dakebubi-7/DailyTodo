import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inspectDailyAiContentWithSnapshot } from '../electron/aiReviewDailyContentInspection';
import { REVIEW_MARKERS } from '../shared/aiReview/markers';

const vault = fs.mkdtempSync(join(tmpdir(), 'dailytodo-ai-daily-inspection-'));
const date = '2026-07-13';
const filePath = join(vault, `${date}.md`);
const getDailyFilePath = (requestedDate?: string) => join(vault, `${requestedDate ?? date}.md`);

const missing = inspectDailyAiContentWithSnapshot(getDailyFilePath, date);
assert.deepEqual(
  missing,
  { exists: false, hasAiContent: false, filePath },
  'missing daily notes should preserve the safe inspection result without a snapshot',
);

const content = `# Daily\n\n${REVIEW_MARKERS.REVIEW.start}\ngenerated review\n${REVIEW_MARKERS.REVIEW.end}`;
fs.writeFileSync(filePath, content, 'utf8');

const inspection = inspectDailyAiContentWithSnapshot(getDailyFilePath, date);
assert.equal(inspection.exists, true, 'an existing daily note should be reported as present');
assert.equal(inspection.hasAiContent, true, 'managed AI markers should be detected from the stable snapshot');
assert.equal(inspection.filePath, filePath, 'inspection should report the resolved daily note path');
assert.equal(inspection.snapshot?.content, content, 'inspection should retain the content it classified');
assert.equal(inspection.snapshot?.stamp.size, Buffer.byteLength(content), 'snapshot stamps should use the inspected file size');
assert.equal(typeof inspection.snapshot?.stamp.mtimeMs, 'number', 'snapshot stamps should retain the inspected modification time');

console.log('electron AI daily content inspection verification passed');
