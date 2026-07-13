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

export { indentSelection, outdentSelection } from './markdownEditorIndentation';

function lineBounds(value: string, position: number) {
  const start = value.lastIndexOf('\n', position - 1) + 1;
  const endIndex = value.indexOf('\n', position);
  const end = endIndex === -1 ? value.length : endIndex;
  return { start, end };
}

interface ListMarker {
  indent: string;
  marker: string;
  isEmpty: boolean;
}

function parseListLine(line: string): ListMarker | null {
  const indentMatch = line.match(/^(\s*)/);
  const indent = indentMatch ? indentMatch[1] : '';
  const rest = line.slice(indent.length);

  const task = rest.match(/^([-*+])\s\[([ xX])\]\s(.*)$/);
  if (task) {
    return {
      indent,
      marker: `${task[1]} [ ] `,
      isEmpty: task[3].trim() === '',
    };
  }

  const ordered = rest.match(/^(\d+(?:\.\d+)*)([.)]?)\s(.*)$/);
  if (ordered) {
    const number = ordered[1];
    const separator = ordered[2];
    if (separator || number.includes('.')) {
      const parts = number.split('.');
      const lastIndex = parts.length - 1;
      parts[lastIndex] = String(Number(parts[lastIndex]) + 1);
      return {
        indent,
        marker: `${parts.join('.')}${separator} `,
        isEmpty: ordered[3].trim() === '',
      };
    }
  }

  const unordered = rest.match(/^([-*+])\s(.*)$/);
  if (unordered) {
    return {
      indent,
      marker: `${unordered[1]} `,
      isEmpty: unordered[2].trim() === '',
    };
  }

  return null;
}

export function continueListOnEnter(state: EditorState): EditorResult | null {
  const { value, selectionStart, selectionEnd } = state;
  if (selectionStart !== selectionEnd) return null;

  const { start, end } = lineBounds(value, selectionStart);
  const parsed = parseListLine(value.slice(start, end));
  if (!parsed) return null;

  if (parsed.isEmpty && selectionStart === end) {
    const next = value.slice(0, start) + value.slice(end);
    return { value: next, selectionStart: start, selectionEnd: start };
  }

  const insert = `\n${parsed.indent}${parsed.marker}`;
  const next = value.slice(0, selectionStart) + insert + value.slice(selectionEnd);
  const cursor = selectionStart + insert.length;
  return { value: next, selectionStart: cursor, selectionEnd: cursor };
}

export function wrapSelection(state: EditorState, wrap: string): EditorResult {
  const { value, selectionStart, selectionEnd } = state;
  const selected = value.slice(selectionStart, selectionEnd);
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
    selectionStart: selectionStart + wrap.length,
    selectionEnd: selectionEnd + wrap.length,
  };
}
