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
  selectedDate: string;
  dailyWork: string;
  dailyInspiration: string;
}

export interface BuildSelectedDailyNoteSyncInputArgs {
  tasks: Task[];
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
  selectedDate,
  dailyWorkNotes,
  dailyInspirationNotes,
}: BuildSelectedDailyNoteSyncInputArgs): SyncSelectedDailyNoteInput {
  return {
    tasks,
    selectedDate,
    dailyWork: dailyWorkNotes[selectedDate] || '',
    dailyInspiration: dailyInspirationNotes[selectedDate] || '',
  };
}

export async function syncSelectedDailyNote({
  tasks,
  selectedDate,
  dailyWork,
  dailyInspiration,
}: SyncSelectedDailyNoteInput): Promise<ObsidianSyncStatus> {
  try {
    const result = await syncTasksToObsidian(tasks, selectedDate, dailyWork, dailyInspiration);
    return result?.ok ? 'synced' : 'error';
  } catch {
    return 'error';
  }
}
