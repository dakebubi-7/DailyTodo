import { useEffect, useMemo, useRef, useState } from 'react';
import { AppLanguage } from '../../shared/appSettings';
import { getShellText } from '../i18n';
import { Task } from '../types/task';
import { insertDailyCommandMarkdown, shouldOpenDailyCommandMenu } from '../utils/dailyCommandEditor';
import { useMarkdownEditor } from '../hooks/useMarkdownEditor';

interface DailyWorkPanelProps {
  title: string;
  description: string;
  placeholder: string;
  value: string;
  tasks?: Task[];
  language: AppLanguage;
  onChange: (value: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function DailyWorkPanel({
  title,
  placeholder,
  value,
  tasks = [],
  language,
  onChange,
  isOpen,
  onClose,
}: DailyWorkPanelProps) {
  const [draft, setDraft] = useState(value);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandIndex, setCommandIndex] = useState(0);
  const [editorHeight, setEditorHeight] = useState(64); // px,初始约 4rem
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const text = getShellText(language).daily;

  // 编辑能力（历史栈、光标恢复 + 滚动修复、Tab/续列表/Ctrl 快捷键）抽到可复用 Hook。
  // 命令菜单（`/`）是本组件专属，通过 command.onClose 让 Hook 在提交/撤销时关闭它。
  const editor = useMarkdownEditor({
    value: draft,
    onChange: setDraft,
    textareaRef,
    command: {
      onClose: () => {
        setCommandOpen(false);
        setCommandIndex(0);
      },
    },
  });

  const MIN_EDITOR_HEIGHT = 56;
  const MAX_EDITOR_HEIGHT = 480;

  const startResize = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const startY = event.clientY;
    const startHeight = textareaRef.current?.offsetHeight ?? editorHeight;

    const onMove = (moveEvent: PointerEvent) => {
      const next = startHeight + (moveEvent.clientY - startY);
      setEditorHeight(Math.min(MAX_EDITOR_HEIGHT, Math.max(MIN_EDITOR_HEIGHT, next)));
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const taskCommands = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [tasks]);

  useEffect(() => {
    if (isOpen) {
      setDraft(value);
      setCommandOpen(false);
      setCommandIndex(0);
      editor.resetHistory(value, value.length);
    }
  }, [isOpen, value]);

  if (!isOpen) return null;

  const handleSave = () => {
    onChange(draft);
    onClose();
  };

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
    const open = shouldOpenDailyCommandMenu(value, cursor);
    setCommandOpen(open);
    if (open) setCommandIndex(0);
  };

  const handleTextareaKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Escape') {
      setCommandOpen(false);
      setCommandIndex(0);
      return;
    }

    if (commandOpen && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault();
      event.stopPropagation(); // 阻止事件冒泡到全局监听器
      const count = taskCommands.length || 1;
      setCommandIndex((prev) =>
        event.key === 'ArrowDown' ? (prev + 1) % count : (prev - 1 + count) % count
      );
      return;
    }

    if (commandOpen && event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault();
      if (taskCommands.length) {
        insertTaskMarkdown(taskCommands[commandIndex]);
      } else {
        insertMarkdown('- [ ] ');
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
