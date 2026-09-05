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
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!rawUrl || !anonKey) return null;
  // Accept "ref.supabase.co" or ".../rest/v1/" and normalise to the project origin.
  const withScheme = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
  try {
    return { url: new URL(withScheme).origin, anonKey };
  } catch {
    console.warn("NEXT_PUBLIC_SUPABASE_URL is not a valid URL; Supabase features are disabled.");
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== null;
}
