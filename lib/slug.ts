// Hebrew business names can't be used as-is in a URL path segment (the
// previous build hit a Hebrew-slug 404 issue on Vercel). Listing slugs are
// assigned once by an admin/owner from a transliterated ASCII string, e.g.
// "בית חזין אומן" -> "beit-chazin". This helper only sanitizes ASCII input
// (owner-provided name suggestions); it does not attempt Hebrew transliteration.
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
