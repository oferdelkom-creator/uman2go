import { Resend } from "resend";

// The Resend SDK throws at construction time if the key is missing, which
// happens during Next.js's build-time page-data collection (not just at
// request time) - a fallback placeholder keeps the build from breaking if
// the real env var isn't set yet. Sends just fail (caught as best-effort by
// every caller) instead of taking down the whole app.
export const resend = new Resend(process.env.RESEND_API_KEY ?? "re_build_placeholder");

// uman2go.com needs to be verified as a Resend sending domain before this
// address can actually deliver.
export const EMAIL_FROM = "Uman2Go <notifications@uman2go.com>";
export const ADMIN_EMAIL = "ofer.delkom@gmail.com";
