import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

// Service-role client bypasses RLS. Import only from server-side modules
// with explicit authorization and input validation (notifications,
// translations, sales-assistant sessions). Never expose this client or
// privileged data to the browser. Customer-facing catalogue reads use RLS.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
