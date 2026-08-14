import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { LeadForm } from "@/components/LeadForm";

export const metadata: Metadata = { title: "השכרת נכסים" };

export default function HomeRentalsPage() {
  return (
    <Section>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-center font-display text-3xl font-extrabold text-brand-navy">השכרת נכסים</h1>
        <p className="mt-2 text-center text-foreground/70">
          בעלי נכס באומן ומעוניינים להשכיר לחגים? השאירו פרטים ונדבר.
        </p>
        <Card className="mt-8 p-6 sm:p-8">
          <LeadForm
            table="home_rental_leads"
            leadType="home-rental"
            submitLabel="שליחת פרטי הנכס"
            extraFields={[
              { name: "area", label: "אזור", type: "text" },
              { name: "property_type", label: "סוג הנכס", type: "text" },
              { name: "capacity", label: "קיבולת אורחים", type: "number" },
              { name: "asking_price", label: "מחיר מבוקש", type: "text" },
            ]}
          />
        </Card>
      </div>
    </Section>
  );
}
