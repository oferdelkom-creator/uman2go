"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/FormField";

export function LoginForm() {
  const t = useTranslations("auth.login");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: String(formData.get("email")),
      password: String(formData.get("password")),
    });

    if (error) {
      setError(t("invalidCredentials"));
      setLoading(false);
      return;
    }

    // "next" is stored locale-neutral (see proxy.ts) — this locale-aware
    // push re-adds the current locale's prefix.
    router.push(searchParams.get("next") ?? "/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField label={t("email")} htmlFor="email" required>
        <Input id="email" name="email" type="email" dir="ltr" required />
      </FormField>
      <FormField label={t("password")} htmlFor="password" required>
        <Input id="password" name="password" type="password" required />
      </FormField>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? t("loggingIn") : t("submit")}
      </Button>
      <div className="flex justify-between text-sm">
        <Link href="/reset-password" className="text-brand-teal hover:underline">{t("forgotPassword")}</Link>
        <Link href="/signup" className="text-brand-terracotta hover:underline">{t("signup")}</Link>
      </div>
    </form>
  );
}
