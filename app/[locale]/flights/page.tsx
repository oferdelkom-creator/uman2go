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
  const t = await getTranslations({ locale, namespace: "flights" });
  return { title: t("metaTitle") };
}

export default async function FlightsPage() {
  const t = await getTranslations("flights");

  return (
    <Section>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-center font-display text-3xl font-extrabold text-brand-navy">{t("title")}</h1>
        <p className="mt-2 text-center text-foreground/70">{t("subtitle")}</p>
        <Card className="mt-8 p-6 sm:p-8">
          <LeadForm
            table="flight_requests"
            leadType="flight"
            submitLabel={t("submit")}
            extraFields={[
              { name: "email", label: t("email"), type: "email" },
              { name: "departure_date", label: t("departureDate"), type: "date", required: true },
              { name: "return_date", label: t("returnDate"), type: "date" },
              { name: "passengers_count", label: t("passengersCount"), type: "number", required: true },
              { name: "travel_insurance", label: t("travelInsurance"), type: "checkbox" },
            ]}
          />
        </Card>
      </div>
    </Section>
  );
}
