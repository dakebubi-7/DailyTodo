import { strict as assert } from 'node:assert';
import { insertDailyCommandMarkdown, shouldOpenDailyCommandMenu } from '../src/utils/dailyCommandEditor';

assert.equal(shouldOpenDailyCommandMenu('abc/', 4), true, 'slash at the cursor should open the command menu');
assert.equal(shouldOpenDailyCommandMenu('abc/def', 4), true, 'slash in the middle should open the command menu');
assert.equal(shouldOpenDailyCommandMenu('abc/def', 7), false, 'cursor away from slash should close the command menu');

const middleInsert = insertDailyCommandMarkdown('before / after', '- [ ] task', 8);
assert.deepEqual(
  middleInsert,
  { value: 'before - [ ] task after', cursor: 17 },
  'command insertion should replace the slash at the cursor without jumping to the bottom',
);

const selectionInsert = insertDailyCommandMarkdown('before /old after', '- [x] done', 8, 11);
assert.deepEqual(
  selectionInsert,
  { value: 'before - [x] done after', cursor: 17 },
  'command insertion should replace the selected range from the cursor position',
);

console.log('Daily command editor verification passed');
