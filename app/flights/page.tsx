import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { LeadForm } from "@/components/LeadForm";

export const metadata: Metadata = { title: "הזמנת טיסות" };

export default function FlightsPage() {
  return (
    <Section>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-center font-display text-3xl font-extrabold text-brand-navy">הזמנת טיסות</h1>
        <p className="mt-2 text-center text-foreground/70">נמצא עבורכם את הטיסה המשתלמת ביותר לאומן.</p>
        <Card className="mt-8 p-6 sm:p-8">
          <LeadForm
            table="flight_requests"
            leadType="flight"
            submitLabel="בקשת הצעת מחיר"
            extraFields={[
              { name: "email", label: "אימייל", type: "email" },
              { name: "departure_date", label: "תאריך יציאה", type: "date", required: true },
              { name: "return_date", label: "תאריך חזרה", type: "date" },
              { name: "passengers_count", label: "מספר נוסעים", type: "number", required: true },
              { name: "travel_insurance", label: "מעוניינים בביטוח נסיעות", type: "checkbox" },
            ]}
          />
        </Card>
      </div>
    </Section>
  );
}
