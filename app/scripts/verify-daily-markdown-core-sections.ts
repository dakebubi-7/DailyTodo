import { strict as assert } from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const cwd = process.cwd();
const root = existsSync(join(cwd, 'app')) ? join(cwd, 'app') : cwd;
const rulesPath = join(root, 'shared/dailyMarkdownCoreSections.ts');
const templatePath = join(root, 'shared/dailyMarkdownTemplate.ts');

assert.ok(existsSync(rulesPath), 'dailyMarkdownCoreSections.ts should exist');

const rulesSource = readFileSync(rulesPath, 'utf8');
const templateSource = readFileSync(templatePath, 'utf8');
assert.match(rulesSource, /export function missingDailyCoreTokens\b/, 'core section module should own missing-token detection');
assert.match(rulesSource, /export function appendMissingDailyCoreSections\b/, 'core section module should own fallback-section assembly');
assert.match(templateSource, /export \{ missingDailyCoreTokens \} from '\.\/dailyMarkdownCoreSections'/, 'template module should retain the missing-token compatibility export');

const rules = await import(pathToFileURL(rulesPath).href);
const template = await import(pathToFileURL(templatePath).href);
const values = { work: '工作内容', inspiration: '灵感内容', tasks: '- [ ] 任务' };

assert.deepEqual(rules.missingDailyCoreTokens('{{work}}\n{{tasks}}'), ['inspiration']);
assert.equal(
  rules.appendMissingDailyCoreSections('# 自定义', ['work', 'tasks'], values),
  '# 自定义\n\n## 今日工作\n工作内容\n\n## 每日任务\n- [ ] 任务',
);
assert.deepEqual(template.missingDailyCoreTokens('{{work}}\n{{tasks}}'), ['inspiration']);

console.log('Daily Markdown core sections verification passed.');
