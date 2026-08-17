import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { LeadForm } from "@/components/LeadForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "host" });
  return { title: t("metaTitle") };
}

export default async function HostLandingPage() {
  const t = await getTranslations("host");

  const points = ["listAnyType", "peakSeasonOnly", "internationalGuests", "teamHelps", "noHebrewNeeded"] as const;

  return (
    <Section>
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-3xl font-extrabold text-brand-navy sm:text-4xl">{t("title")}</h1>
        <p className="mt-3 text-lg text-foreground/70">{t("subtitle")}</p>
      </div>

      <ul className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
        {points.map((key) => (
          <li key={key} className="flex items-start gap-2 rounded-2xl bg-brand-cream-deep p-4 text-sm text-brand-navy">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-brand-terracotta">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {t(`points.${key}`)}
          </li>
        ))}
      </ul>

      <div className="mx-auto mt-10 max-w-xl">
        <Card className="p-6 sm:p-8">
          <LeadForm
            table="provider_applications"
            leadType="provider"
            submitLabel={t("submit")}
            hiddenFields={{ provider_type: "apartment", source: "uk_host" }}
            extraFields={[
              { name: "whatsapp", label: t("whatsapp"), type: "tel" },
              { name: "telegram", label: t("telegram"), type: "text" },
              { name: "location", label: t("location"), type: "text", required: true },
              { name: "max_guests", label: t("maxGuests"), type: "number" },
              { name: "availability_notes", label: t("availabilityNotes"), type: "text" },
            ]}
          />
        </Card>
      </div>
    </Section>
  );
}
