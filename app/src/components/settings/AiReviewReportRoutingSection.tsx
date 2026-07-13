import type { AiReviewSettings } from '../../../shared/aiReview/aiReviewSettings';

type ReportProfileKey = 'dailyReviewProfileId' | 'weeklyReportProfileId' | 'monthlyReportProfileId';

interface AiReviewReportRoutingSectionProps {
  zh: boolean;
  aiReviewSettings: AiReviewSettings;
  updateAiReview: <K extends keyof AiReviewSettings>(key: K, value: AiReviewSettings[K]) => void;
}

export function AiReviewReportRoutingSection({
  zh,
  aiReviewSettings,
  updateAiReview,
}: AiReviewReportRoutingSectionProps) {
  const reportProfileRoutes: ReadonlyArray<readonly [ReportProfileKey, string]> = [
    ['dailyReviewProfileId', zh ? '日报复盘账号' : 'Daily review account'],
    ['weeklyReportProfileId', zh ? '个人周报账号' : 'Personal weekly account'],
    ['monthlyReportProfileId', zh ? '个人月报账号' : 'Personal monthly account'],
  ];

  return (
    <section className="settings-inline-section" aria-label="reportAccountRouting">
      <h3>{zh ? '报告账号路由' : 'Report account routing'}</h3>
      <div className="settings-preview-list">
        <p>{zh ? '日报、个人周报和个人月报可以分别指定 AI 账号，也可以跟随当前账号。' : 'Daily, personal weekly, and personal monthly reports can each use a specific AI account, or follow the current account.'}</p>
      </div>
      <div className="settings-grid settings-compact-grid">
        {reportProfileRoutes.map(([key, label]) => {
          const value = String(aiReviewSettings[key] || '');
          const missing = value && !aiReviewSettings.profiles.some((profile) => profile.id === value);
          return (
            <label className="settings-field" key={String(key)}>
              <span>
                <strong>{label}</strong>
                <small>{missing ? (zh ? '账号缺失，生成时会回退到默认账号' : 'Missing account; generation falls back to default') : (zh ? '留空则跟随当前账号' : 'Leave empty to follow the current account')}</small>
              </span>
              <select value={value} onChange={(event) => updateAiReview(key, event.target.value)}>
                <option value="">{zh ? '跟随当前账号' : 'Follow current account'} / followCurrentAccount</option>
                {aiReviewSettings.profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>{profile.name || profile.model}</option>
                ))}
                {missing && <option value={value}>{zh ? '缺失账号' : 'Missing account'}: {value}</option>}
              </select>
            </label>
          );
        })}
      </div>
    </section>
  );
}
