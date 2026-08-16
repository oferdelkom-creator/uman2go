import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { LeadForm } from "@/components/LeadForm";

export const metadata: Metadata = { title: "שירות VIP" };

export default function VipPage() {
  return (
    <Section>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-center font-display text-3xl font-extrabold text-brand-navy">שירות VIP</h1>
        <p className="mt-2 text-center text-foreground/70">
          ליווי אישי - נדאג לתיאום המלון, ההסעה והטיולים כדי שלכם יישאר רק ליהנות.
        </p>
        <Card className="mt-8 p-6 sm:p-8">
          <LeadForm table="vip_requests" leadType="vip" submitLabel="בקשת שירות VIP" />
        </Card>
      </div>
    </Section>
  );
}
