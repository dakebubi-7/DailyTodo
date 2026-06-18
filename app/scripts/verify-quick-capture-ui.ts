import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const component = readFileSync(join(process.cwd(), 'src/components/AddTaskInput.tsx'), 'utf8');
const styles = readFileSync(join(process.cwd(), 'src/styles/globals.css'), 'utf8');

assert.match(component, /parseQuickCapture/);
assert.match(component, /quick-capture-preview/);
assert.match(component, /quick-capture-error/);
assert.match(component, /parsed\.title/);
assert.match(component, /parsed\.priority/);
assert.match(component, /parsed\.sourceLabel/);
assert.match(styles, /\.quick-capture-preview/);
assert.match(styles, /\.quick-capture-error/);

console.log('verify-quick-capture-ui passed');
