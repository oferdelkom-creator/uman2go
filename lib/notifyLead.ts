import { resend, EMAIL_FROM, ADMIN_EMAIL } from "@/lib/resend";
import { renderEmail } from "@/lib/emailTemplate";

export const LEAD_TABLES = {
  vip: { table: "vip_requests", title: "בקשת VIP חדשה" },
  investment: { table: "investment_requests", title: "פנייה חדשה להשקעות" },
  flight: { table: "flight_requests", title: "בקשת טיסה חדשה" },
  "home-rental": { table: "home_rental_leads", title: "ליד השכרת נכס חדש" },
  provider: { table: "provider_applications", title: "בקשת ספק חדשה" },
} as const;

export type LeadType = keyof typeof LEAD_TABLES;

// Shared "build a readable admin email from an arbitrary lead row" helper -
// every lead type has different columns, so this just lists them generically
// rather than hand-writing four near-identical templates.
export async function notifyNewLead(type: LeadType, row: Record<string, unknown>) {
  const { title } = LEAD_TABLES[type];
  const rows = Object.entries(row)
    .filter(([key]) => !["id", "created_at"].includes(key))
    .filter(([, value]) => value !== null && value !== "" && value !== undefined)
    .map(([key, value]) => `<tr><td style="padding:4px 8px;color:#7a3e22;">${key}</td><td style="padding:4px 8px;">${String(value)}</td></tr>`)
    .join("");

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: ADMIN_EMAIL,
      subject: title,
      html: renderEmail(`
        <h2 style="margin:0 0 12px;color:#a0522d;">${title}</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">${rows}</table>
      `),
    });
  } catch {
    // best-effort; never block the user-facing insert on email delivery
  }
}
