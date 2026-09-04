import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

/** OAuth (Google) redirect target: exchanges the code for a session cookie, then sends the admin in. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const supabase = await getServerSupabase();

  if (code && supabase) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/admin", url.origin));
    console.error("[auth/callback]", error.message);
  }
  return NextResponse.redirect(new URL("/admin/login", url.origin));
}
