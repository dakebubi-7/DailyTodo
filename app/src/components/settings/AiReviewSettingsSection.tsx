import type { getShellText } from '../../i18n';
import type {
  AiReviewSettings,
  MonthlySourceMode,
  WeeklySourceMode,
} from '../../../shared/aiReview/aiReviewSettings';
import type { AiReviewProgressEvent, AiReviewRunDiagnostic } from '../../../shared/aiReview/runDiagnostics';
import type { AiReviewHandoffSuggestion } from '../../../shared/aiReview/aiReviewIpcResultReaders';
import type { Task } from '../../types/task';
import { ToggleRow } from './SettingsControls';
import { AiAccountZone, type GenerationAction } from './AiReviewSettingsWidgets';
import { AiReviewManualGenerationSection } from './AiReviewManualGenerationSection';
import { AiReviewReportRoutingSection } from './AiReviewReportRoutingSection';
import { AiReviewSourceSettingsSection } from './AiReviewSourceSettingsSection';
import { AiReviewTimerSettingsSection } from './AiReviewTimerSettingsSection';

type SettingsText = ReturnType<typeof getShellText>['settings'];
type WeekOption = { label: string; value: number };
type SourceOption<T extends string> = { value: T; label: string; hint: string };

interface AiReviewSettingsSectionProps {
  text: SettingsText;
  zh: boolean;
  aiReviewSettings: AiReviewSettings;
  weeklySourceOptions: Array<SourceOption<WeeklySourceMode>>;
  monthlySourceOptions: Array<SourceOption<MonthlySourceMode>>;
  weekOptions: WeekOption[];
  generatingAction: GenerationAction | null;
  generationStatus: string;
  currentProgress: AiReviewProgressEvent | null;
  waitingForRealProgress: string;
  lastDiagnostic: AiReviewRunDiagnostic | null;
  handoffs: AiReviewHandoffSuggestion[];
  tasks: Task[];
  updateAiReview: <K extends keyof AiReviewSettings>(key: K, value: AiReviewSettings[K]) => void;
  updateAiReviewInput: <K extends keyof AiReviewSettings>(key: K, value: AiReviewSettings[K]) => void;
  saveAiReviewSettings: (next: AiReviewSettings) => void;
  saveAiReviewSettingsInput: (next: AiReviewSettings) => void;
  runGeneration: (action: GenerationAction) => void;
  pendingDailyRegeneration: { date: string; tasks: Task[] } | null;
  confirmDailyRegeneration: () => void;
  cancelDailyRegeneration: () => void;
  applyHandoff: (taskId: string, updateNextStep: boolean) => void;
  onCloseDiagnostic: () => void;
}

export function AiReviewSettingsSection({
  text,
  zh,
  aiReviewSettings,
  weeklySourceOptions,
  monthlySourceOptions,
  weekOptions,
  generatingAction,
  generationStatus,
  currentProgress,
  waitingForRealProgress,
  lastDiagnostic,
  handoffs,
  tasks,
  updateAiReview,
  updateAiReviewInput,
  saveAiReviewSettings,
  saveAiReviewSettingsInput,
  runGeneration,
  pendingDailyRegeneration,
  confirmDailyRegeneration,
  cancelDailyRegeneration,
  applyHandoff,
  onCloseDiagnostic,
}: AiReviewSettingsSectionProps) {
  return (
    <div className="settings-section-content">
      <section className="settings-zone settings-highlight-section">
        <h3>{text.settingsZones.aiSettings}</h3>
        <ToggleRow
          title={text.aiReview.enable}
          description={text.aiReview.enableHint}
          checked={aiReviewSettings.enabled}
          onChange={(value) => updateAiReview('enabled', value)}
        />
        <AiAccountZone
          text={text.aiReview}
          settings={aiReviewSettings}
          onChange={saveAiReviewSettings}
          onChangeInput={saveAiReviewSettingsInput}
        />

        <AiReviewReportRoutingSection
          zh={zh}
          aiReviewSettings={aiReviewSettings}
          updateAiReview={updateAiReview}
        />

        <AiReviewManualGenerationSection
          text={text}
          zh={zh}
          generatingAction={generatingAction}
          generationStatus={generationStatus}
          currentProgress={currentProgress}
          waitingForRealProgress={waitingForRealProgress}
          lastDiagnostic={lastDiagnostic}
          handoffs={handoffs}
          tasks={tasks}
          runGeneration={runGeneration}
          pendingDailyRegeneration={Boolean(pendingDailyRegeneration)}
          onConfirmDailyRegeneration={confirmDailyRegeneration}
          onCancelDailyRegeneration={cancelDailyRegeneration}
          applyHandoff={applyHandoff}
          onCloseDiagnostic={onCloseDiagnostic}
        />

        <AiReviewSourceSettingsSection
          text={text}
          zh={zh}
          aiReviewSettings={aiReviewSettings}
          weeklySourceOptions={weeklySourceOptions}
          monthlySourceOptions={monthlySourceOptions}
          updateAiReview={updateAiReview}
          updateAiReviewInput={updateAiReviewInput}
        />
      </section>

      <AiReviewTimerSettingsSection
        text={text}
        zh={zh}
        aiReviewSettings={aiReviewSettings}
        weekOptions={weekOptions}
        updateAiReview={updateAiReview}
        updateAiReviewInput={updateAiReviewInput}
      />
    </div>
  );
}
