import type { CaptureItem } from '../../shared/obsidianCompanion';
import type { Task } from '../types/task';
import { buildCaptureItems } from '../store/taskStore';

export interface AppCompanionCaptureInput {
  allTasks: Task[];
  selectedDate: string;
  dailyWork: string;
  dailyInspiration: string;
  mobileCaptureItems: CaptureItem[];
}

export function createAppCompanionCaptureItems({
  allTasks,
  selectedDate,
  dailyWork,
  dailyInspiration,
  mobileCaptureItems,
}: AppCompanionCaptureInput): CaptureItem[] {
  return [
    ...buildCaptureItems(allTasks, selectedDate, dailyWork, dailyInspiration),
    ...mobileCaptureItems,
  ];
}


export function createAppCompanionCaptureGetter(input: AppCompanionCaptureInput): () => CaptureItem[] {
  return () => createAppCompanionCaptureItems(input);
}
