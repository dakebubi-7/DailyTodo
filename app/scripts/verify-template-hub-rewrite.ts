import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const cwd = process.cwd();
const root = existsSync(join(cwd, 'app')) ? join(cwd, 'app') : cwd;
const sectionConfig = readFileSync(join(root, 'shared/aiReview/sectionConfig.ts'), 'utf8');

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

// T1: CustomBlock data structures exist
assert(sectionConfig.includes("export type RenderType"), 'RenderType type not defined');
assert(/export type RenderType\s*=\s*['"]text['"]\s*\|\s*['"]list['"]\s*\|\s*['"]table['"]\s*\|\s*['"]callout['"]\s*\|\s*['"]dataview['"]/.test(sectionConfig), 'RenderType union incomplete');
assert(sectionConfig.includes('export interface CustomBlock'), 'CustomBlock interface not defined');
assert(/id:\s*string/.test(sectionConfig), 'CustomBlock.id missing');
assert(/name:\s*string/.test(sectionConfig), 'CustomBlock.name missing');
assert(/aiGenerate:\s*boolean/.test(sectionConfig), 'CustomBlock.aiGenerate missing');
assert(/renderType:\s*RenderType/.test(sectionConfig), 'CustomBlock.renderType missing');
assert(/prompt:\s*string/.test(sectionConfig), 'CustomBlock.prompt missing');
assert(sectionConfig.includes('export interface FixedBlock'), 'FixedBlock interface not defined');
assert(sectionConfig.includes("id: 'work' | 'inspire' | 'tasks'"), 'FixedBlock.id union incorrect');
assert(sectionConfig.includes('export interface DailyTemplate'), 'DailyTemplate interface not defined');
assert(sectionConfig.includes('export interface ReportTemplate'), 'ReportTemplate interface not defined');

console.log('T1: CustomBlock data structures ✓');

// T2: Path template variable expansion
const pathTemplate = readFileSync(join(root, 'shared/pathTemplate.ts'), 'utf8');
assert(pathTemplate.includes('export function expandPathTemplate'), 'expandPathTemplate function not exported');
assert(/expandPathTemplate\([^)]*Date[^)]*\)/.test(pathTemplate), 'expandPathTemplate signature incorrect');

// Dynamic test
const pt = await import(pathToFileURL(join(root, 'shared/pathTemplate.ts')).href);
const d = new Date(2026, 5, 15, 10, 0, 0); // June 15, 2026 local time
const out = pt.expandPathTemplate('logs/daily/{{date}}.md', d);
assert(out === 'logs/daily/2026-06-15.md', `date variable expansion wrong, got: ${out}`);
const out2 = pt.expandPathTemplate('logs/weekly/{{year}}-W{{week}}.md', d);
assert(/^logs\/weekly\/2026-W\d{2}\.md$/.test(out2), `year/week variable expansion wrong, got: ${out2}`);
const out3 = pt.expandPathTemplate('logs/monthly/{{year}}-{{month}}.md', d);
assert(out3 === 'logs/monthly/2026-06.md', `year/month variable expansion wrong, got: ${out3}`);
// Unknown variable left as-is
const out4 = pt.expandPathTemplate('logs/{{unknown}}/{{date}}.md', d);
assert(out4 === 'logs/{{unknown}}/2026-06-15.md', `unknown variable should be preserved, got: ${out4}`);

console.log('T2: Path template variable expansion ✓');
