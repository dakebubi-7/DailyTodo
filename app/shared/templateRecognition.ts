export type TemplateRecognitionTarget = 'daily' | 'personalWeekly' | 'personalMonthly' | 'externalWeekly' | 'externalMonthly';
export type TemplateRecognitionConfidence = 'high' | 'medium' | 'low';

export interface UnifiedTemplateRecognitionResult {
  target: TemplateRecognitionTarget;
  templateDraft: string;
  missingCoreFields: string[];
  unmappedSections: Array<{ title: string; reason: string; excerpt?: string }>;
  notes: string[];
  confidence: TemplateRecognitionConfidence;
}

export function isReportRecognitionTarget(
  target: TemplateRecognitionTarget,
): target is Exclude<TemplateRecognitionTarget, 'daily'> {
  return target !== 'daily';
}
