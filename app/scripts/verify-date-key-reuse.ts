import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const app = readFileSync(join(root, 'src/App.tsx'), 'utf8');
const dateNavigator = readFileSync(join(root, 'src/components/DateNavigator.tsx'), 'utf8');
const stats = readFileSync(join(root, 'shared/aiReview/stats.ts'), 'utf8');

assert.ok(
  app.includes("import { shiftDateKey } from '../shared/taskRollover';"),
  'App should reuse shared shiftDateKey.'
);
assert.doesNotMatch(app, /function shiftDate\(/, 'App should not define a local date shifting helper.');

assert.ok(
  dateNavigator.includes("import { formatLocalDateKey, shiftDateKey } from '../../shared/taskRollover';"),
  'DateNavigator should reuse shared date key helpers.'
);
assert.doesNotMatch(
  dateNavigator,
  /function getLocalDateKey\(/,
  'DateNavigator should not define a local date key formatter.'
);
assert.doesNotMatch(
  dateNavigator,
  /function shiftDate\(/,
  'DateNavigator should not define a local date shifting helper.'
);
assert.ok(
  dateNavigator.includes('onDateChange(shiftDateKey(selectedDate, -1))'),
  'DateNavigator previous-day control should use shared shiftDateKey.'
);
assert.ok(
  dateNavigator.includes('onDateChange(shiftDateKey(selectedDate, 1))'),
  'DateNavigator next-day control should use shared shiftDateKey.'
);

assert.ok(
  stats.includes("import { shiftDateKey } from '../taskRollover';"),
  'AI stats should reuse shared shiftDateKey.'
);
assert.doesNotMatch(stats, /function shiftDate\(/, 'AI stats should not define a local date shifting helper.');
assert.ok(stats.includes('cursor = shiftDateKey(cursor, -1);'), 'AI stats streak cursor should use shared shiftDateKey.');

console.log('verify-date-key-reuse passed');
