import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = { title: "צור קשר" };

export default function ContactPage() {
  return (
    <Section>
      <div className="mx-auto max-w-xl">
        <h1 className="text-center font-display text-3xl font-extrabold text-brand-navy">צור קשר</h1>
        <Card className="mt-8 p-6 sm:p-8">
          <ContactForm />
        </Card>
      </div>
    </Section>
  );
}
