const INTL_LOCALE: Record<string, string> = {
  he: "he-IL",
  en: "en-US",
  fr: "fr-FR",
  uk: "uk-UA",
};

export function formatCurrency(amount: number, currency: string, locale = "he"): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale] ?? INTL_LOCALE.he, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string, locale = "he"): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale] ?? INTL_LOCALE.he, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}
