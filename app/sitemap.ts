import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/constants";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const staticRoutes: MetadataRoute.Sitemap = [
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
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
  }));

  const [{ data: hotels }, { data: drivers }, { data: guides }] = await Promise.all([
    supabase.from("hotels").select("slug").eq("status", "active"),
    supabase.from("drivers").select("slug").eq("status", "active"),
    supabase.from("tour_guides").select("slug").eq("status", "active"),
  ]);

  const dynamicRoutes: MetadataRoute.Sitemap = [
    ...(hotels ?? []).map((h) => ({ url: `${SITE_URL}/hotels/${h.slug}`, lastModified: new Date() })),
    ...(drivers ?? []).map((d) => ({ url: `${SITE_URL}/transport/${d.slug}`, lastModified: new Date() })),
    ...(guides ?? []).map((g) => ({ url: `${SITE_URL}/tours/${g.slug}`, lastModified: new Date() })),
  ];

  return [...staticRoutes, ...dynamicRoutes];
}
