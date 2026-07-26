import {
  buildDailyReviewBatch,
  mergeDailyReviewBatch,
  type DailyReviewBatch,
  type DailyReviewBatchItem,
  type DailyReviewTask,
} from '../shared/dailyReview';
import {
  buildDailyReviewMessages,
  parseAiDailyReviewSuggestion,
} from '../shared/aiReview/handoff';
import type { ChatMessage, LlmResult } from '../shared/llm/openaiClient';
import { isDateKey } from '../shared/taskRollover';
import { filterValidTasks } from '../shared/taskValidation';
import type { ElectronStoreLike } from './sharedTypes';

export const DAILY_REVIEW_BATCHES_KEY = 'dailyReviewBatches';

type DailyReviewBatchStore = Record<string, DailyReviewBatch>;

type DailyReviewLlmAvailability =
  | { ok: true; callLlm(messages: ChatMessage[]): Promise<LlmResult> }
  | { ok: false; error: string };

type CreateAiReviewDailyBatchServiceOptions = {
  store: ElectronStoreLike;
  getAiReviewSettings(): { enabled: boolean };
  ensureDailyReviewLlmAvailable(): DailyReviewLlmAvailability;
  now?(): string;
};

type DailyReviewBatchRunResult = {
  ok: boolean;
  batch: DailyReviewBatch;
  error?: string;
};

function readBatchStore(value: unknown): DailyReviewBatchStore {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const batches: DailyReviewBatchStore = {};
  for (const [sourceDate, batch] of Object.entries(value)) {
    if (!isDateKey(sourceDate) || !isDailyReviewBatch(batch)) continue;
    batches[sourceDate] = batch;
  }
  return batches;
}

function isDailyReviewBatch(value: unknown): value is DailyReviewBatch {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const batch = value as Partial<DailyReviewBatch>;
  return (
    isDateKey(batch.sourceDate)
    && typeof batch.createdAt === 'string'
    && typeof batch.updatedAt === 'string'
    && Array.isArray(batch.items)
    && batch.items.every(isDailyReviewBatchItem)
  );
}

function isDailyReviewBatchItem(value: unknown): value is DailyReviewBatchItem {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const item = value as Partial<DailyReviewBatchItem>;
  return (
    typeof item.taskId === 'string'
    && typeof item.taskText === 'string'
    && typeof item.sourceReviewId === 'string'
    && typeof item.sourceReviewRevision === 'string'
    && typeof item.completed === 'boolean'
    && typeof item.wasFocus === 'boolean'
    && (item.status === 'pending' || item.status === 'completed' || item.status === 'failed')
    && typeof item.attempts === 'number'
  );
}

function updateItem(
  batch: DailyReviewBatch,
  taskId: string,
  sourceReviewRevision: string,
  update: (item: DailyReviewBatchItem) => DailyReviewBatchItem,
): DailyReviewBatch {
  return {
    ...batch,
    items: batch.items.map((item) => (
      item.taskId === taskId && item.sourceReviewRevision === sourceReviewRevision
        ? update(item)
        : item
    )),
  };
}

export function createAiReviewDailyBatchService({
  store,
  getAiReviewSettings,
  ensureDailyReviewLlmAvailable,
  now = () => new Date().toISOString(),
}: CreateAiReviewDailyBatchServiceOptions) {
  function getDailyReviewBatch(sourceDate: string): DailyReviewBatch | undefined {
    if (!isDateKey(sourceDate)) return undefined;
    return readBatchStore(store.get(DAILY_REVIEW_BATCHES_KEY))[sourceDate];
  }

  async function runDailyReviewBatch(sourceDate: string): Promise<DailyReviewBatchRunResult> {
    const timestamp = now();
    if (!isDateKey(sourceDate)) {
      return {
        ok: false,
        error: 'Invalid review source date.',
        batch: buildDailyReviewBatch({ sourceDate: timestamp.slice(0, 10), createdAt: timestamp, tasks: [] }),
      };
    }
    if (!getAiReviewSettings().enabled) {
      return {
        ok: false,
        error: 'AI-assisted review is disabled.',
        batch: buildDailyReviewBatch({ sourceDate, createdAt: timestamp, tasks: [] }),
      };
    }

    const batches = readBatchStore(store.get(DAILY_REVIEW_BATCHES_KEY));
    const tasks = filterValidTasks(store.get('tasks')) as DailyReviewTask[];
    let batch = mergeDailyReviewBatch({
      existing: batches[sourceDate],
      sourceDate,
      updatedAt: timestamp,
      tasks,
    });
    const unresolved = batch.items.filter((item) => item.status !== 'completed');
    if (unresolved.length === 0) {
      store.set(DAILY_REVIEW_BATCHES_KEY, { ...batches, [sourceDate]: batch });
      return { ok: true, batch };
    }

    const llm = ensureDailyReviewLlmAvailable();
    if (!llm.ok) {
      batch = {
        ...batch,
        updatedAt: timestamp,
        items: batch.items.map((item) => item.status === 'completed' ? item : {
          ...item,
          status: 'failed',
          attempts: item.attempts + 1,
          error: llm.error,
        }),
      };
      store.set(DAILY_REVIEW_BATCHES_KEY, { ...batches, [sourceDate]: batch });
      return { ok: false, error: llm.error, batch };
    }

    for (const item of unresolved) {
      let result: LlmResult;
      try {
        result = await llm.callLlm(buildDailyReviewMessages({
          sourceDate,
          task: {
            id: item.taskId,
            text: item.taskText,
            completed: item.completed,
            review: item.review,
            carryoverContext: item.carryoverContext,
            wasFocus: item.wasFocus,
          },
        }));
      } catch (error) {
        result = { ok: false, error: error instanceof Error ? error.message : String(error) };
      }
      if (!result.ok) {
        batch = updateItem(batch, item.taskId, item.sourceReviewRevision, (current) => ({
          ...current,
          status: 'failed',
          attempts: current.attempts + 1,
          error: result.error,
        }));
        continue;
      }
      const suggestion = parseAiDailyReviewSuggestion(result.content, timestamp);
      if (!suggestion) {
        batch = updateItem(batch, item.taskId, item.sourceReviewRevision, (current) => ({
          ...current,
          status: 'failed',
          attempts: current.attempts + 1,
          error: 'AI daily review response has an invalid format.',
        }));
        continue;
      }
      batch = updateItem(batch, item.taskId, item.sourceReviewRevision, (current) => ({
        ...current,
        status: 'completed',
        attempts: current.attempts + 1,
        suggestion,
        error: undefined,
      }));
    }

    batch = { ...batch, updatedAt: now() };
    const hasFailures = batch.items.some((item) => item.status === 'failed');
    store.set(DAILY_REVIEW_BATCHES_KEY, { ...batches, [sourceDate]: batch });
    return hasFailures
      ? { ok: false, error: 'Some daily review suggestions could not be generated.', batch }
      : { ok: true, batch };
  }

  return {
    getDailyReviewBatch,
    runDailyReviewBatch,
  };
}
