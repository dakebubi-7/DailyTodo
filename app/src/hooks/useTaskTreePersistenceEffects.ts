import { Dispatch, SetStateAction, useEffect, useRef } from 'react';
import { AppBehaviorSettings } from '../../shared/appSettings';
import { getBusinessDateKey } from '../../shared/taskRollover';
import { saveTasks } from '../store/taskStore';
import { Task } from '../types/task';
import { createTaskTreePersistence } from './taskPersistence';
import { areTaskListsEqual, normalizeIncomingTasks } from './taskHookState';

type TaskStateSetter<T> = Dispatch<SetStateAction<T>>;

interface UseTaskTreePersistenceEffectsParams {
  allTasks: Task[];
  appSettings: AppBehaviorSettings;
  isLoaded: boolean;
  setAllTasks: TaskStateSetter<Task[]>;
}

export function useTaskTreePersistenceEffects({
  allTasks,
  appSettings,
  isLoaded,
  setAllTasks,
}: UseTaskTreePersistenceEffectsParams) {
  const skipNextTaskPersistRef = useRef(false);
  const taskTreePersistenceRef = useRef<ReturnType<typeof createTaskTreePersistence<Task[]>> | null>(null);

  const primeTaskTreePersistence = (tasks: Task[]) => {
    taskTreePersistenceRef.current ??= createTaskTreePersistence({
      delay: 150,
      persist: (nextTasks) => { void saveTasks(nextTasks); },
      areEqual: areTaskListsEqual,
    });
    taskTreePersistenceRef.current.prime(tasks);
  };

  useEffect(() => {
    if (!isLoaded) return;

    const skipTasksWrite = skipNextTaskPersistRef.current;
    if (skipTasksWrite) skipNextTaskPersistRef.current = false;

    if (!taskTreePersistenceRef.current) {
      taskTreePersistenceRef.current = createTaskTreePersistence({
        delay: 150,
        persist: (tasks) => { void saveTasks(tasks); },
        areEqual: areTaskListsEqual,
      });
    }

    if (skipTasksWrite) {
      taskTreePersistenceRef.current.reset();
      return;
    }

    taskTreePersistenceRef.current.schedule(allTasks);
  }, [allTasks, isLoaded]);

  useEffect(() => {
    return () => taskTreePersistenceRef.current?.flush();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const unsubscribe = window.electronAPI?.onTasksChanged((incoming) => {
      const today = getBusinessDateKey(new Date(), appSettings.rolloverTime);
      const nextTasks = normalizeIncomingTasks(incoming, today);
      setAllTasks((previousTasks) => {
        if (areTaskListsEqual(previousTasks, nextTasks)) return previousTasks;
        skipNextTaskPersistRef.current = true;
        return nextTasks;
      });
    });
    return () => unsubscribe?.();
  }, [appSettings.rolloverTime, isLoaded, setAllTasks]);

  return { primeTaskTreePersistence };
}
