import { useState } from 'react';
import { Task } from '../../types/task';
import { TaskMenuPopupPaneHeader } from './TaskMenuPopupPaneHeader';

export type TaskMenuPopupPane = 'menu' | 'date' | 'tag' | 'subtask' | 'source';

export type TaskMenuPopupActionUpdate = {
  __action: 'edit' | 'delete' | 'addSubtask' | 'selectTodayFocus';
  text?: string;
};

export type DispatchTaskMenuUpdate = (taskId: string, updates: Partial<Task> | TaskMenuPopupActionUpdate) => void;
export type CloseTaskMenu = () => void;

function Icon({ path }: { path: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

function CalendarIcon() { return <Icon path="M7 3v3M17 3v3M4 9h16M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 19 20.5H5A1.5 1.5 0 0 1 3.5 19V7A1.5 1.5 0 0 1 5 5.5" />; }
function TagIcon() { return <Icon path="M20.5 13.5l-7 7a2 2 0 0 1-2.8 0L3 13V3h10l7.5 7.5a2 2 0 0 1 0 2.8z" />; }
function SubtaskIcon() { return <Icon path="M6 6h12M6 12h8M6 18h5M4 6h.01M4 12h.01M4 18h.01" />; }
function SourceIcon() { return <Icon path="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3.6 9h16.8M3.6 15h16.8M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />; }
function EditIcon() { return <Icon path="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />; }
function TrashIcon() { return <Icon path="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m1 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />; }
function ChevronRight() { return <svg className="tm-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>; }

export function MenuPane({
  task,
  canSelectTodayFocus = false,
  onPick,
}: {
  task: Task;
  canSelectTodayFocus?: boolean;
  onPick: (pane: TaskMenuPopupPane | 'edit' | 'delete' | 'selectTodayFocus') => void;
}) {
  const activeDateCount = task.scheduledDates?.length || 0;
  const tagCount = task.tags?.length || 0;
  const subtaskCount = task.subtasks?.length || 0;
  return (
    <>
      <div className="tm-header tm-task-header">
        <span className="tm-header-text" title={task.text}>{task.text}</span>
      </div>
      <div className="tm-list">
        <button type="button" className="tm-item tm-item-strong" onClick={() => onPick('date')}>
          <span className="tm-item-icon"><CalendarIcon /></span>
          <span className="tm-item-label">设置日期</span>
          <span className="tm-item-hint">{activeDateCount ? `${activeDateCount} 个` : '设置/清除'}</span>
          <ChevronRight />
        </button>
        <button type="button" className="tm-item" onClick={() => onPick('subtask')}>
          <span className="tm-item-icon"><SubtaskIcon /></span>
          <span className="tm-item-label">添加子任务</span>
          <span className="tm-item-hint">{subtaskCount ? `${subtaskCount} 个` : '新建'}</span>
          <ChevronRight />
        </button>
        <button type="button" className="tm-item" onClick={() => onPick('tag')}>
          <span className="tm-item-icon"><TagIcon /></span>
          <span className="tm-item-label">编辑标签</span>
          <span className="tm-item-hint">{tagCount ? `${tagCount} 个` : '编辑'}</span>
          <ChevronRight />
        </button>
        <button type="button" className="tm-item" onClick={() => onPick('source')}>
          <span className="tm-item-icon"><SourceIcon /></span>
          <span className="tm-item-label">任务类型</span>
          <ChevronRight />
        </button>
        <div className="tm-divider" />
        {canSelectTodayFocus && (
          <button
            type="button"
            className="tm-item"
            aria-label="Today Focus"
            onClick={() => onPick('selectTodayFocus')}
          >
            <span className="tm-item-label">Today Focus</span>
          </button>
        )}
        <button type="button" className="tm-item" onClick={() => onPick('edit')}>
          <span className="tm-item-icon"><EditIcon /></span>
          <span className="tm-item-label">编辑任务</span>
        </button>
        <button type="button" className="tm-item tm-item-danger" onClick={() => onPick('delete')}>
          <span className="tm-item-icon"><TrashIcon /></span>
          <span className="tm-item-label">删除任务</span>
        </button>
      </div>
    </>
  );
}

export function SubtaskPane({ task, onBack, onDispatch }: { task: Task; onBack: () => void; onDispatch: DispatchTaskMenuUpdate }) {
  const [text, setText] = useState('');
  const save = () => {
    const value = text.trim();
    if (!value) return;
    onDispatch(task.id, { __action: 'addSubtask', text: value });
  };
  return (
    <>
      <TaskMenuPopupPaneHeader title="添加子任务" onBack={onBack} />
      <div className="tm-subtask-form">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') save();
          }}
          className="tm-input tm-textarea"
          placeholder="写下下一步，可用 Ctrl+Enter 保存"
          autoFocus
        />
        <button type="button" className="tm-btn-primary" onClick={save} disabled={!text.trim()}>添加子任务</button>
      </div>
    </>
  );
}
