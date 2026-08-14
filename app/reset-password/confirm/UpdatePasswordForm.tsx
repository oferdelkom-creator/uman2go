"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/FormField";

export function UpdatePasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: String(formData.get("password")),
    });
    if (error) {
      setError("אירעה שגיאה, נסו לבקש קישור חדש");
      setLoading(false);
      return;
    }
    router.push("/login");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField label="סיסמה חדשה" htmlFor="password" required>
        <Input id="password" name="password" type="password" minLength={6} required />
      </FormField>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "מעדכן..." : "עדכון סיסמה"}
      </Button>
    </form>
  );
}
