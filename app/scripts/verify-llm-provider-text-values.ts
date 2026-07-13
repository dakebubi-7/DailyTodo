import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const root = path.join(import.meta.dirname, '..');
const parserPath = path.join(root, 'shared/llm/llmProviderResponseParsing.ts');
const valuesPath = path.join(root, 'shared/llm/llmProviderTextValues.ts');

assert.ok(fs.existsSync(valuesPath), 'Provider text-value normalization should have a focused module.');

const parserSource = fs.readFileSync(parserPath, 'utf-8');
const valuesSource = fs.readFileSync(valuesPath, 'utf-8');

assert.match(parserSource, /from '\.\/llmProviderTextValues'/, 'Provider protocol parsers should compose text-value normalization.');
assert.doesNotMatch(parserSource, /function textFromValue\(/, 'Provider protocol parsers should not retain generic text-value normalization.');
assert.match(valuesSource, /export function textFromValue\(/, 'Text-value module should own generic text normalization.');
assert.match(valuesSource, /export function firstText\(/, 'Text-value module should own non-empty text selection.');
assert.match(valuesSource, /export function firstTextPreserveWhitespace\(/, 'Text-value module should own stream-safe text selection.');

console.log('LLM provider text-values module verification passed');
