import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { SignupForm } from "@/app/[locale]/signup/SignupForm";

export const metadata: Metadata = { title: "הרשמה" };

export default function SignupPage() {
  return (
    <Section>
      <div className="mx-auto max-w-md">
        <h1 className="text-center font-display text-3xl font-extrabold text-brand-navy">הרשמה</h1>
        <Card className="mt-8 p-6 sm:p-8">
          <SignupForm />
        </Card>
      </div>
    </Section>
  );
}
