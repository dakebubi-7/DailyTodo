import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Task, TaskCompletionReview } from '../types/task';
import { ReviewRecordBlock } from './reviewView/ReviewRecordBlock';
import { buildReviewDateGroups, groupLabel, localDateKey } from './reviewView/reviewGrouping';

interface ReviewViewProps {
  /** 全部任务（含已 cleared）：复盘价值不应因清理列表而消失。 */
  allTasks: Task[];
  /** 编辑已有复盘记录（保留原时间戳和 id，只改文字字段/状态/完成度）。 */
  onEditReview?: (taskId: string, reviewId: string, updates: Partial<Pick<TaskCompletionReview, 'status' | 'percent' | 'summary' | 'unknowns' | 'nextStep'>>) => void;
  /** 删除已有复盘记录。 */
  onDeleteReview?: (taskId: string, reviewId: string) => void;
}

const statusLabel: Record<TaskCompletionReview['status'], string> = {
  done: '全部完成',
  partial: '部分完成',
  blocked: '有卡点',
};

export function ReviewView({ allTasks, onEditReview, onDeleteReview }: ReviewViewProps) {
  const today = localDateKey();
  const yesterday = useMemo(() => {
    const d = new Date(`${today}T00:00:00`);
    d.setDate(d.getDate() - 1);
    return localDateKey(d);
  }, [today]);

  // 展开态：key = `${date}:${taskId}`，同一天同一任务一张卡片。
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const dateGroups = useMemo(() => buildReviewDateGroups(allTasks), [allTasks]);

  if (!dateGroups.length) {
    return (
      <div className="review-view flex min-h-0 flex-1 flex-col overflow-hidden px-2 py-2">
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" className="mb-3 opacity-45">
            <path d="M3 12h4l3 8 4-16 3 8h4" />
          </svg>
          <p className="font-sans text-sm">还没有复盘记录</p>
          <p className="mt-1 font-sans text-xs">完成任务时写下「今天情况 / 卡点 / 下一步」，这里会按天汇总</p>
        </div>
      </div>
    );
  }

  return (
    <div className="review-view min-h-0 flex-1 overflow-y-auto px-3 py-2 task-scroll">
      <div className="space-y-4">
        {dateGroups.map(({ date, taskGroups }) => (
          <section key={date} className="review-group">
            <h3 className="review-group-title">
              {groupLabel(date, today, yesterday)}
              <span className="review-group-count">{taskGroups.length}</span>
            </h3>
            <div className="space-y-2">
              {taskGroups.map((group) => {
                const key = `${date}:${group.task.id}`;
                const isOpen = expandedKey === key;
                const latest = group.records[0].review;
                const count = group.records.length;
                return (
                  <div key={key} className="review-entry" data-status={latest?.status}>
                    <button
                      type="button"
                      className="review-entry-head"
                      onClick={() => setExpandedKey((prev) => (prev === key ? null : key))}
                      aria-expanded={isOpen}
                    >
                      <span className="review-entry-text" title={group.task.text}>{group.task.text}</span>
                      <span className="review-entry-meta">
                        {latest ? `${statusLabel[latest.status]} · ${latest.percent}%` : '已完成'}
                        {count > 1 && <span className="review-entry-badge">{count} 条</span>}
                      </span>
                      <svg
                        className={`review-entry-caret ${isOpen ? 'is-open' : ''}`}
                        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                        aria-hidden="true"
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="review-entry-records"
                        >
                          {group.records.map((record, idx) => (
                            <ReviewRecordBlock
                              key={record.review?.id || record.timestamp || idx}
                              record={record}
                              showDivider={idx > 0}
                              onEditReview={onEditReview}
                              onDeleteReview={onDeleteReview}
                            />
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
