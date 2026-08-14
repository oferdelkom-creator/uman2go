import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { RatingStars } from "@/components/ui/RatingStars";
import { PhotoGallery } from "@/components/ui/PhotoGallery";
import { TransportRequestForm } from "@/components/TransportRequestForm";
import { formatCurrency } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: driver } = await supabase.from("drivers").select("name, description").eq("slug", slug).maybeSingle();
  return { title: driver?.name ?? "נהג", description: driver?.description };
}

export default async function DriverDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: driver } = await supabase.from("drivers").select("*").eq("slug", slug).eq("status", "active").maybeSingle();
  if (!driver) notFound();

  const [{ data: routes }, { data: reviews }] = await Promise.all([
    supabase.from("driver_routes").select("*").eq("driver_id", driver.id).eq("status", "active").order("price"),
    supabase.from("driver_reviews").select("*").eq("driver_id", driver.id).order("created_at", { ascending: false }),
  ]);

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.driver_rating + r.vehicle_rating) / 2, 0) / reviews.length
      : null;

  return (
    <Section>
      <PhotoGallery photos={driver.photos} alt={driver.name} />

      <div className="mt-8 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-extrabold text-brand-navy">{driver.name}</h1>
            {avgRating != null && <RatingStars rating={avgRating} />}
          </div>
          <p className="mt-1 text-foreground/60">
            {driver.vehicle_type}
            {driver.passenger_capacity ? ` · עד ${driver.passenger_capacity} נוסעים` : ""}
          </p>
          <p className="mt-6 whitespace-pre-line leading-relaxed text-foreground/80">{driver.description}</p>

          {routes && routes.length > 0 && (
            <>
              <h2 className="mt-10 font-display text-2xl font-bold text-brand-navy">מסלולים ומחירים</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {routes.map((route) => (
                  <Card key={route.id} className="flex items-center justify-between p-4">
                    <span className="font-semibold text-brand-navy">{route.destination}</span>
                    <span dir="ltr" className="font-display font-bold text-brand-terracotta">
                      {formatCurrency(route.price, route.currency)}
                      {route.round_trip_price && ` / ${formatCurrency(route.round_trip_price, route.currency)} הלוך-חזור`}
                    </span>
                  </Card>
                ))}
              </div>
            </>
          )}

          <h2 className="mt-10 font-display text-2xl font-bold text-brand-navy">חוות דעת</h2>
          {reviews && reviews.length > 0 ? (
            <div className="mt-4 grid gap-4">
              {reviews.map((review) => (
                <Card key={review.id} className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-brand-navy">{review.reviewer_name}</p>
                    <RatingStars rating={(review.driver_rating + review.vehicle_rating) / 2} />
                  </div>
                  {review.comment && <p className="mt-2 text-sm text-foreground/70">{review.comment}</p>}
                </Card>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-foreground/60">עדיין אין חוות דעת על הנהג הזה.</p>
          )}
        </div>

        <div>
          <h2 className="font-display text-2xl font-bold text-brand-navy">בקשת הסעה</h2>
          <Card className="mt-4 p-5">
            <TransportRequestForm driverId={driver.id} />
          </Card>
        </div>
      </div>
    </Section>
  );
}
