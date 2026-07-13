import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const metricsPath = join(root, 'src/hooks/floatingScrollbarMetrics.ts');
const hookPath = join(root, 'src/hooks/useFloatingScrollbar.ts');

assert.ok(existsSync(metricsPath), 'Floating scrollbar metrics should have a dedicated pure helper module.');

const metrics = await import('../src/hooks/floatingScrollbarMetrics');
const hookSource = readFileSync(hookPath, 'utf8');

assert.deepEqual(
  metrics.getFloatingScrollbarMetrics({ scrollHeight: 1000, clientHeight: 400, scrollTop: 120 }, 60, 4),
  { scrollable: 600, trackHeight: 332, thumbHeight: 132.8, scrollTop: 120 },
  'Metrics should preserve the existing header padding and proportional thumb calculation.',
);
assert.equal(
  metrics.getFloatingScrollbarScrollTop({ scrollable: 600, trackHeight: 332, thumbHeight: 132.8 }, 120, 50, 100),
  270.60240963855426,
  'Dragging should map pointer deltas to scroll distance through usable track height.',
);
assert.equal(
  metrics.getFloatingScrollbarScrollTop({ scrollable: 600, trackHeight: 100, thumbHeight: 100 }, 120, 100, 50),
  undefined,
  'Dragging should retain the existing no-op when no usable thumb track exists.',
);
assert.match(
  hookSource,
  /import \{ getFloatingScrollbarMetrics, getFloatingScrollbarScrollTop \} from '\.\/floatingScrollbarMetrics';/,
  'The DOM hook should delegate pure measurements and drag mapping to the focused helper.',
);
assert.doesNotMatch(
  hookSource,
  /const metrics = \(\) => \{[\s\S]*?const thumbHeight = Math\.max\(28,/,
  'The DOM hook should not retain inline scrollbar metric calculations.',
);

console.log('Floating scrollbar metrics verification passed');
