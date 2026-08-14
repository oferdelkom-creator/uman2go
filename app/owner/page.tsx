import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default async function OwnerDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/owner");

  const { data: hotel } = await supabase.from("hotels").select("*").eq("owner_id", user.id).maybeSingle();

  if (!hotel) {
    return (
      <Section>
        <Card className="mx-auto max-w-lg p-8 text-center">
          <h1 className="font-display text-2xl font-bold text-brand-navy">עדיין לא הוספתם מלון</h1>
          <p className="mt-2 text-foreground/70">הוסיפו את פרטי המלון שלכם כדי להתחיל לקבל הזמנות.</p>
          <ButtonLink href="/owner/hotel/new" className="mt-6">הוספת מלון</ButtonLink>
        </Card>
      </Section>
    );
  }

  const { count: bookingsCount } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("hotel_id", hotel.id);

  const navCards = [
    { href: "/owner/hotel/edit", title: "פרטי המלון", desc: "עדכון תמונות, תיאור ופרטי קשר" },
    { href: "/owner/rooms", title: "חדרים", desc: "ניהול חדרים ומחירים" },
    { href: "/owner/bookings", title: "הזמנות", desc: `${bookingsCount ?? 0} הזמנות עד כה` },
  ];

  return (
    <Section>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-brand-navy">{hotel.name}</h1>
          <Badge tone={hotel.status === "active" ? "teal" : "navy"}>{hotel.status === "active" ? "פעיל" : "מוסתר"}</Badge>
        </div>
        <ButtonLink href={`/hotels/${hotel.slug}`} variant="outline">צפייה בדף המלון</ButtonLink>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        {navCards.map((card) => (
          <Link key={card.href} href={card.href} className="block">
            <Card className="p-6">
              <p className="font-display text-lg font-bold text-brand-navy">{card.title}</p>
              <p className="mt-1 text-sm text-foreground/60">{card.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </Section>
  );
}
