"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Textarea } from "@/components/ui/FormField";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/notify/contact-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: formData.get("full_name"),
          email: formData.get("email"),
          message: formData.get("message"),
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl bg-brand-teal/10 p-6 text-center text-brand-teal">
        <p className="font-display text-lg font-bold">תודה על פנייתכם!</p>
        <p className="mt-1 text-sm">נחזור אליכם בהקדם.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField label="שם מלא" htmlFor="full_name" required>
        <Input id="full_name" name="full_name" required />
      </FormField>
      <FormField label="אימייל" htmlFor="email" required>
        <Input id="email" name="email" type="email" dir="ltr" required />
      </FormField>
      <FormField label="הודעה" htmlFor="message" required>
        <Textarea id="message" name="message" required />
      </FormField>
      {status === "error" && <p className="text-sm text-red-600">אירעה שגיאה, נסו שוב.</p>}
      <Button type="submit" disabled={status === "loading"} className="w-full">
        {status === "loading" ? "שולח..." : "שליחה"}
      </Button>
    </form>
  );
}
