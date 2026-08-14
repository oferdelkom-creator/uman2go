import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { UpdatePasswordForm } from "@/app/reset-password/confirm/UpdatePasswordForm";

export const metadata: Metadata = { title: "קביעת סיסמה חדשה" };

export default function ConfirmResetPage() {
  return (
    <Section>
      <div className="mx-auto max-w-md">
        <h1 className="text-center font-display text-3xl font-extrabold text-brand-navy">סיסמה חדשה</h1>
        <Card className="mt-8 p-6 sm:p-8">
          <UpdatePasswordForm />
        </Card>
      </div>
    </Section>
  );
}
