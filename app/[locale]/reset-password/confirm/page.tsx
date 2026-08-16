import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { UpdatePasswordForm } from "@/app/[locale]/reset-password/confirm/UpdatePasswordForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.updatePassword" });
  return { title: t("metaTitle") };
}

export default async function ConfirmResetPage() {
  const t = await getTranslations("auth.updatePassword");

  return (
    <Section>
      <div className="mx-auto max-w-md">
        <h1 className="text-center font-display text-3xl font-extrabold text-brand-navy">{t("title")}</h1>
        <Card className="mt-8 p-6 sm:p-8">
          <UpdatePasswordForm />
        </Card>
      </div>
    </Section>
  );
}
