export interface MarkdownEditorHistorySnapshot {
  value: string;
  start: number;
  end: number;
}

interface MarkdownEditorHistory {
  record(value: string, start: number, end: number, typing: boolean): void;
  undo(): MarkdownEditorHistorySnapshot | null;
  redo(): MarkdownEditorHistorySnapshot | null;
  reset(value: string, cursor: number): void;
}

const COALESCE_MS = 500;

export function createMarkdownEditorHistory(
  initialValue: string,
  getCurrentTime: () => number = Date.now,
): MarkdownEditorHistory {
  let stack: MarkdownEditorHistorySnapshot[] = [{
    value: initialValue,
    start: initialValue.length,
    end: initialValue.length,
  }];
  let index = 0;
  let lastRecord = { time: 0, typing: false };

  return {
    record(value, start, end, typing) {
      if (index < stack.length - 1) {
        stack = stack.slice(0, index + 1);
      }
      const top = stack[index];
      if (top && top.value === value) {
        top.start = start;
        top.end = end;
        lastRecord = { time: getCurrentTime(), typing };
        return;
      }

      const now = getCurrentTime();
      const canCoalesce = typing && lastRecord.typing && now - lastRecord.time < COALESCE_MS;
      if (canCoalesce && top) {
        stack[index] = { value, start, end };
      } else {
        stack.push({ value, start, end });
        index = stack.length - 1;
      }
      lastRecord = { time: now, typing };
    },
    undo() {
      if (index <= 0) return null;
      index -= 1;
      lastRecord = { time: 0, typing: false };
      return stack[index];
    },
    redo() {
      if (index >= stack.length - 1) return null;
      index += 1;
      lastRecord = { time: 0, typing: false };
      return stack[index];
    },
    reset(value, cursor) {
      stack = [{ value, start: cursor, end: cursor }];
      index = 0;
      lastRecord = { time: 0, typing: false };
    },
  };
}
