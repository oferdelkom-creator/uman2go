import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { LeadForm } from "@/components/LeadForm";

export const metadata: Metadata = { title: "השקעות באומן" };

export default function InvestmentsPage() {
  return (
    <Section>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-center font-display text-3xl font-extrabold text-brand-navy">השקעות באומן</h1>
        <p className="mt-2 text-center text-foreground/70">
          מעוניינים בהזדמנויות השקעה בנדל&quot;ן ועסקים באומן? השאירו פרטים ונחזור אליכם.
        </p>
        <Card className="mt-8 p-6 sm:p-8">
          <LeadForm table="investment_requests" leadType="investment" submitLabel="שליחת פנייה" />
        </Card>
      </div>
    </Section>
  );
}
