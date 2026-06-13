import { AnimatePresence, motion } from 'framer-motion';
import { useRef } from 'react';
import { Task } from '../types/task';
import { TaskItem } from './TaskItem';
import { useFloatingScrollbar } from '../hooks/useFloatingScrollbar';

interface TaskListProps {
  tasks: Task[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchOpen: boolean;
  onToggleSearch: () => void;
  showOpenOnly: boolean;
  onToggleOpenOnly: () => void;
  priorityFilter: 'all' | 'high' | 'medium' | 'low';
  onPriorityFilterChange: (value: 'all' | 'high' | 'medium' | 'low') => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onPriorityChange: (id: string, priority: Task['priority']) => void;
  onViewReview: (task: Task) => void;
  onToggleSubtask: (id: string) => void;
  onDeleteSubtask: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onViewSubtaskReview: (task: Task) => void;
  editRequest?: { id: string; nonce: number } | null;
}

const priorityFilterLabel = {
  all: '全部优先级',
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
};

export function TaskList({
  tasks,
  searchQuery,
  onSearchChange,
  searchOpen,
  onToggleSearch,
  showOpenOnly,
  onToggleOpenOnly,
  priorityFilter,
  onPriorityFilterChange,
  onToggle,
  onDelete,
  onEdit,
  onPriorityChange,
  onViewReview,
  onToggleSubtask,
  onDeleteSubtask,
  onToggleCollapse,
  onViewSubtaskReview,
  editRequest,
}: TaskListProps) {
  const filtersActive = Boolean(searchQuery.trim() || showOpenOnly || priorityFilter !== 'all');
  const scrollRef = useRef<HTMLDivElement>(null);
  useFloatingScrollbar(scrollRef);

  const allTags = Array.from(
    new Set(tasks.flatMap(task => task.tags || []))
  ).sort((a, b) => {
    const countA = tasks.filter(t => t.tags?.includes(a)).length;
    const countB = tasks.filter(t => t.tags?.includes(b)).length;
    return countB - countA;
  });

  const clearFilters = () => {
    onSearchChange('');
    if (showOpenOnly) onToggleOpenOnly();
    onPriorityFilterChange('all');
  };

  const renderTask = (task: Task, index: number) => (
    <motion.div
      key={task.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 56 }}
      transition={{
        duration: 0.2,
        delay: index * 0.015,
        ease: 'easeOut',
      }}
    >
      <TaskItem
        task={task}
        onToggle={() => onToggle(task.id)}
        onDelete={() => onDelete(task.id)}
        onEdit={(text) => onEdit(task.id, text)}
        onPriorityChange={(priority) => onPriorityChange(task.id, priority)}
        onViewReview={() => onViewReview(task)}
        onToggleSubtask={onToggleSubtask}
        onDeleteSubtask={onDeleteSubtask}
        onToggleCollapse={onToggleCollapse}
        onViewSubtaskReview={onViewSubtaskReview}
        allTags={allTags}
        editTrigger={editRequest && editRequest.id === task.id ? editRequest.nonce : undefined}
      />
    </motion.div>
  );

  const personalTasks = tasks.filter((task) => (task.source || 'personal') === 'personal');
  const externalTasks = tasks.filter((task) => (task.source || 'personal') === 'external');
  const shouldGroupBySource = externalTasks.length > 0;

  return (
    <div className="task-list flex min-h-0 flex-1 flex-col overflow-hidden px-2 py-2">
      <div className="task-toolbar">
        <div className="task-toolbar-row">
          <button
            type="button"
            onClick={onToggleSearch}
            className={`task-tool-icon ${searchOpen || filtersActive ? 'task-tool-active' : ''}`}
            title="搜索与筛选"
            aria-label="搜索与筛选"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
          </button>

          <button
            type="button"
            onClick={onToggleOpenOnly}
            className={`task-filter-button ${showOpenOnly ? 'task-filter-active' : ''}`}
          >
            未完成
          </button>

          <select
            value={priorityFilter}
            onChange={(event) => onPriorityFilterChange(event.target.value as 'all' | 'high' | 'medium' | 'low')}
            className="task-filter-select"
            aria-label="优先级筛选"
          >
            <option value="all">全部优先级</option>
            <option value="high">高优先级</option>
            <option value="medium">中优先级</option>
            <option value="low">低优先级</option>
          </select>

          {filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="task-clear-filter"
              title={`清除筛选：${priorityFilterLabel[priorityFilter]}`}
            >
              清除
            </button>
          )}
        </div>

        {(searchOpen || searchQuery.trim()) && (
          <input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className="task-search-input"
            placeholder="搜索任务..."
            aria-label="搜索任务"
          />
        )}
      </div>

      <div ref={scrollRef} className="task-scroll min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {tasks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="empty-state"
              >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" className="mb-3 opacity-45">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="font-sans text-sm">这一天还没有任务</p>
                <p className="mt-1 font-sans text-xs">写下第一件要推进的小事</p>
              </motion.div>
            ) : shouldGroupBySource ? (
              <>
                {personalTasks.length > 0 && (
                  <section className="task-source-group" aria-label="个人任务">
                    <div className="task-source-group-title">个人任务</div>
                    {personalTasks.map((task, index) => renderTask(task, index))}
                  </section>
                )}

                <section className="task-source-group" aria-label="外部任务">
                  <div className="task-source-group-title task-source-group-title-external">外部任务</div>
                  {externalTasks.map((task, index) => renderTask(task, personalTasks.length + index))}
                </section>
              </>
            ) : (
              tasks.map((task, index) => renderTask(task, index))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
