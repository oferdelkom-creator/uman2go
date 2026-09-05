import { createAdminClient } from "@/lib/supabase/admin";
import { EMAIL_FROM, ADMIN_EMAIL } from "@/lib/resend";

export async function POST(request: Request) {
  const reply = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
  if (request.headers.get("origin") !== new URL(request.url).origin) return reply({ saved: false }, 403);
  const raw = await request.text();
  if (raw.length > 12000) return reply({ saved: false }, 413);
  let input;
  try { input = JSON.parse(raw); } catch { return reply({ saved: false }, 400); }
  if (!input || typeof input !== "object" || input.website || input.consent !== "on") return reply({ saved: false }, 400);
  const text = (key: string, max: number) => typeof input[key] === "string" ? input[key].trim().slice(0, max) : "";
  const id = text("id", 40), name = text("full_name", 150), email = text("email", 254), area = text("area", 250);
  const capacity = Number(input.capacity), price = Number(input.asking_price);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) || !name || !area || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !Number.isInteger(capacity) || capacity < 1 || capacity > 50 || !Number.isFinite(price) || price < 1 || price > 100000) return reply({ saved: false }, 400);
  if (Date.now() >= Date.parse("2026-09-10T00:00:00+03:00")) return reply({ saved: false, closed: true }, 410);
  const notes = [`Campaign: uman-september-2026; 10–14 September 2026; 4 nights`, `Email: ${email}`, text("notes", 3000), `Attribution: ${JSON.stringify(input.attribution ?? {}).slice(0, 1500)}`, "Owner/representative consent: confirmed"].join("\n");
  const row = { id, full_name: name, phone: text("phone", 80), area, capacity, asking_price: `${price} USD / 4 nights`, property_type: "apartment", notes };
  try {
    const db = createAdminClient();
    // Ignore retries without exposing or overwriting an existing lead.
    const { error } = await db.from("home_rental_leads").insert(row);
    if (error?.code === "23505") return reply({ saved: true, emailAccepted: false });
    if (error) {
      const reason = /invalid api key/i.test(error.message || "") ? "invalid_api_key" : /jwt/i.test(error.message || "") ? "jwt_error" : /fetch failed/i.test(error.message || "") ? "connection_failed" : "database_error";
      console.error(`Apartment offer save failed: ${reason}; code=${error.code || "unavailable"}`);
      return reply({ saved: false }, 503);
    }
    let emailAccepted = false;
    if (process.env.RESEND_API_KEY) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST", signal: AbortSignal.timeout(8000),
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `apartment-${id}` },
          body: JSON.stringify({ from: EMAIL_FROM, to: [ADMIN_EMAIL], reply_to: email, subject: "UMAN2GO — квартира 10–14 вересня | ליד דירה חדש", text: Object.entries(row).map(([k, v]) => `${k}: ${v}`).join("\n") }),
        });
        emailAccepted = response.ok;
        if (!response.ok) console.error("Apartment offer email rejected", response.status, id);
      } catch { console.error("Apartment offer email unavailable", id); }
    }
    return reply({ saved: true, emailAccepted });
  } catch { return reply({ saved: false }, 503); }
}

