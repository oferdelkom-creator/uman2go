import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Section } from "@/components/ui/Section";
import { TourGuideCard } from "@/components/TourGuideCard";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "טיולים באומן" };

export default async function ToursPage() {
  const supabase = await createClient();
  const { data: guides } = await supabase.from("tour_guides").select("*").eq("status", "active");

  return (
    <Section>
      <h1 className="font-display text-4xl font-extrabold text-brand-navy">טיולים באומן</h1>
      <p className="mt-2 max-w-2xl text-foreground/70">טיולים מודרכים וחוויות באומן והסביבה.</p>

      {guides && guides.length > 0 ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide) => (
            <TourGuideCard key={guide.id} guide={guide} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="בקרוב - מגוון טיולים מודרכים"
          description="אנחנו עובדים על הוספת מדריכי טיולים מומלצים. השאירו פרטים ונעדכן אתכם."
          className="mt-10"
        />
      )}
    </Section>
  );
}
