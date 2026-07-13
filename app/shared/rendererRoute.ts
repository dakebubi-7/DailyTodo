export type RendererView = 'main' | 'task-menu';

export type RendererRoute = {
  view: RendererView;
  params?: Record<string, string>;
};

function isRendererView(value: string): value is RendererView {
  return value === 'main' || value === 'task-menu';
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

function extractViewCandidate(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  if (isRendererView(trimmed)) return trimmed;

  try {
    if (trimmed.includes('://')) {
      return new URL(trimmed).searchParams.get('view') || '';
    }
  } catch {
    // Fall through to query-string parsing.
  }

  if (trimmed.startsWith('?') || trimmed.includes('=')) {
    const query = trimmed.startsWith('?') ? trimmed.slice(1) : trimmed;
    return new URLSearchParams(query).get('view') || '';
  }

  return trimmed;
}

export function resolveRendererView(value: string): RendererView {
  const candidate = extractViewCandidate(value);
  return isRendererView(candidate) ? candidate : 'main';
}
