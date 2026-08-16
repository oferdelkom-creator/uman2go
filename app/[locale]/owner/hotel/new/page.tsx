import { getTranslations } from "next-intl/server";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { HotelForm } from "@/app/[locale]/owner/hotel/HotelForm";

export default async function NewHotelPage() {
  const t = await getTranslations("owner.hotelForm");

  return (
    <Section>
      <h1 className="font-display text-3xl font-extrabold text-brand-navy">{t("addTitle")}</h1>
      <Card className="mt-6 p-6 sm:p-8">
        <HotelForm />
      </Card>
    </Section>
  );
}
