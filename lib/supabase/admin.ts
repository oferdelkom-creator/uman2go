import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

// Service-role client - bypasses RLS. Only ever import this inside
// app/api/notify/* route handlers to read rows (e.g. lead-capture tables)
// that have no SELECT policy for the anon/session role. Never expose this
// client, or a value derived from it, to the browser.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
