"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { getSupabaseEnv } from "@/lib/env";

export type WmcClient = SupabaseClient<Database>;

let browserClient: WmcClient | null = null;

/** Browser-side Supabase client (anon key + the user's cookie session). Returns null when env is missing. */
export function getBrowserSupabase(): WmcClient | null {
  const env = getSupabaseEnv();
  if (!env) return null;
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(env.url, env.anonKey);
  }
  return browserClient;
}
