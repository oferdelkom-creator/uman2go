import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Heebo, Rubik } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import { routing } from "@/i18n/routing";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
});

const rubik = Rubik({
  subsets: ["hebrew", "latin", "cyrillic"],
  variable: "--font-rubik",
  display: "swap",
});

const RTL_LOCALES = new Set(["he"]);
const OG_LOCALE: Record<string, string> = { he: "he_IL", en: "en_US", fr: "fr_FR", uk: "uk_UA" };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `${SITE_NAME} — ${t("tagline")}`, template: `%s | ${SITE_NAME}` },
    description: t("description"),
    openGraph: {
      title: SITE_NAME,
      description: t("tagline"),
      url: SITE_URL,
      siteName: SITE_NAME,
      locale: OG_LOCALE[locale] ?? "he_IL",
      type: "website",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const dir = RTL_LOCALES.has(locale) ? "rtl" : "ltr";
  // Heebo has no Cyrillic glyphs; Rubik does, so Ukrainian body text falls back to Rubik.
  const bodyFontUtility = locale === "uk" ? "font-display" : "font-sans";

  return (
    <html lang={locale} dir={dir} className={`${heebo.variable} ${rubik.variable}`}>
      <body className={`antialiased flex min-h-screen flex-col ${bodyFontUtility}`}>
        <NextIntlClientProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <WhatsAppButton />
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
