import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Section } from "@/components/ui/Section";
import { HotelCard } from "@/components/HotelCard";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "מלונות באומן" };

export default async function HotelsPage() {
  const supabase = await createClient();

  const [{ data: hotels }, { data: rooms }] = await Promise.all([
    supabase.from("hotels").select("*").eq("status", "active").order("featured", { ascending: false }),
    supabase.from("rooms").select("hotel_id, price_per_night, currency").eq("status", "active"),
  ]);

  const minPriceByHotel = new Map<string, { price: number; currency: string }>();
  for (const room of rooms ?? []) {
    const current = minPriceByHotel.get(room.hotel_id);
    if (!current || room.price_per_night < current.price) {
      minPriceByHotel.set(room.hotel_id, { price: room.price_per_night, currency: room.currency });
    }
  }

  return (
    <Section>
      <h1 className="font-display text-4xl font-extrabold text-brand-navy">מלונות באומן</h1>
      <p className="mt-2 max-w-2xl text-foreground/70">מלונות וצימרים מאומתים, קרוב לציון הקדוש.</p>

      {hotels && hotels.length > 0 ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hotels.map((hotel) => {
            const price = minPriceByHotel.get(hotel.id);
            return (
              <HotelCard key={hotel.id} hotel={hotel} fromPrice={price?.price} currency={price?.currency} />
            );
          })}
        </div>
      ) : (
        <EmptyState title="עדיין אין מלונות זמינים" description="חזרו בקרוב" className="mt-10" />
      )}
    </Section>
  );
}
