import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from 'react';
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
  onEditSubtask: (id: string, text: string) => void;
  onChangeSubtaskPriority: (id: string, priority: Task['priority']) => void;
  allTags?: string[];
  editTrigger?: number;
}

const priorityTitles: Record<Task['priority'], string> = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
};

const TASK_STACK_SEGMENT_CLASSES = ['task-stack-segment-1', 'task-stack-segment-2', 'task-stack-segment-3'] as const;

export const TASK_CLUSTER_SPRING = {
  stiffness: 180,
  damping: 25,
  mass: 1,
};

const TASK_STACK_SEGMENT_TRANSITIONS = TASK_STACK_SEGMENT_CLASSES.map((_, segmentIndex) => ({
  ...TASK_CLUSTER_SPRING,
  delay: segmentIndex * 0.025,
}));

const TASK_CLUSTER_REDUCED_TRANSITION = {
  duration: 0.01,
};

const TASK_SUBTASK_STAGGER_MS = 50;
export const TASK_SUBTASK_VIEWPORT_HEIGHT = 400;
const TASK_SUBTASK_ROW_HEIGHT = 46;
const TASK_SUBTASK_OVERSCAN = 4;
const TASK_SUBTASK_VIRTUAL_THRESHOLD = 30;

interface VirtualSubtaskItem {
  task: Task;
  index: number;
  top: number;
}

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
  onEditSubtask,
  onChangeSubtaskPriority,
  allTags = [],
  editTrigger,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  const shouldReduceMotion = useReducedMotion();
  const directSubtasks = task.subtasks || [];
  const subtaskCount = directSubtasks.length;
  const hasChildren = subtaskCount > 0;
  const hasTags = Boolean(task.tags?.length);
  const hasReview = hasTaskReview(task);
  const canOpenReviewAction = task.completed || hasReview;
  const isExpanded = hasChildren && !task.collapsed;
  const virtualSubtasks = useVirtualSubtasks(directSubtasks, isExpanded);
  const stackSegmentCount = getStackSegmentCount(subtaskCount);
  const stackSegmentStyle = !isExpanded && stackSegmentCount > 0
    ? getStackSegmentStyle(stackSegmentCount)
    : undefined;

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

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') handleSubmit();
    if (event.key === 'Escape') {
      setEditText(task.text);
      setIsEditing(false);
    }
  };

  const toggleCluster = () => {
    if (!hasChildren) return;
    onToggleCollapse(task.id);
  };

  const handleClusterKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!hasChildren) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onToggleCollapse(task.id);
  };

  return (
    <span className={`task-cluster ${hasChildren ? 'task-cluster-has-children' : 'task-cluster-no-children'} ${isExpanded ? 'task-cluster-expanded' : 'task-cluster-collapsed'}`}>
      <span className="task-cluster-stack-shell" style={stackSegmentStyle}>
        <AnimatePresence initial={false}>
          {!isExpanded && stackSegmentCount > 0 && (
            <span className="task-stack-segments" aria-hidden="true">
              {TASK_STACK_SEGMENT_CLASSES.slice(0, stackSegmentCount).map((segmentClass, segmentIndex) => (
                <motion.span
                  key={segmentClass}
                  className={`task-stack-segment ${segmentClass}`}
                  initial={shouldReduceMotion ? false : { opacity: 0 }}
                  animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0 }}
                  transition={shouldReduceMotion ? TASK_CLUSTER_REDUCED_TRANSITION : TASK_STACK_SEGMENT_TRANSITIONS[segmentIndex]}
                />
              ))}
            </span>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: 48 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={toggleCluster}
          onKeyDown={handleClusterKeyDown}
          onContextMenu={(e) => {
            e.preventDefault();
            const viewport = document.querySelector('.app-viewport');
            const shell = document.querySelector('.app-shell');
            const themeStyle = shell ? getComputedStyle(shell) : null;
            const viewportStyle = viewport ? getComputedStyle(viewport) : null;
            const num = (value: string, fallback: number) => {
              const parsed = parseFloat(value);
              return Number.isFinite(parsed) ? parsed : fallback;
            };
            const themeId = shell
              ? (Array.from(shell.classList).find((className) => className.startsWith('theme-'))?.slice('theme-'.length) || '')
              : '';
            void window.electronAPI?.openTaskContextMenu({
              task,
              allTags,
              screenX: e.screenX,
              screenY: e.screenY,
              isDark: document.documentElement.classList.contains('dark'),
              theme: {
                themeId,
                accent: themeStyle?.getPropertyValue('--personal-accent').trim() || '#52525b',
                secondary: themeStyle?.getPropertyValue('--personal-secondary').trim() || '#a1a1aa',
                menuOpacity: viewportStyle ? num(viewportStyle.getPropertyValue('--menu-opacity'), 0.96) : 0.96,
                blurStrength: viewportStyle ? num(viewportStyle.getPropertyValue('--blur-strength'), 18) : 18,
                cardRadius: viewportStyle ? num(viewportStyle.getPropertyValue('--card-radius'), 12) : 12,
              },
            });
          }}
          className={`task-card task-cluster-main-card group ${hasChildren ? 'task-card-has-children' : 'task-card-no-children'} ${hasTags ? 'task-card-has-tags' : 'task-card-no-tags'} ${canOpenReviewAction ? 'task-card-has-review-action' : 'task-card-no-review-action'} ${task.completed ? 'task-card-completed' : ''}`}
          data-priority={task.priority}
          role={hasChildren ? 'button' : undefined}
          tabIndex={hasChildren ? 0 : undefined}
          aria-expanded={hasChildren ? !task.collapsed : undefined}
          aria-controls={hasChildren ? `task-subtasks-${task.id}` : undefined}
        >
          <button
            type="button"
            ref={dragHandleProps?.setActivatorNodeRef}
            className="task-drag-handle"
            disabled={dragHandleProps?.disabled ?? true}
            aria-label="拖动调整任务顺序"
            onClick={stopClusterToggle}
            onPointerDown={stopClusterToggle}
            {...(dragHandleProps?.attributes || {})}
            {...(dragHandleProps?.listeners || {})}
            aria-disabled={dragHandleProps?.disabled ?? true}
          >
            <DragDotsIcon />
          </button>

          <span className="task-cluster-main-spacer task-cluster-leading-spacer" aria-hidden="true" />

          <button
            type="button"
            onClick={(event) => {
              stopClusterToggle(event);
              onToggle();
            }}
            onPointerDown={stopClusterToggle}
            className={`task-complete-action ${task.completed ? 'task-complete-action-complete' : ''}`}
            aria-label={task.completed ? '标记为未完成' : '标记为完成'}
            title={task.completed ? '标记为未完成' : '标记为完成'}
          >
            {task.completed && (
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          <span className="task-priority-stop" onClick={stopClusterToggle} onPointerDown={stopClusterToggle}>
            <PriorityPicker value={task.priority} onChange={onPriorityChange} />
          </span>

          {isEditing ? (
            <input
              type="text"
              value={editText}
              onChange={(event) => setEditText(event.target.value)}
              onBlur={handleSubmit}
              onKeyDown={handleKeyDown}
              onClick={stopClusterToggle}
              onPointerDown={stopClusterToggle}
              autoFocus
              className="task-edit-input"
              aria-label="编辑任务"
            />
          ) : (
            <span className="task-text-wrap">
              <span className="task-text-row">
                <span
                  onDoubleClick={(event) => {
                    stopClusterToggle(event);
                    if (!task.completed) setIsEditing(true);
                  }}
                  className="task-text"
                  title={`${task.text} · ${priorityTitles[task.priority]}`}
                >
                  {task.text}
                </span>
              </span>

              {task.tags && task.tags.length > 0 && (
                <span className="task-tags task-inline-tags">
                  {task.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="tag-pill-small">{tag}</span>
                  ))}
                  {task.tags.length > 2 && <span className="tag-more">+{task.tags.length - 2}</span>}
                </span>
              )}
              {task.scheduledDates && task.scheduledDates.length > 0 && (
                <span className="scheduled-dates">
                  📅 {task.scheduledDates.slice(0, 3).join(' · ')}
                  {task.scheduledDates.length > 3 && ` +${task.scheduledDates.length - 3}`}
                </span>
              )}
            </span>
          )}

          <span className="task-action-layer" aria-hidden={false} onClick={stopClusterToggle} onPointerDown={stopClusterToggle}>
            <span className="task-action-slot task-action-slot-review task-review-zone">
              {canOpenReviewAction && (
                <ReviewActionButton
                  hasReview={hasReview}
                  label={hasReview ? '查看完成情况' : '补写完成情况'}
                  onClick={onViewReview}
                />
              )}
            </span>

            <span className="task-action-slot task-action-slot-delete task-delete-zone">
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
      </span>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.span
            id={`task-subtasks-${task.id}`}
            className="task-subtasks task-subtasks-scroll-viewport"
            aria-label="子任务"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={shouldReduceMotion ? TASK_CLUSTER_REDUCED_TRANSITION : TASK_CLUSTER_SPRING}
            style={{ maxHeight: TASK_SUBTASK_VIEWPORT_HEIGHT }}
            ref={virtualSubtasks.viewportRef}
            onClick={stopClusterToggle}
            onPointerDown={stopClusterToggle}
          >
            <span
              className={`task-subtask-virtual-list ${virtualSubtasks.isVirtual ? 'task-subtask-virtual-list-active' : ''}`}
              style={virtualSubtasks.isVirtual ? { height: virtualSubtasks.totalHeight } : undefined}
            >
              {virtualSubtasks.visibleVirtualItems.map((virtualItem) => (
                <motion.span
                  key={virtualItem.task.id}
                  className="task-subtask-virtual-spacer"
                  style={virtualSubtasks.isVirtual ? { top: virtualItem.top } : undefined}
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.96 }}
                  animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.96 }}
                  transition={shouldReduceMotion ? TASK_CLUSTER_REDUCED_TRANSITION : {
                    ...TASK_CLUSTER_SPRING,
                    delay: virtualItem.index * TASK_SUBTASK_STAGGER_MS * 0.001,
                  }}
                >
                  <SubtaskCard
                    subtask={virtualItem.task}
                    onToggleSubtask={onToggleSubtask}
                    onDeleteSubtask={onDeleteSubtask}
                    onViewSubtaskReview={onViewSubtaskReview}
                    onEditSubtask={onEditSubtask}
                    onChangeSubtaskPriority={onChangeSubtaskPriority}
                  />
                </motion.span>
              ))}
            </span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

