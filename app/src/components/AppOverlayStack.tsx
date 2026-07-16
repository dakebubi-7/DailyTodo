import { lazy, memo, Suspense, type ComponentProps } from 'react';
import { type AppTemplateKind } from '../app/appTemplateEditor';
import type { AiOnboarding as AiOnboardingComponent } from './AiOnboarding';
import type { ObsidianCompanionPanel as ObsidianCompanionPanelComponent } from './ObsidianCompanionPanel';
import type { SettingsPanel as SettingsPanelComponent } from './SettingsPanel';
import type { TaskCompletionDialog as TaskCompletionDialogComponent } from './TaskCompletionDialog';
import type { TaskReviewDialog as TaskReviewDialogComponent } from './TaskReviewDialog';
import type { TemplateEditorModal as TemplateEditorModalComponent } from './TemplateEditorModal';

const SettingsPanel = lazy(() => import('./SettingsPanel').then((module) => ({ default: module.SettingsPanel })));
const AiOnboarding = lazy(() => import('./AiOnboarding').then((module) => ({ default: module.AiOnboarding })));
const TemplateEditorModal = lazy(() => import('./TemplateEditorModal').then((module) => ({ default: module.TemplateEditorModal })));
const ObsidianCompanionPanel = lazy(() => import('./ObsidianCompanionPanel').then((module) => ({ default: module.ObsidianCompanionPanel })));
const TaskCompletionDialog = lazy(() => import('./TaskCompletionDialog').then((module) => ({ default: module.TaskCompletionDialog })));
const TaskReviewDialog = lazy(() => import('./TaskReviewDialog').then((module) => ({ default: module.TaskReviewDialog })));

export interface AppOverlayStackProps {
  settingsPanelProps: ComponentProps<typeof SettingsPanelComponent>;
  aiOnboarding: ComponentProps<typeof AiOnboardingComponent>['initialSettings'] | null;
  aiOnboardingText: ComponentProps<typeof AiOnboardingComponent>['text'];
  onCompleteAiOnboarding: ComponentProps<typeof AiOnboardingComponent>['onComplete'];
  editingTemplateKind: AppTemplateKind | null;
  editingTemplateInitialTemplate: ComponentProps<typeof TemplateEditorModalComponent>['initialTemplate'] | null;
  onSaveTemplate: ComponentProps<typeof TemplateEditorModalComponent>['onSave'];
  onCancelTemplate: ComponentProps<typeof TemplateEditorModalComponent>['onCancel'];
  companionPanelProps: ComponentProps<typeof ObsidianCompanionPanelComponent>;
  completionDialogProps: ComponentProps<typeof TaskCompletionDialogComponent>;
  reviewDialogProps: ComponentProps<typeof TaskReviewDialogComponent>;
  isTaskDialogOpen: boolean;
}

export function getTaskDialogIsolation({
  completionTask,
  reviewTask,
}: {
  completionTask: ComponentProps<typeof TaskCompletionDialogComponent>['task'];
  reviewTask: ComponentProps<typeof TaskReviewDialogComponent>['task'];
}) {
  const isTaskDialogOpen = Boolean(completionTask || reviewTask);

  return {
    inert: isTaskDialogOpen,
    ariaHidden: isTaskDialogOpen,
  };
}

function hasOpenOverlay({
  settingsPanelProps,
  aiOnboarding,
  editingTemplateKind,
  editingTemplateInitialTemplate,
  companionPanelProps,
  completionDialogProps,
  reviewDialogProps,
  isTaskDialogOpen: _isTaskDialogOpen,
}: AppOverlayStackProps) {
  return Boolean(
    settingsPanelProps.isOpen ||
    aiOnboarding ||
    (editingTemplateKind && editingTemplateInitialTemplate) ||
    companionPanelProps.isOpen ||
    completionDialogProps.task ||
    reviewDialogProps.task,
  );
}

function shouldSkipClosedOverlayRender(previous: AppOverlayStackProps, next: AppOverlayStackProps) {
  return !hasOpenOverlay(previous) && !hasOpenOverlay(next);
}

export const AppOverlayStack = memo(function AppOverlayStack({
  settingsPanelProps,
  aiOnboarding,
  aiOnboardingText,
  onCompleteAiOnboarding,
  editingTemplateKind,
  editingTemplateInitialTemplate,
  onSaveTemplate,
  onCancelTemplate,
  companionPanelProps,
  completionDialogProps,
  reviewDialogProps,
}: AppOverlayStackProps) {
  return (
    <Suspense fallback={null}>
      {settingsPanelProps.isOpen && <SettingsPanel {...settingsPanelProps} />}
      {aiOnboarding && (
        <AiOnboarding
          isOpen
          text={aiOnboardingText}
          initialSettings={aiOnboarding}
          onComplete={onCompleteAiOnboarding}
        />
      )}
      {editingTemplateKind && editingTemplateInitialTemplate && (
        <TemplateEditorModal
          kind={editingTemplateKind}
          initialTemplate={editingTemplateInitialTemplate}
          onSave={onSaveTemplate}
          onCancel={onCancelTemplate}
        />
      )}
      {companionPanelProps.isOpen && <ObsidianCompanionPanel {...companionPanelProps} />}
      {completionDialogProps.task && <TaskCompletionDialog {...completionDialogProps} />}
      {reviewDialogProps.task && <TaskReviewDialog {...reviewDialogProps} />}
    </Suspense>
  );
}, shouldSkipClosedOverlayRender);
