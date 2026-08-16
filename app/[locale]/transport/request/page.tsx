import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { TransportRequestForm } from "@/components/TransportRequestForm";

export const metadata: Metadata = { title: "בקשת הסעה" };

export default function TransportRequestPage() {
  return (
    <Section>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-center font-display text-3xl font-extrabold text-brand-navy">בקשת הסעה</h1>
        <p className="mt-2 text-center text-foreground/70">נמצא עבורכם את הנהג המתאים ליעד שלכם.</p>
        <Card className="mt-8 p-6 sm:p-8">
          <TransportRequestForm />
        </Card>
      </div>
    </Section>
  );
}