function SubtaskCard({
  subtask,
  onToggleSubtask,
  onDeleteSubtask,
  onViewSubtaskReview,
  onEditSubtask,
  onChangeSubtaskPriority,
}: {
  subtask: Task;
  onToggleSubtask: (id: string) => void;
  onDeleteSubtask: (id: string) => void;
  onViewSubtaskReview: (task: Task) => void;
  onEditSubtask: (id: string, text: string) => void;
  onChangeSubtaskPriority: (id: string, priority: Task['priority']) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(subtask.text);
  const hasReview = hasTaskReview(subtask);
  const canOpenReviewAction = subtask.completed || hasReview;

  useEffect(() => {
    setEditText(subtask.text);
  }, [subtask.text]);

  const submitEdit = () => {
    if (editText.trim()) onEditSubtask(subtask.id, editText.trim());
    setIsEditing(false);
  };

  const handleEditKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') submitEdit();
    if (event.key === 'Escape') {
      setEditText(subtask.text);
      setIsEditing(false);
    }
  };

  return (
    <span className={`task-subtask-row task-subtask-card ${subtask.completed ? 'task-subtask-row-completed' : ''}`} data-priority={subtask.priority}>
      <button
        type="button"
        className={`task-complete-action task-subtask-complete ${subtask.completed ? 'task-complete-action-complete' : ''}`}
        onClick={() => onToggleSubtask(subtask.id)}
        aria-label={subtask.completed ? '标记子任务为未完成' : '标记子任务为完成'}
      >
        {subtask.completed && (
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
            <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <PriorityPicker value={subtask.priority} onChange={(priority) => onChangeSubtaskPriority(subtask.id, priority)} title="调整子任务优先级" />

      {isEditing ? (
        <input
          type="text"
          value={editText}
          onChange={(event) => setEditText(event.target.value)}
          onBlur={submitEdit}
          onKeyDown={handleEditKeyDown}
          autoFocus
          className="task-edit-input task-subtask-edit-input"
          aria-label="编辑子任务"
        />
      ) : (
        <span
          className="task-subtask-text"
          title={`${subtask.text} · ${priorityTitles[subtask.priority]}`}
          onDoubleClick={() => !subtask.completed && setIsEditing(true)}
        >
          {subtask.text}
        </span>
      )}

      <span className="task-subtask-action-layer task-action-layer">
        <span className="task-action-slot task-action-slot-review task-subtask-review-zone">
          {canOpenReviewAction && (
            <button
              type="button"
              className="task-subtask-review task-icon-action task-review-action task-review-action-visible"
              onClick={() => onViewSubtaskReview(subtask)}
              aria-label={hasReview ? '查看子任务完成情况' : '补写子任务完成情况'}
              title={hasReview ? '查看子任务完成情况' : '补写子任务完成情况'}
            >
              <ReviewIcon hasReview={hasReview} />
            </button>
          )}
        </span>
        <span className="task-action-slot task-action-slot-delete task-subtask-delete-zone">
          <button
            type="button"
            className="task-subtask-delete task-icon-action task-delete-action"
            onClick={() => onDeleteSubtask(subtask.id)}
            aria-label="删除子任务"
            title="删除子任务"
          >
            <TrashIcon />
          </button>
        </span>
      </span>
    </span>
  );
}

function useVirtualSubtasks(subtasks: Task[], isExpanded: boolean) {
  const viewportRef = useRef<HTMLSpanElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const isVirtual = subtasks.length > TASK_SUBTASK_VIRTUAL_THRESHOLD;
  const totalHeight = isVirtual ? subtasks.length * TASK_SUBTASK_ROW_HEIGHT : undefined;

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !isVirtual || !isExpanded) return;

    const handleScroll = () => setScrollTop(viewport.scrollTop);
    handleScroll();
    viewport.addEventListener('scroll', handleScroll, { passive: true });
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [isExpanded, isVirtual]);

  const visibleVirtualItems = useMemo<VirtualSubtaskItem[]>(() => {
    if (!isVirtual) {
      return subtasks.map((subtask, index) => ({ task: subtask, index, top: 0 }));
    }

    const viewportHeight = TASK_SUBTASK_VIEWPORT_HEIGHT;
    const startIndex = Math.max(0, Math.floor(scrollTop / TASK_SUBTASK_ROW_HEIGHT) - TASK_SUBTASK_OVERSCAN);
    const endIndex = Math.min(
      subtasks.length,
      Math.ceil((scrollTop + viewportHeight) / TASK_SUBTASK_ROW_HEIGHT) + TASK_SUBTASK_OVERSCAN,
    );

    return subtasks.slice(startIndex, endIndex).map((subtask, sliceIndex) => {
      const index = startIndex + sliceIndex;
      return { task: subtask, index, top: index * TASK_SUBTASK_ROW_HEIGHT };
    });
  }, [isVirtual, scrollTop, subtasks]);

  return { viewportRef, isVirtual, totalHeight, visibleVirtualItems };
}

export function getStackSegmentCount(subtaskCount: number) {
  if (subtaskCount <= 0) return 0;
  return Math.min(subtaskCount, TASK_STACK_SEGMENT_CLASSES.length);
}

function getStackSegmentStyle(segmentCount: number): CSSProperties {
  return {
    '--task-stack-segment-count': segmentCount,
  } as CSSProperties;
}

function stopClusterToggle(event: Pick<MouseEvent<HTMLElement>, 'stopPropagation'> | Pick<PointerEvent<HTMLElement>, 'stopPropagation'>) {
  event.stopPropagation();
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
