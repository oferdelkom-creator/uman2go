import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["he", "en", "fr", "uk"],
  defaultLocale: "he",
  localePrefix: "as-needed",
});
