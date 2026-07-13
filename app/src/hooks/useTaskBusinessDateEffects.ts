import { Dispatch, SetStateAction, useEffect } from 'react';
import { AppBehaviorSettings } from '../../shared/appSettings';
import { getBusinessDateKey, getNextRolloverDelay } from '../../shared/taskRollover';
import { Task } from '../types/task';
import { applyBusinessDateCarryover } from './taskCarryover';
import { TASK_CARRYOVER_LEDGER_KEY, areTaskCarryoverLedgersEqual, parseStoredCarryoverLedger } from './taskPersistence';
import { areTaskListsEqual, getSelectedDateAfterBusinessDateChange } from './taskHookState';

type TaskStateSetter<T> = Dispatch<SetStateAction<T>>;

interface UseTaskBusinessDateEffectsParams {
  appSettings: AppBehaviorSettings;
  isLoaded: boolean;
  setAllTasks: TaskStateSetter<Task[]>;
  setCurrentDate: TaskStateSetter<string>;
  setSelectedDate: TaskStateSetter<string>;
}

export function useTaskBusinessDateEffects({
  appSettings,
  isLoaded,
  setAllTasks,
  setCurrentDate,
  setSelectedDate,
}: UseTaskBusinessDateEffectsParams) {
  useEffect(() => {
    if (!isLoaded) return;

    const updateBusinessDate = () => {
      const today = getBusinessDateKey(new Date(), appSettings.rolloverTime);
      setCurrentDate((previousToday) => {
        if (previousToday === today) return previousToday;

        setSelectedDate((previousSelectedDate) => getSelectedDateAfterBusinessDateChange(
          previousSelectedDate,
          previousToday,
          today,
        ));

        window.electronAPI?.getStore(TASK_CARRYOVER_LEDGER_KEY).then((value) => {
          const ledger = parseStoredCarryoverLedger(value);
          setAllTasks((previousTasks) => {
            const carryoverResult = applyBusinessDateCarryover({
              tasks: previousTasks,
              targetDate: today,
              ledger,
              settings: appSettings,
            });
            if (!areTaskCarryoverLedgersEqual(ledger, carryoverResult.ledger)) {
              window.electronAPI?.setStore(TASK_CARRYOVER_LEDGER_KEY, carryoverResult.ledger);
            }
            return areTaskListsEqual(previousTasks, carryoverResult.tasks) ? previousTasks : carryoverResult.tasks;
          });
        });

        return today;
      });
    };

    const interval = window.setInterval(updateBusinessDate, 60 * 1000);
    const rolloverTimer = window.setTimeout(updateBusinessDate, getNextRolloverDelay(new Date(), appSettings.rolloverTime));

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(rolloverTimer);
    };
  }, [appSettings, isLoaded, setAllTasks, setCurrentDate, setSelectedDate]);
}
