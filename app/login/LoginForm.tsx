"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/FormField";

export function LoginForm() {
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
      setError("אימייל או סיסמה שגויים");
      setLoading(false);
      return;
    }

    router.push(searchParams.get("next") ?? "/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField label="אימייל" htmlFor="email" required>
        <Input id="email" name="email" type="email" dir="ltr" required />
      </FormField>
      <FormField label="סיסמה" htmlFor="password" required>
        <Input id="password" name="password" type="password" required />
      </FormField>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "מתחבר..." : "התחברות"}
      </Button>
      <div className="flex justify-between text-sm">
        <Link href="/reset-password" className="text-brand-teal hover:underline">שכחתי סיסמה</Link>
        <Link href="/signup" className="text-brand-terracotta hover:underline">הרשמה</Link>
      </div>
    </form>
  );
}
