import { SITE_URL } from "@/lib/constants";

// Shared branded wrapper for every transactional email - keeps the logo and
// look consistent without repeating markup in every notify route. bodyHtml
// is RTL Hebrew content produced by our own notify routes, not user input.
export function renderEmail(bodyHtml: string): string {
  return `
  <div dir="rtl" style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #faf6ef;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="display: inline-block; padding: 10px 18px; border-radius: 12px; background: linear-gradient(90deg, #a0522d, #e8a33d);">
        <span style="font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;">Uman2Go</span>
      </div>
    </div>
    <div style="background: #ffffff; border-radius: 16px; padding: 24px; color: #2b1710; font-size: 15px; line-height: 1.6; box-shadow: 0 4px 20px rgba(160, 82, 45, 0.08);">
      ${bodyHtml}
    </div>
    <p style="text-align: center; color: #9a8a7a; font-size: 12px; margin-top: 16px;">
      <a href="${SITE_URL}" style="color: #a0522d; text-decoration: none;">Uman2Go</a> · מלונות · הסעות · טיולים באומן
    </p>
  </div>
  `;
}
