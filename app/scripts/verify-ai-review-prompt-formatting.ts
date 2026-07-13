import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatDailyStats, getCustomBlockDefaultPrompt, getRenderTypeInstruction } from '../shared/aiReview/promptFormatting';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const formattingPath = join(root, 'shared/aiReview/promptFormatting.ts');
const builderPath = join(root, 'shared/aiReview/promptBuilder.ts');

assert.ok(existsSync(formattingPath), 'AI review prompt formatting should live in a dedicated pure module.');

const formatting = readFileSync(formattingPath, 'utf8');
const builder = readFileSync(builderPath, 'utf8');

assert.match(formatting, /export function formatDailyStats\b/, 'formatting module should export daily-stat rendering.');
assert.match(formatting, /export function getRenderTypeInstruction\b/, 'formatting module should export render-type instructions.');
assert.match(formatting, /export function getCustomBlockDefaultPrompt\b/, 'formatting module should export the custom-block prompt fallback.');
assert.match(builder, /formatDailyStats\(stats\)/, 'message builder should delegate daily-stat rendering.');
assert.match(builder, /getRenderTypeInstruction\(block\.renderType\)/, 'message builder should delegate render-type instructions.');
assert.match(builder, /getCustomBlockDefaultPrompt\(block\.name\)/, 'message builder should delegate the custom-block fallback prompt.');

assert.match(formatDailyStats({ date: '2026-07-13', total: 8, completed: 6, completionRate: 75 }), /8/);
assert.match(formatDailyStats({ date: '2026-07-13', total: 8, completed: 6, completionRate: 75 }), /75%/);
assert.match(getRenderTypeInstruction('table'), /Markdown/);
assert.match(getRenderTypeInstruction('dataview'), /dataview/i);
assert.match(getCustomBlockDefaultPrompt('Plan'), /Plan/);

console.log('AI review prompt formatting verification passed');
