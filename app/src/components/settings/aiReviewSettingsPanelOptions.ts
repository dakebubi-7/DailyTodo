import type { getShellText } from '../../i18n';
import type { MonthlySourceMode, WeeklySourceMode } from '../../../shared/aiReview/aiReviewSettings';

type SettingsText = ReturnType<typeof getShellText>['settings'];

export type WeekOption = { label: string; value: number };
export type SourceOption<T extends string> = { value: T; label: string; hint: string };

export function createAiReviewPanelOptions(text: SettingsText, zh: boolean): {
  weeklySourceOptions: Array<SourceOption<WeeklySourceMode>>;
  monthlySourceOptions: Array<SourceOption<MonthlySourceMode>>;
  weekOptions: WeekOption[];
} {
  const weekOptions = text.aiReview.weekdays.map((label, index) => ({ label, value: index }));
  const weeklySourceOptions: Array<SourceOption<WeeklySourceMode>> = [
    {
      value: 'daily-notes',
      label: zh ? '\u805a\u5408\u65e5\u62a5' : 'Daily notes',
      hint: zh
        ? '\u5468\u62a5\u76f4\u63a5\u8bfb\u53d6\u672c\u5468\u6bcf\u65e5\u8bb0\u5f55\uff0c\u7ec6\u8282\u6700\u5b8c\u6574\u3002'
        : 'Read every daily note in the week for the most detail.',
    },
  ];
  const monthlySourceOptions: Array<SourceOption<MonthlySourceMode>> = [
    {
      value: 'weekly-then-daily',
      label: zh ? '\u4f18\u5148\u5468\u62a5\uff0c\u6ca1\u6709\u5219\u65e5\u62a5' : 'Weekly first, daily fallback',
      hint: zh
        ? '\u4f18\u5148\u4f7f\u7528\u672c\u6708\u5468\u62a5\uff0c\u7f3a\u5c11\u5468\u62a5\u65f6\u81ea\u52a8\u56de\u9000\u5230\u65e5\u62a5\u3002'
        : 'Use weekly reports first and fall back to daily notes when needed.',
    },
    {
      value: 'weekly-reports',
      label: zh ? '\u53ea\u4f7f\u7528\u5468\u62a5' : 'Weekly reports only',
      hint: zh
        ? '\u6708\u62a5\u53ea\u6c47\u603b\u5df2\u7ecf\u751f\u6210\u7684\u5468\u62a5\uff0c\u9002\u5408\u5148\u5468\u62a5\u540e\u6708\u62a5\u3002'
        : 'Build monthly reports only from existing weekly reports.',
    },
    {
      value: 'daily-notes',
      label: zh ? '\u76f4\u63a5\u805a\u5408\u65e5\u62a5' : 'Daily notes directly',
      hint: zh
        ? '\u6708\u62a5\u76f4\u63a5\u8bfb\u53d6\u6574\u6708\u65e5\u62a5\uff0c\u7ec6\u8282\u6700\u591a\u4f46\u7d20\u6750\u66f4\u957f\u3002'
        : 'Read every daily note in the month for the most source detail.',
    },
  ];

  return { weeklySourceOptions, monthlySourceOptions, weekOptions };
}
