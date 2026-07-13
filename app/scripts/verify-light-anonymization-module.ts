import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const cwd = process.cwd();
const root = existsSync(join(cwd, 'app')) ? join(cwd, 'app') : cwd;
const modulePath = join(root, 'shared/lightAnonymization.ts');
const facadePath = join(root, 'shared/templateBlockDefaults.ts');

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(existsSync(modulePath), 'lightAnonymization.ts missing');
const moduleSource = readFileSync(modulePath, 'utf8');
const facadeSource = readFileSync(facadePath, 'utf8');

assert(moduleSource.includes('export function lightAnonymize'), 'lightAnonymization.ts should own lightAnonymize');
assert(facadeSource.includes("export { lightAnonymize } from './lightAnonymization'"), 'templateBlockDefaults.ts should retain the lightAnonymize compatibility export');

const anonymization = await import(pathToFileURL(modulePath).href);
const facade = await import(pathToFileURL(facadePath).href);
const sample = '联系张三 13800138000, 邮箱 zhang@example.com, 项目代号 Apollo-X';
const expected = anonymization.lightAnonymize(sample);

assert(expected.includes('[人员]'), 'name should be anonymized');
assert(expected.includes('[联系方式]'), 'phone and email should be anonymized');
assert(expected.includes('[项目A]'), 'project code should be anonymized');
assert(facade.lightAnonymize(sample) === expected, 'compatibility export should preserve anonymization behavior');
assert(anonymization.lightAnonymize(expected) === expected, 'anonymization should remain idempotent');

console.log('Light anonymization module verification passed.');
