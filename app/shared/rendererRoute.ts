export type RendererView = 'main' | 'widget';

export type RendererRoute = {
  view: RendererView;
  params?: Record<string, string>;
};

function isRendererView(value: string): value is RendererView {
  return value === 'main' || value === 'widget';
}

export function buildRendererQuery(route: RendererRoute): Record<string, string> {
  if (!isRendererView(route.view)) {
    throw new Error(`Unsupported renderer view: ${String(route.view)}`);
  }

  const { view: _reservedView, ...params } = route.params || {};

  return {
    view: route.view,
    ...params,
  };
}

export function buildDevRendererUrl(baseUrl: string, route: RendererRoute): string {
  const url = new URL(baseUrl);
  const query = buildRendererQuery(route);

  Object.entries(query).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return url.toString();
}

export function resolveRendererView(value: string): RendererView {
  try {
    const params = value.startsWith('?')
      ? new URLSearchParams(value)
      : new URL(value).searchParams;
    const view = params.get('view') || 'main';
    return isRendererView(view) ? view : 'main';
  } catch {
    return 'main';
  }
}
