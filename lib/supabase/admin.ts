import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

// Service-role client - bypasses RLS. Only ever import this inside
// app/api/notify/* or app/api/translate/* route handlers to read/write rows
// (e.g. lead-capture tables, *_i18n columns) that have no policy for the
// anon/session role. Never expose this client, or a value derived from it,
// to the browser.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
