"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

export function PaymentReturnBanner({
  bookingId,
  payment,
  status,
}: {
  bookingId: string;
  payment: "success" | "cancelled";
  status: string;
}) {
  const t = useTranslations("hotels.booking");
  const locale = useLocale();
  const [retrying, setRetrying] = useState(false);

  async function retryPayment() {
    setRetrying(true);
    const res = await fetch("/api/bookings/create-deposit-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, locale }),
    });
    const payload = await res.json().catch(() => null);
    if (payload?.url) {
      window.location.href = payload.url;
      return;
    }
    setRetrying(false);
  }

  if (payment === "success") {
    return (
      <div className="mb-6 rounded-2xl bg-brand-teal/10 p-5 text-center text-brand-teal">
        <p className="font-display text-base font-bold">{t("sentTitle")}</p>
        <p className="mt-1 text-sm">{t("sentDesc")}</p>
      </div>
    );
  }

  if (payment === "cancelled" && status === "pending_deposit") {
    return (
      <div className="mb-6 rounded-2xl bg-brand-gold/10 p-5 text-center text-brand-navy">
        <p className="font-display text-base font-bold">{t("paymentCancelledTitle")}</p>
        <p className="mt-1 text-sm">{t("paymentCancelledDesc")}</p>
        <button
          onClick={retryPayment}
          disabled={retrying}
          className="mt-3 rounded-full bg-brand-terracotta px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {t("retryPayment")}
        </button>
      </div>
    );
  }

  return null;
}
