import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const root = path.join(import.meta.dirname, '..');
const runnerPath = path.join(root, 'electron/aiReview/runner.ts');
const fillingPath = path.join(root, 'electron/aiReview/reviewBlockFilling.ts');

assert.ok(fs.existsSync(fillingPath), 'Review-block filling should have a focused implementation module.');

const runnerSource = fs.readFileSync(runnerPath, 'utf-8');
const fillingSource = fs.readFileSync(fillingPath, 'utf-8');

assert.match(runnerSource, /from '\.\/reviewBlockFilling'/, 'Runner should delegate individual block filling.');
assert.doesNotMatch(runnerSource, /function buildDeterministicTomorrowBody/, 'Carryover policy belongs to the block-filling module.');
assert.doesNotMatch(runnerSource, /async function fillReviewBlock/, 'Single-block execution belongs to the block-filling module.');
assert.match(fillingSource, /export async function fillReviewBlock/, 'Block-filling module should own individual block execution.');
assert.match(fillingSource, /export function findNearestHeadingBeforeMarker/, 'Block-filling module should own managed-heading lookup.');
assert.match(fillingSource, /function buildDeterministicTomorrowBody/, 'Block-filling module should own deterministic carryover content.');

console.log('AI review block-filling module verification passed');
