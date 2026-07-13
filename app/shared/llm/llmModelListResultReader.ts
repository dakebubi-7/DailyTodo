import { isObjectRecord } from './llmProviderResponseParsing';

export type ListModelsResult = { ok: true; models: string[] } | { ok: false; error: string };

export function readListModelsResult(value: unknown): ListModelsResult | undefined {
  if (!isObjectRecord(value)) return undefined;
  if (value.ok === true) {
    if (!Array.isArray(value.models) || !value.models.every((entry) => typeof entry === 'string')) {
      return undefined;
    }
    return { ok: true, models: value.models };
  }
  if (value.ok === false) {
    if (typeof value.error !== 'string') return undefined;
    return { ok: false, error: value.error };
  }
  return undefined;
}
