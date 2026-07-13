import { getCompletionReviews } from '../../../shared/completionReviews';
import type { Task, TaskCompletionReview } from '../../types/task';

export interface ReviewRecord {
  task: Task;
  review?: TaskCompletionReview;
  timestamp: string;
}

export interface TaskGroup {
  task: Task;
  records: ReviewRecord[];
}

export interface ReviewDateGroup {
  date: string;
  taskGroups: TaskGroup[];
}

export function localDateKey(date = new Date()) {
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

export function groupLabel(dateKey: string, today: string, yesterday: string) {
  if (dateKey === today) return '今天';
  if (dateKey === yesterday) return '昨天';
  return dateKey.replaceAll('-', '/');
}

export function formatTime(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return date.toLocaleString('zh-CN');
}

export function buildReviewDateGroups(allTasks: Task[]): ReviewDateGroup[] {
  const dateTaskGroups = new Map<string, Map<string, ReviewRecord[]>>();
  const appendRecordToDate = (record: ReviewRecord) => {
    const key = dateKeyOf(record.timestamp);
    let taskGroups = dateTaskGroups.get(key);
    if (!taskGroups) {
      taskGroups = new Map<string, ReviewRecord[]>();
      dateTaskGroups.set(key, taskGroups);
    }

    const taskRecords = taskGroups.get(record.task.id);
    if (taskRecords) taskRecords.push(record);
    else taskGroups.set(record.task.id, [record]);
  };

  allTasks.forEach((task) => {
    const reviews = getCompletionReviews(task);
    if (reviews.length) {
      reviews.forEach((review) => {
        appendRecordToDate({ task, review, timestamp: review.reviewedAt || task.completedAt || task.createdAt });
      });
    } else if (task.completed && task.completedAt) {
      appendRecordToDate({ task, timestamp: task.completedAt });
    }
  });

  return [...dateTaskGroups.entries()]
    .sort(([leftDate], [rightDate]) => rightDate.localeCompare(leftDate))
    .map(([date, taskMap]) => {
      const taskGroups: TaskGroup[] = [...taskMap.values()]
        .map((records) => ({
          task: records[0].task,
          records: records.sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
        }))
        .sort((a, b) => b.records[0].timestamp.localeCompare(a.records[0].timestamp));
      return { date, taskGroups };
    });
}
