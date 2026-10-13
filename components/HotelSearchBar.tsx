"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getPathname } from "@/i18n/navigation";
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
  const locale = useLocale();
  const [checkIn, setCheckIn] = useState(initialCheckIn ?? "");
  const [checkOut, setCheckOut] = useState(initialCheckOut ?? "");
  const [guests, setGuests] = useState(initialGuests ?? 1);

  return (
    <form method="get" action={getPathname({ locale, href: basePath })} className="mt-6 grid gap-3 rounded-2xl bg-brand-cream-deep p-4 sm:grid-cols-[1fr_1fr_auto_auto]">
      <FormField label={t("searchCheckIn")} htmlFor="search-checkin">
        <Input id="search-checkin" name="checkIn" type="date" dir="ltr" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
      </FormField>
      <FormField label={t("searchCheckOut")} htmlFor="search-checkout">
        <Input id="search-checkout" name="checkOut" type="date" dir="ltr" min={checkIn} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
      </FormField>
      <FormField label={t("searchGuests")} htmlFor="search-guests">
        <Input
          id="search-guests"
          name="guests"
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
