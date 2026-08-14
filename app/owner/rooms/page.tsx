import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/format";

export default async function OwnerRoomsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/owner/rooms");

  const { data: hotel } = await supabase.from("hotels").select("id, name").eq("owner_id", user.id).maybeSingle();
  if (!hotel) redirect("/owner/hotel/new");

  const { data: rooms } = await supabase.from("rooms").select("*").eq("hotel_id", hotel.id).order("price_per_night");

  return (
    <Section>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-extrabold text-brand-navy">חדרים ב{hotel.name}</h1>
        <ButtonLink href="/owner/rooms/new">הוספת חדר</ButtonLink>
      </div>

      {rooms && rooms.length > 0 ? (
        <div className="mt-8 grid gap-4">
          {rooms.map((room) => (
            <Card key={room.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="font-display font-bold text-brand-navy">{room.name}</p>
                <p className="text-sm text-foreground/60">עד {room.capacity} אורחים · {room.quantity} יחידות</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={room.status === "active" ? "teal" : "navy"}>{room.status === "active" ? "פעיל" : "מוסתר"}</Badge>
                <span dir="ltr" className="font-display font-bold text-brand-terracotta">
                  {formatCurrency(room.price_per_night, room.currency)}
                </span>
                <ButtonLink href={`/owner/rooms/${room.id}/edit`} variant="outline">עריכה</ButtonLink>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="עדיין אין חדרים" description="הוסיפו חדר ראשון" className="mt-8" />
      )}
    </Section>
  );
}
