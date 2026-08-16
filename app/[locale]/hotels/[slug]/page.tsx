import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { RatingStars } from "@/components/ui/RatingStars";
import { PhotoGallery } from "@/components/ui/PhotoGallery";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/format";
import { tField, tFieldArray } from "@/lib/i18n-content";
import { BookingForm } from "@/app/[locale]/hotels/[slug]/BookingForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const supabase = await createClient();
  const t = await getTranslations({ locale, namespace: "hotels.detail" });
  const { data: hotel } = await supabase.from("hotels").select("name, description").eq("slug", slug).maybeSingle();
  return { title: hotel?.name ?? t("fallbackTitle"), description: hotel?.description };
}

export default async function HotelDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const [t, locale] = await Promise.all([getTranslations("hotels.detail"), getLocale()]);

  const { data: hotel } = await supabase.from("hotels").select("*").eq("slug", slug).eq("status", "active").maybeSingle();
  if (!hotel) notFound();

  const area = tField(hotel.area, hotel.area_i18n, locale);
  const address = tField(hotel.address, hotel.address_i18n, locale);
  const amenities = tFieldArray(hotel.amenities, hotel.amenities_i18n, locale);
  const description = tField(hotel.description, hotel.description_i18n, locale);

  const [{ data: rooms }, { data: reviews }] = await Promise.all([
    supabase.from("rooms").select("*").eq("hotel_id", hotel.id).eq("status", "active").order("price_per_night"),
    supabase.from("hotel_reviews").select("*").eq("hotel_id", hotel.id).order("created_at", { ascending: false }),
  ]);

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.host_rating + r.property_rating) / 2, 0) / reviews.length
      : null;

  const extraServices = Array.isArray(hotel.extra_services)
    ? (hotel.extra_services as { name: string; price: number }[])
    : [];

  return (
    <Section>
      <PhotoGallery photos={hotel.photos} alt={hotel.name} />

      <div className="mt-8 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-extrabold text-brand-navy">{hotel.name}</h1>
            {avgRating != null && <RatingStars rating={avgRating} />}
          </div>
          <p className="mt-1 text-foreground/60">{area} · {address}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {hotel.distance_to_kever_meters != null && (
              <Badge tone="teal">{t("distanceFromSite", { meters: hotel.distance_to_kever_meters })}</Badge>
            )}
            {amenities.map((a) => (
              <Badge key={a} tone="navy">{a}</Badge>
            ))}
          </div>

          <p className="mt-6 whitespace-pre-line leading-relaxed text-foreground/80">{description}</p>

          {(hotel.whatsapp_phone || hotel.contact_name) && (
            <Card className="mt-6 p-5">
              <p className="font-display font-bold text-brand-navy">{t("contact")}</p>
              {hotel.contact_name && <p className="mt-1 text-sm text-foreground/70">{hotel.contact_name}</p>}
              {hotel.whatsapp_phone && (
                <a
                  href={`https://wa.me/${hotel.whatsapp_phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  dir="ltr"
                  className="mt-2 inline-block text-sm font-semibold text-brand-teal hover:underline"
                >
                  {hotel.whatsapp_phone}
                </a>
              )}
            </Card>
          )}

          <h2 className="mt-10 font-display text-2xl font-bold text-brand-navy">{t("reviews")}</h2>
          {reviews && reviews.length > 0 ? (
            <div className="mt-4 grid gap-4">
              {reviews.map((review) => (
                <Card key={review.id} className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-brand-navy">{review.reviewer_name}</p>
                    <RatingStars rating={(review.host_rating + review.property_rating) / 2} />
                  </div>
                  {review.comment && <p className="mt-2 text-sm text-foreground/70">{review.comment}</p>}
                </Card>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-foreground/60">{t("noReviews")}</p>
          )}
        </div>

        <div>
          <h2 className="font-display text-2xl font-bold text-brand-navy">{t("rooms")}</h2>
          {rooms && rooms.length > 0 ? (
            <div className="mt-4 flex flex-col gap-4">
              {rooms.map((room) => (
                <Card key={room.id} className="overflow-hidden">
                  <details>
                    <summary className="cursor-pointer list-none p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-display font-bold text-brand-navy">{room.name}</p>
                          <p className="text-xs text-foreground/60">{t("upToGuests", { count: room.capacity })}</p>
                        </div>
                        <span dir="ltr" className="font-display font-bold text-brand-terracotta">
                          {formatCurrency(room.price_per_night, room.currency)}
                        </span>
                      </div>
                    </summary>
                    <div className="border-t border-brand-navy/10 p-5 pt-4">
                      <BookingForm room={room} hotelId={hotel.id} extraServices={extraServices} />
                    </div>
                  </details>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState title={t("noRooms")} className="mt-4" />
          )}
        </div>
      </div>
    </Section>
  );
}
