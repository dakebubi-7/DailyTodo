import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { getShellText } from '../i18n';
import type { AppBehaviorSettings } from '../../shared/appSettings';
import type { Task, TaskCompletionReview } from '../types/task';
import type { TabType } from '../types/task';
import { TaskViewSelector } from './taskList/TaskViewSelector';
import { ReviewRecordBlock } from './reviewView/ReviewRecordBlock';
import { buildReviewDateGroups, groupLabel, localDateKey } from './reviewView/reviewGrouping';
import { reviewIsInHistoryRange } from '../hooks/taskHistoryRange';
import { getReviewIdentity } from '../../shared/obsidianReviewRetention';
import { HistoryCleanupToolbar } from './historyCleanup/HistoryCleanupToolbar';
import {
  isEveryVisibleHistoryItemSelected,
  keepVisibleSelection,
  selectVisibleHistoryItems,
  toggleHistorySelection,
} from './historyCleanup/historyCleanupSelection';

interface ReviewViewProps {
  /** 全部任务（含已 cleared）：复盘价值不应因清理列表而消失。 */
  allTasks: Task[];
  appSettings: Pick<AppBehaviorSettings, 'taskHistoryRange' | 'taskHistoryStartDate'>;
  text: ReturnType<typeof getShellText>['app'];
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  /** 编辑已有复盘记录（保留原时间戳和 id，只改文字字段/状态/完成度）。 */
  onEditReview?: (taskId: string, reviewId: string, updates: Partial<Pick<TaskCompletionReview, 'status' | 'percent' | 'summary' | 'unknowns' | 'nextStep'>>) => void;
  /** 删除已有复盘记录。 */
  onDeleteReview?: (taskId: string, reviewId: string) => void;
  onDeleteReviews?: (records: Array<{ taskId: string; reviewId: string }>) => void;
}

const statusLabel: Record<TaskCompletionReview['status'], string> = {
  done: '全部完成',
  partial: '部分完成',
  blocked: '有卡点',
};

export function ReviewView({
  allTasks,
  appSettings,
  text,
  activeTab,
  onTabChange,
  onEditReview,
  onDeleteReview,
  onDeleteReviews,
}: ReviewViewProps) {
  const today = localDateKey();
  const yesterday = useMemo(() => {
    const d = new Date(`${today}T00:00:00`);
    d.setDate(d.getDate() - 1);
    return localDateKey(d);
  }, [today]);

  // 展开态：key = `${date}:${taskId}`，同一天同一任务一张卡片。
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [isCleanupMode, setIsCleanupMode] = useState(false);
  const [selectedReviewKeys, setSelectedReviewKeys] = useState<string[]>([]);

  const dateGroups = useMemo(
    () => buildReviewDateGroups(
      allTasks,
      (timestamp) => reviewIsInHistoryRange(timestamp, appSettings, today),
    ),
    [allTasks, appSettings, today],
  );

  const visibleReviewRecords = useMemo(
    () => dateGroups.flatMap((group) => group.taskGroups.flatMap((taskGroup) => taskGroup.records))
      .filter((record) => record.review)
      .map((record) => ({
        key: `${record.task.id}:${getReviewIdentity(record.review!)}`,
        taskId: record.task.id,
        reviewId: getReviewIdentity(record.review!),
      })),
    [dateGroups],
  );
  const visibleReviewKeys = useMemo(() => visibleReviewRecords.map((record) => record.key), [visibleReviewRecords]);
  const allVisibleReviewsSelected = isEveryVisibleHistoryItemSelected(selectedReviewKeys, visibleReviewKeys);

  useEffect(() => {
    setSelectedReviewKeys((previous) => keepVisibleSelection(previous, visibleReviewKeys));
  }, [visibleReviewKeys]);

  const cancelCleanup = useCallback(() => {
    setIsCleanupMode(false);
    setSelectedReviewKeys([]);
  }, []);
  const toggleVisibleReviewSelection = useCallback(() => {
    setSelectedReviewKeys((previous) => (
      isEveryVisibleHistoryItemSelected(previous, visibleReviewKeys) ? [] : selectVisibleHistoryItems(visibleReviewKeys)
    ));
  }, [visibleReviewKeys]);
  const deleteSelectedReviews = useCallback(() => {
    if (!selectedReviewKeys.length || !onDeleteReviews) return;
    const message = text.cleanupReviewsConfirmation.replace('{count}', String(selectedReviewKeys.length));
    if (!window.confirm(message)) return;
    const selectedKeySet = new Set(selectedReviewKeys);
    onDeleteReviews(visibleReviewRecords
      .filter((record) => selectedKeySet.has(record.key))
      .map(({ taskId, reviewId }) => ({ taskId, reviewId })));
    cancelCleanup();
  }, [cancelCleanup, onDeleteReviews, selectedReviewKeys, text.cleanupReviewsConfirmation, visibleReviewRecords]);

  if (!dateGroups.length) {
    return (
      <div className="review-view flex min-h-0 flex-1 flex-col overflow-hidden px-2 py-2">
        <div className="review-toolbar">
          <TaskViewSelector text={text} activeTab={activeTab} onTabChange={onTabChange} />
          {onDeleteReviews && (
            <HistoryCleanupToolbar
              isActive={isCleanupMode}
              visibleItemCount={visibleReviewKeys.length}
              selectedItemCount={selectedReviewKeys.length}
              isEveryVisibleItemSelected={allVisibleReviewsSelected}
              text={text}
              onStart={() => setIsCleanupMode(true)}
              onCancel={cancelCleanup}
              onToggleVisibleItems={toggleVisibleReviewSelection}
              onDeleteSelected={deleteSelectedReviews}
            />
          )}
        </div>
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
      <div className="review-toolbar">
        <TaskViewSelector text={text} activeTab={activeTab} onTabChange={onTabChange} />
        {onDeleteReviews && (
          <HistoryCleanupToolbar
            isActive={isCleanupMode}
            visibleItemCount={visibleReviewKeys.length}
            selectedItemCount={selectedReviewKeys.length}
            isEveryVisibleItemSelected={allVisibleReviewsSelected}
            text={text}
            onStart={() => setIsCleanupMode(true)}
            onCancel={cancelCleanup}
            onToggleVisibleItems={toggleVisibleReviewSelection}
            onDeleteSelected={deleteSelectedReviews}
          />
        )}
      </div>
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
                          {group.records.map((record, idx) => {
                            const review = record.review;
                            const reviewKey = review
                              ? `${record.task.id}:${getReviewIdentity(review)}`
                              : undefined;

                            return (
                              <ReviewRecordBlock
                                key={review?.id || record.timestamp || idx}
                                record={record}
                                showDivider={idx > 0}
                                onEditReview={onEditReview}
                                onDeleteReview={onDeleteReview}
                                isCleanupMode={isCleanupMode}
                                isCleanupSelected={reviewKey ? selectedReviewKeys.includes(reviewKey) : false}
                                cleanupSelectionLabel={text.selectHistoryItem}
                                onToggleCleanupSelection={reviewKey ? () => {
                                  setSelectedReviewKeys((previous) => toggleHistorySelection(previous, reviewKey));
                                } : undefined}
                              />
                            );
                          })}
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
