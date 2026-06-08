import { strict as assert } from 'node:assert';
import { parseTemplateFile, fileExt } from '../shared/aiReview/templateFile';

// 扩展名解析
assert.equal(fileExt('a.md'), 'md');
assert.equal(fileExt('A.TXT'), 'txt');
assert.equal(fileExt('report.final.docx'), 'docx');
assert.equal(fileExt('noext'), '');

// .md / .txt：utf-8 解码 + trim
const md = await parseTemplateFile(Buffer.from('  ## 周报\n要点  ', 'utf-8'), 'my.md');
assert.equal(md.ok, true);
assert.equal(md.ok && md.text, '## 周报\n要点');

const txt = await parseTemplateFile(Buffer.from('纯文本模板', 'utf-8'), 'note.txt');
assert.equal(txt.ok && txt.text, '纯文本模板');

// 空内容 → 错误
const empty = await parseTemplateFile(Buffer.from('   \n  ', 'utf-8'), 'blank.md');
assert.equal(empty.ok, false);

// .docx：走注入的提取器
const docx = await parseTemplateFile(Buffer.from('binary'), 'sample.docx', async () => '  从 docx 提取的文字  ');
assert.equal(docx.ok, true);
assert.equal(docx.ok && docx.text, '从 docx 提取的文字');

// .docx 提取为空（扫描件/纯图片）→ 错误
const docxEmpty = await parseTemplateFile(Buffer.from('binary'), 'scan.docx', async () => '   ');
assert.equal(docxEmpty.ok, false);

// .docx 缺提取器 → 错误（不崩）
const docxNoExtractor = await parseTemplateFile(Buffer.from('binary'), 'x.docx');
assert.equal(docxNoExtractor.ok, false);

// .docx 提取器抛错 → 归一化为 ok:false，不冒泡
const docxThrows = await parseTemplateFile(Buffer.from('binary'), 'x.docx', async () => { throw new Error('坏文件'); });
assert.equal(docxThrows.ok, false);
assert.ok(!docxThrows.ok && docxThrows.error.includes('坏文件'));

// 不支持的扩展名 → 错误
const pdf = await parseTemplateFile(Buffer.from('%PDF'), 'doc.pdf');
assert.equal(pdf.ok, false);
assert.ok(!pdf.ok && pdf.error.includes('不支持'));

console.log('Template file parsing verification passed');
