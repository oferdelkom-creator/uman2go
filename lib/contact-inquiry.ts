export function parseContactInquiry(body: unknown) {
  if (!body || typeof body !== "object") throw new Error("Invalid inquiry");
  const input = body as Record<string, unknown>;
  const text = (key: string, max: number) => {
    const value = input[key];
    if (typeof value !== "string" || !value.trim() || value.length > max) throw new Error("Invalid inquiry");
    return value.trim();
  };
  const id = text("id", 36);
  const email = text("email", 254);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Invalid inquiry");
  return { id, full_name: text("full_name", 200), email, message: text("message", 10000) };
}

export function escapeContactHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}
