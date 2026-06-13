import { useState, useEffect, type ButtonHTMLAttributes, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { Task } from '../types/task';
import { PriorityPicker } from './PriorityPicker';

export interface TaskDragHandleProps {
  attributes: ButtonHTMLAttributes<HTMLButtonElement>;
  listeners?: ButtonHTMLAttributes<HTMLButtonElement>;
  setActivatorNodeRef: (element: HTMLButtonElement | null) => void;
  disabled: boolean;
}

interface TaskItemProps {
  task: Task;
  dragHandleProps?: TaskDragHandleProps;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: (text: string) => void;
  onPriorityChange: (priority: Task['priority']) => void;
  onViewReview: () => void;
  onToggleSubtask: (id: string) => void;
  onDeleteSubtask: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onViewSubtaskReview: (task: Task) => void;
  allTags?: string[];
  editTrigger?: number;
}

const priorityTitles: Record<Task['priority'], string> = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
};

const sourceLabels: Record<NonNullable<Task['source']>, string> = {
  personal: '个人',
  external: '外部',
};

const sourceTitles: Record<NonNullable<Task['source']>, string> = {
  personal: '个人任务',
  external: '外部任务',
};

export function TaskItem({
  task,
  dragHandleProps,
  onToggle,
  onDelete,
  onEdit,
  onPriorityChange,
  onViewReview,
  onToggleSubtask,
  onDeleteSubtask,
  onToggleCollapse,
  onViewSubtaskReview,
  allTags = [],
  editTrigger,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);

  useEffect(() => {
    if (editTrigger && !task.completed) {
      setEditText(task.text);
      setIsEditing(true);
    }
  }, [editTrigger, task.completed, task.text]);

  const handleSubmit = () => {
    if (editText.trim()) onEdit(editText.trim());
    setIsEditing(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') handleSubmit();
    if (event.key === 'Escape') {
      setEditText(task.text);
      setIsEditing(false);
    }
  };

  const taskSource = task.source || 'personal';
  const hasChildren = Boolean(task.subtasks?.length);
  const hasReview = hasTaskReview(task);
  const canOpenReviewAction = task.completed || hasReview;

  return (
    <span className="task-tree-node">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: 48 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        onContextMenu={(e) => {
          e.preventDefault();
          const viewport = document.querySelector('.app-viewport');
          const shell = document.querySelector('.app-shell');
          const cs = viewport ? getComputedStyle(viewport) : null;
          const num = (v: string, fallback: number) => {
            const n = parseFloat(v);
            return Number.isFinite(n) ? n : fallback;
          };
          const themeId = shell
            ? (Array.from(shell.classList).find((c) => c.startsWith('theme-'))?.slice('theme-'.length) || '')
            : '';
          void window.electronAPI?.openTaskContextMenu({
            task,
            allTags,
            screenX: e.screenX,
            screenY: e.screenY,
            isDark: document.documentElement.classList.contains('dark'),
            theme: {
              themeId,
              accent: cs?.getPropertyValue('--personal-accent').trim() || '#3b82f6',
              secondary: cs?.getPropertyValue('--personal-secondary').trim() || '#8b5cf6',
              menuOpacity: cs ? num(cs.getPropertyValue('--menu-opacity'), 0.96) : 0.96,
              blurStrength: cs ? num(cs.getPropertyValue('--blur-strength'), 18) : 18,
              cardRadius: cs ? num(cs.getPropertyValue('--card-radius'), 12) : 12,
            },
          });
        }}
        className={`task-card group ${hasChildren ? 'task-card-has-children' : 'task-card-no-children'} ${canOpenReviewAction ? 'task-card-has-review-action' : 'task-card-no-review-action'} ${task.completed ? 'task-card-completed' : ''}`}
        data-priority={task.priority}
      >
        <button
          type="button"
          ref={dragHandleProps?.setActivatorNodeRef}
          className="task-drag-handle"
          disabled={dragHandleProps?.disabled ?? true}
          aria-label="拖动调整任务顺序"
          {...(dragHandleProps?.attributes || {})}
          {...(dragHandleProps?.listeners || {})}
          aria-disabled={dragHandleProps?.disabled ?? true}
        >
          <DragDotsIcon />
        </button>

        {hasChildren && (
          <button
            type="button"
            className={`task-tree-toggle ${task.collapsed ? 'task-tree-toggle-collapsed' : ''}`}
            onClick={() => onToggleCollapse(task.id)}
            aria-label={task.collapsed ? '展开子任务' : '收起子任务'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 5l8 7-8 7" />
            </svg>
          </button>
        )}

        <button
          type="button"
          onClick={onToggle}
          className={`task-complete-action ${task.completed ? 'task-complete-action-complete' : ''}`}
          aria-label={task.completed ? '标记为未完成' : '标记为完成'}
          title={task.completed ? '标记为未完成' : '标记为完成'}
        >
          {task.completed && (
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <PriorityPicker value={task.priority} onChange={onPriorityChange} />

        {isEditing ? (
          <input
            type="text"
            value={editText}
            onChange={(event) => setEditText(event.target.value)}
            onBlur={handleSubmit}
            onKeyDown={handleKeyDown}
            autoFocus
            className="task-edit-input"
            aria-label="编辑任务"
          />
        ) : (
          <span className="task-text-wrap">
            <span className="task-text-row">
              <span
                onDoubleClick={() => !task.completed && setIsEditing(true)}
                className="task-text"
                title={`${task.text} · ${priorityTitles[task.priority]} · ${sourceTitles[taskSource]}`}
              >
                {task.text}
              </span>
              <span className="task-source-badge" data-source={taskSource} title={sourceTitles[taskSource]}>
                {sourceLabels[taskSource]}
              </span>
            </span>

            {task.scheduledDates && task.scheduledDates.length > 0 && (
              <span className="scheduled-dates">
                📅 {task.scheduledDates.slice(0, 3).join(' · ')}
                {task.scheduledDates.length > 3 && ` +${task.scheduledDates.length - 3}`}
              </span>
            )}
            {task.tags && task.tags.length > 0 && (
              <span className="task-tags">
                {task.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="tag-pill-small">{tag}</span>
                ))}
                {task.tags.length > 2 && <span className="tag-more">+{task.tags.length - 2}</span>}
              </span>
            )}
          </span>
        )}

        <span className="task-action-layer" aria-hidden={false}>
          {canOpenReviewAction && (
            <ReviewActionButton
              hasReview={hasReview}
              label={hasReview ? '查看完成情况' : '补写完成情况'}
              onClick={onViewReview}
            />
          )}

          <span className="task-delete-zone">
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={onDelete}
              className="task-icon-action task-delete-action"
              aria-label="删除任务"
              title="删除任务"
            >
              <TrashIcon />
            </motion.button>
          </span>
        </span>
      </motion.div>
      {task.subtasks && task.subtasks.length > 0 && !task.collapsed && (
        <span className="task-subtasks task-subtasks-nested" aria-label="子任务">
          {renderSubtaskTree(task.subtasks, {
            depth: 1,
            onToggleSubtask,
            onDeleteSubtask,
            onToggleCollapse,
            onViewSubtaskReview,
          })}
        </span>
      )}
    </span>
  );
}

function renderSubtaskTree(
  subtasks: Task[],
  handlers: {
    depth: number;
    onToggleSubtask: (id: string) => void;
    onDeleteSubtask: (id: string) => void;
    onToggleCollapse: (id: string) => void;
    onViewSubtaskReview: (task: Task) => void;
  },
) {
  const { depth, onToggleSubtask, onDeleteSubtask, onToggleCollapse, onViewSubtaskReview } = handlers;
  return subtasks.map((subtask) => {
    const hasChildren = Boolean(subtask.subtasks?.length);
    return (
      <span key={subtask.id} className="task-subtask-branch" style={{ ['--subtask-depth' as const]: depth } as CSSProperties}>
        <span className={`task-subtask-row ${subtask.completed ? 'task-subtask-row-completed' : ''}`}>
          {hasChildren ? (
            <button
              type="button"
              className={`task-tree-toggle task-tree-toggle-subtask ${subtask.collapsed ? 'task-tree-toggle-collapsed' : ''}`}
              onClick={() => onToggleCollapse(subtask.id)}
              aria-label={subtask.collapsed ? '展开子任务' : '收起子任务'}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 5l8 7-8 7" />
              </svg>
            </button>
          ) : (
            <span className="task-tree-spacer task-tree-spacer-subtask" aria-hidden="true" />
          )}
          <button
            type="button"
            className={`task-subtask-check ${subtask.completed ? 'task-subtask-check-complete' : ''}`}
            onClick={() => onToggleSubtask(subtask.id)}
            aria-label={subtask.completed ? '标记子任务为未完成' : '标记子任务为完成'}
          >
            {subtask.completed && (
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <span className="task-subtask-text">{subtask.text}</span>
          {hasTaskReview(subtask) && (
            <button
              type="button"
              className="task-subtask-review task-subtask-review-active"
              onClick={() => onViewSubtaskReview(subtask)}
              aria-label="查看子任务完成情况"
              title="查看子任务完成情况"
            >
              <ReviewIcon hasReview />
            </button>
          )}
          <button
            type="button"
            className="task-subtask-delete"
            onClick={() => onDeleteSubtask(subtask.id)}
            aria-label="删除子任务"
          >
            <TrashIcon />
          </button>
        </span>
        {hasChildren && !subtask.collapsed && renderSubtaskTree(subtask.subtasks || [], {
          depth: depth + 1,
          onToggleSubtask,
          onDeleteSubtask,
          onToggleCollapse,
          onViewSubtaskReview,
        })}
      </span>
    );
  });
}

function hasTaskReview(task: Task) {
  return Boolean(task.completionReviews?.length || task.completionReview);
}

function ReviewActionButton({
  hasReview,
  label,
  onClick,
}: {
  hasReview: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={`task-icon-action task-review-action task-review-action-visible ${!hasReview ? 'task-review-action-empty' : ''}`}
      aria-label={label}
      title={label}
    >
      <ReviewIcon hasReview={hasReview} />
    </motion.button>
  );
}

function ReviewIcon({ hasReview }: { hasReview: boolean }) {
  return hasReview ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 15h6M9 11h3" />
    </svg>
  );
}

function DragDotsIcon() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true">
      <circle cx="3" cy="3" r="1.15" />
      <circle cx="9" cy="3" r="1.15" />
      <circle cx="3" cy="7" r="1.15" />
      <circle cx="9" cy="7" r="1.15" />
      <circle cx="3" cy="11" r="1.15" />
      <circle cx="9" cy="11" r="1.15" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14" />
    </svg>
  );
}
