import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const main = fs.readFileSync(path.join(root, 'electron/main.ts'), 'utf-8');
const preload = fs.readFileSync(path.join(root, 'electron/preload.ts'), 'utf-8');
const viteEnv = fs.readFileSync(path.join(root, 'src/vite-env.d.ts'), 'utf-8');

assert.ok(main.includes("ipcMain.handle('obsidianTemplate:recognize'"), 'main exposes obsidianTemplate:recognize');
assert.ok(main.includes("ipcMain.handle('obsidianTemplate:pickTemplateFile'"), 'main exposes obsidianTemplate:pickTemplateFile');
assert.ok(preload.includes('obsidianTemplate: {'), 'preload exposes obsidianTemplate namespace');
assert.ok(preload.includes("ipcRenderer.invoke('obsidianTemplate:recognize'"), 'preload wires recognize');
assert.ok(viteEnv.includes('obsidianTemplate: {'), 'vite-env types obsidianTemplate namespace');
assert.ok(viteEnv.includes('RecognizedObsidianTemplateDraft'), 'vite-env references recognition draft type');

const component = fs.readFileSync(path.join(root, 'src/components/ObsidianTemplateCenter.tsx'), 'utf-8');
const settingsPanel = fs.readFileSync(path.join(root, 'src/components/SettingsPanel.tsx'), 'utf-8');

assert.ok(component.includes('AI 识别模板'), 'component renders AI import section');
assert.ok(component.includes('applyObsidianTemplatePreset'), 'component applies presets');
assert.ok(component.includes('updateTemplateModule'), 'component updates modules');
assert.ok(component.includes('recognizedDraft'), 'component previews recognized draft');
assert.ok(component.includes('dailyMarkdownTemplate'), 'component exposes dailyMarkdownTemplate editor');
assert.ok(component.includes('templateSources.dailyNotePath') || component.includes('text.dailyNotePath'), 'component reads i18n dailyNotePath');
assert.ok(component.includes('templateSources.dailyMarkdownTemplate') || component.includes('text.dailyMarkdownTemplate'), 'component reads i18n dailyMarkdownTemplate');
assert.equal(component.includes('Legacy task export path'), false, 'no English legacy label');
assert.equal(component.includes('Work section title'), false, 'no English work title');
assert.equal(component.includes('Inspiration section title'), false, 'no English inspiration title');
assert.equal(component.includes('Reusable knowledge section title'), false, 'no English knowledge title');
assert.ok(settingsPanel.includes('ObsidianTemplateCenter'), 'SettingsPanel uses ObsidianTemplateCenter');

const css = fs.readFileSync(path.join(root, 'src/styles/globals.css'), 'utf-8');
assert.ok(css.includes('.obsidian-template-center'), 'template center css exists');
assert.ok(css.includes('.template-preset-grid'), 'preset grid css exists');
assert.ok(css.includes('.template-module-row'), 'module row css exists');

console.log('Obsidian template UI wiring verification passed');
