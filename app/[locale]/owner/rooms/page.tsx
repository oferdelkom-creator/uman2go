import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/format";

export default async function OwnerRoomsPage() {
  const supabase = await createClient();
  const locale = await getLocale();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect({ href: "/login?next=/owner/rooms", locale });
    return;
  }

  const { data: hotel } = await supabase.from("hotels").select("id, name").eq("owner_id", user.id).maybeSingle();
  if (!hotel) {
    redirect({ href: "/owner/hotel/new", locale });
    return;
  }

  const { data: rooms } = await supabase.from("rooms").select("*").eq("hotel_id", hotel.id).order("price_per_night");
  const t = await getTranslations("owner.rooms");

  return (
    <Section>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-extrabold text-brand-navy">{t("titleIn", { hotelName: hotel.name })}</h1>
        <ButtonLink href="/owner/rooms/new">{t("addTitle")}</ButtonLink>
      </div>

      {rooms && rooms.length > 0 ? (
        <div className="mt-8 grid gap-4">
          {rooms.map((room) => (
            <Card key={room.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="font-display font-bold text-brand-navy">{room.name}</p>
                <p className="text-sm text-foreground/60">{t("capacityUnits", { capacity: room.capacity, quantity: room.quantity })}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={room.status === "active" ? "teal" : "navy"}>{room.status === "active" ? t("active") : t("hidden")}</Badge>
                <span dir="ltr" className="font-display font-bold text-brand-terracotta">
                  {formatCurrency(room.price_per_night, room.currency)}
                </span>
                <ButtonLink href={`/owner/rooms/${room.id}/edit`} variant="outline">{t("editAction")}</ButtonLink>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title={t("noRoomsTitle")} description={t("noRoomsDesc")} className="mt-8" />
      )}
    </Section>
  );
}
