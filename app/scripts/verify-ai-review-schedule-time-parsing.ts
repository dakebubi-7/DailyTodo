import { strict as assert } from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const cwd = process.cwd();
const root = existsSync(join(cwd, 'app')) ? join(cwd, 'app') : cwd;
const parserPath = join(root, 'shared/aiReview/scheduleTimeParsing.ts');
const timerPath = join(root, 'shared/aiReview/timer.ts');

assert.ok(existsSync(parserPath), 'scheduleTimeParsing.ts should exist');

const parserSource = readFileSync(parserPath, 'utf8');
const timerSource = readFileSync(timerPath, 'utf8');
assert.match(parserSource, /export function parseScheduleTime\b/, 'schedule time parser should expose the shared parser');
assert.match(timerSource, /from '\.\/scheduleTimeParsing'/, 'timer module should consume the shared schedule time parser');

const { parseScheduleTime } = await import(pathToFileURL(parserPath).href);

assert.deepEqual(parseScheduleTime('09:30', { hours: 23, minutes: 0 }), { hours: 9, minutes: 30 });
assert.deepEqual(parseScheduleTime('9:30', { hours: 23, minutes: 0 }), { hours: 23, minutes: 0 });
assert.deepEqual(parseScheduleTime('24:00', { hours: 9, minutes: 0 }), { hours: 9, minutes: 0 });

console.log('AI Review schedule time parsing verification passed.');
