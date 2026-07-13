import type { EditorResult, EditorState } from './markdownEditor';

const INDENT = '    ';

function selectedLineStarts(value: string, selectionStart: number, selectionEnd: number): number[] {
  const first = value.lastIndexOf('\n', selectionStart - 1) + 1;
  const starts: number[] = [];
  let index = first;

  while (index <= selectionEnd) {
    starts.push(index);
    const next = value.indexOf('\n', index);
    if (next === -1 || next >= selectionEnd) break;
    index = next + 1;
  }

  return starts.length ? starts : [first];
}

export function indentSelection(state: EditorState): EditorResult {
  const { value, selectionStart, selectionEnd } = state;
  const starts = selectedLineStarts(value, selectionStart, selectionEnd);
  const parts: string[] = [];
  let cursor = 0;

  for (const start of starts) {
    parts.push(value.slice(cursor, start), INDENT);
    cursor = start;
  }
  parts.push(value.slice(cursor));

  return {
    value: parts.join(''),
    selectionStart: selectionStart + INDENT.length,
    selectionEnd: selectionEnd + INDENT.length * starts.length,
  };
}

export function outdentSelection(state: EditorState): EditorResult {
  const { value, selectionStart, selectionEnd } = state;
  const starts = selectedLineStarts(value, selectionStart, selectionEnd);
  const parts: string[] = [];
  let cursor = 0;
  let removedBeforeStart = 0;
  let removedTotal = 0;

  for (const start of starts) {
    const slice = value.slice(start, start + INDENT.length);
    let removeLength = 0;
    if (slice === INDENT) removeLength = INDENT.length;
    else if (slice[0] === '\t') removeLength = 1;
    else {
      const spaces = slice.match(/^ +/);
      removeLength = spaces ? Math.min(spaces[0].length, INDENT.length) : 0;
    }

    parts.push(value.slice(cursor, start));
    if (removeLength > 0) {
      removedTotal += removeLength;
      if (start < selectionStart) removedBeforeStart += removeLength;
    }
    cursor = start + removeLength;
  }
  parts.push(value.slice(cursor));

  return {
    value: parts.join(''),
    selectionStart: Math.max(0, selectionStart - removedBeforeStart),
    selectionEnd: Math.max(0, selectionEnd - removedTotal),
  };
}
