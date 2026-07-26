import { getCompletionReviews } from './completionReviews';
import { getTaskDate, isDateKey } from './taskRollover';

export type DailyReviewStatus = 'pending' | 'completed' | 'failed';

export type DailyReviewSuggestion = {
  progressSummary: string;
  blocker: string;
  suggestedAction?: string;
  shouldCarryForward: boolean;
  createdAt: string;
};

export type DailyReviewSource = {
  taskId: string;
  taskText: string;
  sourceReviewId: string;
  sourceReviewRevision: string;
  review: {
    id?: string;
    status: 'done' | 'partial' | 'blocked';
    percent: number;
    summary: string;
    unknowns: string;
    nextStep: string;
    reviewedAt: string;
  } | undefined;
  carryoverContext?: {
    progressSummary: string;
    blocker: string;
    nextStep: string;
  };
  wasFocus: boolean;
  completed: boolean;
};

export type DailyReviewBatchItem = DailyReviewSource & {
  status: DailyReviewStatus;
  suggestion?: DailyReviewSuggestion;
  error?: string;
  attempts: number;
};

export type DailyReviewBatch = {
  sourceDate: string;
  createdAt: string;
  updatedAt: string;
  items: DailyReviewBatchItem[];
};

export type DailyReviewTask = {
  id: string;
  text: string;
  completed: boolean;
  taskDate?: string;
  focusDate?: string;
  completionReview?: DailyReviewSource['review'];
  completionReviews?: Array<NonNullable<DailyReviewSource['review']>>;
  carryoverContext?: {
    progressSummary: string;
    blocker: string;
    nextStep: string;
  };
  subtasks?: DailyReviewTask[];
};

type BuildDailyReviewBatchParams = {
  sourceDate: string;
  createdAt: string;
  tasks: DailyReviewTask[];
};

type MergeDailyReviewBatchParams = {
  existing?: DailyReviewBatch;
  sourceDate: string;
  updatedAt: string;
  tasks: DailyReviewTask[];
};

const VAGUE_NEXT_STEPS = new Set(['continue', 'continue working', 'continue work', '继续', '继续推进', '推进一下', '处理一下']);

export function hasMeaningfulNextStep(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized.length >= 4 && !VAGUE_NEXT_STEPS.has(normalized);
}

function getReviewRevision(review: NonNullable<DailyReviewSource['review']>) {
  return [review.id ?? '', review.status, review.percent, review.summary, review.unknowns, review.nextStep, review.reviewedAt]
    .map((part) => String(part).replace(/\|/g, '\\|'))
    .join('|');
}

function toSource(task: DailyReviewTask, sourceDate: string): DailyReviewSource | undefined {
  const latestReview = getCompletionReviews(task).at(-1);
  const wasFocus = task.focusDate === sourceDate;
  const hasEligibleReview = latestReview && (
    latestReview.status === 'partial'
    || latestReview.status === 'blocked'
    || (latestReview.status === 'done' && hasMeaningfulNextStep(latestReview.nextStep))
  );
  const isUnfinishedFocus = wasFocus && !task.completed && Boolean(task.carryoverContext);
  if (!hasEligibleReview && !isUnfinishedFocus) return undefined;
  if (latestReview && getTaskDate(task, sourceDate) !== sourceDate && !isUnfinishedFocus) return undefined;

  return {
    taskId: task.id,
    taskText: task.text,
    sourceReviewId: latestReview?.id ?? `focus:${sourceDate}`,
    sourceReviewRevision: latestReview ? getReviewRevision(latestReview) : `focus:${sourceDate}|${task.carryoverContext?.nextStep ?? ''}`,
    review: latestReview,
    carryoverContext: task.carryoverContext,
    wasFocus,
    completed: task.completed,
  };
}

export function getDailyReviewEligibleSources(tasks: DailyReviewTask[], sourceDate: string): DailyReviewSource[] {
  if (!isDateKey(sourceDate)) return [];
  const sources: DailyReviewSource[] = [];
  const visit = (entries: DailyReviewTask[]) => {
    for (const task of entries) {
      const source = toSource(task, sourceDate);
      if (source) sources.push(source);
      if (task.subtasks?.length) visit(task.subtasks);
    }
  };
  visit(tasks);
  return sources;
}

export function buildDailyReviewBatch({ sourceDate, createdAt, tasks }: BuildDailyReviewBatchParams): DailyReviewBatch {
  const items = getDailyReviewEligibleSources(tasks, sourceDate).map<DailyReviewBatchItem>((source) => ({
    ...source,
    status: 'pending',
    attempts: 0,
  }));
  return { sourceDate, createdAt, updatedAt: createdAt, items };
}

export function mergeDailyReviewBatch({ existing, sourceDate, updatedAt, tasks }: MergeDailyReviewBatchParams): DailyReviewBatch {
  const next = buildDailyReviewBatch({ sourceDate, createdAt: existing?.createdAt ?? updatedAt, tasks });
  const existingByRevision = new Map(
    existing?.items.map((item) => [`${item.taskId}:${item.sourceReviewRevision}`, item]) ?? [],
  );
  return {
    ...next,
    updatedAt,
    items: next.items.map((item) => {
      const previous = existingByRevision.get(`${item.taskId}:${item.sourceReviewRevision}`);
      return previous
        ? {
          ...item,
          ...(previous.status === 'completed'
            ? previous
            : { attempts: previous.attempts }),
        }
        : item;
    }),
  };
}
