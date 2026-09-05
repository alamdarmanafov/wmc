import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { getSupabaseEnv } from "@/lib/env";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface WaitlistBody {
  email?: unknown;
  city?: unknown;
}

export async function POST(request: Request) {
  let body: WaitlistBody;
  try {
    body = (await request.json()) as WaitlistBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const city = typeof body.city === "string" && body.city.trim() ? body.city.trim().slice(0, 80) : null;

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ ok: false, error: "Please enter a valid email address." }, { status: 400 });
  }

  const env = getSupabaseEnv();
  if (!env) {
    console.warn("[waitlist] Supabase env vars missing; signup not stored:", email);
    return NextResponse.json({ ok: true, stored: false });
  }

  const supabase = createClient<Database>(env.url, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await supabase.from("waitlist").insert({ email, city });

  if (error) {
    // 23505 = unique_violation: already on the list — treat as success.
    if (error.code === "23505") return NextResponse.json({ ok: true, stored: true, duplicate: true });
    console.error("[waitlist] insert failed:", error.message);
    return NextResponse.json({ ok: false, error: "Something went wrong. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, stored: true });
}
