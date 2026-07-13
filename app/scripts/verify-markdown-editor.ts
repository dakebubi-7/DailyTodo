import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import {
  continueListOnEnter,
  wrapSelection,
} from '../src/utils/markdownEditor';
import {
  indentSelection,
  outdentSelection,
} from '../src/utils/markdownEditorIndentation';

const hookSource = readFileSync(new URL('../src/hooks/useMarkdownEditor.ts', import.meta.url), 'utf8');
const editorSource = readFileSync(new URL('../src/utils/markdownEditor.ts', import.meta.url), 'utf8');
const indentationModuleUrl = new URL('../src/utils/markdownEditorIndentation.ts', import.meta.url);
const indentationModuleSource = readFileSync(indentationModuleUrl, 'utf8');
const textareaModuleUrl = new URL('../src/hooks/markdownEditorTextarea.ts', import.meta.url);
const textareaModuleSource = readFileSync(textareaModuleUrl, 'utf8');

assert.match(
  indentationModuleSource,
  /export function indentSelection\b/,
  'Indentation commands should live in a dedicated pure editor module.',
);
assert.match(
  indentationModuleSource,
  /export function outdentSelection\b/,
  'Outdentation commands should live beside indentation in the dedicated pure editor module.',
);
assert.match(
  editorSource,
  /export \{ indentSelection, outdentSelection \} from '\.\/markdownEditorIndentation';/,
  'The markdown editor facade should preserve the indentation command API through the extracted module.',
);
assert.doesNotMatch(
  editorSource,
  /function selectedLineStarts\b|const INDENT =/,
  'The markdown editor facade should not retain indentation implementation details after extraction.',
);

assert.match(
  textareaModuleSource,
  /export function restoreTextareaSelection\b/,
  'Textarea selection restoration should live in a dedicated DOM helper module.',
);
assert.match(
  textareaModuleSource,
  /export function scrollCaretIntoView\b/,
  'Textarea caret scrolling should live in the dedicated DOM helper module.',
);
assert.match(
  textareaModuleSource,
  /function measureCaret\b/,
  'Textarea caret measurement should stay private to the DOM helper module.',
);
assert.match(
  hookSource,
  /import \{ restoreTextareaSelection \} from '\.\/markdownEditorTextarea';/,
  'The React hook should delegate DOM selection restoration to the dedicated helper.',
);
assert.doesNotMatch(
  hookSource,
  /function measureCaret\b|function scrollCaretIntoView\b|const MIRROR_STYLE_PROPS/,
  'The React hook should not retain textarea mirror and scrolling mechanics after extraction.',
);

