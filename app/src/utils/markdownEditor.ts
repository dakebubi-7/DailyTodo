/**
 * 「今日工作 / 灵感闪念」纯文本编辑框的 Markdown 输入辅助。
 * 所有函数为纯函数:输入当前文本 + 选区,返回新文本 + 新光标位置。
 * 不引入任何编辑器框架,输出始终是纯 Markdown 文本(与 Obsidian 同步格式一致)。
 */

export interface EditorState {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

export interface EditorResult {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

const INDENT = '    '; // 四个空格 = 一级缩进

function lineBounds(value: string, pos: number) {
  const start = value.lastIndexOf('\n', pos - 1) + 1;
  const endIdx = value.indexOf('\n', pos);
  const end = endIdx === -1 ? value.length : endIdx;
  return { start, end };
}

/** 选区覆盖到的所有行的起始下标(用于多行缩进)。 */
function selectedLineStarts(value: string, selStart: number, selEnd: number) {
  const first = value.lastIndexOf('\n', selStart - 1) + 1;
  const starts: number[] = [];
  let i = first;
  while (i <= selEnd) {
    starts.push(i);
    const next = value.indexOf('\n', i);
    if (next === -1 || next >= selEnd) break;
    i = next + 1;
  }
  if (!starts.length) starts.push(first);
  return starts;
}

/** Tab:在选中的每一行行首插入一级缩进。 */
export function indentSelection(state: EditorState): EditorResult {
  const { value, selectionStart, selectionEnd } = state;
  const starts = selectedLineStarts(value, selectionStart, selectionEnd);
  let next = value;
  // 从后往前插入,避免下标偏移。
  [...starts].reverse().forEach((s) => {
    next = next.slice(0, s) + INDENT + next.slice(s);
  });
  return {
    value: next,
    selectionStart: selectionStart + INDENT.length,
    selectionEnd: selectionEnd + INDENT.length * starts.length,
  };
}

/** Shift+Tab:移除选中每一行行首的一级缩进(最多四个空格 / 一个 Tab)。 */
export function outdentSelection(state: EditorState): EditorResult {
  const { value, selectionStart, selectionEnd } = state;
  const starts = selectedLineStarts(value, selectionStart, selectionEnd);
  let next = value;
  let removedBeforeStart = 0;
  let removedTotal = 0;
  [...starts].reverse().forEach((s) => {
    const slice = next.slice(s, s + INDENT.length);
    let removeLen = 0;
    if (slice === INDENT) removeLen = INDENT.length;
    else if (slice[0] === '\t') removeLen = 1;
    else {
      const spaces = slice.match(/^ +/);
      removeLen = spaces ? Math.min(spaces[0].length, INDENT.length) : 0;
    }
    if (removeLen > 0) {
      next = next.slice(0, s) + next.slice(s + removeLen);
      removedTotal += removeLen;
      if (s < selectionStart) removedBeforeStart += removeLen;
    }
  });
  return {
    value: next,
    selectionStart: Math.max(0, selectionStart - removedBeforeStart),
    selectionEnd: Math.max(0, selectionEnd - removedTotal),
  };
}

interface ListMarker {
  indent: string;
  marker: string; // 续行要插入的标记(含末尾空格),如 "- "、"- [ ] "、"2. "
  isEmpty: boolean; // 当前项内容是否为空(决定回车是续列表还是结束列表)
  fullPrefixLen: number; // 行首标记总长度(用于判断"空项")
}

/** 解析某一行是否为列表项,返回续行所需的标记。 */
function parseListLine(line: string): ListMarker | null {
  const indentMatch = line.match(/^(\s*)/);
  const indent = indentMatch ? indentMatch[1] : '';
  const rest = line.slice(indent.length);

  // 任务列表 - [ ] / - [x]
  const task = rest.match(/^([-*+])\s\[([ xX])\]\s(.*)$/);
  if (task) {
    const content = task[3];
    return {
      indent,
      marker: `${task[1]} [ ] `,
      isEmpty: content.trim() === '',
      fullPrefixLen: indent.length + 6,
    };
  }

  // 有序列表 1. 2. 1) 以及多级编号 1.1 / 1.1.1
  // 末尾分隔符 . 或 ) 在多级编号(含点)时可省略，这样自然书写的 "1.1 内容" 也能续行。
  // 单级编号必须带分隔符，否则 "1 内容""2024 年" 这种普通文本会被误判为列表。
  const ordered = rest.match(/^(\d+(?:\.\d+)*)([.)]?)\s(.*)$/);
  if (ordered) {
    const numStr = ordered[1];
    const sep = ordered[2]; // 可能为空字符串
    const content = ordered[3];
    const isMultiLevel = numStr.includes('.');
    if (sep || isMultiLevel) {
      // 拆分编号段，取最后一层递增，其余保持
      const parts = numStr.split('.');
      const lastIdx = parts.length - 1;
      parts[lastIdx] = String(Number(parts[lastIdx]) + 1);
      const nextMarker = parts.join('.') + sep + ' '; // 沿用原行的分隔符风格(可能为空)
      return {
        indent,
        marker: nextMarker,
        isEmpty: content.trim() === '',
        fullPrefixLen: indent.length + numStr.length + sep.length + 1,
      };
    }
  }

