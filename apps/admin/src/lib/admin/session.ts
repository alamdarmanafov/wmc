import type { User } from "@supabase/supabase-js";
import type { UserRole } from "@wmc/shared";
import type { ProfileRow } from "@/lib/database.types";
import { getServerSupabase, type WmcServerClient } from "@/lib/supabase/server";

export type AdminProfile = Pick<ProfileRow, "id" | "first_name" | "photo_url" | "role">;

export type AdminContext =
  | { state: "unconfigured" }
  | { state: "unauthenticated" }
  | { state: "denied"; user: User; role: UserRole | null }
  | { state: "ok"; supabase: WmcServerClient; user: User; profile: AdminProfile };

export function isStaff(role: string | null | undefined): role is "admin" | "moderator" {
  return role === "admin" || role === "moderator";
}

/** Resolves the current admin session for server components. Never throws. */
export async function getAdminContext(): Promise<AdminContext> {
  const supabase = await getServerSupabase();
  if (!supabase) return { state: "unconfigured" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { state: "unauthenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, photo_url, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !isStaff(profile.role)) {
    return { state: "denied", user, role: profile?.role ?? null };
  }
  return { state: "ok", supabase, user, profile };
}

/** For pages: returns the ok context or throws a redirect-friendly error handled by the layout. */
export async function requireAdmin(): Promise<Extract<AdminContext, { state: "ok" }> | null> {
  const ctx = await getAdminContext();
  return ctx.state === "ok" ? ctx : null;
}
