"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/FormField";

export function HotelSearchBar({
  initialCheckIn,
  initialCheckOut,
  initialGuests,
  basePath = "/hotels",
}: {
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
  basePath?: string;
}) {
  const t = useTranslations("hotels.list");
  const router = useRouter();
  const [checkIn, setCheckIn] = useState(initialCheckIn ?? "");
  const [checkOut, setCheckOut] = useState(initialCheckOut ?? "");
  const [guests, setGuests] = useState(initialGuests ?? 1);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests > 1) params.set("guests", String(guests));
    router.push(`${basePath}${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-3 rounded-2xl bg-brand-cream-deep p-4 sm:grid-cols-[1fr_1fr_auto_auto]">
      <FormField label={t("searchCheckIn")} htmlFor="search-checkin">
        <Input id="search-checkin" type="date" dir="ltr" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
      </FormField>
      <FormField label={t("searchCheckOut")} htmlFor="search-checkout">
        <Input id="search-checkout" type="date" dir="ltr" min={checkIn} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
      </FormField>
      <FormField label={t("searchGuests")} htmlFor="search-guests">
        <Input
          id="search-guests"
          type="number"
          dir="ltr"
          min={1}
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className="w-24"
        />
      </FormField>
      <div className="flex items-end">
        <Button type="submit" className="w-full sm:w-auto">
          {t("searchSubmit")}
        </Button>
      </div>
    </form>
  );
}
