// Auto-translates owner-submitted listing text (hotel/room descriptions,
// driver info, tour details, etc.) into en/fr/uk via the Anthropic Messages
// API, so hotel owners/drivers/guides don't have to fill in translations by
// hand — confirmed as the preferred approach over manual entry.
//
// Fails soft: with a missing ANTHROPIC_API_KEY or any request error, returns
// null. Callers should treat that as "leave the *_i18n column at its default
// and fall back to the Hebrew source column" — never block the owner's save
// on this.

const ANTHROPIC_API_BASE = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";

export type TranslatableFields = Record<string, string | string[]>;
export type TranslatedFields = Record<string, Record<"en" | "fr" | "uk", string | string[]>>;

export function isTranslateConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function translateListingFields(fields: TranslatableFields): Promise<TranslatedFields | null> {
  if (!isTranslateConfigured()) return null;

  const entries = Object.entries(fields).filter(([, value]) =>
    Array.isArray(value) ? value.length > 0 : value.trim() !== ""
  );
  if (entries.length === 0) return null;

  const prompt = `Translate the following Hebrew travel-listing fields into English (en), French (fr), and Ukrainian (uk). This is marketing copy for a hotel/driver/tour-guide listing near Uman, Ukraine — preserve meaning and tone. For array fields (e.g. amenities), translate each item and keep the same array length and order.

Respond with ONLY a JSON object, no other text, shaped exactly like:
{"field_name": {"en": "...", "fr": "...", "uk": "..."}, ...}
For array fields, each locale's value must itself be an array of strings.

Fields to translate:
${JSON.stringify(Object.fromEntries(entries), null, 2)}`;

  try {
    const res = await fetch(ANTHROPIC_API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      console.error("Anthropic translate request failed", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const text = data?.content?.[0]?.text;
    if (typeof text !== "string") return null;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]) as TranslatedFields;
  } catch (err) {
    console.error("Anthropic translate request threw", err);
    return null;
  }
}
