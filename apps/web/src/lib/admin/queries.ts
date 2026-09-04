import type { WmcServerClient } from "@/lib/supabase/server";
import type { CityRow, CountryRow, ProfileRow } from "@/lib/database.types";

export type Loaded<T> = { data: T; error: null } | { data: null; error: string };

/** Wraps a Supabase query so pages can render an inline error instead of crashing. */
export async function load<T>(fn: () => PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<Loaded<T>> {
  try {
    const { data, error } = await fn();
    if (error) return { data: null, error: error.message };
    return { data: data as T, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export type CityMap = Map<number, Pick<CityRow, "id" | "name" | "country_id">>;

export async function getCityMap(supabase: WmcServerClient): Promise<CityMap> {
  const { data } = await supabase.from("cities").select("id, name, country_id");
  return new Map((data ?? []).map((c) => [c.id, c]));
}

export async function getCountries(supabase: WmcServerClient): Promise<CountryRow[]> {
  const { data } = await supabase.from("countries").select("id, code, name").order("name");
  return data ?? [];
}

export type ProfileLite = Pick<ProfileRow, "id" | "first_name" | "photo_url" | "status" | "role">;
export type ProfileMap = Map<string, ProfileLite>;

export async function getProfilesByIds(supabase: WmcServerClient, ids: Iterable<string | null | undefined>): Promise<ProfileMap> {
  const unique = Array.from(new Set(Array.from(ids).filter((x): x is string => typeof x === "string" && x.length > 0)));
  if (unique.length === 0) return new Map();
  const { data } = await supabase.from("profiles").select("id, first_name, photo_url, status, role").in("id", unique);
  return new Map((data ?? []).map((p) => [p.id, p]));
}

export function cityName(map: CityMap, id: number | null | undefined): string {
  if (id == null) return "—";
  return map.get(id)?.name ?? `#${id}`;
}

export function personName(map: ProfileMap, id: string | null | undefined): string {
  if (!id) return "—";
  return map.get(id)?.first_name || "Unknown";
}
