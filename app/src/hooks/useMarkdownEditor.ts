import { RefObject, useEffect, useRef } from 'react';
import {
  resolveInputKeybinding,
  type InputKeybindingScope,
  type InputKeybindingSettings,
} from '../../shared/inputKeybindings';
import {
  EditorResult,
} from '../utils/markdownEditor';
import { applyMarkdownEditorKeyAction } from './markdownEditorKeyActions';
import { createMarkdownEditorHistory } from './markdownEditorHistory';
import { restoreTextareaSelection } from './markdownEditorTextarea';

/**
 * 多行 Markdown 编辑框的可复用能力（从 DailyWorkPanel 抽出）：
 * - 自维护撤销/重做历史栈（受控 textarea + 程序化 setValue 会清空浏览器原生 undo 栈，故自管）
 * - 程序化光标恢复，并把光标行滚进可视区（修「回车要敲两下才上移」的 bug）
 * - 键盘分发：按已配置的输入框快捷键处理 Markdown 编辑命令
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
  inputKeybindings: InputKeybindingSettings;
  scope: InputKeybindingScope;
  /** Ctrl/Cmd+Enter 等已配置提交快捷键的回调（如表单保存）。 */
  onSubmit?: () => void;
}

export interface MarkdownEditorApi {
  /** 绑定到 textarea 的 onKeyDown（只处理当前 scope 已解析的编辑快捷键）。 */
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

export function useMarkdownEditor({
  value,
  onChange,
  textareaRef,
  command,
  inputKeybindings,
  scope,
  onSubmit,
}: UseMarkdownEditorOptions): MarkdownEditorApi {
  const historyRef = useRef(createMarkdownEditorHistory(value));
  const pendingSelectionRef = useRef<{ start: number; end: number } | null>(null);

  const resetHistory = (nextValue: string, cursor: number) => {
    historyRef.current.reset(nextValue, cursor);
  };

  // 用 useEffect 设置光标，避免受控组件重渲染覆盖；设完光标再把光标行滚进可视区。
  useEffect(() => {
    if (!pendingSelectionRef.current) return;
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { start, end } = pendingSelectionRef.current;
    pendingSelectionRef.current = null;
    restoreTextareaSelection(textarea, { start, end });
  });

  const restoreSnapshot = (snapshot: { value: string; start: number; end: number }) => {
    pendingSelectionRef.current = { start: snapshot.start, end: snapshot.end };
    command?.onClose();
    onChange(snapshot.value);
  };

  const undo = () => {
    const snapshot = historyRef.current.undo();
    if (snapshot) restoreSnapshot(snapshot);
  };

  const redo = () => {
    const snapshot = historyRef.current.redo();
    if (snapshot) restoreSnapshot(snapshot);
  };

  const handleChange = (nextValue: string, cursor: number) => {
    historyRef.current.record(nextValue, cursor, cursor, true);
    onChange(nextValue);
  };

  const commit = (nextValue: string, selectionStart: number, selectionEnd = selectionStart) => {
    historyRef.current.record(nextValue, selectionStart, selectionEnd, false);
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

    const action = resolveInputKeybinding(
      {
        key: event.key,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        isComposing: event.nativeEvent.isComposing,
      },
      scope,
      inputKeybindings,
    );

    if (!action) return;

    if (action === 'submit') {
      if (!onSubmit) return;
      event.preventDefault();
      onSubmit();
      return;
    }

    if (action === 'undo') {
      event.preventDefault();
      undo();
      return;
    }

    if (action === 'redo') {
      event.preventDefault();
      redo();
      return;
    }

    const result = applyMarkdownEditorKeyAction(action, state);
    if (!result) return;
    // continue-list may return null-equivalent when the line is not a list; only preventDefault when applied.
    event.preventDefault();
    applyResult(result);
  };

  return { onKeyDown, handleChange, commit, undo, redo, resetHistory };
}
