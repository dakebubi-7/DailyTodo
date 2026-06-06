import { useState } from 'react';
import { motion } from 'framer-motion';
import { Task } from '../types/task';
import { PriorityPicker } from './PriorityPicker';

interface TaskItemProps {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: (text: string) => void;
  onPriorityChange: (priority: Task['priority']) => void;
  onViewReview: () => void;
}

const priorityLabels: Record<Task['priority'], string> = {
  high: '高',
  medium: '中',
  low: '低',
};

const priorityTitles: Record<Task['priority'], string> = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
};

export function TaskItem({ task, onToggle, onDelete, onEdit, onPriorityChange, onViewReview }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  const [isHovered, setIsHovered] = useState(false);

  const handleSubmit = () => {
    if (editText.trim()) {
      onEdit(editText.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSubmit();
    } else if (event.key === 'Escape') {
      setEditText(task.text);
      setIsEditing(false);
    }
  };

  const hasReview = Boolean(task.completionReviews?.length || task.completionReview);
  const canOpenReviewAction = task.completed || hasReview;
  const reviewActionLabel = hasReview ? '查看完成情况' : '补写完成情况';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 48 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`task-card group ${task.completed ? 'task-card-completed' : ''}`}
      data-priority={task.priority}
    >
      <span className="task-priority-rail" aria-hidden="true" />

      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={onToggle}
        className={`task-check ${task.completed ? 'task-check-complete' : ''}`}
        aria-label={task.completed ? '标记为未完成' : '标记为完成'}
        title={task.completed ? '标记为未完成' : '标记为完成'}
      >
        {task.completed && (
          <motion.svg
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            className="h-3 w-3"
            viewBox="0 0 12 12"
            fill="none"
          >
            <motion.path
              d="M2 6L5 9L10 3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        )}
      </motion.button>

      <PriorityPicker value={task.priority} onChange={onPriorityChange} />

      <span className="task-priority-label" title={priorityTitles[task.priority]}>
        {priorityLabels[task.priority]}
      </span>

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
        <span
          onDoubleClick={() => !task.completed && setIsEditing(true)}
          className="task-text"
          title={`${task.text} · ${priorityTitles[task.priority]}`}
        >
          {task.text}
        </span>
      )}

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: canOpenReviewAction ? 1 : isHovered ? 0.28 : 0 }}
        whileHover={canOpenReviewAction ? { scale: 1.06 } : undefined}
        whileTap={canOpenReviewAction ? { scale: 0.94 } : undefined}
        onClick={() => canOpenReviewAction && onViewReview()}
        disabled={!canOpenReviewAction}
        className={`task-icon-action task-review-action ${canOpenReviewAction ? 'task-review-action-visible' : ''} ${!hasReview && task.completed ? 'task-review-action-empty' : ''}`}
        aria-label={canOpenReviewAction ? reviewActionLabel : '暂无完成情况'}
        title={canOpenReviewAction ? reviewActionLabel : '暂无完成情况'}
      >
        {hasReview ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <path d="M14 2v6h6M9 15h6M9 11h3" />
          </svg>
        )}
      </motion.button>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={onDelete}
        className="task-icon-action task-delete-action"
        aria-label="删除任务"
        title="删除任务"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" />
        </svg>
      </motion.button>
    </motion.div>
  );
}
