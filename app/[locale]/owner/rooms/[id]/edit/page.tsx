import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { RoomForm } from "@/app/[locale]/owner/rooms/RoomForm";

export default async function EditRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const locale = await getLocale();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect({ href: `/login?next=/owner/rooms/${id}/edit`, locale });
    return;
  }

  const { data: hotel } = await supabase.from("hotels").select("id").eq("owner_id", user.id).maybeSingle();
  if (!hotel) {
    redirect({ href: "/owner/hotel/new", locale });
    return;
  }

  const { data: room } = await supabase.from("rooms").select("*").eq("id", id).eq("hotel_id", hotel.id).maybeSingle();
  if (!room) notFound();

  const t = await getTranslations("owner.rooms");

  return (
    <Section>
      <h1 className="font-display text-3xl font-extrabold text-brand-navy">{t("editTitle")}</h1>
      <Card className="mt-6 p-6 sm:p-8">
        <RoomForm hotelId={hotel.id} room={room} />
      </Card>
    </Section>
  );
}
