// Integration with Grow (גרואו), an Israeli payment processor. Credentials
// (userId + pageCode + x-api-key) come from Grow's merchant onboarding —
// contact Grow support to obtain them, they are not self-serve.
//
// The exact request/response shape and webhook signing method below are
// PLACEHOLDERS: Grow's docs (developers.grow.business) could not be reached
// from this environment to confirm exact field names. Before going live,
// verify every field against the real "Create Payment Link" reference and
// adjust `createPaymentLink`'s body and `verifyWebhookSignature` accordingly.
//
// Both functions fail closed: with missing env vars, createPaymentLink
// returns null (caller should fall back to the pre-Grow flow rather than
// crash) and verifyWebhookSignature returns false (an unconfigured/
// unverifiable webhook is rejected, never silently trusted).

const GROW_API_BASE = "https://api.grow.business"; // TODO: confirm against real docs

export type GrowPaymentLinkParams = {
  amount: number;
  currency: "ILS" | "USD";
  description: string;
  /** Our own row id (booking/transport_request/tour_signup), echoed back on the webhook so we know what was paid for. */
  referenceId: string;
  successUrl: string;
  cancelUrl?: string;
};

export function isGrowConfigured(): boolean {
  return Boolean(process.env.GROW_API_KEY && process.env.GROW_USER_ID && process.env.GROW_PAGE_CODE);
}

export async function createPaymentLink(params: GrowPaymentLinkParams): Promise<{ url: string } | null> {
  if (!isGrowConfigured()) {
    console.warn("Grow is not configured (missing GROW_API_KEY/GROW_USER_ID/GROW_PAGE_CODE); skipping payment link creation.");
    return null;
  }

  try {
    const res = await fetch(`${GROW_API_BASE}/reference/create-payment-link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.GROW_API_KEY!,
      },
      body: JSON.stringify({
        userId: process.env.GROW_USER_ID,
        pageCode: process.env.GROW_PAGE_CODE,
        amount: params.amount,
        currency: params.currency,
        description: params.description,
        referenceId: params.referenceId,
        successUrl: params.successUrl,
        cancelUrl: params.cancelUrl,
      }),
    });

    if (!res.ok) {
      console.error("Grow createPaymentLink failed", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    // TODO: confirm the real response field name for the hosted payment URL.
    return data.url ? { url: data.url as string } : null;
  } catch (err) {
    console.error("Grow createPaymentLink threw", err);
    return null;
  }
}

export type GrowRefundParams = {
  amount: number;
  currency: "ILS" | "USD";
  /** Our own row id, same value passed as referenceId when the original payment link was created. */
  referenceId: string;
  /** Grow's own charge/transaction id, if we captured one from the webhook payload. Prefer this over referenceId if Grow's real API requires it. */
  transactionId?: string | null;
  reason?: string;
};

/**
 * Refunds a previously collected deposit (e.g. when a hotel owner rejects a
 * booking). Same fail-soft shape as `createPaymentLink`: with missing env
 * vars or any request error, returns null and the caller should surface a
 * "refund pending, will be handled manually" state rather than crash.
 */
export async function refundPayment(params: GrowRefundParams): Promise<{ ok: boolean } | null> {
  if (!isGrowConfigured()) {
    console.warn("Grow is not configured (missing GROW_API_KEY/GROW_USER_ID/GROW_PAGE_CODE); skipping refund.");
    return null;
  }

  try {
    const res = await fetch(`${GROW_API_BASE}/reference/refund`, {
      // TODO: confirm the real refund endpoint path against Grow's docs.
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.GROW_API_KEY!,
      },
      body: JSON.stringify({
        userId: process.env.GROW_USER_ID,
        pageCode: process.env.GROW_PAGE_CODE,
        amount: params.amount,
        currency: params.currency,
        referenceId: params.referenceId,
        transactionId: params.transactionId ?? undefined,
        reason: params.reason,
      }),
    });

    if (!res.ok) {
      console.error("Grow refundPayment failed", res.status, await res.text());
      return null;
    }

    // TODO: confirm the real response shape for a successful refund.
    return { ok: true };
  } catch (err) {
    console.error("Grow refundPayment threw", err);
    return null;
  }
}

/**
 * Verifies an inbound Grow webhook is genuinely from Grow before we trust
 * its payload to write payment_confirmed_at/platform_fee_paid_at. Fails
 * closed (returns false) until GROW_WEBHOOK_SECRET is set AND the real
 * signing scheme is confirmed from Grow's docs/support.
 */
export function verifyWebhookSignature(_rawBody: string, _signatureHeader: string | null): boolean {
  if (!process.env.GROW_WEBHOOK_SECRET) return false;
  // TODO: implement the real signature check (likely HMAC-SHA256 of the raw
  // body using GROW_WEBHOOK_SECRET, compared against _signatureHeader) once
  // confirmed against Grow's docs.
  return false;
}
