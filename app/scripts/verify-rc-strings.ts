import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '..');

const filesToCheck = [
  'electron/main.ts',
  'shared/appSettings.ts',
  'shared/obsidianTemplates.ts',
  'src/i18n.ts',
  'src/components/Header.tsx',
  'src/components/SettingsPanel.tsx',
  '../docs/DailyTodo-Developer-Code-Guide.md',
  '../docs/DailyTodo-Developer-Manual-and-Cases.zh-en.md',
  '../docs/DailyTodo-Template-Adjustment-Manual-and-Cases.zh-en.md',
].map((filePath) => path.resolve(projectRoot, filePath));

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

console.log('RC string verification passed');
