import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Section } from "@/components/ui/Section";
import { HotelCard } from "@/components/HotelCard";
import { HotelSearchBar } from "@/components/HotelSearchBar";
import { EmptyState } from "@/components/ui/EmptyState";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "hotels.list" });
  return { title: t("metaTitle") };
}

export default async function HotelsPage({
  searchParams,
}: {
  searchParams: Promise<{ checkIn?: string; checkOut?: string; guests?: string }>;
}) {
  const { checkIn, checkOut, guests } = await searchParams;
  const guestsCount = guests ? Number(guests) : undefined;
  const supabase = await createClient();
  const t = await getTranslations("hotels.list");

  const isSearching = Boolean(checkIn && checkOut);
  const searchQuery = isSearching
    ? `?${new URLSearchParams({ checkIn: checkIn!, checkOut: checkOut!, ...(guests ? { guests } : {}) }).toString()}`
    : "";

  const [{ data: hotels }, { data: rooms }, availableRoomIds] = await Promise.all([
    supabase.from("hotels").select("*").eq("status", "active").order("featured", { ascending: false }),
    supabase.from("rooms").select("id, hotel_id, price_per_night, currency, capacity").eq("status", "active"),
    isSearching ? supabase.rpc("available_room_ids", { p_check_in: checkIn!, p_check_out: checkOut! }) : Promise.resolve({ data: null }),
  ]);

  const availableIds = availableRoomIds.data ? new Set(availableRoomIds.data) : null;

  const eligibleRooms = (rooms ?? []).filter((room) => {
    if (guestsCount && room.capacity < guestsCount) return false;
    if (availableIds && !availableIds.has(room.id)) return false;
    return true;
  });

  const minPriceByHotel = new Map<string, { price: number; currency: string }>();
  for (const room of eligibleRooms) {
    const current = minPriceByHotel.get(room.hotel_id);
    if (!current || room.price_per_night < current.price) {
      minPriceByHotel.set(room.hotel_id, { price: room.price_per_night, currency: room.currency });
    }
  }

  const visibleHotels = isSearching ? (hotels ?? []).filter((hotel) => minPriceByHotel.has(hotel.id)) : (hotels ?? []);

  return (
    <Section>
      <h1 className="font-display text-4xl font-extrabold text-brand-navy">{t("title")}</h1>
      <p className="mt-2 max-w-2xl text-foreground/70">{t("subtitle")}</p>

      <HotelSearchBar initialCheckIn={checkIn} initialCheckOut={checkOut} initialGuests={guestsCount} />

      {visibleHotels.length > 0 ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleHotels.map((hotel) => {
            const price = minPriceByHotel.get(hotel.id);
            return (
              <HotelCard key={hotel.id} hotel={hotel} fromPrice={price?.price} currency={price?.currency} searchQuery={searchQuery} />
            );
          })}
        </div>
      ) : isSearching ? (
        <EmptyState title={t("noAvailabilityTitle")} description={t("noAvailabilityDesc")} className="mt-10" />
      ) : (
        <EmptyState title={t("emptyTitle")} description={t("emptyDesc")} className="mt-10" />
      )}
    </Section>
  );
}
