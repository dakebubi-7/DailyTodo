import { RetainedObsidianReview, mergeRetainedReviewsForObsidian } from '../../shared/obsidianReviewRetention';
import { syncTasksToObsidian } from '../store/taskStore';
import { Task } from '../types/task';

export type ObsidianSyncStatus = 'idle' | 'synced' | 'needs-path' | 'error';

export interface BuildObsidianSyncTasksInput {
  allTasks: Task[];
  retainedObsidianReviews: RetainedObsidianReview[];
  syncDeletedReviewsToObsidian: boolean;
}

export interface SyncSelectedDailyNoteInput {
  tasks: Task[];
  beforeTasks?: Task[];
  selectedDate: string;
  dailyWork: string;
  dailyInspiration: string;
}

export interface BuildSelectedDailyNoteSyncInputArgs {
  tasks: Task[];
  beforeTasks?: Task[];
  selectedDate: string;
  dailyWorkNotes: Record<string, string>;
  dailyInspirationNotes: Record<string, string>;
}

export function buildObsidianSyncTasks({
  allTasks,
  retainedObsidianReviews,
  syncDeletedReviewsToObsidian,
}: BuildObsidianSyncTasksInput) {
  return syncDeletedReviewsToObsidian
    ? allTasks
    : mergeRetainedReviewsForObsidian(allTasks, retainedObsidianReviews);
}

export function buildSelectedDailyNoteSyncInput({
  tasks,
  beforeTasks,
  selectedDate,
  dailyWorkNotes,
  dailyInspirationNotes,
}: BuildSelectedDailyNoteSyncInputArgs): SyncSelectedDailyNoteInput {
  const input: SyncSelectedDailyNoteInput = {
    tasks,
    selectedDate,
    dailyWork: dailyWorkNotes[selectedDate] || '',
    dailyInspiration: dailyInspirationNotes[selectedDate] || '',
  };
  if (beforeTasks !== undefined) input.beforeTasks = beforeTasks;
  return input;
}

function areCompletionReviewsEqual(
  left: Task['completionReview'] | undefined,
  right: Task['completionReview'] | undefined,
) {
  if (left === right) return true;
  return Boolean(left && right
    && left.id === right.id
    && left.status === right.status
    && left.percent === right.percent
    && left.summary === right.summary
    && left.unknowns === right.unknowns
    && left.nextStep === right.nextStep
    && left.reviewedAt === right.reviewedAt);
}

function areCompletionReviewListsEqual(left: Task['completionReviews'], right: Task['completionReviews']) {
  if (left === right) return true;
  if (!left || !right || left.length !== right.length) return false;
  return left.every((review, index) => areCompletionReviewsEqual(review, right[index]));
}

function areSubtaskCarryoverProgressEqual(
  left: Task['subtaskCarryoverProgress'],
  right: Task['subtaskCarryoverProgress'],
) {
  if (left === right) return true;
  return Boolean(left && right && left.total === right.total && left.remaining === right.remaining);
}

function areTasksEquivalentForObsidianSync(left: Task[], right: Task[]): boolean {
  if (left === right) return true;
  if (left.length !== right.length) return false;

  return left.every((task, index) => {
    const other = right[index];
    if (!other
      || task.id !== other.id
      || task.text !== other.text
      || task.completed !== other.completed
      || task.priority !== other.priority
      || task.createdAt !== other.createdAt
      || task.taskDate !== other.taskDate
      || task.completedAt !== other.completedAt
      || !areCompletionReviewListsEqual(task.completionReviews, other.completionReviews)
      || !areCompletionReviewsEqual(task.completionReview, other.completionReview)
      || !areSubtaskCarryoverProgressEqual(task.subtaskCarryoverProgress, other.subtaskCarryoverProgress)
      || task.tags?.length !== other.tags?.length
      || task.tags?.some((tag, tagIndex) => tag !== other.tags?.[tagIndex])) {
      return false;
    }
    return areTasksEquivalentForObsidianSync(task.subtasks || [], other.subtasks || []);
  });
}

export function areSelectedDailyNoteSyncInputsEquivalent(
  left: SyncSelectedDailyNoteInput | undefined,
  right: SyncSelectedDailyNoteInput,
): boolean {
  return Boolean(left
    && left.selectedDate === right.selectedDate
    && left.dailyWork === right.dailyWork
    && left.dailyInspiration === right.dailyInspiration
    && areTasksEquivalentForObsidianSync(left.tasks, right.tasks));
}

export async function syncSelectedDailyNote({
  tasks,
  beforeTasks,
  selectedDate,
  dailyWork,
  dailyInspiration,
}: SyncSelectedDailyNoteInput): Promise<ObsidianSyncStatus> {
  try {
    const result = await syncTasksToObsidian(tasks, selectedDate, dailyWork, dailyInspiration, beforeTasks);
    return result?.ok ? 'synced' : 'error';
  } catch {
    return 'error';
  }
}