assert.doesNotMatch(
  hookSource,
  /mirror\.style\[prop as any\]/,
  'Markdown editor caret mirror should copy style properties without casting CSS property names to any.',
);
assert.doesNotMatch(
  hookSource,
  /style\[prop as any\]/,
  'Markdown editor caret mirror should read computed style properties without casting CSS property names to any.',
);
assert.doesNotMatch(
  editorSource,
  /\[\.\.\.starts\]\.reverse\(\)\.forEach\(/,
  'Multi-line indentation should build the result in source order instead of repeatedly rebuilding the full text.',
);

// Tab 缩进:行首插入四个空格
{
  const r = indentSelection({ value: 'hello', selectionStart: 2, selectionEnd: 2 });
  assert.equal(r.value, '    hello', 'Tab 应在行首插入四个空格');
  assert.equal(r.selectionStart, 6);
}

// 多行缩进
{
  const r = indentSelection({ value: 'a\nb', selectionStart: 0, selectionEnd: 3 });
  assert.equal(r.value, '    a\n    b', '多行选区每行都缩进');
}

// Shift+Tab 反缩进
{
  const r = outdentSelection({ value: '    hello', selectionStart: 6, selectionEnd: 6 });
  assert.equal(r.value, 'hello', 'Shift+Tab 应移除行首四个空格');
}

// 反缩进:不足四个空格也尽量移除
{
  const r = outdentSelection({ value: '  hi', selectionStart: 3, selectionEnd: 3 });
  assert.equal(r.value, 'hi', '不足四空格也移除现有空格');
}

// 回车续无序列表
{
  const value = '- 第一项';
  const r = continueListOnEnter({ value, selectionStart: value.length, selectionEnd: value.length });
  assert.ok(r, '无序列表行末回车应接管');
  assert.equal(r!.value, '- 第一项\n- ', '应续上 "- "');
}

// 回车续任务列表
{
  const value = '- [ ] 做事';
  const r = continueListOnEnter({ value, selectionStart: value.length, selectionEnd: value.length });
  assert.ok(r);
  assert.equal(r!.value, '- [ ] 做事\n- [ ] ', '任务列表续 "- [ ] "');
}

// 回车续有序列表并自增
{
  const value = '1. 一';
  const r = continueListOnEnter({ value, selectionStart: value.length, selectionEnd: value.length });
  assert.ok(r);
  assert.equal(r!.value, '1. 一\n2. ', '有序列表序号自增');
}

// 回车续多级编号(带末尾点)
{
  const value = '1.1. 子项';
  const r = continueListOnEnter({ value, selectionStart: value.length, selectionEnd: value.length });
  assert.ok(r);
  assert.equal(r!.value, '1.1. 子项\n1.2. ', '多级编号末层自增');
}

// 回车续多级编号(末尾无点的自然写法)
{
  const value = '1.1 子项';
  const r = continueListOnEnter({ value, selectionStart: value.length, selectionEnd: value.length });
  assert.ok(r, '末尾无点的多级编号也应续行');
  assert.equal(r!.value, '1.1 子项\n1.2 ', '续行沿用无点风格');
}

// 回车续三级编号
{
  const value = '2.3.1 深一层';
  const r = continueListOnEnter({ value, selectionStart: value.length, selectionEnd: value.length });
  assert.ok(r);
  assert.equal(r!.value, '2.3.1 深一层\n2.3.2 ', '三级编号末层自增');
}

// 单级编号必须带分隔符:"1 内容" 不是列表
{
  const value = '1 普通文本';
  const r = continueListOnEnter({ value, selectionStart: value.length, selectionEnd: value.length });
  assert.equal(r, null, '单级数字无分隔符不视为列表');
}

// 空列表项回车 → 结束列表
{
  const value = '- ';
  const r = continueListOnEnter({ value, selectionStart: value.length, selectionEnd: value.length });
  assert.ok(r);
  assert.equal(r!.value, '', '空列表项回车应清空标记结束列表');
}

// 非列表行回车 → 不接管
{
  const value = '普通文本';
  const r = continueListOnEnter({ value, selectionStart: value.length, selectionEnd: value.length });
  assert.equal(r, null, '非列表行不接管,走默认换行');
}

// 行中间回车 → 在光标处续列表(支持任意位置换行续行)
{
  const value = '- 内容';
  const r = continueListOnEnter({ value, selectionStart: 2, selectionEnd: 2 });
  assert.ok(r, '列表行内回车应在光标处续列表');
  assert.equal(r!.value, '- \n- 内容', '光标处插入换行并续上标记');
}

// 加粗包裹
{
  const r = wrapSelection({ value: 'word', selectionStart: 0, selectionEnd: 4 }, '**');
  assert.equal(r.value, '**word**', '加粗包裹选中文字');
  assert.equal(r.selectionStart, 2);
  assert.equal(r.selectionEnd, 6);
}

// 再次加粗 → 取消
{
  const r = wrapSelection({ value: '**word**', selectionStart: 2, selectionEnd: 6 }, '**');
  assert.equal(r.value, 'word', '再次加粗应取消标记');
}

// 斜体
{
  const r = wrapSelection({ value: 'x', selectionStart: 0, selectionEnd: 1 }, '*');
  assert.equal(r.value, '*x*', '斜体包裹');
}

console.log('Markdown editor verification passed');
