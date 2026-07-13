import { isObjectRecord } from '../unknownValueGuards';

export function textFromValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!Array.isArray(value)) return '';
  const textParts: string[] = [];
  for (const part of value) {
    if (typeof part === 'string') textParts.push(part);
    else if (isObjectRecord(part) && typeof part.text === 'string') textParts.push(part.text);
    else if (isObjectRecord(part) && typeof part.content === 'string') textParts.push(part.content);
  }
  return textParts.join('');
}

export function textFromTextParts(value: unknown): string | undefined {
  if (!Array.isArray(value)) return undefined;
  const textParts: string[] = [];
  for (const part of value) {
    if (isObjectRecord(part) && typeof part.text === 'string') textParts.push(part.text);
  }
  return textParts.join('');
}

export function firstText(...values: unknown[]): string | undefined {
  for (const value of values) {
    const text = textFromValue(value).trim();
    if (text) return text;
  }
  return undefined;
}

export function firstTextPreserveWhitespace(...values: unknown[]): string | undefined {
  for (const value of values) {
    const text = textFromValue(value);
    if (text) return text;
  }
  return undefined;
}
