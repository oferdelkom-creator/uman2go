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
  const t = await getTranslations({ locale, namespace: "vip" });
  return { title: t("metaTitle") };
}

export default async function VipPage() {
  const t = await getTranslations("vip");

  return (
    <Section>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-center font-display text-3xl font-extrabold text-brand-navy">{t("title")}</h1>
        <p className="mt-2 text-center text-foreground/70">{t("subtitle")}</p>
        <Card className="mt-8 p-6 sm:p-8">
          <LeadForm table="vip_requests" leadType="vip" submitLabel={t("submit")} />
        </Card>
      </div>
    </Section>
  );
}