  // 无序列表 - * +
  const unordered = rest.match(/^([-*+])\s(.*)$/);
  if (unordered) {
    const content = unordered[2];
    return {
      indent,
      marker: `${unordered[1]} `,
      isEmpty: content.trim() === '',
      fullPrefixLen: indent.length + 2,
    };
  }

  return null;
}

/**
 * 回车:若当前行是列表项,自动续上同类标记;
 * 若当前项为空,则结束列表(清空本行标记)。
 * 返回 null 表示不接管(走默认换行)。
 */
export function continueListOnEnter(state: EditorState): EditorResult | null {
  const { value, selectionStart, selectionEnd } = state;
  if (selectionStart !== selectionEnd) return null; // 有选区时不接管

  const { start, end } = lineBounds(value, selectionStart);
  const line = value.slice(start, end);
  const parsed = parseListLine(line);
  if (!parsed) return null;

  // 检查当前行是否为空列表项（光标在行末且内容为空）
  if (parsed.isEmpty && selectionStart === end) {
    // 空列表项 → 结束列表:删掉本行标记
    const next = value.slice(0, start) + value.slice(end);
    return { value: next, selectionStart: start, selectionEnd: start };
  }

  // 支持在行内任意位置换行并续列表
  const insert = `\n${parsed.indent}${parsed.marker}`;
  const next = value.slice(0, selectionStart) + insert + value.slice(selectionEnd);
  const cursor = selectionStart + insert.length;
  return { value: next, selectionStart: cursor, selectionEnd: cursor };
}

/** 用标记包裹选中文字(加粗/斜体)。无选区时插入标记并把光标放中间。 */
export function wrapSelection(state: EditorState, wrap: string): EditorResult {
  const { value, selectionStart, selectionEnd } = state;
  const selected = value.slice(selectionStart, selectionEnd);

  // 已被同样标记包裹 → 取消
  const before = value.slice(selectionStart - wrap.length, selectionStart);
  const after = value.slice(selectionEnd, selectionEnd + wrap.length);
  if (selected && before === wrap && after === wrap) {
    const next = value.slice(0, selectionStart - wrap.length) + selected + value.slice(selectionEnd + wrap.length);
    return {
      value: next,
      selectionStart: selectionStart - wrap.length,
      selectionEnd: selectionEnd - wrap.length,
    };
  }

  const next = value.slice(0, selectionStart) + wrap + selected + wrap + value.slice(selectionEnd);
  return {
    value: next,
    // 选区整体右移一个前置标记的长度,保持仍然只覆盖被包裹的文字。
    selectionStart: selectionStart + wrap.length,
    selectionEnd: selectionEnd + wrap.length,
  };
}
