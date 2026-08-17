import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { FlightRequestForm } from "@/components/FlightRequestForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "flights" });
  return { title: t("metaTitle") };
}

export default async function FlightsPage() {
  const t = await getTranslations("flights");
  const steps = ["departFromIsrael", "landNearDestination", "organizedTransfer", "optionalStay"] as const;

  return (
    <Section>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-center font-display text-3xl font-extrabold text-brand-navy">{t("title")}</h1>
        <p className="mt-2 text-center text-foreground/70">{t("subtitle")}</p>
        <Card className="mt-8 p-6 sm:p-8">
          <FlightRequestForm />
        </Card>
      </div>

      <div className="mx-auto mt-14 max-w-3xl">
        <h2 className="text-center font-display text-2xl font-bold text-brand-navy">{t("routes.title")}</h2>
        <p className="mt-2 text-center text-sm text-foreground/60">{t("routes.disclaimer")}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {steps.map((key, i) => (
            <div key={key} className="flex flex-col items-center gap-2 text-center">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-terracotta/10 font-display font-bold text-brand-terracotta">
                {i + 1}
              </span>
              <p className="text-sm text-foreground/70">{t(`routes.steps.${key}`)}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
