import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..');
const roots = ['src', 'electron', 'shared'].map((directory) => join(root, directory));
const extensions = new Set(['.ts', '.tsx', '.css']);
const signatures = ['\uFFFD', 'Ã', 'Â', 'â'];
const decoder = new TextDecoder('utf-8', { fatal: true });
const findings: Array<{ file: string; issue: string; line: number }> = [];

function visit(directory: string) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      visit(path);
      continue;
    }
    if (!extensions.has(path.slice(path.lastIndexOf('.')))) continue;

    let text: string;
    try {
      text = decoder.decode(readFileSync(path));
    } catch {
      findings.push({ file: relative(root, path), issue: 'invalid-utf8', line: 1 });
      continue;
    }
    for (const signature of signatures) {
      let offset = text.indexOf(signature);
      while (offset !== -1) {
        findings.push({ file: relative(root, path), issue: 'mojibake-signature', line: text.slice(0, offset).split('\n').length });
        offset = text.indexOf(signature, offset + signature.length);
      }
    }
  }
}

roots.forEach(visit);
if (findings.length) {
  console.log(JSON.stringify(findings, null, 2));
  process.exitCode = 1;
} else {
  console.log('UTF-8 text audit passed');
}
