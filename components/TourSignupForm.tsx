"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Textarea } from "@/components/ui/FormField";

export function TourSignupForm({ tourDateId, guideId }: { tourDateId: string; guideId: string }) {
  const t = useTranslations("tours.form");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const formData = new FormData(e.currentTarget);

    const payload = {
      tour_date_id: tourDateId,
      guide_id: guideId,
      full_name: String(formData.get("full_name")),
      phone: String(formData.get("phone")),
      participants_count: Number(formData.get("participants_count") || 1),
      notes: String(formData.get("notes") ?? ""),
    };

    const supabase = createClient();
    const { data, error } = await supabase.from("tour_signups").insert(payload).select("id").single();

    if (error) {
      setStatus("error");
      setErrorMessage(error.message.includes("full") ? t("dateFull") : t("genericError"));
      return;
    }

    setStatus("done");
    fetch("/api/notify/new-tour-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: data.id }),
    }).catch(() => {});
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl bg-brand-teal/10 p-4 text-center text-sm text-brand-teal">
        {t("sentMessage")}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t("fullName")} htmlFor={`name-${tourDateId}`} required>
          <Input id={`name-${tourDateId}`} name="full_name" required />
        </FormField>
        <FormField label={t("phone")} htmlFor={`phone-${tourDateId}`} required>
          <Input id={`phone-${tourDateId}`} name="phone" type="tel" dir="ltr" required />
        </FormField>
      </div>
      <FormField label={t("participantsCount")} htmlFor={`participants-${tourDateId}`} required>
        <Input id={`participants-${tourDateId}`} name="participants_count" type="number" dir="ltr" min={1} defaultValue={1} required />
      </FormField>
      <FormField label={t("notes")} htmlFor={`notes-${tourDateId}`}>
        <Textarea id={`notes-${tourDateId}`} name="notes" />
      </FormField>
      {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}
      <Button type="submit" disabled={status === "loading"} className="w-full">
        {status === "loading" ? t("signingUp") : t("submit")}
      </Button>
    </form>
  );
}
