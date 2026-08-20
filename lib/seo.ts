import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/constants";

export function localizedUrl(path: string, locale: string): string {
  const normalizedPath = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  const localePrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  return `${SITE_URL}${localePrefix}${normalizedPath}`;
}

export function localizedAlternates(path: string, locale: string): Metadata["alternates"] {
  return {
    canonical: localizedUrl(path, locale),
    languages: {
      ...Object.fromEntries(routing.locales.map((item) => [item, localizedUrl(path, item)])),
      "x-default": localizedUrl(path, routing.defaultLocale),
    },
  };
}
