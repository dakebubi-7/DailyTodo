import { RefObject, useEffect, useRef } from 'react';
import {
  EditorResult,
  continueListOnEnter,
  indentSelection,
  outdentSelection,
  wrapSelection,
} from '../utils/markdownEditor';

/**
 * 多行 Markdown 编辑框的可复用能力（从 DailyWorkPanel 抽出）：
 * - 自维护撤销/重做历史栈（受控 textarea + 程序化 setValue 会清空浏览器原生 undo 栈，故自管）
 * - 程序化光标恢复，并把光标行滚进可视区（修「回车要敲两下才上移」的 bug）
 * - 键盘分发：Tab/Shift+Tab 缩进、回车续 `1.`/`1.1` 多级编号、Ctrl+B/I、Ctrl+Z、Ctrl+Shift+Z / Ctrl+Y
 *
 * 命令菜单（`/` 唤起任务列表）是 DailyWorkPanel 专属，作为可选参数；其它框不传即关闭。
 */

interface MarkdownEditorCommand {
  /** 提交/撤销时关闭命令菜单（如 setCommandOpen(false) + setCommandIndex(0)）。 */
  onClose: () => void;
}

interface UseMarkdownEditorOptions {
  value: string;
  /** 值变更回调（受控）。光标恢复由 Hook 负责。 */
  onChange: (value: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement>;
  command?: MarkdownEditorCommand;
}

export interface MarkdownEditorApi {
  /** 绑定到 textarea 的 onKeyDown（处理 Tab / 回车续列表 / Ctrl 快捷键）。 */
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  /** 绑定到 textarea 的 onChange / onCompositionEnd（记录打字历史 + 透传值）。 */
  handleChange: (value: string, cursor: number) => void;
  /** 程序化提交一次结构化修改（如插入命令文本），独立成一步历史并恢复光标。 */
  commit: (value: string, selectionStart: number, selectionEnd?: number) => void;
  undo: () => void;
  redo: () => void;
  /** 重置历史栈（如对话框打开 / 切换任务时）。 */
  resetHistory: (value: string, cursor: number) => void;
}

const COALESCE_MS = 500;

// 复制到镜像 div 上以精确测量光标像素位置的样式属性。
// 不复制 border —— textarea 的 clientWidth/scrollTop 都不含 border，
// 镜像也不加 border，offsetTop 才能和 scrollTop 落在同一坐标系。
const MIRROR_STYLE_PROPS = [
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'lineHeight',
  'letterSpacing',
  'textTransform',
  'wordSpacing',
  'tabSize',
] as const;

/**
 * 精确测量光标所在行相对 textarea 内容顶部的像素位置。
 * 用一个隐藏的镜像 div 复刻 textarea 的字体/宽度/换行规则，把光标前文本放进去，
 * 末尾插一个标记 span，读它的 offsetTop。比「行号 × 估算行高」准确（能处理软换行）。
 */
function measureCaret(textarea: HTMLTextAreaElement, caret: number): { top: number; lineHeight: number } {
  const style = window.getComputedStyle(textarea);
  const mirror = document.createElement('div');
  MIRROR_STYLE_PROPS.forEach((prop) => {
    mirror.style[prop as any] = style[prop as any];
  });
  mirror.style.position = 'absolute';
  mirror.style.visibility = 'hidden';
  mirror.style.whiteSpace = 'pre-wrap';
  mirror.style.overflowWrap = 'break-word';
  mirror.style.wordBreak = style.wordBreak;
  // 与 textarea 文本区同宽（content + padding，配合 box-sizing 一致换行）。
  mirror.style.width = `${textarea.clientWidth}px`;
  mirror.style.boxSizing = 'border-box';
  mirror.style.top = '0';
  mirror.style.left = '-9999px';

  mirror.textContent = textarea.value.slice(0, caret);
  const marker = document.createElement('span');
  marker.textContent = textarea.value.slice(caret) || '.';
  mirror.appendChild(marker);

  document.body.appendChild(mirror);
  const top = marker.offsetTop;
  let lineHeight = parseFloat(style.lineHeight);
  if (!Number.isFinite(lineHeight)) {
    const fontSize = parseFloat(style.fontSize);
    lineHeight = Number.isFinite(fontSize) ? fontSize * 1.4 : 18;
  }
  document.body.removeChild(mirror);

  return { top, lineHeight };
}

/** 把光标所在行滚进 textarea 可视区。 */
function scrollCaretIntoView(textarea: HTMLTextAreaElement, caret: number) {
  const { top, lineHeight } = measureCaret(textarea, caret);

  if (top < textarea.scrollTop) {
    // 光标在可视区上方 → 向上带回。
    textarea.scrollTop = top;
  } else if (top + lineHeight > textarea.scrollTop + textarea.clientHeight) {
    // 光标在可视区下方 → 向下带回（续列表后新行立即可见，无需多敲回车）。
    textarea.scrollTop = top + lineHeight - textarea.clientHeight;
  }
}

export function useMarkdownEditor({ value, onChange, textareaRef, command }: UseMarkdownEditorOptions): MarkdownEditorApi {
  type HistorySnapshot = { value: string; start: number; end: number };
  const historyRef = useRef<{ stack: HistorySnapshot[]; index: number }>({
    stack: [{ value, start: value.length, end: value.length }],
    index: 0,
  });
  const lastRecordRef = useRef<{ time: number; typing: boolean }>({ time: 0, typing: false });
  const pendingSelectionRef = useRef<{ start: number; end: number } | null>(null);

  const resetHistory = (nextValue: string, cursor: number) => {
    historyRef.current = { stack: [{ value: nextValue, start: cursor, end: cursor }], index: 0 };
    lastRecordRef.current = { time: 0, typing: false };
  };

  // 记录一次快照。连续打字在 COALESCE_MS 内合并为一步，结构化编辑各自独立成步。
  const recordHistory = (nextValue: string, start: number, end: number, typing: boolean) => {
    const history = historyRef.current;
    if (history.index < history.stack.length - 1) {
      history.stack = history.stack.slice(0, history.index + 1);
    }
    const top = history.stack[history.index];
    if (top && top.value === nextValue) {
      top.start = start;
      top.end = end;
      lastRecordRef.current = { time: Date.now(), typing };
      return;
    }
    const now = Date.now();
    const canCoalesce = typing && lastRecordRef.current.typing && now - lastRecordRef.current.time < COALESCE_MS;
    if (canCoalesce && top) {
      history.stack[history.index] = { value: nextValue, start, end };
    } else {
      history.stack.push({ value: nextValue, start, end });
      history.index = history.stack.length - 1;
    }
    lastRecordRef.current = { time: now, typing };
  };

  // 用 useEffect 设置光标，避免受控组件重渲染覆盖；设完光标再把光标行滚进可视区。
  useEffect(() => {
    if (!pendingSelectionRef.current) return;
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { start, end } = pendingSelectionRef.current;
    pendingSelectionRef.current = null;
    textarea.focus();
    textarea.setSelectionRange(start, end);
    scrollCaretIntoView(textarea, start);
  });

  const restoreSnapshot = (snapshot: HistorySnapshot) => {
    pendingSelectionRef.current = { start: snapshot.start, end: snapshot.end };
    command?.onClose();
    onChange(snapshot.value);
  };

  const undo = () => {
    const history = historyRef.current;
    if (history.index <= 0) return;
    history.index -= 1;
    lastRecordRef.current = { time: 0, typing: false };
    restoreSnapshot(history.stack[history.index]);
  };

  const redo = () => {
    const history = historyRef.current;
    if (history.index >= history.stack.length - 1) return;
    history.index += 1;
    lastRecordRef.current = { time: 0, typing: false };
    restoreSnapshot(history.stack[history.index]);
  };

  const handleChange = (nextValue: string, cursor: number) => {
    recordHistory(nextValue, cursor, cursor, true);
    onChange(nextValue);
  };

  const commit = (nextValue: string, selectionStart: number, selectionEnd = selectionStart) => {
    recordHistory(nextValue, selectionStart, selectionEnd, false);
    pendingSelectionRef.current = { start: selectionStart, end: selectionEnd };
    command?.onClose();
    onChange(nextValue);
  };

  const applyResult = (result: EditorResult) => {
    commit(result.value, result.selectionStart, result.selectionEnd);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget;
    const state = {
      value: textarea.value,
      selectionStart: textarea.selectionStart,
      selectionEnd: textarea.selectionEnd,
    };

    if (event.key === 'Tab') {
      event.preventDefault();
      applyResult(event.shiftKey ? outdentSelection(state) : indentSelection(state));
      return;
    }

    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      const result = continueListOnEnter(state);
      if (result) {
        event.preventDefault();
        applyResult(result);
      }
      return;
    }

    if ((event.ctrlKey || event.metaKey) && !event.altKey) {
      const key = event.key.toLowerCase();
      if (key === 'b') {
        event.preventDefault();
        applyResult(wrapSelection(state, '**'));
        return;
      }
      if (key === 'i') {
        event.preventDefault();
        applyResult(wrapSelection(state, '*'));
        return;
      }
      if (key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
        return;
      }
      if ((key === 'z' && event.shiftKey) || key === 'y') {
        event.preventDefault();
        redo();
        return;
      }
    }
  };

  return { onKeyDown, handleChange, commit, undo, redo, resetHistory };
}
