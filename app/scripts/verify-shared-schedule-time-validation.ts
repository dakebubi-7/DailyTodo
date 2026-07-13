import { strict as assert } from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const cwd = process.cwd();
const root = existsSync(join(cwd, 'app')) ? join(cwd, 'app') : cwd;
const parserPath = join(root, 'shared/aiReview/scheduleTimeParsing.ts');
const appSettingsPath = join(root, 'shared/appSettings.ts');
const aiSettingsPath = join(root, 'shared/aiReview/aiReviewSettingsNormalization.ts');

assert.ok(existsSync(parserPath), 'schedule time validation module should exist');

const parserSource = readFileSync(parserPath, 'utf8');
const appSettingsSource = readFileSync(appSettingsPath, 'utf8');
const aiSettingsSource = readFileSync(aiSettingsPath, 'utf8');

assert.match(parserSource, /export function isScheduleTime\b/, 'schedule time module should expose a shared validator');
assert.match(appSettingsSource, /isScheduleTime/, 'app settings should consume the shared schedule time validator');
assert.match(aiSettingsSource, /isScheduleTime/, 'AI review settings should consume the shared schedule time validator');

const { isScheduleTime } = await import(pathToFileURL(parserPath).href);

for (const value of ['00:00', '09:30', '23:59']) {
  assert.equal(isScheduleTime(value), true, `${value} should be valid`);
}

for (const value of ['9:30', '24:00', '12:60', null, ['09:30']]) {
  assert.equal(isScheduleTime(value), false, `${String(value)} should be invalid`);
}

console.log('Shared schedule time validation verification passed.');
