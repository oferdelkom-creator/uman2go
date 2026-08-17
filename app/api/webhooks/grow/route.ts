import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/grow";
import { SITE_URL } from "@/lib/constants";

// Grow calls this after a payment completes. Payload shape is a PLACEHOLDER
// (see lib/grow.ts) pending confirmation against Grow's real webhook docs —
// adjust the field names read below once confirmed.
//
// referenceId is expected as "<table-tag>:<row-id>", where table-tag is one
// of "booking" | "transport" | "tour" — set by whatever creates the payment
// link via createPaymentLink(), so this route knows which table to update.
const TABLE_BY_TAG = {
  booking: "bookings",
  transport: "transport_requests",
  tour: "tour_signups",
} as const;

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-grow-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ ok: false, error: "invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  // TODO: confirm real field names for these against Grow's webhook docs.
  const referenceId = String(payload.referenceId ?? "");
  const invoiceId = payload.invoiceId ? String(payload.invoiceId) : null;
  const invoicePdfUrl = payload.invoicePdfUrl ? String(payload.invoicePdfUrl) : null;
  const transactionId = payload.transactionId ? String(payload.transactionId) : null;

  const [tag, rowId] = referenceId.split(":");
  const table = TABLE_BY_TAG[tag as keyof typeof TABLE_BY_TAG];
  if (!table || !rowId) {
    return NextResponse.json({ ok: false, error: "unrecognized referenceId" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const commonFields = {
    payment_confirmed_at: now,
    platform_fee_paid_at: now,
    invoice_id: invoiceId,
    invoice_pdf_url: invoicePdfUrl,
  };

  // `bookings` also transitions status (idempotent against duplicate webhook
  // delivery: only a booking still awaiting its deposit moves forward) and
  // records Grow's own transaction id, for a future refund call; the other
  // two tables don't have either column.
  const { error } =
    table === "bookings"
      ? await supabase
          .from("bookings")
          .update({ ...commonFields, status: "deposit_paid", grow_transaction_id: transactionId })
          .eq("id", rowId)
          .eq("status", "pending_deposit")
      : await supabase.from(table).update(commonFields).eq("id", rowId);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  fetch(`${SITE_URL}/api/notify/payment-confirmed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ table, id: rowId }),
  }).catch(() => {});

  if (table === "bookings") {
    fetch(`${SITE_URL}/api/notify/owner-review-needed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rowId }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
