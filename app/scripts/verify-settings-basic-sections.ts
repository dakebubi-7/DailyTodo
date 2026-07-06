import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const settingsPanelPath = join(root, 'src/components/SettingsPanel.tsx');
const sectionsDir = join(root, 'src/components/settings');

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const settingsPanel = readFileSync(settingsPanelPath, 'utf8');

const sectionChecks = [
  {
    file: 'TemplatesSettingsSection.tsx',
    exportName: 'TemplatesSettingsSection',
    importPath: './settings/TemplatesSettingsSection',
    renderName: '<TemplatesSettingsSection',
    moduleMarker: 'TemplateEditKind',
    removedInlineMarker: "zh ? '日报模板' : 'Daily template'",
  },
  {
    file: 'ScheduleSettingsSection.tsx',
    exportName: 'ScheduleSettingsSection',
    importPath: './settings/ScheduleSettingsSection',
    renderName: '<ScheduleSettingsSection',
    moduleMarker: 'Clear completed on',
    removedInlineMarker: "zh ? '清理已完成' : 'Clear Completed'",
  },
  {
    file: 'GeneralSettingsSection.tsx',
    exportName: 'GeneralSettingsSection',
    importPath: './settings/GeneralSettingsSection',
    renderName: '<GeneralSettingsSection',
    moduleMarker: 'AutoStartToggle',
    removedInlineMarker: "zh ? '窗口行为' : 'Window Behavior'",
  },
] as const;

for (const check of sectionChecks) {
  const sectionPath = join(sectionsDir, check.file);
  assert.ok(existsSync(sectionPath), `${check.file} should exist.`);
  const source = readFileSync(sectionPath, 'utf8');
  assert.match(source, new RegExp(`export function ${check.exportName}\\b`), `${check.file} should export ${check.exportName}.`);
  assert.match(source, new RegExp(escapeRegExp(check.moduleMarker)), `${check.file} should contain ${check.moduleMarker}.`);
  assert.match(settingsPanel, new RegExp(`from '${escapeRegExp(check.importPath)}'`), `SettingsPanel should import ${check.exportName}.`);
  assert.match(settingsPanel, new RegExp(escapeRegExp(check.renderName)), `SettingsPanel should render ${check.exportName}.`);
  assert.doesNotMatch(settingsPanel, new RegExp(escapeRegExp(check.removedInlineMarker)), `SettingsPanel should not keep ${check.exportName} inline markup.`);
}

console.log('settings basic sections verification passed');
