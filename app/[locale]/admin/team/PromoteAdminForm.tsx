"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/FormField";

export function PromoteAdminForm() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const supabase = createClient();

    const { data: profile } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();

    if (!profile) {
      setStatus("error");
      setMessage("לא נמצא משתמש עם המייל הזה — עליו קודם להירשם באתר.");
      return;
    }

    const { error } = await supabase.from("profiles").update({ role: "admin" }).eq("id", profile.id);

    if (error) {
      setStatus("error");
      setMessage("אירעה שגיאה, נסו שוב.");
      return;
    }

    setStatus("idle");
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[240px]">
        <FormField label="מייל של איש/אשת צוות (חייב להיות רשום כבר באתר)" htmlFor="email" required>
          <Input id="email" name="email" type="email" dir="ltr" required />
        </FormField>
      </div>
      <Button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "מוסיף..." : "הפוך למנהל"}
      </Button>
      {message && <p className="w-full text-sm text-red-600">{message}</p>}
    </form>
  );
}
