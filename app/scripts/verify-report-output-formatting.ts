import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = join(import.meta.dirname, '..');
const formattingPath = join(root, 'shared', 'reportOutputFormatting.ts');
const generatorPath = join(root, 'shared', 'reportGenerator.ts');

assert(existsSync(formattingPath), 'report output formatting module should exist');

const formatting = await import(pathToFileURL(formattingPath).href);
const generator = await import(pathToFileURL(generatorPath).href);

assert.equal(
  formatting.validateBlockOutput('first\nsecond', 'list').output,
  '- first\n- second',
  'plain list output should gain Markdown bullets',
);
assert.equal(
  formatting.validateBlockOutput('- first\nsecond', 'list').output,
  '- first\nsecond',
  'existing list output should remain unchanged apart from trimming',
);
assert.deepEqual(
  formatting.validateBlockOutput('summary', 'table'),
  { output: 'summary\n\n⚠️ 表格格式识别失败,降级为文本', downgraded: true },
  'invalid table output should retain content and mark the downgrade',
);
assert.deepEqual(
  formatting.validateBlockOutput('summary', 'callout'),
  { output: 'summary\n\n⚠️ Callout 格式识别失败,降级为文本', downgraded: true },
  'invalid callout output should retain content and mark the downgrade',
);
assert.deepEqual(
  formatting.validateBlockOutput('summary', 'dataview'),
  { output: 'summary\n\n⚠️ Dataview 格式识别失败,降级为文本', downgraded: true },
  'invalid Dataview output should retain content and mark the downgrade',
);
assert.deepEqual(
  generator.validateBlockOutput('  plain text  ', 'text'),
  { output: 'plain text', downgraded: false },
  'report generator should retain the public output-validation export',
);

const generatorSource = readFileSync(generatorPath, 'utf8');
assert.match(
  generatorSource,
  /export\s*\{\s*validateBlockOutput\s*\}\s*from\s*['"]\.\/reportOutputFormatting['"];/,
  'report generator should re-export the extracted output formatter',
);

console.log('Report output formatting verification passed.');
