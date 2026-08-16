"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LABELS: Record<string, string> = { he: "עברית", en: "English", fr: "Français", uk: "Українська" };

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <select
      value={locale}
      onChange={(e) => router.replace(pathname, { locale: e.target.value })}
      aria-label="Language"
      dir="ltr"
      className="rounded-full border border-brand-navy/15 bg-white px-3 py-1 text-sm text-brand-navy"
    >
      {routing.locales.map((code) => (
        <option key={code} value={code}>
          {LABELS[code]}
        </option>
      ))}
    </select>
  );
}
