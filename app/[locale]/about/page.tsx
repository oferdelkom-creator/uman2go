import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Section } from "@/components/ui/Section";
import { SITE_NAME } from "@/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return { title: t("title") };
}

export default async function AboutPage() {
  const t = await getTranslations("about");

  return (
    <Section>
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-4xl font-extrabold text-brand-navy">
          {t("title")} {SITE_NAME}
        </h1>
        <p className="mt-4 text-lg text-foreground/70">{t("tagline")}</p>
        <div className="mt-8 flex flex-col gap-6 leading-relaxed text-foreground/80">
          <p>{t("paragraph1", { siteName: SITE_NAME })}</p>
          <p>{t("paragraph2")}</p>
        </div>
      </div>
    </Section>
  );
}
