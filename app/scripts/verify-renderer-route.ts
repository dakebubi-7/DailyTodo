import assert from 'node:assert/strict';
import {
  buildRendererQuery,
  buildDevRendererUrl,
  resolveRendererView,
  type RendererView,
} from '../shared/rendererRoute';

const mainQuery = buildRendererQuery({ view: 'main' });
assert.deepEqual(mainQuery, { view: 'main' });

const widgetQuery = buildRendererQuery({
  view: 'widget',
  params: {
    mode: 'compact',
    source: 'tray',
  },
});
assert.deepEqual(widgetQuery, {
  view: 'widget',
  mode: 'compact',
  source: 'tray',
});

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

const devWidgetUrl = buildDevRendererUrl('http://127.0.0.1:5173', {
  view: 'widget',
  params: {
    mode: 'compact',
  },
});
assert.equal(devWidgetUrl, 'http://127.0.0.1:5173/?view=widget&mode=compact');

const devWidgetUrlWithReservedView = buildDevRendererUrl('http://127.0.0.1:5173', {
  view: 'widget',
  params: {
    view: 'main',
    mode: 'compact',
  },
});
assert.equal(devWidgetUrlWithReservedView, 'http://127.0.0.1:5173/?view=widget&mode=compact');

const devUrlWithExistingSearch = buildDevRendererUrl('http://127.0.0.1:5173/?dev=1', {
  view: 'widget',
  params: {
    mode: 'compact',
  },
});
assert.equal(devUrlWithExistingSearch, 'http://127.0.0.1:5173/?dev=1&view=widget&mode=compact');

assert.throws(
  () => buildRendererQuery({ view: 'invalid' as RendererView }),
  /Unsupported renderer view: invalid/
);

assert.equal(resolveRendererView(''), 'main');
assert.equal(resolveRendererView('?view=main'), 'main');
assert.equal(resolveRendererView('?view=widget'), 'widget');
assert.equal(resolveRendererView('?view=unknown'), 'main');
assert.equal(resolveRendererView('http://localhost:5173/?view=widget'), 'widget');
assert.equal(resolveRendererView('not a url'), 'main');

console.log('renderer-route verification passed');
