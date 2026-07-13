import assert from 'node:assert/strict';
import {
  buildRendererQuery,
  buildDevRendererUrl,
  resolveRendererView,
  type RendererView,
} from '../shared/rendererRoute';
import { readFileSync } from 'node:fs';

const mainQuery = buildRendererQuery({ view: 'main' });
assert.deepEqual(mainQuery, { view: 'main' });

const reservedViewQuery = buildRendererQuery({
  view: 'main',
  params: {
    view: 'widget',
    mode: 'compact',
  },
});
assert.deepEqual(reservedViewQuery, {
  view: 'main',
  mode: 'compact',
});

const explicitMainQuery = buildRendererQuery({
  view: 'main',
  params: {
    restored: '1',
  },
});
assert.deepEqual(explicitMainQuery, {
  view: 'main',
  restored: '1',
});

const devMainUrl = buildDevRendererUrl('http://127.0.0.1:5173', { view: 'main' });
assert.equal(devMainUrl, 'http://127.0.0.1:5173/?view=main');

const devUrlWithExistingSearch = buildDevRendererUrl('http://127.0.0.1:5173/?dev=1', {
  view: 'main',
  params: {
    mode: 'compact',
  },
});
assert.equal(devUrlWithExistingSearch, 'http://127.0.0.1:5173/?dev=1&view=main&mode=compact');

assert.throws(
  () => buildRendererQuery({ view: 'invalid' as RendererView }),
  /Unsupported renderer view: invalid/
);

assert.equal(resolveRendererView(''), 'main');
assert.equal(resolveRendererView('?view=main'), 'main');
assert.equal(resolveRendererView('?view=widget'), 'main');
assert.equal(resolveRendererView('?view=unknown'), 'main');
assert.equal(resolveRendererView('http://localhost:5173/?view=widget'), 'main');
assert.equal(resolveRendererView('not a url'), 'main');
assert.equal(resolveRendererView('task-menu'), 'task-menu');
assert.equal(resolveRendererView('?view=task-menu'), 'task-menu');
assert.equal(resolveRendererView('http://localhost:5173/?view=task-menu'), 'task-menu');

const rendererEntry = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');
assert.match(
  rendererEntry,
  /const App = lazy\(\(\) => import\('\.\/App'\)\);/,
  'The main app should be loaded only for the main renderer view.',
);
assert.match(
  rendererEntry,
  /const TaskMenuPopup = lazy\(\(\) => import\('\.\/taskMenuView'\)\);/,
  'The task-menu popup should be loaded only for the task-menu renderer view.',
);
assert.match(
  rendererEntry,
  /<Suspense fallback=\{null\}>[\s\S]*?view === 'task-menu'/,
  'Route-specific lazy renderer content should keep a suspense boundary.',
);
assert.doesNotMatch(
  rendererEntry,
  /import '\.\/styles\/index\.css';/,
  'The renderer entry should not eagerly load the main application stylesheet for the task-menu route.',
);

console.log('renderer-route verification passed');
