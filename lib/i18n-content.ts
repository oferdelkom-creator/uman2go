/**
 * Reads a translated field, falling back to the Hebrew source column when the
 * locale is "he", the *_i18n jsonb column has no entry for the locale yet, or
 * the entry is empty (e.g. mid-rollout before the auto-translate pipeline ran).
 */
export function tField(base: string, i18n: unknown, locale: string): string {
  if (locale === "he") return base;
  const value = (i18n as Record<string, unknown> | null)?.[locale];
  return typeof value === "string" && value.trim() !== "" ? value : base;
}

export function tFieldArray(base: string[], i18n: unknown, locale: string): string[] {
  if (locale === "he") return base;
  const value = (i18n as Record<string, unknown> | null)?.[locale];
  return Array.isArray(value) && value.length > 0 ? (value as string[]) : base;
}
