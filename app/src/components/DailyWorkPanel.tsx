import { useEffect, useRef, useState } from 'react';
import { AppLanguage } from '../../shared/appSettings';
import {
  createDefaultInputKeybindingSettings,
  type InputKeybindingSettings,
} from '../../shared/inputKeybindings';
import { getShellText } from '../i18n';
import { Task } from '../types/task';
import { insertDailyCommandMarkdown } from '../utils/dailyCommandEditor';
import { useMarkdownEditor } from '../hooks/useMarkdownEditor';
import { useDailyWorkPanelCommands } from './dailyWorkPanel/useDailyWorkPanelCommands';
import { useDailyWorkPanelResize } from './dailyWorkPanel/useDailyWorkPanelResize';

interface DailyWorkPanelProps {
  title: string;
  description: string;
  placeholder: string;
  value: string;
  taskCommands: Task[];
  language: AppLanguage;
  onChange: (value: string) => void;
  isOpen: boolean;
  onClose: () => void;
  inputKeybindings?: InputKeybindingSettings;
}

export function DailyWorkPanel({
  title,
  placeholder,
  value,
  taskCommands,
  language,
  onChange,
  isOpen,
  onClose,
  inputKeybindings = createDefaultInputKeybindingSettings(),
}: DailyWorkPanelProps) {
  const [draft, setDraft] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { commandOpen, commandIndex, closeCommandMenu, handleCommandTextChange, handleCommandKeyDown, setCommandIndex } = useDailyWorkPanelCommands(taskCommands.length);
  const { editorHeight, startResize } = useDailyWorkPanelResize(textareaRef);
  const text = getShellText(language).daily;

  const handleSave = () => {
    onChange(draft);
    onClose();
  };

  // 编辑能力（历史栈、光标恢复 + 滚动修复、Tab/续列表/Ctrl 快捷键）抽到可复用 Hook。
  // 命令菜单（`/`）是本组件专属，通过 command.onClose 让 Hook 在提交/撤销时关闭它。
  const editor = useMarkdownEditor({
    value: draft,
    onChange: setDraft,
    textareaRef,
    command: {
      onClose: closeCommandMenu,
    },
    inputKeybindings,
    scope: 'daily-markdown',
    onSubmit: handleSave,
  });
  useEffect(() => {
    if (isOpen) {
      setDraft(value);
      closeCommandMenu();
      editor.resetHistory(value, value.length);
    }
  }, [isOpen, value]);

  if (!isOpen) return null;

  const insertMarkdown = (markdown: string) => {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? draft.length;
    const end = textarea?.selectionEnd ?? draft.length;
    const next = insertDailyCommandMarkdown(draft, markdown, start, end);
    editor.commit(next.value, next.cursor); // commit 会通过 command.onClose 关闭命令菜单
  };

  const insertTaskMarkdown = (task: Task) => {
    insertMarkdown(`- [${task.completed ? 'x' : ' '}] ${task.text}`);
  };

  const handleTextareaChange = (value: string, cursor: number) => {
    editor.handleChange(value, cursor);
    handleCommandTextChange(value, cursor);
  };

  const handleTextareaKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const commandResult = handleCommandKeyDown(event);
    if (commandResult.handled) {
      if (commandResult.commandIndex !== undefined) {
        if (taskCommands.length) {
          insertTaskMarkdown(taskCommands[commandResult.commandIndex]);
        } else {
          insertMarkdown('- [ ] ');
        }
      }
      return;
    }

    // 命令菜单未接管的按键交给编辑 Hook（Tab / 回车续列表 / Ctrl+B/I/Z/Y）。
    editor.onKeyDown(event);
  };

  return (
    <div className="daily-inline-panel" role="region" aria-label={title}>
      <div className="daily-dialog-editor">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(event) => handleTextareaChange(event.currentTarget.value, event.currentTarget.selectionStart)}
          onCompositionEnd={(event) => handleTextareaChange(event.currentTarget.value, event.currentTarget.selectionStart)}
          onKeyDown={handleTextareaKeyDown}
          className={`daily-dialog-textarea daily-inline-textarea ${commandOpen ? 'daily-dialog-textarea-command-open' : ''}`}
          placeholder={placeholder}
          aria-label={title}
          style={{ height: editorHeight }}
          autoFocus
        />
        <div className="daily-inline-bottom-row">
          <div
            className="daily-inline-resizer"
            onPointerDown={startResize}
            role="separator"
            aria-orientation="horizontal"
            aria-label={language === 'zh-CN' ? '拖动调整高度' : 'Drag to resize'}
            title={language === 'zh-CN' ? '拖动调整高度' : 'Drag to resize'}
          >
            <span className="daily-inline-resizer-grip" aria-hidden="true" />
          </div>

          <div className="daily-dialog-actions">
            <button type="button" className="daily-dialog-cancel" onClick={onClose}>
              {text.cancel}
            </button>
            <button type="button" className="daily-dialog-save" onClick={handleSave}>
              {text.save}
            </button>
          </div>
        </div>
        {commandOpen && (
          <div className="daily-command-menu" role="menu">
            {taskCommands.length ? taskCommands.map((task, idx) => (
              <button
                key={task.id}
                type="button"
                role="menuitem"
                aria-selected={idx === commandIndex}
                className={idx === commandIndex ? 'daily-command-active' : undefined}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setCommandIndex(idx)}
                onClick={() => insertTaskMarkdown(task)}
                title={task.text}
              >
                <span className={`daily-command-priority daily-command-priority-${task.priority}`} aria-hidden="true" />
                <span className="daily-command-label">{task.text}</span>
                {task.completed && <span className="daily-command-status">{language === 'zh-CN' ? '完成' : 'done'}</span>}
              </button>
            )) : (
              <button
                type="button"
                role="menuitem"
                aria-selected={true}
                className="daily-command-active"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => insertMarkdown('- [ ] ')}
              >
                <span className="daily-command-label">
                  {language === 'zh-CN' ? '今天还没有任务，插入一个空任务' : 'No tasks today, insert an empty task'}
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
