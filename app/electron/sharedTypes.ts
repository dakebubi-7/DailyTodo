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

export type TaskHandoff = {
  status: 'done' | 'partial' | 'blocked' | 'in-progress';
  progressSummary: string;
  blocker: string;
  nextStep: string;
  shouldCarryForward: boolean;
  createdAt: string;
  source: 'manual' | 'ai';
};

export type SubtaskCarryoverProgress = {
  total: number;
  remaining: number;
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
  subtaskCarryoverProgress?: SubtaskCarryoverProgress;
  completedAt?: string;
  completionReview?: TaskCompletionReview;
  completionReviews?: TaskCompletionReview[];
  cleared?: boolean;
  focusDate?: string;
  focusOrder?: number;
  focusState?: 'not-started' | 'in-progress' | 'blocked' | 'completed';
  focusReason?: string;
  nextStep?: string;
  handoff?: TaskHandoff;
  carryoverContext?: TaskHandoff;
  subtasks?: ElectronTask[];
};
