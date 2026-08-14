import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { HotelForm } from "@/app/owner/hotel/HotelForm";

export default async function EditHotelPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/owner/hotel/edit");

  const { data: hotel } = await supabase.from("hotels").select("*").eq("owner_id", user.id).maybeSingle();
  if (!hotel) redirect("/owner/hotel/new");

  return (
    <Section>
      <h1 className="font-display text-3xl font-extrabold text-brand-navy">עריכת פרטי המלון</h1>
      <Card className="mt-6 p-6 sm:p-8">
        <HotelForm hotel={hotel} />
      </Card>
    </Section>
  );
}
