import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const component = fs.readFileSync(path.join(root, 'src/components/ObsidianTemplateCenter.tsx'), 'utf-8');
const section = fs.readFileSync(
  path.join(root, 'src/components/obsidianTemplateCenter/ObsidianTemplateModulesSection.tsx'),
  'utf-8',
);

assert.ok(section.includes('export function ObsidianTemplateModulesSection'), 'template modules have a focused section export');
assert.ok(component.includes("from './obsidianTemplateCenter/ObsidianTemplateModulesSection'"), 'template center imports the modules section');
assert.ok(component.includes('<ObsidianTemplateModulesSection'), 'template center composes the modules section');
assert.ok(section.includes('modulesFromDailyTemplate'), 'modules section derives modules from the daily template');
assert.ok(section.includes('OBSIDIAN_TEMPLATE_MODULE_IDS'), 'modules section iterates the canonical module ids');
assert.ok(section.includes('updateTemplateModule'), 'modules section owns module updates');
assert.ok(section.includes("moduleId === 'work' || moduleId === 'inspiration' || moduleId === 'tasks'"), 'modules section preserves fixed core modules');
assert.ok(section.includes('template-module-list'), 'modules section preserves the module list class');
assert.ok(section.includes('template-module-row'), 'modules section preserves the module row class');
assert.equal(component.includes('template-module-list'), false, 'template center no longer owns the module list JSX');

console.log('Obsidian template modules section verification passed');
