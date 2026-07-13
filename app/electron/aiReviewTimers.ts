import type { BrowserWindow } from 'electron';
import type { AiReviewSettings } from '../shared/aiReview/aiReviewSettings';
import { getNextMonthlyDelay, getNextTimerDelay, getNextWeeklyDelay } from '../shared/aiReview/timer';

type CreateAiReviewTimerSchedulerOptions = {
  getAiReviewSettings(): AiReviewSettings;
  getMainWindow(): BrowserWindow | null;
};

type AiReviewTimerChannel =
  | 'aiReview:tick'
  | 'aiReview:weeklyTick'
  | 'aiReview:monthlyTick'
  | 'aiReview:externalWeeklyTick'
  | 'aiReview:externalMonthlyTick';

export function createAiReviewTimerScheduler({
  getAiReviewSettings,
  getMainWindow,
}: CreateAiReviewTimerSchedulerOptions) {
  let aiTimer: ReturnType<typeof setTimeout> | null = null;
  let weeklyTimer: ReturnType<typeof setTimeout> | null = null;
  let monthlyTimer: ReturnType<typeof setTimeout> | null = null;
  let externalWeeklyTimer: ReturnType<typeof setTimeout> | null = null;
  let externalMonthlyTimer: ReturnType<typeof setTimeout> | null = null;

  function emitTick(channel: AiReviewTimerChannel) {
    const win = getMainWindow();
    if (!win || win.isDestroyed()) return;
    win.webContents.send(channel);
  }

  function scheduleAiTimer() {
    if (aiTimer) {
      clearTimeout(aiTimer);
      aiTimer = null;
    }
    const settings = getAiReviewSettings();
    if (!settings.timerEnabled) return;
    const delay = getNextTimerDelay(new Date(), settings.timerTime);
    aiTimer = setTimeout(() => {
      emitTick('aiReview:tick');
      scheduleAiTimer();
    }, delay);
  }

  function scheduleWeeklyTimer() {
    if (weeklyTimer) {
      clearTimeout(weeklyTimer);
      weeklyTimer = null;
    }
    const settings = getAiReviewSettings();
    if (!settings.weeklyTimerEnabled) return;
    const delay = getNextWeeklyDelay(new Date(), settings.weeklyTimerWeekday, settings.weeklyTimerTime);
    weeklyTimer = setTimeout(() => {
      emitTick('aiReview:weeklyTick');
      scheduleWeeklyTimer();
    }, delay);
  }

  function scheduleMonthlyTimer() {
    if (monthlyTimer) {
      clearTimeout(monthlyTimer);
      monthlyTimer = null;
    }
    const settings = getAiReviewSettings();
    if (!settings.monthlyTimerEnabled) return;
    const delay = getNextMonthlyDelay(new Date(), settings.monthlyTimerDay, settings.monthlyTimerTime);
    monthlyTimer = setTimeout(() => {
      emitTick('aiReview:monthlyTick');
      scheduleMonthlyTimer();
    }, delay);
  }

  function scheduleExternalWeeklyTimer() {
    if (externalWeeklyTimer) {
      clearTimeout(externalWeeklyTimer);
      externalWeeklyTimer = null;
    }
    const settings = getAiReviewSettings();
    if (!settings.externalWeeklyTimerEnabled) return;
    const delay = getNextWeeklyDelay(new Date(), settings.externalWeeklyTimerWeekday, settings.externalWeeklyTimerTime);
    externalWeeklyTimer = setTimeout(() => {
      emitTick('aiReview:externalWeeklyTick');
      scheduleExternalWeeklyTimer();
    }, delay);
  }

  function scheduleExternalMonthlyTimer() {
    if (externalMonthlyTimer) {
      clearTimeout(externalMonthlyTimer);
      externalMonthlyTimer = null;
    }
    const settings = getAiReviewSettings();
    if (!settings.externalMonthlyTimerEnabled) return;
    const delay = getNextMonthlyDelay(new Date(), settings.externalMonthlyTimerDay, settings.externalMonthlyTimerTime);
    externalMonthlyTimer = setTimeout(() => {
      emitTick('aiReview:externalMonthlyTick');
      scheduleExternalMonthlyTimer();
    }, delay);
  }

  function scheduleAiTimers() {
    const win = getMainWindow();
    if (!win || win.isDestroyed()) return;
    scheduleAiTimer();
    scheduleWeeklyTimer();
    scheduleMonthlyTimer();
    scheduleExternalWeeklyTimer();
    scheduleExternalMonthlyTimer();
  }

  return {
    scheduleAiTimers,
  };
}
