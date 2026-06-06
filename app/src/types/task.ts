export interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  taskDate: string;
  isToday: boolean;
  carriedFromDate?: string;
  carriedFromTaskId?: string;
  completedAt?: string;
  completionReview?: TaskCompletionReview;
  completionReviews?: TaskCompletionReview[];
  /**
   * 「清理已完成」只隐藏应用内的显示,不删除任务本身。
   * 被清理的任务仍保留在本地存储并继续同步到 Obsidian,所以 Obsidian 记录不受影响。
   */
  cleared?: boolean;
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
