import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const main = fs.readFileSync(path.join(root, 'electron/main.ts'), 'utf-8');
const bootstrap = fs.readFileSync(path.join(root, 'electron/mainWindowBootstrap.ts'), 'utf-8');
const ipcRegistration = fs.readFileSync(path.join(root, 'electron/mainWindowIpcRegistration.ts'), 'utf-8');
const obsidianIpc = fs.readFileSync(path.join(root, 'electron/obsidianIpc.ts'), 'utf-8');
const preload = fs.readFileSync(path.join(root, 'electron/preload.ts'), 'utf-8');
const viteEnv = fs.readFileSync(path.join(root, 'src/vite-env.d.ts'), 'utf-8');
const component = fs.readFileSync(path.join(root, 'src/components/ObsidianTemplateCenter.tsx'), 'utf-8');
const modulesSection = fs.readFileSync(
  path.join(root, 'src/components/obsidianTemplateCenter/ObsidianTemplateModulesSection.tsx'),
  'utf-8',
);
const importSection = fs.readFileSync(
  path.join(root, 'src/components/obsidianTemplateCenter/ObsidianTemplateImportSection.tsx'),
  'utf-8',
);
const stateHook = fs.readFileSync(path.join(root, 'src/components/useObsidianTemplateCenterState.ts'), 'utf-8');
const settingsPanel = fs.readFileSync(path.join(root, 'src/components/SettingsPanel.tsx'), 'utf-8');
const templatesSection = fs.readFileSync(path.join(root, 'src/components/settings/TemplatesSettingsSection.tsx'), 'utf-8');
const css = fs.readFileSync(path.join(root, 'src/styles/globals.css'), 'utf-8');

assert.ok(main.includes("from './mainWindowComposition'"), 'main delegates main-window bootstrap callback assembly through composition');
assert.ok(bootstrap.includes("from './mainWindowIpcRegistration'"), 'main-window bootstrap delegates Obsidian IPC composition');
assert.ok(ipcRegistration.includes('registerObsidianIpcHandlers({'), 'main-window IPC composition delegates Obsidian template IPC registration');
assert.ok(obsidianIpc.includes("ipcMain.handle('obsidianTemplate:recognize'"), 'Obsidian IPC module exposes recognition');
assert.ok(obsidianIpc.includes("ipcMain.handle('obsidianTemplate:pickTemplateFile'"), 'Obsidian IPC module exposes template picking');
assert.ok(preload.includes('obsidianTemplate: {'), 'preload exposes obsidianTemplate namespace');
assert.ok(preload.includes("ipcRenderer.invoke('obsidianTemplate:recognize'"), 'preload wires recognition');
assert.ok(viteEnv.includes('recognize: (rawTemplate: unknown) => Promise<unknown>'), 'vite-env exposes unknown recognition returns');
assert.ok(viteEnv.includes('pickTemplateFile: () => Promise<unknown>'), 'vite-env exposes unknown picker returns');

assert.ok(component.includes('ObsidianTemplateImportSection'), 'component delegates AI import presentation');
assert.ok(importSection.includes('AI Template Import'), 'AI import section renders its title');
assert.ok(importSection.includes('recognizedDraft'), 'AI import section previews recognized drafts');
assert.ok(importSection.includes('applyDraft'), 'AI import section applies recognized drafts');
assert.ok(component.includes('useObsidianTemplateCenterState'), 'component composes the template-center state hook');
assert.ok(stateHook.includes('readObsidianTemplateRecognitionResult'), 'state hook parses recognition IPC results before use');
assert.ok(stateHook.includes('readTemplatePickerResult'), 'state hook parses picker IPC results before use');
assert.ok(component.includes('applyObsidianTemplatePreset'), 'component applies presets');
assert.ok(modulesSection.includes('updateTemplateModule'), 'modules section updates modules');
assert.ok(importSection.includes('recognizedDraft'), 'AI import section previews recognized drafts');
assert.ok(component.includes('templates.dailyTemplate'), 'component exposes structured dailyTemplate editor');
assert.ok(component.includes('templates.dailyPath'), 'component exposes daily path editor');
assert.ok(component.includes('text.dailyNotePath'), 'component reads i18n dailyNotePath');
assert.ok(component.includes('text.dailyTemplateTitle'), 'component reads i18n dailyTemplateTitle');
assert.equal(component.includes('Legacy task export path'), false, 'no English legacy label');
assert.equal(component.includes('Work section title'), false, 'no English work title');
assert.equal(component.includes('Inspiration section title'), false, 'no English inspiration title');
assert.equal(component.includes('Reusable knowledge section title'), false, 'no English knowledge title');
assert.ok(
  settingsPanel.includes('<TemplatesSettingsSection zh={zh} text={text} onEditTemplate={onEditTemplate} />') &&
    templatesSection.includes('onEditTemplate?.(kind)'),
  'SettingsPanel delegates template-edit actions to TemplatesSettingsSection',
);
assert.ok(css.includes('.obsidian-template-center'), 'template center CSS exists');
assert.ok(css.includes('.template-preset-grid'), 'preset grid CSS exists');
assert.ok(css.includes('.template-module-row'), 'module row CSS exists');

console.log('Obsidian template UI wiring verification passed');
