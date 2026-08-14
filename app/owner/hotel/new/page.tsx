import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { HotelForm } from "@/app/owner/hotel/HotelForm";

export default function NewHotelPage() {
  return (
    <Section>
      <h1 className="font-display text-3xl font-extrabold text-brand-navy">הוספת מלון</h1>
      <Card className="mt-6 p-6 sm:p-8">
        <HotelForm />
      </Card>
    </Section>
  );
}
