function readStringSetting(value: Record<string, unknown>, key: string): string | undefined {
  const stored = value[key];
  return typeof stored === 'string' ? stored : undefined;
}

function migrateReportDir(
  old: unknown,
  kind: 'weekly' | 'monthly',
  audience: 'personal' | 'external',
): string {
  const template = kind === 'weekly' ? '{{year}}-W{{week}}.md' : '{{year}}-{{month}}.md';
  const fallback = `logs/${kind}/${audience}/${template}`;
  if (typeof old !== 'string' || !old) return fallback;
  return old.endsWith('.md') ? old : `${old.replace(/\/$/, '')}/${template}`;
}

export function resolveStoredPath(
  value: Record<string, unknown>,
  currentKey: string,
  fallback: string,
  legacyKey?: string,
): string {
  return readStringSetting(value, currentKey) ?? (legacyKey ? readStringSetting(value, legacyKey) : undefined) ?? fallback;
}

export function resolveStoredReportPath(
  value: Record<string, unknown>,
  currentKey: string,
  legacyDirKey: string,
  kind: 'weekly' | 'monthly',
  audience: 'personal' | 'external',
): string {
  return readStringSetting(value, currentKey) ?? migrateReportDir(value[legacyDirKey], kind, audience);
}
