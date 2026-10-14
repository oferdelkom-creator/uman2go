import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { ContactForm } from "@/components/ContactForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return { title: t("metaTitle") };
}

export default async function ContactPage() {
  const t = await getTranslations("contact");
  const locale = await getLocale();
  const businessAddress = ({
    he: { label: "כתובת העסק", value: "לוי אשכול 80, דירה 2, תל אביב, ישראל" },
    en: { label: "Business address", value: "80 Levi Eshkol St., Apt. 2, Tel Aviv, Israel" },
    fr: { label: "Adresse de l’entreprise", value: "80 rue Levi Eshkol, appartement 2, Tel Aviv, Israël" },
    uk: { label: "Адреса компанії", value: "вул. Леві Ешколь, 80, кв. 2, Тель-Авів, Ізраїль" },
  } as Record<string, { label: string; value: string }>)[locale] ?? { label: "Business address", value: "80 Levi Eshkol St., Apt. 2, Tel Aviv, Israel" };

  return (
    <Section>
      <div className="mx-auto max-w-xl">
        <h1 className="text-center font-display text-3xl font-extrabold text-brand-navy">{t("title")}</h1>
        <Card className="mt-8 p-6 sm:p-8">
          <div className="mb-6 border-b border-brand-navy/10 pb-6">
            <h2 className="font-semibold text-brand-navy">{businessAddress.label}</h2>
            <address className="mt-2 not-italic">{businessAddress.value}</address>
          </div>
          <ContactForm />
        </Card>
      </div>
    </Section>
  );
}
