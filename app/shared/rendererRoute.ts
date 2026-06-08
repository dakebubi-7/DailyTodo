export type RendererView = 'main';

export type RendererRoute = {
  view: RendererView;
  params?: Record<string, string>;
};

function isRendererView(value: string): value is RendererView {
  return value === 'main';
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
  // 仅剩主视图；保留函数签名供 main 进程的 loadRenderer 复用。
  void value;
  return 'main';
}
