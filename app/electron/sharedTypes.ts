export type ElectronStoreLike = {
  get(key: string): unknown;
  get(key: string, defaultValue: unknown): unknown;
  set(key: string, value: unknown): void;
};

export type VaultStatus =
  | { ok: true; vaultPath: string; reason?: undefined }
  | { ok: false; reason: string; vaultPath?: undefined };

export type InspectDailyResult = {
  exists: boolean;
  hasAiContent: boolean;
  filePath: string;
  error?: string;
};

export type TaskCompletionReview = {
  id?: string;
  status: 'done' | 'partial' | 'blocked';
  percent: number;
  summary: string;
  unknowns: string;
  nextStep: string;
  reviewedAt: string;
};

export type ElectronTask = {
  id: string;
  text: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  taskDate?: string;
  isToday: boolean;
  carriedFromDate?: string;
  carriedFromTaskId?: string;
  completedAt?: string;
  completionReview?: TaskCompletionReview;
  completionReviews?: TaskCompletionReview[];
  subtasks?: ElectronTask[];
};
