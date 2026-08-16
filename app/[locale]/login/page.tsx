import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { LoginForm } from "@/app/[locale]/login/LoginForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.login" });
  return { title: t("submit") };
}

export default async function LoginPage() {
  const t = await getTranslations("auth.login");

  return (
    <Section>
      <div className="mx-auto max-w-md">
        <h1 className="text-center font-display text-3xl font-extrabold text-brand-navy">{t("submit")}</h1>
        <Card className="mt-8 p-6 sm:p-8">
          <Suspense>
            <LoginForm />
          </Suspense>
        </Card>
      </div>
    </Section>
  );
}
