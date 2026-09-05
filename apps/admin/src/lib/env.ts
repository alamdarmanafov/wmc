/**
 * Supabase public configuration. Only the anon/publishable key is ever used by this
 * app; admin access is granted by RLS to the logged-in user's role, never by a
 * service key.
 *
 * Accepted variable names (first match wins):
 *   URL: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_URL
 *   KEY: NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_ANON_KEY,
 *        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_PUBLISHABLE_KEY,
 *        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
 * The non-prefixed names exist so hosts that refuse to store NEXT_PUBLIC_* values
 * (Vercel's "public prefix" guard) still work: the server reads them and the root
 * layout hands the two public values to the browser via `window.__WMC_ENV__`.
 *
 * `process.env.NEXT_PUBLIC_*` must be referenced literally so Next.js can inline it
 * into client bundles.
 */
export interface SupabaseEnv {
  url: string;
  anonKey: string;
}

declare global {
  interface Window {
    __WMC_ENV__?: Partial<SupabaseEnv>;
  }
}

function fromBrowser(): Partial<SupabaseEnv> {
  if (typeof window === "undefined") return {};
  return window.__WMC_ENV__ ?? {};
}

function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
  for (const v of values) {
    const t = v?.trim();
    if (t) return t;
  }
  return undefined;
}

export function normaliseSupabaseUrl(raw: string): string | null {
  // Accept "ref.supabase.co" or ".../rest/v1/" and normalise to the project origin.
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withScheme).origin;
  } catch {
    return null;
  }
}

export function getSupabaseEnv(): SupabaseEnv | null {
  const browser = fromBrowser();
  const rawUrl = firstNonEmpty(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_URL,
    browser.url,
  );
  const anonKey = firstNonEmpty(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.SUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
    browser.anonKey,
  );
  if (!rawUrl || !anonKey) return null;
  const url = normaliseSupabaseUrl(rawUrl);
  if (!url) {
    console.warn("Supabase URL is not a valid URL; Supabase features are disabled.");
    return null;
  }
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== null;
}
