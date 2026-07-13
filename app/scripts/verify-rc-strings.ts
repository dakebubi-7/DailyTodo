import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '..');

const filesToCheck = [
  'electron/main.ts',
  'shared/appSettings.ts',
  'shared/obsidianTemplates.ts',
  'src/i18n.ts',
  'src/i18n/shellTextZh.ts',
  'src/i18n/shellTextZhSettings.ts',
  'src/i18n/shellTextEn.ts',
  'src/i18n/shellTextEnSettings.ts',
  'src/components/Header.tsx',
  'src/components/SettingsPanel.tsx',
  '../docs/DailyTodo-Developer-Code-Guide.md',
  '../docs/DailyTodo-Developer-Manual-and-Cases.zh-en.md',
  '../docs/DailyTodo-Template-Adjustment-Manual-and-Cases.zh-en.md',
].map((filePath) => path.resolve(projectRoot, filePath));

const visibleUiTextFiles = [
  'src/components/taskItem/taskItemControls.tsx',
  'src/components/settings/GeneralSettingsSection.tsx',
  'src/components/settings/AiReviewManualGenerationSection.tsx',
  'src/components/settings/AiReviewReportRoutingSection.tsx',
  'src/components/settings/AiReviewSourceSettingsSection.tsx',
  'src/components/settings/SyncSettingsSection.tsx',
  'src/components/settings/ScheduleSettingsSection.tsx',
  'src/components/settings/TemplatesSettingsSection.tsx',
].map((filePath) => path.resolve(projectRoot, filePath));

const visibleUiBadTextPatterns = [
  /\?{3,}/,
  /\?\? \{visibleScheduledDates\.join\(' \? '\)\}/,
  /鏃|姤|妯|澘|涓|瀵|瑰||鍛|鏈|堟|鐠|娑|擃|厽|鐎|缁|閸|閻|鎼|绐|缂|栬|緫|銆\?|鈫\?/,
];

const expectedVisibleUiText: Record<string, string[]> = {
  'src/components/taskItem/taskItemControls.tsx': ["{visibleScheduledDates.join(' / ')}"],
  'src/components/settings/GeneralSettingsSection.tsx': [
    '语言',
    '简体中文',
    '完成记录',
    '主任务完成时填写完成记录',
    '子任务完成时填写完成记录',
    '窗口行为',
    '关闭时最小化到托盘',
    '启动时窗口置顶',
  ],
  'src/components/settings/AiReviewManualGenerationSection.tsx': ['重新生成今日日报', '手动生成'],
  'src/components/settings/AiReviewReportRoutingSection.tsx': [
    '日报复盘账号',
    '个人周报账号',
    '个人月报账号',
    '报告账号路由',
    '跟随当前账号',
    '缺失账号',
  ],
  'src/components/settings/AiReviewSourceSettingsSection.tsx': [
    '周报/月报素材来源',
    '选择 AI 生成周报和月报时读取哪些素材。',
    '个人周报素材',
    '个人月报素材',
    '对外周报素材',
    '对外月报素材',
  ],
  'src/components/settings/SyncSettingsSection.tsx': [
    '日报路径',
    '个人周报路径',
    '个人月报路径',
    '对外周报路径',
    '对外月报路径',
    '预览今日同步',
    '将处理',
  ],
  'src/components/settings/ScheduleSettingsSection.tsx': [
    '清理已完成',
    '只把当前日期的已完成任务从应用列表中隐藏',
  ],
  'src/components/settings/TemplatesSettingsSection.tsx': [
    '日报模板',
    '个人周报模板',
    '个人月报模板',
    '对外周报模板',
    '对外月报模板',
    '编辑 ->',
  ],
};

const mojibakePatterns = [
  /�/,
  /鈫|鈥|鈮|锛|涓|鐨|浠|绐|閫|鍏|寮|妯|搴|闂|棰|瀹|杩|鎵|骞|浣|闅|澶|姣|鐐|璁|鏂/,
];

for (const filePath of filesToCheck) {
  if (!fs.existsSync(filePath)) continue;
  const content = fs.readFileSync(filePath, 'utf-8');
  for (const pattern of mojibakePatterns) {
    assert.doesNotMatch(content, pattern, `${path.relative(projectRoot, filePath)} contains likely mojibake: ${pattern}`);
  }
}

for (const filePath of visibleUiTextFiles) {
  assert.ok(fs.existsSync(filePath), `${path.relative(projectRoot, filePath)} should exist for visible UI text verification`);
  const content = fs.readFileSync(filePath, 'utf-8');
  for (const pattern of visibleUiBadTextPatterns) {
    assert.doesNotMatch(content, pattern, `${path.relative(projectRoot, filePath)} contains likely visible bad text: ${pattern}`);
  }

  const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, '/');
  for (const snippet of expectedVisibleUiText[relativePath] ?? []) {
    assert.ok(content.includes(snippet), `${relativePath} should contain ${snippet}`);
  }
}

console.log('RC string verification passed');
