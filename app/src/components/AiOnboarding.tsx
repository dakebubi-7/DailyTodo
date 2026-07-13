import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AiReviewSettings,
  createDefaultAiReviewSettings,
} from '../../shared/aiReview/aiReviewSettings';
import { dismissOnboarding } from '../../shared/aiReview/onboarding';
import { getShellText } from '../i18n';
import { AiOnboardingSteps } from './aiOnboarding/AiOnboardingSteps';

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

        <AiOnboardingSteps step={step} text={text} draft={draft} onUpdate={update} />

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
