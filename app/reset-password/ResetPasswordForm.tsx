"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/FormField";
import { SITE_URL } from "@/lib/constants";

export function ResetPasswordForm() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(String(formData.get("email")), {
      redirectTo: `${SITE_URL}/reset-password/confirm`,
    });
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="rounded-2xl bg-brand-teal/10 p-6 text-center text-brand-teal">
        <p className="font-display text-lg font-bold">נשלח מייל!</p>
        <p className="mt-1 text-sm">אם הכתובת רשומה במערכת, קיבלתם קישור לאיפוס הסיסמה.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField label="אימייל" htmlFor="email" required>
        <Input id="email" name="email" type="email" dir="ltr" required />
      </FormField>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "שולח..." : "שליחת קישור לאיפוס"}
      </Button>
    </form>
  );
}
