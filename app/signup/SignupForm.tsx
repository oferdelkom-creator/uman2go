"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select } from "@/components/ui/FormField";

export function SignupForm() {
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
      setError("יש לאשר את תנאי השימוש");
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
      setError(error.message === "User already registered" ? "המייל כבר רשום במערכת" : "אירעה שגיאה בהרשמה");
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
        <p className="font-display text-lg font-bold">נרשמתם בהצלחה!</p>
        <p className="mt-1 text-sm">שלחנו לכם מייל לאימות החשבון.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField label="שם מלא" htmlFor="full_name" required>
        <Input id="full_name" name="full_name" required />
      </FormField>
      <FormField label="טלפון" htmlFor="phone" required>
        <Input id="phone" name="phone" type="tel" dir="ltr" required />
      </FormField>
      <FormField label="אימייל" htmlFor="email" required>
        <Input id="email" name="email" type="email" dir="ltr" required />
      </FormField>
      <FormField label="סיסמה" htmlFor="password" required>
        <Input id="password" name="password" type="password" minLength={6} required />
      </FormField>
      <FormField label="נרשמים בתור" htmlFor="role" required>
        <Select id="role" name="role" defaultValue="guest">
          <option value="guest">אורח/ת</option>
          <option value="hotel_owner">בעל/ת מלון</option>
        </Select>
      </FormField>
      <label className="flex items-start gap-2 text-sm text-brand-navy/80">
        <input type="checkbox" name="terms" className="mt-0.5 h-4 w-4 rounded border-brand-navy/30 text-brand-terracotta" />
        <span>
          קראתי ואני מסכימ/ה ל<Link href="/terms" className="text-brand-terracotta hover:underline">תנאי השימוש</Link>
        </span>
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "נרשם..." : "הרשמה"}
      </Button>
      <p className="text-center text-sm text-brand-navy/70">
        כבר רשומים? <Link href="/login" className="text-brand-terracotta hover:underline">התחברות</Link>
      </p>
    </form>
  );
}
