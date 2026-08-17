"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/FormField";
import { formatCurrency, nightsBetween } from "@/lib/format";
import type { Room } from "@/lib/types";

type Extra = { name: string; price: number };

export function BookingForm({
  room,
  hotelId,
  extraServices,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
}: {
  room: Room;
  hotelId: string;
  extraServices: Extra[];
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
}) {
  const t = useTranslations("hotels.booking");
  const locale = useLocale();
  const [checkIn, setCheckIn] = useState(initialCheckIn ?? "");
  const [checkOut, setCheckOut] = useState(initialCheckOut ?? "");
  const [guests, setGuests] = useState(initialGuests ?? 1);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [selectedExtras, setSelectedExtras] = useState<Extra[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "redirecting" | "fallback" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const nights = useMemo(() => (checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0), [checkIn, checkOut]);
  const roomTotal = room.pricing_type === "per_night_per_guest" ? room.price_per_night * nights * guests : room.price_per_night * nights;
  const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.price, 0);
  const total = roomTotal + extrasTotal;

  function toggleExtra(extra: Extra) {
    setSelectedExtras((prev) =>
      prev.some((e) => e.name === extra.name) ? prev.filter((e) => e.name !== extra.name) : [...prev, extra]
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const supabase = createClient();
    // If a session happens to exist we link it opportunistically, but a
    // guest never needs to log in or sign up to book - contact details are
    // collected directly, same pattern as transport/tour requests.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        hotel_id: hotelId,
        room_id: room.id,
        guest_id: user?.id ?? null,
        guest_full_name: fullName,
        guest_phone: phone,
        guest_email: email,
        check_in: checkIn,
        check_out: checkOut,
        guests_count: guests,
        price_per_night: room.price_per_night,
        currency: room.currency,
        room_pricing_type: room.pricing_type,
        selected_extras: selectedExtras,
        extras_total: extrasTotal,
      })
      .select("id")
      .single();

    if (error) {
      setStatus("error");
      setErrorMessage(error.message.includes("not available") ? t("roomUnavailable") : t("genericError"));
      return;
    }

    const res = await fetch("/api/bookings/create-deposit-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: data.id, locale }),
    });
    const payload = await res.json().catch(() => null);

    if (payload?.url) {
      setStatus("redirecting");
      window.location.href = payload.url;
      return;
    }

    setStatus("fallback");
  }

  if (status === "redirecting") {
    return (
      <div className="rounded-2xl bg-brand-teal/10 p-5 text-center text-brand-teal">
        <p className="font-display text-base font-bold">{t("redirectingToPayment")}</p>
      </div>
    );
  }

  if (status === "fallback") {
    return (
      <div className="rounded-2xl bg-brand-teal/10 p-5 text-center text-brand-teal">
        <p className="font-display text-base font-bold">{t("sentTitle")}</p>
        <p className="mt-1 text-sm">{t("payFallbackNotice")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-2xl bg-brand-cream-deep p-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t("checkIn")} htmlFor={`checkin-${room.id}`} required>
          <Input id={`checkin-${room.id}`} type="date" dir="ltr" required value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
        </FormField>
        <FormField label={t("checkOut")} htmlFor={`checkout-${room.id}`} required>
          <Input id={`checkout-${room.id}`} type="date" dir="ltr" required min={checkIn} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
        </FormField>
      </div>
      <FormField label={t("guestsCount")} htmlFor={`guests-${room.id}`} required>
        <Input
          id={`guests-${room.id}`}
          type="number"
          dir="ltr"
          min={1}
          max={room.capacity}
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          required
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label={t("fullName")} htmlFor={`fullname-${room.id}`} required>
          <Input id={`fullname-${room.id}`} required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </FormField>
        <FormField label={t("phone")} htmlFor={`phone-${room.id}`} required>
          <Input id={`phone-${room.id}`} type="tel" dir="ltr" required value={phone} onChange={(e) => setPhone(e.target.value)} />
        </FormField>
      </div>
      <FormField label={t("email")} htmlFor={`email-${room.id}`} required>
        <Input id={`email-${room.id}`} type="email" dir="ltr" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </FormField>

      {extraServices.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-semibold text-brand-navy">{t("extraServices")}</p>
          {extraServices.map((extra) => (
            <label key={extra.name} className="flex items-center justify-between gap-2 text-sm text-brand-navy/80">
              <span className="flex items-center gap-2">
                <input type="checkbox" onChange={() => toggleExtra(extra)} className="h-4 w-4 rounded border-brand-navy/30 text-brand-terracotta" />
                {extra.name}
              </span>
              <span dir="ltr">{formatCurrency(extra.price, room.currency, locale)}</span>
            </label>
          ))}
        </div>
      )}

      {nights > 0 && (
        <div className="flex items-center justify-between border-t border-brand-navy/10 pt-3 text-sm">
          <span className="text-brand-navy/70">{t("nights", { count: nights })}</span>
          <span dir="ltr" className="font-display font-bold text-brand-terracotta">
            {formatCurrency(total, room.currency, locale)}
          </span>
        </div>
      )}

      {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}

      <Button type="submit" disabled={status === "loading" || nights <= 0} className="w-full">
        {status === "loading" ? t("sending") : t("submit")}
      </Button>
    </form>
  );
}
