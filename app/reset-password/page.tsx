import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { ResetPasswordForm } from "@/app/reset-password/ResetPasswordForm";

export const metadata: Metadata = { title: "איפוס סיסמה" };

export default function ResetPasswordPage() {
  return (
    <Section>
      <div className="mx-auto max-w-md">
        <h1 className="text-center font-display text-3xl font-extrabold text-brand-navy">איפוס סיסמה</h1>
        <Card className="mt-8 p-6 sm:p-8">
          <ResetPasswordForm />
        </Card>
      </div>
    </Section>
  );
}
