import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { HotelForm } from "@/app/[locale]/owner/hotel/HotelForm";

export default async function EditHotelPage() {
  const supabase = await createClient();
  const locale = await getLocale();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect({ href: "/login?next=/owner/hotel/edit", locale });
    return;
  }

  const { data: hotel } = await supabase.from("hotels").select("*").eq("owner_id", user.id).maybeSingle();
  if (!hotel) {
    redirect({ href: "/owner/hotel/new", locale });
    return;
  }

  const t = await getTranslations("owner.hotelForm");

  return (
    <Section>
      <h1 className="font-display text-3xl font-extrabold text-brand-navy">{t("editTitle")}</h1>
      <Card className="mt-6 p-6 sm:p-8">
        <HotelForm hotel={hotel} />
      </Card>
    </Section>
  );
}
