/**
 * Supabase public configuration. Only the anon key is ever used by this app;
 * admin access is granted by RLS to the logged-in user's role, never by a service key.
 *
 * `process.env.NEXT_PUBLIC_*` must be referenced literally so Next.js can inline it
 * into client bundles.
 */
export interface SupabaseEnv {
  url: string;
  anonKey: string;
}

export function getSupabaseEnv(): SupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== null;
}
