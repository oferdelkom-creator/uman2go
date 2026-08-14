import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { RoomForm } from "@/app/owner/rooms/RoomForm";

export default async function NewRoomPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/owner/rooms/new");

  const { data: hotel } = await supabase.from("hotels").select("id").eq("owner_id", user.id).maybeSingle();
  if (!hotel) redirect("/owner/hotel/new");

  return (
    <Section>
      <h1 className="font-display text-3xl font-extrabold text-brand-navy">הוספת חדר</h1>
      <Card className="mt-6 p-6 sm:p-8">
        <RoomForm hotelId={hotel.id} />
      </Card>
    </Section>
  );
}
