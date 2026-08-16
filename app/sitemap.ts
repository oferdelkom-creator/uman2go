import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/constants";
import { routing } from "@/i18n/routing";

function localizedUrl(path: string, locale: string): string {
  return locale === routing.defaultLocale ? `${SITE_URL}${path}` : `${SITE_URL}/${locale}${path}`;
}

function entriesFor(path: string): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(routing.locales.map((locale) => [locale, localizedUrl(path, locale)]));
  return routing.locales.map((locale) => ({
    url: localizedUrl(path, locale),
    lastModified: new Date(),
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const staticPaths = [
    "",
    "/hotels",
    "/transport",
    "/tours",
    "/vip",
    "/investments",
    "/flights",
    "/home-rentals",
    "/about",
    "/contact",
    "/terms",
    "/login",
    "/signup",
  ];

  const [{ data: hotels }, { data: drivers }, { data: guides }] = await Promise.all([
    supabase.from("hotels").select("slug").eq("status", "active"),
    supabase.from("drivers").select("slug").eq("status", "active"),
    supabase.from("tour_guides").select("slug").eq("status", "active"),
  ]);

  const dynamicPaths = [
    ...(hotels ?? []).map((h) => `/hotels/${h.slug}`),
    ...(drivers ?? []).map((d) => `/transport/${d.slug}`),
    ...(guides ?? []).map((g) => `/tours/${g.slug}`),
  ];

  return [...staticPaths, ...dynamicPaths].flatMap(entriesFor);
}
