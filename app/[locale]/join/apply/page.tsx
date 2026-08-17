import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { ProviderSignupForm } from "@/components/ProviderSignupForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "providerSignup" });
  return { title: t("metaTitle") };
}

export default async function JoinApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const t = await getTranslations("providerSignup");

  return (
    <Section>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-center font-display text-3xl font-extrabold text-brand-navy">{t("title")}</h1>
        <p className="mt-2 text-center text-foreground/70">{t("subtitle")}</p>
        <Card className="mt-8 p-6 sm:p-8">
          <ProviderSignupForm initialType={type} />
        </Card>
      </div>
    </Section>
  );
}
