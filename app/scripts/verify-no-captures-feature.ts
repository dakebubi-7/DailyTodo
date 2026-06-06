import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '..');
const filesToCheck = [
  'electron/main.ts',
  'shared/appSettings.ts',
  'src/components/SettingsPanel.tsx',
].map((filePath) => path.join(projectRoot, filePath));

const forbiddenPatterns = [
  /knowledgeCardTemplate/,
  /syncKnowledgeCards/,
  /buildKnowledgeCard/,
  /getKnowledgeFolderPath/,
  /reviewCardFiles/,
  /verify:review-card-cleanup/,
];

for (const filePath of filesToCheck) {
  const content = fs.readFileSync(filePath, 'utf-8');
  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(content, pattern, `${path.relative(projectRoot, filePath)} still contains ${pattern}`);
  }
}

console.log('automatic knowledge card feature removed');
