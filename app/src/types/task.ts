export type TaskSource = 'personal' | 'external';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  source?: TaskSource;
  createdAt: string;
  taskDate: string;
  isToday: boolean;
  carriedFromDate?: string;
  carriedFromTaskId?: string;
  completedAt?: string;
  completionReview?: TaskCompletionReview;
  completionReviews?: TaskCompletionReview[];
  /**
   * "Clear completed" only hides the task in the app UI; it does not delete the task itself.
   * Cleared tasks remain in local storage and continue syncing to Obsidian.
   */
  cleared?: boolean;
  // Same task's extra visible/planned dates; these are not separate task instances.
  scheduledDates?: string[];
  tags?: string[];
  subtasks?: Task[];
  parentTaskId?: string;
  collapsed?: boolean;
}

export interface TaskCompletionReview {
  id?: string;
  status: 'done' | 'partial' | 'blocked';
  percent: number;
  summary: string;
  unknowns: string;
  nextStep: string;
  reviewedAt: string;
}

export type TabType = 'today' | 'all' | 'completed';

export interface TaskStore {
  tasks: Task[];
}

export interface DailyNote {
  work: string;
  thoughts: string;
  updatedAt?: string;
}
