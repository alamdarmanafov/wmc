import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { getSupabaseEnv } from "@/lib/env";

export type WmcServerClient = SupabaseClient<Database>;

/**
 * Cookie-based Supabase client for Server Components, Route Handlers and Server Actions.
 * Returns null when Supabase env vars are missing so pages can render a notice instead of crashing.
 */
export async function getServerSupabase(): Promise<WmcServerClient | null> {
  const env = getSupabaseEnv();
  if (!env) return null;
  const cookieStore = await cookies();

  return createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component: cookies are read-only here. The proxy refreshes sessions.
        }
      },
    },
  });
}
