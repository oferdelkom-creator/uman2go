import "server-only";
import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashToken } from "@/lib/sales-assistant";

export async function prepareTaxiDraft(
  conversationId: string,
  destination: string,
  passengers: number,
) {
  destination = destination.trim();
  if (
    destination.length < 5 ||
    destination.length > 400 ||
    !Number.isInteger(passengers) ||
    passengers < 1 ||
    passengers > 50
  )
    throw new Error("Invalid taxi draft");
  const token = randomBytes(24).toString("hex");
  const { error } = await createAdminClient()
    .from("sales_taxi_drafts")
    .insert({
      token_hash: hashToken(token),
      conversation_id: conversationId,
      destination,
      passengers,
    });
  if (error) throw new Error("Taxi draft unavailable");
  return {
    destination,
    passengers,
    url: `https://t.me/UMAN2GO_RidesBot?start=taxi_${token}`,
  };
}
