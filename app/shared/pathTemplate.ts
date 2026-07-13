// app/shared/pathTemplate.ts

/**
 * Replace template variables in a path string with actual values from a Date.
 *
 * Supported variables:
 *   {{date}}   → YYYY-MM-DD (e.g. "2026-06-15")
 *   {{year}}   → YYYY (e.g. "2026")
 *   {{month}}  → MM zero-padded (e.g. "06")
 *   {{week}}   → ISO 8601 week number, zero-padded to 2 digits (e.g. "24")
 *
 * Unknown variables are left untouched (so users can see typos).
 */
export function dateKeyToLocalDate(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return new Date(date);
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

export function expandPathTemplate(template: string, date: Date): string {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const isoWeek = isoWeekNumber(date);
  return template
    .replace(/\{\{\s*date\s*\}\}/gi, `${yyyy}-${mm}-${dd}`)
    .replace(/\{\{\s*year\s*\}\}/gi, yyyy)
    .replace(/\{\{\s*month\s*\}\}/gi, mm)
    .replace(/\{\{\s*week\s*\}\}/gi, String(isoWeek).padStart(2, '0'));
}

/**
 * ISO 8601 week number. Week 1 is the week containing the first Thursday of the year.
 * Returns 1-53.
 */
function isoWeekNumber(d: Date): number {
  // Copy to a UTC date to avoid DST/timezone issues
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Set to Thursday of this week (target.getUTCDay() is 0 for Sunday, 1 for Monday, etc.)
  const dayNum = target.getUTCDay() || 7; // 1-7 (Mon-Sun)
  target.setUTCDate(target.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return weekNum;
}
