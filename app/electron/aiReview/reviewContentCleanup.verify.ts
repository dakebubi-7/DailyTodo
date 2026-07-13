import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanReviewContent, stripDuplicateReviewHeading } from './reviewContentCleanup';

assert.equal(
  cleanReviewContent('intro\nDAILYTODO_FINAL_START\nfinal body\nDAILYTODO_FINAL_END\nignored'),
  'final body',
  'final block should take precedence over surrounding model output',
);

assert.equal(
  cleanReviewContent('```markdown\nLet me summarize:\n\nuseful body\n```'),
  'useful body',
  'cleanup should remove fences and leading model narration',
);

assert.equal(
  stripDuplicateReviewHeading('## Progress\n\nDetails', 'Progress', 'Fallback', '2026-07-13'),
  'Details',
  'matching outer heading should not be duplicated inside its managed block',
);

assert.equal(
  stripDuplicateReviewHeading('## Different topic\n\nDetails', 'Progress', 'Fallback', '2026-07-13'),
  '## Different topic\n\nDetails',
  'a meaningful AI subheading should be preserved',
);

const runnerSource = readFileSync(join(import.meta.dirname, 'runner.ts'), 'utf8');
assert.doesNotMatch(
  runnerSource,
  /function isMetaPrefixLine\(/,
  'runner should delegate response-prefix recognition to the cleanup module',
);

console.log('review content cleanup verification passed');
