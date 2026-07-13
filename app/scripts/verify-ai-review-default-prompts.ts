import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_EXTERNAL_MONTHLY_SYSTEM,
  DEFAULT_EXTERNAL_WEEKLY_SYSTEM,
  DEFAULT_MONTHLY_SYSTEM,
  DEFAULT_WEEKLY_SYSTEM,
} from '../shared/aiReview/defaultPrompts';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const defaultsPath = join(root, 'shared/aiReview/defaultPrompts.ts');
const weeklyPath = join(root, 'shared/aiReview/defaultWeeklyPrompts.ts');
const monthlyPath = join(root, 'shared/aiReview/defaultMonthlyPrompts.ts');

assert.ok(existsSync(weeklyPath), 'Weekly report default prompts should have a dedicated module.');
assert.ok(existsSync(monthlyPath), 'Monthly report default prompts should have a dedicated module.');

const defaults = readFileSync(defaultsPath, 'utf8');
const weekly = readFileSync(weeklyPath, 'utf8');
const monthly = readFileSync(monthlyPath, 'utf8');

assert.match(weekly, /export const DEFAULT_WEEKLY_SYSTEM\b/, 'Weekly prompt module should own the personal prompt.');
assert.match(weekly, /export const DEFAULT_EXTERNAL_WEEKLY_SYSTEM\b/, 'Weekly prompt module should own the external prompt.');
assert.match(monthly, /export const DEFAULT_MONTHLY_SYSTEM\b/, 'Monthly prompt module should own the personal prompt.');
assert.match(monthly, /export const DEFAULT_EXTERNAL_MONTHLY_SYSTEM\b/, 'Monthly prompt module should own the external prompt.');
assert.match(defaults, /from '\.\/defaultWeeklyPrompts'/, 'Default prompt facade should re-export weekly prompts.');
assert.match(defaults, /from '\.\/defaultMonthlyPrompts'/, 'Default prompt facade should re-export monthly prompts.');

assert.match(DEFAULT_WEEKLY_SYSTEM, /类型: 周报/);
assert.match(DEFAULT_EXTERNAL_WEEKLY_SYSTEM, /类型: 对外周报/);
assert.match(DEFAULT_MONTHLY_SYSTEM, /类型: 月报/);
assert.match(DEFAULT_EXTERNAL_MONTHLY_SYSTEM, /类型: 对外月报/);

console.log('AI review default prompts verification passed');
