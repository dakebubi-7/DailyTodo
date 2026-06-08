import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AiReviewSettings,
  createDefaultAiReviewSettings,
} from '../../shared/aiReview/aiReviewSettings';
import { dismissOnboarding } from '../../shared/aiReview/onboarding';
import { getShellText } from '../i18n';

type OnboardingText = ReturnType<typeof getShellText>['settings']['aiReview']['onboarding'];

interface AiOnboardingProps {
  isOpen: boolean;
  text: OnboardingText;
  initialSettings?: AiReviewSettings;
  /** 完成或跳过时调用，传入已标记 onboardingDismissed 的设置。 */
  onComplete: (settings: AiReviewSettings) => void;
}

const TOTAL_STEPS = 3;

export function AiOnboarding({ isOpen, text, initialSettings, onComplete }: AiOnboardingProps) {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<AiReviewSettings>(
    () => initialSettings ?? createDefaultAiReviewSettings(),
  );

  if (!isOpen) return null;

  const update = <K extends keyof AiReviewSettings>(key: K, value: AiReviewSettings[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const stepLabel = text.stepLabel
    .replace('{current}', String(step))
    .replace('{total}', String(TOTAL_STEPS));

  // 完成：填了 key 就顺手启用 AI；没填则仅关闭向导（后端无 key 时安全跳过）。
  const finish = () => onComplete(dismissOnboarding({ ...draft, enabled: draft.apiKey.trim().length > 0 }));
  // 跳过：保留已填内容但不启用，标记关闭。
  const skip = () => onComplete(dismissOnboarding({ ...draft, enabled: false }));

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-zinc-950/30 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="ai-onboarding w-full max-w-[26rem] rounded-[24px] border border-white/60 bg-white/90 p-5 shadow-[0_24px_80px_rgba(31,41,55,0.28)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/90"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{text.title}</h2>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{stepLabel}</span>
        </div>

        {step === 1 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{text.step1Title}</h3>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{text.step1Body}</p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{text.step2Title}</h3>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{text.step2Body}</p>
            <label className="block space-y-1">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">API Base URL</span>
              <input
                className="w-full rounded-lg border border-zinc-300 bg-white/70 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900/70"
                value={draft.baseUrl}
                onChange={(event) => update('baseUrl', event.target.value)}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">API Key</span>
              <input
                type="password"
                className="w-full rounded-lg border border-zinc-300 bg-white/70 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900/70"
                value={draft.apiKey}
                onChange={(event) => update('apiKey', event.target.value)}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Model</span>
              <input
                className="w-full rounded-lg border border-zinc-300 bg-white/70 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900/70"
                value={draft.model}
                onChange={(event) => update('model', event.target.value)}
              />
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{text.step3Title}</h3>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{text.step3Body}</p>
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={draft.timerEnabled}
                onChange={(event) => update('timerEnabled', event.target.checked)}
              />
              <span>{text.enableTimer}</span>
            </label>
            <input
              type="time"
              className="rounded-lg border border-zinc-300 bg-white/70 px-2 py-1 text-sm disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900/70"
              value={draft.timerTime}
              disabled={!draft.timerEnabled}
              onChange={(event) => update('timerTime', event.target.value)}
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{text.finishedHint}</p>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            className="text-xs text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
            onClick={skip}
          >
            {text.skip}
          </button>
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                className="rounded-lg px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                onClick={() => setStep((prev) => Math.max(1, prev - 1))}
              >
                {text.back}
              </button>
            )}
            {step < TOTAL_STEPS ? (
              <button
                type="button"
                className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                onClick={() => setStep((prev) => Math.min(TOTAL_STEPS, prev + 1))}
              >
                {text.next}
              </button>
            ) : (
              <button
                type="button"
                className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                onClick={finish}
              >
                {draft.apiKey.trim() ? text.finish : text.done}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
