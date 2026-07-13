import { strict as assert } from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const cwd = process.cwd();
const root = existsSync(join(cwd, 'app')) ? join(cwd, 'app') : cwd;
const parserPath = join(root, 'shared/aiReview/templateFileParsing.ts');
const facadePath = join(root, 'shared/aiReview/templateFile.ts');

assert.ok(existsSync(parserPath), 'templateFileParsing.ts should exist');

const parserSource = readFileSync(parserPath, 'utf8');
const facadeSource = readFileSync(facadePath, 'utf8');
assert.match(parserSource, /export async function parseTemplateFile\b/, 'parser module should own template content parsing');
assert.match(facadeSource, /export \{ parseTemplateFile \} from '\.\/templateFileParsing'/, 'template file module should retain the parser compatibility export');
assert.match(facadeSource, /export type \{ ParseTemplateResult \} from '\.\/templateFileParsing'/, 'template file module should retain the parser result compatibility type');

const parser = await import(pathToFileURL(parserPath).href);
const facade = await import(pathToFileURL(facadePath).href);

assert.deepEqual(await parser.parseTemplateFile(Buffer.from('  # Template  '), 'daily.md'), { ok: true, text: '# Template' });
assert.deepEqual(await parser.parseTemplateFile(Buffer.from('   '), 'daily.txt'), { ok: false, error: '文件内容为空' });
assert.deepEqual(await parser.parseTemplateFile(Buffer.from('docx'), 'daily.docx'), { ok: false, error: '缺少 .docx 解析器' });
assert.deepEqual(
  await parser.parseTemplateFile(Buffer.from('docx'), 'daily.docx', async () => '  提取内容  '),
  { ok: true, text: '提取内容' },
);
assert.deepEqual(await facade.parseTemplateFile(Buffer.from('text'), 'daily.md'), { ok: true, text: 'text' });

console.log('AI Review template file parsing verification passed.');
