import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const globals = readFileSync(join(root, 'src/styles/globals.css'), 'utf8').replace(/\r\n/g, '\n');
const settingsPanel = readFileSync(join(root, 'src/components/SettingsPanel.tsx'), 'utf8');

function includes(snippet: string, message: string) {
  assert.ok(globals.includes(snippet) || settingsPanel.includes(snippet), message);
}

includes(".app-shell:not([data-theme='watercolor'])", 'Non-watercolor themes need a scoped neutral override block.');
includes('--neutral-accent: #e5e7eb;', 'Non-watercolor dark themes should use neutral gray accents, not blue.');
includes(".app-shell:not([data-theme='watercolor']) :is(.titlebar-icon-button:hover", 'Neutral override should cover hover/active controls outside watercolor.');
includes(".app-shell:not([data-theme='watercolor']) :is(.task-complete-action-complete", 'Neutral override should cover completed buttons outside watercolor.');
includes(".app-shell:not([data-theme='watercolor']) :is(.task-complete-action-complete, .task-subtask-check-complete, .add-task-button", 'Neutral override should cover add/primary buttons outside watercolor.');
includes(".app-shell:not([data-theme='watercolor']) :is(.settings-field input:focus", 'Neutral override should cover settings/input focus outside watercolor.');
includes('settings-action-row-wide', 'AI manual generation action row should use the shared wide layout.');
includes("grid-template-columns: repeat(auto-fit, minmax(9.8rem, 1fr));", 'AI generation buttons should have uniform responsive card widths.');
includes(".ai-account-inline-actions", 'AI account controls should be explicitly equalized.');
includes("grid-template-columns: minmax(0, 1fr) minmax(7rem, auto);", 'AI account select/manage controls should use stable columns.');
includes(".settings-zone > .settings-inline-section", 'Nested AI settings sections should use uniform sizing.');
includes("min-height: 3.25rem;", 'AI settings fields should have a uniform minimum height.');

console.log('verify-settings-glass-polish passed');
