import { strict as assert } from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';

const companionPath = new URL('../shared/obsidianCompanion.ts', import.meta.url);
const validationPath = new URL('../shared/obsidianCompanionValidation.ts', import.meta.url);

assert.equal(existsSync(validationPath), true, 'Companion validation module should exist.');

const companionSource = readFileSync(companionPath, 'utf8');
const validationSource = readFileSync(validationPath, 'utf8');

assert.match(companionSource, /from '\.\/obsidianCompanionValidation';/, 'Companion facade should re-export validation helpers.');
assert.doesNotMatch(companionSource, /export function isCaptureItem\b/, 'Companion facade should not retain capture validation.');
assert.doesNotMatch(companionSource, /export function readCompanionSyncPlan\b/, 'Companion facade should not retain sync-plan reading.');
assert.match(validationSource, /export function isCaptureItem\b/, 'Validation module should own capture-item validation.');
assert.match(validationSource, /export function isCompanionRule\b/, 'Validation module should own rule validation.');
assert.match(validationSource, /export function isSyncPlan\b/, 'Validation module should own sync-plan validation.');
assert.match(validationSource, /export function readCompanionWriteResult\b/, 'Validation module should own write-result reading.');
assert.match(validationSource, /import \{ isObjectRecord \} from '\.\/unknownValueGuards';/, 'Validation module should reuse the shared record guard.');

console.log('Obsidian Companion validation verification passed');
