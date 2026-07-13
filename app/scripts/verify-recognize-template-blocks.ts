import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { parseRecognizedBlocks } from '../shared/recognizeTemplateBlocks';

const result = parseRecognizedBlocks('## 复盘\n第一次内容\n## 复盘\n第二次内容', []);

assert.equal(result.blocks.length, 1, 'duplicate headings should produce one custom block');
assert.equal(result.blocks[0]?.name, '复盘', 'the first duplicate heading should be retained');
assert.equal(result.confidence, 'medium', 'duplicate headings should lower recognition confidence');

const fencedHeadingResult = parseRecognizedBlocks([
  '## Normal block',
  '```markdown',
  '## Example heading',
  '```',
].join('\n'), []);

assert.equal(fencedHeadingResult.blocks.length, 1, 'headings inside fenced code blocks should not create custom blocks');
assert.equal(fencedHeadingResult.blocks[0]?.name, 'Normal block', 'only the real Markdown heading should be recognized');
assert.equal(fencedHeadingResult.confidence, 'high', 'ignored code-block headings should not lower recognition confidence');

const closingHashResult = parseRecognizedBlocks('## Weekly review ##\nSummary', []);

assert.equal(closingHashResult.blocks[0]?.name, 'Weekly review', 'ATX closing hashes should not become part of the custom block name');

const indentedHeadingResult = parseRecognizedBlocks('   ## Indented block\nSummary', []);

assert.equal(indentedHeadingResult.blocks[0]?.name, 'Indented block', 'ATX headings with up to three leading spaces should be recognized');

const invalidFenceCloseResult = parseRecognizedBlocks([
  '## Normal block',
  '```markdown',
  '``` not a close',
  '## Example heading',
  '```',
].join('\n'), []);

assert.equal(invalidFenceCloseResult.blocks.length, 1, 'a fence line with trailing text should not close a fenced code block');
assert.equal(invalidFenceCloseResult.blocks[0]?.name, 'Normal block', 'headings after an invalid fence close should remain code-block content');

const codeIndentedFenceResult = parseRecognizedBlocks([
  '    ```markdown',
  '## Real heading',
].join('\n'), []);

assert.equal(codeIndentedFenceResult.blocks.length, 1, 'a four-space-indented fence should remain code content, not hide following headings');
assert.equal(codeIndentedFenceResult.blocks[0]?.name, 'Real heading', 'the heading after code-indented fence text should still be recognized');

const unicodeWhitespaceDuplicateResult = parseRecognizedBlocks([
  '## Weekly review',
  'First section',
  '## Weekly\u00a0review',
  'Duplicate section',
].join('\n'), []);

assert.equal(unicodeWhitespaceDuplicateResult.blocks.length, 1, 'headings differing only by non-breaking spaces should not create duplicate custom blocks');
assert.equal(unicodeWhitespaceDuplicateResult.blocks[0]?.name, 'Weekly review', 'the first normalized heading name should be retained');
assert.equal(unicodeWhitespaceDuplicateResult.confidence, 'medium', 'a normalized duplicate heading should lower recognition confidence');

const recognitionSource = readFileSync('shared/recognizeTemplateBlocks.ts', 'utf8');
assert.ok(
  !recognitionSource.includes('const listLines = lines.filter('),
  'render-type inference should count list items while scanning cleaned lines instead of allocating a second filtered array',
);

console.log('Recognized-template block verification passed');
