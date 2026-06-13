import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Task, TaskCompletionReview } from '../types/task';
import { getCompletionReviews } from '../../shared/completionReviews';
import { getReviewIdentity } from '../../shared/obsidianReviewRetention';

interface ReviewViewProps {
  /** 全部任务（含已 cleared）：复盘价值不应因清理列表而消失。 */
  allTasks: Task[];
  /** 编辑已有复盘记录（保留原时间戳和 id，只改文字字段/状态/完成度）。 */
  onEditReview?: (taskId: string, reviewId: string, updates: Partial<Pick<TaskCompletionReview, 'status' | 'percent' | 'summary' | 'unknowns' | 'nextStep'>>) => void;
}

/** 一条完成记录（某任务在某天的一次追加；无 review 的「只标记完成」用 review=undefined 兜底）。 */
interface ReviewRecord {
  task: Task;
  review?: TaskCompletionReview;
  timestamp: string;
}

interface TaskGroup {
  task: Task;
  records: ReviewRecord[]; // 同一天、同一任务的多次追加，按时间倒序
}

const statusLabel: Record<TaskCompletionReview['status'], string> = {
  done: '全部完成',
  partial: '部分完成',
  blocked: '有卡点',
};

function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dateKeyOf(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp.slice(0, 10);
  return localDateKey(date);
}

function groupLabel(dateKey: string, today: string, yesterday: string) {
  if (dateKey === today) return '今天';
  if (dateKey === yesterday) return '昨天';
  return dateKey.replaceAll('-', '/');
}

function formatTime(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return date.toLocaleString('zh-CN');
}

