"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select } from "@/components/ui/FormField";

export function SignupForm() {
  const t = useTranslations("auth.signup");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const termsAccepted = formData.get("terms") === "on";
    if (!termsAccepted) {
      setError(t("mustAcceptTerms"));
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: String(formData.get("email")),
      password: String(formData.get("password")),
      options: {
        data: {
          full_name: String(formData.get("full_name")),
          phone: String(formData.get("phone")),
          role: String(formData.get("role")),
          terms_accepted: "true",
        },
      },
    });

    if (error) {
      setError(error.message === "User already registered" ? t("alreadyRegistered") : t("genericError"));
      setLoading(false);
      return;
    }

    if (!data.session) {
      setNeedsConfirmation(true);
      setLoading(false);
      return;
    }

    fetch("/api/notify/welcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: data.user?.id }),
    }).catch(() => {});

    router.push("/");
    router.refresh();
  }

  if (needsConfirmation) {
    return (
      <div className="rounded-2xl bg-brand-teal/10 p-6 text-center text-brand-teal">
        <p className="font-display text-lg font-bold">{t("sentTitle")}</p>
        <p className="mt-1 text-sm">{t("sentDesc")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField label={t("fullName")} htmlFor="full_name" required>
        <Input id="full_name" name="full_name" required />
      </FormField>
      <FormField label={t("phone")} htmlFor="phone" required>
        <Input id="phone" name="phone" type="tel" dir="ltr" required />
      </FormField>
      <FormField label={t("email")} htmlFor="email" required>
        <Input id="email" name="email" type="email" dir="ltr" required />
      </FormField>
      <FormField label={t("password")} htmlFor="password" required>
        <Input id="password" name="password" type="password" minLength={6} required />
      </FormField>
      <FormField label={t("signUpAs")} htmlFor="role" required>
        <Select id="role" name="role" defaultValue="guest">
          <option value="guest">{t("roleGuest")}</option>
          <option value="hotel_owner">{t("roleHotelOwner")}</option>
        </Select>
      </FormField>
      <label className="flex items-start gap-2 text-sm text-brand-navy/80">
        <input type="checkbox" name="terms" className="mt-0.5 h-4 w-4 rounded border-brand-navy/30 text-brand-terracotta" />
        <span>
          {t("termsPrefix")}
          <Link href="/terms" className="text-brand-terracotta hover:underline">{t("termsLink")}</Link>
        </span>
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? t("signingUp") : t("submit")}
      </Button>
      <p className="text-center text-sm text-brand-navy/70">
        {t("alreadyHaveAccount")} <Link href="/login" className="text-brand-terracotta hover:underline">{t("login")}</Link>
      </p>
    </form>
  );
}
