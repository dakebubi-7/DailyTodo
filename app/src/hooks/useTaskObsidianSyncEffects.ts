import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef } from 'react';
import { AppBehaviorSettings } from '../../shared/appSettings';
import { RetainedObsidianReview } from '../../shared/obsidianReviewRetention';
import { Task } from '../types/task';
import {
  ObsidianSyncStatus,
  SyncSelectedDailyNoteInput,
  areSelectedDailyNoteSyncInputsEquivalent,
  buildObsidianSyncTasks,
  buildSelectedDailyNoteSyncInput,
  syncSelectedDailyNote,
} from './taskObsidianSync';

interface UseTaskObsidianSyncEffectsParams {
  allTasks: Task[];
  appSettings: AppBehaviorSettings;
  dailyInspirationNotes: Record<string, string>;
  dailyWorkNotes: Record<string, string>;
  isLoaded: boolean;
  obsidianPath: string;
  retainedObsidianReviews: RetainedObsidianReview[];
  selectedDate: string;
  setSyncStatus: Dispatch<SetStateAction<ObsidianSyncStatus>>;
}

export function useTaskObsidianSyncEffects({
  allTasks,
  appSettings,
  dailyInspirationNotes,
  dailyWorkNotes,
  isLoaded,
  obsidianPath,
  retainedObsidianReviews,
  selectedDate,
  setSyncStatus,
}: UseTaskObsidianSyncEffectsParams) {
  const lastSyncedObsidianTasksRef = useRef<Task[] | null>(null);
  const lastSyncedDailyNoteInputRef = useRef<SyncSelectedDailyNoteInput>();
  const obsidianSyncTasks = useMemo(() => buildObsidianSyncTasks({
    allTasks,
    retainedObsidianReviews,
    syncDeletedReviewsToObsidian: appSettings.syncDeletedReviewsToObsidian,
  }), [allTasks, retainedObsidianReviews, appSettings.syncDeletedReviewsToObsidian]);

  const syncDailyNote = useCallback(async () => {
    const beforeSyncTasks = lastSyncedObsidianTasksRef.current || obsidianSyncTasks;
    const syncInput = buildSelectedDailyNoteSyncInput({
      tasks: obsidianSyncTasks,
      beforeTasks: beforeSyncTasks,
      selectedDate,
      dailyWorkNotes,
      dailyInspirationNotes,
    });
    const status = await syncSelectedDailyNote(syncInput);
    if (status === 'synced') {
      lastSyncedObsidianTasksRef.current = obsidianSyncTasks;
      lastSyncedDailyNoteInputRef.current = syncInput;
    }
    setSyncStatus(status);
  }, [dailyInspirationNotes, dailyWorkNotes, obsidianSyncTasks, selectedDate, setSyncStatus]);

  useEffect(() => {
    if (!isLoaded) return;

    if (!obsidianPath) {
      setSyncStatus('needs-path');
      return;
    }

    const beforeSyncTasks = lastSyncedObsidianTasksRef.current || obsidianSyncTasks;
    const syncInput = buildSelectedDailyNoteSyncInput({
      tasks: obsidianSyncTasks,
      beforeTasks: beforeSyncTasks,
      selectedDate,
      dailyWorkNotes,
      dailyInspirationNotes,
    });
    if (areSelectedDailyNoteSyncInputsEquivalent(lastSyncedDailyNoteInputRef.current, syncInput)) {
      return;
    }

    const timer = window.setTimeout(() => {
      syncSelectedDailyNote(syncInput).then((status) => {
        if (status === 'synced') {
          lastSyncedObsidianTasksRef.current = obsidianSyncTasks;
          lastSyncedDailyNoteInputRef.current = syncInput;
        }
        setSyncStatus(status);
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [dailyInspirationNotes, dailyWorkNotes, isLoaded, obsidianPath, obsidianSyncTasks, selectedDate, setSyncStatus]);

  return { obsidianSyncTasks, syncCurrentDailyNote: syncDailyNote };
}
