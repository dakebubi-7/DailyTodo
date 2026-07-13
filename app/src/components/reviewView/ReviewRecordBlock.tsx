import { useState, type MouseEvent } from 'react';
import type { TaskCompletionReview } from '../../types/task';
import { isTaskCompletionReviewStatus } from '../../../shared/completionReviews';
import { getReviewIdentity } from '../../../shared/obsidianReviewRetention';
import { formatTime, type ReviewRecord } from './reviewGrouping';

export interface ReviewRecordBlockProps {
  record: ReviewRecord;
  showDivider: boolean;
  onEditReview?: (taskId: string, reviewId: string, updates: Partial<Pick<TaskCompletionReview, 'status' | 'percent' | 'summary' | 'unknowns' | 'nextStep'>>) => void;
  onDeleteReview?: (taskId: string, reviewId: string) => void;
}

const statusLabel: Record<TaskCompletionReview['status'], string> = {
  done: '全部完成',
  partial: '部分完成',
  blocked: '有卡点',
};

const statusOptions: { value: TaskCompletionReview['status']; label: string }[] = [
  { value: 'done', label: '全部完成' },
  { value: 'partial', label: '部分完成' },
  { value: 'blocked', label: '有卡点' },
];

export function ReviewRecordBlock({
  record,
  showDivider,
  onEditReview,
  onDeleteReview,
}: ReviewRecordBlockProps) {
  const review = record.review;
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState<TaskCompletionReview['status']>(review?.status || 'done');
  const [editPercent, setEditPercent] = useState(review?.percent ?? 100);
  const [editSummary, setEditSummary] = useState(review?.summary || '');
  const [editUnknowns, setEditUnknowns] = useState(review?.unknowns || '');
  const [editNextStep, setEditNextStep] = useState(review?.nextStep || '');

  const fields = review
    ? [
        { label: '下一步', value: review.nextStep },
        { label: '还没懂 / 卡点', value: review.unknowns },
        { label: '今天情况', value: review.summary },
      ].filter((field) => field.value?.trim())
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
    onEditReview(record.task.id, getReviewIdentity(review), {
      status: editStatus,
      percent: editPercent,
      summary: editSummary.trim(),
      unknowns: editUnknowns.trim(),
      nextStep: editNextStep.trim(),
    });
    setIsEditing(false);
  };

  const handleContextMenu = (event: MouseEvent) => {
    if (!review || !onDeleteReview) return;
    event.preventDefault();
    onDeleteReview(record.task.id, getReviewIdentity(review));
  };

  return (
    <div className={`review-record ${showDivider ? 'review-record-divided' : ''}`} onContextMenu={handleContextMenu}>
      <div className="review-record-head">
        <span className="review-record-time">{formatTime(record.timestamp)}</span>
        <span className="review-record-head-actions">
          {review && !isEditing && onEditReview && (
            <button type="button" onClick={handleStartEdit} className="review-edit-btn" title="编辑这条记录（保留原时间）">
              编辑
            </button>
          )}
          {review && !isEditing && onDeleteReview && (
            <button
              type="button"
              onClick={() => onDeleteReview(record.task.id, getReviewIdentity(review))}
              className="review-delete-btn"
              title="删除这条完成记录"
            >
              删除
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
              onChange={(event) => {
                if (!isTaskCompletionReviewStatus(event.target.value)) return;
                const next = event.target.value;
                setEditStatus(next);
                if (next === 'done') setEditPercent(100);
                else if (next === 'partial' && editPercent === 100) setEditPercent(80);
                else if (next === 'blocked' && editPercent === 100) setEditPercent(50);
              }}
              className="review-edit-select"
            >
              {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <label className="review-edit-label">完成度 {editPercent}%</label>
          <input type="range" min="0" max="100" step="5" value={editPercent} onChange={(event) => setEditPercent(Number(event.target.value))} className="review-edit-range" />
          <textarea className="review-edit-textarea" placeholder="下一步" value={editNextStep} onChange={(event) => setEditNextStep(event.target.value)} rows={2} />
          <textarea className="review-edit-textarea" placeholder="还没懂 / 卡点" value={editUnknowns} onChange={(event) => setEditUnknowns(event.target.value)} rows={2} />
          <textarea className="review-edit-textarea" placeholder="今天情况" value={editSummary} onChange={(event) => setEditSummary(event.target.value)} rows={2} />
          <div className="review-edit-actions">
            <button type="button" onClick={() => setIsEditing(false)} className="review-edit-cancel">取消</button>
            <button type="button" onClick={handleSave} className="review-edit-save">保存</button>
          </div>
        </div>
      ) : review ? (
        fields.length ? (
          <div className="review-record-fields">
            {fields.map((field) => (
              <div key={field.label} className="review-field">
                <div className="review-field-label">{field.label}</div>
                <div className="review-field-value">{field.value.trim()}</div>
              </div>
            ))}
          </div>
        ) : <p className="review-field-empty">这条只记录了完成度，没有填写文字。</p>
      ) : <p className="review-field-empty">这条只是标记了完成，没有写复盘内容。</p>}
    </div>
  );
}