export function ReviewView({ allTasks, onEditReview }: ReviewViewProps) {
  const today = localDateKey();
  const yesterday = useMemo(() => {
    const d = new Date(`${today}T00:00:00`);
    d.setDate(d.getDate() - 1);
    return localDateKey(d);
  }, [today]);

  // 展开态：key = `${date}:${taskId}`，同一天同一任务一张卡片。
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  // 先拆成「记录」，按天分组，再在每天里按任务合并成一张卡片。
  const dateGroups = useMemo(() => {
    const records: ReviewRecord[] = [];
    allTasks.forEach((task) => {
      const reviews = getCompletionReviews(task);
      if (reviews.length) {
        reviews.forEach((review) => {
          records.push({ task, review, timestamp: review.reviewedAt || task.completedAt || task.createdAt });
        });
      } else if (task.completed && task.completedAt) {
        records.push({ task, timestamp: task.completedAt });
      }
    });

    const byDate = new Map<string, ReviewRecord[]>();
    records.forEach((record) => {
      const key = dateKeyOf(record.timestamp);
      byDate.set(key, [...(byDate.get(key) || []), record]);
    });

    return [...byDate.keys()]
      .sort((a, b) => b.localeCompare(a))
      .map((date) => {
        const dayRecords = byDate.get(date)!.slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        const taskMap = new Map<string, ReviewRecord[]>();
        dayRecords.forEach((record) => {
          taskMap.set(record.task.id, [...(taskMap.get(record.task.id) || []), record]);
        });
        const taskGroups: TaskGroup[] = [...taskMap.values()]
          .map((recs) => ({ task: recs[0].task, records: recs }))
          .sort((a, b) => b.records[0].timestamp.localeCompare(a.records[0].timestamp));
        return { date, taskGroups };
      });
  }, [allTasks]);

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

const statusOptions: { value: TaskCompletionReview['status']; label: string }[] = [
  { value: 'done', label: '全部完成' },
  { value: 'partial', label: '部分完成' },
  { value: 'blocked', label: '有卡点' },
];

function ReviewRecordBlock({
  record,
  showDivider,
  onEditReview,
}: {
  record: ReviewRecord;
  showDivider: boolean;
  onEditReview?: ReviewViewProps['onEditReview'];
}) {
  const review = record.review;
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState<TaskCompletionReview['status']>(review?.status || 'done');
  const [editPercent, setEditPercent] = useState(review?.percent ?? 100);
  const [editSummary, setEditSummary] = useState(review?.summary || '');
  const [editUnknowns, setEditUnknowns] = useState(review?.unknowns || '');
  const [editNextStep, setEditNextStep] = useState(review?.nextStep || '');

  const fields = review
    ? ([
        { label: '下一步', value: review.nextStep },
        { label: '还没懂 / 卡点', value: review.unknowns },
        { label: '今天情况', value: review.summary },
      ].filter((f) => f.value?.trim()))
    : [];

  const handleStartEdit = () => {
    if (!review) return;
    setEditStatus(review.status);
    setEditPercent(review.percent);
    setEditSummary(review.summary);
    setEditUnknowns(review.unknowns);
    setEditNextStep(review.nextStep);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!review || !onEditReview) return;
    const reviewId = getReviewIdentity(review);
    onEditReview(record.task.id, reviewId, {
      status: editStatus,
      percent: editPercent,
      summary: editSummary.trim(),
      unknowns: editUnknowns.trim(),
      nextStep: editNextStep.trim(),
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <div className={`review-record ${showDivider ? 'review-record-divided' : ''}`}>
      <div className="review-record-head">
        <span className="review-record-time">{formatTime(record.timestamp)}</span>
        <span className="review-record-head-actions">
          {review && !isEditing && onEditReview && (
            <button
              type="button"
              onClick={handleStartEdit}
              className="review-edit-btn"
              title="编辑这条记录（保留原时间）"
            >
              编辑
            </button>
          )}
          {review && <span className="review-record-status">{statusLabel[review.status]} · {review.percent}%</span>}
        </span>
      </div>

      {isEditing && review ? (
        <div className="review-edit-form">
          <div className="review-edit-row">
            <label className="review-edit-label">完成情况</label>
            <select
              value={editStatus}
              onChange={(e) => {
                const next = e.target.value as TaskCompletionReview['status'];
                setEditStatus(next);
                if (next === 'done') setEditPercent(100);
                else if (next === 'partial' && editPercent === 100) setEditPercent(80);
                else if (next === 'blocked' && editPercent === 100) setEditPercent(50);
              }}
              className="review-edit-select"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <label className="review-edit-label">完成度 {editPercent}%</label>
          <input
            type="range"
            min="0" max="100" step="5"
            value={editPercent}
            onChange={(e) => setEditPercent(Number(e.target.value))}
            className="review-edit-range"
          />
          <textarea
            className="review-edit-textarea"
            placeholder="下一步"
            value={editNextStep}
            onChange={(e) => setEditNextStep(e.target.value)}
            rows={2}
          />
          <textarea
            className="review-edit-textarea"
            placeholder="还没懂 / 卡点"
            value={editUnknowns}
            onChange={(e) => setEditUnknowns(e.target.value)}
            rows={2}
          />
          <textarea
            className="review-edit-textarea"
            placeholder="今天情况"
            value={editSummary}
            onChange={(e) => setEditSummary(e.target.value)}
            rows={2}
          />
          <div className="review-edit-actions">
            <button type="button" onClick={handleCancel} className="review-edit-cancel">取消</button>
            <button type="button" onClick={handleSave} className="review-edit-save">保存</button>
          </div>
        </div>
      ) : (
        <>
          {review ? (
            fields.length ? (
              <div className="review-record-fields">
                {fields.map((f) => (
                  <div key={f.label} className="review-field">
                    <div className="review-field-label">{f.label}</div>
                    <div className="review-field-value">{f.value.trim()}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="review-field-empty">这条只记录了完成度，没有填写文字。</p>
            )
          ) : (
            <p className="review-field-empty">这条只是标记了完成，没有写复盘内容。</p>
          )}
        </>
      )}
    </div>
  );
}
