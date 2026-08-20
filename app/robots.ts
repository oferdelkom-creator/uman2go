import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { routing } from "@/i18n/routing";

export default function robots(): MetadataRoute.Robots {
  const privatePaths = ["/owner", "/admin", "/api", "/login", "/signup", "/reset-password"];
  const localizedPrivatePaths = routing.locales
    .filter((locale) => locale !== routing.defaultLocale)
    .flatMap((locale) => privatePaths.map((path) => `/${locale}${path}`));

  return {
    rules: { userAgent: "*", allow: "/", disallow: [...privatePaths, ...localizedPrivatePaths] },
    host: SITE_URL,
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
