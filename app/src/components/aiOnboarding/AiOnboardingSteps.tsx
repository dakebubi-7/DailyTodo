import type { AiReviewSettings } from '../../../shared/aiReview/aiReviewSettings';
import type { getShellText } from '../../i18n';

type OnboardingText = ReturnType<typeof getShellText>['settings']['aiReview']['onboarding'];

interface AiOnboardingStepsProps {
  step: number;
  text: OnboardingText;
  draft: AiReviewSettings;
  onUpdate: <K extends keyof AiReviewSettings>(key: K, value: AiReviewSettings[K]) => void;
}

export function AiOnboardingSteps({ step, text, draft, onUpdate }: AiOnboardingStepsProps) {
  if (step === 1) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{text.step1Title}</h3>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{text.step1Body}</p>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{text.step2Title}</h3>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{text.step2Body}</p>
        <label className="block space-y-1">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">API Base URL</span>
          <input
            className="w-full rounded-lg border border-zinc-300 bg-white/70 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900/70"
            value={draft.baseUrl}
            onChange={(event) => onUpdate('baseUrl', event.target.value)}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">API Key</span>
          <input
            type="password"
            className="w-full rounded-lg border border-zinc-300 bg-white/70 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900/70"
            value={draft.apiKey}
            onChange={(event) => onUpdate('apiKey', event.target.value)}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Model</span>
          <input
            className="w-full rounded-lg border border-zinc-300 bg-white/70 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900/70"
            value={draft.model}
            onChange={(event) => onUpdate('model', event.target.value)}
          />
        </label>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{text.step3Title}</h3>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{text.step3Body}</p>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={draft.timerEnabled}
            onChange={(event) => onUpdate('timerEnabled', event.target.checked)}
          />
          <span>{text.enableTimer}</span>
        </label>
        <input
          type="time"
          className="rounded-lg border border-zinc-300 bg-white/70 px-2 py-1 text-sm disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900/70"
          value={draft.timerTime}
          disabled={!draft.timerEnabled}
          onChange={(event) => onUpdate('timerTime', event.target.value)}
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{text.finishedHint}</p>
      </div>
    );
  }

  return null;
}
