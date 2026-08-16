import type { Metadata } from "next";
import { Suspense } from "react";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { LoginForm } from "@/app/[locale]/login/LoginForm";

export const metadata: Metadata = { title: "התחברות" };

export default function LoginPage() {
  return (
    <Section>
      <div className="mx-auto max-w-md">
        <h1 className="text-center font-display text-3xl font-extrabold text-brand-navy">התחברות</h1>
        <Card className="mt-8 p-6 sm:p-8">
          <Suspense>
            <LoginForm />
          </Suspense>
        </Card>
      </div>
    </Section>
  );
}
